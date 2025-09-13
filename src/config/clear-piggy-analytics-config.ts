import { MobileAnalyticsConfig } from '../types/analytics-types';

// Clear Piggy specific analytics configuration
export const clearPiggyAnalyticsConfig: MobileAnalyticsConfig = {
  projectId: 'clear-piggy-mobile',
  apiKey: process.env.CLEAR_PIGGY_ANALYTICS_API_KEY || 'your-api-key-here',
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',

  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || 'your-supabase-url',
    anonKey: process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key',
    enableBatching: true,
    batchSize: 25,
    batchInterval: 10000,
    enableRealtimeUpdates: false
  },

  // Core Web Vitals Tracking
  webVitals: {
    enabled: true,
    trackFCP: true,
    trackLCP: true,
    trackFID: true,
    trackCLS: true,
    trackTTFB: true,
    trackINP: true,
    sampleRate: 1.0,
    reportAllChanges: false
  },

  // User Interaction Analytics
  userInteraction: {
    enabled: true,
    trackClicks: true,
    trackTouches: true,
    trackScrollDepth: true,
    trackFormInteractions: true,
    enableHeatmaps: true,
    heatmapSampleRate: 5000,
    scrollDepthThresholds: [25, 50, 75, 100]
  },

  // Error Tracking
  errorTracking: {
    enabled: true,
    trackJavaScriptErrors: true,
    trackNetworkErrors: true,
    trackResourceErrors: true,
    trackConsoleErrors: true,
    trackConsoleWarnings: false,
    trackPromiseRejections: true,
    maxErrorsPerSession: 50,
    allowDuplicates: false
  },

  // Performance Monitoring
  performanceMonitoring: {
    enabled: true,
    trackResourceTiming: true,
    trackNavigationTiming: true,
    trackCustomMetrics: true,
    trackMemoryUsage: true,
    trackFPS: true,
    trackBatteryUsage: false,
    memoryCheckInterval: 30000,
    performanceBudgets: {
      enabled: true,
      resourceBudgets: {
        image: 2000,    // 2 seconds
        script: 3000,   // 3 seconds
        stylesheet: 1500, // 1.5 seconds
        font: 1000      // 1 second
      }
    }
  },

  // A/B Testing Framework
  abTesting: {
    enabled: true,
    stickyBehavior: true,
    tests: [
      {
        name: 'budget_creation_flow',
        enabled: true,
        trafficAllocation: 0.5,
        controlVariation: 'original',
        variations: [
          { name: 'original', weight: 0.5 },
          { name: 'simplified', weight: 0.5 }
        ],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        goals: ['budget_created', 'user_retention']
      },
      {
        name: 'transaction_categorization',
        enabled: true,
        trafficAllocation: 0.3,
        controlVariation: 'manual',
        variations: [
          { name: 'manual', weight: 0.5 },
          { name: 'ai_suggested', weight: 0.5 }
        ],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        goals: ['transaction_completion', 'categorization_accuracy']
      }
    ]
  },

  // Real User Monitoring
  realUserMonitoring: {
    enabled: true,
    trackViewportMetrics: true,
    reportingInterval: 30000,
    collectUserTimings: true,
    trackLongTasks: true,
    trackMemoryInfo: true
  },

  // Performance Budgets
  performanceBudgets: {
    enabled: true,
    webVitalBudgets: {
      FCP: 1800,    // First Contentful Paint < 1.8s
      LCP: 2500,    // Largest Contentful Paint < 2.5s
      FID: 100,     // First Input Delay < 100ms
      CLS: 0.1,     // Cumulative Layout Shift < 0.1
      TTFB: 800,    // Time to First Byte < 800ms
      INP: 200      // Interaction to Next Paint < 200ms
    },
    resourceBudgets: {
      image_size: 500000,      // 500KB max per image
      script_size: 200000,     // 200KB max per script
      stylesheet_size: 100000, // 100KB max per stylesheet
      font_size: 50000,        // 50KB max per font
      image_time: 2000,        // 2s max load time for images
      script_time: 1500,       // 1.5s max load time for scripts
      stylesheet_time: 1000,   // 1s max load time for stylesheets
      font_time: 800          // 800ms max load time for fonts
    },
    bundleSizeBudgets: {
      main: 300000,     // 300KB main bundle
      vendor: 500000,   // 500KB vendor bundle
      default: 200000   // 200KB default bundle size
    },
    pageWeightBudgets: {
      default: 2000000  // 2MB total page weight
    },
    customBudgets: {
      api_response_time: 1000,     // 1s max API response
      database_query_time: 500,    // 500ms max DB query
      image_optimization_score: 80  // 80+ optimization score
    }
  },

  // Financial Metrics Tracking (Clear Piggy specific)
  financialMetrics: {
    enabled: true,
    trackTransactionCompletions: true,
    trackBudgetCreations: true,
    trackGoalCompletions: true,
    trackSubscriptionEvents: true,
    conversionGoals: [
      'transaction_added',
      'budget_created',
      'goal_set',
      'premium_upgrade',
      'category_created',
      'recurring_transaction_set',
      'savings_milestone',
      'debt_payment_scheduled'
    ]
  },

  // Automated Alerts
  alerts: {
    enabled: true,
    suppressionWindow: 300000, // 5 minutes
    thresholds: {
      webVitals: {
        FCP: { warning: 1800, critical: 3000 },
        LCP: { warning: 2500, critical: 4000 },
        FID: { warning: 100, critical: 300 },
        CLS: { warning: 0.1, critical: 0.25 },
        TTFB: { warning: 800, critical: 1800 },
        INP: { warning: 200, critical: 500 }
      },
      errors: {
        mediumCount: 5,
        highCount: 10,
        criticalCount: 20
      },
      performance: {
        api_response_time: { warning: 1000, critical: 2000 },
        page_load_time: { warning: 3000, critical: 5000 },
        memory_usage: { warning: 100000000, critical: 200000000 } // 100MB/200MB
      }
    },
    channels: [
      {
        type: 'console',
        enabled: true,
        config: {}
      },
      {
        type: 'webhook',
        enabled: false,
        config: {
          url: process.env.ALERT_WEBHOOK_URL || '',
          headers: {
            'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN || ''}`,
            'Content-Type': 'application/json'
          }
        }
      },
      {
        type: 'slack',
        enabled: false,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          channel: '#clear-piggy-alerts',
          username: 'Clear Piggy Analytics'
        }
      }
    ]
  },

  // Reporting Configuration
  reporting: {
    enabled: true,
    generateDailyReports: true,
    generateWeeklyReports: true,
    generateMonthlyReports: true,
    emailReports: false,
    reportRecipients: [
      'dev@clearpiggy.com',
      'analytics@clearpiggy.com'
    ],
    includeMetrics: [
      'web_vitals',
      'error_rates',
      'conversion_rates',
      'user_engagement',
      'financial_metrics',
      'performance_budgets'
    ],
    dashboardConfig: {
      refreshInterval: 30000,
      enableRealTimeUpdates: true,
      widgets: [
        {
          id: 'overview',
          title: 'Overview',
          type: 'summary',
          enabled: true,
          size: 'large'
        },
        {
          id: 'web-vitals',
          title: 'Web Vitals',
          type: 'web_vitals_chart',
          enabled: true,
          size: 'medium'
        },
        {
          id: 'errors',
          title: 'Error Monitoring',
          type: 'error_summary',
          enabled: true,
          size: 'medium'
        },
        {
          id: 'performance',
          title: 'Performance',
          type: 'performance_metrics',
          enabled: true,
          size: 'medium'
        },
        {
          id: 'interactions',
          title: 'User Interactions',
          type: 'interaction_heatmap',
          enabled: true,
          size: 'large'
        },
        {
          id: 'financial',
          title: 'Financial Metrics',
          type: 'financial_dashboard',
          enabled: true,
          size: 'large'
        },
        {
          id: 'alerts',
          title: 'Active Alerts',
          type: 'alert_summary',
          enabled: true,
          size: 'medium'
        }
      ]
    }
  }
};

// Environment-specific overrides
export const developmentConfig: Partial<MobileAnalyticsConfig> = {
  environment: 'development',
  webVitals: {
    ...clearPiggyAnalyticsConfig.webVitals,
    sampleRate: 1.0
  },
  alerts: {
    ...clearPiggyAnalyticsConfig.alerts,
    channels: [
      {
        type: 'console',
        enabled: true,
        config: {}
      }
    ]
  }
};

export const stagingConfig: Partial<MobileAnalyticsConfig> = {
  environment: 'staging',
  webVitals: {
    ...clearPiggyAnalyticsConfig.webVitals,
    sampleRate: 0.5
  }
};

export const productionConfig: Partial<MobileAnalyticsConfig> = {
  environment: 'production',
  webVitals: {
    ...clearPiggyAnalyticsConfig.webVitals,
    sampleRate: 0.1
  },
  errorTracking: {
    ...clearPiggyAnalyticsConfig.errorTracking,
    trackConsoleErrors: false,
    trackConsoleWarnings: false
  }
};

// Factory function to get environment-specific config
export function getClearPiggyConfig(environment?: string): MobileAnalyticsConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
      return { ...clearPiggyAnalyticsConfig, ...developmentConfig };
    case 'staging':
      return { ...clearPiggyAnalyticsConfig, ...stagingConfig };
    case 'production':
      return { ...clearPiggyAnalyticsConfig, ...productionConfig };
    default:
      return clearPiggyAnalyticsConfig;
  }
}