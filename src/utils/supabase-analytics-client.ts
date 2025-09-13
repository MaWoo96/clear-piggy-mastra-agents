import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  SupabaseAnalyticsConfig,
  WebVitalEntry,
  UserInteractionEntry,
  ErrorEntry,
  PerformanceEntry,
  ABTestEntry,
  RUMEntry,
  FinancialMetricEntry,
  AlertEntry
} from '../types/analytics-types';

export class SupabaseAnalyticsClient {
  private config: SupabaseAnalyticsConfig;
  private client: SupabaseClient | null = null;
  private batchQueue: Array<{
    table: string;
    data: any;
    timestamp: number;
  }> = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: SupabaseAnalyticsConfig) {
    this.config = config;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('SupabaseAnalyticsClient already initialized');
      return;
    }

    try {
      this.client = createClient(this.config.url, this.config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        realtime: {
          enabled: false
        }
      });

      await this.createTablesIfNotExist();
      
      if (this.config.enableBatching) {
        this.startBatchProcessor();
      }

      this.isInitialized = true;
      console.log('SupabaseAnalyticsClient initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SupabaseAnalyticsClient:', error);
      throw error;
    }
  }

  private async createTablesIfNotExist(): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const tables = [
      {
        name: 'web_vitals',
        sql: `
          CREATE TABLE IF NOT EXISTS web_vitals (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            page_url TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            value NUMERIC NOT NULL,
            rating TEXT NOT NULL,
            attribution JSONB,
            device_info JSONB NOT NULL,
            network_info JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_web_vitals_session_id ON web_vitals(session_id);
          CREATE INDEX IF NOT EXISTS idx_web_vitals_user_id ON web_vitals(user_id);
          CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals(metric_name);
          CREATE INDEX IF NOT EXISTS idx_web_vitals_timestamp ON web_vitals(timestamp);
        `
      },
      {
        name: 'user_interactions',
        sql: `
          CREATE TABLE IF NOT EXISTS user_interactions (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            page_url TEXT NOT NULL,
            interaction_type TEXT NOT NULL,
            target_element TEXT,
            target_text TEXT,
            coordinates JSONB,
            touch_data JSONB,
            scroll_data JSONB,
            device_info JSONB NOT NULL,
            properties JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
          CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
          CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);
        `
      },
      {
        name: 'errors',
        sql: `
          CREATE TABLE IF NOT EXISTS errors (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            page_url TEXT NOT NULL,
            user_agent TEXT NOT NULL,
            error_type TEXT NOT NULL,
            message TEXT NOT NULL,
            filename TEXT,
            lineno INTEGER,
            colno INTEGER,
            stack TEXT,
            source TEXT NOT NULL,
            device_info JSONB NOT NULL,
            severity TEXT NOT NULL,
            fingerprint TEXT,
            properties JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_errors_session_id ON errors(session_id);
          CREATE INDEX IF NOT EXISTS idx_errors_user_id ON errors(user_id);
          CREATE INDEX IF NOT EXISTS idx_errors_type ON errors(error_type);
          CREATE INDEX IF NOT EXISTS idx_errors_severity ON errors(severity);
          CREATE INDEX IF NOT EXISTS idx_errors_fingerprint ON errors(fingerprint);
          CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors(timestamp);
        `
      },
      {
        name: 'performance_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS performance_metrics (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            page_url TEXT NOT NULL,
            metric_type TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            value NUMERIC NOT NULL,
            unit TEXT,
            device_info JSONB NOT NULL,
            network_info JSONB,
            properties JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
        `
      },
      {
        name: 'ab_tests',
        sql: `
          CREATE TABLE IF NOT EXISTS ab_tests (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            page_url TEXT NOT NULL,
            test_name TEXT NOT NULL,
            variation TEXT NOT NULL,
            event_type TEXT NOT NULL,
            properties JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_ab_tests_session_id ON ab_tests(session_id);
          CREATE INDEX IF NOT EXISTS idx_ab_tests_user_id ON ab_tests(user_id);
          CREATE INDEX IF NOT EXISTS idx_ab_tests_test_name ON ab_tests(test_name);
          CREATE INDEX IF NOT EXISTS idx_ab_tests_variation ON ab_tests(variation);
          CREATE INDEX IF NOT EXISTS idx_ab_tests_timestamp ON ab_tests(timestamp);
        `
      },
      {
        name: 'rum_data',
        sql: `
          CREATE TABLE IF NOT EXISTS rum_data (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            page_url TEXT NOT NULL,
            page_load_time NUMERIC,
            time_to_interactive NUMERIC,
            first_input_delay NUMERIC,
            largest_contentful_paint NUMERIC,
            cumulative_layout_shift NUMERIC,
            device_info JSONB NOT NULL,
            network_info JSONB,
            performance_timing JSONB,
            resource_timing JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_rum_data_session_id ON rum_data(session_id);
          CREATE INDEX IF NOT EXISTS idx_rum_data_user_id ON rum_data(user_id);
          CREATE INDEX IF NOT EXISTS idx_rum_data_timestamp ON rum_data(timestamp);
        `
      },
      {
        name: 'financial_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS financial_metrics (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            metric_type TEXT NOT NULL,
            value NUMERIC NOT NULL,
            currency TEXT,
            properties JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_financial_metrics_session_id ON financial_metrics(session_id);
          CREATE INDEX IF NOT EXISTS idx_financial_metrics_user_id ON financial_metrics(user_id);
          CREATE INDEX IF NOT EXISTS idx_financial_metrics_type ON financial_metrics(metric_type);
          CREATE INDEX IF NOT EXISTS idx_financial_metrics_timestamp ON financial_metrics(timestamp);
        `
      },
      {
        name: 'alerts',
        sql: `
          CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            metric_name TEXT,
            threshold_value NUMERIC,
            actual_value NUMERIC,
            session_id TEXT,
            user_id TEXT,
            properties JSONB,
            resolved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
          CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
          CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
          CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved_at);
        `
      },
      {
        name: 'custom_events',
        sql: `
          CREATE TABLE IF NOT EXISTS custom_events (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            event_name TEXT NOT NULL,
            properties JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_custom_events_session_id ON custom_events(session_id);
          CREATE INDEX IF NOT EXISTS idx_custom_events_user_id ON custom_events(user_id);
          CREATE INDEX IF NOT EXISTS idx_custom_events_name ON custom_events(event_name);
          CREATE INDEX IF NOT EXISTS idx_custom_events_timestamp ON custom_events(timestamp);
        `
      }
    ];

    for (const table of tables) {
      try {
        const { error } = await this.client.rpc('execute_sql', { query: table.sql });
        if (error) {
          console.warn(`Failed to create table ${table.name}:`, error);
        }
      } catch (error) {
        console.warn(`Failed to execute SQL for table ${table.name}:`, error);
      }
    }
  }

  private startBatchProcessor(): void {
    const batchInterval = this.config.batchInterval || 5000;
    
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, batchInterval);
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batchToProcess = this.batchQueue.splice(0, this.config.batchSize || 50);
    const groupedByTable = new Map<string, any[]>();

    batchToProcess.forEach(item => {
      if (!groupedByTable.has(item.table)) {
        groupedByTable.set(item.table, []);
      }
      groupedByTable.get(item.table)!.push(item.data);
    });

    for (const [table, data] of groupedByTable) {
      try {
        await this.insertBatch(table, data);
      } catch (error) {
        console.error(`Failed to insert batch for table ${table}:`, error);
      }
    }
  }

  private async insertBatch(table: string, data: any[]): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { error } = await this.client
      .from(table)
      .insert(data);

    if (error) {
      console.error(`Batch insert failed for table ${table}:`, error);
      throw error;
    }
  }

  private addToBatch(table: string, data: any): void {
    this.batchQueue.push({
      table,
      data,
      timestamp: Date.now()
    });

    if (this.batchQueue.length >= (this.config.batchSize || 50)) {
      this.processBatch();
    }
  }

  public async insertWebVital(vital: WebVitalEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('web_vitals', vital);
    } else {
      await this.insertSingle('web_vitals', vital);
    }
  }

  public async insertUserInteraction(interaction: UserInteractionEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('user_interactions', interaction);
    } else {
      await this.insertSingle('user_interactions', interaction);
    }
  }

  public async insertError(error: ErrorEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('errors', error);
    } else {
      await this.insertSingle('errors', error);
    }
  }

  public async insertPerformanceMetric(metric: PerformanceEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('performance_metrics', metric);
    } else {
      await this.insertSingle('performance_metrics', metric);
    }
  }

  public async insertABTestEvent(abTest: ABTestEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('ab_tests', abTest);
    } else {
      await this.insertSingle('ab_tests', abTest);
    }
  }

  public async insertRUMData(rumData: RUMEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('rum_data', rumData);
    } else {
      await this.insertSingle('rum_data', rumData);
    }
  }

  public async insertFinancialMetric(metric: FinancialMetricEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('financial_metrics', metric);
    } else {
      await this.insertSingle('financial_metrics', metric);
    }
  }

  public async insertAlert(alert: AlertEntry): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('alerts', alert);
    } else {
      await this.insertSingle('alerts', alert);
    }
  }

  public async insertCustomEvent(event: any): Promise<void> {
    if (!this.isInitialized) throw new Error('Client not initialized');

    if (this.config.enableBatching) {
      this.addToBatch('custom_events', event);
    } else {
      await this.insertSingle('custom_events', event);
    }
  }

  private async insertSingle(table: string, data: any): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { error } = await this.client
      .from(table)
      .insert([data]);

    if (error) {
      console.error(`Insert failed for table ${table}:`, error);
      throw error;
    }
  }

  public async getDashboardData(): Promise<any> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const [
        webVitalsData,
        errorData,
        performanceData,
        sessionData
      ] = await Promise.all([
        this.getWebVitalsAnalytics(last24Hours),
        this.getErrorAnalytics(last24Hours),
        this.getPerformanceAnalytics(last24Hours),
        this.getSessionAnalytics(last7Days)
      ]);

      return {
        webVitals: webVitalsData,
        errors: errorData,
        performance: performanceData,
        sessions: sessionData,
        timestamp: now
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  private async getWebVitalsAnalytics(since: Date): Promise<any> {
    const { data, error } = await this.client!
      .from('web_vitals')
      .select('metric_name, value, rating, timestamp')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  private async getErrorAnalytics(since: Date): Promise<any> {
    const { data, error } = await this.client!
      .from('errors')
      .select('error_type, severity, message, timestamp')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  private async getPerformanceAnalytics(since: Date): Promise<any> {
    const { data, error } = await this.client!
      .from('performance_metrics')
      .select('metric_type, metric_name, value, timestamp')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  private async getSessionAnalytics(since: Date): Promise<any> {
    const { data, error } = await this.client!
      .from('custom_events')
      .select('session_id, event_name, timestamp')
      .gte('timestamp', since.toISOString())
      .in('event_name', ['session_start', 'session_end'])
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  public async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    await this.processBatch();

    this.isInitialized = false;
    console.log('SupabaseAnalyticsClient destroyed');
  }
}