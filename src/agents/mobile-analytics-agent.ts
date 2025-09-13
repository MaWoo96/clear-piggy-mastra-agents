import { 
  MobileAnalyticsConfig, 
  WebVitalEntry, 
  UserInteractionEntry, 
  ErrorEntry, 
  PerformanceEntry, 
  ABTestEntry,
  RUMEntry,
  FinancialMetricEntry,
  AlertEntry 
} from '../types/analytics-types';
import { WebVitalsTracker, createWebVitalsTracker } from '../utils/web-vitals-tracker';
import { UserInteractionTracker } from '../utils/user-interaction-tracker';
import { ErrorTracker } from '../utils/error-tracker';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { ABTestingFramework } from '../utils/ab-testing-framework';
import { RUMTracker } from '../utils/rum-tracker';
import { SupabaseAnalyticsClient } from '../utils/supabase-analytics-client';
import { AlertManager } from '../utils/alert-manager';

export class MobileAnalyticsAgent {
  private config: MobileAnalyticsConfig;
  private sessionId: string;
  private userId?: string;
  private webVitalsTracker?: WebVitalsTracker;
  private userInteractionTracker?: UserInteractionTracker;
  private errorTracker?: ErrorTracker;
  private performanceMonitor?: PerformanceMonitor;
  private abTestingFramework?: ABTestingFramework;
  private rumTracker?: RUMTracker;
  private supabaseClient?: SupabaseAnalyticsClient;
  private alertManager?: AlertManager;
  private isInitialized = false;

  constructor(config: MobileAnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.validateConfig();
  }

  public async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.warn('MobileAnalyticsAgent already initialized');
      return;
    }

    this.userId = userId;

    try {
      await this.initializeSupabaseClient();
      this.initializeWebVitalsTracking();
      this.initializeUserInteractionTracking();
      this.initializeErrorTracking();
      this.initializePerformanceMonitoring();
      this.initializeABTesting();
      this.initializeRUMTracking();
      this.initializeAlertManager();

      this.isInitialized = true;
      console.log('MobileAnalyticsAgent initialized successfully', {
        sessionId: this.sessionId,
        userId: this.userId,
        config: {
          projectId: this.config.projectId,
          environment: this.config.environment
        }
      });

      await this.trackSessionStart();
    } catch (error) {
      console.error('Failed to initialize MobileAnalyticsAgent:', error);
      throw error;
    }
  }

  private validateConfig(): void {
    if (!this.config.projectId) {
      throw new Error('projectId is required in MobileAnalyticsConfig');
    }
    if (!this.config.apiKey) {
      throw new Error('apiKey is required in MobileAnalyticsConfig');
    }
    if (!this.config.supabase.url) {
      throw new Error('supabase.url is required in MobileAnalyticsConfig');
    }
    if (!this.config.supabase.anonKey) {
      throw new Error('supabase.anonKey is required in MobileAnalyticsConfig');
    }
  }

  private async initializeSupabaseClient(): Promise<void> {
    const { SupabaseAnalyticsClient } = await import('../utils/supabase-analytics-client');
    this.supabaseClient = new SupabaseAnalyticsClient(this.config.supabase);
    await this.supabaseClient.initialize();
  }

  private initializeWebVitalsTracking(): void {
    if (!this.config.webVitals.enabled) return;

    this.webVitalsTracker = createWebVitalsTracker(
      this.config.webVitals,
      this.sessionId,
      this.userId,
      (vital) => this.handleWebVital(vital)
    );
  }

  private async initializeUserInteractionTracking(): Promise<void> {
    if (!this.config.userInteraction.enabled) return;

    const { UserInteractionTracker } = await import('../utils/user-interaction-tracker');
    this.userInteractionTracker = new UserInteractionTracker(
      this.config.userInteraction,
      this.sessionId,
      this.userId,
      (interaction) => this.handleUserInteraction(interaction)
    );
  }

  private async initializeErrorTracking(): Promise<void> {
    if (!this.config.errorTracking.enabled) return;

    const { ErrorTracker } = await import('../utils/error-tracker');
    this.errorTracker = new ErrorTracker(
      this.config.errorTracking,
      this.sessionId,
      this.userId,
      (error) => this.handleError(error)
    );
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    if (!this.config.performanceMonitoring.enabled) return;

    const { PerformanceMonitor } = await import('../utils/performance-monitor');
    this.performanceMonitor = new PerformanceMonitor(
      this.config.performanceMonitoring,
      this.sessionId,
      this.userId,
      (performance) => this.handlePerformanceMetric(performance)
    );
  }

  private async initializeABTesting(): Promise<void> {
    if (!this.config.abTesting.enabled) return;

    const { ABTestingFramework } = await import('../utils/ab-testing-framework');
    this.abTestingFramework = new ABTestingFramework(
      this.config.abTesting,
      this.sessionId,
      this.userId,
      (abTest) => this.handleABTestEvent(abTest)
    );
  }

  private async initializeRUMTracking(): Promise<void> {
    if (!this.config.realUserMonitoring.enabled) return;

    const { RUMTracker } = await import('../utils/rum-tracker');
    this.rumTracker = new RUMTracker(
      this.config.realUserMonitoring,
      this.sessionId,
      this.userId,
      (rumData) => this.handleRUMData(rumData)
    );
  }

  private async initializeAlertManager(): Promise<void> {
    if (!this.config.alerts.enabled) return;

    const { AlertManager } = await import('../utils/alert-manager');
    this.alertManager = new AlertManager(
      this.config.alerts,
      this.supabaseClient!,
      (alert) => this.handleAlert(alert)
    );
  }

  private async handleWebVital(vital: WebVitalEntry): Promise<void> {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertWebVital(vital);
      }

      if (this.alertManager) {
        await this.alertManager.checkWebVitalThresholds(vital);
      }

      this.emit('webVital', vital);
    } catch (error) {
      console.error('Error handling web vital:', error);
    }
  }

  private async handleUserInteraction(interaction: UserInteractionEntry): Promise<void> {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertUserInteraction(interaction);
      }

      this.emit('userInteraction', interaction);
    } catch (error) {
      console.error('Error handling user interaction:', error);
    }
  }

  private async handleError(error: ErrorEntry): Promise<void> {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertError(error);
      }

      if (this.alertManager) {
        await this.alertManager.checkErrorThresholds(error);
      }

      this.emit('error', error);
    } catch (error) {
      console.error('Error handling error entry:', error);
    }
  }

  private async handlePerformanceMetric(performance: PerformanceEntry): Promise<void> {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertPerformanceMetric(performance);
      }

      if (this.alertManager) {
        await this.alertManager.checkPerformanceThresholds(performance);
      }

      this.emit('performanceMetric', performance);
    } catch (error) {
      console.error('Error handling performance metric:', error);
    }
  }

  private async handleABTestEvent(abTest: ABTestEntry): Promise<void> {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertABTestEvent(abTest);
      }

      this.emit('abTest', abTest);
    } catch (error) {
      console.error('Error handling AB test event:', error);
    }
  }

  private async handleRUMData(rumData: RUMEntry): Promise<void> {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertRUMData(rumData);
      }

      this.emit('rumData', rumData);
    } catch (error) {
      console.error('Error handling RUM data:', error);
    }
  }

  private async handleAlert(alert: AlertEntry): Promise<void> {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertAlert(alert);
      }

      this.emit('alert', alert);
    } catch (error) {
      console.error('Error handling alert:', error);
    }
  }

  public async trackFinancialMetric(metric: Omit<FinancialMetricEntry, 'id' | 'session_id' | 'timestamp'>): Promise<void> {
    const financialMetric: FinancialMetricEntry = {
      ...metric,
      id: this.generateId(),
      session_id: this.sessionId,
      timestamp: new Date()
    };

    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertFinancialMetric(financialMetric);
      }

      this.emit('financialMetric', financialMetric);
    } catch (error) {
      console.error('Error tracking financial metric:', error);
    }
  }

  public async trackCustomEvent(eventName: string, properties: Record<string, any>): Promise<void> {
    const customEvent = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      event_name: eventName,
      properties
    };

    try {
      if (this.supabaseClient) {
        await this.supabaseClient.insertCustomEvent(customEvent);
      }

      this.emit('customEvent', customEvent);
    } catch (error) {
      console.error('Error tracking custom event:', error);
    }
  }

  public getABTestVariation(testName: string): string | null {
    if (!this.abTestingFramework) return null;
    return this.abTestingFramework.getVariation(testName);
  }

  public async getAnalyticsDashboard(): Promise<any> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    return this.supabaseClient.getDashboardData();
  }

  private async trackSessionStart(): Promise<void> {
    await this.trackCustomEvent('session_start', {
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private eventListeners: Map<string, Function[]> = new Map();

  private emit(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }

  public on(eventName: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.push(listener);
    this.eventListeners.set(eventName, listeners);
  }

  public off(eventName: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventName) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventName, listeners);
    }
  }

  public async destroy(): Promise<void> {
    try {
      await this.trackCustomEvent('session_end', {
        sessionId: this.sessionId,
        duration: Date.now() - parseInt(this.sessionId.split('_')[1])
      });

      if (this.webVitalsTracker) {
        this.webVitalsTracker.disconnect();
      }

      if (this.userInteractionTracker) {
        this.userInteractionTracker.destroy();
      }

      if (this.errorTracker) {
        this.errorTracker.destroy();
      }

      if (this.performanceMonitor) {
        this.performanceMonitor.destroy();
      }

      if (this.rumTracker) {
        this.rumTracker.destroy();
      }

      this.eventListeners.clear();
      this.isInitialized = false;

      console.log('MobileAnalyticsAgent destroyed');
    } catch (error) {
      console.error('Error destroying MobileAnalyticsAgent:', error);
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getUserId(): string | undefined {
    return this.userId;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export function createMobileAnalyticsAgent(config: MobileAnalyticsConfig): MobileAnalyticsAgent {
  return new MobileAnalyticsAgent(config);
}