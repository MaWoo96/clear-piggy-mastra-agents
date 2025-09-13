import { EventEmitter } from 'events';
import {
  WorkflowError,
  ErrorSeverity,
  WorkflowStep,
  RetryStrategy,
  ErrorRecoveryConfig,
  RecoveryAction,
  ErrorPattern,
  RecoveryPlan,
  CircuitBreakerState,
  HealthCheck
} from '../types/workflow-orchestrator-types';

export class ErrorRecoverySystem extends EventEmitter {
  private config: ErrorRecoveryConfig;
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private recoveryPlans: Map<string, RecoveryPlan> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private retryHistory: Map<string, number[]> = new Map();

  constructor(config: ErrorRecoveryConfig) {
    super();
    this.config = config;
    this.initializeErrorPatterns();
    this.setupHealthChecks();
  }

  async handleError(
    error: WorkflowError,
    step: WorkflowStep
  ): Promise<{ canRecover: boolean; actions: RecoveryAction[] }> {
    this.emit('error:received', { error, step });

    // Check if error is recoverable
    const pattern = this.matchErrorPattern(error);
    if (!pattern || pattern.severity === ErrorSeverity.CRITICAL) {
      return { canRecover: false, actions: [] };
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(step.id)) {
      this.emit('circuit:breaker:open', { stepId: step.id, error });
      return { canRecover: false, actions: [] };
    }

    // Generate recovery plan
    const recoveryPlan = await this.generateRecoveryPlan(error, step, pattern);
    
    // Execute recovery actions
    const success = await this.executeRecoveryPlan(recoveryPlan);
    
    if (success) {
      this.resetCircuitBreaker(step.id);
      return { canRecover: true, actions: recoveryPlan.actions };
    } else {
      this.updateCircuitBreaker(step.id, error);
      return { canRecover: false, actions: recoveryPlan.actions };
    }
  }

  async shouldRetry(
    error: WorkflowError,
    step: WorkflowStep,
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF
  ): Promise<{ shouldRetry: boolean; delayMs: number }> {
    
    // Check max retries
    if (step.retryCount >= step.maxRetries) {
      return { shouldRetry: false, delayMs: 0 };
    }

    // Check if error type is retryable
    const pattern = this.matchErrorPattern(error);
    if (!pattern?.retryable) {
      return { shouldRetry: false, delayMs: 0 };
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(step.id)) {
      return { shouldRetry: false, delayMs: 0 };
    }

    // Calculate delay based on strategy
    const delayMs = this.calculateRetryDelay(
      step.retryCount + 1,
      strategy,
      error,
      step
    );

    // Update retry history
    this.recordRetryAttempt(step.id);

    return { shouldRetry: true, delayMs };
  }

  registerErrorPattern(pattern: ErrorPattern): void {
    this.errorPatterns.set(pattern.id, pattern);
    this.emit('pattern:registered', pattern);
  }

  registerRecoveryPlan(plan: RecoveryPlan): void {
    this.recoveryPlans.set(plan.id, plan);
    this.emit('plan:registered', plan);
  }

  addHealthCheck(stepId: string, healthCheck: HealthCheck): void {
    this.healthChecks.set(stepId, healthCheck);
    this.emit('health:check:added', { stepId, healthCheck });
  }

  async runHealthCheck(stepId: string): Promise<{ healthy: boolean; details?: any }> {
    const healthCheck = this.healthChecks.get(stepId);
    if (!healthCheck) {
      return { healthy: true };
    }

    try {
      const result = await healthCheck.check();
      this.emit('health:check:completed', { stepId, result });
      return result;
    } catch (error) {
      this.emit('health:check:failed', { stepId, error });
      return { healthy: false, details: { error: (error as Error).message } };
    }
  }

  async runAllHealthChecks(): Promise<Map<string, { healthy: boolean; details?: any }>> {
    const results = new Map();
    
    for (const [stepId] of this.healthChecks) {
      const result = await this.runHealthCheck(stepId);
      results.set(stepId, result);
    }
    
    return results;
  }

  getCircuitBreakerState(stepId: string): CircuitBreakerState {
    return this.circuitBreakers.get(stepId) || {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: undefined,
      halfOpenRetries: 0
    };
  }

  resetAllCircuitBreakers(): void {
    for (const stepId of this.circuitBreakers.keys()) {
      this.resetCircuitBreaker(stepId);
    }
  }

  getRetryHistory(stepId: string): number[] {
    return this.retryHistory.get(stepId) || [];
  }

  clearRetryHistory(stepId?: string): void {
    if (stepId) {
      this.retryHistory.delete(stepId);
    } else {
      this.retryHistory.clear();
    }
  }

  getRecoveryStatistics(): {
    totalErrors: number;
    recoveredErrors: number;
    failedRecoveries: number;
    circuitBreakersOpen: number;
    averageRecoveryTime: number;
  } {
    const circuitBreakersOpen = Array.from(this.circuitBreakers.values())
      .filter(cb => cb.state === 'OPEN').length;

    // This would typically track more detailed statistics
    return {
      totalErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      circuitBreakersOpen,
      averageRecoveryTime: 0
    };
  }

  private initializeErrorPatterns(): void {
    // Network-related errors
    this.registerErrorPattern({
      id: 'network_timeout',
      name: 'Network Timeout',
      pattern: /timeout|ETIMEDOUT|ECONNRESET/i,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      maxRetries: 3,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      recoveryActions: ['wait', 'retry', 'fallback']
    });

    // File system errors
    this.registerErrorPattern({
      id: 'file_not_found',
      name: 'File Not Found',
      pattern: /ENOENT|file not found|no such file/i,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      maxRetries: 0,
      recoveryActions: ['create_missing_file', 'use_fallback']
    });

    // Memory errors
    this.registerErrorPattern({
      id: 'out_of_memory',
      name: 'Out of Memory',
      pattern: /out of memory|heap|ENOMEM/i,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      maxRetries: 2,
      retryStrategy: RetryStrategy.LINEAR_BACKOFF,
      recoveryActions: ['cleanup_memory', 'reduce_batch_size', 'restart']
    });

    // Permission errors
    this.registerErrorPattern({
      id: 'permission_denied',
      name: 'Permission Denied',
      pattern: /EACCES|permission denied|access denied/i,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      maxRetries: 0,
      recoveryActions: ['fix_permissions', 'use_alternative_path']
    });

    // Resource busy errors
    this.registerErrorPattern({
      id: 'resource_busy',
      name: 'Resource Busy',
      pattern: /EBUSY|resource busy|locked/i,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      maxRetries: 5,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      recoveryActions: ['wait', 'retry']
    });
  }

  private setupHealthChecks(): void {
    // Default health checks could be added here
  }

  private matchErrorPattern(error: WorkflowError): ErrorPattern | undefined {
    for (const pattern of this.errorPatterns.values()) {
      if (pattern.pattern.test(error.message)) {
        return pattern;
      }
    }
    return undefined;
  }

  private async generateRecoveryPlan(
    error: WorkflowError,
    step: WorkflowStep,
    pattern: ErrorPattern
  ): Promise<RecoveryPlan> {
    const planId = `plan_${step.id}_${Date.now()}`;
    
    // Check if we have a pre-defined plan
    const existingPlan = Array.from(this.recoveryPlans.values())
      .find(plan => plan.errorPatternId === pattern.id);
    
    if (existingPlan) {
      return existingPlan;
    }

    // Generate dynamic recovery plan
    const actions: RecoveryAction[] = [];
    
    for (const actionType of pattern.recoveryActions) {
      switch (actionType) {
        case 'wait':
          actions.push({
            type: 'wait',
            parameters: { duration: this.calculateWaitTime(error, step) },
            timeout: 30000,
            retryable: false
          });
          break;
          
        case 'retry':
          actions.push({
            type: 'retry',
            parameters: { 
              strategy: pattern.retryStrategy || RetryStrategy.EXPONENTIAL_BACKOFF,
              maxAttempts: pattern.maxRetries || 3
            },
            timeout: step.timeout || 60000,
            retryable: false
          });
          break;
          
        case 'restart':
          actions.push({
            type: 'restart',
            parameters: { stepId: step.id },
            timeout: 120000,
            retryable: true
          });
          break;
          
        case 'cleanup_memory':
          actions.push({
            type: 'cleanup',
            parameters: { target: 'memory' },
            timeout: 30000,
            retryable: true
          });
          break;
          
        case 'fallback':
          actions.push({
            type: 'fallback',
            parameters: { strategy: 'alternative_implementation' },
            timeout: step.timeout || 60000,
            retryable: true
          });
          break;
      }
    }

    const plan: RecoveryPlan = {
      id: planId,
      name: `Recovery plan for ${pattern.name}`,
      errorPatternId: pattern.id,
      actions,
      priority: this.calculatePlanPriority(pattern, step),
      timeout: actions.reduce((sum, action) => sum + action.timeout, 0)
    };

    this.recoveryPlans.set(planId, plan);
    return plan;
  }

  private async executeRecoveryPlan(plan: RecoveryPlan): Promise<boolean> {
    this.emit('recovery:plan:started', plan);
    
    try {
      for (const action of plan.actions) {
        const success = await this.executeRecoveryAction(action);
        if (!success && !action.retryable) {
          this.emit('recovery:plan:failed', { plan, action });
          return false;
        }
      }
      
      this.emit('recovery:plan:completed', plan);
      return true;
    } catch (error) {
      this.emit('recovery:plan:error', { plan, error });
      return false;
    }
  }

  private async executeRecoveryAction(action: RecoveryAction): Promise<boolean> {
    this.emit('recovery:action:started', action);
    
    try {
      switch (action.type) {
        case 'wait':
          await this.wait(action.parameters.duration);
          break;
          
        case 'retry':
          // Retry logic would be handled by the caller
          break;
          
        case 'restart':
          await this.restartStep(action.parameters.stepId);
          break;
          
        case 'cleanup':
          await this.performCleanup(action.parameters.target);
          break;
          
        case 'fallback':
          await this.executeFallback(action.parameters.strategy);
          break;
          
        default:
          throw new Error(`Unknown recovery action type: ${action.type}`);
      }
      
      this.emit('recovery:action:completed', action);
      return true;
    } catch (error) {
      this.emit('recovery:action:failed', { action, error });
      return false;
    }
  }

  private calculateRetryDelay(
    attempt: number,
    strategy: RetryStrategy,
    error: WorkflowError,
    step: WorkflowStep
  ): number {
    const baseDelay = this.config.baseRetryDelay;
    const maxDelay = this.config.maxRetryDelay;
    
    switch (strategy) {
      case RetryStrategy.IMMEDIATE:
        return 0;
        
      case RetryStrategy.FIXED_DELAY:
        return Math.min(baseDelay, maxDelay);
        
      case RetryStrategy.LINEAR_BACKOFF:
        return Math.min(baseDelay * attempt, maxDelay);
        
      case RetryStrategy.EXPONENTIAL_BACKOFF:
        return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
      case RetryStrategy.RANDOM_JITTER:
        const exponential = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * exponential * 0.1;
        return Math.min(exponential + jitter, maxDelay);
        
      default:
        return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    }
  }

  private calculateWaitTime(error: WorkflowError, step: WorkflowStep): number {
    // Base wait time with some intelligence based on error type
    const pattern = this.matchErrorPattern(error);
    if (pattern?.id === 'network_timeout') {
      return 5000; // Wait 5 seconds for network issues
    }
    if (pattern?.id === 'resource_busy') {
      return 2000; // Wait 2 seconds for busy resources
    }
    return 1000; // Default 1 second
  }

  private calculatePlanPriority(pattern: ErrorPattern, step: WorkflowStep): number {
    let priority = 50; // Base priority
    
    // Adjust based on error severity
    switch (pattern.severity) {
      case ErrorSeverity.LOW:
        priority += 10;
        break;
      case ErrorSeverity.MEDIUM:
        priority += 20;
        break;
      case ErrorSeverity.HIGH:
        priority += 40;
        break;
      case ErrorSeverity.CRITICAL:
        priority += 60;
        break;
    }
    
    // Adjust based on step retry count
    priority += step.retryCount * 5;
    
    return Math.min(priority, 100);
  }

  private isCircuitBreakerOpen(stepId: string): boolean {
    const breaker = this.circuitBreakers.get(stepId);
    if (!breaker) {
      return false;
    }
    
    if (breaker.state === 'OPEN') {
      // Check if enough time has passed to try half-open
      if (breaker.lastFailureTime && 
          Date.now() - breaker.lastFailureTime.getTime() > this.config.circuitBreakerTimeout) {
        breaker.state = 'HALF_OPEN';
        breaker.halfOpenRetries = 0;
      }
      return breaker.state === 'OPEN';
    }
    
    return false;
  }

  private updateCircuitBreaker(stepId: string, error: WorkflowError): void {
    let breaker = this.circuitBreakers.get(stepId);
    if (!breaker) {
      breaker = {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: undefined,
        halfOpenRetries: 0
      };
      this.circuitBreakers.set(stepId, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();
    
    if (breaker.state === 'HALF_OPEN') {
      breaker.halfOpenRetries++;
      if (breaker.halfOpenRetries >= this.config.circuitBreakerThreshold) {
        breaker.state = 'OPEN';
      }
    } else if (breaker.failureCount >= this.config.circuitBreakerThreshold) {
      breaker.state = 'OPEN';
    }

    this.emit('circuit:breaker:updated', { stepId, breaker, error });
  }

  private resetCircuitBreaker(stepId: string): void {
    const breaker = this.circuitBreakers.get(stepId);
    if (breaker) {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.lastFailureTime = undefined;
      breaker.halfOpenRetries = 0;
      this.emit('circuit:breaker:reset', { stepId, breaker });
    }
  }

  private recordRetryAttempt(stepId: string): void {
    const history = this.retryHistory.get(stepId) || [];
    history.push(Date.now());
    
    // Keep only recent attempts (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAttempts = history.filter(timestamp => timestamp > oneHourAgo);
    this.retryHistory.set(stepId, recentAttempts);
  }

  // Recovery action implementations
  private async wait(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private async restartStep(stepId: string): Promise<void> {
    // Implementation would restart the specific step
    this.emit('step:restart:requested', stepId);
  }

  private async performCleanup(target: string): Promise<void> {
    switch (target) {
      case 'memory':
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        break;
      case 'temp_files':
        // Clean up temporary files
        break;
      default:
        throw new Error(`Unknown cleanup target: ${target}`);
    }
  }

  private async executeFallback(strategy: string): Promise<void> {
    switch (strategy) {
      case 'alternative_implementation':
        // Switch to alternative implementation
        break;
      case 'reduced_functionality':
        // Continue with reduced functionality
        break;
      default:
        throw new Error(`Unknown fallback strategy: ${strategy}`);
    }
  }
}