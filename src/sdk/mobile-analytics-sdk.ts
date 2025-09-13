import { MobileAnalyticsAgent, createMobileAnalyticsAgent } from '../agents/mobile-analytics-agent';
import { MobileAnalyticsConfig, defaultMobileAnalyticsConfig } from '../types/analytics-types';
import { MobilePerformanceBudgets } from '../utils/mobile-performance-budgets';
import { FinancialMetricsTracker } from '../utils/financial-metrics-tracker';

export class MobileAnalyticsSDK {
  private agent: MobileAnalyticsAgent | null = null;
  private performanceBudgets: MobilePerformanceBudgets | null = null;
  private financialTracker: FinancialMetricsTracker | null = null;
  private config: MobileAnalyticsConfig;
  private isInitialized = false;

  constructor(config: Partial<MobileAnalyticsConfig>) {
    this.config = this.mergeConfig(config);
  }

  private mergeConfig(userConfig: Partial<MobileAnalyticsConfig>): MobileAnalyticsConfig {
    return {
      ...defaultMobileAnalyticsConfig,
      ...userConfig,
      supabase: {
        ...defaultMobileAnalyticsConfig.supabase,
        ...userConfig.supabase
      },
      webVitals: {
        ...defaultMobileAnalyticsConfig.webVitals,
        ...userConfig.webVitals
      },
      userInteraction: {
        ...defaultMobileAnalyticsConfig.userInteraction,
        ...userConfig.userInteraction
      },
      errorTracking: {
        ...defaultMobileAnalyticsConfig.errorTracking,
        ...userConfig.errorTracking
      },
      performanceMonitoring: {
        ...defaultMobileAnalyticsConfig.performanceMonitoring,
        ...userConfig.performanceMonitoring
      },
      abTesting: {
        ...defaultMobileAnalyticsConfig.abTesting,
        ...userConfig.abTesting
      },
      realUserMonitoring: {
        ...defaultMobileAnalyticsConfig.realUserMonitoring,
        ...userConfig.realUserMonitoring
      },
      performanceBudgets: {
        ...defaultMobileAnalyticsConfig.performanceBudgets,
        ...userConfig.performanceBudgets
      },
      financialMetrics: {
        ...defaultMobileAnalyticsConfig.financialMetrics,
        ...userConfig.financialMetrics
      },
      alerts: {
        ...defaultMobileAnalyticsConfig.alerts,
        ...userConfig.alerts
      },
      reporting: {
        ...defaultMobileAnalyticsConfig.reporting,
        ...userConfig.reporting
      }
    };
  }

  public async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.warn('MobileAnalyticsSDK already initialized');
      return;
    }

    try {
      this.agent = createMobileAnalyticsAgent(this.config);
      await this.agent.initialize(userId);

      if (this.config.performanceBudgets?.enabled) {
        this.initializePerformanceBudgets();
      }

      if (this.config.financialMetrics?.enabled) {
        this.initializeFinancialTracker();
      }

      this.isInitialized = true;
      console.log('MobileAnalyticsSDK initialized successfully');

      this.trackSDKInitialization();
    } catch (error) {
      console.error('Failed to initialize MobileAnalyticsSDK:', error);
      throw error;
    }
  }

  private initializePerformanceBudgets(): void {
    if (!this.agent) return;

    this.performanceBudgets = new MobilePerformanceBudgets(
      this.config.performanceBudgets!,
      (violation) => {
        this.agent?.trackCustomEvent('performance_budget_violation', {
          violation,
          budgetType: violation.budgetType,
          severity: violation.severity,
          exceedanceRatio: violation.exceedanceRatio
        });
      }
    );

    this.agent.on('webVital', (vital) => {
      this.performanceBudgets?.checkWebVitalBudget(vital);
    });

    this.agent.on('performanceMetric', (performance) => {
      if (performance.metric_type === 'resource_timing') {
        this.performanceBudgets?.checkResourceBudget(
          performance.properties?.resourceName || '',
          performance.properties?.transferSize || 0,
          performance.value
        );
      }
    });
  }

  private initializeFinancialTracker(): void {
    if (!this.agent) return;

    this.financialTracker = new FinancialMetricsTracker(
      this.config.financialMetrics!,
      this.agent.getSessionId(),
      this.agent.getUserId(),
      (metric) => {
        this.agent?.trackCustomEvent('financial_metric', metric);
      }
    );
  }

  private trackSDKInitialization(): void {
    this.agent?.trackCustomEvent('sdk_initialized', {
      version: '1.0.0',
      config: {
        features: {
          webVitals: this.config.webVitals?.enabled,
          userInteraction: this.config.userInteraction?.enabled,
          errorTracking: this.config.errorTracking?.enabled,
          performanceMonitoring: this.config.performanceMonitoring?.enabled,
          abTesting: this.config.abTesting?.enabled,
          realUserMonitoring: this.config.realUserMonitoring?.enabled,
          performanceBudgets: this.config.performanceBudgets?.enabled,
          financialMetrics: this.config.financialMetrics?.enabled,
          alerts: this.config.alerts?.enabled
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  // Analytics tracking methods
  public trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isReady()) return;
    this.agent!.trackCustomEvent(eventName, properties);
  }

  public trackPageView(url?: string): void {
    this.trackEvent('page_view', {
      url: url || window.location.href,
      referrer: document.referrer,
      title: document.title
    });
  }

  public trackUserAction(action: string, properties?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      ...properties
    });
  }

  // Financial metrics methods
  public trackTransaction(amount: number, type: string, category?: string): void {
    if (!this.financialTracker) {
      console.warn('Financial metrics not enabled');
      return;
    }
    this.financialTracker.trackTransactionCompletion(amount, 'USD', type, category);
  }

  public trackBudgetCreation(amount: number, category: string, timeframe: 'weekly' | 'monthly' | 'yearly'): void {
    if (!this.financialTracker) {
      console.warn('Financial metrics not enabled');
      return;
    }
    this.financialTracker.trackBudgetCreation(amount, category, timeframe);
  }

  public trackGoalCompletion(goalType: string, targetAmount: number, achievedAmount: number): void {
    if (!this.financialTracker) {
      console.warn('Financial metrics not enabled');
      return;
    }
    const completionRate = (achievedAmount / targetAmount) * 100;
    this.financialTracker.trackGoalCompletion(goalType, targetAmount, achievedAmount, completionRate);
  }

  public trackSubscription(eventType: 'upgrade' | 'downgrade' | 'cancel' | 'renew', planName: string, amount: number): void {
    if (!this.financialTracker) {
      console.warn('Financial metrics not enabled');
      return;
    }
    this.financialTracker.trackSubscriptionEvent(eventType, planName, amount);
  }

  public trackConversionFunnel(funnelName: string, step: string, properties?: Record<string, any>): void {
    if (!this.financialTracker) {
      console.warn('Financial metrics not enabled');
      return;
    }
    this.financialTracker.trackConversionFunnelStep(funnelName, step, properties);
  }

  // A/B Testing methods
  public getABTestVariation(testName: string): string | null {
    if (!this.isReady()) return null;
    return this.agent!.getABTestVariation(testName);
  }

  public isInVariation(testName: string, variationName: string): boolean {
    const variation = this.getABTestVariation(testName);
    return variation === variationName;
  }

  public trackABTestConversion(testName: string, goalName: string, value?: number): void {
    this.trackEvent('ab_test_conversion', {
      testName,
      goalName,
      value: value || 1,
      variation: this.getABTestVariation(testName)
    });
  }

  // Performance monitoring methods
  public measureCustomMetric(name: string, startCallback: () => void, endCallback?: () => void): void {
    this.trackEvent('custom_metric_start', { metricName: name });
    const startTime = performance.now();
    
    try {
      startCallback();
      if (endCallback) endCallback();
    } finally {
      const duration = performance.now() - startTime;
      this.trackEvent('custom_metric_end', { 
        metricName: name, 
        duration,
        unit: 'ms'
      });
    }
  }

  public trackCustomError(error: Error | string, context?: Record<string, any>): void {
    this.trackEvent('custom_error', {
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: context || {}
    });
  }

  // Dashboard and reporting methods
  public async getDashboardData(): Promise<any> {
    if (!this.isReady()) {
      throw new Error('SDK not initialized');
    }
    return this.agent!.getAnalyticsDashboard();
  }

  public getPerformanceBudgetReport(): any {
    if (!this.performanceBudgets) {
      console.warn('Performance budgets not enabled');
      return null;
    }
    return this.performanceBudgets.generateBudgetReport();
  }

  public getFinancialSummary(): any {
    if (!this.financialTracker) {
      console.warn('Financial metrics not enabled');
      return null;
    }
    return this.financialTracker.getFinancialSummary();
  }

  public getFunnelAnalysis(funnelName: string): any {
    if (!this.financialTracker) {
      console.warn('Financial metrics not enabled');
      return null;
    }
    return this.financialTracker.getFunnelAnalysis(funnelName);
  }

  // Event listeners
  public on(eventName: string, listener: Function): void {
    if (!this.isReady()) return;
    this.agent!.on(eventName, listener);
  }

  public off(eventName: string, listener: Function): void {
    if (!this.isReady()) return;
    this.agent!.off(eventName, listener);
  }

  // Utility methods
  public isReady(): boolean {
    return this.isInitialized && this.agent?.isReady() === true;
  }

  public getSessionId(): string | null {
    return this.agent?.getSessionId() || null;
  }

  public getUserId(): string | undefined {
    return this.agent?.getUserId();
  }

  public getConfig(): MobileAnalyticsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MobileAnalyticsConfig>): void {
    this.config = this.mergeConfig({ ...this.config, ...newConfig });
    console.log('Configuration updated');
  }

  // Lifecycle methods
  public pause(): void {
    this.trackEvent('sdk_paused');
    // Individual trackers would need pause methods implemented
  }

  public resume(): void {
    this.trackEvent('sdk_resumed');
    // Individual trackers would need resume methods implemented  
  }

  public async destroy(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.trackEvent('sdk_destroyed');

      if (this.agent) {
        await this.agent.destroy();
        this.agent = null;
      }

      if (this.performanceBudgets) {
        this.performanceBudgets.destroy();
        this.performanceBudgets = null;
      }

      if (this.financialTracker) {
        this.financialTracker.destroy();
        this.financialTracker = null;
      }

      this.isInitialized = false;
      console.log('MobileAnalyticsSDK destroyed');
    } catch (error) {
      console.error('Error destroying MobileAnalyticsSDK:', error);
    }
  }
}

// Factory function for easy SDK creation
export function createMobileAnalyticsSDK(config: Partial<MobileAnalyticsConfig>): MobileAnalyticsSDK {
  return new MobileAnalyticsSDK(config);
}

// Global SDK instance management
let globalSDKInstance: MobileAnalyticsSDK | null = null;

export function initializeMobileAnalytics(config: Partial<MobileAnalyticsConfig>, userId?: string): Promise<MobileAnalyticsSDK> {
  if (globalSDKInstance) {
    console.warn('Mobile Analytics already initialized globally');
    return Promise.resolve(globalSDKInstance);
  }

  globalSDKInstance = createMobileAnalyticsSDK(config);
  return globalSDKInstance.initialize(userId).then(() => globalSDKInstance!);
}

export function getMobileAnalytics(): MobileAnalyticsSDK | null {
  return globalSDKInstance;
}

export function destroyMobileAnalytics(): Promise<void> {
  if (!globalSDKInstance) {
    return Promise.resolve();
  }

  const promise = globalSDKInstance.destroy();
  globalSDKInstance = null;
  return promise;
}

// Default export
export default MobileAnalyticsSDK;