import { 
  ErrorEntry, 
  ErrorTrackingConfig, 
  DeviceInfo 
} from '../types/analytics-types';

export class ErrorTracker {
  private config: ErrorTrackingConfig;
  private sessionId: string;
  private userId?: string;
  private onErrorCallback: (error: ErrorEntry) => void;
  private isActive = true;
  private errorCount = 0;
  private seenErrors = new Set<string>();

  constructor(
    config: ErrorTrackingConfig,
    sessionId: string,
    userId: string | undefined,
    onError: (error: ErrorEntry) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onErrorCallback = onError;
    this.initializeTracking();
  }

  private initializeTracking(): void {
    if (typeof window === 'undefined') {
      console.warn('Error tracking not supported in this environment');
      return;
    }

    if (this.config.trackJavaScriptErrors) {
      this.setupJavaScriptErrorTracking();
    }

    if (this.config.trackNetworkErrors) {
      this.setupNetworkErrorTracking();
    }

    if (this.config.trackResourceErrors) {
      this.setupResourceErrorTracking();
    }

    if (this.config.trackConsoleErrors) {
      this.setupConsoleErrorTracking();
    }

    if (this.config.trackPromiseRejections) {
      this.setupPromiseRejectionTracking();
    }

    console.log('ErrorTracker initialized');
  }

  private setupJavaScriptErrorTracking(): void {
    window.addEventListener('error', (event) => {
      if (!this.isActive) return;

      this.trackError({
        errorType: 'javascript',
        message: event.message || 'Unknown JavaScript error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        source: 'window.onerror',
        properties: {
          errorObject: this.serializeError(event.error),
          timeStamp: event.timeStamp
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (!this.isActive) return;

      this.trackError({
        errorType: 'unhandled_promise_rejection',
        message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        source: 'unhandledrejection',
        properties: {
          reason: this.serializeError(event.reason),
          promise: '[Promise object]'
        }
      });
    });
  }

  private setupNetworkErrorTracking(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok && this.isActive) {
          this.trackError({
            errorType: 'network',
            message: `Network request failed: ${response.status} ${response.statusText}`,
            source: 'fetch',
            properties: {
              url: args[0]?.toString() || 'unknown',
              status: response.status,
              statusText: response.statusText,
              method: (args[1] as RequestInit)?.method || 'GET',
              headers: this.serializeHeaders(response.headers)
            }
          });
        }
        
        return response;
      } catch (error) {
        if (this.isActive) {
          this.trackError({
            errorType: 'network',
            message: (error as Error).message || 'Network request failed',
            stack: (error as Error).stack,
            source: 'fetch',
            properties: {
              url: args[0]?.toString() || 'unknown',
              method: (args[1] as RequestInit)?.method || 'GET',
              errorObject: this.serializeError(error)
            }
          });
        }
        throw error;
      }
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._method = method;
      (this as any)._url = url.toString();
      return originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(body?: any) {
      const xhr = this;
      
      xhr.addEventListener('error', () => {
        if (!this.isActive) return;
        
        this.trackError({
          errorType: 'network',
          message: 'XMLHttpRequest failed',
          source: 'xhr',
          properties: {
            url: (xhr as any)._url || 'unknown',
            method: (xhr as any)._method || 'unknown',
            status: xhr.status,
            statusText: xhr.statusText,
            readyState: xhr.readyState
          }
        });
      }.bind(this));

      xhr.addEventListener('load', () => {
        if (!this.isActive || xhr.status < 400) return;

        this.trackError({
          errorType: 'network',
          message: `XMLHttpRequest failed: ${xhr.status} ${xhr.statusText}`,
          source: 'xhr',
          properties: {
            url: (xhr as any)._url || 'unknown',
            method: (xhr as any)._method || 'unknown',
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText?.substring(0, 1000)
          }
        });
      }.bind(this));

      return originalXHRSend.call(xhr, body);
    };
  }

  private setupResourceErrorTracking(): void {
    window.addEventListener('error', (event) => {
      if (!this.isActive || !event.target) return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
        this.trackError({
          errorType: 'resource',
          message: `Failed to load ${target.tagName.toLowerCase()}: ${(target as any).src || (target as any).href}`,
          source: 'resource_load_error',
          properties: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href || '',
            outerHTML: target.outerHTML.substring(0, 500)
          }
        });
      }
    }, true);
  }

  private setupConsoleErrorTracking(): void {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      if (this.isActive) {
        this.trackError({
          errorType: 'console',
          message: args.map(arg => String(arg)).join(' '),
          source: 'console.error',
          properties: {
            level: 'error',
            arguments: args.map(arg => this.serializeError(arg))
          }
        });
      }
      return originalConsoleError.apply(console, args);
    };

    if (this.config.trackConsoleWarnings) {
      console.warn = (...args: any[]) => {
        if (this.isActive) {
          this.trackError({
            errorType: 'console',
            message: args.map(arg => String(arg)).join(' '),
            source: 'console.warn',
            properties: {
              level: 'warn',
              arguments: args.map(arg => this.serializeError(arg))
            }
          });
        }
        return originalConsoleWarn.apply(console, args);
      };
    }
  }

  private setupPromiseRejectionTracking(): void {
    window.addEventListener('unhandledrejection', (event) => {
      if (!this.isActive) return;

      this.trackError({
        errorType: 'promise_rejection',
        message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        source: 'unhandledrejection',
        properties: {
          reason: this.serializeError(event.reason),
          handled: false
        }
      });
    });

    window.addEventListener('rejectionhandled', (event) => {
      if (!this.isActive) return;

      this.trackError({
        errorType: 'promise_rejection',
        message: 'Promise rejection was handled after being unhandled',
        source: 'rejectionhandled',
        properties: {
          reason: this.serializeError(event.reason),
          handled: true
        }
      });
    });
  }

  public trackCustomError(error: Error | string, context?: Record<string, any>): void {
    if (!this.isActive) return;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    this.trackError({
      errorType: 'custom',
      message: errorMessage,
      stack: errorStack,
      source: 'manual',
      properties: {
        context: context || {},
        customError: true,
        errorObject: this.serializeError(error)
      }
    });
  }

  public trackPerformanceError(metricName: string, threshold: number, actualValue: number): void {
    if (!this.isActive) return;

    this.trackError({
      errorType: 'performance',
      message: `Performance threshold exceeded for ${metricName}: ${actualValue}ms (threshold: ${threshold}ms)`,
      source: 'performance_monitor',
      properties: {
        metricName,
        threshold,
        actualValue,
        exceedanceRatio: actualValue / threshold,
        severity: actualValue > threshold * 2 ? 'high' : 'medium'
      }
    });
  }

  private trackError(errorData: Partial<ErrorEntry>): void {
    if (this.errorCount >= this.config.maxErrorsPerSession) {
      console.warn('Max errors per session reached, skipping error tracking');
      return;
    }

    const errorHash = this.getErrorHash(errorData);
    if (this.seenErrors.has(errorHash)) {
      if (!this.config.allowDuplicates) {
        return;
      }
    }

    this.seenErrors.add(errorHash);
    this.errorCount++;

    const error: ErrorEntry = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      error_type: errorData.errorType!,
      message: errorData.message!,
      filename: errorData.filename,
      lineno: errorData.lineno,
      colno: errorData.colno,
      stack: errorData.stack,
      source: errorData.source!,
      device_info: this.getDeviceInfo(),
      severity: this.determineSeverity(errorData),
      fingerprint: errorHash,
      properties: errorData.properties || {}
    };

    this.onErrorCallback(error);
  }

  private getErrorHash(errorData: Partial<ErrorEntry>): string {
    const hashString = `${errorData.errorType}-${errorData.message}-${errorData.filename}-${errorData.lineno}`;
    return btoa(hashString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private determineSeverity(errorData: Partial<ErrorEntry>): 'low' | 'medium' | 'high' | 'critical' {
    if (errorData.errorType === 'javascript' && errorData.stack) {
      return 'high';
    }
    if (errorData.errorType === 'network' && errorData.properties?.status >= 500) {
      return 'high';
    }
    if (errorData.errorType === 'resource') {
      return 'medium';
    }
    if (errorData.errorType === 'console' && errorData.properties?.level === 'error') {
      return 'medium';
    }
    if (errorData.errorType === 'performance') {
      return errorData.properties?.severity === 'high' ? 'high' : 'medium';
    }
    return 'low';
  }

  private serializeError(error: any): any {
    if (error === null || error === undefined) {
      return error;
    }

    if (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean') {
      return error;
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    if (typeof error === 'object') {
      try {
        const serialized: any = {};
        for (const key in error) {
          if (error.hasOwnProperty(key)) {
            serialized[key] = this.serializeError(error[key]);
          }
        }
        return serialized;
      } catch (e) {
        return '[Unserializable Object]';
      }
    }

    return String(error);
  }

  private serializeHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
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

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    errorsByType: Record<string, number>;
  } {
    const errorsByType: Record<string, number> = {};
    
    return {
      totalErrors: this.errorCount,
      uniqueErrors: this.seenErrors.size,
      errorsByType
    };
  }

  public clearErrorHistory(): void {
    this.seenErrors.clear();
    this.errorCount = 0;
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
  }

  public destroy(): void {
    this.isActive = false;
    this.seenErrors.clear();
    console.log('ErrorTracker destroyed');
  }
}