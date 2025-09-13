import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import {
  WorkflowState,
  WorkflowStep,
  WorkflowStatus,
  WorkflowMetrics,
  ProgressReport,
  ProgressConfig,
  ProgressVisualization,
  RealtimeUpdate,
  ProgressNotification,
  ProgressThreshold
} from '../types/workflow-orchestrator-types';

interface ProgressBar {
  current: number;
  total: number;
  width: number;
  showPercentage: boolean;
  showTime: boolean;
}

export class ProgressTracker extends EventEmitter {
  private config: ProgressConfig;
  private state: WorkflowState | null = null;
  private startTime: Date = new Date();
  private lastUpdateTime: Date = new Date();
  private spinner: Ora;
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map();
  private notifications: ProgressNotification[] = [];
  private thresholds: ProgressThreshold[] = [];

  constructor(config: ProgressConfig) {
    super();
    this.config = config;
    this.spinner = ora({
      text: 'Initializing workflow...',
      spinner: 'dots',
      color: 'cyan'
    });
    this.setupDefaultThresholds();
  }

  startTracking(workflowState: WorkflowState): void {
    this.state = workflowState;
    this.startTime = new Date();
    this.lastUpdateTime = new Date();
    
    if (this.config.enableSpinner) {
      this.spinner.start('Starting workflow tracking...');
    }
    
    if (this.config.enableRealtimeUpdates) {
      this.startRealtimeUpdates();
    }
    
    this.emit('tracking:started', { workflowId: workflowState.id });
  }

  stopTracking(): void {
    if (this.config.enableSpinner) {
      this.spinner.stop();
    }
    
    // Clear all intervals
    for (const interval of this.progressIntervals.values()) {
      clearInterval(interval);
    }
    this.progressIntervals.clear();
    
    this.emit('tracking:stopped');
  }

  updateWorkflowState(newState: WorkflowState): void {
    const previousState = this.state;
    this.state = newState;
    this.lastUpdateTime = new Date();
    
    if (this.config.enableSpinner) {
      this.updateSpinner();
    }
    
    // Check thresholds
    this.checkThresholds(previousState, newState);
    
    // Generate realtime update
    if (this.config.enableRealtimeUpdates) {
      this.emitRealtimeUpdate();
    }
    
    this.emit('state:updated', { previous: previousState, current: newState });
  }

  updateStepProgress(stepId: string, progress: Partial<WorkflowStep>): void {
    if (!this.state) return;
    
    const stepIndex = this.state.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;
    
    const step = this.state.steps[stepIndex];
    const previousStep = { ...step };
    Object.assign(step, progress);
    
    this.lastUpdateTime = new Date();
    
    if (this.config.enableSpinner) {
      this.updateSpinnerForStep(step);
    }
    
    this.emit('step:updated', { stepId, previous: previousStep, current: step });
  }

  generateProgressReport(): ProgressReport {
    if (!this.state) {
      throw new Error('No workflow state available for progress report');
    }
    
    const now = new Date();
    const duration = now.getTime() - this.startTime.getTime();
    const timeSinceLastUpdate = now.getTime() - this.lastUpdateTime.getTime();
    
    const completedSteps = this.state.steps.filter(step => step.status === WorkflowStatus.COMPLETED);
    const failedSteps = this.state.steps.filter(step => step.status === WorkflowStatus.FAILED);
    const inProgressSteps = this.state.steps.filter(step => step.status === WorkflowStatus.RUNNING);
    
    const overallProgress = (completedSteps.length / this.state.totalSteps) * 100;
    const estimatedTimeRemaining = this.estimateRemainingTime();
    
    return {
      workflowId: this.state.id,
      timestamp: now,
      overallProgress,
      currentStep: this.state.currentStep + 1,
      totalSteps: this.state.totalSteps,
      completedSteps: completedSteps.length,
      failedSteps: failedSteps.length,
      inProgressSteps: inProgressSteps.length,
      duration,
      timeSinceLastUpdate,
      estimatedTimeRemaining,
      stepDetails: this.state.steps.map(step => ({
        id: step.id,
        name: step.name,
        status: step.status,
        progress: this.calculateStepProgress(step),
        duration: step.duration,
        error: step.error?.message
      })),
      metrics: this.state.metrics,
      health: this.calculateWorkflowHealth(),
      efficiency: this.calculateEfficiencyMetrics()
    };
  }

  generateVisualization(type: 'console' | 'json' | 'html' = 'console'): ProgressVisualization {
    const report = this.generateProgressReport();
    
    switch (type) {
      case 'console':
        return this.generateConsoleVisualization(report);
      case 'json':
        return this.generateJsonVisualization(report);
      case 'html':
        return this.generateHtmlVisualization(report);
      default:
        throw new Error(`Unsupported visualization type: ${type}`);
    }
  }

  displayProgress(): void {
    if (!this.config.enableConsoleOutput) return;
    
    const visualization = this.generateVisualization('console');
    console.clear();
    console.log(visualization.content);
  }

  addProgressThreshold(threshold: ProgressThreshold): void {
    this.thresholds.push(threshold);
    this.emit('threshold:added', threshold);
  }

  removeProgressThreshold(thresholdId: string): void {
    const index = this.thresholds.findIndex(t => t.id === thresholdId);
    if (index !== -1) {
      const removed = this.thresholds.splice(index, 1)[0];
      this.emit('threshold:removed', removed);
    }
  }

  getNotifications(): ProgressNotification[] {
    return [...this.notifications];
  }

  clearNotifications(): void {
    this.notifications = [];
    this.emit('notifications:cleared');
  }

  async saveProgressReport(filePath?: string): Promise<string> {
    const report = this.generateProgressReport();
    const savePath = filePath || join(process.cwd(), 'reports', `progress-${Date.now()}.json`);
    
    await fs.mkdir(join(savePath, '..'), { recursive: true });
    await fs.writeFile(savePath, JSON.stringify(report, null, 2));
    
    this.emit('report:saved', { path: savePath, report });
    return savePath;
  }

  private setupDefaultThresholds(): void {
    this.addProgressThreshold({
      id: 'halfway_complete',
      description: '50% workflow completion',
      condition: (report) => report.overallProgress >= 50,
      priority: 'MEDIUM',
      action: 'notify'
    });
    
    this.addProgressThreshold({
      id: 'near_complete',
      description: '90% workflow completion',
      condition: (report) => report.overallProgress >= 90,
      priority: 'HIGH',
      action: 'notify'
    });
    
    this.addProgressThreshold({
      id: 'step_timeout',
      description: 'Step execution timeout',
      condition: (report) => {
        return report.stepDetails.some(step => 
          step.status === 'RUNNING' && 
          step.duration && 
          step.duration > 300000 // 5 minutes
        );
      },
      priority: 'HIGH',
      action: 'alert'
    });
    
    this.addProgressThreshold({
      id: 'high_error_rate',
      description: 'High error rate detected',
      condition: (report) => report.failedSteps > report.totalSteps * 0.2,
      priority: 'CRITICAL',
      action: 'alert'
    });
  }

  private startRealtimeUpdates(): void {
    const interval = setInterval(() => {
      if (this.state) {
        this.emitRealtimeUpdate();
        
        if (this.config.enableConsoleOutput) {
          this.displayProgress();
        }
      }
    }, this.config.updateInterval || 1000);
    
    this.progressIntervals.set('realtime', interval);
  }

  private updateSpinner(): void {
    if (!this.state) return;
    
    const currentStep = this.getCurrentStep();
    if (currentStep) {
      const progress = this.calculateStepProgress(currentStep);
      const message = `${currentStep.name} (${progress.toFixed(1)}%)`;
      this.spinner.text = message;
      
      if (currentStep.status === WorkflowStatus.COMPLETED) {
        this.spinner.succeed(message);
        this.advanceToNextStep();
      } else if (currentStep.status === WorkflowStatus.FAILED) {
        this.spinner.fail(`${message} - Failed`);
      }
    }
  }

  private updateSpinnerForStep(step: WorkflowStep): void {
    if (step.status === WorkflowStatus.RUNNING) {
      const progress = this.calculateStepProgress(step);
      this.spinner.text = `${step.name} (${progress.toFixed(1)}%)`;
    } else if (step.status === WorkflowStatus.COMPLETED) {
      this.spinner.succeed(`${step.name} - Completed`);
    } else if (step.status === WorkflowStatus.FAILED) {
      this.spinner.fail(`${step.name} - Failed: ${step.error?.message || 'Unknown error'}`);
    }
  }

  private advanceToNextStep(): void {
    if (!this.state) return;
    
    const nextStep = this.state.steps[this.state.currentStep + 1];
    if (nextStep && nextStep.status === WorkflowStatus.RUNNING) {
      this.spinner.start(`${nextStep.name} - Starting...`);
    }
  }

  private getCurrentStep(): WorkflowStep | undefined {
    if (!this.state || this.state.currentStep >= this.state.steps.length) {
      return undefined;
    }
    return this.state.steps[this.state.currentStep];
  }

  private calculateStepProgress(step: WorkflowStep): number {
    if (step.status === WorkflowStatus.COMPLETED) return 100;
    if (step.status === WorkflowStatus.FAILED) return 0;
    if (step.status === WorkflowStatus.PENDING) return 0;
    if (step.status === WorkflowStatus.RUNNING) {
      // Estimate progress based on duration if available
      if (step.duration && step.timeout) {
        return Math.min((step.duration / step.timeout) * 100, 95);
      }
      return 50; // Default to 50% for running steps
    }
    return 0;
  }

  private estimateRemainingTime(): number {
    if (!this.state) return 0;
    
    const completedSteps = this.state.steps.filter(step => step.status === WorkflowStatus.COMPLETED);
    const remainingSteps = this.state.totalSteps - completedSteps.length;
    
    if (completedSteps.length === 0) {
      // No completed steps, use default estimates
      return remainingSteps * 60000; // 1 minute per step
    }
    
    const averageStepTime = completedSteps.reduce((sum, step) => {
      return sum + (step.duration || 0);
    }, 0) / completedSteps.length;
    
    return remainingSteps * averageStepTime;
  }

  private calculateWorkflowHealth(): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    if (!this.state) return 'CRITICAL';
    
    const failedSteps = this.state.steps.filter(step => step.status === WorkflowStatus.FAILED);
    const errorRate = failedSteps.length / this.state.totalSteps;
    
    if (errorRate > 0.3) return 'CRITICAL';
    if (errorRate > 0.1 || this.state.errors.length > 5) return 'WARNING';
    return 'HEALTHY';
  }

  private calculateEfficiencyMetrics(): {
    processingEfficiency: number;
    timeEfficiency: number;
    resourceEfficiency: number;
  } {
    if (!this.state) {
      return { processingEfficiency: 0, timeEfficiency: 0, resourceEfficiency: 0 };
    }
    
    const totalTime = Date.now() - this.startTime.getTime();
    const processingTime = this.state.steps.reduce((sum, step) => {
      return sum + (step.duration || 0);
    }, 0);
    
    const processingEfficiency = totalTime > 0 ? (processingTime / totalTime) * 100 : 0;
    const timeEfficiency = this.calculateTimeEfficiency();
    const resourceEfficiency = this.calculateResourceEfficiency();
    
    return {
      processingEfficiency,
      timeEfficiency,
      resourceEfficiency
    };
  }

  private calculateTimeEfficiency(): number {
    if (!this.state) return 0;
    
    const estimatedTime = this.state.steps.reduce((sum, step) => {
      return sum + (step.timeout || 60000);
    }, 0);
    
    const actualTime = Date.now() - this.startTime.getTime();
    return estimatedTime > 0 ? Math.max(0, 100 - ((actualTime / estimatedTime) * 100)) : 0;
  }

  private calculateResourceEfficiency(): number {
    if (!this.state || !this.state.metrics.resourceUsage) return 0;
    
    const memoryUsage = this.state.metrics.resourceUsage.memoryUsed;
    const maxMemory = process.memoryUsage().heapTotal;
    
    return maxMemory > 0 ? Math.max(0, 100 - ((memoryUsage / maxMemory) * 100)) : 100;
  }

  private emitRealtimeUpdate(): void {
    if (!this.state) return;
    
    const update: RealtimeUpdate = {
      timestamp: new Date(),
      workflowId: this.state.id,
      status: this.state.status,
      progress: (this.state.steps.filter(s => s.status === WorkflowStatus.COMPLETED).length / this.state.totalSteps) * 100,
      currentStepName: this.getCurrentStep()?.name || 'Unknown',
      estimatedTimeRemaining: this.estimateRemainingTime(),
      health: this.calculateWorkflowHealth()
    };
    
    this.emit('realtime:update', update);
  }

  private checkThresholds(previousState: WorkflowState | null, currentState: WorkflowState): void {
    const currentReport = this.generateProgressReport();
    
    for (const threshold of this.thresholds) {
      if (threshold.condition(currentReport) && !threshold.triggered) {
        threshold.triggered = true;
        threshold.triggeredAt = new Date();
        
        const notification: ProgressNotification = {
          id: `notif_${Date.now()}`,
          timestamp: new Date(),
          type: threshold.action === 'alert' ? 'ALERT' : 'INFO',
          title: threshold.description,
          message: `Threshold condition met: ${threshold.description}`,
          priority: threshold.priority,
          workflowId: currentState.id,
          data: { threshold, report: currentReport }
        };
        
        this.notifications.push(notification);
        this.emit('threshold:triggered', { threshold, notification });
        
        if (threshold.action === 'alert') {
          this.emit('alert', notification);
        }
      }
    }
  }

  private generateConsoleVisualization(report: ProgressReport): ProgressVisualization {
    const lines: string[] = [];
    
    // Header
    lines.push(chalk.cyan.bold('🚀 Clear Piggy Mobile Optimization Workflow'));
    lines.push(chalk.gray('─'.repeat(60)));
    
    // Overall Progress
    const progressBar = this.createProgressBar(report.overallProgress, 100);
    lines.push(`${chalk.bold('Overall Progress:')} ${progressBar} ${report.overallProgress.toFixed(1)}%`);
    lines.push(`${chalk.bold('Step:')} ${report.currentStep}/${report.totalSteps}`);
    
    // Time Information
    const duration = this.formatDuration(report.duration);
    const remaining = this.formatDuration(report.estimatedTimeRemaining);
    lines.push(`${chalk.bold('Duration:')} ${duration} | ${chalk.bold('Est. Remaining:')} ${remaining}`);
    
    // Health Status
    const healthColor = report.health === 'HEALTHY' ? chalk.green : 
                       report.health === 'WARNING' ? chalk.yellow : chalk.red;
    lines.push(`${chalk.bold('Health:')} ${healthColor(report.health)}`);
    
    lines.push(chalk.gray('─'.repeat(60)));
    
    // Steps
    lines.push(chalk.bold('Steps:'));
    for (const step of report.stepDetails) {
      const status = this.getStepStatusIcon(step.status);
      const progress = step.progress > 0 ? ` (${step.progress.toFixed(1)}%)` : '';
      const duration = step.duration ? ` - ${this.formatDuration(step.duration)}` : '';
      const error = step.error ? chalk.red(` - ${step.error}`) : '';
      
      lines.push(`  ${status} ${step.name}${progress}${duration}${error}`);
    }
    
    // Metrics
    if (report.metrics) {
      lines.push(chalk.gray('─'.repeat(60)));
      lines.push(chalk.bold('Metrics:'));
      lines.push(`  Components Processed: ${report.metrics.componentsProcessed}`);
      lines.push(`  Optimizations Applied: ${report.metrics.optimizationsApplied}`);
      lines.push(`  Tests Executed: ${report.metrics.testsExecuted}`);
      lines.push(`  Errors Encountered: ${report.metrics.errorsEncountered}`);
    }
    
    return {
      type: 'console',
      content: lines.join('\n'),
      metadata: { report }
    };
  }

  private generateJsonVisualization(report: ProgressReport): ProgressVisualization {
    return {
      type: 'json',
      content: JSON.stringify(report, null, 2),
      metadata: { report }
    };
  }

  private generateHtmlVisualization(report: ProgressReport): ProgressVisualization {
    const html = `
      <div class="workflow-progress">
        <h2>Clear Piggy Mobile Optimization Workflow</h2>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${report.overallProgress}%"></div>
        </div>
        <p>Progress: ${report.overallProgress.toFixed(1)}% (${report.currentStep}/${report.totalSteps})</p>
        <p>Duration: ${this.formatDuration(report.duration)} | Remaining: ${this.formatDuration(report.estimatedTimeRemaining)}</p>
        <div class="steps">
          ${report.stepDetails.map(step => `
            <div class="step step-${step.status.toLowerCase()}">
              <span class="step-name">${step.name}</span>
              <span class="step-progress">${step.progress.toFixed(1)}%</span>
              ${step.error ? `<span class="step-error">${step.error}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    return {
      type: 'html',
      content: html,
      metadata: { report }
    };
  }

  private createProgressBar(current: number, total: number, width: number = 30): string {
    const percentage = Math.min(current / total, 1);
    const filled = Math.floor(width * percentage);
    const empty = width - filled;
    
    return `[${chalk.green('█'.repeat(filled))}${chalk.gray('░'.repeat(empty))}]`;
  }

  private getStepStatusIcon(status: WorkflowStatus): string {
    switch (status) {
      case WorkflowStatus.COMPLETED:
        return chalk.green('✓');
      case WorkflowStatus.RUNNING:
        return chalk.yellow('◐');
      case WorkflowStatus.FAILED:
        return chalk.red('✗');
      case WorkflowStatus.PENDING:
        return chalk.gray('○');
      default:
        return chalk.gray('?');
    }
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}