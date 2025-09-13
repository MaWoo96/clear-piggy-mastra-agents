import { 
  ABTestEntry, 
  ABTestingConfig, 
  ABTest, 
  ABTestVariation 
} from '../types/analytics-types';

export class ABTestingFramework {
  private config: ABTestingConfig;
  private sessionId: string;
  private userId?: string;
  private onABTestCallback: (abTest: ABTestEntry) => void;
  private activeTests: Map<string, ABTest> = new Map();
  private userVariations: Map<string, string> = new Map();
  private testResults: Map<string, any[]> = new Map();

  constructor(
    config: ABTestingConfig,
    sessionId: string,
    userId: string | undefined,
    onABTest: (abTest: ABTestEntry) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onABTestCallback = onABTest;
    this.initializeTests();
  }

  private initializeTests(): void {
    if (this.config.tests && this.config.tests.length > 0) {
      this.config.tests.forEach(test => {
        this.activeTests.set(test.name, test);
        this.assignUserToVariation(test);
      });
    }

    console.log(`ABTestingFramework initialized with ${this.activeTests.size} tests`);
  }

  private assignUserToVariation(test: ABTest): void {
    if (this.userVariations.has(test.name)) {
      return;
    }

    let variation: string;

    if (this.config.stickyBehavior && this.userId) {
      variation = this.getStickyVariation(test, this.userId);
    } else {
      variation = this.getRandomVariation(test);
    }

    this.userVariations.set(test.name, variation);

    this.trackABTestEvent({
      testName: test.name,
      variation,
      eventType: 'assignment',
      properties: {
        assignmentMethod: this.config.stickyBehavior ? 'sticky' : 'random',
        testConfig: {
          enabled: test.enabled,
          trafficAllocation: test.trafficAllocation,
          startDate: test.startDate,
          endDate: test.endDate
        }
      }
    });
  }

  private getStickyVariation(test: ABTest, userId: string): string {
    const seed = this.hashString(`${test.name}_${userId}`);
    const random = this.seededRandom(seed);
    
    if (random > test.trafficAllocation) {
      return test.controlVariation;
    }

    let cumulativeWeight = 0;
    for (const variation of test.variations) {
      cumulativeWeight += variation.weight;
      if (random * test.trafficAllocation <= cumulativeWeight) {
        return variation.name;
      }
    }

    return test.controlVariation;
  }

  private getRandomVariation(test: ABTest): string {
    const random = Math.random();
    
    if (random > test.trafficAllocation) {
      return test.controlVariation;
    }

    const totalWeight = test.variations.reduce((sum, v) => sum + v.weight, 0);
    const normalizedRandom = random * totalWeight;
    
    let cumulativeWeight = 0;
    for (const variation of test.variations) {
      cumulativeWeight += variation.weight;
      if (normalizedRandom <= cumulativeWeight) {
        return variation.name;
      }
    }

    return test.controlVariation;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  public getVariation(testName: string): string | null {
    const test = this.activeTests.get(testName);
    if (!test || !test.enabled) {
      return null;
    }

    if (!this.isTestActive(test)) {
      return null;
    }

    return this.userVariations.get(testName) || null;
  }

  public isInVariation(testName: string, variationName: string): boolean {
    const userVariation = this.getVariation(testName);
    return userVariation === variationName;
  }

  public trackConversion(testName: string, goalName: string, value?: number): void {
    const variation = this.getVariation(testName);
    if (!variation) {
      return;
    }

    this.trackABTestEvent({
      testName,
      variation,
      eventType: 'conversion',
      properties: {
        goalName,
        value: value || 1,
        timestamp: Date.now()
      }
    });

    this.recordTestResult(testName, {
      type: 'conversion',
      variation,
      goal: goalName,
      value: value || 1,
      timestamp: Date.now()
    });
  }

  public trackGoal(testName: string, goalName: string, properties?: Record<string, any>): void {
    const variation = this.getVariation(testName);
    if (!variation) {
      return;
    }

    this.trackABTestEvent({
      testName,
      variation,
      eventType: 'goal',
      properties: {
        goalName,
        ...properties,
        timestamp: Date.now()
      }
    });

    this.recordTestResult(testName, {
      type: 'goal',
      variation,
      goal: goalName,
      properties: properties || {},
      timestamp: Date.now()
    });
  }

  public trackInteraction(testName: string, interactionType: string, properties?: Record<string, any>): void {
    const variation = this.getVariation(testName);
    if (!variation) {
      return;
    }

    this.trackABTestEvent({
      testName,
      variation,
      eventType: 'interaction',
      properties: {
        interactionType,
        ...properties,
        timestamp: Date.now()
      }
    });
  }

  public addTest(test: ABTest): void {
    this.activeTests.set(test.name, test);
    if (test.enabled && this.isTestActive(test)) {
      this.assignUserToVariation(test);
    }
  }

  public removeTest(testName: string): void {
    this.activeTests.delete(testName);
    this.userVariations.delete(testName);
    this.testResults.delete(testName);
  }

  public updateTest(test: ABTest): void {
    const existingTest = this.activeTests.get(test.name);
    if (existingTest) {
      this.activeTests.set(test.name, test);
      
      if (test.enabled && this.isTestActive(test) && !this.userVariations.has(test.name)) {
        this.assignUserToVariation(test);
      }
    }
  }

  public getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values())
      .filter(test => test.enabled && this.isTestActive(test));
  }

  public getUserVariations(): Record<string, string> {
    const variations: Record<string, string> = {};
    this.userVariations.forEach((variation, testName) => {
      const test = this.activeTests.get(testName);
      if (test && test.enabled && this.isTestActive(test)) {
        variations[testName] = variation;
      }
    });
    return variations;
  }

  public getTestResults(testName: string): any[] {
    return this.testResults.get(testName) || [];
  }

  public getTestStatistics(testName: string): any {
    const results = this.getTestResults(testName);
    if (results.length === 0) {
      return null;
    }

    const variations = new Map<string, any[]>();
    results.forEach(result => {
      if (!variations.has(result.variation)) {
        variations.set(result.variation, []);
      }
      variations.get(result.variation)!.push(result);
    });

    const statistics: any = {};
    variations.forEach((varResults, variation) => {
      const conversions = varResults.filter(r => r.type === 'conversion');
      const goals = varResults.filter(r => r.type === 'goal');
      
      statistics[variation] = {
        totalEvents: varResults.length,
        conversions: conversions.length,
        conversionRate: conversions.length / varResults.length,
        goals: goals.length,
        averageValue: conversions.reduce((sum, c) => sum + (c.value || 0), 0) / Math.max(conversions.length, 1)
      };
    });

    return statistics;
  }

  private isTestActive(test: ABTest): boolean {
    const now = new Date();
    
    if (test.startDate && now < new Date(test.startDate)) {
      return false;
    }
    
    if (test.endDate && now > new Date(test.endDate)) {
      return false;
    }
    
    return true;
  }

  private trackABTestEvent(data: Partial<ABTestEntry>): void {
    const abTestEntry: ABTestEntry = {
      id: this.generateId(),
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date(),
      page_url: window.location.href,
      test_name: data.testName!,
      variation: data.variation!,
      event_type: data.eventType!,
      properties: data.properties || {}
    };

    this.onABTestCallback(abTestEntry);
  }

  private recordTestResult(testName: string, result: any): void {
    if (!this.testResults.has(testName)) {
      this.testResults.set(testName, []);
    }
    
    this.testResults.get(testName)!.push(result);
    
    const results = this.testResults.get(testName)!;
    if (results.length > 1000) {
      results.splice(0, results.length - 1000);
    }
  }

  private generateId(): string {
    return `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getFrameworkStatus(): {
    enabled: boolean;
    activeTestsCount: number;
    userVariationsCount: number;
    totalResults: number;
  } {
    return {
      enabled: this.config.enabled,
      activeTestsCount: this.getActiveTests().length,
      userVariationsCount: this.userVariations.size,
      totalResults: Array.from(this.testResults.values()).reduce((sum, results) => sum + results.length, 0)
    };
  }

  public exportTestData(): any {
    const exportData: any = {
      config: this.config,
      activeTests: Array.from(this.activeTests.entries()),
      userVariations: Array.from(this.userVariations.entries()),
      testResults: Array.from(this.testResults.entries()),
      statistics: {}
    };

    this.activeTests.forEach((test, testName) => {
      exportData.statistics[testName] = this.getTestStatistics(testName);
    });

    return exportData;
  }

  public destroy(): void {
    this.activeTests.clear();
    this.userVariations.clear();
    this.testResults.clear();
    console.log('ABTestingFramework destroyed');
  }
}