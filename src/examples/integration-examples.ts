import { 
  createMobileAnalyticsSDK, 
  initializeMobileAnalytics, 
  getMobileAnalytics 
} from '../sdk/mobile-analytics-sdk';
import { getClearPiggyConfig } from '../config/clear-piggy-analytics-config';

// Example 1: Basic SDK Initialization
export async function basicInitialization() {
  const config = getClearPiggyConfig();
  
  try {
    const analytics = await initializeMobileAnalytics(config, 'user-123');
    console.log('Analytics initialized successfully!');
    
    // Track a simple event
    analytics.trackEvent('app_launched', {
      platform: 'mobile',
      version: '1.0.0'
    });
    
    return analytics;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
    throw error;
  }
}

// Example 2: React Hook Integration
export function useAnalytics() {
  const [analytics, setAnalytics] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function initAnalytics() {
      try {
        const config = getClearPiggyConfig();
        const analyticsInstance = await initializeMobileAnalytics(config);
        setAnalytics(analyticsInstance);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Analytics initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAnalytics();

    // Cleanup on unmount
    return () => {
      const analytics = getMobileAnalytics();
      if (analytics) {
        analytics.destroy();
      }
    };
  }, []);

  return { analytics, isLoading, error };
}

// Example 3: Clear Piggy Transaction Tracking
export function trackTransactionFlow() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Start transaction funnel
  analytics.trackConversionFunnel('transaction', 'started', {
    page: 'add-transaction',
    source: 'quick-add-button'
  });

  // Track transaction attempt
  analytics.trackConversionFunnel('transaction', 'attempted', {
    amount: 25.99,
    category: 'groceries'
  });

  // Track successful completion
  analytics.trackTransaction(25.99, 'expense', 'groceries');
  
  analytics.trackConversionFunnel('transaction', 'completed', {
    amount: 25.99,
    category: 'groceries',
    success: true
  });
}

// Example 4: Budget Creation Tracking
export function trackBudgetCreationFlow() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Track budget creation start
  analytics.trackConversionFunnel('budget', 'started', {
    page: 'budget-setup',
    trigger: 'onboarding'
  });

  // Track budget creation completion
  analytics.trackBudgetCreation(500, 'groceries', 'monthly');

  // Track A/B test variation
  const variation = analytics.getABTestVariation('budget_creation_flow');
  if (variation === 'simplified') {
    analytics.trackEvent('simplified_budget_flow_used', {
      category: 'groceries',
      amount: 500
    });
  }
}

// Example 5: A/B Testing Implementation
export function implementABTesting() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Check which variation user is in
  const budgetFlowVariation = analytics.getABTestVariation('budget_creation_flow');
  
  if (budgetFlowVariation === 'simplified') {
    // Show simplified budget creation UI
    showSimplifiedBudgetForm();
    
    // Track interaction with simplified flow
    analytics.trackEvent('simplified_ui_shown', {
      testName: 'budget_creation_flow',
      variation: 'simplified'
    });
  } else {
    // Show original budget creation UI  
    showOriginalBudgetForm();
    
    analytics.trackEvent('original_ui_shown', {
      testName: 'budget_creation_flow',
      variation: 'original'
    });
  }

  // Track conversion when budget is successfully created
  function onBudgetCreated() {
    analytics.trackABTestConversion('budget_creation_flow', 'budget_created', 1);
  }
}

// Example 6: Financial Goal Tracking
export function trackFinancialGoals() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Track goal setting
  analytics.trackEvent('goal_set', {
    goalType: 'savings',
    targetAmount: 1000,
    timeframe: 'quarterly'
  });

  // Track progress towards goal
  analytics.trackEvent('goal_progress', {
    goalType: 'savings',
    targetAmount: 1000,
    currentAmount: 250,
    progressPercentage: 25
  });

  // Track goal completion
  analytics.trackGoalCompletion('savings', 1000, 1000);
}

// Example 7: Error Tracking with Context
export function trackCustomErrors() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  try {
    // Some operation that might fail
    processFinancialData();
  } catch (error) {
    // Track error with context
    analytics.trackCustomError(error, {
      operation: 'processFinancialData',
      userId: analytics.getUserId(),
      timestamp: new Date().toISOString(),
      additionalData: {
        transactionCount: 5,
        accountBalance: 1250.50
      }
    });
  }
}

// Example 8: Performance Monitoring
export function monitorPerformance() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Measure API call performance
  analytics.measureCustomMetric(
    'api_transaction_fetch',
    () => {
      // Start timing
      console.log('Starting API call...');
    },
    () => {
      // End timing
      console.log('API call completed');
    }
  );

  // Track custom performance metrics
  analytics.trackEvent('page_load_performance', {
    pageUrl: window.location.href,
    loadTime: performance.now(),
    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
  });
}

// Example 9: Subscription and Premium Features
export function trackSubscriptionEvents() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Track premium upgrade
  analytics.trackSubscription('upgrade', 'premium-monthly', 9.99);

  // Track premium feature usage
  analytics.trackEvent('premium_feature_used', {
    feature: 'advanced_analytics',
    planType: 'premium',
    usage_count: 1
  });

  // Track subscription cancellation
  analytics.trackSubscription('cancel', 'premium-monthly', 9.99);
}

// Example 10: Dashboard Data Retrieval
export async function loadDashboardData() {
  const analytics = getMobileAnalytics();
  if (!analytics) return null;

  try {
    const dashboardData = await analytics.getDashboardData();
    console.log('Dashboard data loaded:', dashboardData);
    
    return dashboardData;
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    return null;
  }
}

// Example 11: Performance Budget Monitoring
export function monitorPerformanceBudgets() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Listen for budget violations
  analytics.on('performance_budget_violation', (violation) => {
    console.warn('Performance budget violated:', violation);
    
    // Track budget violation as an event
    analytics.trackEvent('performance_budget_exceeded', {
      metricName: violation.metricName,
      budgetValue: violation.budgetValue,
      actualValue: violation.actualValue,
      severity: violation.severity
    });

    // Show user notification if critical
    if (violation.severity === 'critical') {
      showPerformanceWarning(violation);
    }
  });

  // Get budget report
  const budgetReport = analytics.getPerformanceBudgetReport();
  if (budgetReport) {
    console.log('Performance budget report:', budgetReport);
  }
}

// Example 12: Real-time Analytics Dashboard Component (React)
export function AnalyticsDashboard() {
  const { analytics } = useAnalytics();
  const [dashboardData, setDashboardData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!analytics) return;

    async function loadData() {
      try {
        const data = await analytics.getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Set up real-time updates
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [analytics]);

  if (loading) return <div>Loading analytics...</div>;
  if (!dashboardData) return <div>No data available</div>;

  return (
    <div className="analytics-dashboard">
      <h1>Clear Piggy Analytics</h1>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Web Vitals"
          data={dashboardData.webVitals}
        />
        <MetricCard 
          title="Error Rate"
          data={dashboardData.errors}
        />
        <MetricCard 
          title="Financial Conversions"
          data={dashboardData.financial}
        />
      </div>
    </div>
  );
}

// Example 13: Event Tracking for User Onboarding
export function trackOnboardingFlow() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Track onboarding start
  analytics.trackConversionFunnel('onboarding', 'started', {
    source: 'app_launch',
    timestamp: Date.now()
  });

  // Track individual onboarding steps
  const trackOnboardingStep = (step: string, properties: any = {}) => {
    analytics.trackConversionFunnel('onboarding', step, {
      ...properties,
      timestamp: Date.now()
    });
  };

  // Usage throughout onboarding flow
  trackOnboardingStep('account_created', { method: 'email' });
  trackOnboardingStep('profile_completed', { hasAvatar: true });
  trackOnboardingStep('first_transaction_added', { amount: 15.99 });
  trackOnboardingStep('first_budget_created', { category: 'groceries' });
  trackOnboardingStep('completed', { duration: 180000 }); // 3 minutes
}

// Example 14: Custom Event Tracking for Clear Piggy Features
export function trackClearPiggyFeatures() {
  const analytics = getMobileAnalytics();
  if (!analytics) return;

  // Track specific Clear Piggy features
  const trackFeatureUsage = (feature: string, properties: any = {}) => {
    analytics.trackEvent('feature_used', {
      feature,
      ...properties,
      timestamp: Date.now()
    });
  };

  // Usage examples
  trackFeatureUsage('automatic_categorization', { accuracy: 0.85 });
  trackFeatureUsage('spending_insights', { period: 'monthly' });
  trackFeatureUsage('budget_alerts', { alertType: 'overspend' });
  trackFeatureUsage('savings_goals', { goalType: 'vacation', target: 2000 });
  trackFeatureUsage('export_data', { format: 'csv', dateRange: '3months' });
}

// Helper functions (mock implementations)
function showSimplifiedBudgetForm() {
  console.log('Showing simplified budget form...');
}

function showOriginalBudgetForm() {
  console.log('Showing original budget form...');
}

function processFinancialData() {
  // Mock function that might throw an error
  if (Math.random() < 0.1) {
    throw new Error('Financial data processing failed');
  }
  return true;
}

function showPerformanceWarning(violation: any) {
  console.warn(`Performance issue detected: ${violation.message}`);
}

function MetricCard({ title, data }: { title: string, data: any }) {
  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}