/**
 * Workflow Orchestrator Types for Clear Piggy Mobile Optimization
 * Comprehensive type system for coordinating all mobile optimization agents
 */

// Base workflow types
export interface WorkflowOrchestrationConfig {
  projectPath: string;
  outputPath: string;
  backupPath: string;
  logPath: string;
  components: ComponentSelectionConfig;
  optimization: OptimizationConfig;
  testing: TestingConfig;
  reporting: ReportingConfig;
  errorHandling: ErrorHandlingConfig;
  rollback: RollbackConfig;
  agents: AgentConfig;
}

export interface ComponentSelectionConfig {
  mode: 'all' | 'selective' | 'priority-based';
  includeComponents: string[];
  excludeComponents: string[];
  priorityLevels: ComponentPriority[];
  criticalPath: string[];
  batchSize: number;
  maxConcurrentOptimizations: number;
}

export interface ComponentPriority {
  componentPath: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  dependencies: string[];
  estimatedImpact: number; // 0-100 scale
  estimatedEffort: number; // minutes
}

export interface OptimizationConfig {
  enableAnalysis: boolean;
  enableComponentGeneration: boolean;
  enablePerformanceOptimization: boolean;
  enableTesting: boolean;
  validateEachStep: boolean;
  rollbackOnFailure: boolean;
  parallelExecution: boolean;
  skipExisting: boolean;
  preserveOriginals: boolean;
}

export interface TestingConfig {
  runTests: boolean;
  testTypes: ('unit' | 'integration' | 'e2e' | 'accessibility' | 'performance' | 'visual')[];
  failureThreshold: number; // Percentage of failed tests that triggers rollback
  testTimeout: number;
  retryFailedTests: boolean;
  maxTestRetries: number;
}

export interface ReportingConfig {
  generateReport: boolean;
  includeMetrics: boolean;
  includeRecommendations: boolean;
  includeCodeDiffs: boolean;
  reportFormat: ('html' | 'json' | 'pdf' | 'markdown')[];
  realTimeUpdates: boolean;
  progressWebhook?: string;
}

export interface ErrorHandlingConfig {
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  continueOnAgentFailure: boolean;
  aggregateErrors: boolean;
  notificationThreshold: 'any' | 'critical' | 'multiple';
  fallbackStrategies: FallbackStrategy[];
}

export interface FallbackStrategy {
  agentType: AgentType;
  condition: 'timeout' | 'error' | 'resource-limit' | 'validation-failure';
  action: 'skip' | 'retry' | 'fallback-mode' | 'rollback' | 'manual-intervention';
  fallbackConfig?: any;
}

export interface RollbackConfig {
  enableRollback: boolean;
  createBackups: boolean;
  rollbackTriggers: RollbackTrigger[];
  autoRollback: boolean;
  rollbackTimeoutMs: number;
  preserveBackups: boolean;
  maxBackupVersions: number;
}

export interface RollbackTrigger {
  type: 'test-failure' | 'performance-regression' | 'build-failure' | 'manual' | 'timeout';
  threshold?: number;
  condition?: string;
}

export interface AgentConfig {
  analysisAgent: AgentInstanceConfig;
  componentGenerator: AgentInstanceConfig;
  performanceOptimizer: AgentInstanceConfig;
  testingAgent: AgentInstanceConfig;
  communicationProtocol: CommunicationProtocol;
  resourceLimits: ResourceLimits;
}

export interface AgentInstanceConfig {
  enabled: boolean;
  timeout: number;
  maxMemoryMB: number;
  retryCount: number;
  parallelInstances: number;
  config: any; // Agent-specific configuration
}

export interface CommunicationProtocol {
  messageFormat: 'json' | 'protobuf' | 'msgpack';
  compression: boolean;
  encryption: boolean;
  acknowledgmentRequired: boolean;
  messageTimeout: number;
  maxMessageSize: number;
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxDiskSpaceMB: number;
  maxNetworkRequests: number;
  maxConcurrentOperations: number;
}

// Workflow execution types
export type AgentType = 'analysis' | 'component-generation' | 'performance-optimization' | 'testing';

export type WorkflowStatus = 
  | 'idle' 
  | 'initializing' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'rolling-back';

export type StepStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'skipped' 
  | 'retrying' 
  | 'rolled-back';

export interface WorkflowState {
  id: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: WorkflowStep[];
  metrics: WorkflowMetrics;
  errors: WorkflowError[];
  backups: BackupInfo[];
  context: WorkflowContext;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentType: AgentType;
  status: StepStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  input: StepInput;
  output?: StepOutput;
  error?: WorkflowError;
  retryCount: number;
  dependencies: string[];
  artifacts: StepArtifact[];
  metrics: StepMetrics;
}

export interface StepInput {
  type: string;
  data: any;
  metadata: InputMetadata;
}

export interface InputMetadata {
  source: string;
  version: string;
  checksum: string;
  size: number;
  format: string;
}

export interface StepOutput {
  type: string;
  data: any;
  metadata: OutputMetadata;
  validation: ValidationResult;
}

export interface OutputMetadata {
  generatedAt: Date;
  version: string;
  checksum: string;
  size: number;
  format: string;
  quality: QualityMetrics;
}

export interface QualityMetrics {
  score: number; // 0-100
  categories: {
    functionality: number;
    performance: number;
    maintainability: number;
    accessibility: number;
  };
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  location?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: ValidationMetrics;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  location?: string;
  context?: any;
}

export interface ValidationWarning {
  code: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

export interface ValidationMetrics {
  testsPassed: number;
  testsFailed: number;
  testCoverage: number;
  performanceScore: number;
  accessibilityScore: number;
  qualityGate: boolean;
}

export interface StepArtifact {
  id: string;
  name: string;
  type: 'code' | 'test' | 'report' | 'config' | 'backup';
  path: string;
  size: number;
  checksum: string;
  metadata: any;
}

export interface StepMetrics {
  executionTime: number;
  memoryUsed: number;
  cpuUsed: number;
  networkRequests: number;
  filesModified: number;
  linesOfCodeChanged: number;
  performanceImprovement: number;
}

export interface WorkflowMetrics {
  totalExecutionTime: number;
  totalMemoryUsed: number;
  totalCpuUsed: number;
  totalFilesModified: number;
  totalLinesChanged: number;
  overallPerformanceImprovement: number;
  successRate: number;
  errorRate: number;
  rollbackCount: number;
  retryCount: number;
  optimizationEfficiency: OptimizationEfficiency;
}

export interface OptimizationEfficiency {
  componentsOptimized: number;
  totalComponents: number;
  averageImprovementPerComponent: number;
  timeToValue: number; // minutes
  resourceUtilization: number; // percentage
  qualityImprovement: number;
}

export interface WorkflowError {
  id: string;
  timestamp: Date;
  agentType?: AgentType;
  stepId?: string;
  type: 'agent-failure' | 'validation-failure' | 'timeout' | 'resource-limit' | 'configuration-error';
  severity: 'critical' | 'major' | 'minor' | 'info';
  code: string;
  message: string;
  stack?: string;
  context: any;
  resolution?: ErrorResolution;
  recovered: boolean;
}

export interface ErrorResolution {
  strategy: 'retry' | 'skip' | 'fallback' | 'rollback' | 'manual';
  action: string;
  success: boolean;
  attempts: number;
  timestamp: Date;
}

export interface BackupInfo {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'component-specific';
  path: string;
  size: number;
  checksum: string;
  components: string[];
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  workflowStep: string;
  reason: string;
  autoRestore: boolean;
  expirationDate: Date;
  tags: string[];
}

export interface WorkflowContext {
  sessionId: string;
  userId?: string;
  environment: 'development' | 'staging' | 'production';
  branch?: string;
  commit?: string;
  variables: Record<string, any>;
  flags: WorkflowFlags;
}

export interface WorkflowFlags {
  dryRun: boolean;
  skipValidation: boolean;
  forceOptimization: boolean;
  verboseLogging: boolean;
  skipBackups: boolean;
  autoApprove: boolean;
}

// Agent communication types
export interface AgentMessage {
  id: string;
  timestamp: Date;
  from: AgentType | 'orchestrator';
  to: AgentType | 'orchestrator';
  type: MessageType;
  payload: any;
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
  priority: MessagePriority;
}

export type MessageType = 
  | 'request'
  | 'response' 
  | 'notification'
  | 'heartbeat'
  | 'error'
  | 'status-update'
  | 'resource-request'
  | 'cancellation';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AgentRequest {
  operation: string;
  parameters: any;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: AgentError;
  metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
  executionTime: number;
  resourceUsage: ResourceUsage;
  warnings: string[];
  suggestions: string[];
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  disk: number;
  network: number;
}

export interface AgentError {
  code: string;
  message: string;
  type: 'validation' | 'execution' | 'timeout' | 'resource' | 'configuration';
  recoverable: boolean;
  context: any;
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  jitterMs: number;
}

// Progress tracking types
export interface ProgressUpdate {
  workflowId: string;
  timestamp: Date;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  estimatedTimeRemaining: number;
  currentActivity: string;
  metrics: ProgressMetrics;
  errors: number;
  warnings: number;
}

export interface ProgressMetrics {
  componentsProcessed: number;
  totalComponents: number;
  optimizationsApplied: number;
  testsExecuted: number;
  testsPassed: number;
  performanceGain: number;
  qualityImprovement: number;
}

export interface ProgressSubscription {
  id: string;
  workflowId: string;
  callback: ProgressCallback;
  filters?: ProgressFilters;
}

export type ProgressCallback = (update: ProgressUpdate) => void | Promise<void>;

export interface ProgressFilters {
  minPercentChange?: number;
  includeMetrics?: boolean;
  includeErrors?: boolean;
  stepTypes?: AgentType[];
}

// Workflow execution planning
export interface WorkflowPlan {
  id: string;
  name: string;
  description: string;
  steps: PlannedStep[];
  estimatedDuration: number;
  estimatedResources: ResourceEstimate;
  dependencies: WorkflowDependency[];
  risks: WorkflowRisk[];
  alternatives: AlternativePlan[];
}

export interface PlannedStep {
  id: string;
  name: string;
  agentType: AgentType;
  dependencies: string[];
  estimatedDuration: number;
  estimatedResources: ResourceEstimate;
  canParallelize: boolean;
  criticalPath: boolean;
  rollbackStrategy: string;
}

export interface ResourceEstimate {
  memory: number;
  cpu: number;
  disk: number;
  network: number;
  duration: number;
}

export interface WorkflowDependency {
  type: 'component' | 'service' | 'file' | 'configuration';
  name: string;
  version?: string;
  required: boolean;
  validated: boolean;
}

export interface WorkflowRisk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  contingency: string;
}

export interface AlternativePlan {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  steps: PlannedStep[];
  tradeoffs: string[];
}

// Reporting types
export interface WorkflowReport {
  id: string;
  workflowId: string;
  timestamp: Date;
  summary: WorkflowSummary;
  stepReports: StepReport[];
  metrics: DetailedMetrics;
  recommendations: Recommendation[];
  artifacts: ReportArtifact[];
  appendix: ReportAppendix;
}

export interface WorkflowSummary {
  status: WorkflowStatus;
  duration: number;
  componentsOptimized: number;
  totalOptimizations: number;
  performanceImprovement: number;
  qualityImprovement: number;
  testCoverage: number;
  successRate: number;
  criticalIssues: number;
  resolved: boolean;
}

export interface StepReport {
  stepId: string;
  name: string;
  status: StepStatus;
  duration: number;
  input: StepInput;
  output?: StepOutput;
  metrics: StepMetrics;
  issues: QualityIssue[];
  recommendations: Recommendation[];
}

export interface DetailedMetrics {
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  efficiency: EfficiencyMetrics;
  reliability: ReliabilityMetrics;
  usability: UsabilityMetrics;
}

export interface PerformanceMetrics {
  loadTimeImprovement: number;
  bundleSizeReduction: number;
  memoryUsageReduction: number;
  renderTimeImprovement: number;
  networkRequestsReduced: number;
  cacheHitRateImprovement: number;
}

export interface EfficiencyMetrics {
  automationSavings: number; // hours saved
  errorReduction: number;
  maintenanceReduction: number;
  developmentVelocity: number;
  codeReusability: number;
}

export interface ReliabilityMetrics {
  bugReduction: number;
  testCoverage: number;
  uptime: number;
  errorRate: number;
  meanTimeToRecovery: number;
}

export interface UsabilityMetrics {
  accessibilityScore: number;
  mobileUsabilityScore: number;
  userSatisfaction: number;
  taskCompletionRate: number;
  timeOnTask: number;
}

export interface Recommendation {
  id: string;
  type: 'performance' | 'quality' | 'maintainability' | 'accessibility' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  implementation: Implementation;
  impact: ImpactAssessment;
  effort: EffortEstimate;
}

export interface Implementation {
  approach: string;
  steps: string[];
  codeChanges: CodeChange[];
  testingRequired: boolean;
  rollbackPlan: string;
}

export interface CodeChange {
  file: string;
  type: 'add' | 'modify' | 'delete';
  description: string;
  diffPreview?: string;
}

export interface ImpactAssessment {
  performance: number; // -100 to 100
  maintainability: number;
  accessibility: number;
  userExperience: number;
  risk: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
}

export interface EffortEstimate {
  hours: number;
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';
  skillsRequired: string[];
  dependencies: string[];
}

export interface ReportArtifact {
  id: string;
  name: string;
  type: string;
  path: string;
  description: string;
  size: number;
  format: string;
}

export interface ReportAppendix {
  logs: LogEntry[];
  configuration: any;
  environment: EnvironmentInfo;
  dependencies: DependencyInfo[];
  changeLog: ChangeLogEntry[];
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  context?: any;
}

export interface EnvironmentInfo {
  nodeVersion: string;
  npmVersion: string;
  os: string;
  architecture: string;
  memory: number;
  cpu: string;
  timestamp: Date;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  license: string;
  vulnerabilities: number;
}

export interface ChangeLogEntry {
  timestamp: Date;
  type: 'add' | 'modify' | 'delete';
  component: string;
  description: string;
  impact: 'major' | 'minor' | 'patch';
  author: string;
}

// Event system types
export interface WorkflowEvent {
  id: string;
  timestamp: Date;
  workflowId: string;
  type: WorkflowEventType;
  source: EventSource;
  data: any;
  metadata: EventMetadata;
}

export type WorkflowEventType = 
  | 'workflow-started'
  | 'workflow-completed' 
  | 'workflow-failed'
  | 'step-started'
  | 'step-completed'
  | 'step-failed'
  | 'agent-connected'
  | 'agent-disconnected'
  | 'error-occurred'
  | 'rollback-initiated'
  | 'backup-created'
  | 'validation-completed'
  | 'progress-updated';

export interface EventSource {
  type: 'orchestrator' | AgentType | 'external';
  id: string;
  version: string;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high';
  retryable: boolean;
}

export interface EventSubscription {
  id: string;
  eventTypes: WorkflowEventType[];
  handler: EventHandler;
  filters?: EventFilters;
  active: boolean;
}

export type EventHandler = (event: WorkflowEvent) => void | Promise<void>;

export interface EventFilters {
  workflowIds?: string[];
  sources?: EventSource[];
  minPriority?: string;
  tags?: string[];
}

// Configuration validation
export interface ConfigurationValidator {
  validate(config: WorkflowOrchestrationConfig): ValidationResult;
  validateAgentConfig(agentType: AgentType, config: AgentInstanceConfig): ValidationResult;
  validateDependencies(): Promise<ValidationResult>;
  recommendOptimizations(config: WorkflowOrchestrationConfig): Recommendation[];
}

// Workflow templates
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  config: Partial<WorkflowOrchestrationConfig>;
  steps: WorkflowStepTemplate[];
  customizations: TemplateCustomization[];
}

export interface WorkflowStepTemplate {
  name: string;
  agentType: AgentType;
  config: any;
  optional: boolean;
  conditions?: TemplateCondition[];
}

export interface TemplateCustomization {
  parameter: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  default?: any;
  required: boolean;
  validation?: any;
}

export interface TemplateCondition {
  parameter: string;
  operator: '=' | '!=' | '>' | '<' | 'contains' | 'exists';
  value: any;
}

// Predefined configurations
export const DEFAULT_WORKFLOW_CONFIG: WorkflowOrchestrationConfig = {
  projectPath: process.cwd(),
  outputPath: './optimization-output',
  backupPath: './optimization-backups',
  logPath: './optimization-logs',
  components: {
    mode: 'all',
    includeComponents: [],
    excludeComponents: [],
    priorityLevels: [],
    criticalPath: [],
    batchSize: 5,
    maxConcurrentOptimizations: 3
  },
  optimization: {
    enableAnalysis: true,
    enableComponentGeneration: true,
    enablePerformanceOptimization: true,
    enableTesting: true,
    validateEachStep: true,
    rollbackOnFailure: true,
    parallelExecution: true,
    skipExisting: false,
    preserveOriginals: true
  },
  testing: {
    runTests: true,
    testTypes: ['unit', 'integration', 'accessibility', 'performance'],
    failureThreshold: 20,
    testTimeout: 300000,
    retryFailedTests: true,
    maxTestRetries: 3
  },
  reporting: {
    generateReport: true,
    includeMetrics: true,
    includeRecommendations: true,
    includeCodeDiffs: true,
    reportFormat: ['html', 'json', 'markdown'],
    realTimeUpdates: true
  },
  errorHandling: {
    maxRetries: 3,
    retryDelayMs: 1000,
    exponentialBackoff: true,
    continueOnAgentFailure: false,
    aggregateErrors: true,
    notificationThreshold: 'critical',
    fallbackStrategies: []
  },
  rollback: {
    enableRollback: true,
    createBackups: true,
    rollbackTriggers: [
      { type: 'test-failure', threshold: 30 },
      { type: 'performance-regression', threshold: 20 }
    ],
    autoRollback: false,
    rollbackTimeoutMs: 60000,
    preserveBackups: true,
    maxBackupVersions: 10
  },
  agents: {
    analysisAgent: {
      enabled: true,
      timeout: 300000,
      maxMemoryMB: 512,
      retryCount: 3,
      parallelInstances: 1,
      config: {}
    },
    componentGenerator: {
      enabled: true,
      timeout: 600000,
      maxMemoryMB: 1024,
      retryCount: 2,
      parallelInstances: 2,
      config: {}
    },
    performanceOptimizer: {
      enabled: true,
      timeout: 900000,
      maxMemoryMB: 2048,
      retryCount: 2,
      parallelInstances: 1,
      config: {}
    },
    testingAgent: {
      enabled: true,
      timeout: 1800000,
      maxMemoryMB: 1024,
      retryCount: 1,
      parallelInstances: 3,
      config: {}
    },
    communicationProtocol: {
      messageFormat: 'json',
      compression: true,
      encryption: false,
      acknowledgmentRequired: true,
      messageTimeout: 30000,
      maxMessageSize: 10485760 // 10MB
    },
    resourceLimits: {
      maxMemoryMB: 4096,
      maxCpuPercent: 80,
      maxDiskSpaceMB: 10240,
      maxNetworkRequests: 1000,
      maxConcurrentOperations: 10
    }
  }
};