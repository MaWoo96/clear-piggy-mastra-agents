import { 
  PerformanceEntry, 
  PerformanceMonitoringConfig, 
  DeviceInfo, 
  NetworkInfo 
} from '../types/analytics-types';

export class PerformanceMonitor {
  private config: PerformanceMonitoringConfig;
  private sessionId: string;
  private userId?: string;
  private onPerformanceCallback: (performance: PerformanceEntry) => void;
  private observer: PerformanceObserver | null = null;
  private resourceObserver: PerformanceObserver | null = null;
  private measureObserver: PerformanceObserver | null = null;
  private isActive = true;
  private performanceData: Map<string, number[]> = new Map();

  constructor(
    config: PerformanceMonitoringConfig,
    sessionId: string,
    userId: string | undefined,
    onPerformance: (performance: PerformanceEntry) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onPerformanceCallback = onPerformance;
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      console.warn('Performance monitoring not supported in this environment');
      return;
    }

    if (this.config.trackResourceTiming) {
      this.setupResourceTimingTracking();
    }

    if (this.config.trackNavigationTiming) {
      this.setupNavigationTimingTracking();
    }

    if (this.config.trackCustomMetrics) {
      this.setupCustomMetricsTracking();
    }

    this.setupMemoryMonitoring();
    this.setupFPSMonitoring();
    this.setupBatteryMonitoring();

    console.log('PerformanceMonitor initialized');
  }

  private setupResourceTimingTracking(): void {
    this.resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          this.trackResourceTiming(entry as PerformanceResourceTiming);
        }
      });
    });

    this.resourceObserver.observe({ entryTypes: ['resource'] });
  }

  private setupNavigationTimingTracking(): void {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          this.trackNavigationTiming(entry as PerformanceNavigationTiming);
        }
      });
    });

    this.observer.observe({ entryTypes: ['navigation'] });

    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      this.trackNavigationTiming(navigationEntry);
    }
  }

  private setupCustomMetricsTracking(): void {
    this.measureObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          this.trackCustomMeasure(entry as PerformanceMeasure);
        }
      });
    });

    this.measureObserver.observe({ entryTypes: ['measure'] });
  }

  private trackResourceTiming(entry: PerformanceResourceTiming): void {
    if (!this.isActive) return;

    const loadTime = entry.responseEnd - entry.fetchStart;
    const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;
    const tcpTime = entry.connectEnd - entry.connectStart;
    const tlsTime = entry.secureConnectionStart > 0 ? 
      entry.connectEnd - entry.secureConnectionStart : 0;
    const ttfb = entry.responseStart - entry.requestStart;
    const downloadTime = entry.responseEnd - entry.responseStart;

    this.reportPerformanceMetric({
      metricType: 'resource_timing',
      metricName: 'resource_load_time',
      value: loadTime,
      unit: 'ms',
      properties: {
        resourceName: entry.name,
        resourceType: this.getResourceType(entry.name),
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        dnsTime,
        tcpTime,
        tlsTime,
        ttfb,
        downloadTime,
        cacheStatus: entry.transferSize === 0 ? 'cache_hit' : 'cache_miss'
      }
    });

    if (this.config.performanceBudgets?.enabled) {
      this.checkResourceBudget(entry, loadTime);
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming): void {
    if (!this.isActive) return;

    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domProcessing: entry.domComplete - entry.domLoading,
      networkLatency: entry.responseEnd - entry.fetchStart,
      pageProcessing: entry.loadEventEnd - entry.responseEnd,
      unloadTime: entry.unloadEventEnd - entry.unloadEventStart,
      redirectTime: entry.redirectEnd - entry.redirectStart,
      dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
      tcpTime: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart
    };

    Object.entries(metrics).forEach(([metricName, value]) => {
      if (value > 0) {
        this.reportPerformanceMetric({
          metricType: 'navigation_timing',
          metricName,
          value,
          unit: 'ms',
          properties: {
            navigationType: this.getNavigationType(entry.type),
            redirectCount: entry.redirectCount,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize
          }
        });
      }
    });
  }

  private trackCustomMeasure(entry: PerformanceMeasure): void {
    if (!this.isActive) return;

    this.reportPerformanceMetric({
      metricType: 'custom_measure',
      metricName: entry.name,
      value: entry.duration,
      unit: 'ms',
      properties: {
        startTime: entry.startTime,
        detail: (entry as any).detail || {}
      }
    });
  }

  private setupMemoryMonitoring(): void {
    if (this.config.trackMemoryUsage && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      
      setInterval(() => {
        if (!this.isActive) return;

        this.reportPerformanceMetric({
          metricType: 'memory',
          metricName: 'heap_usage',
          value: memoryInfo.usedJSHeapSize,
          unit: 'bytes',
          properties: {
            totalJSHeapSize: memoryInfo.totalJSHeapSize,
            jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
            usageRatio: memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit
          }
        });
      }, this.config.memoryCheckInterval || 30000);
    }
  }

  private setupFPSMonitoring(): void {
    if (!this.config.trackFPS) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;

    const measureFPS = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        if (this.isActive) {
          this.reportPerformanceMetric({
            metricType: 'fps',
            metricName: 'frames_per_second',
            value: fps,
            unit: 'fps',
            properties: {
              timestamp: currentTime,
              isLowFPS: fps < 30
            }
          });
        }
      }

      if (this.isActive) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  private async setupBatteryMonitoring(): Promise<void> {
    if (!this.config.trackBatteryUsage || !('getBattery' in navigator)) return;

    try {
      const battery = await (navigator as any).getBattery();
      
      const reportBatteryStatus = () => {
        if (!this.isActive) return;

        this.reportPerformanceMetric({
          metricType: 'battery',
          metricName: 'battery_status',
          value: battery.level * 100,
          unit: 'percentage',
          properties: {
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            level: battery.level
          }
        });
      };

      battery.addEventListener('chargingchange', reportBatteryStatus);
      battery.addEventListener('levelchange', reportBatteryStatus);
      
      reportBatteryStatus();
    } catch (error) {
      console.warn('Battery monitoring not available:', error);
    }
  }

  private checkResourceBudget(entry: PerformanceResourceTiming, loadTime: number): void {
    const budgets = this.config.performanceBudgets;
    if (!budgets?.resourceBudgets) return;

    const resourceType = this.getResourceType(entry.name);
    const budget = budgets.resourceBudgets[resourceType];
    
    if (budget && loadTime > budget) {
      this.reportPerformanceMetric({
        metricType: 'budget_violation',
        metricName: 'resource_budget_exceeded',
        value: loadTime,
        unit: 'ms',
        properties: {
          resourceName: entry.name,
          resourceType,
          budget,
          excess: loadTime - budget,
          severity: loadTime > budget * 2 ? 'high' : 'medium'
        }
      });
    }
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image';
    }
    if (['css'].includes(extension || '')) {
      return 'stylesheet';
    }
    if (['js', 'ts', 'jsx', 'tsx'].includes(extension || '')) {
      return 'script';
    }
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) {
      return 'font';
    }
    if (['json', 'xml'].includes(extension || '')) {
      return 'xhr';
    }
    
    return 'other';
  }

  private getNavigationType(type: number): string {
    const types = ['navigate', 'reload', 'back_forward', 'prerender'];
    return types[type] || 'unknown';
  }

  private reportPerformanceMetric(data: Partial<PerformanceEntry>): void {
    const performanceEntry: PerformanceEntry = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      page_url: window.location.href,
      metric_type: data.metricType!,
      metric_name: data.metricName!,
      value: data.value!,
      unit: data.unit || 'ms',
      device_info: this.getDeviceInfo(),
      network_info: this.getNetworkInfo(),
      properties: data.properties || {}
    };

    this.updatePerformanceStats(data.metricName!, data.value!);
    this.onPerformanceCallback(performanceEntry);
  }

  private updatePerformanceStats(metricName: string, value: number): void {
    if (!this.performanceData.has(metricName)) {
      this.performanceData.set(metricName, []);
    }
    
    const values = this.performanceData.get(metricName)!;
    values.push(value);
    
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  public measureCustomMetric(name: string, startCallback: () => void, endCallback?: () => void): void {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(startMark);
    startCallback();
    
    if (endCallback) {
      endCallback();
    }
    
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
  }

  public getPerformanceStats(metricName?: string): any {
    if (metricName) {
      const values = this.performanceData.get(metricName) || [];
      return this.calculateStats(values);
    }

    const stats: any = {};
    for (const [metric, values] of this.performanceData.entries()) {
      stats[metric] = this.calculateStats(values);
    }
    return stats;
  }

  private calculateStats(values: number[]): any {
    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, mean: 0, median: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const screen = window.screen;
    
    return {
      userAgent: ua,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio,
      isMobile: /Mobi|Android/i.test(ua),
      isTablet: /iPad|Android(?!.*Mobi)/i.test(ua),
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  private getNetworkInfo(): NetworkInfo | undefined {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) return undefined;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
  }

  public destroy(): void {
    this.isActive = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
      this.resourceObserver = null;
    }
    
    if (this.measureObserver) {
      this.measureObserver.disconnect();
      this.measureObserver = null;
    }

    this.performanceData.clear();
    console.log('PerformanceMonitor destroyed');
  }
}