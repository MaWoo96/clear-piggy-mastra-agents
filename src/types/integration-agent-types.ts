export interface IntegrationConfig {
  projectPath: string;
  outputPath: string;
  repositoryUrl?: string;
  baseBranch: string;
  featureBranchPrefix: string;
  commitMessageTemplate: string;
  preserveExistingFunctionality: boolean;
  backupBeforeIntegration: boolean;
  generateMigrationScripts: boolean;
  updateDocumentation: boolean;
  supabase: SupabaseIntegrationConfig;
  tailwind: TailwindIntegrationConfig;
  deployment: DeploymentConfig;
  dependencies: DependencyManagementConfig;
  cicd: CICDConfig;
}

export interface SupabaseIntegrationConfig {
  projectRef: string;
  edgeFunctionsPath: string;
  enableMobileOptimizations: boolean;
  updateRLSPolicies: boolean;
  mobileApiEndpoints: string[];
  compressionEnabled: boolean;
  cachingStrategy: 'aggressive' | 'moderate' | 'conservative';
  responseOptimization: {
    minifyResponses: boolean;
    removeUnnecessaryFields: boolean;
    enableCompression: boolean;
  };
}

export interface TailwindIntegrationConfig {
  configPath: string;
  enableMobileBreakpoints: boolean;
  customBreakpoints: { [key: string]: string };
  mobileFirstApproach: boolean;
  optimizeForTouch: boolean;
  generateUtilities: boolean;
  purgeUnusedStyles: boolean;
  darkModeSupport: boolean;
}

export interface DeploymentConfig {
  stagingEnvironment: {
    url: string;
    branch: string;
    autoDeployment: boolean;
  };
  productionEnvironment: {
    url: string;
    branch: string;
    requireApproval: boolean;
  };
  deploymentPlatform: 'vercel' | 'netlify' | 'aws' | 'custom';
  environmentVariables: { [key: string]: string };
  buildCommand: string;
  outputDirectory: string;
  preDeploymentChecks: string[];
  postDeploymentValidation: string[];
}

export interface DependencyManagementConfig {
  updateStrategy: 'conservative' | 'moderate' | 'aggressive';
  mobileSpecificDependencies: string[];
  peerDependencyHandling: 'strict' | 'loose';
  lockFileUpdate: boolean;
  securityAudit: boolean;
  compatibilityCheck: boolean;
}

export interface CICDConfig {
  platform: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'custom';
  mobileTestingPipeline: boolean;
  deviceTestingMatrix: string[];
  performanceThresholds: {
    buildTime: number;
    bundleSize: number;
    testCoverage: number;
    performanceScore: number;
  };
  deploymentGates: string[];
  notificationChannels: string[];
}

export interface IntegrationPlan {
  id: string;
  timestamp: Date;
  description: string;
  optimizations: OptimizationChange[];
  steps: IntegrationStep[];
  estimatedDuration: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  rollbackStrategy: string;
  validationCriteria: string[];
}

export interface OptimizationChange {
  id: string;
  type: 'component' | 'api' | 'configuration' | 'dependency' | 'documentation';
  filePath: string;
  changeType: 'create' | 'modify' | 'delete' | 'move';
  description: string;
  impact: 'breaking' | 'non-breaking' | 'enhancement';
  mobileSpecific: boolean;
  plaidCompatible: boolean;
  supabaseCompatible: boolean;
  before?: string;
  after?: string;
  dependencies: string[];
}

export interface IntegrationStep {
  id: string;
  name: string;
  type: 'git' | 'file' | 'config' | 'dependency' | 'deployment' | 'validation';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  estimatedDuration: number;
  actualDuration?: number;
  dependencies: string[];
  rollbackAction?: string;
  validationCheck?: string;
  critical: boolean;
}

export interface GitOperationConfig {
  repository: GitRepositoryInfo;
  branching: BranchingStrategy;
  commits: CommitStrategy;
  mergeStrategy: 'squash' | 'merge' | 'rebase';
  protectedBranches: string[];
  requiresPullRequest: boolean;
  reviewRequirements: {
    minReviewers: number;
    requireCodeOwnerReview: boolean;
    requireStatusChecks: boolean;
  };
}

export interface GitRepositoryInfo {
  url: string;
  defaultBranch: string;
  currentBranch: string;
  isClean: boolean;
  hasUncommittedChanges: boolean;
  remotes: { [name: string]: string };
}

export interface BranchingStrategy {
  featureBranchNaming: string;
  baseBranch: string;
  deleteFeatureBranchAfterMerge: boolean;
  pushToRemote: boolean;
  trackUpstream: boolean;
}

export interface CommitStrategy {
  messageTemplate: string;
  includeTicketNumber: boolean;
  includeChangeScope: boolean;
  conventionalCommits: boolean;
  signCommits: boolean;
  coAuthors?: string[];
}

export interface FileOperationPlan {
  operations: FileOperation[];
  backupStrategy: BackupStrategy;
  validationRules: ValidationRule[];
  conflictResolution: ConflictResolutionStrategy;
}

export interface FileOperation {
  id: string;
  type: 'read' | 'write' | 'create' | 'delete' | 'move' | 'copy';
  sourcePath: string;
  targetPath?: string;
  content?: string;
  encoding?: string;
  permissions?: string;
  backup: boolean;
  validate: boolean;
  critical: boolean;
}

export interface BackupStrategy {
  enabled: boolean;
  backupLocation: string;
  includeGitHistory: boolean;
  compressionEnabled: boolean;
  retentionPeriod: number;
  incrementalBackups: boolean;
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'syntax' | 'lint' | 'type' | 'test' | 'custom';
  pattern?: string;
  command?: string;
  expectedResult?: any;
  critical: boolean;
}

export interface ConflictResolutionStrategy {
  automaticResolution: boolean;
  resolutionRules: ConflictRule[];
  fallbackToManual: boolean;
  preserveCustomizations: boolean;
}

export interface ConflictRule {
  filePattern: string;
  conflictType: string;
  resolution: 'keep-original' | 'use-new' | 'merge' | 'prompt';
  customHandler?: string;
}

export interface ComponentIntegration {
  originalComponent: ComponentInfo;
  optimizedComponent: ComponentInfo;
  integrationStrategy: 'replace' | 'enhance' | 'coexist';
  typeUpdates: TypeScriptUpdate[];
  styleUpdates: StyleUpdate[];
  testUpdates: TestUpdate[];
  documentationUpdates: DocumentationUpdate[];
}

export interface ComponentInfo {
  path: string;
  name: string;
  type: 'functional' | 'class' | 'hook' | 'utility';
  dependencies: string[];
  exports: string[];
  props?: any;
  mobileOptimized: boolean;
  accessibilityCompliant: boolean;
  performanceOptimized: boolean;
}

export interface TypeScriptUpdate {
  filePath: string;
  updateType: 'interface' | 'type' | 'enum' | 'import' | 'export';
  before: string;
  after: string;
  reason: string;
  breaking: boolean;
}

export interface StyleUpdate {
  filePath: string;
  updateType: 'css' | 'tailwind' | 'styled-components' | 'scss';
  selector?: string;
  property?: string;
  value?: string;
  mobileFirst: boolean;
  responsive: boolean;
}

export interface TestUpdate {
  filePath: string;
  testType: 'unit' | 'integration' | 'e2e' | 'visual';
  framework: string;
  mobileScenarios: boolean;
  accessibilityTests: boolean;
  performanceTests: boolean;
}

export interface DocumentationUpdate {
  filePath: string;
  updateType: 'api' | 'usage' | 'migration' | 'changelog';
  content: string;
  includeExamples: boolean;
  mobileSpecific: boolean;
}

export interface SupabaseEdgeFunctionOptimization {
  functionName: string;
  functionPath: string;
  optimizations: EdgeFunctionOptimization[];
  mobileSpecificLogic: boolean;
  compressionEnabled: boolean;
  cachingHeaders: { [key: string]: string };
  responseOptimizations: ResponseOptimization[];
}

export interface EdgeFunctionOptimization {
  type: 'response-compression' | 'payload-reduction' | 'caching' | 'error-handling' | 'mobile-detection';
  description: string;
  implementation: string;
  performanceImpact: number;
  mobileSpecific: boolean;
}

export interface ResponseOptimization {
  field: string;
  action: 'remove' | 'compress' | 'transform' | 'cache';
  condition?: string;
  mobileOnly: boolean;
}

export interface PlaidIntegrationValidation {
  apiVersion: string;
  endpoints: PlaidEndpointValidation[];
  mobileCompatibility: boolean;
  dataMapping: PlaidDataMapping[];
  errorHandling: PlaidErrorHandling;
}

export interface PlaidEndpointValidation {
  endpoint: string;
  method: string;
  mobileOptimized: boolean;
  responseSize: number;
  cacheable: boolean;
  compressionSupported: boolean;
}

export interface PlaidDataMapping {
  field: string;
  mobileFormat: string;
  transformationLogic: string;
  compressionApplied: boolean;
}

export interface PlaidErrorHandling {
  mobileSpecificErrors: string[];
  offlineHandling: boolean;
  retryLogic: string;
  userFeedback: string;
}

export interface SupabaseRLSUpdate {
  tableName: string;
  policyName: string;
  policyType: 'select' | 'insert' | 'update' | 'delete';
  mobileOptimizations: RLSOptimization[];
  performanceImpact: number;
  securityImplications: string[];
}

export interface RLSOptimization {
  optimization: string;
  sqlCondition: string;
  mobileSpecific: boolean;
  indexRequired: boolean;
}

export interface MigrationScript {
  id: string;
  version: string;
  description: string;
  type: 'database' | 'configuration' | 'dependency' | 'file-structure';
  upScript: string;
  downScript: string;
  dependencies: string[];
  mobileSpecific: boolean;
  critical: boolean;
}

export interface IntegrationReport {
  id: string;
  timestamp: Date;
  planId: string;
  status: 'success' | 'partial' | 'failed';
  summary: IntegrationSummary;
  changes: IntegrationChange[];
  validationResults: ValidationResult[];
  performance: PerformanceMetrics;
  compatibility: CompatibilityReport;
  recommendations: string[];
  rollbackInstructions: string[];
}

export interface IntegrationSummary {
  totalChanges: number;
  componentsModified: number;
  dependenciesUpdated: number;
  configurationChanges: number;
  documentationUpdates: number;
  migrationScriptsCreated: number;
  deploymentScriptsCreated: number;
  testCoverage: number;
  performanceImprovements: number;
}

export interface IntegrationChange {
  id: string;
  type: string;
  description: string;
  filePath: string;
  status: 'applied' | 'failed' | 'skipped';
  impact: 'low' | 'medium' | 'high';
  rollbackAvailable: boolean;
}

export interface ValidationResult {
  rule: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  critical: boolean;
}

export interface PerformanceMetrics {
  bundleSizeChange: number;
  buildTimeChange: number;
  renderPerformance: number;
  mobileScoreImprovement: number;
  accessibilityScoreImprovement: number;
}

export interface CompatibilityReport {
  plaidCompatibility: boolean;
  supabaseCompatibility: boolean;
  browserCompatibility: { [browser: string]: boolean };
  deviceCompatibility: { [device: string]: boolean };
  typescriptCompatibility: boolean;
  dependencyCompatibility: { [dependency: string]: boolean };
}

export interface DeploymentScript {
  name: string;
  environment: 'staging' | 'production' | 'development';
  platform: string;
  steps: DeploymentStep[];
  environmentVariables: { [key: string]: string };
  preChecks: string[];
  postChecks: string[];
  rollbackScript?: string;
}

export interface DeploymentStep {
  id: string;
  name: string;
  command: string;
  description: string;
  critical: boolean;
  timeout: number;
  retryCount: number;
  continueOnError: boolean;
}

export interface CICDPipelineUpdate {
  platform: string;
  configFile: string;
  updates: PipelineUpdate[];
  mobileTestingStages: TestingStage[];
  deploymentGates: DeploymentGate[];
  performanceThresholds: { [metric: string]: number };
}

export interface PipelineUpdate {
  stage: string;
  changes: string[];
  mobileSpecific: boolean;
  newStage: boolean;
}

export interface TestingStage {
  name: string;
  devices: string[];
  browsers: string[];
  testSuites: string[];
  parallelExecution: boolean;
  failFast: boolean;
}

export interface DeploymentGate {
  name: string;
  condition: string;
  mobileRequired: boolean;
  autoApproval: boolean;
  reviewers: string[];
}

// Default configurations
export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  projectPath: './src',
  outputPath: './integrated',
  baseBranch: 'main',
  featureBranchPrefix: 'feature/mobile-optimization',
  commitMessageTemplate: 'feat(mobile): {description}\n\n{details}',
  preserveExistingFunctionality: true,
  backupBeforeIntegration: true,
  generateMigrationScripts: true,
  updateDocumentation: true,
  supabase: {
    projectRef: '',
    edgeFunctionsPath: './supabase/functions',
    enableMobileOptimizations: true,
    updateRLSPolicies: true,
    mobileApiEndpoints: ['/api/mobile/*'],
    compressionEnabled: true,
    cachingStrategy: 'moderate',
    responseOptimization: {
      minifyResponses: true,
      removeUnnecessaryFields: true,
      enableCompression: true
    }
  },
  tailwind: {
    configPath: './tailwind.config.js',
    enableMobileBreakpoints: true,
    customBreakpoints: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px'
    },
    mobileFirstApproach: true,
    optimizeForTouch: true,
    generateUtilities: true,
    purgeUnusedStyles: true,
    darkModeSupport: true
  },
  deployment: {
    stagingEnvironment: {
      url: 'https://staging.clear-piggy.com',
      branch: 'staging',
      autoDeployment: true
    },
    productionEnvironment: {
      url: 'https://clear-piggy.com',
      branch: 'main',
      requireApproval: true
    },
    deploymentPlatform: 'vercel',
    environmentVariables: {},
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    preDeploymentChecks: ['test', 'lint', 'type-check'],
    postDeploymentValidation: ['health-check', 'performance-test']
  },
  dependencies: {
    updateStrategy: 'moderate',
    mobileSpecificDependencies: [
      '@tanstack/react-virtual',
      'framer-motion',
      'react-intersection-observer'
    ],
    peerDependencyHandling: 'strict',
    lockFileUpdate: true,
    securityAudit: true,
    compatibilityCheck: true
  },
  cicd: {
    platform: 'github-actions',
    mobileTestingPipeline: true,
    deviceTestingMatrix: ['iPhone 12', 'Samsung Galaxy S21', 'iPad Air'],
    performanceThresholds: {
      buildTime: 300000,
      bundleSize: 5000000,
      testCoverage: 80,
      performanceScore: 90
    },
    deploymentGates: ['tests-pass', 'security-scan', 'performance-check'],
    notificationChannels: ['slack', 'email']
  }
};

export const MOBILE_BREAKPOINTS = {
  xs: '320px',    // Small mobile phones
  sm: '640px',    // Large mobile phones
  md: '768px',    // Tablets
  lg: '1024px',   // Small laptops
  xl: '1280px',   // Large laptops
  '2xl': '1536px' // Desktop
};

export const MOBILE_OPTIMIZATION_PATTERNS = {
  components: [
    '**/*Mobile*.{tsx,jsx}',
    '**/*Responsive*.{tsx,jsx}',
    '**/*Touch*.{tsx,jsx}'
  ],
  styles: [
    '**/*mobile*.{css,scss}',
    '**/*responsive*.{css,scss}'
  ],
  tests: [
    '**/*mobile*.test.{ts,tsx}',
    '**/*responsive*.test.{ts,tsx}'
  ]
};

export const PLAID_MOBILE_OPTIMIZATIONS = {
  endpoints: [
    '/link/token/create',
    '/accounts/get',
    '/transactions/get',
    '/institutions/get'
  ],
  mobileFields: [
    'account_id',
    'name',
    'balances.current',
    'type',
    'subtype'
  ],
  compressionThreshold: 1024 // bytes
};

export const SUPABASE_MOBILE_OPTIMIZATIONS = {
  edgeFunctions: [
    'mobile-transactions',
    'mobile-accounts',
    'mobile-auth',
    'mobile-sync'
  ],
  rlsTables: [
    'transactions',
    'accounts',
    'budgets',
    'categories',
    'users'
  ],
  cacheHeaders: {
    'Cache-Control': 'public, max-age=300',
    'Vary': 'Accept-Encoding',
    'Content-Encoding': 'gzip'
  }
};