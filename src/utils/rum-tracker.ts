import { 
  RUMEntry, 
  RUMConfig, 
  DeviceInfo, 
  NetworkInfo 
} from '../types/analytics-types';

export class RUMTracker {
  private config: RUMConfig;
  private sessionId: string;
  private userId?: string;
  private onRUMCallback: (rumData: RUMEntry) => void;
  private isActive = true;
  private pageLoadStartTime: number;
  private performanceObserver: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private visibilityChangeTime: number = Date.now();
  private sessionStartTime: number = Date.now();

  constructor(
    config: RUMConfig,
    sessionId: string,
    userId: string | undefined,
    onRUM: (rumData: RUMEntry) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onRUMCallback = onRUM;
    this.pageLoadStartTime = Date.now();
    this.initializeRUMTracking();
  }

  private initializeRUMTracking(): void {
    if (typeof window === 'undefined') {
      console.warn('RUM tracking not supported in this environment');
      return;
    }

    this.trackPageLoad();
    this.setupPerformanceObserver();
    this.trackUserEngagement();
    this.trackVisibilityChanges();
    this.setupErrorTracking();
    
    if (this.config.trackViewportMetrics) {
      this.setupViewportTracking();
    }

    console.log('RUMTracker initialized');
  }

  private trackPageLoad(): void {
    if (document.readyState === 'complete') {
      this.processPageLoadMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.processPageLoadMetrics(), 0);
      });
    }
  }

  private processPageLoadMetrics(): void {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigationEntry) return;

    const pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
    const timeToInteractive = this.calculateTimeToInteractive();
    const firstInputDelay = this.getFirstInputDelay();

    this.reportRUMData({
      pageLoadTime,
      timeToInteractive,
      firstInputDelay,
      performanceTiming: {
        navigationStart: navigationEntry.navigationStart || 0,
        unloadEventStart: navigationEntry.unloadEventStart,
        unloadEventEnd: navigationEntry.unloadEventEnd,
        redirectStart: navigationEntry.redirectStart,
        redirectEnd: navigationEntry.redirectEnd,
        fetchStart: navigationEntry.fetchStart,
        domainLookupStart: navigationEntry.domainLookupStart,
        domainLookupEnd: navigationEntry.domainLookupEnd,
        connectStart: navigationEntry.connectStart,
        connectEnd: navigationEntry.connectEnd,
        secureConnectionStart: navigationEntry.secureConnectionStart,
        requestStart: navigationEntry.requestStart,
        responseStart: navigationEntry.responseStart,
        responseEnd: navigationEntry.responseEnd,
        domLoading: navigationEntry.domLoading,
        domInteractive: navigationEntry.domInteractive,
        domContentLoadedEventStart: navigationEntry.domContentLoadedEventStart,
        domContentLoadedEventEnd: navigationEntry.domContentLoadedEventEnd,
        domComplete: navigationEntry.domComplete,
        loadEventStart: navigationEntry.loadEventStart,
        loadEventEnd: navigationEntry.loadEventEnd
      },
      resourceTiming: this.getResourceTimingData()
    });
  }

  private calculateTimeToInteractive(): number {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigationEntry) return 0;

    const domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart;
    const longTasksAfterDCL = performance.getEntriesByType('longtask')
      .filter(task => task.startTime > domContentLoaded)
      .length;

    if (longTasksAfterDCL === 0) {
      return domContentLoaded;
    }

    return navigationEntry.loadEventEnd - navigationEntry.fetchStart;
  }

  private getFirstInputDelay(): number {
    let firstInputDelay = 0;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'first-input') {
          firstInputDelay = (entry as any).processingStart - entry.startTime;
          observer.disconnect();
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('First input delay tracking not supported');
    }

    return firstInputDelay;
  }

  private getResourceTimingData(): any[] {
    return performance.getEntriesByType('resource')
      .slice(-50)
      .map(entry => {
        const resource = entry as PerformanceResourceTiming;
        return {
          name: resource.name,
          entryType: resource.entryType,
          startTime: resource.startTime,
          duration: resource.duration,
          transferSize: resource.transferSize,
          encodedBodySize: resource.encodedBodySize,
          decodedBodySize: resource.decodedBodySize,
          fetchStart: resource.fetchStart,
          domainLookupStart: resource.domainLookupStart,
          domainLookupEnd: resource.domainLookupEnd,
          connectStart: resource.connectStart,
          connectEnd: resource.connectEnd,
          requestStart: resource.requestStart,
          responseStart: resource.responseStart,
          responseEnd: resource.responseEnd
        };
      });
  }

  private setupPerformanceObserver(): void {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'paint') {
          this.handlePaintEntry(entry as PerformancePaintTiming);
        } else if (entry.entryType === 'largest-contentful-paint') {
          this.handleLCPEntry(entry);
        } else if (entry.entryType === 'layout-shift') {
          this.handleLayoutShiftEntry(entry);
        } else if (entry.entryType === 'longtask') {
          this.handleLongTaskEntry(entry);
        }
      });
    });

    try {
      this.performanceObserver.observe({ 
        entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'longtask'] 
      });
    } catch (e) {
      console.warn('Some performance entry types not supported');
    }
  }

  private handlePaintEntry(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      this.reportRUMData({
        firstContentfulPaint: entry.startTime
      });
    }
  }

  private handleLCPEntry(entry: any): void {
    this.reportRUMData({
      largestContentfulPaint: entry.startTime,
      lcpElement: entry.element?.tagName || 'unknown'
    });
  }

  private handleLayoutShiftEntry(entry: any): void {
    if (!entry.hadRecentInput) {
      this.reportRUMData({
        cumulativeLayoutShift: entry.value,
        layoutShiftSources: entry.sources?.map((source: any) => ({
          node: source.node?.tagName || 'unknown',
          previousRect: source.previousRect,
          currentRect: source.currentRect
        })) || []
      });
    }
  }

  private handleLongTaskEntry(entry: any): void {
    this.reportRUMData({
      longTask: {
        duration: entry.duration,
        startTime: entry.startTime,
        attribution: entry.attribution?.map((attr: any) => ({
          name: attr.name,
          entryType: attr.entryType,
          startTime: attr.startTime,
          duration: attr.duration
        })) || []
      }
    });
  }

  private trackUserEngagement(): void {
    let clickCount = 0;
    let scrollDepth = 0;
    let maxScrollDepth = 0;
    let timeOnPage = 0;
    let isVisible = !document.hidden;
    let visibilityStart = Date.now();

    const updateEngagement = () => {
      const currentTime = Date.now();
      if (isVisible) {
        timeOnPage += currentTime - visibilityStart;
      }
      visibilityStart = currentTime;

      this.reportRUMData({
        userEngagement: {
          clickCount,
          scrollDepth: maxScrollDepth,
          timeOnPage,
          isActive: isVisible,
          sessionDuration: currentTime - this.sessionStartTime
        }
      });
    };

    document.addEventListener('click', () => {
      clickCount++;
      if (clickCount % 10 === 0) {
        updateEngagement();
      }
    });

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      scrollDepth = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
    });

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      updateEngagement();
    });

    setInterval(updateEngagement, this.config.reportingInterval || 30000);
  }

  private trackVisibilityChanges(): void {
    document.addEventListener('visibilitychange', () => {
      const currentTime = Date.now();
      const visibilityDuration = currentTime - this.visibilityChangeTime;
      
      this.reportRUMData({
        visibilityChange: {
          isVisible: !document.hidden,
          previousVisibilityDuration: visibilityDuration,
          timestamp: currentTime
        }
      });
      
      this.visibilityChangeTime = currentTime;
    });
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.reportRUMData({
        jsError: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          timestamp: Date.now()
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportRUMData({
        promiseRejection: {
          reason: String(event.reason),
          stack: event.reason?.stack,
          timestamp: Date.now()
        }
      });
    });
  }

  private setupViewportTracking(): void {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.reportRUMData({
            viewportMetrics: {
              elementVisible: entry.target.tagName,
              visibilityRatio: entry.intersectionRatio,
              boundingRect: entry.boundingClientRect,
              intersectionRect: entry.intersectionRect,
              timestamp: Date.now()
            }
          });
        }
      });
    }, {
      threshold: [0.1, 0.5, 0.9]
    });

    document.querySelectorAll('[data-rum-track]').forEach(element => {
      this.intersectionObserver?.observe(element);
    });
  }

  private reportRUMData(data: Partial<RUMEntry>): void {
    if (!this.isActive) return;

    const rumEntry: RUMEntry = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      page_url: window.location.href,
      page_load_time: data.pageLoadTime,
      time_to_interactive: data.timeToInteractive,
      first_input_delay: data.firstInputDelay,
      largest_contentful_paint: data.largestContentfulPaint,
      cumulative_layout_shift: data.cumulativeLayoutShift,
      device_info: this.getDeviceInfo(),
      network_info: this.getNetworkInfo(),
      performance_timing: data.performanceTiming,
      resource_timing: data.resourceTiming,
      ...data
    };

    this.onRUMCallback(rumEntry);
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

  public trackCustomRUMMetric(name: string, value: number, properties?: Record<string, any>): void {
    this.reportRUMData({
      customMetric: {
        name,
        value,
        properties: properties || {},
        timestamp: Date.now()
      }
    });
  }

  public trackPageTransition(fromUrl: string, toUrl: string, transitionType: string): void {
    this.reportRUMData({
      pageTransition: {
        fromUrl,
        toUrl,
        transitionType,
        timestamp: Date.now(),
        duration: Date.now() - this.pageLoadStartTime
      }
    });

    this.pageLoadStartTime = Date.now();
  }

  public getSessionMetrics(): any {
    const currentTime = Date.now();
    return {
      sessionId: this.sessionId,
      sessionDuration: currentTime - this.sessionStartTime,
      currentPage: window.location.href,
      isActive: this.isActive,
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo()
    };
  }

  private generateId(): string {
    return `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
  }

  public destroy(): void {
    this.isActive = false;
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    console.log('RUMTracker destroyed');
  }
}