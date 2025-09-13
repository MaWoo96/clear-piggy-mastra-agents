/**
 * Clear Piggy Mobile Optimization Agent
 * Main Mastra AI agent for analyzing React components and generating mobile optimization reports
 */

import { Agent, AgentConfig } from '@mastra/core';
import { ComponentFileReader } from '../utils/file-reader';
import { MobileOptimizationAnalyzer } from '../analyzers/mobile-optimizer';
import { 
  ComponentAnalysisResult, 
  ProjectAnalysisReport, 
  AnalysisConfig,
  ComponentFile 
} from '../types/analysis';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ClearPiggyMobileOptimizationAgent extends Agent {
  private fileReader: ComponentFileReader;
  private analyzer: MobileOptimizationAnalyzer;
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig, agentConfig?: AgentConfig) {
    super({
      name: 'Clear Piggy Mobile Optimization Agent',
      description: 'Analyzes React components for mobile optimization opportunities in financial SaaS applications',
      ...agentConfig,
    });

    this.config = config;
    this.fileReader = new ComponentFileReader(
      config.projectPath,
      config.componentsPath
    );
    this.analyzer = new MobileOptimizationAnalyzer(config);
  }

  /**
   * Run complete mobile optimization analysis on Clear Piggy project
   */
  async analyzeProject(): Promise<ProjectAnalysisReport> {
    try {
      console.log('🔍 Starting Clear Piggy mobile optimization analysis...');
      
      // Read all components
      const components = await this.fileReader.readAllComponents();
      console.log(`📁 Found ${components.length} React components`);

      if (components.length === 0) {
        throw new Error('No React components found in the specified project path');
      }

      // Analyze each component
      const componentResults: ComponentAnalysisResult[] = [];
      
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        console.log(`📊 Analyzing component ${i + 1}/${components.length}: ${component.name}`);
        
        try {
          const result = await this.analyzer.analyzeComponent(component);
          componentResults.push(result);
        } catch (error) {
          console.warn(`⚠️ Failed to analyze component ${component.name}:`, error);
        }
      }

      // Generate comprehensive report
      const report = await this.generateProjectReport(componentResults);
      
      // Save report if output directory is specified
      if (this.config.outputPath) {
        await this.saveReport(report);
      }

      console.log('✅ Mobile optimization analysis complete!');
      return report;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze specific components by pattern
   */
  async analyzeComponentsByPattern(pattern: string): Promise<ComponentAnalysisResult[]> {
    const components = await this.fileReader.findComponentsByPattern(pattern);
    const results: ComponentAnalysisResult[] = [];

    for (const component of components) {
      const result = await this.analyzer.analyzeComponent(component);
      results.push(result);
    }

    return results;
  }

  /**
   * Focus on financial components specifically
   */
  async analyzeFinancialComponents(): Promise<ComponentAnalysisResult[]> {
    console.log('💰 Analyzing financial-specific components...');
    
    const financialComponents = await this.fileReader.getFinancialComponents();
    const results: ComponentAnalysisResult[] = [];

    for (const component of financialComponents) {
      console.log(`📈 Analyzing financial component: ${component.name}`);
      const result = await this.analyzer.analyzeComponent(component);
      results.push(result);
    }

    return results;
  }

  /**
   * Quick assessment for critical mobile issues
   */
  async quickMobileAssessment(): Promise<{
    criticalIssues: ComponentAnalysisResult[];
    summary: {
      totalComponents: number;
      criticalComponents: number;
      commonIssues: string[];
      recommendedActions: string[];
    };
  }> {
    const components = await this.fileReader.readAllComponents();
    const criticalIssues: ComponentAnalysisResult[] = [];
    const allIssues: string[] = [];

    // Analyze only components with likely critical issues
    const priorityComponents = components.slice(0, Math.min(10, components.length));

    for (const component of priorityComponents) {
      const result = await this.analyzer.analyzeComponent(component);
      
      if (result.priority === 'critical' || result.overallScore < 50) {
        criticalIssues.push(result);
        
        // Collect issues
        allIssues.push(...result.touchTargetAnalysis.issues.map(i => i.issue));
        allIssues.push(...result.tailwindAnalysis.responsivenessGaps.map(g => g.issue));
        allIssues.push(...result.navigationAnalysis.issues.map(i => i.issue));
      }
    }

    // Find most common issues
    const issueCounts = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    return {
      criticalIssues,
      summary: {
        totalComponents: components.length,
        criticalComponents: criticalIssues.length,
        commonIssues,
        recommendedActions: this.generateQuickRecommendations(criticalIssues),
      },
    };
  }

  /**
   * Generate AI-powered insights using Mastra
   */
  async generateAIInsights(analysisResults: ComponentAnalysisResult[]): Promise<{
    insights: string[];
    priorities: string[];
    implementationPlan: string[];
    financialUXRecommendations: string[];
  }> {
    const prompt = this.buildAnalysisPrompt(analysisResults);
    
    try {
      const response = await this.run({
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return this.parseAIResponse(response.text);
    } catch (error) {
      console.warn('Failed to generate AI insights:', error);
      return this.generateFallbackInsights(analysisResults);
    }
  }

  /**
   * Generate project report
   */
  private async generateProjectReport(componentResults: ComponentAnalysisResult[]): Promise<ProjectAnalysisReport> {
    const now = new Date();
    const criticalIssues = componentResults.filter(r => r.priority === 'critical').length;
    const highPriorityIssues = componentResults.filter(r => r.priority === 'high').length;
    const componentsNeedingWork = componentResults.filter(r => r.overallScore < 70).length;
    
    // Calculate overall mobile score
    const overallMobileScore = componentResults.length > 0 
      ? componentResults.reduce((sum, r) => sum + r.overallScore, 0) / componentResults.length 
      : 0;

    // Find top issue categories
    const allIssues: string[] = [];
    componentResults.forEach(result => {
      allIssues.push(...result.touchTargetAnalysis.issues.map(i => 'Touch Target Issues'));
      allIssues.push(...result.tailwindAnalysis.responsivenessGaps.map(g => 'Responsive Design Gaps'));
      allIssues.push(...result.navigationAnalysis.issues.map(i => 'Navigation Issues'));
      allIssues.push(...result.financialAnalysis.specificIssues.map(i => 'Financial UX Issues'));
    });

    const issueCounts = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIssueCategories = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Get project stats
    const projectStats = await this.fileReader.getProjectStats();
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(componentResults);
    const financialUXInsights = await this.generateFinancialUXInsights(componentResults);

    return {
      projectInfo: {
        name: 'Clear Piggy',
        totalComponents: projectStats.totalComponents,
        analyzedComponents: componentResults.length,
        timestamp: now,
        version: '1.0.0',
      },
      summary: {
        overallMobileScore: Math.round(overallMobileScore),
        criticalIssues,
        highPriorityIssues,
        componentsNeedingWork,
        topIssueCategories,
      },
      componentResults,
      recommendations,
      financialUXInsights,
    };
  }

  /**
   * Save report to file system
   */
  private async saveReport(report: ProjectAnalysisReport): Promise<void> {
    try {
      await fs.mkdir(this.config.outputPath, { recursive: true });
      
      const timestamp = report.projectInfo.timestamp.toISOString().split('T')[0];
      const reportPath = path.join(this.config.outputPath, `clear-piggy-mobile-report-${timestamp}.json`);
      const htmlReportPath = path.join(this.config.outputPath, `clear-piggy-mobile-report-${timestamp}.html`);
      
      // Save JSON report
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`📊 Report saved to: ${reportPath}`);

      // Generate and save HTML report
      const htmlReport = await this.generateHTMLReport(report);
      await fs.writeFile(htmlReportPath, htmlReport);
      console.log(`📄 HTML report saved to: ${htmlReportPath}`);

    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }

  /**
   * Generate recommendations based on analysis results
   */
  private async generateRecommendations(results: ComponentAnalysisResult[]): Promise<{
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  }> {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Analyze critical issues for immediate action
    const criticalComponents = results.filter(r => r.priority === 'critical');
    if (criticalComponents.length > 0) {
      immediate.push(`Fix ${criticalComponents.length} components with critical mobile issues`);
      immediate.push('Address touch target size violations (minimum 44px)');
      immediate.push('Fix navigation accessibility issues');
    }

    // Short-term improvements
    const responsiveIssues = results.reduce((sum, r) => sum + r.tailwindAnalysis.responsivenessGaps.length, 0);
    if (responsiveIssues > 0) {
      shortTerm.push(`Improve responsive design for ${responsiveIssues} identified gaps`);
      shortTerm.push('Implement mobile-first design patterns');
      shortTerm.push('Add missing responsive breakpoints');
    }

    // Long-term optimizations
    const complexComponents = results.filter(r => r.layoutAnalysis.complexity.mobileOptimizationScore < 70);
    if (complexComponents.length > 0) {
      longTerm.push(`Refactor ${complexComponents.length} components with complex layouts`);
      longTerm.push('Implement component-level performance optimizations');
      longTerm.push('Create mobile-specific component variants');
    }

    return { immediate, shortTerm, longTerm };
  }

  /**
   * Generate financial UX insights
   */
  private async generateFinancialUXInsights(results: ComponentAnalysisResult[]): Promise<{
    transactionListOptimization: string[];
    budgetChartImprovements: string[];
    dashboardEnhancements: string[];
    formOptimizations: string[];
  }> {
    const financialComponents = results.filter(r => r.financialAnalysis.componentType !== 'other');
    
    const insights = {
      transactionListOptimization: [
        'Implement virtualization for large transaction lists',
        'Add swipe actions for quick operations',
        'Use pull-to-refresh for data updates',
      ],
      budgetChartImprovements: [
        'Make charts touch-interactive on mobile',
        'Implement responsive chart sizing',
        'Add loading states for better UX',
      ],
      dashboardEnhancements: [
        'Stack dashboard cards vertically on mobile',
        'Implement progressive disclosure patterns',
        'Add tap-to-expand functionality',
      ],
      formOptimizations: [
        'Use appropriate input types for financial data',
        'Implement real-time number formatting',
        'Add contextual help and validation',
      ],
    };

    return insights;
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(report: ProjectAnalysisReport): Promise<string> {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Clear Piggy Mobile Optimization Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body class="bg-gray-50 p-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Clear Piggy Mobile Optimization Report</h1>
          <p class="text-gray-600">Generated on ${report.projectInfo.timestamp.toLocaleString()}</p>
          <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h3 class="font-semibold text-blue-900">Overall Score</h3>
              <p class="text-2xl font-bold text-blue-600">${report.summary.overallMobileScore}/100</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <h3 class="font-semibold text-red-900">Critical Issues</h3>
              <p class="text-2xl font-bold text-red-600">${report.summary.criticalIssues}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h3 class="font-semibold text-yellow-900">High Priority</h3>
              <p class="text-2xl font-bold text-yellow-600">${report.summary.highPriorityIssues}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <h3 class="font-semibold text-green-900">Components Analyzed</h3>
              <p class="text-2xl font-bold text-green-600">${report.projectInfo.analyzedComponents}</p>
            </div>
          </div>
        </header>

        <!-- Summary -->
        <section class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Executive Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-semibold mb-2">Top Issue Categories</h3>
              <ul class="space-y-1">
                ${report.summary.topIssueCategories.map(category => 
                  `<li class="text-gray-700">• ${category}</li>`
                ).join('')}
              </ul>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Immediate Actions Required</h3>
              <ul class="space-y-1">
                ${report.recommendations.immediate.slice(0, 3).map(rec => 
                  `<li class="text-gray-700">• ${rec}</li>`
                ).join('')}
              </ul>
            </div>
          </div>
        </section>

        <!-- Component Results -->
        <section class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Component Analysis Results</h2>
          <div class="space-y-4">
            ${report.componentResults.slice(0, 10).map(result => `
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                  <h3 class="font-semibold">${result.file.name}</h3>
                  <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 text-xs rounded ${
                      result.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      result.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                      result.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }">${result.priority.toUpperCase()}</span>
                    <span class="font-semibold">${result.overallScore}/100</span>
                  </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>Touch Targets: ${result.touchTargetAnalysis.passRate.toFixed(0)}%</div>
                  <div>Responsive: ${result.tailwindAnalysis.mobileFirstScore.toFixed(0)}%</div>
                  <div>Layout: ${result.layoutAnalysis.complexity.mobileOptimizationScore}/100</div>
                  <div>Navigation: ${result.navigationAnalysis.mobileNavScore}/100</div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Financial UX Insights -->
        <section class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Financial UX Recommendations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-semibold mb-2">Transaction Lists</h3>
              <ul class="space-y-1 text-sm">
                ${report.financialUXInsights.transactionListOptimization.map(rec => 
                  `<li class="text-gray-700">• ${rec}</li>`
                ).join('')}
              </ul>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Budget Charts</h3>
              <ul class="space-y-1 text-sm">
                ${report.financialUXInsights.budgetChartImprovements.map(rec => 
                  `<li class="text-gray-700">• ${rec}</li>`
                ).join('')}
              </ul>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Dashboard</h3>
              <ul class="space-y-1 text-sm">
                ${report.financialUXInsights.dashboardEnhancements.map(rec => 
                  `<li class="text-gray-700">• ${rec}</li>`
                ).join('')}
              </ul>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Forms</h3>
              <ul class="space-y-1 text-sm">
                ${report.financialUXInsights.formOptimizations.map(rec => 
                  `<li class="text-gray-700">• ${rec}</li>`
                ).join('')}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Build analysis prompt for AI insights
   */
  private buildAnalysisPrompt(results: ComponentAnalysisResult[]): string {
    const criticalIssues = results.filter(r => r.priority === 'critical').length;
    const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
    
    return `
    You are a mobile UX expert analyzing a React/TypeScript financial SaaS application called Clear Piggy.

    Analysis Summary:
    - Total components analyzed: ${results.length}
    - Critical priority components: ${criticalIssues}
    - Average mobile optimization score: ${avgScore.toFixed(1)}/100
    
    Key Issues Found:
    ${results.slice(0, 5).map(r => `
    - ${r.file.name}: Score ${r.overallScore}/100, Priority: ${r.priority}
      Touch targets: ${r.touchTargetAnalysis.issues.length} issues
      Responsive gaps: ${r.tailwindAnalysis.responsivenessGaps.length} gaps
      Layout complexity: ${r.layoutAnalysis.complexity.nestingDepth} max depth
    `).join('')}

    Please provide:
    1. 3-5 key insights about mobile optimization opportunities
    2. 3-5 prioritized action items
    3. A step-by-step implementation plan (5-7 steps)
    4. 3-5 financial UX specific recommendations for mobile users

    Focus on practical, actionable advice for a financial SaaS mobile experience.
    `;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string): {
    insights: string[];
    priorities: string[];
    implementationPlan: string[];
    financialUXRecommendations: string[];
  } {
    // Simple parsing - in a real implementation, you'd want more robust parsing
    const sections = response.split('\n\n');
    
    return {
      insights: this.extractListFromSection(sections.find(s => s.toLowerCase().includes('insight')) || ''),
      priorities: this.extractListFromSection(sections.find(s => s.toLowerCase().includes('priorit')) || ''),
      implementationPlan: this.extractListFromSection(sections.find(s => s.toLowerCase().includes('implementation')) || ''),
      financialUXRecommendations: this.extractListFromSection(sections.find(s => s.toLowerCase().includes('financial')) || ''),
    };
  }

  private extractListFromSection(section: string): string[] {
    return section.split('\n')
      .filter(line => line.trim().match(/^\d+\.|^[-•]/))
      .map(line => line.replace(/^\d+\.\s*|^[-•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Generate fallback insights if AI fails
   */
  private generateFallbackInsights(results: ComponentAnalysisResult[]): {
    insights: string[];
    priorities: string[];
    implementationPlan: string[];
    financialUXRecommendations: string[];
  } {
    return {
      insights: [
        'Mobile optimization scores vary significantly across components',
        'Touch target compliance is the most critical issue',
        'Responsive design implementation needs improvement',
        'Financial components require specialized mobile patterns',
      ],
      priorities: [
        'Fix critical touch target violations',
        'Implement mobile navigation patterns',
        'Add responsive breakpoints',
        'Optimize financial data display for mobile',
      ],
      implementationPlan: [
        'Audit and fix all touch target size violations',
        'Implement mobile-first responsive design',
        'Create mobile navigation component',
        'Optimize transaction list for mobile scrolling',
        'Add mobile-specific form patterns',
        'Test on various mobile devices',
        'Monitor mobile performance metrics',
      ],
      financialUXRecommendations: [
        'Implement swipe actions for transaction management',
        'Add pull-to-refresh for account data',
        'Create mobile-optimized charts and graphs',
        'Implement quick actions for common tasks',
      ],
    };
  }

  private generateQuickRecommendations(criticalIssues: ComponentAnalysisResult[]): string[] {
    const recommendations: string[] = [];
    
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} components with critical mobile issues`);
    }

    const touchIssues = criticalIssues.reduce((sum, r) => sum + r.touchTargetAnalysis.issues.length, 0);
    if (touchIssues > 0) {
      recommendations.push(`Fix ${touchIssues} touch target size violations`);
    }

    const navIssues = criticalIssues.reduce((sum, r) => sum + r.navigationAnalysis.issues.length, 0);
    if (navIssues > 0) {
      recommendations.push(`Resolve ${navIssues} navigation accessibility issues`);
    }

    return recommendations;
  }
}