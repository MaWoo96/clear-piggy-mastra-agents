import { 
  FinancialMetricEntry, 
  FinancialMetricsConfig 
} from '../types/analytics-types';

export class FinancialMetricsTracker {
  private config: FinancialMetricsConfig;
  private sessionId: string;
  private userId?: string;
  private onMetricCallback: (metric: FinancialMetricEntry) => void;
  private isActive = true;
  private conversionFunnels: Map<string, any[]> = new Map();
  private revenueTracking: Map<string, number> = new Map();

  constructor(
    config: FinancialMetricsConfig,
    sessionId: string,
    userId: string | undefined,
    onMetric: (metric: FinancialMetricEntry) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onMetricCallback = onMetric;
    this.initializeTracking();
  }

  private initializeTracking(): void {
    if (this.config.trackTransactionCompletions) {
      this.setupTransactionTracking();
    }

    if (this.config.trackBudgetCreations) {
      this.setupBudgetTracking();
    }

    if (this.config.trackGoalCompletions) {
      this.setupGoalTracking();
    }

    if (this.config.trackSubscriptionEvents) {
      this.setupSubscriptionTracking();
    }

    console.log('FinancialMetricsTracker initialized');
  }

  private setupTransactionTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (this.isTransactionButton(target)) {
        this.startTransactionFlow(target);
      }
    });

    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      
      if (this.isTransactionForm(form)) {
        this.trackTransactionAttempt(form);
      }
    });
  }

  private setupBudgetTracking(): void {
    const budgetCreationSelectors = [
      '[data-track="budget-create"]',
      '.budget-form',
      '#create-budget-form'
    ];

    budgetCreationSelectors.forEach(selector => {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.matches(selector) || target.closest(selector)) {
          this.trackBudgetCreationStart();
        }
      });
    });

    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (this.isBudgetForm(form)) {
        this.trackBudgetCreationAttempt(form);
      }
    });
  }

  private setupGoalTracking(): void {
    const goalSelectors = [
      '[data-track="goal"]',
      '.goal-item',
      '.savings-goal'
    ];

    goalSelectors.forEach(selector => {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const goalElement = target.closest(selector);
        
        if (goalElement) {
          this.trackGoalInteraction(goalElement as HTMLElement);
        }
      });
    });
  }

  private setupSubscriptionTracking(): void {
    const subscriptionSelectors = [
      '[data-track="subscription"]',
      '.subscription-button',
      '.upgrade-button',
      '.premium-button'
    ];

    subscriptionSelectors.forEach(selector => {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.matches(selector) || target.closest(selector)) {
          this.trackSubscriptionInteraction(target);
        }
      });
    });
  }

  public trackTransactionCompletion(
    amount: number,
    currency: string = 'USD',
    transactionType: string = 'expense',
    category?: string,
    properties?: Record<string, any>
  ): void {
    this.trackFinancialMetric({
      metricType: 'transaction_completion',
      value: amount,
      currency,
      properties: {
        transactionType,
        category,
        completedAt: Date.now(),
        ...properties
      }
    });

    this.updateConversionFunnel('transaction', 'completed', { amount, currency, category });
  }

  public trackBudgetCreation(
    budgetAmount: number,
    category: string,
    timeframe: 'weekly' | 'monthly' | 'yearly',
    properties?: Record<string, any>
  ): void {
    this.trackFinancialMetric({
      metricType: 'budget_creation',
      value: budgetAmount,
      currency: 'USD',
      properties: {
        category,
        timeframe,
        createdAt: Date.now(),
        ...properties
      }
    });

    this.updateConversionFunnel('budget', 'created', { budgetAmount, category, timeframe });
  }

  public trackGoalCompletion(
    goalType: string,
    targetAmount: number,
    achievedAmount: number,
    completionRate: number,
    properties?: Record<string, any>
  ): void {
    this.trackFinancialMetric({
      metricType: 'goal_completion',
      value: achievedAmount,
      currency: 'USD',
      properties: {
        goalType,
        targetAmount,
        completionRate,
        completedAt: Date.now(),
        ...properties
      }
    });

    this.updateConversionFunnel('goal', 'completed', { 
      goalType, 
      targetAmount, 
      achievedAmount, 
      completionRate 
    });
  }

  public trackSubscriptionEvent(
    eventType: 'upgrade' | 'downgrade' | 'cancel' | 'renew',
    planName: string,
    amount: number,
    currency: string = 'USD',
    properties?: Record<string, any>
  ): void {
    this.trackFinancialMetric({
      metricType: 'subscription_event',
      value: amount,
      currency,
      properties: {
        eventType,
        planName,
        eventAt: Date.now(),
        ...properties
      }
    });

    this.updateRevenueTracking(eventType, amount);
  }

  public trackRevenueEvent(
    revenueType: string,
    amount: number,
    currency: string = 'USD',
    properties?: Record<string, any>
  ): void {
    this.trackFinancialMetric({
      metricType: 'revenue',
      value: amount,
      currency,
      properties: {
        revenueType,
        recordedAt: Date.now(),
        ...properties
      }
    });

    this.updateRevenueTracking(revenueType, amount);
  }

  public trackConversionFunnelStep(
    funnelName: string,
    step: string,
    properties?: Record<string, any>
  ): void {
    if (!this.conversionFunnels.has(funnelName)) {
      this.conversionFunnels.set(funnelName, []);
    }

    const funnelData = {
      step,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      properties: properties || {}
    };

    this.conversionFunnels.get(funnelName)!.push(funnelData);

    this.trackFinancialMetric({
      metricType: 'conversion_funnel',
      value: 1,
      properties: {
        funnelName,
        step,
        funnelData,
        recordedAt: Date.now()
      }
    });
  }

  private startTransactionFlow(element: HTMLElement): void {
    const transactionType = element.dataset.transactionType || 'expense';
    const category = element.dataset.category || 'general';
    
    this.trackConversionFunnelStep('transaction', 'started', {
      transactionType,
      category,
      elementText: element.textContent?.trim()
    });
  }

  private trackTransactionAttempt(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const amount = parseFloat(formData.get('amount') as string) || 0;
    const category = formData.get('category') as string || 'general';
    
    this.trackConversionFunnelStep('transaction', 'attempted', {
      amount,
      category,
      formId: form.id
    });

    setTimeout(() => {
      if (this.wasTransactionSuccessful()) {
        this.trackTransactionCompletion(amount, 'USD', 'expense', category);
      } else {
        this.trackConversionFunnelStep('transaction', 'failed', {
          amount,
          category,
          reason: 'form_validation_error'
        });
      }
    }, 1000);
  }

  private trackBudgetCreationStart(): void {
    this.trackConversionFunnelStep('budget', 'started', {
      page: window.location.pathname
    });
  }

  private trackBudgetCreationAttempt(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const budgetAmount = parseFloat(formData.get('amount') as string) || 0;
    const category = formData.get('category') as string || 'general';
    const timeframe = formData.get('timeframe') as string || 'monthly';
    
    this.trackConversionFunnelStep('budget', 'attempted', {
      budgetAmount,
      category,
      timeframe
    });

    setTimeout(() => {
      if (this.wasBudgetCreationSuccessful()) {
        this.trackBudgetCreation(budgetAmount, category, timeframe as any);
      } else {
        this.trackConversionFunnelStep('budget', 'failed', {
          budgetAmount,
          category,
          reason: 'form_validation_error'
        });
      }
    }, 1000);
  }

  private trackGoalInteraction(element: HTMLElement): void {
    const goalType = element.dataset.goalType || 'savings';
    const goalAmount = parseFloat(element.dataset.goalAmount || '0');
    
    this.trackConversionFunnelStep('goal', 'interacted', {
      goalType,
      goalAmount,
      elementText: element.textContent?.trim()
    });
  }

  private trackSubscriptionInteraction(element: HTMLElement): void {
    const planName = element.dataset.planName || 'premium';
    const planPrice = parseFloat(element.dataset.planPrice || '0');
    
    this.trackConversionFunnelStep('subscription', 'clicked', {
      planName,
      planPrice,
      elementText: element.textContent?.trim()
    });
  }

  private isTransactionButton(element: HTMLElement): boolean {
    return element.matches('[data-track="transaction"]') ||
           element.closest('.transaction-button') !== null ||
           element.classList.contains('add-expense') ||
           element.classList.contains('add-income');
  }

  private isTransactionForm(form: HTMLFormElement): boolean {
    return form.matches('[data-track="transaction-form"]') ||
           form.classList.contains('transaction-form') ||
           form.id.includes('transaction');
  }

  private isBudgetForm(form: HTMLFormElement): boolean {
    return form.matches('[data-track="budget-form"]') ||
           form.classList.contains('budget-form') ||
           form.id.includes('budget');
  }

  private wasTransactionSuccessful(): boolean {
    return !document.querySelector('.error-message, .validation-error');
  }

  private wasBudgetCreationSuccessful(): boolean {
    return !document.querySelector('.error-message, .validation-error');
  }

  private updateConversionFunnel(funnelType: string, step: string, data: any): void {
    const funnelKey = `${funnelType}_${this.sessionId}`;
    if (!this.conversionFunnels.has(funnelKey)) {
      this.conversionFunnels.set(funnelKey, []);
    }
    
    this.conversionFunnels.get(funnelKey)!.push({
      step,
      timestamp: Date.now(),
      data
    });
  }

  private updateRevenueTracking(type: string, amount: number): void {
    const currentRevenue = this.revenueTracking.get(type) || 0;
    this.revenueTracking.set(type, currentRevenue + amount);
  }

  private trackFinancialMetric(data: Partial<FinancialMetricEntry>): void {
    if (!this.isActive) return;

    const metric: FinancialMetricEntry = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      metric_type: data.metricType!,
      value: data.value!,
      currency: data.currency || 'USD',
      properties: data.properties || {}
    };

    this.onMetricCallback(metric);
  }

  public getFinancialSummary(): {
    conversionRates: Record<string, number>;
    revenueByType: Record<string, number>;
    totalRevenue: number;
    funnelCompletionRates: Record<string, number>;
  } {
    const conversionRates: Record<string, number> = {};
    const funnelCompletionRates: Record<string, number> = {};

    this.conversionFunnels.forEach((steps, funnelName) => {
      const startedSteps = steps.filter(s => s.step === 'started' || s.step === 'clicked').length;
      const completedSteps = steps.filter(s => s.step === 'completed' || s.step === 'created').length;
      
      if (startedSteps > 0) {
        conversionRates[funnelName] = completedSteps / startedSteps;
        funnelCompletionRates[funnelName] = (completedSteps / startedSteps) * 100;
      }
    });

    const revenueByType = Object.fromEntries(this.revenueTracking);
    const totalRevenue = Array.from(this.revenueTracking.values()).reduce((sum, amount) => sum + amount, 0);

    return {
      conversionRates,
      revenueByType,
      totalRevenue,
      funnelCompletionRates
    };
  }

  public getFunnelAnalysis(funnelName: string): {
    steps: any[];
    dropoffPoints: any[];
    conversionRate: number;
    averageTimeToComplete: number;
  } {
    const funnelData = this.conversionFunnels.get(funnelName) || [];
    const stepCounts: Record<string, number> = {};
    const stepTimestamps: Record<string, number[]> = {};

    funnelData.forEach(step => {
      stepCounts[step.step] = (stepCounts[step.step] || 0) + 1;
      if (!stepTimestamps[step.step]) {
        stepTimestamps[step.step] = [];
      }
      stepTimestamps[step.step].push(step.timestamp);
    });

    const steps = Object.entries(stepCounts).map(([step, count]) => ({
      step,
      count,
      percentage: funnelData.length > 0 ? (count / funnelData.length) * 100 : 0
    }));

    const dropoffPoints = steps.slice(1).map((step, index) => ({
      fromStep: steps[index].step,
      toStep: step.step,
      dropoffRate: steps[index].count > 0 ? ((steps[index].count - step.count) / steps[index].count) * 100 : 0
    }));

    const startedCount = stepCounts.started || stepCounts.clicked || 0;
    const completedCount = stepCounts.completed || stepCounts.created || 0;
    const conversionRate = startedCount > 0 ? (completedCount / startedCount) * 100 : 0;

    const completedTimestamps = stepTimestamps.completed || stepTimestamps.created || [];
    const startedTimestamps = stepTimestamps.started || stepTimestamps.clicked || [];
    const averageTimeToComplete = completedTimestamps.length > 0 && startedTimestamps.length > 0 ?
      (completedTimestamps[0] - startedTimestamps[0]) : 0;

    return {
      steps,
      dropoffPoints,
      conversionRate,
      averageTimeToComplete
    };
  }

  private generateId(): string {
    return `financial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
  }

  public destroy(): void {
    this.isActive = false;
    this.conversionFunnels.clear();
    this.revenueTracking.clear();
    console.log('FinancialMetricsTracker destroyed');
  }
}