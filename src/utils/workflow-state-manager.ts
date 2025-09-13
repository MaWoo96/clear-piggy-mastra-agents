import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import {
  WorkflowState,
  WorkflowStatus,
  WorkflowStep,
  WorkflowContext,
  WorkflowMetrics,
  WorkflowError,
  BackupInfo,
  StateSnapshot,
  StateQuery,
  StatePersistenceConfig
} from '../types/workflow-orchestrator-types';

export class WorkflowStateManager extends EventEmitter {
  private state: WorkflowState;
  private snapshots: Map<string, StateSnapshot> = new Map();
  private persistenceConfig: StatePersistenceConfig;
  private autoSaveInterval?: NodeJS.Timeout;
  private isDirty = false;

  constructor(
    initialState: WorkflowState,
    persistenceConfig: StatePersistenceConfig = {
      enabled: true,
      autoSave: true,
      autoSaveInterval: 30000,
      maxSnapshots: 10,
      compressionEnabled: false
    }
  ) {
    super();
    this.state = this.deepClone(initialState);
    this.persistenceConfig = persistenceConfig;
    this.setupAutoSave();
  }

  // State Access Methods
  getState(): WorkflowState {
    return this.deepClone(this.state);
  }

  getStatus(): WorkflowStatus {
    return this.state.status;
  }

  getCurrentStep(): WorkflowStep | undefined {
    return this.state.steps[this.state.currentStep];
  }

  getStep(stepId: string): WorkflowStep | undefined {
    return this.state.steps.find(step => step.id === stepId);
  }

  getSteps(): WorkflowStep[] {
    return this.deepClone(this.state.steps);
  }

  getMetrics(): WorkflowMetrics {
    return this.deepClone(this.state.metrics);
  }

  getContext(): WorkflowContext {
    return this.deepClone(this.state.context);
  }

  getErrors(): WorkflowError[] {
    return this.deepClone(this.state.errors);
  }

  getBackups(): BackupInfo[] {
    return this.deepClone(this.state.backups);
  }

  // State Modification Methods
  updateStatus(status: WorkflowStatus): void {
    const previousStatus = this.state.status;
    this.state.status = status;
    this.markDirty();
    this.emit('status:changed', { from: previousStatus, to: status });

    if (status === WorkflowStatus.RUNNING && !this.state.startTime) {
      this.state.startTime = new Date();
    } else if (
      (status === WorkflowStatus.COMPLETED || status === WorkflowStatus.FAILED) &&
      !this.state.endTime
    ) {
      this.state.endTime = new Date();
      this.state.duration = this.state.endTime.getTime() - this.state.startTime.getTime();
    }
  }

  updateCurrentStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.state.steps.length) {
      throw new Error(`Invalid step index: ${stepIndex}`);
    }

    const previousStep = this.state.currentStep;
    this.state.currentStep = stepIndex;
    this.markDirty();
    this.emit('step:changed', { from: previousStep, to: stepIndex });
  }

  updateStep(stepId: string, updates: Partial<WorkflowStep>): void {
    const stepIndex = this.state.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step not found: ${stepId}`);
    }

    const step = this.state.steps[stepIndex];
    const previousState = this.deepClone(step);
    
    Object.assign(step, updates);
    this.markDirty();
    this.emit('step:updated', { stepId, previous: previousState, current: step });

    // Update step timing
    if (updates.status === WorkflowStatus.RUNNING && !step.startTime) {
      step.startTime = new Date();
    } else if (
      (updates.status === WorkflowStatus.COMPLETED || updates.status === WorkflowStatus.FAILED) &&
      !step.endTime
    ) {
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
    }
  }

  addError(error: WorkflowError): void {
    this.state.errors.push(error);
    this.state.metrics.errorsEncountered++;
    this.markDirty();
    this.emit('error:added', error);
  }

  addBackup(backup: BackupInfo): void {
    this.state.backups.push(backup);
    this.markDirty();
    this.emit('backup:added', backup);
  }

  updateMetrics(updates: Partial<WorkflowMetrics>): void {
    const previousMetrics = this.deepClone(this.state.metrics);
    Object.assign(this.state.metrics, updates);
    this.markDirty();
    this.emit('metrics:updated', { previous: previousMetrics, current: this.state.metrics });
  }

  updateContext(path: string, value: any): void {
    const pathParts = path.split('.');
    let current: any = this.state.context;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    const previousValue = current[pathParts[pathParts.length - 1]];
    current[pathParts[pathParts.length - 1]] = value;
    this.markDirty();
    this.emit('context:updated', { path, previous: previousValue, current: value });
  }

  // Snapshot Management
  createSnapshot(description?: string): string {
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const snapshot: StateSnapshot = {
      id: snapshotId,
      timestamp: new Date(),
      state: this.deepClone(this.state),
      description: description || `Snapshot at ${new Date().toISOString()}`
    };

    this.snapshots.set(snapshotId, snapshot);
    this.emit('snapshot:created', snapshot);

    // Cleanup old snapshots
    this.cleanupSnapshots();

    return snapshotId;
  }

  restoreSnapshot(snapshotId: string): void {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const previousState = this.deepClone(this.state);
    this.state = this.deepClone(snapshot.state);
    this.markDirty();
    this.emit('snapshot:restored', { snapshotId, previous: previousState, current: this.state });
  }

  listSnapshots(): StateSnapshot[] {
    return Array.from(this.snapshots.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  deleteSnapshot(snapshotId: string): void {
    if (this.snapshots.delete(snapshotId)) {
      this.emit('snapshot:deleted', snapshotId);
    }
  }

  // Query Methods
  query(query: StateQuery): any {
    let result: any = this.state;
    
    if (query.path) {
      const pathParts = query.path.split('.');
      for (const part of pathParts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          return undefined;
        }
      }
    }

    if (query.filter && Array.isArray(result)) {
      result = result.filter(query.filter);
    }

    if (query.transform) {
      result = query.transform(result);
    }

    return result;
  }

  findSteps(predicate: (step: WorkflowStep) => boolean): WorkflowStep[] {
    return this.state.steps.filter(predicate);
  }

  findErrors(predicate: (error: WorkflowError) => boolean): WorkflowError[] {
    return this.state.errors.filter(predicate);
  }

  getStepsByStatus(status: WorkflowStatus): WorkflowStep[] {
    return this.findSteps(step => step.status === status);
  }

  getProgress(): { completed: number; total: number; percentage: number } {
    const completed = this.getStepsByStatus(WorkflowStatus.COMPLETED).length;
    const total = this.state.totalSteps;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  }

  // Persistence Methods
  async save(filePath?: string): Promise<void> {
    if (!this.persistenceConfig.enabled) {
      return;
    }

    const savePath = filePath || this.getDefaultSavePath();
    await fs.mkdir(dirname(savePath), { recursive: true });
    
    const stateData = {
      state: this.state,
      snapshots: Array.from(this.snapshots.entries()),
      metadata: {
        savedAt: new Date(),
        version: '1.0.0'
      }
    };

    let content = JSON.stringify(stateData, null, 2);
    
    if (this.persistenceConfig.compressionEnabled) {
      // In production, you might want to use actual compression
      content = this.compressData(content);
    }

    await fs.writeFile(savePath, content, 'utf8');
    this.isDirty = false;
    this.emit('state:saved', savePath);
  }

  async load(filePath?: string): Promise<void> {
    if (!this.persistenceConfig.enabled) {
      return;
    }

    const loadPath = filePath || this.getDefaultSavePath();
    
    try {
      let content = await fs.readFile(loadPath, 'utf8');
      
      if (this.persistenceConfig.compressionEnabled) {
        content = this.decompressData(content);
      }

      const stateData = JSON.parse(content);
      
      // Restore state
      this.state = stateData.state;
      
      // Restore snapshots
      this.snapshots.clear();
      for (const [id, snapshot] of stateData.snapshots) {
        this.snapshots.set(id, snapshot);
      }

      this.isDirty = false;
      this.emit('state:loaded', loadPath);
    } catch (error) {
      throw new Error(`Failed to load state: ${(error as Error).message}`);
    }
  }

  async backup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = backupPath || join(process.cwd(), 'backups', `workflow-state-${timestamp}.json`);
    
    await this.save(defaultPath);
    return defaultPath;
  }

  // Validation Methods
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate basic structure
    if (!this.state.id) {
      errors.push('Workflow ID is required');
    }

    if (!this.state.steps || this.state.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    if (this.state.currentStep < 0 || this.state.currentStep >= this.state.steps.length) {
      errors.push('Current step index is out of bounds');
    }

    // Validate steps
    for (const step of this.state.steps) {
      if (!step.id) {
        errors.push(`Step missing ID: ${step.name}`);
      }
      if (!step.name) {
        errors.push(`Step missing name: ${step.id}`);
      }
      if (step.retryCount < 0) {
        errors.push(`Invalid retry count for step: ${step.id}`);
      }
      if (step.maxRetries < 0) {
        errors.push(`Invalid max retries for step: ${step.id}`);
      }
    }

    // Validate dependencies
    for (const step of this.state.steps) {
      for (const depId of step.dependencies) {
        if (!this.state.steps.find(s => s.id === depId)) {
          errors.push(`Step ${step.id} has invalid dependency: ${depId}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Private Methods
  private setupAutoSave(): void {
    if (this.persistenceConfig.autoSave && this.persistenceConfig.autoSaveInterval) {
      this.autoSaveInterval = setInterval(async () => {
        if (this.isDirty) {
          try {
            await this.save();
          } catch (error) {
            this.emit('error', new Error(`Auto-save failed: ${(error as Error).message}`));
          }
        }
      }, this.persistenceConfig.autoSaveInterval);
    }
  }

  private markDirty(): void {
    this.isDirty = true;
  }

  private cleanupSnapshots(): void {
    if (this.snapshots.size <= this.persistenceConfig.maxSnapshots) {
      return;
    }

    const snapshots = this.listSnapshots();
    const toDelete = snapshots.slice(this.persistenceConfig.maxSnapshots);
    
    for (const snapshot of toDelete) {
      this.snapshots.delete(snapshot.id);
    }
  }

  private getDefaultSavePath(): string {
    return join(process.cwd(), '.workflow-state', `${this.state.id}.json`);
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private compressData(data: string): string {
    // Simplified compression - in production use actual compression library
    return Buffer.from(data).toString('base64');
  }

  private decompressData(data: string): string {
    // Simplified decompression - in production use actual compression library
    return Buffer.from(data, 'base64').toString('utf8');
  }

  // Cleanup
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.removeAllListeners();
  }
}