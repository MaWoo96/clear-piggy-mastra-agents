/**
 * Performance Optimization Types for Clear Piggy Mobile React App
 * Comprehensive interfaces for mobile performance analysis and optimization
 */

export interface PerformanceOptimizationConfig {
  projectPath: string;
  outputPath: string;
  buildPath: string;
  sourcePath: string;
  assetsPath: string;
  
  // Analysis configuration
  enableBundleAnalysis: boolean;
  enableImageOptimization: boolean;
  enableComponentAnalysis: boolean;
  enableServiceWorker: boolean;
  enablePWASetup: boolean;
  enablePerformanceMonitoring: boolean;
  
  // Performance thresholds
  bundleSizeLimit: number; // KB
  chunkSizeLimit: number; // KB
  imageCompressionQuality: number; // 0-100
  lazyLoadThreshold: number; // pixels
  cacheStrategyDuration: number; // seconds
  
  // Integration settings
  supabaseEdgeFunctions: boolean;
  plaidAPIOptimization: boolean;
  tailwindPurging: boolean;
  webpConversion: boolean;
}

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: BundleChunk[];
  dependencies: DependencyAnalysis[];
  recommendations: CodeSplittingRecommendation[];
  treeshakingOpportunities: TreeshakingOpportunity[];
}

export interface BundleChunk {
  name: string;
  size: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  loadPriority: 'high' | 'medium' | 'low';
  splittingRecommendation: string;
}

export interface ModuleInfo {
  name: string;
  size: number;
  reasons: string[];
  isAsync: boolean;
  optimizationSuggestions: string[];
}

export interface DependencyAnalysis {
  name: string;
  size: number;
  usage: 'heavy' | 'moderate' | 'light' | 'unused';
  alternatives: string[];
  treeShakeable: boolean;
  recommendation: string;
}

export interface CodeSplittingRecommendation {
  type: 'route' | 'component' | 'vendor' | 'feature';
  target: string;
  currentSize: number;
  potentialSavings: number;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface TreeshakingOpportunity {
  library: string;
  unusedExports: string[];
  potentialSavings: number;
  implementation: string;
}

export interface ImageOptimizationAnalysis {
  totalImages: number;
  totalSize: number;
  optimizationOpportunities: ImageOptimization[];
  webpCandidates: string[];
  responsiveImageNeeds: ResponsiveImageRecommendation[];
}

export interface ImageOptimization {
  filePath: string;
  originalSize: number;
  optimizedSize: number;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  quality: number;
  dimensions: { width: number; height: number };
  usage: 'hero' | 'thumbnail' | 'icon' | 'background';
  lazyLoadCandidate: boolean;
}

export interface ResponsiveImageRecommendation {
  filePath: string;
  breakpoints: ResponsiveBreakpoint[];
  srcSetGeneration: string;
  sizesAttribute: string;
}

export interface ResponsiveBreakpoint {
  breakpoint: number;
  width: number;
  quality: number;
  format: string;
}

export interface ComponentPerformanceAnalysis {
  componentName: string;
  filePath: string;
  performanceScore: number;
  issues: PerformanceIssue[];
  optimizations: ComponentOptimization[];
  memoizationOpportunities: MemoizationOpportunity[];
  rerenderAnalysis: RerenderAnalysis;
}

export interface PerformanceIssue {
  type: 'heavy-computation' | 'frequent-rerender' | 'large-props' | 'inefficient-hooks' | 'memory-leak';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  solution: string;
  codeExample: string;
}

export interface ComponentOptimization {
  type: 'memo' | 'useMemo' | 'useCallback' | 'lazy' | 'virtualization' | 'code-splitting';
  target: string;
  implementation: string;
  expectedImprovement: string;
  tradeoffs: string[];
}

export interface MemoizationOpportunity {
  hookType: 'useMemo' | 'useCallback' | 'React.memo';
  target: string;
  dependencies: string[];
  currentCode: string;
  optimizedCode: string;
  benefit: string;
}

export interface RerenderAnalysis {
  renderFrequency: 'high' | 'medium' | 'low';
  renderTriggers: string[];
  unnecessaryRenders: number;
  optimizationPotential: number;
}

export interface LazyLoadingSetup {
  transactionListOptimization: TransactionListLazyLoading;
  imageComponents: ImageLazyLoading[];
  routeLazyLoading: RouteLazyLoading[];
  componentLazyLoading: ComponentLazyLoading[];
}

export interface TransactionListLazyLoading {
  virtualScrolling: VirtualScrollConfig;
  infiniteScroll: InfiniteScrollConfig;
  dataFetching: LazyDataFetching;
  preloadStrategy: PreloadStrategy;
}

export interface VirtualScrollConfig {
  itemHeight: number;
  bufferSize: number;
  overscanCount: number;
  implementation: string;
  library: '@tanstack/react-virtual' | 'react-window' | 'react-virtualized';
}

export interface InfiniteScrollConfig {
  pageSize: number;
  threshold: number;
  preloadPages: number;
  errorHandling: string;
  loadingComponent: string;
}

export interface LazyDataFetching {
  strategy: 'intersection-observer' | 'scroll-based' | 'time-based';
  cacheStrategy: 'memory' | 'local-storage' | 'session-storage';
  staleTime: number;
  prefetchStrategy: string;
}

export interface PreloadStrategy {
  enabled: boolean;
  triggers: string[];
  preloadCount: number;
  implementation: string;
}

export interface ImageLazyLoading {
  selector: string;
  threshold: number;
  rootMargin: string;
  placeholderStrategy: 'blur' | 'skeleton' | 'color' | 'none';
  fallbackStrategy: string;
}

export interface RouteLazyLoading {
  route: string;
  componentPath: string;
  preloadConditions: string[];
  errorBoundary: string;
  loadingComponent: string;
}

export interface ComponentLazyLoading {
  componentName: string;
  trigger: 'viewport' | 'interaction' | 'route' | 'data';
  suspenseFallback: string;
  errorHandling: string;
}

export interface ServiceWorkerConfig {
  enabled: boolean;
  cacheStrategy: CacheStrategy[];
  offlinePages: string[];
  backgroundSync: BackgroundSyncConfig;
  pushNotifications: boolean;
  updateStrategy: 'immediate' | 'on-reload' | 'manual';
}

export interface CacheStrategy {
  pattern: string;
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate';
  maxAge: number;
  maxEntries: number;
  purgeOnUpdate: boolean;
}

export interface BackgroundSyncConfig {
  enabled: boolean;
  syncTags: string[];
  fallbackBehavior: string;
  retryStrategy: RetryStrategy;
}

export interface RetryStrategy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface PWAConfig {
  manifestConfig: WebAppManifest;
  installPrompt: InstallPromptConfig;
  splashScreens: SplashScreenConfig[];
  shortcuts: AppShortcut[];
  categories: string[];
  screenshots: Screenshot[];
}

export interface WebAppManifest {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
  startUrl: string;
  scope: string;
  icons: ManifestIcon[];
}

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: 'any' | 'maskable' | 'monochrome';
}

export interface InstallPromptConfig {
  enabled: boolean;
  triggerEvents: string[];
  customPromptDesign: boolean;
  deferralStrategy: string;
}

export interface SplashScreenConfig {
  platform: 'ios' | 'android' | 'web';
  sizes: string;
  backgroundColor: string;
  image: string;
}

export interface AppShortcut {
  name: string;
  shortName: string;
  description: string;
  url: string;
  icons: ManifestIcon[];
}

export interface Screenshot {
  src: string;
  sizes: string;
  type: string;
  platform: 'wide' | 'narrow';
  label: string;
}

export interface PerformanceMonitoring {
  webVitals: WebVitalsConfig;
  customMetrics: CustomMetric[];
  alerting: AlertingConfig;
  reporting: ReportingConfig;
  realUserMonitoring: RUMConfig;
}

export interface WebVitalsConfig {
  trackFCP: boolean; // First Contentful Paint
  trackLCP: boolean; // Largest Contentful Paint
  trackFID: boolean; // First Input Delay
  trackCLS: boolean; // Cumulative Layout Shift
  trackTTFB: boolean; // Time to First Byte
  thresholds: PerformanceThresholds;
}

export interface PerformanceThresholds {
  fcp: { good: number; needsImprovement: number };
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

export interface CustomMetric {
  name: string;
  description: string;
  measurement: string;
  threshold: number;
  alertOnBreach: boolean;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertRule {
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportingConfig {
  interval: 'hourly' | 'daily' | 'weekly';
  format: 'json' | 'csv' | 'html';
  destination: 'file' | 'api' | 'database';
  includeCharts: boolean;
}

export interface RUMConfig {
  sampleRate: number;
  enabledMetrics: string[];
  sessionRecording: boolean;
  errorTracking: boolean;
  userJourneyTracking: boolean;
}

export interface APIOptimization {
  supabaseOptimizations: SupabaseOptimization[];
  plaidOptimizations: PlaidOptimization[];
  caching: APICacheStrategy[];
  batchingStrategy: RequestBatchingStrategy;
}

export interface SupabaseOptimization {
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  optimization: string;
  implementation: string;
  expectedImprovement: string;
  edgeFunctionCandidate: boolean;
}

export interface PlaidOptimization {
  apiCall: string;
  currentImplementation: string;
  optimizedImplementation: string;
  cachingStrategy: string;
  errorHandling: string;
}

export interface APICacheStrategy {
  pattern: string;
  strategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  ttl: number;
  invalidationTriggers: string[];
}

export interface RequestBatchingStrategy {
  enabled: boolean;
  batchSize: number;
  batchDelay: number;
  endpoints: string[];
  implementation: string;
}

export interface TailwindOptimization {
  purgeConfig: PurgeConfig;
  customUtilities: CustomUtilityOptimization[];
  bundleSizeReduction: number;
  unusedClasses: string[];
}

export interface PurgeConfig {
  enabled: boolean;
  safeList: string[];
  blocklist: string[];
  keyframes: boolean;
  fontFace: boolean;
  variables: boolean;
}

export interface CustomUtilityOptimization {
  utility: string;
  usage: number;
  alternative: string;
  recommendation: string;
}

export interface OptimizationResult {
  success: boolean;
  optimizations: PerformanceOptimization[];
  errors: OptimizationError[];
  warnings: string[];
  summary: OptimizationSummary;
  generatedFiles: GeneratedFile[];
}

export interface PerformanceOptimization {
  type: 'bundle' | 'image' | 'component' | 'api' | 'caching' | 'pwa' | 'service-worker';
  description: string;
  implementation: string;
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface OptimizationError {
  type: string;
  message: string;
  file?: string;
  line?: number;
  solution: string;
}

export interface OptimizationSummary {
  totalOptimizations: number;
  bundleSizeReduction: number;
  performanceScoreImprovement: number;
  estimatedLoadTimeReduction: number;
  implementedOptimizations: number;
  pendingOptimizations: number;
}

export interface GeneratedFile {
  filePath: string;
  type: 'component' | 'config' | 'service-worker' | 'manifest' | 'optimization';
  size: number;
  description: string;
}

export interface LoadingStateOptimization {
  skeletonScreens: SkeletonScreen[];
  loadingIndicators: LoadingIndicator[];
  progressiveLoading: ProgressiveLoadingStrategy[];
  errorBoundaries: ErrorBoundaryConfig[];
}

export interface SkeletonScreen {
  componentName: string;
  implementation: string;
  dimensions: { width: string; height: string };
  animationType: 'pulse' | 'wave' | 'shimmer' | 'none';
  customization: Record<string, any>;
}

export interface LoadingIndicator {
  type: 'spinner' | 'progress-bar' | 'skeleton' | 'custom';
  implementation: string;
  triggers: string[];
  position: 'inline' | 'overlay' | 'fixed';
  customization: Record<string, any>;
}

export interface ProgressiveLoadingStrategy {
  phase: string;
  content: string[];
  priority: number;
  loadingMethod: 'eager' | 'lazy' | 'conditional';
}

export interface ErrorBoundaryConfig {
  scope: 'global' | 'route' | 'component';
  fallbackComponent: string;
  errorReporting: boolean;
  retryMechanism: boolean;
  userFeedback: boolean;
}