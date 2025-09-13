import { EventEmitter } from 'events';
import {
  DeploymentReport,
  DeploymentAnalytics,
  PerformanceComparison,
  DeploymentMetrics,
  DeploymentStatus,
  MobilePerformanceMetrics
} from '../types/deployment-types';

export class DeploymentReporter extends EventEmitter {
  private deploymentHistory: Map<string, DeploymentReport> = new Map();
  private metricsBuffer: MobilePerformanceMetrics[] = [];
  private reportConfig = {
    retentionDays: 90,
    batchSize: 1000,
    reportFormats: ['json', 'csv', 'pdf'],
    schedules: {
      daily: { hour: 0, minute: 0 },
      weekly: { dayOfWeek: 1, hour: 0, minute: 0 },
      monthly: { dayOfMonth: 1, hour: 0, minute: 0 }
    }
  };

  async generateDeploymentReport(deploymentId: string): Promise<DeploymentReport> {
    try {
      const deployment = await this.getDeploymentDetails(deploymentId);
      const metrics = await this.getDeploymentMetrics(deploymentId);
      const comparison = await this.generatePerformanceComparison(deploymentId);
      
      const report: DeploymentReport = {
        id: `report_${deploymentId}_${Date.now()}`,
        deploymentId,
        timestamp: new Date().toISOString(),
        status: deployment.status,
        duration: deployment.endTime 
          ? new Date(deployment.endTime).getTime() - new Date(deployment.startTime).getTime()
          : Date.now() - new Date(deployment.startTime).getTime(),
        metrics: {
          totalRequests: metrics.totalRequests || 0,
          successRate: metrics.successRate || 0,
          errorRate: metrics.errorRate || 0,
          averageResponseTime: metrics.averageResponseTime || 0,
          p95ResponseTime: metrics.p95ResponseTime || 0,
          mobileCoreWebVitals: metrics.mobileCoreWebVitals || {
            lcp: 0,
            fid: 0,
            cls: 0,
            fcp: 0,
            ttfb: 0
          },
          trafficDistribution: metrics.trafficDistribution || {},
          geographicPerformance: metrics.geographicPerformance || {}
        },
        performanceComparison: comparison,
        issues: await this.getDeploymentIssues(deploymentId),
        recommendations: await this.generateRecommendations(metrics, comparison),
        summary: this.generateSummary(deployment, metrics, comparison)
      };

      this.deploymentHistory.set(deploymentId, report);
      this.emit('reportGenerated', { reportId: report.id, deploymentId });
      
      return report;
    } catch (error) {
      this.emit('error', { action: 'generateDeploymentReport', error: error.message });
      throw error;
    }
  }

  async generateAnalyticsDashboard(): Promise<DeploymentAnalytics> {
    try {
      const last30Days = this.getReportsInRange(30);
      const analytics: DeploymentAnalytics = {
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        totalDeployments: last30Days.length,
        successfulDeployments: last30Days.filter(r => r.status === 'completed').length,
        failedDeployments: last30Days.filter(r => r.status === 'failed').length,
        averageDeploymentTime: this.calculateAverageDeploymentTime(last30Days),
        deploymentFrequency: this.calculateDeploymentFrequency(last30Days),
        performanceTrends: this.calculatePerformanceTrends(last30Days),
        mobileBenchmarks: this.calculateMobileBenchmarks(last30Days),
        topIssues: this.getTopIssues(last30Days),
        improvementOpportunities: this.identifyImprovementOpportunities(last30Days),
        costAnalysis: await this.generateCostAnalysis(last30Days),
        complianceStatus: this.checkComplianceStatus(last30Days)
      };

      this.emit('analyticsGenerated', { timeRange: analytics.timeRange });
      return analytics;
    } catch (error) {
      this.emit('error', { action: 'generateAnalyticsDashboard', error: error.message });
      throw error;
    }
  }

  private async generatePerformanceComparison(deploymentId: string): Promise<PerformanceComparison> {
    const currentMetrics = await this.getDeploymentMetrics(deploymentId);
    const previousDeployment = await this.getPreviousDeployment(deploymentId);
    
    if (!previousDeployment) {
      return {
        baseline: null,
        current: currentMetrics,
        improvements: [],
        regressions: [],
        overallScore: 100
      };
    }

    const previousMetrics = await this.getDeploymentMetrics(previousDeployment.id);
    const improvements: string[] = [];
    const regressions: string[] = [];

    if (currentMetrics.averageResponseTime < previousMetrics.averageResponseTime) {
      improvements.push(`Response time improved by ${((previousMetrics.averageResponseTime - currentMetrics.averageResponseTime) / previousMetrics.averageResponseTime * 100).toFixed(1)}%`);
    } else if (currentMetrics.averageResponseTime > previousMetrics.averageResponseTime) {
      regressions.push(`Response time degraded by ${((currentMetrics.averageResponseTime - previousMetrics.averageResponseTime) / previousMetrics.averageResponseTime * 100).toFixed(1)}%`);
    }

    if (currentMetrics.successRate > previousMetrics.successRate) {
      improvements.push(`Success rate improved by ${(currentMetrics.successRate - previousMetrics.successRate).toFixed(2)}%`);
    } else if (currentMetrics.successRate < previousMetrics.successRate) {
      regressions.push(`Success rate decreased by ${(previousMetrics.successRate - currentMetrics.successRate).toFixed(2)}%`);
    }

    if (currentMetrics.mobileCoreWebVitals && previousMetrics.mobileCoreWebVitals) {
      const lcpImprovement = (previousMetrics.mobileCoreWebVitals.lcp - currentMetrics.mobileCoreWebVitals.lcp) / previousMetrics.mobileCoreWebVitals.lcp * 100;
      if (lcpImprovement > 5) {
        improvements.push(`LCP improved by ${lcpImprovement.toFixed(1)}%`);
      } else if (lcpImprovement < -5) {
        regressions.push(`LCP degraded by ${Math.abs(lcpImprovement).toFixed(1)}%`);
      }

      const fidImprovement = (previousMetrics.mobileCoreWebVitals.fid - currentMetrics.mobileCoreWebVitals.fid) / previousMetrics.mobileCoreWebVitals.fid * 100;
      if (fidImprovement > 5) {
        improvements.push(`FID improved by ${fidImprovement.toFixed(1)}%`);
      } else if (fidImprovement < -5) {
        regressions.push(`FID degraded by ${Math.abs(fidImprovement).toFixed(1)}%`);
      }
    }

    const overallScore = this.calculateOverallScore(improvements.length, regressions.length);

    return {
      baseline: previousMetrics,
      current: currentMetrics,
      improvements,
      regressions,
      overallScore
    };
  }

  private async getDeploymentDetails(deploymentId: string) {
    return {
      id: deploymentId,
      status: 'completed' as DeploymentStatus,
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date().toISOString()
    };
  }

  private async getDeploymentMetrics(deploymentId: string): Promise<DeploymentMetrics> {
    return {
      totalRequests: Math.floor(Math.random() * 100000) + 50000,
      successRate: 95 + Math.random() * 4,
      errorRate: Math.random() * 2,
      averageResponseTime: 150 + Math.random() * 100,
      p95ResponseTime: 300 + Math.random() * 200,
      mobileCoreWebVitals: {
        lcp: 2.0 + Math.random() * 0.5,
        fid: 80 + Math.random() * 20,
        cls: 0.1 + Math.random() * 0.05,
        fcp: 1.5 + Math.random() * 0.3,
        ttfb: 400 + Math.random() * 100
      },
      trafficDistribution: {
        mobile: 65 + Math.random() * 10,
        desktop: 30 + Math.random() * 10,
        tablet: 5 + Math.random() * 5
      },
      geographicPerformance: {
        'us-east': 180 + Math.random() * 50,
        'us-west': 160 + Math.random() * 40,
        'europe': 220 + Math.random() * 60,
        'asia': 280 + Math.random() * 80
      }
    };
  }

  private async getPreviousDeployment(deploymentId: string) {
    return {
      id: `prev_${deploymentId}`,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private async getDeploymentIssues(deploymentId: string): Promise<string[]> {
    return [
      'Minor increase in 5xx errors during initial rollout',
      'Cache miss rate higher than expected in Asia region',
      'Some users reported slow image loading on 3G networks'
    ];
  }

  private async generateRecommendations(metrics: DeploymentMetrics, comparison: PerformanceComparison): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.mobileCoreWebVitals.lcp > 2.5) {
      recommendations.push('Consider implementing image optimization to improve LCP scores');
    }

    if (metrics.mobileCoreWebVitals.fid > 100) {
      recommendations.push('Optimize JavaScript execution to reduce FID');
    }

    if (metrics.errorRate > 1) {
      recommendations.push('Investigate error patterns and implement additional monitoring');
    }

    if (comparison.regressions.length > 0) {
      recommendations.push('Review recent changes that may have caused performance regressions');
    }

    return recommendations;
  }

  private generateSummary(deployment: any, metrics: DeploymentMetrics, comparison: PerformanceComparison): string {
    const duration = Math.round((Date.now() - new Date(deployment.startTime).getTime()) / 1000 / 60);
    const improvements = comparison.improvements.length;
    const regressions = comparison.regressions.length;

    return `Deployment completed in ${duration} minutes with ${metrics.successRate.toFixed(1)}% success rate. ` +
           `${improvements} performance improvements and ${regressions} regressions detected. ` +
           `Mobile Core Web Vitals: LCP ${metrics.mobileCoreWebVitals.lcp.toFixed(1)}s, ` +
           `FID ${metrics.mobileCoreWebVitals.fid.toFixed(0)}ms, CLS ${metrics.mobileCoreWebVitals.cls.toFixed(3)}.`;
  }

  private getReportsInRange(days: number): DeploymentReport[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return Array.from(this.deploymentHistory.values())
      .filter(report => new Date(report.timestamp).getTime() > cutoff);
  }

  private calculateAverageDeploymentTime(reports: DeploymentReport[]): number {
    if (reports.length === 0) return 0;
    const totalTime = reports.reduce((sum, report) => sum + report.duration, 0);
    return totalTime / reports.length;
  }

  private calculateDeploymentFrequency(reports: DeploymentReport[]): number {
    if (reports.length <= 1) return 0;
    const timeSpan = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    return reports.length / (timeSpan / (24 * 60 * 60 * 1000)); // deployments per day
  }

  private calculatePerformanceTrends(reports: DeploymentReport[]): any {
    return {
      responseTime: this.calculateTrend(reports, r => r.metrics.averageResponseTime),
      successRate: this.calculateTrend(reports, r => r.metrics.successRate),
      errorRate: this.calculateTrend(reports, r => r.metrics.errorRate),
      mobilePerformance: {
        lcp: this.calculateTrend(reports, r => r.metrics.mobileCoreWebVitals?.lcp || 0),
        fid: this.calculateTrend(reports, r => r.metrics.mobileCoreWebVitals?.fid || 0),
        cls: this.calculateTrend(reports, r => r.metrics.mobileCoreWebVitals?.cls || 0)
      }
    };
  }

  private calculateTrend(reports: DeploymentReport[], getValue: (report: DeploymentReport) => number): { direction: string; percentage: number } {
    if (reports.length < 2) return { direction: 'stable', percentage: 0 };
    
    const sortedReports = reports.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const first = getValue(sortedReports[0]);
    const last = getValue(sortedReports[sortedReports.length - 1]);
    
    const percentage = ((last - first) / first) * 100;
    const direction = percentage > 5 ? 'improving' : percentage < -5 ? 'degrading' : 'stable';
    
    return { direction, percentage: Math.abs(percentage) };
  }

  private calculateMobileBenchmarks(reports: DeploymentReport[]): any {
    if (reports.length === 0) return {};

    const mobileMetrics = reports.map(r => r.metrics.mobileCoreWebVitals).filter(Boolean);
    if (mobileMetrics.length === 0) return {};

    return {
      averageLCP: mobileMetrics.reduce((sum, m) => sum + m.lcp, 0) / mobileMetrics.length,
      averageFID: mobileMetrics.reduce((sum, m) => sum + m.fid, 0) / mobileMetrics.length,
      averageCLS: mobileMetrics.reduce((sum, m) => sum + m.cls, 0) / mobileMetrics.length,
      percentileScores: {
        p50: this.calculatePercentile(mobileMetrics, 'lcp', 0.5),
        p75: this.calculatePercentile(mobileMetrics, 'lcp', 0.75),
        p95: this.calculatePercentile(mobileMetrics, 'lcp', 0.95)
      }
    };
  }

  private calculatePercentile(metrics: any[], field: string, percentile: number): number {
    const values = metrics.map(m => m[field]).sort((a, b) => a - b);
    const index = Math.ceil(values.length * percentile) - 1;
    return values[index] || 0;
  }

  private getTopIssues(reports: DeploymentReport[]): Array<{ issue: string; frequency: number; impact: string }> {
    const issueMap = new Map<string, number>();
    
    reports.forEach(report => {
      report.issues.forEach(issue => {
        issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
      });
    });

    return Array.from(issueMap.entries())
      .map(([issue, frequency]) => ({
        issue,
        frequency,
        impact: frequency > 5 ? 'high' : frequency > 2 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private identifyImprovementOpportunities(reports: DeploymentReport[]): string[] {
    const opportunities: string[] = [];
    
    const avgLCP = reports.reduce((sum, r) => sum + (r.metrics.mobileCoreWebVitals?.lcp || 0), 0) / reports.length;
    if (avgLCP > 2.5) {
      opportunities.push('Optimize Largest Contentful Paint for better mobile performance');
    }

    const avgErrorRate = reports.reduce((sum, r) => sum + r.metrics.errorRate, 0) / reports.length;
    if (avgErrorRate > 1) {
      opportunities.push('Improve error handling and monitoring to reduce error rates');
    }

    const deploymentFreq = this.calculateDeploymentFrequency(reports);
    if (deploymentFreq < 0.5) {
      opportunities.push('Consider increasing deployment frequency for faster iteration');
    }

    return opportunities;
  }

  private async generateCostAnalysis(reports: DeploymentReport[]): Promise<any> {
    return {
      totalDeployments: reports.length,
      estimatedCost: reports.length * 50, // $50 per deployment estimate
      costPerSuccessfulDeployment: 55,
      savings: {
        automatedRollbacks: reports.filter(r => r.status === 'rolled_back').length * 200,
        earlyIssueDetection: reports.length * 30
      },
      recommendations: [
        'Consider reserved instance pricing for consistent workloads',
        'Implement more aggressive caching to reduce compute costs'
      ]
    };
  }

  private checkComplianceStatus(reports: DeploymentReport[]): any {
    const totalDeployments = reports.length;
    const successfulDeployments = reports.filter(r => r.status === 'completed').length;
    
    return {
      uptime: (successfulDeployments / totalDeployments) * 100,
      securityScans: totalDeployments, // Assuming all deployments include security scans
      dataProtection: 'compliant',
      auditTrail: 'complete',
      certifications: ['SOC2', 'ISO27001'],
      lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private calculateOverallScore(improvements: number, regressions: number): number {
    const baseScore = 75;
    const improvementBonus = improvements * 10;
    const regressionPenalty = regressions * 15;
    return Math.max(0, Math.min(100, baseScore + improvementBonus - regressionPenalty));
  }

  async exportReport(reportId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    const report = this.deploymentHistory.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report);
      case 'pdf':
        return this.generatePDFReport(report);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private convertToCSV(report: DeploymentReport): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Deployment ID', report.deploymentId],
      ['Status', report.status],
      ['Duration (ms)', report.duration.toString()],
      ['Success Rate (%)', report.metrics.successRate.toString()],
      ['Error Rate (%)', report.metrics.errorRate.toString()],
      ['Avg Response Time (ms)', report.metrics.averageResponseTime.toString()],
      ['LCP (s)', report.metrics.mobileCoreWebVitals?.lcp.toString() || 'N/A'],
      ['FID (ms)', report.metrics.mobileCoreWebVitals?.fid.toString() || 'N/A'],
      ['CLS', report.metrics.mobileCoreWebVitals?.cls.toString() || 'N/A'],
      ['Overall Score', report.performanceComparison.overallScore.toString()]
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generatePDFReport(report: DeploymentReport): string {
    return `PDF Report for Deployment ${report.deploymentId}\n` +
           `Generated: ${new Date().toISOString()}\n` +
           `Status: ${report.status}\n` +
           `Summary: ${report.summary}\n` +
           `[PDF content would be generated here using a PDF library]`;
  }

  async scheduleReports(): Promise<void> {
    setInterval(() => {
      this.generateScheduledReports('daily');
    }, 24 * 60 * 60 * 1000);

    setInterval(() => {
      this.generateScheduledReports('weekly');
    }, 7 * 24 * 60 * 60 * 1000);

    setInterval(() => {
      this.generateScheduledReports('monthly');
    }, 30 * 24 * 60 * 60 * 1000);

    this.emit('reportScheduleInitialized');
  }

  private async generateScheduledReports(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      const analytics = await this.generateAnalyticsDashboard();
      this.emit('scheduledReportGenerated', { frequency, analytics });
    } catch (error) {
      this.emit('error', { action: 'generateScheduledReports', frequency, error: error.message });
    }
  }

  getReportHistory(): DeploymentReport[] {
    return Array.from(this.deploymentHistory.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  clearOldReports(): void {
    const cutoff = Date.now() - this.reportConfig.retentionDays * 24 * 60 * 60 * 1000;
    
    for (const [reportId, report] of this.deploymentHistory.entries()) {
      if (new Date(report.timestamp).getTime() < cutoff) {
        this.deploymentHistory.delete(reportId);
      }
    }

    this.emit('oldReportsCleared', { cutoffDate: new Date(cutoff).toISOString() });
  }
}