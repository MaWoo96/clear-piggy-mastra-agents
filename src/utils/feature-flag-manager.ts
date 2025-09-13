import { 
  FeatureFlagConfig, 
  FeatureFlag, 
  RolloutStrategy, 
  RolloutStage, 
  AudienceSegment 
} from '../types/deployment-types';

export class FeatureFlagManager {
  private config: FeatureFlagConfig;
  private flags: Map<string, FeatureFlag> = new Map();
  private rolloutStates: Map<string, RolloutState> = new Map();
  private userSegments: Map<string, AudienceSegment> = new Map();
  private onEventCallback: (event: FeatureFlagEvent) => void;
  private rolloutTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: FeatureFlagConfig,
    onEvent: (event: FeatureFlagEvent) => void
  ) {
    this.config = config;
    this.onEventCallback = onEvent;
  }

  public async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('Feature flags disabled, skipping initialization');
      return;
    }

    console.log('Initializing Feature Flag Manager...');

    // Initialize existing flags
    for (const flag of this.config.flags) {
      this.flags.set(flag.key, { ...flag });
    }

    // Load user segments
    for (const segment of this.config.audienceSegmentation.segments) {
      this.userSegments.set(segment.id, segment);
    }

    console.log(`Feature Flag Manager initialized with ${this.flags.size} flags`);
  }

  public async createRolloutFlag(
    featureName: string,
    rolloutConfig: {
      initialPercentage: number;
      incrementInterval: number;
      maxDuration: number;
    }
  ): Promise<string> {
    const flagKey = `rollout_${featureName}`;
    
    const flag: FeatureFlag = {
      key: flagKey,
      name: `${featureName} Progressive Rollout`,
      description: `Progressive rollout flag for ${featureName} feature`,
      type: 'boolean',
      defaultValue: false,
      variations: [
        { key: 'off', name: 'Off', value: false, description: 'Feature disabled' },
        { key: 'on', name: 'On', value: true, description: 'Feature enabled' }
      ],
      targeting: {
        rules: [],
        fallthrough: {
          variation: 'off',
          rollout: {
            variations: [
              { variation: 'off', weight: 100 - rolloutConfig.initialPercentage },
              { variation: 'on', weight: rolloutConfig.initialPercentage }
            ]
          }
        },
        offVariation: 'off'
      },
      rolloutPercentage: rolloutConfig.initialPercentage,
      environment: [this.getEnvironment()],
      tags: ['rollout', 'progressive', featureName],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.flags.set(flagKey, flag);

    // Initialize rollout state
    const rolloutState: RolloutState = {
      flagKey,
      featureName,
      currentPercentage: rolloutConfig.initialPercentage,
      targetPercentage: 100,
      incrementInterval: rolloutConfig.incrementInterval,
      maxDuration: rolloutConfig.maxDuration,
      startTime: new Date(),
      status: 'active',
      stages: this.generateRolloutStages(rolloutConfig),
      currentStageIndex: 0,
      metrics: {
        totalUsers: 0,
        enabledUsers: 0,
        errorRate: 0,
        conversionRate: 0,
        userSatisfaction: 0
      }
    };

    this.rolloutStates.set(flagKey, rolloutState);

    // Start progressive rollout timer
    this.startRolloutTimer(flagKey);

    this.emitEvent({
      type: 'flag_created',
      flagKey,
      featureName,
      timestamp: new Date(),
      metadata: { rolloutConfig }
    });

    console.log(`Created rollout flag: ${flagKey} with ${rolloutConfig.initialPercentage}% initial rollout`);
    return flagKey;
  }

  private generateRolloutStages(config: any): RolloutStage[] {
    const stages: RolloutStage[] = [];
    const increments = [5, 10, 25, 50, 75, 100];
    
    for (let i = 0; i < increments.length; i++) {
      const percentage = increments[i];
      if (percentage <= config.initialPercentage && i === 0) continue;
      
      stages.push({
        name: `Stage ${i + 1}`,
        percentage,
        duration: config.incrementInterval,
        criteria: {
          errorRate: 2,
          responseTime: 1000,
          conversionRate: 0.95,
          userSatisfaction: 4.0
        },
        monitoring: {
          metrics: ['error_rate', 'response_time', 'conversion_rate', 'user_satisfaction'],
          thresholds: {
            error_rate: 2,
            response_time: 1000,
            conversion_rate: 0.95,
            user_satisfaction: 4.0
          },
          alerting: true
        }
      });
    }

    return stages;
  }

  private startRolloutTimer(flagKey: string): void {
    const rolloutState = this.rolloutStates.get(flagKey);
    if (!rolloutState) return;

    const intervalMs = rolloutState.incrementInterval * 60 * 1000;
    
    const timer = setInterval(async () => {
      await this.processRolloutStage(flagKey);
    }, intervalMs);

    this.rolloutTimers.set(flagKey, timer);
  }

  private async processRolloutStage(flagKey: string): Promise<void> {
    const rolloutState = this.rolloutStates.get(flagKey);
    if (!rolloutState || rolloutState.status !== 'active') return;

    const currentStage = rolloutState.stages[rolloutState.currentStageIndex];
    if (!currentStage) {
      // Rollout completed
      await this.completeRollout(flagKey);
      return;
    }

    console.log(`Processing rollout stage for ${flagKey}: ${currentStage.name}`);

    // Check stage criteria before progressing
    const canProgress = await this.evaluateStageProgress(flagKey, currentStage);

    if (canProgress) {
      // Update rollout percentage
      await this.updateRolloutPercentage(rolloutState.currentPercentage, currentStage.percentage, flagKey);
      rolloutState.currentPercentage = currentStage.percentage;
      rolloutState.currentStageIndex++;

      this.emitEvent({
        type: 'rollout_stage_completed',
        flagKey,
        featureName: rolloutState.featureName,
        timestamp: new Date(),
        metadata: {
          stageName: currentStage.name,
          percentage: currentStage.percentage,
          nextStageIndex: rolloutState.currentStageIndex
        }
      });

      console.log(`Rollout progressed to ${currentStage.percentage}% for ${flagKey}`);
    } else {
      console.log(`Stage criteria not met for ${flagKey}, pausing rollout`);
      await this.pauseRollout(flagKey);
      
      this.emitEvent({
        type: 'rollout_paused',
        flagKey,
        featureName: rolloutState.featureName,
        timestamp: new Date(),
        metadata: {
          stageName: currentStage.name,
          reason: 'stage_criteria_not_met'
        }
      });
    }
  }

  private async evaluateStageProgress(flagKey: string, stage: RolloutStage): Promise<boolean> {
    const metrics = await this.getRolloutMetrics(flagKey);
    
    // Check error rate
    if (metrics.errorRate > stage.criteria.errorRate) {
      console.log(`Stage criteria failed: Error rate ${metrics.errorRate}% > ${stage.criteria.errorRate}%`);
      return false;
    }

    // Check response time
    if (metrics.responseTime > stage.criteria.responseTime) {
      console.log(`Stage criteria failed: Response time ${metrics.responseTime}ms > ${stage.criteria.responseTime}ms`);
      return false;
    }

    // Check conversion rate
    if (metrics.conversionRate < stage.criteria.conversionRate) {
      console.log(`Stage criteria failed: Conversion rate ${metrics.conversionRate} < ${stage.criteria.conversionRate}`);
      return false;
    }

    // Check user satisfaction
    if (metrics.userSatisfaction < stage.criteria.userSatisfaction) {
      console.log(`Stage criteria failed: User satisfaction ${metrics.userSatisfaction} < ${stage.criteria.userSatisfaction}`);
      return false;
    }

    return true;
  }

  private async getRolloutMetrics(flagKey: string): Promise<RolloutMetrics> {
    // In real implementation, this would fetch actual metrics from monitoring systems
    const rolloutState = this.rolloutStates.get(flagKey);
    if (!rolloutState) {
      return {
        errorRate: 0,
        responseTime: 0,
        conversionRate: 1.0,
        userSatisfaction: 5.0,
        totalUsers: 0,
        enabledUsers: 0
      };
    }

    // Simulate metric collection - in practice, this would integrate with monitoring
    const simulatedMetrics: RolloutMetrics = {
      errorRate: Math.random() * 3, // 0-3% error rate
      responseTime: 300 + Math.random() * 700, // 300-1000ms response time
      conversionRate: 0.9 + Math.random() * 0.1, // 0.9-1.0 conversion rate
      userSatisfaction: 4.0 + Math.random() * 1.0, // 4.0-5.0 satisfaction
      totalUsers: rolloutState.metrics.totalUsers + Math.floor(Math.random() * 100),
      enabledUsers: Math.floor(rolloutState.metrics.totalUsers * rolloutState.currentPercentage / 100)
    };

    // Update stored metrics
    rolloutState.metrics = simulatedMetrics;
    return simulatedMetrics;
  }

  public async updateRolloutPercentage(
    currentPercentage?: number, 
    newPercentage?: number, 
    flagKey?: string
  ): Promise<void> {
    if (flagKey) {
      // Update specific flag
      const flag = this.flags.get(flagKey);
      if (flag && flag.targeting.fallthrough.rollout) {
        const targetPercentage = newPercentage || currentPercentage || flag.rolloutPercentage;
        flag.rolloutPercentage = targetPercentage;
        flag.targeting.fallthrough.rollout.variations = [
          { variation: 'off', weight: 100 - targetPercentage },
          { variation: 'on', weight: targetPercentage }
        ];
        flag.updatedAt = new Date();

        this.emitEvent({
          type: 'flag_updated',
          flagKey,
          featureName: flagKey.replace('rollout_', ''),
          timestamp: new Date(),
          metadata: { 
            oldPercentage: currentPercentage, 
            newPercentage: targetPercentage 
          }
        });
      }
    } else {
      // Update all active rollout flags
      const percentage = newPercentage || currentPercentage || 0;
      for (const [key, rolloutState] of this.rolloutStates) {
        if (rolloutState.status === 'active') {
          await this.updateRolloutPercentage(rolloutState.currentPercentage, percentage, key);
        }
      }
    }
  }

  public async pauseRollout(flagKey: string): Promise<void> {
    const rolloutState = this.rolloutStates.get(flagKey);
    if (!rolloutState) return;

    rolloutState.status = 'paused';
    
    const timer = this.rolloutTimers.get(flagKey);
    if (timer) {
      clearInterval(timer);
      this.rolloutTimers.delete(flagKey);
    }

    this.emitEvent({
      type: 'rollout_paused',
      flagKey,
      featureName: rolloutState.featureName,
      timestamp: new Date(),
      metadata: { currentPercentage: rolloutState.currentPercentage }
    });

    console.log(`Rollout paused for ${flagKey}`);
  }

  public async resumeRollout(flagKey: string): Promise<void> {
    const rolloutState = this.rolloutStates.get(flagKey);
    if (!rolloutState) return;

    rolloutState.status = 'active';
    this.startRolloutTimer(flagKey);

    this.emitEvent({
      type: 'rollout_resumed',
      flagKey,
      featureName: rolloutState.featureName,
      timestamp: new Date(),
      metadata: { currentPercentage: rolloutState.currentPercentage }
    });

    console.log(`Rollout resumed for ${flagKey}`);
  }

  public async revertRollout(deploymentId: string): Promise<void> {
    console.log(`Reverting rollout for deployment ${deploymentId}`);

    for (const [flagKey, rolloutState] of this.rolloutStates) {
      if (rolloutState.status === 'active') {
        // Set flag to 0% rollout
        await this.updateRolloutPercentage(rolloutState.currentPercentage, 0, flagKey);
        
        // Mark as reverted
        rolloutState.status = 'reverted';
        
        // Clear timer
        const timer = this.rolloutTimers.get(flagKey);
        if (timer) {
          clearInterval(timer);
          this.rolloutTimers.delete(flagKey);
        }

        this.emitEvent({
          type: 'rollout_reverted',
          flagKey,
          featureName: rolloutState.featureName,
          timestamp: new Date(),
          metadata: { deploymentId, reason: 'deployment_rollback' }
        });
      }
    }

    console.log(`Rollout reversion completed for deployment ${deploymentId}`);
  }

  private async completeRollout(flagKey: string): Promise<void> {
    const rolloutState = this.rolloutStates.get(flagKey);
    if (!rolloutState) return;

    rolloutState.status = 'completed';
    rolloutState.currentPercentage = 100;
    
    // Clear timer
    const timer = this.rolloutTimers.get(flagKey);
    if (timer) {
      clearInterval(timer);
      this.rolloutTimers.delete(flagKey);
    }

    // Update flag to 100%
    await this.updateRolloutPercentage(rolloutState.currentPercentage, 100, flagKey);

    this.emitEvent({
      type: 'rollout_completed',
      flagKey,
      featureName: rolloutState.featureName,
      timestamp: new Date(),
      metadata: { 
        duration: Date.now() - rolloutState.startTime.getTime(),
        totalStages: rolloutState.stages.length
      }
    });

    console.log(`Rollout completed for ${flagKey}`);
  }

  // Feature Flag Evaluation
  public evaluateFlag(flagKey: string, context: EvaluationContext): any {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      console.warn(`Flag not found: ${flagKey}`);
      return flag?.defaultValue || false;
    }

    // Check targeting rules
    for (const rule of flag.targeting.rules) {
      if (this.evaluateRule(rule, context)) {
        return this.getVariationValue(flag, rule.variation);
      }
    }

    // Check fallthrough rule
    if (flag.targeting.fallthrough.rollout) {
      const bucket = this.getBucketForUser(context.userId || '', flag.key);
      const rollout = flag.targeting.fallthrough.rollout;
      
      let cumulativeWeight = 0;
      for (const variation of rollout.variations) {
        cumulativeWeight += variation.weight;
        if (bucket < cumulativeWeight) {
          return this.getVariationValue(flag, variation.variation);
        }
      }
    }

    return this.getVariationValue(flag, flag.targeting.fallthrough.variation);
  }

  private evaluateRule(rule: any, context: EvaluationContext): boolean {
    for (const clause of rule.clauses) {
      if (!this.evaluateClause(clause, context)) {
        return false;
      }
    }
    return true;
  }

  private evaluateClause(clause: any, context: EvaluationContext): boolean {
    const contextValue = this.getContextValue(context, clause.attribute);
    if (contextValue === undefined) return false;

    let result = false;

    switch (clause.op) {
      case 'in':
        result = clause.values.includes(String(contextValue));
        break;
      case 'contains':
        result = String(contextValue).includes(clause.values[0]);
        break;
      case 'startsWith':
        result = String(contextValue).startsWith(clause.values[0]);
        break;
      case 'endsWith':
        result = String(contextValue).endsWith(clause.values[0]);
        break;
      case 'matches':
        result = new RegExp(clause.values[0]).test(String(contextValue));
        break;
      case 'greaterThan':
        result = Number(contextValue) > Number(clause.values[0]);
        break;
      case 'lessThan':
        result = Number(contextValue) < Number(clause.values[0]);
        break;
      default:
        result = false;
    }

    return clause.negate ? !result : result;
  }

  private getContextValue(context: EvaluationContext, attribute: string): any {
    switch (attribute) {
      case 'userId':
        return context.userId;
      case 'userType':
        return context.userType;
      case 'platform':
        return context.platform;
      case 'version':
        return context.version;
      case 'country':
        return context.country;
      case 'segment':
        return context.segment;
      default:
        return context.custom?.[attribute];
    }
  }

  private getVariationValue(flag: FeatureFlag, variationKey: string): any {
    const variation = flag.variations.find(v => v.key === variationKey);
    return variation ? variation.value : flag.defaultValue;
  }

  private getBucketForUser(userId: string, flagKey: string): number {
    // Consistent hash-based bucketing
    const hash = this.hashString(userId + flagKey);
    return Math.abs(hash) % 100000 / 1000; // 0-100 range
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Management Methods
  public async createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<void> {
    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.flags.set(flag.key, newFlag);

    this.emitEvent({
      type: 'flag_created',
      flagKey: flag.key,
      featureName: flag.name,
      timestamp: new Date(),
      metadata: { flag: newFlag }
    });

    console.log(`Feature flag created: ${flag.key}`);
  }

  public async updateFlag(flagKey: string, updates: Partial<FeatureFlag>): Promise<void> {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      throw new Error(`Flag not found: ${flagKey}`);
    }

    const updatedFlag = { ...flag, ...updates, updatedAt: new Date() };
    this.flags.set(flagKey, updatedFlag);

    this.emitEvent({
      type: 'flag_updated',
      flagKey,
      featureName: flag.name,
      timestamp: new Date(),
      metadata: { updates }
    });

    console.log(`Feature flag updated: ${flagKey}`);
  }

  public async deleteFlag(flagKey: string): Promise<void> {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      throw new Error(`Flag not found: ${flagKey}`);
    }

    this.flags.delete(flagKey);

    // Clean up rollout state if exists
    if (this.rolloutStates.has(flagKey)) {
      const timer = this.rolloutTimers.get(flagKey);
      if (timer) {
        clearInterval(timer);
        this.rolloutTimers.delete(flagKey);
      }
      this.rolloutStates.delete(flagKey);
    }

    this.emitEvent({
      type: 'flag_deleted',
      flagKey,
      featureName: flag.name,
      timestamp: new Date(),
      metadata: { flag }
    });

    console.log(`Feature flag deleted: ${flagKey}`);
  }

  public getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public getDeploymentFlags(deploymentId: string): FeatureFlag[] {
    return this.getAllFlags().filter(flag => 
      flag.tags.includes('rollout') && flag.key.includes(deploymentId)
    );
  }

  public getRolloutStatus(flagKey: string): RolloutState | undefined {
    return this.rolloutStates.get(flagKey);
  }

  public getAllRolloutStatus(): RolloutState[] {
    return Array.from(this.rolloutStates.values());
  }

  // Cleanup Methods
  public async cleanupDeployment(deploymentId: string): Promise<void> {
    const flagsToCleanup = this.getDeploymentFlags(deploymentId);
    
    for (const flag of flagsToCleanup) {
      await this.deleteFlag(flag.key);
    }

    console.log(`Cleaned up ${flagsToCleanup.length} flags for deployment ${deploymentId}`);
  }

  private getEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }

  private emitEvent(event: FeatureFlagEvent): void {
    this.onEventCallback(event);
  }

  public async destroy(): Promise<void> {
    // Clear all timers
    for (const [flagKey, timer] of this.rolloutTimers) {
      clearInterval(timer);
    }
    
    this.rolloutTimers.clear();
    this.rolloutStates.clear();
    this.flags.clear();
    this.userSegments.clear();

    console.log('Feature Flag Manager destroyed');
  }
}

// Supporting interfaces
interface RolloutState {
  flagKey: string;
  featureName: string;
  currentPercentage: number;
  targetPercentage: number;
  incrementInterval: number;
  maxDuration: number;
  startTime: Date;
  status: 'active' | 'paused' | 'completed' | 'reverted' | 'failed';
  stages: RolloutStage[];
  currentStageIndex: number;
  metrics: RolloutMetrics;
}

interface RolloutMetrics {
  errorRate: number;
  responseTime: number;
  conversionRate: number;
  userSatisfaction: number;
  totalUsers: number;
  enabledUsers: number;
}

interface FeatureFlagEvent {
  type: 'flag_created' | 'flag_updated' | 'flag_deleted' | 'rollout_stage_completed' | 'rollout_paused' | 'rollout_resumed' | 'rollout_completed' | 'rollout_reverted';
  flagKey: string;
  featureName: string;
  timestamp: Date;
  metadata: any;
}

export interface EvaluationContext {
  userId?: string;
  userType?: string;
  platform?: 'ios' | 'android' | 'web';
  version?: string;
  country?: string;
  segment?: string;
  custom?: Record<string, any>;
}

export default FeatureFlagManager;