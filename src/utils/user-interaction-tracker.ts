import { 
  UserInteractionEntry, 
  UserInteractionConfig, 
  TouchData, 
  ScrollData,
  DeviceInfo 
} from '../types/analytics-types';

export class UserInteractionTracker {
  private config: UserInteractionConfig;
  private sessionId: string;
  private userId?: string;
  private onInteractionCallback: (interaction: UserInteractionEntry) => void;
  private touchStartTime: number = 0;
  private scrollDepthThresholds = [25, 50, 75, 100];
  private reachedScrollDepths = new Set<number>();
  private heatmapData: Array<{ x: number; y: number; timestamp: number }> = [];
  private isActive = true;

  constructor(
    config: UserInteractionConfig,
    sessionId: string,
    userId: string | undefined,
    onInteraction: (interaction: UserInteractionEntry) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onInteractionCallback = onInteraction;
    this.initializeTracking();
  }

  private initializeTracking(): void {
    if (typeof window === 'undefined') {
      console.warn('User interaction tracking not supported in this environment');
      return;
    }

    if (this.config.trackClicks) {
      this.setupClickTracking();
    }

    if (this.config.trackTouches) {
      this.setupTouchTracking();
    }

    if (this.config.trackScrollDepth) {
      this.setupScrollTracking();
    }

    if (this.config.trackFormInteractions) {
      this.setupFormTracking();
    }

    if (this.config.enableHeatmaps) {
      this.setupHeatmapTracking();
    }
  }

  private setupClickTracking(): void {
    document.addEventListener('click', (event) => {
      if (!this.isActive) return;

      const target = event.target as HTMLElement;
      this.trackInteraction({
        interactionType: 'click',
        targetElement: this.getElementSelector(target),
        targetText: target.textContent?.trim() || '',
        coordinates: {
          x: event.clientX,
          y: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY
        },
        properties: {
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          href: (target as HTMLAnchorElement).href || undefined
        }
      });
    });
  }

  private setupTouchTracking(): void {
    let touchStartData: TouchData | null = null;

    document.addEventListener('touchstart', (event) => {
      if (!this.isActive || event.touches.length === 0) return;

      const touch = event.touches[0];
      const target = event.target as HTMLElement;
      
      touchStartData = {
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY,
        pressure: (touch as any).force || 0
      };

      this.touchStartTime = Date.now();
    });

    document.addEventListener('touchend', (event) => {
      if (!this.isActive || !touchStartData) return;

      const touchDuration = Date.now() - this.touchStartTime;
      const target = event.target as HTMLElement;

      this.trackInteraction({
        interactionType: 'touch',
        targetElement: this.getElementSelector(target),
        targetText: target.textContent?.trim() || '',
        touchData: {
          ...touchStartData,
          endTime: Date.now(),
          duration: touchDuration
        },
        properties: {
          duration: touchDuration,
          tagName: target.tagName,
          className: target.className,
          id: target.id
        }
      });

      touchStartData = null;
    });

    document.addEventListener('touchmove', (event) => {
      if (!this.isActive || event.touches.length === 0) return;

      const touch = event.touches[0];
      if (this.config.enableHeatmaps) {
        this.addHeatmapPoint(touch.clientX, touch.clientY);
      }
    });
  }

  private setupScrollTracking(): void {
    let ticking = false;
    let lastScrollTop = 0;
    let scrollStartTime = Date.now();

    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

      const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
      const scrollSpeed = Math.abs(scrollTop - lastScrollTop);

      this.checkScrollDepthMilestones(scrollPercent);

      this.trackInteraction({
        interactionType: 'scroll',
        scrollData: {
          scrollTop,
          scrollPercent,
          scrollHeight,
          clientHeight,
          direction: scrollDirection,
          speed: scrollSpeed,
          startTime: scrollStartTime,
          duration: Date.now() - scrollStartTime
        },
        properties: {
          percent: scrollPercent,
          direction: scrollDirection,
          speed: scrollSpeed
        }
      });

      lastScrollTop = scrollTop;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!this.isActive || ticking) return;
      requestAnimationFrame(trackScroll);
      ticking = true;
    });

    window.addEventListener('scrollend', () => {
      if (!this.isActive) return;
      scrollStartTime = Date.now();
    });
  }

  private setupFormTracking(): void {
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (!this.isActive || !this.isFormElement(target)) return;

      this.trackInteraction({
        interactionType: 'form_focus',
        targetElement: this.getElementSelector(target),
        properties: {
          fieldType: (target as HTMLInputElement).type || target.tagName,
          fieldName: (target as HTMLInputElement).name || '',
          placeholder: (target as HTMLInputElement).placeholder || ''
        }
      });
    });

    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (!this.isActive || !this.isFormElement(target)) return;

      this.trackInteraction({
        interactionType: 'form_input',
        targetElement: this.getElementSelector(target),
        properties: {
          fieldType: target.type || target.tagName,
          fieldName: target.name || '',
          valueLength: target.value?.length || 0
        }
      });
    });

    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement;
      if (!this.isActive || target.tagName !== 'FORM') return;

      this.trackInteraction({
        interactionType: 'form_submit',
        targetElement: this.getElementSelector(target),
        properties: {
          formId: target.id,
          formAction: target.action,
          formMethod: target.method,
          fieldCount: target.elements.length
        }
      });
    });
  }

  private setupHeatmapTracking(): void {
    if (!this.config.enableHeatmaps) return;

    document.addEventListener('mousemove', (event) => {
      if (!this.isActive) return;
      this.addHeatmapPoint(event.clientX, event.clientY);
    });

    setInterval(() => {
      if (this.heatmapData.length > 0) {
        this.sendHeatmapData();
      }
    }, this.config.heatmapSampleRate || 5000);
  }

  private addHeatmapPoint(x: number, y: number): void {
    this.heatmapData.push({
      x: Math.round(x),
      y: Math.round(y),
      timestamp: Date.now()
    });

    if (this.heatmapData.length > 1000) {
      this.heatmapData = this.heatmapData.slice(-500);
    }
  }

  private sendHeatmapData(): void {
    if (this.heatmapData.length === 0) return;

    this.trackInteraction({
      interactionType: 'heatmap',
      properties: {
        points: this.heatmapData.slice(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href
      }
    });

    this.heatmapData = [];
  }

  private checkScrollDepthMilestones(scrollPercent: number): void {
    this.scrollDepthThresholds.forEach(threshold => {
      if (scrollPercent >= threshold && !this.reachedScrollDepths.has(threshold)) {
        this.reachedScrollDepths.add(threshold);
        
        this.trackInteraction({
          interactionType: 'scroll_milestone',
          properties: {
            milestone: threshold,
            scrollPercent,
            timeToReach: Date.now() - parseInt(this.sessionId.split('_')[1])
          }
        });
      }
    });
  }

  private trackInteraction(data: Partial<UserInteractionEntry>): void {
    const interaction: UserInteractionEntry = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      page_url: window.location.href,
      interaction_type: data.interactionType!,
      target_element: data.targetElement || '',
      target_text: data.targetText || '',
      coordinates: data.coordinates,
      touch_data: data.touchData,
      scroll_data: data.scrollData,
      device_info: this.getDeviceInfo(),
      properties: data.properties || {}
    };

    this.onInteractionCallback(interaction);
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }

    const parent = element.parentElement;
    if (parent) {
      const index = Array.from(parent.children).indexOf(element);
      return `${this.getElementSelector(parent)} > ${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }

    return element.tagName.toLowerCase();
  }

  private isFormElement(element: HTMLElement): boolean {
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
    return formElements.includes(element.tagName);
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
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
  }

  public getHeatmapData(): Array<{ x: number; y: number; timestamp: number }> {
    return this.heatmapData.slice();
  }

  public getScrollDepthData(): {
    reachedDepths: number[];
    currentPercent: number;
  } {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const currentPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

    return {
      reachedDepths: Array.from(this.reachedScrollDepths),
      currentPercent
    };
  }

  public destroy(): void {
    this.isActive = false;
    this.sendHeatmapData();
    this.heatmapData = [];
    this.reachedScrollDepths.clear();
    console.log('UserInteractionTracker destroyed');
  }
}