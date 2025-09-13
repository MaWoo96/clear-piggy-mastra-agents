/**
 * Comprehensive type definitions for Clear Piggy Mobile Testing Agent
 * Supports Cypress, Playwright, accessibility, visual regression, and performance testing
 */

// Base testing configuration
export interface MobileTestingConfig {
  projectPath: string;
  testOutputPath: string;
  componentPaths: string[];
  testFrameworks: TestFramework[];
  mobileDevices: MobileDevice[];
  browsers: Browser[];
  networkConditions: NetworkCondition[];
  accessibilityLevel: AccessibilityLevel;
  visualRegressionConfig: VisualRegressionConfig;
  performanceThresholds: PerformanceThresholds;
  cicdIntegration: CICDConfig;
}

// Test frameworks
export type TestFramework = 'cypress' | 'playwright' | 'jest' | 'testing-library';

// Mobile devices for testing
export interface MobileDevice {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  touchEnabled: boolean;
  orientation: 'portrait' | 'landscape';
  type: 'phone' | 'tablet';
}

// Browser configurations
export interface Browser {
  name: 'chrome' | 'firefox' | 'safari' | 'edge';
  version?: string;
  headless: boolean;
  mobileEmulation: boolean;
}

// Network conditions for performance testing
export interface NetworkCondition {
  name: string;
  downloadThroughput: number; // bytes per second
  uploadThroughput: number;   // bytes per second
  latency: number;            // milliseconds
  description: string;
}

// Accessibility testing levels
export type AccessibilityLevel = 'A' | 'AA' | 'AAA';

// Visual regression testing configuration
export interface VisualRegressionConfig {
  enabled: boolean;
  threshold: number; // percentage difference threshold
  baselineDir: string;
  screenshotDir: string;
  diffDir: string;
  fullPage: boolean;
  hideElements: string[];
  maskElements: string[];
}

// Performance testing thresholds
export interface PerformanceThresholds {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  scrollPerformance: {
    maxFrameTime: number;
    targetFPS: number;
  };
  touchResponse: {
    maxDelay: number;
    targetDelay: number;
  };
}

// CI/CD integration configuration
export interface CICDConfig {
  provider: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops';
  testEnvironments: string[];
  parallelization: number;
  retryAttempts: number;
  reportFormat: ReportFormat[];
  notifications: NotificationConfig;
}

// Test report formats
export type ReportFormat = 'html' | 'json' | 'junit' | 'allure' | 'mochawesome';

// Notification configuration
export interface NotificationConfig {
  slack?: SlackConfig;
  email?: EmailConfig;
  webhook?: WebhookConfig;
}

export interface SlackConfig {
  webhookUrl: string;
  channel: string;
  mentionOnFailure: string[];
}

export interface EmailConfig {
  recipients: string[];
  smtpConfig: any;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
}

// Test scenario types
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: TestScenarioType;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  mobileSpecific: boolean;
  estimatedDuration: number; // seconds
  setup?: TestSetupStep[];
  steps: TestStep[];
  assertions: TestAssertion[];
  teardown?: TestTeardownStep[];
}

export type TestScenarioType = 
  | 'functional' 
  | 'performance' 
  | 'accessibility' 
  | 'visual' 
  | 'touch-interaction' 
  | 'offline' 
  | 'responsive';

// Test steps and actions
export interface TestStep {
  id: string;
  description: string;
  action: TestAction;
  selector?: string;
  data?: any;
  waitCondition?: WaitCondition;
  screenshot?: boolean;
  performanceMarker?: string;
}

export interface TestSetupStep extends TestStep {
  setupType: 'data' | 'environment' | 'authentication' | 'navigation';
}

export interface TestTeardownStep extends TestStep {
  cleanupType: 'data' | 'storage' | 'cache' | 'session';
}

// Test actions
export type TestAction = 
  | 'visit'
  | 'click' 
  | 'tap'
  | 'swipe'
  | 'scroll'
  | 'type'
  | 'select'
  | 'drag'
  | 'pinch'
  | 'zoom'
  | 'rotate'
  | 'wait'
  | 'assert'
  | 'screenshot'
  | 'performanceSnapshot';

// Wait conditions
export interface WaitCondition {
  type: 'element' | 'network' | 'timeout' | 'custom';
  selector?: string;
  timeout: number;
  condition?: string;
}

// Test assertions
export interface TestAssertion {
  id: string;
  type: AssertionType;
  target: string;
  expected: any;
  tolerance?: number;
  message: string;
}

export type AssertionType = 
  | 'visible'
  | 'text'
  | 'attribute'
  | 'css'
  | 'count'
  | 'performance'
  | 'accessibility'
  | 'responsive'
  | 'visual-diff';

// Component analysis for test generation
export interface ComponentAnalysis {
  filePath: string;
  componentName: string;
  componentType: ComponentType;
  props: PropAnalysis[];
  state: StateAnalysis[];
  hooks: HookAnalysis[];
  events: EventAnalysis[];
  children: ComponentAnalysis[];
  mobileOptimizations: MobileOptimization[];
  testGenerationHints: TestGenerationHint[];
}

export type ComponentType = 
  | 'functional' 
  | 'class' 
  | 'form' 
  | 'list' 
  | 'chart' 
  | 'navigation' 
  | 'modal' 
  | 'button';

export interface PropAnalysis {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  validation?: string;
}

export interface StateAnalysis {
  name: string;
  type: string;
  initialValue: any;
  updaters: string[];
}

export interface HookAnalysis {
  name: string;
  type: string;
  dependencies: string[];
  cleanup?: boolean;
}

export interface EventAnalysis {
  name: string;
  type: 'click' | 'touch' | 'scroll' | 'input' | 'custom';
  handler: string;
  preventDefault: boolean;
  touchSupport: boolean;
}

export interface MobileOptimization {
  type: 'touch-target' | 'viewport' | 'gesture' | 'performance';
  description: string;
  implementation: string;
}

export interface TestGenerationHint {
  scenario: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  suggestedTests: string[];
}

// Test data generation
export interface TestDataSet {
  name: string;
  description: string;
  type: 'financial' | 'user' | 'transaction' | 'budget' | 'account';
  schema: DataSchema;
  generators: DataGenerator[];
  mobileSpecific: boolean;
  size: 'small' | 'medium' | 'large';
}

export interface DataSchema {
  fields: SchemaField[];
  relationships: DataRelationship[];
  constraints: DataConstraint[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'currency' | 'array' | 'object';
  required: boolean;
  validation?: ValidationRule[];
  mobileFormatting?: string;
}

export interface DataRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  source: string;
  target: string;
  foreignKey: string;
}

export interface DataConstraint {
  field: string;
  type: 'unique' | 'range' | 'format' | 'custom';
  rule: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface DataGenerator {
  field: string;
  strategy: GenerationStrategy;
  parameters: Record<string, any>;
}

export type GenerationStrategy = 
  | 'faker'
  | 'sequential'
  | 'random'
  | 'fixed'
  | 'realistic-financial'
  | 'mobile-optimized';

// Test execution results
export interface TestExecutionResult {
  suiteId: string;
  suiteName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: TestStatus;
  framework: TestFramework;
  device: MobileDevice;
  browser: Browser;
  networkCondition?: NetworkCondition;
  scenarios: ScenarioResult[];
  performance: PerformanceMetrics;
  accessibility: AccessibilityResult;
  visualRegression: VisualRegressionResult;
  errors: TestError[];
  artifacts: TestArtifact[];
}

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'flaky';

export interface ScenarioResult {
  scenarioId: string;
  status: TestStatus;
  duration: number;
  steps: StepResult[];
  assertions: AssertionResult[];
  screenshots: string[];
  videos?: string[];
  logs: LogEntry[];
}

export interface StepResult {
  stepId: string;
  status: TestStatus;
  duration: number;
  error?: string;
  screenshot?: string;
  performanceData?: any;
}

export interface AssertionResult {
  assertionId: string;
  status: TestStatus;
  actual: any;
  expected: any;
  tolerance?: number;
  error?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: 'test' | 'browser' | 'network' | 'application';
}

// Performance metrics
export interface PerformanceMetrics {
  webVitals: WebVitals;
  customMetrics: CustomMetric[];
  networkMetrics: NetworkMetrics;
  resourceMetrics: ResourceMetric[];
  touchMetrics: TouchMetrics;
  scrollMetrics: ScrollMetrics;
}

export interface WebVitals {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  passed: boolean;
}

export interface NetworkMetrics {
  totalRequests: number;
  totalBytes: number;
  averageResponseTime: number;
  slowestRequest: string;
  failedRequests: number;
}

export interface ResourceMetric {
  type: 'js' | 'css' | 'image' | 'font' | 'api';
  count: number;
  totalSize: number;
  averageLoadTime: number;
  largestResource: string;
}

export interface TouchMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  touchPoints: number;
  gestureAccuracy: number;
  falseTouch: number;
}

export interface ScrollMetrics {
  averageFPS: number;
  minFPS: number;
  frameDrops: number;
  scrollDistance: number;
  smoothness: number;
}

// Accessibility testing results
export interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityIncomplete[];
  score: number;
  level: AccessibilityLevel;
  summary: AccessibilitySummary;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityPass {
  id: string;
  description: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityIncomplete {
  id: string;
  description: string;
  reason: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityNode {
  target: string[];
  html: string;
  failureSummary?: string;
  element?: any;
}

export interface AccessibilitySummary {
  total: number;
  violations: number;
  passes: number;
  incomplete: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// Visual regression testing results
export interface VisualRegressionResult {
  totalScreenshots: number;
  passedScreenshots: number;
  failedScreenshots: number;
  newScreenshots: number;
  comparisons: VisualComparison[];
  summary: VisualRegressionSummary;
}

export interface VisualComparison {
  name: string;
  baseline: string;
  current: string;
  diff?: string;
  status: 'passed' | 'failed' | 'new';
  diffPercentage: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface VisualRegressionSummary {
  totalPixels: number;
  changedPixels: number;
  percentageChanged: number;
  threshold: number;
  passed: boolean;
}

// Test errors and issues
export interface TestError {
  type: 'assertion' | 'timeout' | 'network' | 'element' | 'performance' | 'accessibility';
  message: string;
  stack?: string;
  screenshot?: string;
  element?: string;
  step?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mobileSpecific: boolean;
}

// Test artifacts
export interface TestArtifact {
  type: 'screenshot' | 'video' | 'log' | 'report' | 'trace' | 'coverage';
  name: string;
  path: string;
  size: number;
  description: string;
  mimeType: string;
}

// Test suite generation configuration
export interface TestSuiteGenerationConfig {
  scenarios: TestScenarioType[];
  coverage: CoverageTarget[];
  complexity: 'basic' | 'comprehensive' | 'exhaustive';
  includeEdgeCases: boolean;
  includeErrorStates: boolean;
  includeMobileGestures: boolean;
  includeOfflineTesting: boolean;
  dataSetSize: 'small' | 'medium' | 'large';
  parallelization: boolean;
}

export interface CoverageTarget {
  type: 'component' | 'feature' | 'user-journey' | 'api' | 'accessibility';
  target: string;
  percentage: number;
}

// Predefined mobile devices
export const MOBILE_DEVICES: Record<string, MobileDevice> = {
  iPhone12: {
    name: 'iPhone 12',
    width: 390,
    height: 844,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'phone'
  },
  iPhone12Pro: {
    name: 'iPhone 12 Pro',
    width: 390,
    height: 844,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'phone'
  },
  iPhone13ProMax: {
    name: 'iPhone 13 Pro Max',
    width: 428,
    height: 926,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'phone'
  },
  galaxyS21: {
    name: 'Samsung Galaxy S21',
    width: 360,
    height: 800,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'phone'
  },
  galaxyS21Ultra: {
    name: 'Samsung Galaxy S21 Ultra',
    width: 384,
    height: 854,
    pixelRatio: 3.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'phone'
  },
  pixel6: {
    name: 'Google Pixel 6',
    width: 393,
    height: 851,
    pixelRatio: 2.75,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'phone'
  },
  iPadAir: {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'tablet'
  },
  iPadPro11: {
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'tablet'
  },
  galaxyTab: {
    name: 'Samsung Galaxy Tab S7',
    width: 753,
    height: 1037,
    pixelRatio: 2.4,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-T870) AppleWebKit/537.36',
    touchEnabled: true,
    orientation: 'portrait',
    type: 'tablet'
  }
};

// Predefined network conditions
export const NETWORK_CONDITIONS: Record<string, NetworkCondition> = {
  '3G_SLOW': {
    name: '3G Slow',
    downloadThroughput: 400 * 1024, // 400 KB/s
    uploadThroughput: 400 * 1024,
    latency: 400,
    description: 'Slow 3G connection with high latency'
  },
  '3G_FAST': {
    name: '3G Fast',
    downloadThroughput: 1.6 * 1024 * 1024, // 1.6 MB/s
    uploadThroughput: 750 * 1024,
    latency: 150,
    description: 'Fast 3G connection'
  },
  '4G': {
    name: '4G',
    downloadThroughput: 9 * 1024 * 1024, // 9 MB/s
    uploadThroughput: 9 * 1024 * 1024,
    latency: 170,
    description: 'Regular 4G LTE connection'
  },
  '4G_FAST': {
    name: '4G Fast',
    downloadThroughput: 20 * 1024 * 1024, // 20 MB/s
    uploadThroughput: 20 * 1024 * 1024,
    latency: 50,
    description: 'Fast 4G LTE connection'
  },
  WIFI: {
    name: 'WiFi',
    downloadThroughput: 50 * 1024 * 1024, // 50 MB/s
    uploadThroughput: 50 * 1024 * 1024,
    latency: 20,
    description: 'Regular WiFi connection'
  },
  OFFLINE: {
    name: 'Offline',
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
    description: 'No network connection'
  }
};

// Default performance thresholds
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  firstContentfulPaint: 1800,
  largestContentfulPaint: 2500,
  firstInputDelay: 100,
  cumulativeLayoutShift: 0.1,
  timeToInteractive: 3800,
  totalBlockingTime: 300,
  scrollPerformance: {
    maxFrameTime: 16.67, // 60 FPS
    targetFPS: 60
  },
  touchResponse: {
    maxDelay: 50,
    targetDelay: 30
  }
};