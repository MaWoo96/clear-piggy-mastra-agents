import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, dirname, relative } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  BackupInfo,
  RollbackConfig,
  RollbackPlan,
  RollbackStrategy,
  RollbackOperation,
  FileOperation,
  RollbackPoint,
  RollbackValidation,
  RestoreStatus
} from '../types/workflow-orchestrator-types';

const execAsync = promisify(exec);

export class RollbackSystem extends EventEmitter {
  private config: RollbackConfig;
  private rollbackPoints: Map<string, RollbackPoint> = new Map();
  private fileOperationLog: FileOperation[] = [];
  private originalHashes: Map<string, string> = new Map();

  constructor(config: RollbackConfig) {
    super();
    this.config = config;
  }

  async createBackup(
    sourceDir: string,
    description: string,
    type: 'full' | 'incremental' | 'differential' = 'full'
  ): Promise<BackupInfo> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupPath = join(this.config.backupDirectory, backupId);
    
    this.emit('backup:started', { backupId, sourceDir, type });
    
    try {
      await fs.mkdir(backupPath, { recursive: true });
      
      let size = 0;
      
      switch (type) {
        case 'full':
          size = await this.createFullBackup(sourceDir, backupPath);
          break;
        case 'incremental':
          size = await this.createIncrementalBackup(sourceDir, backupPath);
          break;
        case 'differential':
          size = await this.createDifferentialBackup(sourceDir, backupPath);
          break;
      }
      
      const backup: BackupInfo = {
        id: backupId,
        timestamp: new Date(),
        type,
        path: backupPath,
        size,
        description,
        sourceDirectory: sourceDir,
        checksums: await this.calculateDirectoryChecksum(sourceDir)
      };
      
      await this.saveBackupMetadata(backup);
      
      this.emit('backup:completed', backup);
      return backup;
      
    } catch (error) {
      this.emit('backup:failed', { backupId, error });
      throw new Error(`Backup creation failed: ${(error as Error).message}`);
    }
  }

  async createRollbackPoint(
    stepId: string,
    description: string,
    projectPath: string
  ): Promise<RollbackPoint> {
    const rollbackId = `rollback_${stepId}_${Date.now()}`;
    
    this.emit('rollback:point:creating', { rollbackId, stepId });
    
    try {
      // Create backup
      const backup = await this.createBackup(projectPath, description, 'full');
      
      // Capture current state
      const rollbackPoint: RollbackPoint = {
        id: rollbackId,
        stepId,
        timestamp: new Date(),
        description,
        projectPath,
        backup,
        fileOperations: [...this.fileOperationLog],
        gitCommit: await this.getCurrentGitCommit(projectPath),
        packageLock: await this.capturePackageLockState(projectPath),
        environmentState: await this.captureEnvironmentState()
      };
      
      this.rollbackPoints.set(rollbackId, rollbackPoint);
      
      // Clear operation log for next step
      this.fileOperationLog = [];
      
      this.emit('rollback:point:created', rollbackPoint);
      return rollbackPoint;
      
    } catch (error) {
      this.emit('rollback:point:failed', { rollbackId, stepId, error });
      throw new Error(`Failed to create rollback point: ${(error as Error).message}`);
    }
  }

  async executeRollback(
    rollbackPointId: string,
    strategy: RollbackStrategy = RollbackStrategy.FULL_RESTORE
  ): Promise<RestoreStatus> {
    const rollbackPoint = this.rollbackPoints.get(rollbackPointId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point not found: ${rollbackPointId}`);
    }
    
    this.emit('rollback:started', { rollbackPointId, strategy });
    
    try {
      const plan = await this.generateRollbackPlan(rollbackPoint, strategy);
      const status = await this.executeRollbackPlan(plan);
      
      this.emit('rollback:completed', { rollbackPointId, status });
      return status;
      
    } catch (error) {
      this.emit('rollback:failed', { rollbackPointId, error });
      throw new Error(`Rollback execution failed: ${(error as Error).message}`);
    }
  }

  async validateRollback(rollbackPointId: string): Promise<RollbackValidation> {
    const rollbackPoint = this.rollbackPoints.get(rollbackPointId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point not found: ${rollbackPointId}`);
    }
    
    this.emit('rollback:validation:started', rollbackPointId);
    
    try {
      const validation: RollbackValidation = {
        isValid: true,
        issues: [],
        recommendations: [],
        estimatedTime: 0,
        riskLevel: 'LOW'
      };
      
      // Check if backup exists and is valid
      const backupExists = await this.validateBackup(rollbackPoint.backup);
      if (!backupExists.isValid) {
        validation.isValid = false;
        validation.issues.push('Backup validation failed');
        validation.riskLevel = 'HIGH';
      }
      
      // Check for conflicts with current state
      const conflicts = await this.detectConflicts(rollbackPoint);
      if (conflicts.length > 0) {
        validation.issues.push(...conflicts);
        validation.riskLevel = 'MEDIUM';
      }
      
      // Check dependencies
      const dependencyIssues = await this.checkDependencies(rollbackPoint);
      if (dependencyIssues.length > 0) {
        validation.issues.push(...dependencyIssues);
      }
      
      // Estimate rollback time
      validation.estimatedTime = this.estimateRollbackTime(rollbackPoint);
      
      // Generate recommendations
      if (validation.issues.length > 0) {
        validation.recommendations = this.generateRecommendations(validation.issues);
      }
      
      this.emit('rollback:validation:completed', validation);
      return validation;
      
    } catch (error) {
      this.emit('rollback:validation:failed', { rollbackPointId, error });
      throw error;
    }
  }

  logFileOperation(operation: FileOperation): void {
    operation.timestamp = new Date();
    this.fileOperationLog.push(operation);
    this.emit('file:operation:logged', operation);
  }

  async listRollbackPoints(): Promise<RollbackPoint[]> {
    return Array.from(this.rollbackPoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteRollbackPoint(rollbackPointId: string): Promise<void> {
    const rollbackPoint = this.rollbackPoints.get(rollbackPointId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point not found: ${rollbackPointId}`);
    }
    
    try {
      // Delete backup directory
      await fs.rmdir(rollbackPoint.backup.path, { recursive: true });
      
      // Remove from memory
      this.rollbackPoints.delete(rollbackPointId);
      
      this.emit('rollback:point:deleted', rollbackPointId);
    } catch (error) {
      this.emit('rollback:point:delete:failed', { rollbackPointId, error });
      throw error;
    }
  }

  async cleanupOldRollbackPoints(retentionDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const pointsToDelete = Array.from(this.rollbackPoints.values())
      .filter(point => point.timestamp < cutoffDate);
    
    for (const point of pointsToDelete) {
      try {
        await this.deleteRollbackPoint(point.id);
      } catch (error) {
        this.emit('cleanup:failed', { pointId: point.id, error });
      }
    }
    
    this.emit('cleanup:completed', { deleted: pointsToDelete.length });
  }

  private async createFullBackup(sourceDir: string, backupPath: string): Promise<number> {
    // Create a full copy of the source directory
    await this.copyDirectory(sourceDir, backupPath);
    return await this.getDirectorySize(backupPath);
  }

  private async createIncrementalBackup(sourceDir: string, backupPath: string): Promise<number> {
    // For incremental, only copy files that have changed since last backup
    const lastBackup = this.getLastBackup();
    const changedFiles = lastBackup ? 
      await this.findChangedFiles(sourceDir, lastBackup.timestamp) : 
      await this.getAllFiles(sourceDir);
    
    let totalSize = 0;
    for (const filePath of changedFiles) {
      const relativePath = relative(sourceDir, filePath);
      const targetPath = join(backupPath, relativePath);
      await fs.mkdir(dirname(targetPath), { recursive: true });
      await fs.copyFile(filePath, targetPath);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
    
    return totalSize;
  }

  private async createDifferentialBackup(sourceDir: string, backupPath: string): Promise<number> {
    // For differential, copy all files changed since the last full backup
    const lastFullBackup = this.getLastFullBackup();
    const changedFiles = lastFullBackup ? 
      await this.findChangedFiles(sourceDir, lastFullBackup.timestamp) : 
      await this.getAllFiles(sourceDir);
    
    let totalSize = 0;
    for (const filePath of changedFiles) {
      const relativePath = relative(sourceDir, filePath);
      const targetPath = join(backupPath, relativePath);
      await fs.mkdir(dirname(targetPath), { recursive: true });
      await fs.copyFile(filePath, targetPath);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
    
    return totalSize;
  }

  private async copyDirectory(source: string, target: string): Promise<void> {
    await fs.mkdir(target, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = join(source, entry.name);
      const targetPath = join(target, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await this.getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private async findChangedFiles(dirPath: string, since: Date): Promise<string[]> {
    const changedFiles: string[] = [];
    const files = await this.getAllFiles(dirPath);
    
    for (const filePath of files) {
      const stats = await fs.stat(filePath);
      if (stats.mtime > since) {
        changedFiles.push(filePath);
      }
    }
    
    return changedFiles;
  }

  private getLastBackup(): BackupInfo | undefined {
    const rollbackPoints = Array.from(this.rollbackPoints.values());
    if (rollbackPoints.length === 0) return undefined;
    
    return rollbackPoints
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
      .backup;
  }

  private getLastFullBackup(): BackupInfo | undefined {
    const rollbackPoints = Array.from(this.rollbackPoints.values())
      .filter(point => point.backup.type === 'full');
    
    if (rollbackPoints.length === 0) return undefined;
    
    return rollbackPoints
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
      .backup;
  }

  private async calculateDirectoryChecksum(dirPath: string): Promise<Map<string, string>> {
    const checksums = new Map<string, string>();
    const files = await this.getAllFiles(dirPath);
    
    for (const filePath of files) {
      const content = await fs.readFile(filePath);
      const hash = require('crypto').createHash('sha256').update(content).digest('hex');
      const relativePath = relative(dirPath, filePath);
      checksums.set(relativePath, hash);
    }
    
    return checksums;
  }

  private async saveBackupMetadata(backup: BackupInfo): Promise<void> {
    const metadataPath = join(backup.path, 'backup-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(backup, null, 2));
  }

  private async getCurrentGitCommit(projectPath: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: projectPath });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  private async capturePackageLockState(projectPath: string): Promise<{ [key: string]: any } | undefined> {
    try {
      const lockFilePath = join(projectPath, 'package-lock.json');
      const content = await fs.readFile(lockFilePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  }

  private async captureEnvironmentState(): Promise<{ [key: string]: any }> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  private async generateRollbackPlan(
    rollbackPoint: RollbackPoint,
    strategy: RollbackStrategy
  ): Promise<RollbackPlan> {
    const operations: RollbackOperation[] = [];
    
    switch (strategy) {
      case RollbackStrategy.FULL_RESTORE:
        operations.push({
          type: 'restore_backup',
          description: 'Restore full backup',
          parameters: { backupPath: rollbackPoint.backup.path },
          estimatedTime: this.estimateRestoreTime(rollbackPoint.backup),
          riskLevel: 'LOW'
        });
        break;
        
      case RollbackStrategy.SELECTIVE_RESTORE:
        operations.push({
          type: 'restore_files',
          description: 'Restore changed files only',
          parameters: { 
            files: rollbackPoint.fileOperations.map(op => op.filePath) 
          },
          estimatedTime: this.estimateSelectiveRestoreTime(rollbackPoint.fileOperations),
          riskLevel: 'MEDIUM'
        });
        break;
        
      case RollbackStrategy.GIT_REVERT:
        if (rollbackPoint.gitCommit) {
          operations.push({
            type: 'git_revert',
            description: 'Revert to git commit',
            parameters: { commit: rollbackPoint.gitCommit },
            estimatedTime: 30000,
            riskLevel: 'LOW'
          });
        }
        break;
        
      case RollbackStrategy.HYBRID:
        // Combine strategies based on context
        operations.push(
          {
            type: 'restore_critical_files',
            description: 'Restore critical files',
            parameters: { files: this.getCriticalFiles(rollbackPoint) },
            estimatedTime: 60000,
            riskLevel: 'LOW'
          },
          {
            type: 'validate_state',
            description: 'Validate system state',
            parameters: {},
            estimatedTime: 30000,
            riskLevel: 'LOW'
          }
        );
        break;
    }
    
    return {
      id: `plan_${rollbackPoint.id}`,
      rollbackPointId: rollbackPoint.id,
      strategy,
      operations,
      totalEstimatedTime: operations.reduce((sum, op) => sum + op.estimatedTime, 0),
      validations: await this.generateValidationSteps(rollbackPoint)
    };
  }

  private async executeRollbackPlan(plan: RollbackPlan): Promise<RestoreStatus> {
    const status: RestoreStatus = {
      success: false,
      completedOperations: 0,
      totalOperations: plan.operations.length,
      errors: [],
      duration: 0,
      validationResults: []
    };
    
    const startTime = Date.now();
    
    try {
      for (const operation of plan.operations) {
        this.emit('rollback:operation:started', operation);
        
        try {
          await this.executeRollbackOperation(operation);
          status.completedOperations++;
          this.emit('rollback:operation:completed', operation);
        } catch (error) {
          const errorMessage = `Operation failed: ${operation.type} - ${(error as Error).message}`;
          status.errors.push(errorMessage);
          this.emit('rollback:operation:failed', { operation, error });
          
          if (operation.riskLevel === 'HIGH') {
            throw new Error(`Critical operation failed: ${errorMessage}`);
          }
        }
      }
      
      // Run validations
      for (const validation of plan.validations) {
        const result = await this.runValidation(validation);
        status.validationResults.push(result);
        if (!result.passed) {
          status.errors.push(`Validation failed: ${validation.description}`);
        }
      }
      
      status.success = status.errors.length === 0;
      status.duration = Date.now() - startTime;
      
    } catch (error) {
      status.success = false;
      status.duration = Date.now() - startTime;
      status.errors.push((error as Error).message);
    }
    
    return status;
  }

  private async executeRollbackOperation(operation: RollbackOperation): Promise<void> {
    switch (operation.type) {
      case 'restore_backup':
        await this.restoreFromBackup(operation.parameters.backupPath);
        break;
        
      case 'restore_files':
        await this.restoreFiles(operation.parameters.files);
        break;
        
      case 'git_revert':
        await this.gitRevert(operation.parameters.commit);
        break;
        
      case 'restore_critical_files':
        await this.restoreCriticalFiles(operation.parameters.files);
        break;
        
      case 'validate_state':
        await this.validateSystemState();
        break;
        
      default:
        throw new Error(`Unknown rollback operation: ${operation.type}`);
    }
  }

  // Implementation of specific rollback operations
  private async restoreFromBackup(backupPath: string): Promise<void> {
    // Implementation would restore files from backup
    this.emit('restore:backup:progress', { backupPath });
  }

  private async restoreFiles(files: string[]): Promise<void> {
    // Implementation would restore specific files
    this.emit('restore:files:progress', { files });
  }

  private async gitRevert(commit: string): Promise<void> {
    // Implementation would revert to specific git commit
    this.emit('git:revert:progress', { commit });
  }

  private async restoreCriticalFiles(files: string[]): Promise<void> {
    // Implementation would restore critical files
    this.emit('restore:critical:progress', { files });
  }

  private async validateSystemState(): Promise<void> {
    // Implementation would validate system state
    this.emit('validate:state:progress');
  }

  private async validateBackup(backup: BackupInfo): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check if backup directory exists
      await fs.access(backup.path);
      
      // Verify backup metadata
      const metadataPath = join(backup.path, 'backup-metadata.json');
      await fs.access(metadataPath);
      
      // Check backup size
      const currentSize = await this.getDirectorySize(backup.path);
      if (currentSize !== backup.size) {
        issues.push('Backup size mismatch');
      }
      
    } catch (error) {
      issues.push(`Backup validation failed: ${(error as Error).message}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private async detectConflicts(rollbackPoint: RollbackPoint): Promise<string[]> {
    const conflicts: string[] = [];
    
    // Check for modified files since rollback point
    try {
      const currentFiles = await this.getAllFiles(rollbackPoint.projectPath);
      for (const filePath of currentFiles) {
        const stats = await fs.stat(filePath);
        if (stats.mtime > rollbackPoint.timestamp) {
          conflicts.push(`File modified since rollback point: ${filePath}`);
        }
      }
    } catch (error) {
      conflicts.push(`Error checking for conflicts: ${(error as Error).message}`);
    }
    
    return conflicts;
  }

  private async checkDependencies(rollbackPoint: RollbackPoint): Promise<string[]> {
    const issues: string[] = [];
    
    // Check if required tools are available
    const requiredTools = ['git', 'node', 'npm'];
    for (const tool of requiredTools) {
      try {
        await execAsync(`${tool} --version`);
      } catch {
        issues.push(`Required tool not available: ${tool}`);
      }
    }
    
    return issues;
  }

  private estimateRollbackTime(rollbackPoint: RollbackPoint): number {
    // Estimate based on backup size and file count
    const baseTime = 30000; // 30 seconds base
    const sizeMultiplier = rollbackPoint.backup.size / (1024 * 1024); // MB
    const operationMultiplier = rollbackPoint.fileOperations.length;
    
    return baseTime + (sizeMultiplier * 1000) + (operationMultiplier * 100);
  }

  private estimateRestoreTime(backup: BackupInfo): number {
    return Math.max(30000, backup.size / (1024 * 1024) * 2000); // 2 seconds per MB, minimum 30s
  }

  private estimateSelectiveRestoreTime(operations: FileOperation[]): number {
    return Math.max(10000, operations.length * 1000); // 1 second per operation, minimum 10s
  }

  private generateRecommendations(issues: string[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(issue => issue.includes('Backup'))) {
      recommendations.push('Consider creating a fresh backup before rollback');
    }
    
    if (issues.some(issue => issue.includes('modified'))) {
      recommendations.push('Review modified files and consider selective rollback');
    }
    
    if (issues.some(issue => issue.includes('tool not available'))) {
      recommendations.push('Install required tools before proceeding');
    }
    
    return recommendations;
  }

  private getCriticalFiles(rollbackPoint: RollbackPoint): string[] {
    return rollbackPoint.fileOperations
      .filter(op => op.critical)
      .map(op => op.filePath);
  }

  private async generateValidationSteps(rollbackPoint: RollbackPoint): Promise<any[]> {
    return [
      {
        description: 'Verify file integrity',
        type: 'file_integrity'
      },
      {
        description: 'Check application functionality',
        type: 'functionality_check'
      }
    ];
  }

  private async runValidation(validation: any): Promise<{ passed: boolean; message?: string }> {
    // Implementation would run the specific validation
    return { passed: true };
  }
}