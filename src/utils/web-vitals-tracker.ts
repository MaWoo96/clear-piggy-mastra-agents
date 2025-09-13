import { 
  WebVitalEntry, 
  WebVitalAttribution, 
  DeviceInfo, 
  NetworkInfo,
  WebVitalsConfig 
} from '../types/analytics-types';

export class WebVitalsTracker {
  private config: WebVitalsConfig;
  private observer: PerformanceObserver | null = null;
  private sessionId: string;
  private userId?: string;
  private onVitalCallback: (vital: WebVitalEntry) => void;

  constructor(
    config: WebVitalsConfig,
    sessionId: string,
    userId: string | undefined,
    onVital: (vital: WebVitalEntry) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onVitalCallback = onVital;
    this.initializeTracking();
  }

  private initializeTracking(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      console.warn('Web Vitals tracking not supported in this environment');
      return;
    }

    this.trackFCP();
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackTTFB();
    this.trackINP();
  }

  private trackFCP(): void {
    if (!this.config.trackFCP) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        this.reportVital({
          metricName: 'FCP',
          value: fcpEntry.startTime,
          entry: fcpEntry
        });
        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  private trackLCP(): void {
    if (!this.config.trackLCP) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        this.reportVital({
          metricName: 'LCP',
          value: lastEntry.startTime,
          entry: lastEntry,
          attribution: {
            element: (lastEntry as any).element?.tagName || 'unknown',
            url: (lastEntry as any).url || window.location.href,
            timeToFirstByte: performance.timing ? 
              performance.timing.responseStart - performance.timing.fetchStart : 0
          }
        });
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    setTimeout(() => observer.disconnect(), 10000);
  }

  private trackFID(): void {
    if (!this.config.trackFID) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.reportVital({
          metricName: 'FID',
          value: (entry as any).processingStart - entry.startTime,
          entry,
          attribution: {
            eventType: (entry as any).name,
            eventTarget: (entry as any).target?.tagName || 'unknown'
          }
        });
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  private trackCLS(): void {
    if (!this.config.trackCLS) return;

    let clsValue = 0;
    let clsEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      });

      this.reportVital({
        metricName: 'CLS',
        value: clsValue,
        entry: clsEntries[clsEntries.length - 1],
        attribution: {
          largestShiftTarget: this.getLargestShiftTarget(clsEntries),
          largestShiftTime: clsEntries.length > 0 ? clsEntries[0].startTime : 0,
          largestShiftValue: Math.max(...clsEntries.map(e => e.value))
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    setTimeout(() => {
      observer.disconnect();
      if (clsValue > 0) {
        this.reportVital({
          metricName: 'CLS',
          value: clsValue,
          entry: null,
          attribution: {
            largestShiftTarget: this.getLargestShiftTarget(clsEntries),
            largestShiftTime: clsEntries.length > 0 ? clsEntries[0].startTime : 0,
            largestShiftValue: Math.max(...clsEntries.map(e => e.value))
          }
        });
      }
    }, 5000);
  }

  private trackTTFB(): void {
    if (!this.config.trackTTFB) return;

    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.fetchStart;
      
      this.reportVital({
        metricName: 'TTFB',
        value: ttfb,
        entry: navigationEntry,
        attribution: {
          waitingTime: navigationEntry.responseStart - navigationEntry.requestStart,
          dnsTime: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
          connectionTime: navigationEntry.connectEnd - navigationEntry.connectStart,
          requestTime: navigationEntry.responseEnd - navigationEntry.responseStart
        }
      });
    }
  }

  private trackINP(): void {
    if (!this.config.trackINP) return;

    let maxINP = 0;
    let inpEntry: any = null;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const inp = (entry as any).processingEnd - entry.startTime;
        if (inp > maxINP) {
          maxINP = inp;
          inpEntry = entry;
        }
      });

      if (inpEntry) {
        this.reportVital({
          metricName: 'INP',
          value: maxINP,
          entry: inpEntry,
          attribution: {
            eventType: inpEntry.name,
            eventTarget: inpEntry.target?.tagName || 'unknown',
            inputDelay: inpEntry.processingStart - inpEntry.startTime,
            processingTime: inpEntry.processingEnd - inpEntry.processingStart,
            presentationDelay: inpEntry.duration - (inpEntry.processingEnd - inpEntry.startTime)
          }
        });
      }
    });

    observer.observe({ entryTypes: ['event'] });

    setTimeout(() => observer.disconnect(), 30000);
  }

  private getLargestShiftTarget(entries: any[]): string {
    if (entries.length === 0) return 'unknown';
    
    const largestEntry = entries.reduce((max, entry) => 
      entry.value > max.value ? entry : max
    );

    return largestEntry.sources?.[0]?.node?.tagName || 'unknown';
  }

  private reportVital({
    metricName,
    value,
    entry,
    attribution
  }: {
    metricName: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
    value: number;
    entry: any;
    attribution?: Partial<WebVitalAttribution>;
  }): void {
    const deviceInfo = this.getDeviceInfo();
    const networkInfo = this.getNetworkInfo();
    
    const vital: WebVitalEntry = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      page_url: window.location.href,
      metric_name: metricName,
      value: Math.round(value * 1000) / 1000,
      rating: this.getRating(metricName, value),
      attribution: attribution as WebVitalAttribution,
      device_info: deviceInfo,
      network_info: networkInfo
    };

    this.onVitalCallback(vital);
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 }
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
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
    return `vital_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }
}

export function createWebVitalsTracker(
  config: WebVitalsConfig,
  sessionId: string,
  userId?: string,
  onVital?: (vital: WebVitalEntry) => void
): WebVitalsTracker {
  const defaultOnVital = (vital: WebVitalEntry) => {
    console.log('Web Vital captured:', vital);
  };

  return new WebVitalsTracker(
    config,
    sessionId,
    userId,
    onVital || defaultOnVital
  );
}