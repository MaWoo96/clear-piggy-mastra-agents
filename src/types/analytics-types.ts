export interface MobileAnalyticsConfig {
  projectId: string;
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  supabase: SupabaseAnalyticsConfig;
  webVitals: WebVitalsConfig;
  userInteraction: UserInteractionConfig;
  errorTracking: ErrorTrackingConfig;
  performanceMonitoring: PerformanceMonitoringConfig;
  abTesting: ABTestingConfig;
  realUserMonitoring: RUMConfig;
  performanceBudgets: PerformanceBudgetConfig;
  financialMetrics: FinancialMetricsConfig;
  alerts: AlertConfig;
  reporting: ReportingConfig;
}

export interface SupabaseAnalyticsConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  tables: {
    webVitals: string;
    userInteractions: string;
    errors: string;
    performances: string;
    abTests: string;
    sessions: string;
    financialMetrics: string;
  };
  batchSize: number;
  flushInterval: number;
  enableCompression: boolean;
}

export interface WebVitalsConfig {
  enabled: boolean;
  metrics: WebVitalMetric[];
  thresholds: WebVitalsThresholds;
  reportingInterval: number;
  sampleRate: number;
  enableAttribution: boolean;
}

export interface WebVitalMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  enabled: boolean;
  threshold: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
}

export interface WebVitalsThresholds {
  FCP: { good: number; needsImprovement: number; poor: number };
  LCP: { good: number; needsImprovement: number; poor: number };
  FID: { good: number; needsImprovement: number; poor: number };
  CLS: { good: number; needsImprovement: number; poor: number };
  TTFB: { good: number; needsImprovement: number; poor: number };
  INP: { good: number; needsImprovement: number; poor: number };
}

export interface UserInteractionConfig {
  enabled: boolean;
  heatmaps: HeatmapConfig;
  scrollTracking: ScrollTrackingConfig;
  touchTracking: TouchTrackingConfig;
  formAnalytics: FormAnalyticsConfig;
  navigationTracking: NavigationTrackingConfig;
  sampleRate: number;
}

export interface HeatmapConfig {
  enabled: boolean;
  maxPoints: number;
  sessionTimeout: number;
  excludeSelectors: string[];
  includeSelectors: string[];
  trackClicks: boolean;
  trackMoves: boolean;
  trackScrolls: boolean;
}

export interface ScrollTrackingConfig {
  enabled: boolean;
  thresholds: number[];
  debounceMs: number;
  trackDirection: boolean;
  trackVelocity: boolean;
}

export interface TouchTrackingConfig {
  enabled: boolean;
  trackTaps: boolean;
  trackSwipes: boolean;
  trackPinches: boolean;
  trackLongPress: boolean;
  minimumDistance: number;
  maximumTime: number;
}

export interface FormAnalyticsConfig {
  enabled: boolean;
  trackFieldFocus: boolean;
  trackFieldBlur: boolean;
  trackInputChanges: boolean;
  trackFormSubmissions: boolean;
  trackValidationErrors: boolean;
  excludeFields: string[];
}

export interface NavigationTrackingConfig {
  enabled: boolean;
  trackPageViews: boolean;
  trackRouteChanges: boolean;
  trackBackButton: boolean;
  trackExternalLinks: boolean;
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  captureUnhandledExceptions: boolean;
  captureUnhandledRejections: boolean;
  captureConsoleErrors: boolean;
  captureNetworkErrors: boolean;
  captureMobileSpecificErrors: boolean;
  maxErrorsPerSession: number;
  stackTraceLimit: number;
  filterUrls: string[];
  ignoreErrors: string[];
}

export interface PerformanceMonitoringConfig {
  enabled: boolean;
  resourceTiming: boolean;
  navigationTiming: boolean;
  userTiming: boolean;
  longTasks: boolean;
  memoryInfo: boolean;
  networkInfo: boolean;
  deviceInfo: boolean;
  batteryInfo: boolean;
  sampleRate: number;
}

export interface ABTestingConfig {
  enabled: boolean;
  provider: 'internal' | 'optimizely' | 'google-optimize' | 'custom';
  experiments: ABExperiment[];
  defaultVariation: string;
  enableForMobile: boolean;
  persistVariations: boolean;
  respectDoNotTrack: boolean;
}

export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variations: ABVariation[];
  targetingRules: TargetingRule[];
  trafficAllocation: number;
  goals: ABGoal[];
  startDate?: Date;
  endDate?: Date;
}

export interface ABVariation {
  id: string;
  name: string;
  description: string;
  weight: number;
  changes: VariationChange[];
}

export interface VariationChange {
  type: 'element' | 'style' | 'attribute' | 'redirect' | 'code';
  selector?: string;
  property?: string;
  value: any;
}

export interface TargetingRule {
  type: 'device' | 'browser' | 'location' | 'custom';
  condition: 'equals' | 'contains' | 'starts_with' | 'regex';
  value: any;
}

export interface ABGoal {
  id: string;
  name: string;
  type: 'page_view' | 'click' | 'form_submit' | 'custom_event' | 'revenue';
  selector?: string;
  eventName?: string;
  value?: number;
}

export interface RUMConfig {
  enabled: boolean;
  sampleRate: number;
  sessionTimeout: number;
  maxSessionLength: number;
  trackUserAgent: boolean;
  trackViewport: boolean;
  trackConnection: boolean;
  trackMemory: boolean;
  trackBattery: boolean;
  trackGeolocation: boolean;
  anonymizeIP: boolean;
}

export interface PerformanceBudgetConfig {
  enabled: boolean;
  budgets: PerformanceBudget[];
  alertThreshold: number;
  checkInterval: number;
  enableAutoOptimization: boolean;
}

export interface PerformanceBudget {
  id: string;
  name: string;
  metric: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'bundle_size' | 'requests' | 'custom';
  threshold: number;
  device: 'mobile' | 'tablet' | 'desktop' | 'all';
  network: '3g' | '4g' | 'wifi' | 'all';
  enabled: boolean;
  alertOnBreach: boolean;
}

export interface FinancialMetricsConfig {
  enabled: boolean;
  trackTransactionFlow: boolean;
  trackBudgetCreation: boolean;
  trackAccountConnection: boolean;
  trackCategoryManagement: boolean;
  trackGoalProgress: boolean;
  funnelAnalysis: FunnelAnalysisConfig;
  conversionTracking: ConversionTrackingConfig;
}

export interface FunnelAnalysisConfig {
  enabled: boolean;
  funnels: FunnelDefinition[];
  abandonmentTracking: boolean;
  stepTimeouts: number[];
}

export interface FunnelDefinition {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversionWindow: number;
  excludeInternalUsers: boolean;
}

export interface FunnelStep {
  id: string;
  name: string;
  event: string;
  selector?: string;
  url?: string;
  required: boolean;
}

export interface ConversionTrackingConfig {
  enabled: boolean;
  goals: ConversionGoal[];
  attributionWindow: number;
  enableCrossPlatform: boolean;
}

export interface ConversionGoal {
  id: string;
  name: string;
  type: 'transaction_complete' | 'budget_created' | 'account_connected' | 'goal_achieved' | 'custom';
  value?: number;
  currency?: string;
  conditions: GoalCondition[];
}

export interface GoalCondition {
  type: 'event' | 'page' | 'element' | 'time' | 'value';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
  escalation: EscalationRule[];
  rateLimiting: RateLimitingConfig;
}

export interface AlertChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  enabled: boolean;
  config: {
    [key: string]: any;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percent';
  threshold: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  suppressDuration: number;
}

export interface EscalationRule {
  id: string;
  severity: 'high' | 'critical';
  escalateAfter: number;
  escalateToChannels: string[];
}

export interface RateLimitingConfig {
  enabled: boolean;
  maxAlertsPerHour: number;
  maxAlertsPerDay: number;
  cooldownPeriod: number;
}

export interface ReportingConfig {
  enabled: boolean;
  schedules: ReportSchedule[];
  recipients: string[];
  formats: ReportFormat[];
  customReports: CustomReport[];
}

export interface ReportSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  enabled: boolean;
  reports: string[];
}

export interface ReportFormat {
  type: 'pdf' | 'excel' | 'json' | 'csv';
  enabled: boolean;
  template?: string;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  query: string;
  visualizations: Visualization[];
  filters: ReportFilter[];
}

export interface Visualization {
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'table' | 'heatmap' | 'funnel';
  title: string;
  data: string;
  config: { [key: string]: any };
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

// Analytics Data Models
export interface WebVitalEntry {
  id: string;
  session_id: string;
  user_id?: string;
  timestamp: Date;
  page_url: string;
  metric_name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  attribution?: WebVitalAttribution;
  device_info: DeviceInfo;
  network_info?: NetworkInfo;
  user_agent: string;
  viewport: ViewportInfo;
}

export interface WebVitalAttribution {
  element?: string;
  url?: string;
  loadState?: string;
  eventType?: string;
  eventTarget?: string;
  largestShiftTarget?: string;
  largestShiftTime?: number;
  largestShiftValue?: number;
  largestShiftSource?: string;
}

export interface UserInteractionEntry {
  id: string;
  session_id: string;
  user_id?: string;
  timestamp: Date;
  page_url: string;
  interaction_type: 'click' | 'scroll' | 'touch' | 'swipe' | 'pinch' | 'form' | 'navigation';
  element_selector?: string;
  element_text?: string;
  coordinates?: { x: number; y: number };
  scroll_depth?: number;
  scroll_direction?: 'up' | 'down';
  touch_duration?: number;
  swipe_direction?: 'left' | 'right' | 'up' | 'down';
  form_field?: string;
  form_action?: 'focus' | 'blur' | 'change' | 'submit';
  navigation_from?: string;
  navigation_to?: string;
  device_info: DeviceInfo;
}

export interface ErrorEntry {
  id: string;
  session_id: string;
  user_id?: string;
  timestamp: Date;
  page_url: string;
  error_type: 'javascript' | 'network' | 'resource' | 'mobile_specific' | 'custom';
  error_message: string;
  error_stack?: string;
  error_source?: string;
  error_line?: number;
  error_column?: number;
  network_status?: number;
  network_url?: string;
  device_info: DeviceInfo;
  user_agent: string;
  breadcrumbs?: ErrorBreadcrumb[];
  additional_context?: { [key: string]: any };
}

export interface ErrorBreadcrumb {
  timestamp: Date;
  category: 'navigation' | 'user' | 'console' | 'network' | 'dom';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: { [key: string]: any };
}

export interface PerformanceEntry {
  id: string;
  session_id: string;
  user_id?: string;
  timestamp: Date;
  page_url: string;
  entry_type: 'navigation' | 'resource' | 'measure' | 'longtask' | 'paint';
  name: string;
  start_time: number;
  duration?: number;
  size?: number;
  type?: string;
  initiator_type?: string;
  next_hop_protocol?: string;
  transfer_size?: number;
  encoded_body_size?: number;
  decoded_body_size?: number;
  device_info: DeviceInfo;
  network_info?: NetworkInfo;
}

export interface ABTestEntry {
  id: string;
  session_id: string;
  user_id?: string;
  timestamp: Date;
  experiment_id: string;
  variation_id: string;
  event_type: 'assignment' | 'goal_conversion' | 'exposure';
  goal_id?: string;
  goal_value?: number;
  device_info: DeviceInfo;
  additional_properties?: { [key: string]: any };
}

export interface SessionEntry {
  id: string;
  user_id?: string;
  start_time: Date;
  end_time?: Date;
  duration?: number;
  page_views: number;
  interactions: number;
  errors: number;
  device_info: DeviceInfo;
  network_info?: NetworkInfo;
  referrer?: string;
  utm_params?: { [key: string]: string };
  is_bounce: boolean;
  exit_page?: string;
}

export interface FinancialMetricEntry {
  id: string;
  session_id: string;
  user_id?: string;
  timestamp: Date;
  metric_type: 'transaction_flow' | 'budget_creation' | 'account_connection' | 'category_management' | 'goal_progress';
  metric_name: string;
  metric_value: number;
  step_name?: string;
  step_index?: number;
  completion_time?: number;
  success: boolean;
  error_message?: string;
  additional_context?: { [key: string]: any };
  device_info: DeviceInfo;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  pixel_ratio: number;
  orientation: 'portrait' | 'landscape';
  touch_support: boolean;
  memory?: number;
  cores?: number;
}

export interface NetworkInfo {
  effective_type: '2g' | '3g' | '4g' | '5g';
  downlink?: number;
  rtt?: number;
  save_data?: boolean;
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
}

export interface ViewportInfo {
  width: number;
  height: number;
  device_pixel_ratio: number;
  orientation: number;
}

// Analytics SDK Models
export interface AnalyticsSDKConfig {
  apiKey: string;
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  enableDebug: boolean;
  enableOfflineStorage: boolean;
  maxStorageSize: number;
  enableCookies: boolean;
  enableLocalStorage: boolean;
  respectDoNotTrack: boolean;
  anonymizeIP: boolean;
  sampleRate: number;
}

export interface AnalyticsEvent {
  name: string;
  properties?: { [key: string]: any };
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
  anonymous?: boolean;
}

export interface AnalyticsUser {
  id?: string;
  anonymousId?: string;
  traits?: { [key: string]: any };
}

export interface AnalyticsPage {
  name?: string;
  category?: string;
  properties?: { [key: string]: any };
  timestamp?: Date;
}

// Dashboard Models
export interface DashboardConfig {
  title: string;
  description: string;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  refreshInterval: number;
  timeRange: TimeRange;
  layout: DashboardLayout;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'funnel' | 'alert';
  title: string;
  description?: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  config: WidgetConfig;
  dataSource: DataSourceConfig;
  refreshInterval?: number;
}

export interface WidgetConfig {
  [key: string]: any;
}

export interface DataSourceConfig {
  type: 'supabase' | 'api' | 'static';
  query: string;
  parameters?: { [key: string]: any };
  cache?: boolean;
  cacheDuration?: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'dropdown' | 'date_range' | 'input' | 'checkbox';
  values?: any[];
  defaultValue?: any;
  applies_to?: string[];
}

export interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'last_hour' | 'last_24h' | 'last_7d' | 'last_30d' | 'custom';
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

// Performance Budget Models
export interface PerformanceBudgetResult {
  budget_id: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  status: 'pass' | 'fail' | 'warning';
  breach_percentage?: number;
  device: string;
  network: string;
  page_url: string;
}

export interface PerformanceAlert {
  id: string;
  budget_id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  current_value: number;
  threshold: number;
  breach_duration: number;
  affected_pages: string[];
  recommended_actions: string[];
  acknowledged: boolean;
  resolved: boolean;
}

// Default Configuration
export const DEFAULT_MOBILE_ANALYTICS_CONFIG: MobileAnalyticsConfig = {
  projectId: 'clear-piggy',
  apiKey: '',
  environment: 'development',
  supabase: {
    url: '',
    anonKey: '',
    tables: {
      webVitals: 'mobile_web_vitals',
      userInteractions: 'mobile_user_interactions',
      errors: 'mobile_errors',
      performances: 'mobile_performances',
      abTests: 'mobile_ab_tests',
      sessions: 'mobile_sessions',
      financialMetrics: 'mobile_financial_metrics'
    },
    batchSize: 50,
    flushInterval: 30000,
    enableCompression: true
  },
  webVitals: {
    enabled: true,
    metrics: [
      { name: 'FCP', enabled: true, threshold: { good: 1800, needsImprovement: 3000, poor: 3000 } },
      { name: 'LCP', enabled: true, threshold: { good: 2500, needsImprovement: 4000, poor: 4000 } },
      { name: 'FID', enabled: true, threshold: { good: 100, needsImprovement: 300, poor: 300 } },
      { name: 'CLS', enabled: true, threshold: { good: 0.1, needsImprovement: 0.25, poor: 0.25 } },
      { name: 'TTFB', enabled: true, threshold: { good: 800, needsImprovement: 1800, poor: 1800 } },
      { name: 'INP', enabled: true, threshold: { good: 200, needsImprovement: 500, poor: 500 } }
    ],
    thresholds: {
      FCP: { good: 1800, needsImprovement: 3000, poor: 3000 },
      LCP: { good: 2500, needsImprovement: 4000, poor: 4000 },
      FID: { good: 100, needsImprovement: 300, poor: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
      TTFB: { good: 800, needsImprovement: 1800, poor: 1800 },
      INP: { good: 200, needsImprovement: 500, poor: 500 }
    },
    reportingInterval: 5000,
    sampleRate: 1.0,
    enableAttribution: true
  },
  userInteraction: {
    enabled: true,
    heatmaps: {
      enabled: true,
      maxPoints: 1000,
      sessionTimeout: 1800000,
      excludeSelectors: ['input[type="password"]', '.sensitive'],
      includeSelectors: ['button', 'a', '.clickable'],
      trackClicks: true,
      trackMoves: false,
      trackScrolls: true
    },
    scrollTracking: {
      enabled: true,
      thresholds: [25, 50, 75, 90, 100],
      debounceMs: 250,
      trackDirection: true,
      trackVelocity: true
    },
    touchTracking: {
      enabled: true,
      trackTaps: true,
      trackSwipes: true,
      trackPinches: true,
      trackLongPress: true,
      minimumDistance: 10,
      maximumTime: 500
    },
    formAnalytics: {
      enabled: true,
      trackFieldFocus: true,
      trackFieldBlur: true,
      trackInputChanges: false,
      trackFormSubmissions: true,
      trackValidationErrors: true,
      excludeFields: ['password', 'ssn', 'credit-card']
    },
    navigationTracking: {
      enabled: true,
      trackPageViews: true,
      trackRouteChanges: true,
      trackBackButton: true,
      trackExternalLinks: true
    },
    sampleRate: 0.1
  },
  errorTracking: {
    enabled: true,
    captureUnhandledExceptions: true,
    captureUnhandledRejections: true,
    captureConsoleErrors: true,
    captureNetworkErrors: true,
    captureMobileSpecificErrors: true,
    maxErrorsPerSession: 50,
    stackTraceLimit: 50,
    filterUrls: ['/health', '/ping'],
    ignoreErrors: ['Script error', 'Non-Error promise rejection captured']
  },
  performanceMonitoring: {
    enabled: true,
    resourceTiming: true,
    navigationTiming: true,
    userTiming: true,
    longTasks: true,
    memoryInfo: true,
    networkInfo: true,
    deviceInfo: true,
    batteryInfo: false,
    sampleRate: 0.1
  },
  abTesting: {
    enabled: true,
    provider: 'internal',
    experiments: [],
    defaultVariation: 'control',
    enableForMobile: true,
    persistVariations: true,
    respectDoNotTrack: true
  },
  realUserMonitoring: {
    enabled: true,
    sampleRate: 0.1,
    sessionTimeout: 1800000,
    maxSessionLength: 14400000,
    trackUserAgent: true,
    trackViewport: true,
    trackConnection: true,
    trackMemory: true,
    trackBattery: false,
    trackGeolocation: false,
    anonymizeIP: true
  },
  performanceBudgets: {
    enabled: true,
    budgets: [
      {
        id: 'mobile_lcp',
        name: 'Mobile LCP Budget',
        metric: 'LCP',
        threshold: 2500,
        device: 'mobile',
        network: 'all',
        enabled: true,
        alertOnBreach: true
      },
      {
        id: 'mobile_fid',
        name: 'Mobile FID Budget',
        metric: 'FID',
        threshold: 100,
        device: 'mobile',
        network: 'all',
        enabled: true,
        alertOnBreach: true
      }
    ],
    alertThreshold: 0.1,
    checkInterval: 300000,
    enableAutoOptimization: false
  },
  financialMetrics: {
    enabled: true,
    trackTransactionFlow: true,
    trackBudgetCreation: true,
    trackAccountConnection: true,
    trackCategoryManagement: true,
    trackGoalProgress: true,
    funnelAnalysis: {
      enabled: true,
      funnels: [
        {
          id: 'transaction_flow',
          name: 'Transaction Creation Flow',
          steps: [
            { id: 'start', name: 'Transaction Start', event: 'transaction_start', required: true },
            { id: 'category', name: 'Category Selection', event: 'category_select', required: true },
            { id: 'amount', name: 'Amount Entry', event: 'amount_enter', required: true },
            { id: 'submit', name: 'Transaction Submit', event: 'transaction_submit', required: true }
          ],
          conversionWindow: 3600000,
          excludeInternalUsers: true
        }
      ],
      abandonmentTracking: true,
      stepTimeouts: [300000, 300000, 300000, 60000]
    },
    conversionTracking: {
      enabled: true,
      goals: [
        {
          id: 'transaction_complete',
          name: 'Transaction Completed',
          type: 'transaction_complete',
          conditions: [
            { type: 'event', operator: 'equals', value: 'transaction_submitted' }
          ]
        }
      ],
      attributionWindow: 86400000,
      enableCrossPlatform: true
    }
  },
  alerts: {
    enabled: true,
    channels: [
      {
        id: 'email',
        type: 'email',
        enabled: true,
        config: {
          to: ['team@clear-piggy.com'],
          from: 'alerts@clear-piggy.com'
        }
      }
    ],
    rules: [
      {
        id: 'high_error_rate',
        name: 'High Mobile Error Rate',
        description: 'Alert when mobile error rate exceeds threshold',
        enabled: true,
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 0.05,
        duration: 300000,
        severity: 'high',
        channels: ['email'],
        suppressDuration: 3600000
      }
    ],
    escalation: [
      {
        id: 'critical_escalation',
        severity: 'critical',
        escalateAfter: 900000,
        escalateToChannels: ['email']
      }
    ],
    rateLimiting: {
      enabled: true,
      maxAlertsPerHour: 10,
      maxAlertsPerDay: 50,
      cooldownPeriod: 300000
    }
  },
  reporting: {
    enabled: true,
    schedules: [
      {
        id: 'daily_mobile_report',
        name: 'Daily Mobile Performance Report',
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC',
        enabled: true,
        reports: ['mobile_performance_summary']
      }
    ],
    recipients: ['team@clear-piggy.com'],
    formats: [
      { type: 'pdf', enabled: true },
      { type: 'json', enabled: true }
    ],
    customReports: []
  }
};