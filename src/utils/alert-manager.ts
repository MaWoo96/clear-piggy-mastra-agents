import { 
  AlertEntry, 
  AlertConfig, 
  WebVitalEntry, 
  ErrorEntry, 
  PerformanceEntry 
} from '../types/analytics-types';
import { SupabaseAnalyticsClient } from './supabase-analytics-client';

export class AlertManager {
  private config: AlertConfig;
  private supabaseClient: SupabaseAnalyticsClient;
  private onAlertCallback: (alert: AlertEntry) => void;
  private alertCounts: Map<string, number> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private alertHistory: AlertEntry[] = [];

  constructor(
    config: AlertConfig,
    supabaseClient: SupabaseAnalyticsClient,
    onAlert: (alert: AlertEntry) => void
  ) {
    this.config = config;
    this.supabaseClient = supabaseClient;
    this.onAlertCallback = onAlert;
    this.initializeAlertManager();
  }

  private initializeAlertManager(): void {
    console.log('AlertManager initialized with', {
      enabled: this.config.enabled,
      thresholds: Object.keys(this.config.thresholds || {}).length,
      channels: this.config.channels?.length || 0
    });
  }

  public async checkWebVitalThresholds(vital: WebVitalEntry): Promise<void> {
    if (!this.config.enabled || !this.config.thresholds?.webVitals) return;

    const thresholds = this.config.thresholds.webVitals;
    const metricThreshold = thresholds[vital.metric_name];
    
    if (!metricThreshold) return;

    const { warning, critical } = metricThreshold;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let shouldAlert = false;

    if (vital.value >= critical) {
      severity = 'critical';
      shouldAlert = true;
    } else if (vital.value >= warning) {
      severity = 'high';
      shouldAlert = true;
    }

    if (shouldAlert) {
      await this.createAlert({
        alertType: 'web_vital_threshold',
        severity,
        message: `${vital.metric_name} threshold exceeded: ${vital.value}ms (${vital.rating})`,
        metricName: vital.metric_name,
        thresholdValue: severity === 'critical' ? critical : warning,
        actualValue: vital.value,
        sessionId: vital.session_id,
        userId: vital.user_id,
        properties: {
          vital,
          page_url: vital.page_url,
          rating: vital.rating,
          device_info: vital.device_info
        }
      });
    }
  }

  public async checkErrorThresholds(error: ErrorEntry): Promise<void> {
    if (!this.config.enabled || !this.config.thresholds?.errors) return;

    const thresholds = this.config.thresholds.errors;
    const errorKey = `${error.error_type}_${error.session_id}`;
    
    this.incrementAlertCount(errorKey);
    const errorCount = this.getAlertCount(errorKey);

    let severity: 'low' | 'medium' | 'high' | 'critical';
    
    if (error.severity === 'critical' || errorCount >= thresholds.criticalCount) {
      severity = 'critical';
    } else if (error.severity === 'high' || errorCount >= thresholds.highCount) {
      severity = 'high';
    } else if (errorCount >= thresholds.mediumCount) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    if (severity !== 'low') {
      await this.createAlert({
        alertType: 'error_threshold',
        severity,
        message: this.generateErrorAlertMessage(error, errorCount),
        metricName: 'error_count',
        actualValue: errorCount,
        sessionId: error.session_id,
        userId: error.user_id,
        properties: {
          error,
          errorCount,
          errorType: error.error_type,
          fingerprint: error.fingerprint
        }
      });
    }
  }

  public async checkPerformanceThresholds(performance: PerformanceEntry): Promise<void> {
    if (!this.config.enabled || !this.config.thresholds?.performance) return;

    const thresholds = this.config.thresholds.performance;
    const metricKey = `${performance.metric_type}_${performance.metric_name}`;
    const threshold = thresholds[metricKey];

    if (!threshold) return;

    const { warning, critical } = threshold;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let shouldAlert = false;

    if (performance.value >= critical) {
      severity = 'critical';
      shouldAlert = true;
    } else if (performance.value >= warning) {
      severity = 'high';
      shouldAlert = true;
    }

    if (shouldAlert) {
      await this.createAlert({
        alertType: 'performance_threshold',
        severity,
        message: `Performance threshold exceeded: ${performance.metric_name} = ${performance.value}${performance.unit}`,
        metricName: performance.metric_name,
        thresholdValue: severity === 'critical' ? critical : warning,
        actualValue: performance.value,
        sessionId: performance.session_id,
        userId: performance.user_id,
        properties: {
          performance,
          metric_type: performance.metric_type,
          unit: performance.unit
        }
      });
    }
  }

  public async createCustomAlert(
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.createAlert({
      alertType,
      severity,
      message,
      properties: properties || {}
    });
  }

  private async createAlert(alertData: Partial<AlertEntry>): Promise<void> {
    const alertKey = this.generateAlertKey(alertData);
    
    if (this.shouldSuppressAlert(alertKey)) {
      return;
    }

    const alert: AlertEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      alert_type: alertData.alertType!,
      severity: alertData.severity!,
      message: alertData.message!,
      metric_name: alertData.metricName,
      threshold_value: alertData.thresholdValue,
      actual_value: alertData.actualValue,
      session_id: alertData.sessionId,
      user_id: alertData.userId,
      properties: alertData.properties || {},
      resolved_at: null
    };

    this.alertHistory.push(alert);
    this.updateAlertCount(alertKey);
    this.onAlertCallback(alert);

    await this.sendAlertNotifications(alert);
  }

  private generateErrorAlertMessage(error: ErrorEntry, count: number): string {
    const baseMessage = `${error.error_type} error occurred`;
    
    if (count > 1) {
      return `${baseMessage} ${count} times: ${error.message}`;
    }
    
    return `${baseMessage}: ${error.message}`;
  }

  private generateAlertKey(alertData: Partial<AlertEntry>): string {
    return `${alertData.alertType}_${alertData.metricName || 'unknown'}_${alertData.sessionId || 'global'}`;
  }

  private shouldSuppressAlert(alertKey: string): boolean {
    const lastAlert = this.lastAlertTime.get(alertKey);
    const now = Date.now();
    const suppressionWindow = this.config.suppressionWindow || 300000; // 5 minutes default

    if (lastAlert && (now - lastAlert) < suppressionWindow) {
      return true;
    }

    return false;
  }

  private incrementAlertCount(key: string): void {
    const current = this.alertCounts.get(key) || 0;
    this.alertCounts.set(key, current + 1);
  }

  private getAlertCount(key: string): number {
    return this.alertCounts.get(key) || 0;
  }

  private updateAlertCount(alertKey: string): void {
    this.lastAlertTime.set(alertKey, Date.now());
  }

  private async sendAlertNotifications(alert: AlertEntry): Promise<void> {
    if (!this.config.channels || this.config.channels.length === 0) {
      return;
    }

    const notificationPromises = this.config.channels.map(async (channel) => {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(alert, channel);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel);
            break;
          case 'console':
            this.sendConsoleNotification(alert, channel);
            break;
          default:
            console.warn(`Unknown alert channel type: ${channel.type}`);
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel.type}:`, error);
      }
    });

    await Promise.allSettled(notificationPromises);
  }

  private async sendEmailNotification(alert: AlertEntry, channel: any): Promise<void> {
    if (!channel.config?.emailService) {
      console.warn('Email service not configured for email notifications');
      return;
    }

    const emailData = {
      to: channel.config.recipients,
      subject: `Alert: ${alert.alert_type} - ${alert.severity}`,
      body: this.formatAlertMessage(alert),
      html: this.formatAlertHTML(alert)
    };

    console.log('Email notification would be sent:', emailData);
  }

  private async sendSlackNotification(alert: AlertEntry, channel: any): Promise<void> {
    if (!channel.config?.webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return;
    }

    const slackMessage = {
      text: `🚨 Alert: ${alert.alert_type}`,
      attachments: [{
        color: this.getSlackColorForSeverity(alert.severity),
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Message', value: alert.message, short: false },
          { title: 'Metric', value: alert.metric_name || 'N/A', short: true },
          { title: 'Value', value: alert.actual_value?.toString() || 'N/A', short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true }
        ]
      }]
    };

    try {
      const response = await fetch(channel.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  private async sendWebhookNotification(alert: AlertEntry, channel: any): Promise<void> {
    if (!channel.config?.url) {
      console.warn('Webhook URL not configured');
      return;
    }

    const webhookPayload = {
      alert,
      timestamp: Date.now(),
      source: 'mobile-analytics-agent'
    };

    try {
      const response = await fetch(channel.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...channel.config.headers
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        throw new Error(`Webhook notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  private sendConsoleNotification(alert: AlertEntry, channel: any): void {
    const prefix = this.getConsolePrefix(alert.severity);
    console.log(`${prefix} ${alert.alert_type}: ${alert.message}`, alert);
  }

  private formatAlertMessage(alert: AlertEntry): string {
    let message = `Alert: ${alert.alert_type}\n`;
    message += `Severity: ${alert.severity}\n`;
    message += `Message: ${alert.message}\n`;
    message += `Time: ${alert.timestamp.toISOString()}\n`;
    
    if (alert.metric_name) {
      message += `Metric: ${alert.metric_name}\n`;
    }
    
    if (alert.actual_value !== undefined) {
      message += `Value: ${alert.actual_value}\n`;
    }
    
    if (alert.threshold_value !== undefined) {
      message += `Threshold: ${alert.threshold_value}\n`;
    }

    return message;
  }

  private formatAlertHTML(alert: AlertEntry): string {
    return `
      <h2>🚨 Alert: ${alert.alert_type}</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
      ${alert.metric_name ? `<p><strong>Metric:</strong> ${alert.metric_name}</p>` : ''}
      ${alert.actual_value !== undefined ? `<p><strong>Value:</strong> ${alert.actual_value}</p>` : ''}
      ${alert.threshold_value !== undefined ? `<p><strong>Threshold:</strong> ${alert.threshold_value}</p>` : ''}
    `;
  }

  private getSlackColorForSeverity(severity: string): string {
    const colors = {
      low: '#36a64f',      // green
      medium: '#ff9500',   // orange
      high: '#ff0000',     // red
      critical: '#8B0000'  // dark red
    };
    return colors[severity as keyof typeof colors] || '#808080';
  }

  private getConsolePrefix(severity: string): string {
    const prefixes = {
      low: '💡',
      medium: '⚠️',
      high: '🔥',
      critical: '🚨'
    };
    return prefixes[severity as keyof typeof prefixes] || '📢';
  }

  public getAlertHistory(): AlertEntry[] {
    return this.alertHistory.slice();
  }

  public getAlertStats(): {
    totalAlerts: number;
    alertsBySeverity: Record<string, number>;
    alertsByType: Record<string, number>;
    recentAlerts: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const alertsBySeverity: Record<string, number> = {};
    const alertsByType: Record<string, number> = {};
    let recentAlerts = 0;

    this.alertHistory.forEach(alert => {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
      alertsByType[alert.alert_type] = (alertsByType[alert.alert_type] || 0) + 1;
      
      if (alert.timestamp.getTime() > oneHourAgo) {
        recentAlerts++;
      }
    });

    return {
      totalAlerts: this.alertHistory.length,
      alertsBySeverity,
      alertsByType,
      recentAlerts
    };
  }

  public async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert && !alert.resolved_at) {
      alert.resolved_at = new Date();
      
      try {
        await this.supabaseClient.insertAlert(alert);
      } catch (error) {
        console.error('Failed to update resolved alert in database:', error);
      }
    }
  }

  public clearAlertHistory(): void {
    this.alertHistory = [];
    this.alertCounts.clear();
    this.lastAlertTime.clear();
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    this.clearAlertHistory();
    console.log('AlertManager destroyed');
  }
}