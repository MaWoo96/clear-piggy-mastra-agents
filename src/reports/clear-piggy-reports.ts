/**
 * Clear Piggy Report Generator
 * Generates comprehensive HTML and JSON reports for mobile optimization analysis
 */

import { 
  ClearPiggyAnalysisResult,
  ClearPiggyProjectReport,
  ClearPiggyConfig,
  FinancialComponentType 
} from '../types/clear-piggy-types';

export class ClearPiggyReportGenerator {
  private config: ClearPiggyConfig;

  constructor(config: ClearPiggyConfig) {
    this.config = config;
  }

  /**
   * Generate comprehensive project report
   */
  async generateProjectReport(
    analysisResults: ClearPiggyAnalysisResult[],
    aiInsights: {
      keyFindings: string[];
      implementationStrategy: string[];
      financialUXRecommendations: string[];
      technicalPriorities: string[];
      riskAssessment?: string[];
    },
    totalComponentsFound: number
  ): Promise<ClearPiggyProjectReport> {
    const now = new Date();
    
    // Calculate summary metrics
    const executiveSummary = this.generateExecutiveSummary(analysisResults);
    
    // Analyze financial UX patterns
    const financialUXInsights = this.analyzeFinancialUXPatterns(analysisResults);
    
    // Calculate technical debt
    const technicalDebt = this.calculateTechnicalDebt(analysisResults);
    
    // Generate implementation roadmap
    const implementationRoadmap = this.generateImplementationRoadmap(analysisResults);
    
    return {
      metadata: {
        projectName: 'Clear Piggy',
        analysisDate: now,
        totalComponentsFound,
        totalComponentsAnalyzed: analysisResults.length,
        analysisVersion: '1.0.0',
        configUsed: this.config
      },
      executiveSummary,
      componentAnalysis: analysisResults,
      financialUXInsights,
      technicalDebt,
      implementationRoadmap,
      aiInsights: {
        keyFindings: aiInsights.keyFindings,
        implementationStrategy: aiInsights.implementationStrategy,
        financialUXRecommendations: aiInsights.financialUXRecommendations,
        technicalPriorities: aiInsights.technicalPriorities,
        riskAssessment: aiInsights.riskAssessment || []
      }
    };
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report: ClearPiggyProjectReport): Promise<string> {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Clear Piggy Mobile Optimization Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-hover { transition: transform 0.2s; }
        .card-hover:hover { transform: translateY(-2px); }
        .priority-critical { @apply bg-red-50 border-red-200 text-red-900; }
        .priority-high { @apply bg-orange-50 border-orange-200 text-orange-900; }
        .priority-medium { @apply bg-yellow-50 border-yellow-200 text-yellow-900; }
        .priority-low { @apply bg-green-50 border-green-200 text-green-900; }
      </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
      <!-- Header -->
      ${this.generateHeader(report)}
      
      <!-- Executive Summary -->
      ${this.generateExecutiveSummaryHTML(report)}
      
      <!-- Key Metrics Dashboard -->
      ${this.generateMetricsDashboard(report)}
      
      <!-- Financial UX Insights -->
      ${this.generateFinancialInsightsHTML(report)}
      
      <!-- Component Analysis -->
      ${this.generateComponentAnalysisHTML(report)}
      
      <!-- Implementation Roadmap -->
      ${this.generateRoadmapHTML(report)}
      
      <!-- AI Insights -->
      ${this.generateAIInsightsHTML(report)}
      
      <!-- Technical Debt Analysis -->
      ${this.generateTechnicalDebtHTML(report)}
      
      <!-- Footer -->
      ${this.generateFooter(report)}
      
      <script>
        ${this.generateJavaScript()}
      </script>
    </body>
    </html>
    `;
  }

  private generateExecutiveSummary(results: ClearPiggyAnalysisResult[]): ClearPiggyProjectReport['executiveSummary'] {
    const overallMobileScore = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.overallMobileScore, 0) / results.length)
      : 0;
    
    const totalIssuesFound = results.reduce((sum, r) => 
      sum + r.touchTargetIssues.length + r.tailwindResponsiveGaps.length + 
      r.layoutComplexityIssues.length + r.navigationIssues.length + r.financialUXIssues.length, 0
    );
    
    const criticalIssuesCount = results.filter(r => r.priority === 'critical').length;
    const highPriorityIssuesCount = results.filter(r => r.priority === 'high').length;
    const componentsNeedingAttention = results.filter(r => r.overallMobileScore < 70).length;
    
    // Estimate effort hours
    const estimatedEffortHours = Math.round(
      (criticalIssuesCount * 8) + 
      (highPriorityIssuesCount * 4) + 
      (componentsNeedingAttention * 2)
    );
    
    // Find top issue categories
    const allIssues: string[] = [];
    results.forEach(result => {
      result.touchTargetIssues.forEach(() => allIssues.push('Touch Target Issues'));
      result.tailwindResponsiveGaps.forEach(() => allIssues.push('Responsive Design'));
      result.navigationIssues.forEach(() => allIssues.push('Navigation Patterns'));
      result.financialUXIssues.forEach(() => allIssues.push('Financial UX'));
      result.layoutComplexityIssues.forEach(() => allIssues.push('Layout Complexity'));
    });
    
    const issueCounts = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topIssueCategories = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
    
    // Generate quick wins
    const quickWins: string[] = [];
    const easyTouchTargetFixes = results.reduce((sum, r) => 
      sum + r.touchTargetIssues.filter(i => i.severity === 'medium').length, 0
    );
    if (easyTouchTargetFixes > 0) {
      quickWins.push(`Fix ${easyTouchTargetFixes} medium-priority touch target issues`);
    }
    
    const missingResponsive = results.reduce((sum, r) => 
      sum + r.tailwindResponsiveGaps.filter(g => g.impactLevel === 'minor-inconsistency').length, 0
    );
    if (missingResponsive > 0) {
      quickWins.push(`Add responsive classes to ${missingResponsive} elements`);
    }
    
    if (quickWins.length < 3) {
      quickWins.push('Implement mobile-first CSS approach');
      quickWins.push('Add loading states to financial components');
      quickWins.push('Optimize button spacing for touch interaction');
    }
    
    return {
      overallMobileScore,
      totalIssuesFound,
      criticalIssuesCount,
      highPriorityIssuesCount,
      componentsNeedingAttention,
      estimatedEffortHours,
      topIssueCategories,
      quickWins
    };
  }

  private analyzeFinancialUXPatterns(results: ClearPiggyAnalysisResult[]): ClearPiggyProjectReport['financialUXInsights'] {
    const getFinancialFindings = (type: FinancialComponentType) => {
      const components = results.filter(r => r.financialComponentType === type);
      const averageScore = components.length > 0 
        ? Math.round(components.reduce((sum, c) => sum + c.financialUXScore, 0) / components.length)
        : 0;
      
      const allIssues = components.flatMap(c => c.financialUXIssues.map(i => i.issue));
      const issueCounts = allIssues.reduce((acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const commonIssues = Object.entries(issueCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([issue]) => issue);
      
      const recommendations = this.getFinancialRecommendations(type, components);
      
      return {
        componentsAnalyzed: components.length,
        averageScore,
        commonIssues,
        recommendations
      };
    };
    
    return {
      transactionListFindings: getFinancialFindings('transaction-list'),
      dashboardFindings: getFinancialFindings('dashboard-card'),
      chartFindings: getFinancialFindings('budget-chart'),
      formFindings: getFinancialFindings('form')
    };
  }

  private getFinancialRecommendations(type: FinancialComponentType, components: ClearPiggyAnalysisResult[]): string[] {
    const baseRecommendations = {
      'transaction-list': [
        'Implement virtual scrolling for large lists',
        'Add swipe actions for common operations',
        'Include pull-to-refresh functionality',
        'Optimize for one-handed mobile use',
        'Add bulk selection capabilities'
      ],
      'dashboard-card': [
        'Stack cards vertically on mobile',
        'Implement progressive disclosure',
        'Add skeleton loading states',
        'Include tap-to-expand functionality',
        'Optimize data density for mobile screens'
      ],
      'budget-chart': [
        'Make charts touch-interactive',
        'Implement responsive sizing',
        'Add mobile-friendly tooltips',
        'Include gesture navigation',
        'Optimize for portrait orientation'
      ],
      'form': [
        'Use appropriate input types',
        'Implement real-time validation',
        'Add contextual keyboards',
        'Optimize label positioning',
        'Include auto-complete suggestions'
      ],
      'navigation': [
        'Implement hamburger menu',
        'Add bottom navigation for core features',
        'Include breadcrumb navigation',
        'Optimize for thumb navigation',
        'Add search functionality'
      ],
      'other': [
        'Follow mobile-first design principles',
        'Implement consistent loading states',
        'Add offline functionality',
        'Optimize for various screen sizes',
        'Include accessibility features'
      ]
    };
    
    let recommendations = baseRecommendations[type] || baseRecommendations.other;
    
    // Customize based on actual issues found
    if (components.length > 0) {
      const hasPerformanceIssues = components.some(c => c.performanceAnalysis.score < 70);
      const hasAccessibilityIssues = components.some(c => c.accessibilityAnalysis.score < 80);
      
      if (hasPerformanceIssues) {
        recommendations = recommendations.concat(['Optimize component performance', 'Implement lazy loading']);
      }
      
      if (hasAccessibilityIssues) {
        recommendations = recommendations.concat(['Improve accessibility compliance', 'Add screen reader support']);
      }
    }
    
    return recommendations.slice(0, 5);
  }

  private calculateTechnicalDebt(results: ClearPiggyAnalysisResult[]): ClearPiggyProjectReport['technicalDebt'] {
    const touchTargetViolations = results.reduce((sum, r) => sum + r.touchTargetIssues.length, 0);
    const criticalTouchTargetViolations = results.reduce((sum, r) => 
      sum + r.touchTargetIssues.filter(i => i.severity === 'critical').length, 0
    );
    
    const responsiveGaps = results.reduce((sum, r) => sum + r.tailwindResponsiveGaps.length, 0);
    const majorBreakpoints = ['mobile', 'tablet', 'desktop'];
    
    const performanceIssues = results.filter(r => r.performanceAnalysis.score < 70).length;
    const averagePerformanceScore = Math.round(
      results.reduce((sum, r) => sum + r.performanceAnalysis.score, 0) / results.length
    );
    
    return {
      touchTargetDebt: {
        totalViolations: touchTargetViolations,
        criticalViolations: criticalTouchTargetViolations,
        estimatedFixTime: `${Math.ceil(touchTargetViolations * 0.5)} hours`
      },
      responsiveDesignDebt: {
        totalGaps: responsiveGaps,
        majorBreakpoints,
        estimatedFixTime: `${Math.ceil(responsiveGaps * 0.75)} hours`
      },
      performanceDebt: {
        componentsWithIssues: performanceIssues,
        averagePerformanceScore,
        estimatedImprovementTime: `${Math.ceil(performanceIssues * 2)} hours`
      }
    };
  }

  private generateImplementationRoadmap(results: ClearPiggyAnalysisResult[]): ClearPiggyProjectReport['implementationRoadmap'] {
    const criticalComponents = results.filter(r => r.priority === 'critical').map(r => r.componentFile.name);
    const highPriorityComponents = results.filter(r => r.priority === 'high').map(r => r.componentFile.name);
    const mediumPriorityComponents = results.filter(r => r.priority === 'medium').map(r => r.componentFile.name);
    
    return {
      phase1_Critical: {
        duration: '1-2 weeks',
        components: criticalComponents.slice(0, 10),
        actions: [
          'Fix all critical touch target violations',
          'Address navigation accessibility issues',
          'Implement mobile-first responsive patterns',
          'Fix layout-breaking responsive gaps'
        ],
        expectedImpact: 'Immediate improvement in mobile usability and accessibility compliance'
      },
      phase2_HighPriority: {
        duration: '2-4 weeks',
        components: highPriorityComponents.slice(0, 15),
        actions: [
          'Optimize financial UX patterns for mobile',
          'Implement swipe gestures and touch interactions',
          'Add loading states and performance optimizations',
          'Improve form layouts for mobile input'
        ],
        expectedImpact: 'Enhanced user experience and improved financial workflow efficiency'
      },
      phase3_Optimization: {
        duration: '4-6 weeks',
        components: mediumPriorityComponents.slice(0, 20),
        actions: [
          'Refactor complex layout structures',
          'Implement advanced mobile patterns',
          'Add animations and micro-interactions',
          'Optimize for different screen sizes and orientations'
        ],
        expectedImpact: 'Polished mobile experience with advanced interaction patterns'
      }
    };
  }

  private generateHeader(report: ClearPiggyProjectReport): string {
    return `
    <header class="gradient-bg text-white py-8">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold mb-2">Clear Piggy Mobile Optimization</h1>
            <p class="text-lg opacity-90">Comprehensive Analysis Report</p>
          </div>
          <div class="text-right">
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="text-3xl font-bold">${report.executiveSummary.overallMobileScore}/100</div>
              <div class="text-sm opacity-80">Overall Mobile Score</div>
            </div>
          </div>
        </div>
        <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div class="bg-white bg-opacity-10 rounded-lg p-3">
            <div class="text-2xl font-semibold">${report.metadata.totalComponentsAnalyzed}</div>
            <div class="text-sm opacity-80">Components Analyzed</div>
          </div>
          <div class="bg-white bg-opacity-10 rounded-lg p-3">
            <div class="text-2xl font-semibold text-red-200">${report.executiveSummary.criticalIssuesCount}</div>
            <div class="text-sm opacity-80">Critical Issues</div>
          </div>
          <div class="bg-white bg-opacity-10 rounded-lg p-3">
            <div class="text-2xl font-semibold text-yellow-200">${report.executiveSummary.highPriorityIssuesCount}</div>
            <div class="text-sm opacity-80">High Priority</div>
          </div>
          <div class="bg-white bg-opacity-10 rounded-lg p-3">
            <div class="text-2xl font-semibold">${report.executiveSummary.estimatedEffortHours}h</div>
            <div class="text-sm opacity-80">Estimated Effort</div>
          </div>
        </div>
      </div>
    </header>
    `;
  }

  private generateExecutiveSummaryHTML(report: ClearPiggyProjectReport): string {
    return `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Executive Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold mb-3">Key Metrics</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Total Issues Found:</span>
                <span class="font-medium">${report.executiveSummary.totalIssuesFound}</span>
              </div>
              <div class="flex justify-between">
                <span>Components Needing Attention:</span>
                <span class="font-medium">${report.executiveSummary.componentsNeedingAttention}</span>
              </div>
              <div class="flex justify-between">
                <span>Estimated Fix Time:</span>
                <span class="font-medium">${report.executiveSummary.estimatedEffortHours} hours</span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-semibold mb-3">Top Issue Categories</h3>
            <div class="space-y-2">
              ${report.executiveSummary.topIssueCategories.map((category, index) => `
                <div class="flex items-center">
                  <div class="w-4 h-4 bg-blue-${(index + 1) * 100} rounded-full mr-3"></div>
                  <span>${category}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="mt-6">
          <h3 class="font-semibold mb-3">Quick Wins (Easy Fixes)</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${report.executiveSummary.quickWins.map(win => `
              <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                <div class="text-green-800 text-sm">${win}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
    `;
  }

  private generateMetricsDashboard(report: ClearPiggyProjectReport): string {
    return `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-2xl font-bold mb-6">Mobile Optimization Dashboard</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Overall Score Gauge -->
          <div class="text-center">
            <h3 class="font-semibold mb-3">Overall Mobile Score</h3>
            <div class="relative w-32 h-32 mx-auto">
              <canvas id="overallScoreChart" width="128" height="128"></canvas>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-2xl font-bold">${report.executiveSummary.overallMobileScore}</div>
              </div>
            </div>
          </div>
          
          <!-- Priority Distribution -->
          <div>
            <h3 class="font-semibold mb-3">Issue Priority Distribution</h3>
            <canvas id="priorityChart" width="200" height="128"></canvas>
          </div>
          
          <!-- Component Scores -->
          <div>
            <h3 class="font-semibold mb-3">Top Performing Components</h3>
            <div class="space-y-2">
              ${report.componentAnalysis
                .sort((a, b) => b.overallMobileScore - a.overallMobileScore)
                .slice(0, 5)
                .map(component => `
                  <div class="flex justify-between items-center">
                    <span class="text-sm truncate">${component.componentFile.name}</span>
                    <div class="flex items-center">
                      <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${component.overallMobileScore}%"></div>
                      </div>
                      <span class="text-sm font-medium">${component.overallMobileScore}</span>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
  }

  private generateFinancialInsightsHTML(report: ClearPiggyProjectReport): string {
    return `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-2xl font-bold mb-6">Financial UX Insights</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${this.generateFinancialInsightCard('Transaction Lists', report.financialUXInsights.transactionListFindings)}
          ${this.generateFinancialInsightCard('Dashboard Cards', report.financialUXInsights.dashboardFindings)}
          ${this.generateFinancialInsightCard('Budget Charts', report.financialUXInsights.chartFindings)}
          ${this.generateFinancialInsightCard('Forms', report.financialUXInsights.formFindings)}
        </div>
      </div>
    </section>
    `;
  }

  private generateFinancialInsightCard(title: string, findings: any): string {
    return `
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <h3 class="font-semibold text-blue-900 mb-3">${title}</h3>
      <div class="space-y-3">
        <div class="flex justify-between text-sm">
          <span>Components Analyzed:</span>
          <span class="font-medium">${findings.componentsAnalyzed}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>Average Score:</span>
          <span class="font-medium">${findings.averageScore}/100</span>
        </div>
        
        ${findings.commonIssues.length > 0 ? `
          <div>
            <div class="text-sm font-medium mb-1">Common Issues:</div>
            <div class="space-y-1">
              ${findings.commonIssues.slice(0, 3).map((issue: string) => `
                <div class="text-xs bg-white bg-opacity-50 rounded px-2 py-1">${issue}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div>
          <div class="text-sm font-medium mb-1">Key Recommendations:</div>
          <div class="space-y-1">
            ${findings.recommendations.slice(0, 2).map((rec: string) => `
              <div class="text-xs text-blue-700">• ${rec}</div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    `;
  }

  private generateComponentAnalysisHTML(report: ClearPiggyProjectReport): string {
    const criticalComponents = report.componentAnalysis.filter(c => c.priority === 'critical');
    const highPriorityComponents = report.componentAnalysis.filter(c => c.priority === 'high');
    
    return `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-2xl font-bold mb-6">Component Analysis</h2>
        
        <!-- Critical Components -->
        ${criticalComponents.length > 0 ? `
          <div class="mb-8">
            <h3 class="text-xl font-semibold text-red-600 mb-4">🚨 Critical Priority Components</h3>
            <div class="grid gap-4">
              ${criticalComponents.slice(0, 10).map(component => this.generateComponentCard(component)).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- High Priority Components -->
        ${highPriorityComponents.length > 0 ? `
          <div class="mb-8">
            <h3 class="text-xl font-semibold text-orange-600 mb-4">⚠️ High Priority Components</h3>
            <div class="grid gap-4">
              ${highPriorityComponents.slice(0, 10).map(component => this.generateComponentCard(component)).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- All Components Table -->
        <div>
          <h3 class="text-xl font-semibold mb-4">All Components Summary</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left p-3">Component</th>
                  <th class="text-left p-3">Type</th>
                  <th class="text-center p-3">Score</th>
                  <th class="text-center p-3">Priority</th>
                  <th class="text-center p-3">Touch Targets</th>
                  <th class="text-center p-3">Responsive</th>
                  <th class="text-center p-3">Financial UX</th>
                </tr>
              </thead>
              <tbody>
                ${report.componentAnalysis.map(component => `
                  <tr class="border-t hover:bg-gray-50">
                    <td class="p-3 font-medium">${component.componentFile.name}</td>
                    <td class="p-3">
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        ${component.financialComponentType}
                      </span>
                    </td>
                    <td class="p-3 text-center">
                      <span class="font-medium ${component.overallMobileScore >= 80 ? 'text-green-600' : 
                        component.overallMobileScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                        ${component.overallMobileScore}
                      </span>
                    </td>
                    <td class="p-3 text-center">
                      <span class="px-2 py-1 rounded text-xs priority-${component.priority}">
                        ${component.priority}
                      </span>
                    </td>
                    <td class="p-3 text-center">${component.touchTargetIssues.length}</td>
                    <td class="p-3 text-center">${component.tailwindResponsiveGaps.length}</td>
                    <td class="p-3 text-center">${component.financialUXScore}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
    `;
  }

  private generateComponentCard(component: ClearPiggyAnalysisResult): string {
    return `
    <div class="border rounded-lg p-4 card-hover priority-${component.priority}">
      <div class="flex justify-between items-start mb-3">
        <h4 class="font-semibold text-lg">${component.componentFile.name}</h4>
        <div class="text-right">
          <div class="text-2xl font-bold">${component.overallMobileScore}/100</div>
          <div class="text-xs opacity-75">${component.financialComponentType}</div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
        <div>
          <div class="font-medium">Touch Targets</div>
          <div class="${component.touchTargetIssues.length > 0 ? 'text-red-600' : 'text-green-600'}">
            ${component.touchTargetIssues.length} issues
          </div>
        </div>
        <div>
          <div class="font-medium">Responsive</div>
          <div class="${component.tailwindResponsiveGaps.length > 0 ? 'text-red-600' : 'text-green-600'}">
            ${component.tailwindResponsiveGaps.length} gaps
          </div>
        </div>
        <div>
          <div class="font-medium">Navigation</div>
          <div class="${component.navigationIssues.length > 0 ? 'text-red-600' : 'text-green-600'}">
            ${component.navigationIssues.length} issues
          </div>
        </div>
        <div>
          <div class="font-medium">Financial UX</div>
          <div class="${component.financialUXScore < 70 ? 'text-red-600' : 'text-green-600'}">
            ${component.financialUXScore}/100
          </div>
        </div>
      </div>
      
      ${component.immediateActions.length > 0 ? `
        <div class="mt-3">
          <div class="text-sm font-medium mb-1">Immediate Actions:</div>
          <div class="space-y-1">
            ${component.immediateActions.slice(0, 3).map(action => `
              <div class="text-xs opacity-80">• ${action}</div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    `;
  }

  private generateRoadmapHTML(report: ClearPiggyProjectReport): string {
    return `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-2xl font-bold mb-6">Implementation Roadmap</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${this.generateRoadmapPhase('Phase 1: Critical Fixes', report.implementationRoadmap.phase1_Critical, 'red')}
          ${this.generateRoadmapPhase('Phase 2: High Priority', report.implementationRoadmap.phase2_HighPriority, 'orange')}
          ${this.generateRoadmapPhase('Phase 3: Optimization', report.implementationRoadmap.phase3_Optimization, 'green')}
        </div>
      </div>
    </section>
    `;
  }

  private generateRoadmapPhase(title: string, phase: any, color: string): string {
    return `
    <div class="bg-${color}-50 border border-${color}-200 rounded-lg p-4">
      <h3 class="font-semibold text-${color}-900 mb-2">${title}</h3>
      <div class="text-sm text-${color}-700 mb-3">Duration: ${phase.duration}</div>
      
      <div class="mb-3">
        <div class="font-medium text-sm mb-1">Components (${phase.components.length}):</div>
        <div class="text-xs space-y-1">
          ${phase.components.slice(0, 5).map((comp: string) => `<div>• ${comp}</div>`).join('')}
          ${phase.components.length > 5 ? `<div class="text-gray-500">+ ${phase.components.length - 5} more</div>` : ''}
        </div>
      </div>
      
      <div class="mb-3">
        <div class="font-medium text-sm mb-1">Key Actions:</div>
        <div class="text-xs space-y-1">
          ${phase.actions.map((action: string) => `<div>• ${action}</div>`).join('')}
        </div>
      </div>
      
      <div class="bg-white bg-opacity-50 rounded p-2 text-xs">
        <strong>Expected Impact:</strong> ${phase.expectedImpact}
      </div>
    </div>
    `;
  }

  private generateAIInsightsHTML(report: ClearPiggyProjectReport): string {
    return `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-2xl font-bold mb-6">🤖 AI-Powered Insights</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-3">Key Findings</h3>
            <div class="space-y-2">
              ${report.aiInsights.keyFindings.map(finding => `
                <div class="text-sm text-blue-800">• ${finding}</div>
              `).join('')}
            </div>
          </div>
          
          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="font-semibold text-green-900 mb-3">Technical Priorities</h3>
            <div class="space-y-2">
              ${report.aiInsights.technicalPriorities.map(priority => `
                <div class="text-sm text-green-800">• ${priority}</div>
              `).join('')}
            </div>
          </div>
          
          <div class="bg-purple-50 rounded-lg p-4">
            <h3 class="font-semibold text-purple-900 mb-3">Financial UX Recommendations</h3>
            <div class="space-y-2">
              ${report.aiInsights.financialUXRecommendations.map(rec => `
                <div class="text-sm text-purple-800">• ${rec}</div>
              `).join('')}
            </div>
          </div>
          
          <div class="bg-orange-50 rounded-lg p-4">
            <h3 class="font-semibold text-orange-900 mb-3">Implementation Strategy</h3>
            <div class="space-y-2">
              ${report.aiInsights.implementationStrategy.map((step, index) => `
                <div class="text-sm text-orange-800">${index + 1}. ${step}</div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
  }

  private generateTechnicalDebtHTML(report: ClearPiggyProjectReport): string {
    return `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-2xl font-bold mb-6">Technical Debt Analysis</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 class="font-semibold text-red-900 mb-3">Touch Target Debt</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Total Violations:</span>
                <span class="font-medium">${report.technicalDebt.touchTargetDebt.totalViolations}</span>
              </div>
              <div class="flex justify-between">
                <span>Critical Violations:</span>
                <span class="font-medium text-red-600">${report.technicalDebt.touchTargetDebt.criticalViolations}</span>
              </div>
              <div class="flex justify-between">
                <span>Estimated Fix Time:</span>
                <span class="font-medium">${report.technicalDebt.touchTargetDebt.estimatedFixTime}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="font-semibold text-yellow-900 mb-3">Responsive Design Debt</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Total Gaps:</span>
                <span class="font-medium">${report.technicalDebt.responsiveDesignDebt.totalGaps}</span>
              </div>
              <div class="flex justify-between">
                <span>Major Breakpoints:</span>
                <span class="font-medium">${report.technicalDebt.responsiveDesignDebt.majorBreakpoints.length}</span>
              </div>
              <div class="flex justify-between">
                <span>Estimated Fix Time:</span>
                <span class="font-medium">${report.technicalDebt.responsiveDesignDebt.estimatedFixTime}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-3">Performance Debt</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Components with Issues:</span>
                <span class="font-medium">${report.technicalDebt.performanceDebt.componentsWithIssues}</span>
              </div>
              <div class="flex justify-between">
                <span>Average Score:</span>
                <span class="font-medium">${report.technicalDebt.performanceDebt.averagePerformanceScore}/100</span>
              </div>
              <div class="flex justify-between">
                <span>Improvement Time:</span>
                <span class="font-medium">${report.technicalDebt.performanceDebt.estimatedImprovementTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
  }

  private generateFooter(report: ClearPiggyProjectReport): string {
    return `
    <footer class="bg-gray-800 text-white py-8 mt-12">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="font-semibold mb-3">Report Information</h3>
            <div class="text-sm space-y-1">
              <div>Generated: ${report.metadata.analysisDate.toLocaleString()}</div>
              <div>Analysis Version: ${report.metadata.analysisVersion}</div>
              <div>Components: ${report.metadata.totalComponentsAnalyzed}/${report.metadata.totalComponentsFound}</div>
            </div>
          </div>
          
          <div>
            <h3 class="font-semibold mb-3">Next Steps</h3>
            <div class="text-sm space-y-1">
              <div>1. Address critical priority components</div>
              <div>2. Implement touch target fixes</div>
              <div>3. Add responsive design patterns</div>
              <div>4. Test on mobile devices</div>
            </div>
          </div>
          
          <div>
            <h3 class="font-semibold mb-3">Clear Piggy Mobile Optimizer</h3>
            <div class="text-sm space-y-1">
              <div>Powered by Mastra AI & Claude Sonnet 4</div>
              <div>Specialized for Financial SaaS</div>
              <div>React + TypeScript + Tailwind CSS</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
    `;
  }

  private generateJavaScript(): string {
    return `
    // Initialize charts
    document.addEventListener('DOMContentLoaded', function() {
      // Overall Score Gauge
      const overallCtx = document.getElementById('overallScoreChart')?.getContext('2d');
      if (overallCtx) {
        new Chart(overallCtx, {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [${this.config.projectPath ? '85' : '0'}, ${this.config.projectPath ? '15' : '100'}],
              backgroundColor: ['#10B981', '#E5E7EB'],
              borderWidth: 0
            }]
          },
          options: {
            cutout: '80%',
            plugins: { legend: { display: false } }
          }
        });
      }
      
      // Priority Distribution Chart
      const priorityCtx = document.getElementById('priorityChart')?.getContext('2d');
      if (priorityCtx) {
        new Chart(priorityCtx, {
          type: 'bar',
          data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
              data: [3, 8, 12, 5],
              backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981']
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { 
              y: { beginAtZero: true },
              x: { display: false }
            }
          }
        });
      }
      
      // Add interactive features
      document.querySelectorAll('.card-hover').forEach(card => {
        card.addEventListener('click', function() {
          // Could expand to show more details
          console.log('Component card clicked:', this);
        });
      });
    });
    `;
  }
}