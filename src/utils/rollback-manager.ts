import { 
  RollbackConfig, 
  RollbackTrigger, 
  RollbackStrategy, 
  RollbackStep,
  DeploymentMetrics
} from '../types/deployment-types';

export class RollbackManager {
  private config: RollbackConfig;
  private activeTriggers: Map<string, TriggerState> = new Map();
  private rollbackHistory: Map<string, RollbackExecution> = new Map();
  private onEventCallback: (event: RollbackEvent) => void;
  private triggerTimers: Map<string, NodeJS.Timeout> = new Map();
  private isActive = false;

  constructor(
    config: RollbackConfig,
    onEvent: (event: RollbackEvent) => void
  ) {
    this.config = config;
    this.onEventCallback = onEvent;
  }

  public async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('Rollback manager disabled, skipping initialization');
      return;
    }

    console.log('Initializing Rollback Manager...');

    // Initialize triggers
    for (const trigger of this.config.triggers) {
      await this.initializeTrigger(trigger);
    }

    this.isActive = true;
    console.log(`Rollback Manager initialized with ${this.config.triggers.length} triggers`);
  }

  private async initializeTrigger(trigger: RollbackTrigger): Promise<void> {
    const triggerState: TriggerState = {
      name: trigger.name,
      type: trigger.type,
      condition: trigger.condition,
      threshold: trigger.threshold,
      duration: trigger.duration,
      enabled: trigger.enabled,
      triggered: false,
      firstViolation: null,
      violationCount: 0,
      deploymentId: null,
      lastCheck: new Date()
    };

    this.activeTriggers.set(trigger.name, triggerState);
    console.log(`Initialized rollback trigger: ${trigger.name}`);
  }

  public async setupTrigger(deploymentId: string, trigger: RollbackTrigger): Promise<void> {
    console.log(`Setting up rollback trigger for deployment ${deploymentId}: ${trigger.name}`);

    const triggerState = this.activeTriggers.get(trigger.name);
    if (triggerState) {
      triggerState.deploymentId = deploymentId;
      triggerState.enabled = trigger.enabled;
      
      // Start monitoring this trigger
      this.startTriggerMonitoring(trigger.name);
    }
  }

  private startTriggerMonitoring(triggerName: string): void {
    const trigger = this.activeTriggers.get(triggerName);
    if (!trigger) return;

    // Set up periodic check
    const checkInterval = 30000; // 30 seconds
    
    const timer = setInterval(async () => {
      await this.evaluateTrigger(triggerName);
    }, checkInterval);

    this.triggerTimers.set(triggerName, timer);
  }

  private async evaluateTrigger(triggerName: string): Promise<void> {
    const triggerState = this.activeTriggers.get(triggerName);
    if (!triggerState || !triggerState.enabled || !triggerState.deploymentId) return;

    try {
      const shouldTrigger = await this.checkTriggerCondition(triggerState);
      const now = new Date();

      if (shouldTrigger) {
        if (!triggerState.firstViolation) {
          triggerState.firstViolation = now;
          triggerState.violationCount = 1;
          console.log(`Rollback trigger violation detected: ${triggerName}`);
        } else {
          triggerState.violationCount++;
          
          // Check if violation has persisted for required duration
          const violationDuration = now.getTime() - triggerState.firstViolation.getTime();
          const requiredDuration = triggerState.duration * 60 * 1000; // minutes to ms

          if (violationDuration >= requiredDuration && !triggerState.triggered) {
            console.log(`Rollback trigger activated: ${triggerName} (violation persisted for ${violationDuration}ms)`);
            await this.activateTrigger(triggerState);
          }
        }
      } else {
        // Reset violation state if condition is no longer met
        if (triggerState.firstViolation) {
          console.log(`Rollback trigger condition resolved: ${triggerName}`);
          triggerState.firstViolation = null;
          triggerState.violationCount = 0;
        }
      }

      triggerState.lastCheck = now;

    } catch (error) {
      console.error(`Error evaluating rollback trigger ${triggerName}:`, error);
    }
  }

  private async checkTriggerCondition(triggerState: TriggerState): Promise<boolean> {
    // Get current metrics for evaluation
    const metrics = await this.getCurrentMetrics();

    switch (triggerState.type) {
      case 'metric_threshold':
        return this.evaluateMetricThreshold(triggerState, metrics);
      case 'error_rate':
        return metrics.errorRate > triggerState.threshold;
      case 'response_time':
        return metrics.responseTime > triggerState.threshold;
      case 'custom':
        return this.evaluateCustomCondition(triggerState.condition, metrics);
      default:
        console.warn(`Unknown trigger type: ${triggerState.type}`);
        return false;
    }
  }

  private evaluateMetricThreshold(triggerState: TriggerState, metrics: DeploymentMetrics): boolean {
    // Parse condition to extract metric name and comparison
    const condition = triggerState.condition;
    
    // Simple condition parsing - in practice, this would be more sophisticated
    if (condition.includes('error_rate')) {
      return metrics.errorRate > triggerState.threshold;
    } else if (condition.includes('response_time')) {
      return metrics.responseTime > triggerState.threshold;
    } else if (condition.includes('availability')) {
      return metrics.availability < triggerState.threshold;
    } else if (condition.includes('throughput')) {
      return metrics.throughput < triggerState.threshold;
    }

    return false;
  }

  private evaluateCustomCondition(condition: string, metrics: DeploymentMetrics): boolean {
    try {
      // Replace metric placeholders with actual values
      const evaluableCondition = condition
        .replace(/\$\{error_rate\}/g, metrics.errorRate.toString())
        .replace(/\$\{response_time\}/g, metrics.responseTime.toString())
        .replace(/\$\{availability\}/g, metrics.availability.toString())
        .replace(/\$\{throughput\}/g, metrics.throughput.toString());

      // Evaluate condition (simplified approach)
      return eval(evaluableCondition);
    } catch (error) {
      console.error(`Error evaluating custom condition: ${condition}`, error);
      return false;
    }
  }

  private async getCurrentMetrics(): Promise<DeploymentMetrics> {
    // This would integrate with the deployment monitor to get real metrics
    // For now, return simulated metrics
    return {
      errorRate: Math.random() * 5, // 0-5%
      responseTime: 200 + Math.random() * 1000, // 200-1200ms
      throughput: 500 + Math.random() * 1000, // 500-1500 RPS
      availability: 99 + Math.random() * 1, // 99-100%
      performance: {
        webVitals: {
          fcp: 800 + Math.random() * 1000,
          lcp: 1500 + Math.random() * 1000,
          fid: 50 + Math.random() * 100,
          cls: Math.random() * 0.2,
          ttfb: 200 + Math.random() * 600,
          inp: 100 + Math.random() * 400
        },
        resources: {
          cpu: 30 + Math.random() * 40,
          memory: 256 + Math.random() * 512,
          disk: 40 + Math.random() * 30,
          network: 10 + Math.random() * 90
        },
        mobile: {
          batteryUsage: 5 + Math.random() * 15,
          dataUsage: 1 + Math.random() * 5,
          loadTime: 1000 + Math.random() * 2000,
          crashRate: Math.random() * 1
        }
      },
      business: {
        conversionRate: 0.8 + Math.random() * 0.2,
        revenue: 1000 + Math.random() * 5000,
        userEngagement: 0.6 + Math.random() * 0.4,
        retention: 0.7 + Math.random() * 0.3
      },
      customMetrics: {}
    };
  }

  private async activateTrigger(triggerState: TriggerState): Promise<void> {
    if (!triggerState.deploymentId) return;

    triggerState.triggered = true;

    console.log(`🚨 ROLLBACK TRIGGER ACTIVATED: ${triggerState.name} for deployment ${triggerState.deploymentId}`);

    this.emitEvent({
      type: 'trigger_activated',
      deploymentId: triggerState.deploymentId,
      triggerName: triggerState.name,
      reason: triggerState.condition,
      timestamp: new Date(),
      metadata: {
        threshold: triggerState.threshold,
        violationCount: triggerState.violationCount,
        violationDuration: triggerState.firstViolation ? 
          new Date().getTime() - triggerState.firstViolation.getTime() : 0
      }
    });

    // Check if automatic rollback is enabled
    if (this.config.automation.enabled) {
      await this.executeRollback(triggerState.deploymentId, triggerState.name);
    } else {
      console.log('Automatic rollback disabled - manual intervention required');
      this.emitEvent({
        type: 'manual_intervention_required',
        deploymentId: triggerState.deploymentId,
        triggerName: triggerState.name,
        reason: 'automatic_rollback_disabled',
        timestamp: new Date(),
        metadata: { requiresApproval: this.config.automation.approvalRequired }
      });
    }
  }

  public async executeRollback(deploymentId: string, reason: string): Promise<void> {
    console.log(`🔄 EXECUTING ROLLBACK for deployment ${deploymentId}, reason: ${reason}`);

    const rollbackId = this.generateRollbackId(deploymentId);
    
    const execution: RollbackExecution = {
      rollbackId,
      deploymentId,
      reason,
      strategy: this.config.strategy.type,
      status: 'in_progress',
      startTime: new Date(),
      steps: [],
      attempts: 1,
      maxAttempts: this.config.automation.maxAttempts
    };

    this.rollbackHistory.set(rollbackId, execution);

    try {
      // Check cooldown period
      if (await this.isInCooldownPeriod(deploymentId)) {
        throw new Error('Rollback is in cooldown period');
      }

      // Execute rollback strategy
      await this.executeRollbackStrategy(execution);

      // Verify rollback success
      if (this.config.verification.enabled) {
        await this.verifyRollback(execution);
      }

      execution.status = 'completed';
      execution.endTime = new Date();

      console.log(`✅ ROLLBACK COMPLETED successfully for deployment ${deploymentId}`);

      this.emitEvent({
        type: 'rollback_completed',
        deploymentId,
        triggerName: reason,
        reason: 'rollback_successful',
        timestamp: new Date(),
        metadata: {
          rollbackId,
          duration: execution.endTime.getTime() - execution.startTime.getTime(),
          stepsExecuted: execution.steps.length
        }
      });

      // Reset triggers for this deployment
      await this.resetTriggersForDeployment(deploymentId);

    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = new Date();

      console.error(`❌ ROLLBACK FAILED for deployment ${deploymentId}:`, error);

      this.emitEvent({
        type: 'rollback_failed',
        deploymentId,
        triggerName: reason,
        reason: error.message,
        timestamp: new Date(),
        metadata: {
          rollbackId,
          attempts: execution.attempts,
          maxAttempts: execution.maxAttempts,
          error: error.message
        }
      });

      // Retry if attempts remaining
      if (execution.attempts < execution.maxAttempts) {
        console.log(`Retrying rollback for deployment ${deploymentId} (attempt ${execution.attempts + 1}/${execution.maxAttempts})`);
        execution.attempts++;
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
        await this.executeRollback(deploymentId, `${reason}_retry_${execution.attempts}`);
      } else {
        console.error(`❌ ROLLBACK EXHAUSTED all attempts for deployment ${deploymentId}`);
        
        this.emitEvent({
          type: 'rollback_exhausted',
          deploymentId,
          triggerName: reason,
          reason: 'max_attempts_reached',
          timestamp: new Date(),
          metadata: { rollbackId, maxAttempts: execution.maxAttempts }
        });
      }

      throw error;
    }
  }

  private async isInCooldownPeriod(deploymentId: string): Promise<boolean> {
    const cooldownMs = this.config.automation.cooldownPeriod * 60 * 1000;
    const now = new Date().getTime();

    // Check recent rollbacks for this deployment
    for (const execution of this.rollbackHistory.values()) {
      if (execution.deploymentId === deploymentId && execution.endTime) {
        const timeSinceRollback = now - execution.endTime.getTime();
        if (timeSinceRollback < cooldownMs) {
          return true;
        }
      }
    }

    return false;
  }

  private async executeRollbackStrategy(execution: RollbackExecution): Promise<void> {
    const strategy = this.config.strategy;

    switch (strategy.type) {
      case 'immediate':
        await this.executeImmediateRollback(execution);
        break;
      case 'gradual':
        await this.executeGradualRollback(execution);
        break;
      case 'blue_green':
        await this.executeBlueGreenRollback(execution);
        break;
      default:
        throw new Error(`Unknown rollback strategy: ${strategy.type}`);
    }
  }

  private async executeImmediateRollback(execution: RollbackExecution): Promise<void> {
    console.log('Executing immediate rollback...');

    const steps = this.config.strategy.steps;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await this.executeRollbackStep(execution, step, i);
    }
  }

  private async executeGradualRollback(execution: RollbackExecution): Promise<void> {
    console.log('Executing gradual rollback...');

    // Gradual rollback reduces traffic incrementally
    const trafficReductions = [75, 50, 25, 0]; // Percentage of traffic to new version
    
    for (const targetTraffic of trafficReductions) {
      const step: RollbackStep = {
        name: `Reduce traffic to ${targetTraffic}%`,
        action: `update_traffic_split ${targetTraffic}`,
        timeout: 30000,
        retries: 3
      };

      await this.executeRollbackStep(execution, step, trafficReductions.indexOf(targetTraffic));
      
      // Wait between traffic changes
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  private async executeBlueGreenRollback(execution: RollbackExecution): Promise<void> {
    console.log('Executing blue-green rollback...');

    const steps: RollbackStep[] = [
      {
        name: 'Switch traffic to previous version',
        action: 'switch_blue_green_traffic',
        timeout: 10000,
        retries: 2
      },
      {
        name: 'Validate traffic switch',
        action: 'validate_traffic_switch',
        timeout: 30000,
        retries: 1
      },
      {
        name: 'Decommission failed version',
        action: 'decommission_failed_version',
        timeout: 60000,
        retries: 1
      }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await this.executeRollbackStep(execution, step, i);
    }
  }

  private async executeRollbackStep(execution: RollbackExecution, step: RollbackStep, stepIndex: number): Promise<void> {
    console.log(`Executing rollback step ${stepIndex + 1}: ${step.name}`);

    const stepExecution: RollbackStepExecution = {
      stepIndex,
      name: step.name,
      action: step.action,
      status: 'in_progress',
      startTime: new Date(),
      attempts: 0,
      maxAttempts: step.retries + 1
    };

    execution.steps.push(stepExecution);

    try {
      await this.performRollbackAction(step.action, step.timeout);
      
      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      
      console.log(`✅ Rollback step completed: ${step.name}`);

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = error.message;
      stepExecution.endTime = new Date();

      console.error(`❌ Rollback step failed: ${step.name}`, error);

      // Retry step if attempts remaining
      if (stepExecution.attempts < stepExecution.maxAttempts - 1) {
        stepExecution.attempts++;
        console.log(`Retrying rollback step: ${step.name} (attempt ${stepExecution.attempts + 1}/${stepExecution.maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
        await this.executeRollbackStep(execution, step, stepIndex);
      } else {
        throw new Error(`Rollback step failed after ${stepExecution.maxAttempts} attempts: ${step.name}`);
      }
    }
  }

  private async performRollbackAction(action: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Rollback action timed out: ${action}`));
      }, timeout);

      // Simulate rollback action execution
      const actionExecutionTime = Math.random() * 5000 + 1000; // 1-6 seconds
      
      setTimeout(() => {
        clearTimeout(timer);
        
        // Simulate occasional failures
        if (Math.random() < 0.1) { // 10% failure rate
          reject(new Error(`Rollback action failed: ${action}`));
        } else {
          resolve();
        }
      }, actionExecutionTime);
    });
  }

  private async verifyRollback(execution: RollbackExecution): Promise<void> {
    console.log(`Verifying rollback for deployment ${execution.deploymentId}...`);

    const checks = this.config.verification.checks;
    
    for (const check of checks) {
      await this.performVerificationCheck(check);
    }

    console.log('Rollback verification completed successfully');
  }

  private async performVerificationCheck(check: any): Promise<void> {
    console.log(`Performing verification check: ${check.name}`);

    switch (check.type) {
      case 'health_check':
        await this.performHealthCheck(check.config);
        break;
      case 'metric_validation':
        await this.performMetricValidation(check.config);
        break;
      case 'custom':
        await this.performCustomCheck(check.config);
        break;
      default:
        throw new Error(`Unknown verification check type: ${check.type}`);
    }
  }

  private async performHealthCheck(config: any): Promise<void> {
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (Math.random() < 0.95) { // 95% success rate
      console.log('Health check passed');
    } else {
      throw new Error('Health check failed');
    }
  }

  private async performMetricValidation(config: any): Promise<void> {
    // Validate that metrics have improved after rollback
    const metrics = await this.getCurrentMetrics();
    
    // Simple validation - check if error rate is below threshold
    if (metrics.errorRate > 2) {
      throw new Error(`Metric validation failed: Error rate ${metrics.errorRate}% still above threshold`);
    }
    
    console.log('Metric validation passed');
  }

  private async performCustomCheck(config: any): Promise<void> {
    // Perform custom verification logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Custom verification check passed');
  }

  private async resetTriggersForDeployment(deploymentId: string): Promise<void> {
    for (const [triggerName, triggerState] of this.activeTriggers) {
      if (triggerState.deploymentId === deploymentId) {
        triggerState.triggered = false;
        triggerState.firstViolation = null;
        triggerState.violationCount = 0;
        triggerState.deploymentId = null;
        
        // Clear timer
        const timer = this.triggerTimers.get(triggerName);
        if (timer) {
          clearInterval(timer);
          this.triggerTimers.delete(triggerName);
        }
      }
    }

    console.log(`Reset rollback triggers for deployment ${deploymentId}`);
  }

  // Public API Methods
  public getRollbackHistory(deploymentId?: string): RollbackExecution[] {
    const executions = Array.from(this.rollbackHistory.values());
    
    if (deploymentId) {
      return executions.filter(e => e.deploymentId === deploymentId);
    }
    
    return executions;
  }

  public getTriggerStatus(): TriggerState[] {
    return Array.from(this.activeTriggers.values());
  }

  public async disableTrigger(triggerName: string): Promise<void> {
    const trigger = this.activeTriggers.get(triggerName);
    if (trigger) {
      trigger.enabled = false;
      
      const timer = this.triggerTimers.get(triggerName);
      if (timer) {
        clearInterval(timer);
        this.triggerTimers.delete(triggerName);
      }
      
      console.log(`Disabled rollback trigger: ${triggerName}`);
    }
  }

  public async enableTrigger(triggerName: string): Promise<void> {
    const trigger = this.activeTriggers.get(triggerName);
    if (trigger) {
      trigger.enabled = true;
      
      if (trigger.deploymentId) {
        this.startTriggerMonitoring(triggerName);
      }
      
      console.log(`Enabled rollback trigger: ${triggerName}`);
    }
  }

  private generateRollbackId(deploymentId: string): string {
    return `rollback_${deploymentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitEvent(event: RollbackEvent): void {
    this.onEventCallback(event);
  }

  public async cleanup(deploymentId: string): Promise<void> {
    // Reset triggers
    await this.resetTriggersForDeployment(deploymentId);
    
    // Clean up rollback history (keep for audit purposes, but mark as archived)
    for (const execution of this.rollbackHistory.values()) {
      if (execution.deploymentId === deploymentId) {
        execution.archived = true;
      }
    }

    console.log(`Cleaned up rollback manager for deployment ${deploymentId}`);
  }

  public async destroy(): Promise<void> {
    this.isActive = false;

    // Clear all timers
    for (const [triggerName, timer] of this.triggerTimers) {
      clearInterval(timer);
    }

    this.triggerTimers.clear();
    this.activeTriggers.clear();
    this.rollbackHistory.clear();

    console.log('Rollback Manager destroyed');
  }
}

// Supporting interfaces
interface TriggerState {
  name: string;
  type: string;
  condition: string;
  threshold: number;
  duration: number; // minutes
  enabled: boolean;
  triggered: boolean;
  firstViolation: Date | null;
  violationCount: number;
  deploymentId: string | null;
  lastCheck: Date;
}

interface RollbackExecution {
  rollbackId: string;
  deploymentId: string;
  reason: string;
  strategy: string;
  status: 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  steps: RollbackStepExecution[];
  attempts: number;
  maxAttempts: number;
  error?: string;
  archived?: boolean;
}

interface RollbackStepExecution {
  stepIndex: number;
  name: string;
  action: string;
  status: 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  attempts: number;
  maxAttempts: number;
  error?: string;
}

interface RollbackEvent {
  type: 'trigger_activated' | 'rollback_completed' | 'rollback_failed' | 'rollback_exhausted' | 'manual_intervention_required';
  deploymentId: string;
  triggerName: string;
  reason: string;
  timestamp: Date;
  metadata: any;
}

export default RollbackManager;