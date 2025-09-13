// Production Deployment Types for Clear Piggy Mobile Optimizations

export interface ProductionDeploymentConfig {
  projectId: string;
  environment: 'staging' | 'production';
  deployment: DeploymentConfig;
  featureFlags: FeatureFlagConfig;
  monitoring: MonitoringConfig;
  rollback: RollbackConfig;
  cdn: CDNConfig;
  database: DatabaseConfig;
  caching: CachingConfig;
  cicd: CICDConfig;
  security: SecurityConfig;
  integrations: IntegrationsConfig;
}

// Feature Flag Configuration
export interface FeatureFlagConfig {
  enabled: boolean;
  provider: 'launchdarkly' | 'split' | 'flagsmith' | 'custom';
  flags: FeatureFlag[];
  rolloutStrategy: RolloutStrategy;
  audienceSegmentation: AudienceSegmentation;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  defaultValue: any;
  variations: FlagVariation[];
  targeting: FlagTargeting;
  rolloutPercentage: number;
  environment: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FlagVariation {
  key: string;
  name: string;
  value: any;
  description: string;
}

export interface FlagTargeting {
  rules: TargetingRule[];
  fallthrough: FallthroughRule;
  offVariation: string;
}

export interface TargetingRule {
  id: string;
  variation: string;
  clauses: TargetingClause[];
  weight: number;
  description: string;
}

export interface TargetingClause {
  attribute: string;
  op: 'in' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'greaterThan' | 'lessThan';
  values: string[];
  negate: boolean;
}

export interface FallthroughRule {
  variation: string;
  rollout?: RolloutRule;
}

export interface RolloutRule {
  variations: Array<{
    variation: string;
    weight: number;
  }>;
}

export interface RolloutStrategy {
  type: 'percentage' | 'user_attribute' | 'custom';
  stages: RolloutStage[];
  duration: number; // minutes
  autoPromote: boolean;
  rollbackThreshold: number;
}

export interface RolloutStage {
  name: string;
  percentage: number;
  duration: number; // minutes
  criteria: RolloutCriteria;
  monitoring: StageMonitoring;
}

export interface RolloutCriteria {
  errorRate: number;
  responseTime: number;
  conversionRate: number;
  userSatisfaction: number;
}

export interface StageMonitoring {
  metrics: string[];
  thresholds: Record<string, number>;
  alerting: boolean;
}

export interface AudienceSegmentation {
  segments: AudienceSegment[];
  rules: SegmentationRule[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  size: number;
}

export interface SegmentCriteria {
  attribute: string;
  operator: string;
  value: any;
}

export interface SegmentationRule {
  segment: string;
  flags: string[];
  variations: Record<string, string>;
}

// Deployment Configuration
export interface DeploymentConfig {
  strategy: 'blue_green' | 'canary' | 'rolling' | 'recreate';
  canary: CanaryConfig;
  blueGreen: BlueGreenConfig;
  rolling: RollingConfig;
  validation: ValidationConfig;
  healthChecks: HealthCheckConfig;
  traffic: TrafficConfig;
}

export interface CanaryConfig {
  enabled: boolean;
  initialTraffic: number; // percentage
  trafficIncrements: number[];
  incrementInterval: number; // minutes
  successCriteria: SuccessCriteria;
  analysisInterval: number; // minutes
  maxDuration: number; // minutes
}

export interface BlueGreenConfig {
  enabled: boolean;
  switchTraffic: boolean;
  validateDuration: number; // minutes
  rollbackOnFailure: boolean;
}

export interface RollingConfig {
  enabled: boolean;
  batchSize: number; // percentage or absolute number
  batchInterval: number; // seconds
  maxUnavailable: number; // percentage
  maxSurge: number; // percentage
}

export interface ValidationConfig {
  preDeployment: ValidationStep[];
  postDeployment: ValidationStep[];
  staging: StagingValidation;
  production: ProductionValidation;
}

export interface ValidationStep {
  name: string;
  type: 'health_check' | 'performance_test' | 'integration_test' | 'security_scan' | 'custom';
  command?: string;
  timeout: number;
  retries: number;
  successCriteria: any;
}

export interface StagingValidation {
  mobileDeviceTesting: MobileTestConfig;
  performanceBaseline: PerformanceBaseline;
  integrationTests: IntegrationTest[];
  securityScans: SecurityScan[];
}

export interface MobileTestConfig {
  devices: MobileDevice[];
  browsers: BrowserConfig[];
  testSuites: TestSuite[];
  performanceThresholds: MobilePerformanceThresholds;
}

export interface MobileDevice {
  name: string;
  type: 'phone' | 'tablet';
  os: 'ios' | 'android';
  version: string;
  viewport: Viewport;
  userAgent: string;
  network: NetworkCondition;
}

export interface BrowserConfig {
  name: string;
  version: string;
  mobile: boolean;
  engine: string;
}

export interface TestSuite {
  name: string;
  type: 'e2e' | 'integration' | 'performance' | 'accessibility';
  tests: TestCase[];
  parallelism: number;
  timeout: number;
}

export interface TestCase {
  name: string;
  description: string;
  file: string;
  tags: string[];
  critical: boolean;
}

export interface MobilePerformanceThresholds {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  speedIndex: number;
}

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor: number;
}

export interface NetworkCondition {
  name: string;
  downloadThroughput: number; // Kbps
  uploadThroughput: number; // Kbps
  latency: number; // ms
  packetLoss: number; // percentage
}

export interface PerformanceBaseline {
  metrics: BaselineMetric[];
  thresholds: PerformanceThresholds;
  comparison: ComparisonConfig;
}

export interface BaselineMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface PerformanceThresholds {
  errorRate: number; // percentage
  responseTime: number; // ms
  throughput: number; // requests/second
  availability: number; // percentage
  resourceUtilization: ResourceThresholds;
}

export interface ResourceThresholds {
  cpu: number; // percentage
  memory: number; // MB
  disk: number; // percentage
  network: number; // MB/s
}

export interface ComparisonConfig {
  baseline: string; // version or branch
  tolerance: number; // percentage
  minSampleSize: number;
  confidenceLevel: number;
}

export interface IntegrationTest {
  name: string;
  service: string;
  endpoints: string[];
  expectedResponses: any[];
  timeout: number;
}

export interface SecurityScan {
  type: 'vulnerability' | 'penetration' | 'code_analysis' | 'dependency_check';
  tool: string;
  config: any;
  failureThreshold: string;
}

export interface ProductionValidation {
  healthChecks: HealthCheck[];
  smokTests: SmokeTest[];
  monitoringValidation: MonitoringValidation;
}

export interface HealthCheck {
  name: string;
  endpoint: string;
  method: string;
  expectedStatus: number;
  timeout: number;
  interval: number;
  retries: number;
}

export interface SmokeTest {
  name: string;
  description: string;
  steps: TestStep[];
  timeout: number;
}

export interface TestStep {
  action: string;
  target: string;
  value?: string;
  assertion?: string;
}

export interface MonitoringValidation {
  metrics: string[];
  alerts: string[];
  dashboards: string[];
  duration: number; // minutes
}

export interface HealthCheckConfig {
  liveness: HealthCheck;
  readiness: HealthCheck;
  startup: HealthCheck;
}

export interface TrafficConfig {
  loadBalancer: LoadBalancerConfig;
  routing: RoutingConfig;
  rateLimit: RateLimitConfig;
}

export interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash' | 'weighted';
  healthCheck: HealthCheckConfig;
  sessionAffinity: boolean;
  stickySession: boolean;
}

export interface RoutingConfig {
  rules: RoutingRule[];
  fallback: RoutingFallback;
}

export interface RoutingRule {
  condition: string;
  destination: string;
  weight: number;
  headers?: Record<string, string>;
}

export interface RoutingFallback {
  destination: string;
  statusCode: number;
  message: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  requests: number;
  window: number; // seconds
  burst: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface SuccessCriteria {
  errorRate: number; // percentage
  responseTime: number; // ms
  availability: number; // percentage
  customMetrics: CustomMetric[];
}

export interface CustomMetric {
  name: string;
  query: string;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equal_to';
}

// Monitoring Configuration
export interface MonitoringConfig {
  enabled: boolean;
  providers: MonitoringProvider[];
  metrics: MetricConfig[];
  alerts: AlertConfig[];
  dashboards: DashboardConfig[];
  logs: LogConfig;
  traces: TracingConfig;
}

export interface MonitoringProvider {
  name: string;
  type: 'prometheus' | 'datadog' | 'new_relic' | 'grafana' | 'custom';
  config: any;
  enabled: boolean;
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
  provider: string;
}

export interface AlertConfig {
  name: string;
  description: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: NotificationChannel[];
  suppressionRules: SuppressionRule[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  config: any;
  enabled: boolean;
}

export interface SuppressionRule {
  condition: string;
  duration: number; // minutes
  reason: string;
}

export interface DashboardConfig {
  name: string;
  description: string;
  panels: DashboardPanel[];
  refresh: number; // seconds
  timeRange: TimeRange;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'table' | 'stat' | 'gauge' | 'heatmap';
  query: string;
  visualization: VisualizationConfig;
}

export interface VisualizationConfig {
  type: string;
  options: any;
  fieldConfig: any;
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  retention: number; // days
  aggregation: LogAggregation;
}

export interface LogAggregation {
  enabled: boolean;
  rules: AggregationRule[];
}

export interface AggregationRule {
  pattern: string;
  action: 'count' | 'sum' | 'avg' | 'max' | 'min';
  interval: number; // seconds
}

export interface TracingConfig {
  enabled: boolean;
  provider: 'jaeger' | 'zipkin' | 'datadog' | 'new_relic';
  sampleRate: number;
  config: any;
}

// Rollback Configuration
export interface RollbackConfig {
  enabled: boolean;
  triggers: RollbackTrigger[];
  strategy: RollbackStrategy;
  automation: AutomationConfig;
  verification: RollbackVerification;
}

export interface RollbackTrigger {
  name: string;
  type: 'metric_threshold' | 'error_rate' | 'response_time' | 'custom';
  condition: string;
  threshold: number;
  duration: number; // minutes
  enabled: boolean;
}

export interface RollbackStrategy {
  type: 'immediate' | 'gradual' | 'blue_green';
  steps: RollbackStep[];
  verification: boolean;
  notification: boolean;
}

export interface RollbackStep {
  name: string;
  action: string;
  timeout: number;
  retries: number;
}

export interface AutomationConfig {
  enabled: boolean;
  approvalRequired: boolean;
  maxAttempts: number;
  cooldownPeriod: number; // minutes
}

export interface RollbackVerification {
  enabled: boolean;
  checks: VerificationCheck[];
  timeout: number;
}

export interface VerificationCheck {
  name: string;
  type: 'health_check' | 'metric_validation' | 'custom';
  config: any;
  timeout: number;
}

// CDN Configuration
export interface CDNConfig {
  provider: 'cloudflare' | 'aws_cloudfront' | 'google_cloud' | 'azure' | 'fastly';
  config: CDNProviderConfig;
  caching: CDNCachingConfig;
  optimization: CDNOptimizationConfig;
  security: CDNSecurityConfig;
  monitoring: CDNMonitoringConfig;
}

export interface CDNProviderConfig {
  zones: CDNZone[];
  origins: CDNOrigin[];
  behaviors: CDNBehavior[];
}

export interface CDNZone {
  id: string;
  name: string;
  domain: string;
  type: 'full' | 'partial' | 'dns_only';
}

export interface CDNOrigin {
  id: string;
  domain: string;
  protocol: 'http' | 'https';
  port: number;
  path: string;
  headers: Record<string, string>;
}

export interface CDNBehavior {
  pathPattern: string;
  origin: string;
  caching: CachingBehavior;
  compression: CompressionConfig;
  headers: HeaderConfig;
}

export interface CachingBehavior {
  ttl: number; // seconds
  browserTtl: number; // seconds
  edgeTtl: number; // seconds
  cacheControl: string;
  vary: string[];
}

export interface CompressionConfig {
  enabled: boolean;
  algorithms: string[];
  mimeTypes: string[];
  minSize: number; // bytes
}

export interface HeaderConfig {
  add: Record<string, string>;
  remove: string[];
  modify: Record<string, string>;
}

export interface CDNCachingConfig {
  defaultTtl: number;
  maxTtl: number;
  browserTtl: number;
  cacheRules: CacheRule[];
  purging: PurgingConfig;
}

export interface CacheRule {
  pathPattern: string;
  ttl: number;
  conditions: CacheCondition[];
}

export interface CacheCondition {
  type: 'header' | 'query' | 'cookie' | 'method';
  field: string;
  operator: string;
  value: string;
}

export interface PurgingConfig {
  enabled: boolean;
  methods: string[];
  authentication: any;
}

export interface CDNOptimizationConfig {
  minification: MinificationConfig;
  imageOptimization: ImageOptimizationConfig;
  http2: boolean;
  brotli: boolean;
  earlyHints: boolean;
}

export interface MinificationConfig {
  html: boolean;
  css: boolean;
  javascript: boolean;
  removeComments: boolean;
  removeWhitespace: boolean;
}

export interface ImageOptimizationConfig {
  enabled: boolean;
  formats: string[];
  quality: number;
  progressive: boolean;
  webp: boolean;
  avif: boolean;
}

export interface CDNSecurityConfig {
  ssl: SSLConfig;
  waf: WAFConfig;
  ddos: DDoSConfig;
  rateLimit: RateLimitConfig;
}

export interface SSLConfig {
  enabled: boolean;
  mode: 'off' | 'flexible' | 'full' | 'strict';
  certificate: CertificateConfig;
  hsts: HSTSConfig;
}

export interface CertificateConfig {
  type: 'universal' | 'dedicated' | 'custom';
  domains: string[];
  autoRenew: boolean;
}

export interface HSTSConfig {
  enabled: boolean;
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

export interface WAFConfig {
  enabled: boolean;
  mode: 'off' | 'simulate' | 'block';
  rules: WAFRule[];
  customRules: CustomWAFRule[];
}

export interface WAFRule {
  id: string;
  description: string;
  action: 'allow' | 'block' | 'challenge';
  enabled: boolean;
}

export interface CustomWAFRule {
  name: string;
  expression: string;
  action: string;
  priority: number;
}

export interface DDoSConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  action: 'block' | 'challenge' | 'rate_limit';
}

export interface CDNMonitoringConfig {
  analytics: boolean;
  realUserMonitoring: boolean;
  alerts: CDNAlert[];
}

export interface CDNAlert {
  metric: string;
  threshold: number;
  duration: number;
  action: string;
}

// Database Configuration
export interface DatabaseConfig {
  optimization: DBOptimizationConfig;
  scaling: DBScalingConfig;
  monitoring: DBMonitoringConfig;
  backup: BackupConfig;
  security: DBSecurityConfig;
}

export interface DBOptimizationConfig {
  queryOptimization: QueryOptimizationConfig;
  indexOptimization: IndexOptimizationConfig;
  connectionPooling: ConnectionPoolConfig;
  partitioning: PartitioningConfig;
}

export interface QueryOptimizationConfig {
  enabled: boolean;
  slowQueryThreshold: number; // ms
  explainPlans: boolean;
  queryCache: boolean;
  preparedStatements: boolean;
}

export interface IndexOptimizationConfig {
  autoIndex: boolean;
  mobileQueries: MobileQueryPattern[];
  indexAnalysis: boolean;
  unusedIndexCleanup: boolean;
}

export interface MobileQueryPattern {
  name: string;
  pattern: string;
  frequency: number;
  performance: number; // ms
  suggestedIndexes: string[];
}

export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  idleTimeout: number; // seconds
  connectionTimeout: number; // seconds
  leakDetectionThreshold: number; // seconds
}

export interface PartitioningConfig {
  enabled: boolean;
  strategy: 'range' | 'hash' | 'list';
  tables: PartitionedTable[];
}

export interface PartitionedTable {
  name: string;
  column: string;
  partitions: Partition[];
}

export interface Partition {
  name: string;
  condition: string;
  tablespace?: string;
}

export interface DBScalingConfig {
  readReplicas: ReadReplicaConfig[];
  connectionPooling: boolean;
  queryRouting: QueryRoutingConfig;
  sharding: ShardingConfig;
}

export interface ReadReplicaConfig {
  name: string;
  region: string;
  instanceType: string;
  autoScaling: AutoScalingConfig;
}

export interface AutoScalingConfig {
  enabled: boolean;
  minCapacity: number;
  maxCapacity: number;
  targetUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

export interface QueryRoutingConfig {
  readWrite: string;
  readOnly: string[];
  rules: RoutingRule[];
}

export interface ShardingConfig {
  enabled: boolean;
  strategy: 'user_id' | 'tenant_id' | 'custom';
  shards: ShardConfig[];
}

export interface ShardConfig {
  name: string;
  connection: string;
  range: any;
}

export interface DBMonitoringConfig {
  slowQueries: boolean;
  connectionMonitoring: boolean;
  performanceInsights: boolean;
  customMetrics: DBMetric[];
}

export interface DBMetric {
  name: string;
  query: string;
  threshold: number;
  frequency: number; // seconds
}

export interface BackupConfig {
  enabled: boolean;
  frequency: string; // cron expression
  retention: number; // days
  compression: boolean;
  encryption: boolean;
  verification: boolean;
}

export interface DBSecurityConfig {
  encryption: EncryptionConfig;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  auditing: AuditingConfig;
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  keyManagement: string;
  algorithm: string;
}

export interface AuthenticationConfig {
  method: 'password' | 'certificate' | 'ldap' | 'oauth';
  mfa: boolean;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  requireUppercase: boolean;
  requireLowercase: boolean;
  expiration: number; // days
}

export interface AuthorizationConfig {
  rbac: boolean;
  roles: DBRole[];
  permissions: DBPermission[];
}

export interface DBRole {
  name: string;
  permissions: string[];
  users: string[];
}

export interface DBPermission {
  name: string;
  resource: string;
  actions: string[];
}

export interface AuditingConfig {
  enabled: boolean;
  events: string[];
  retention: number; // days
  format: string;
}

// Caching Configuration
export interface CachingConfig {
  layers: CacheLayer[];
  strategies: CacheStrategy[];
  invalidation: InvalidationConfig;
  monitoring: CacheMonitoringConfig;
}

export interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'memcached' | 'cdn' | 'browser';
  config: CacheLayerConfig;
  priority: number;
}

export interface CacheLayerConfig {
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  compression: boolean;
  serialization: string;
}

export interface CacheStrategy {
  name: string;
  pattern: string;
  layers: string[];
  ttl: number;
  conditions: CacheCondition[];
}

export interface InvalidationConfig {
  strategies: InvalidationStrategy[];
  triggers: InvalidationTrigger[];
  cascading: boolean;
}

export interface InvalidationStrategy {
  name: string;
  type: 'tag' | 'pattern' | 'time' | 'event';
  config: any;
}

export interface InvalidationTrigger {
  event: string;
  patterns: string[];
  delay: number; // seconds
}

export interface CacheMonitoringConfig {
  hitRate: boolean;
  missRate: boolean;
  evictions: boolean;
  memory: boolean;
  alerts: CacheAlert[];
}

export interface CacheAlert {
  metric: string;
  threshold: number;
  action: string;
  notification: boolean;
}

// CI/CD Configuration
export interface CICDConfig {
  platform: 'github_actions' | 'gitlab_ci' | 'azure_devops' | 'jenkins' | 'custom';
  pipeline: PipelineConfig;
  environments: EnvironmentConfig[];
  secrets: SecretsConfig;
  artifacts: ArtifactConfig;
}

export interface PipelineConfig {
  stages: PipelineStage[];
  parallelism: number;
  timeout: number; // minutes
  retries: number;
  notifications: PipelineNotification[];
}

export interface PipelineStage {
  name: string;
  jobs: PipelineJob[];
  conditions: StageCondition[];
  approvals: ApprovalConfig[];
}

export interface PipelineJob {
  name: string;
  image: string;
  commands: string[];
  environment: Record<string, string>;
  artifacts: string[];
  dependencies: string[];
  timeout: number;
  retries: number;
}

export interface StageCondition {
  type: 'branch' | 'tag' | 'manual' | 'schedule';
  value: string;
}

export interface ApprovalConfig {
  required: boolean;
  approvers: string[];
  timeout: number; // hours
}

export interface PipelineNotification {
  events: string[];
  channels: NotificationChannel[];
}

export interface EnvironmentConfig {
  name: string;
  type: 'development' | 'staging' | 'production';
  variables: Record<string, string>;
  secrets: string[];
  protection: ProtectionConfig;
}

export interface ProtectionConfig {
  requiredReviewers: string[];
  deploymentBranches: string[];
  waitTimer: number; // minutes
}

export interface SecretsConfig {
  provider: 'vault' | 'aws_secrets' | 'azure_keyvault' | 'github_secrets';
  secrets: SecretDefinition[];
  rotation: RotationConfig;
}

export interface SecretDefinition {
  name: string;
  description: string;
  type: 'string' | 'json' | 'binary';
  environments: string[];
  rotation: boolean;
}

export interface RotationConfig {
  enabled: boolean;
  frequency: string; // cron expression
  notification: boolean;
}

export interface ArtifactConfig {
  storage: 's3' | 'gcs' | 'azure_blob' | 'artifactory';
  retention: number; // days
  compression: boolean;
  encryption: boolean;
}

// Security Configuration
export interface SecurityConfig {
  ssl: SSLConfig;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  scanning: SecurityScanningConfig;
  compliance: ComplianceConfig;
}

export interface SecurityScanningConfig {
  vulnerability: VulnerabilityScanConfig;
  dependency: DependencyScanConfig;
  code: CodeScanConfig;
  container: ContainerScanConfig;
}

export interface VulnerabilityScanConfig {
  enabled: boolean;
  tools: string[];
  schedule: string; // cron expression
  thresholds: SeverityThresholds;
}

export interface SeverityThresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DependencyScanConfig {
  enabled: boolean;
  tools: string[];
  autoFix: boolean;
  allowedLicenses: string[];
}

export interface CodeScanConfig {
  enabled: boolean;
  tools: string[];
  rules: string[];
  exclusions: string[];
}

export interface ContainerScanConfig {
  enabled: boolean;
  tools: string[];
  baseImages: string[];
  policies: string[];
}

export interface ComplianceConfig {
  standards: string[];
  auditing: boolean;
  reporting: boolean;
  remediation: boolean;
}

// Integrations Configuration
export interface IntegrationsConfig {
  supabase: SupabaseConfig;
  plaid: PlaidConfig;
  pwa: PWAConfig;
  monitoring: MonitoringIntegrations;
}

export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  database: SupabaseDatabaseConfig;
  auth: SupabaseAuthConfig;
  storage: SupabaseStorageConfig;
  realtime: SupabaseRealtimeConfig;
}

export interface SupabaseDatabaseConfig {
  pooling: boolean;
  ssl: boolean;
  backups: boolean;
  optimization: boolean;
}

export interface SupabaseAuthConfig {
  providers: string[];
  jwt: JWTConfig;
  mfa: boolean;
  rateLimit: RateLimitConfig;
}

export interface JWTConfig {
  secret: string;
  expiry: number; // seconds
  algorithm: string;
}

export interface SupabaseStorageConfig {
  buckets: StorageBucket[];
  cdn: boolean;
  transform: boolean;
}

export interface StorageBucket {
  name: string;
  public: boolean;
  allowedMimeTypes: string[];
  fileSizeLimit: number; // bytes
}

export interface SupabaseRealtimeConfig {
  enabled: boolean;
  channels: string[];
  presence: boolean;
}

export interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
  products: string[];
  countryCodes: string[];
  webhook: WebhookConfig;
}

export interface WebhookConfig {
  url: string;
  verification: boolean;
  retries: number;
  timeout: number;
}

export interface PWAConfig {
  enabled: boolean;
  manifest: PWAManifest;
  serviceWorker: ServiceWorkerConfig;
  appStore: AppStoreConfig;
}

export interface PWAManifest {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  display: string;
  themeColor: string;
  backgroundColor: string;
  icons: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface ServiceWorkerConfig {
  enabled: boolean;
  caching: ServiceWorkerCaching;
  backgroundSync: boolean;
  pushNotifications: boolean;
}

export interface ServiceWorkerCaching {
  runtime: CacheRuntimeConfig;
  precache: string[];
  strategies: CacheStrategyConfig[];
}

export interface CacheRuntimeConfig {
  maxEntries: number;
  maxAgeSeconds: number;
  purgeOnQuotaError: boolean;
}

export interface CacheStrategyConfig {
  pattern: string;
  strategy: 'cache_first' | 'network_first' | 'cache_only' | 'network_only' | 'stale_while_revalidate';
  options: any;
}

export interface AppStoreConfig {
  ios: IOSConfig;
  android: AndroidConfig;
  windows: WindowsConfig;
}

export interface IOSConfig {
  enabled: boolean;
  appId: string;
  bundleId: string;
  version: string;
  buildNumber: number;
}

export interface AndroidConfig {
  enabled: boolean;
  packageName: string;
  versionCode: number;
  versionName: string;
  keystore: KeystoreConfig;
}

export interface KeystoreConfig {
  file: string;
  alias: string;
  storePassword: string;
  keyPassword: string;
}

export interface WindowsConfig {
  enabled: boolean;
  packageId: string;
  version: string;
}

export interface MonitoringIntegrations {
  datadog: DatadogConfig;
  newRelic: NewRelicConfig;
  sentry: SentryConfig;
  customMetrics: CustomMetricsConfig;
}

export interface DatadogConfig {
  apiKey: string;
  appKey: string;
  site: string;
  tags: string[];
}

export interface NewRelicConfig {
  licenseKey: string;
  appId: string;
  region: string;
}

export interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  sampleRate: number;
}

export interface CustomMetricsConfig {
  endpoint: string;
  apiKey: string;
  format: 'prometheus' | 'json' | 'custom';
  frequency: number; // seconds
}

// Deployment Events and Results
export interface DeploymentEvent {
  id: string;
  type: 'deployment_started' | 'deployment_completed' | 'deployment_failed' | 'rollback_triggered' | 'rollback_completed';
  timestamp: Date;
  environment: string;
  version: string;
  metadata: any;
}

export interface DeploymentResult {
  id: string;
  status: 'success' | 'failed' | 'rollback' | 'cancelled';
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  environment: string;
  version: string;
  metrics: DeploymentMetrics;
  logs: DeploymentLog[];
  artifacts: string[];
}

export interface DeploymentMetrics {
  errorRate: number;
  responseTime: number;
  throughput: number;
  availability: number;
  performance: PerformanceMetrics;
  business: BusinessMetrics;
}

export interface PerformanceMetrics {
  webVitals: WebVitalMetrics;
  resources: ResourceMetrics;
  mobile: MobileMetrics;
}

export interface WebVitalMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  inp: number;
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface MobileMetrics {
  batteryUsage: number;
  dataUsage: number;
  loadTime: number;
  crashRate: number;
}

export interface BusinessMetrics {
  conversionRate: number;
  revenue: number;
  userEngagement: number;
  retention: number;
}

export interface DeploymentLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: string;
  metadata: any;
}

// Default Configuration
export const defaultProductionDeploymentConfig: ProductionDeploymentConfig = {
  projectId: 'clear-piggy-mobile',
  environment: 'production',
  deployment: {
    strategy: 'canary',
    canary: {
      enabled: true,
      initialTraffic: 5,
      trafficIncrements: [5, 10, 25, 50, 100],
      incrementInterval: 10,
      successCriteria: {
        errorRate: 1,
        responseTime: 500,
        availability: 99.9,
        customMetrics: []
      },
      analysisInterval: 5,
      maxDuration: 60
    },
    blueGreen: {
      enabled: false,
      switchTraffic: true,
      validateDuration: 10,
      rollbackOnFailure: true
    },
    rolling: {
      enabled: false,
      batchSize: 25,
      batchInterval: 30,
      maxUnavailable: 25,
      maxSurge: 25
    },
    validation: {
      preDeployment: [],
      postDeployment: [],
      staging: {
        mobileDeviceTesting: {
          devices: [],
          browsers: [],
          testSuites: [],
          performanceThresholds: {
            firstContentfulPaint: 1800,
            largestContentfulPaint: 2500,
            firstInputDelay: 100,
            cumulativeLayoutShift: 0.1,
            timeToInteractive: 3000,
            speedIndex: 2000
          }
        },
        performanceBaseline: {
          metrics: [],
          thresholds: {
            errorRate: 1,
            responseTime: 500,
            throughput: 1000,
            availability: 99.9,
            resourceUtilization: {
              cpu: 80,
              memory: 512,
              disk: 80,
              network: 100
            }
          },
          comparison: {
            baseline: 'main',
            tolerance: 10,
            minSampleSize: 100,
            confidenceLevel: 95
          }
        },
        integrationTests: [],
        securityScans: []
      },
      production: {
        healthChecks: [],
        smokTests: [],
        monitoringValidation: {
          metrics: [],
          alerts: [],
          dashboards: [],
          duration: 15
        }
      }
    },
    healthChecks: {
      liveness: {
        name: 'liveness',
        endpoint: '/health/live',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        interval: 30000,
        retries: 3
      },
      readiness: {
        name: 'readiness',
        endpoint: '/health/ready',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        interval: 10000,
        retries: 3
      },
      startup: {
        name: 'startup',
        endpoint: '/health/startup',
        method: 'GET',
        expectedStatus: 200,
        timeout: 30000,
        interval: 10000,
        retries: 10
      }
    },
    traffic: {
      loadBalancer: {
        algorithm: 'round_robin',
        healthCheck: {
          liveness: {
            name: 'liveness',
            endpoint: '/health/live',
            method: 'GET',
            expectedStatus: 200,
            timeout: 5000,
            interval: 30000,
            retries: 3
          },
          readiness: {
            name: 'readiness',
            endpoint: '/health/ready',
            method: 'GET',
            expectedStatus: 200,
            timeout: 5000,
            interval: 10000,
            retries: 3
          },
          startup: {
            name: 'startup',
            endpoint: '/health/startup',
            method: 'GET',
            expectedStatus: 200,
            timeout: 30000,
            interval: 10000,
            retries: 10
          }
        },
        sessionAffinity: false,
        stickySession: false
      },
      routing: {
        rules: [],
        fallback: {
          destination: 'main',
          statusCode: 503,
          message: 'Service temporarily unavailable'
        }
      },
      rateLimit: {
        enabled: true,
        requests: 1000,
        window: 60,
        burst: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
    }
  },
  featureFlags: {
    enabled: true,
    provider: 'custom',
    flags: [],
    rolloutStrategy: {
      type: 'percentage',
      stages: [],
      duration: 60,
      autoPromote: false,
      rollbackThreshold: 5
    },
    audienceSegmentation: {
      segments: [],
      rules: []
    }
  },
  monitoring: {
    enabled: true,
    providers: [],
    metrics: [],
    alerts: [],
    dashboards: [],
    logs: {
      level: 'info',
      format: 'json',
      retention: 30,
      aggregation: {
        enabled: true,
        rules: []
      }
    },
    traces: {
      enabled: true,
      provider: 'jaeger',
      sampleRate: 0.1,
      config: {}
    }
  },
  rollback: {
    enabled: true,
    triggers: [],
    strategy: {
      type: 'immediate',
      steps: [],
      verification: true,
      notification: true
    },
    automation: {
      enabled: true,
      approvalRequired: false,
      maxAttempts: 3,
      cooldownPeriod: 30
    },
    verification: {
      enabled: true,
      checks: [],
      timeout: 300
    }
  },
  cdn: {
    provider: 'cloudflare',
    config: {
      zones: [],
      origins: [],
      behaviors: []
    },
    caching: {
      defaultTtl: 3600,
      maxTtl: 86400,
      browserTtl: 1800,
      cacheRules: [],
      purging: {
        enabled: true,
        methods: ['POST', 'PUT', 'DELETE'],
        authentication: {}
      }
    },
    optimization: {
      minification: {
        html: true,
        css: true,
        javascript: true,
        removeComments: true,
        removeWhitespace: true
      },
      imageOptimization: {
        enabled: true,
        formats: ['webp', 'avif'],
        quality: 85,
        progressive: true,
        webp: true,
        avif: true
      },
      http2: true,
      brotli: true,
      earlyHints: true
    },
    security: {
      ssl: {
        enabled: true,
        mode: 'strict',
        certificate: {
          type: 'universal',
          domains: [],
          autoRenew: true
        },
        hsts: {
          enabled: true,
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      },
      waf: {
        enabled: true,
        mode: 'block',
        rules: [],
        customRules: []
      },
      ddos: {
        enabled: true,
        sensitivity: 'medium',
        action: 'block'
      },
      rateLimit: {
        enabled: true,
        requests: 1000,
        window: 60,
        burst: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
    },
    monitoring: {
      analytics: true,
      realUserMonitoring: true,
      alerts: []
    }
  },
  database: {
    optimization: {
      queryOptimization: {
        enabled: true,
        slowQueryThreshold: 1000,
        explainPlans: true,
        queryCache: true,
        preparedStatements: true
      },
      indexOptimization: {
        autoIndex: true,
        mobileQueries: [],
        indexAnalysis: true,
        unusedIndexCleanup: true
      },
      connectionPooling: {
        minConnections: 5,
        maxConnections: 20,
        idleTimeout: 600,
        connectionTimeout: 30,
        leakDetectionThreshold: 60
      },
      partitioning: {
        enabled: false,
        strategy: 'range',
        tables: []
      }
    },
    scaling: {
      readReplicas: [],
      connectionPooling: true,
      queryRouting: {
        readWrite: 'primary',
        readOnly: [],
        rules: []
      },
      sharding: {
        enabled: false,
        strategy: 'user_id',
        shards: []
      }
    },
    monitoring: {
      slowQueries: true,
      connectionMonitoring: true,
      performanceInsights: true,
      customMetrics: []
    },
    backup: {
      enabled: true,
      frequency: '0 2 * * *',
      retention: 30,
      compression: true,
      encryption: true,
      verification: true
    },
    security: {
      encryption: {
        atRest: true,
        inTransit: true,
        keyManagement: 'aws_kms',
        algorithm: 'AES-256'
      },
      authentication: {
        method: 'password',
        mfa: false,
        passwordPolicy: {
          minLength: 12,
          requireNumbers: true,
          requireSpecialChars: true,
          requireUppercase: true,
          requireLowercase: true,
          expiration: 90
        }
      },
      authorization: {
        rbac: true,
        roles: [],
        permissions: []
      },
      auditing: {
        enabled: true,
        events: ['login', 'logout', 'query', 'admin'],
        retention: 365,
        format: 'json'
      }
    }
  },
  caching: {
    layers: [],
    strategies: [],
    invalidation: {
      strategies: [],
      triggers: [],
      cascading: true
    },
    monitoring: {
      hitRate: true,
      missRate: true,
      evictions: true,
      memory: true,
      alerts: []
    }
  },
  cicd: {
    platform: 'github_actions',
    pipeline: {
      stages: [],
      parallelism: 4,
      timeout: 60,
      retries: 2,
      notifications: []
    },
    environments: [],
    secrets: {
      provider: 'github_secrets',
      secrets: [],
      rotation: {
        enabled: false,
        frequency: '0 0 1 * *',
        notification: true
      }
    },
    artifacts: {
      storage: 's3',
      retention: 30,
      compression: true,
      encryption: true
    }
  },
  security: {
    ssl: {
      enabled: true,
      mode: 'strict',
      certificate: {
        type: 'universal',
        domains: [],
        autoRenew: true
      },
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    authentication: {
      method: 'oauth',
      mfa: true,
      passwordPolicy: {
        minLength: 12,
        requireNumbers: true,
        requireSpecialChars: true,
        requireUppercase: true,
        requireLowercase: true,
        expiration: 90
      }
    },
    authorization: {
      rbac: true,
      roles: [],
      permissions: []
    },
    scanning: {
      vulnerability: {
        enabled: true,
        tools: ['snyk', 'trivy'],
        schedule: '0 2 * * *',
        thresholds: {
          critical: 0,
          high: 5,
          medium: 20,
          low: 100
        }
      },
      dependency: {
        enabled: true,
        tools: ['npm-audit', 'snyk'],
        autoFix: false,
        allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-3-Clause']
      },
      code: {
        enabled: true,
        tools: ['eslint', 'sonarqube'],
        rules: [],
        exclusions: []
      },
      container: {
        enabled: true,
        tools: ['trivy', 'clair'],
        baseImages: [],
        policies: []
      }
    },
    compliance: {
      standards: ['SOC2', 'GDPR'],
      auditing: true,
      reporting: true,
      remediation: true
    }
  },
  integrations: {
    supabase: {
      projectUrl: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      database: {
        pooling: true,
        ssl: true,
        backups: true,
        optimization: true
      },
      auth: {
        providers: ['email', 'google', 'apple'],
        jwt: {
          secret: process.env.JWT_SECRET || '',
          expiry: 3600,
          algorithm: 'HS256'
        },
        mfa: true,
        rateLimit: {
          enabled: true,
          requests: 60,
          window: 60,
          burst: 10,
          skipSuccessfulRequests: false,
          skipFailedRequests: false
        }
      },
      storage: {
        buckets: [],
        cdn: true,
        transform: true
      },
      realtime: {
        enabled: true,
        channels: [],
        presence: true
      }
    },
    plaid: {
      clientId: process.env.PLAID_CLIENT_ID || '',
      secret: process.env.PLAID_SECRET || '',
      environment: 'production',
      products: ['transactions', 'accounts', 'identity'],
      countryCodes: ['US'],
      webhook: {
        url: process.env.PLAID_WEBHOOK_URL || '',
        verification: true,
        retries: 3,
        timeout: 30
      }
    },
    pwa: {
      enabled: true,
      manifest: {
        name: 'Clear Piggy',
        shortName: 'Clear Piggy',
        description: 'Your personal finance management app',
        startUrl: '/',
        display: 'standalone',
        themeColor: '#0066cc',
        backgroundColor: '#ffffff',
        icons: []
      },
      serviceWorker: {
        enabled: true,
        caching: {
          runtime: {
            maxEntries: 50,
            maxAgeSeconds: 86400,
            purgeOnQuotaError: true
          },
          precache: [],
          strategies: []
        },
        backgroundSync: true,
        pushNotifications: true
      },
      appStore: {
        ios: {
          enabled: false,
          appId: '',
          bundleId: 'com.clearpiggy.app',
          version: '1.0.0',
          buildNumber: 1
        },
        android: {
          enabled: false,
          packageName: 'com.clearpiggy.app',
          versionCode: 1,
          versionName: '1.0.0',
          keystore: {
            file: '',
            alias: '',
            storePassword: '',
            keyPassword: ''
          }
        },
        windows: {
          enabled: false,
          packageId: 'ClearPiggy.App',
          version: '1.0.0'
        }
      }
    },
    monitoring: {
      datadog: {
        apiKey: process.env.DATADOG_API_KEY || '',
        appKey: process.env.DATADOG_APP_KEY || '',
        site: 'datadoghq.com',
        tags: []
      },
      newRelic: {
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
        appId: process.env.NEW_RELIC_APP_ID || '',
        region: 'US'
      },
      sentry: {
        dsn: process.env.SENTRY_DSN || '',
        environment: 'production',
        release: process.env.RELEASE_VERSION || '',
        sampleRate: 1.0
      },
      customMetrics: {
        endpoint: process.env.CUSTOM_METRICS_ENDPOINT || '',
        apiKey: process.env.CUSTOM_METRICS_API_KEY || '',
        format: 'prometheus',
        frequency: 60
      }
    }
  }
};