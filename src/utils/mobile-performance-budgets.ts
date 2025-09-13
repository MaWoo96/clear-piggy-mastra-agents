import { 
  PerformanceBudgetConfig, 
  PerformanceBudgetViolation,
  WebVitalEntry,
  PerformanceEntry 
} from '../types/analytics-types';

export class MobilePerformanceBudgets {
  private config: PerformanceBudgetConfig;
  private violations: PerformanceBudgetViolation[] = [];
  private onViolationCallback: (violation: PerformanceBudgetViolation) => void;

  constructor(
    config: PerformanceBudgetConfig,
    onViolation: (violation: PerformanceBudgetViolation) => void
  ) {
    this.config = config;
    this.onViolationCallback = onViolation;
  }

  public checkWebVitalBudget(vital: WebVitalEntry): void {
    if (!this.config.enabled || !this.config.webVitalBudgets) return;

    const budget = this.config.webVitalBudgets[vital.metric_name];
    if (!budget) return;

    if (vital.value > budget) {
      const violation: PerformanceBudgetViolation = {
        id: this.generateId(),
        timestamp: new Date(),
        budgetType: 'web_vital',
        metricName: vital.metric_name,
        budgetValue: budget,
        actualValue: vital.value,
        exceedanceRatio: vital.value / budget,
        severity: this.calculateSeverity(vital.value / budget),
        sessionId: vital.session_id,
        userId: vital.user_id,
        pageUrl: vital.page_url,
        properties: {
          vital,
          rating: vital.rating,
          deviceInfo: vital.device_info
        }
      };

      this.violations.push(violation);
      this.onViolationCallback(violation);
    }
  }

  public checkResourceBudget(resourceName: string, size: number, loadTime: number): void {
    if (!this.config.enabled || !this.config.resourceBudgets) return;

    const resourceType = this.getResourceType(resourceName);
    const sizeBudget = this.config.resourceBudgets[`${resourceType}_size`];
    const timeBudget = this.config.resourceBudgets[`${resourceType}_time`];

    if (sizeBudget && size > sizeBudget) {
      this.createResourceViolation({
        metricName: `${resourceType}_size`,
        budgetValue: sizeBudget,
        actualValue: size,
        resourceName,
        resourceType,
        violationType: 'size'
      });
    }

    if (timeBudget && loadTime > timeBudget) {
      this.createResourceViolation({
        metricName: `${resourceType}_time`,
        budgetValue: timeBudget,
        actualValue: loadTime,
        resourceName,
        resourceType,
        violationType: 'time'
      });
    }
  }

  public checkCustomBudget(metricName: string, value: number, properties?: Record<string, any>): void {
    if (!this.config.enabled || !this.config.customBudgets) return;

    const budget = this.config.customBudgets[metricName];
    if (!budget) return;

    if (value > budget) {
      const violation: PerformanceBudgetViolation = {
        id: this.generateId(),
        timestamp: new Date(),
        budgetType: 'custom',
        metricName,
        budgetValue: budget,
        actualValue: value,
        exceedanceRatio: value / budget,
        severity: this.calculateSeverity(value / budget),
        properties: properties || {}
      };

      this.violations.push(violation);
      this.onViolationCallback(violation);
    }
  }

  public checkBundleSizeBudget(bundleName: string, size: number): void {
    if (!this.config.enabled || !this.config.bundleSizeBudgets) return;

    const budget = this.config.bundleSizeBudgets[bundleName] || this.config.bundleSizeBudgets.default;
    if (!budget) return;

    if (size > budget) {
      const violation: PerformanceBudgetViolation = {
        id: this.generateId(),
        timestamp: new Date(),
        budgetType: 'bundle_size',
        metricName: 'bundle_size',
        budgetValue: budget,
        actualValue: size,
        exceedanceRatio: size / budget,
        severity: this.calculateSeverity(size / budget),
        properties: {
          bundleName,
          size,
          sizeKB: Math.round(size / 1024),
          sizeMB: Math.round(size / (1024 * 1024) * 100) / 100
        }
      };

      this.violations.push(violation);
      this.onViolationCallback(violation);
    }
  }

  public checkPageWeightBudget(pageUrl: string, totalWeight: number): void {
    if (!this.config.enabled || !this.config.pageWeightBudgets) return;

    const budget = this.config.pageWeightBudgets.default;
    if (!budget) return;

    if (totalWeight > budget) {
      const violation: PerformanceBudgetViolation = {
        id: this.generateId(),
        timestamp: new Date(),
        budgetType: 'page_weight',
        metricName: 'page_weight',
        budgetValue: budget,
        actualValue: totalWeight,
        exceedanceRatio: totalWeight / budget,
        severity: this.calculateSeverity(totalWeight / budget),
        pageUrl,
        properties: {
          totalWeight,
          weightKB: Math.round(totalWeight / 1024),
          weightMB: Math.round(totalWeight / (1024 * 1024) * 100) / 100
        }
      };

      this.violations.push(violation);
      this.onViolationCallback(violation);
    }
  }

  private createResourceViolation(data: {
    metricName: string;
    budgetValue: number;
    actualValue: number;
    resourceName: string;
    resourceType: string;
    violationType: 'size' | 'time';
  }): void {
    const violation: PerformanceBudgetViolation = {
      id: this.generateId(),
      timestamp: new Date(),
      budgetType: 'resource',
      metricName: data.metricName,
      budgetValue: data.budgetValue,
      actualValue: data.actualValue,
      exceedanceRatio: data.actualValue / data.budgetValue,
      severity: this.calculateSeverity(data.actualValue / data.budgetValue),
      properties: {
        resourceName: data.resourceName,
        resourceType: data.resourceType,
        violationType: data.violationType
      }
    };

    this.violations.push(violation);
    this.onViolationCallback(violation);
  }

  private getResourceType(resourceName: string): string {
    const extension = resourceName.split('.').pop()?.toLowerCase();
    
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

  private calculateSeverity(exceedanceRatio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (exceedanceRatio >= 3) return 'critical';
    if (exceedanceRatio >= 2) return 'high';
    if (exceedanceRatio >= 1.5) return 'medium';
    return 'low';
  }

  public getBudgetUtilization(): Record<string, any> {
    const utilization: Record<string, any> = {};

    if (this.config.webVitalBudgets) {
      utilization.webVitals = {};
      Object.entries(this.config.webVitalBudgets).forEach(([metric, budget]) => {
        const violations = this.violations.filter(v => 
          v.budgetType === 'web_vital' && v.metricName === metric
        );
        
        utilization.webVitals[metric] = {
          budget,
          violations: violations.length,
          averageExceedance: violations.length > 0 ? 
            violations.reduce((sum, v) => sum + v.exceedanceRatio, 0) / violations.length : 0
        };
      });
    }

    if (this.config.resourceBudgets) {
      utilization.resources = {};
      Object.entries(this.config.resourceBudgets).forEach(([resource, budget]) => {
        const violations = this.violations.filter(v => 
          v.budgetType === 'resource' && v.metricName === resource
        );
        
        utilization.resources[resource] = {
          budget,
          violations: violations.length,
          averageExceedance: violations.length > 0 ? 
            violations.reduce((sum, v) => sum + v.exceedanceRatio, 0) / violations.length : 0
        };
      });
    }

    return utilization;
  }

  public getViolationSummary(): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    recent: PerformanceBudgetViolation[];
  } {
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byType: Record<string, number> = {};

    this.violations.forEach(violation => {
      bySeverity[violation.severity]++;
      byType[violation.budgetType] = (byType[violation.budgetType] || 0) + 1;
    });

    const recent = this.violations
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      total: this.violations.length,
      bySeverity,
      byType,
      recent
    };
  }

  public getWorstOffenders(limit: number = 10): Array<{
    metricName: string;
    budgetType: string;
    violations: number;
    averageExceedance: number;
    worstViolation: PerformanceBudgetViolation;
  }> {
    const offenders = new Map<string, {
      violations: PerformanceBudgetViolation[];
      metricName: string;
      budgetType: string;
    }>();

    this.violations.forEach(violation => {
      const key = `${violation.budgetType}_${violation.metricName}`;
      if (!offenders.has(key)) {
        offenders.set(key, {
          violations: [],
          metricName: violation.metricName,
          budgetType: violation.budgetType
        });
      }
      offenders.get(key)!.violations.push(violation);
    });

    return Array.from(offenders.entries())
      .map(([key, data]) => {
        const worstViolation = data.violations.reduce((worst, current) => 
          current.exceedanceRatio > worst.exceedanceRatio ? current : worst
        );
        
        return {
          metricName: data.metricName,
          budgetType: data.budgetType,
          violations: data.violations.length,
          averageExceedance: data.violations.reduce((sum, v) => sum + v.exceedanceRatio, 0) / data.violations.length,
          worstViolation
        };
      })
      .sort((a, b) => b.violations - a.violations)
      .slice(0, limit);
  }

  public generateBudgetReport(): {
    summary: any;
    utilization: any;
    worstOffenders: any[];
    recommendations: string[];
  } {
    const summary = this.getViolationSummary();
    const utilization = this.getBudgetUtilization();
    const worstOffenders = this.getWorstOffenders();
    
    const recommendations = this.generateRecommendations(summary, worstOffenders);

    return {
      summary,
      utilization,
      worstOffenders,
      recommendations
    };
  }

  private generateRecommendations(summary: any, worstOffenders: any[]): string[] {
    const recommendations: string[] = [];

    if (summary.bySeverity.critical > 0) {
      recommendations.push(`Address ${summary.bySeverity.critical} critical budget violations immediately`);
    }

    if (summary.bySeverity.high > 5) {
      recommendations.push(`Review and optimize resources causing ${summary.bySeverity.high} high-severity violations`);
    }

    worstOffenders.slice(0, 3).forEach(offender => {
      if (offender.budgetType === 'web_vital') {
        recommendations.push(`Optimize ${offender.metricName} performance (${offender.violations} violations)`);
      } else if (offender.budgetType === 'resource') {
        recommendations.push(`Reduce ${offender.metricName} resource size or improve loading (${offender.violations} violations)`);
      }
    });

    if (summary.byType.bundle_size > 0) {
      recommendations.push('Consider code splitting to reduce bundle sizes');
    }

    if (summary.byType.page_weight > 0) {
      recommendations.push('Optimize page weight by compressing images and minimizing resources');
    }

    return recommendations;
  }

  public clearViolations(): void {
    this.violations = [];
  }

  public getViolations(): PerformanceBudgetViolation[] {
    return [...this.violations];
  }

  private generateId(): string {
    return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public updateConfig(newConfig: Partial<PerformanceBudgetConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public destroy(): void {
    this.violations = [];
    console.log('MobilePerformanceBudgets destroyed');
  }
}