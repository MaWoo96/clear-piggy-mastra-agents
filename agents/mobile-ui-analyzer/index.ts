/**
 * Clear Piggy Mobile Optimization Agent
 * Specialized Mastra AI agent for financial SaaS mobile optimization analysis
 */

import { Agent, AgentConfig } from '@mastra/core';
import { ComponentFileReader } from '../utils/file-reader';
import { ClearPiggyMobileAnalyzer } from '../analyzers/clear-piggy-analyzer';
import { ClearPiggyReportGenerator } from '../reports/clear-piggy-reports';
import { 
  ClearPiggyAnalysisResult, 
  ClearPiggyProjectReport, 
  ClearPiggyConfig,
  FinancialComponentType,
  MobileOptimizationPriority 
} from '../types/clear-piggy-types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ClearPiggyMobileAgent extends Agent {
  private fileReader: ComponentFileReader;
  private analyzer: ClearPiggyMobileAnalyzer;
  private reportGenerator: ClearPiggyReportGenerator;
  private config: ClearPiggyConfig;

  constructor(config: ClearPiggyConfig, agentConfig?: AgentConfig) {
    super({
      name: 'Clear Piggy Mobile Optimization Agent',
      description: `AI agent specialized in analyzing React/TypeScript components for mobile optimization 
                   in financial SaaS applications. Expert in Tailwind CSS, Framer Motion, and financial UX patterns.`,
      systemMessage: `You are a mobile UX optimization expert specializing in React/TypeScript financial applications.
                     
                     Your expertise includes:
                     - Mobile-first responsive design patterns
                     - Touch target accessibility (44px minimum)
                     - Financial UI/UX best practices for mobile
                     - Tailwind CSS mobile optimization
                     - React component performance on mobile
                     - Financial app navigation patterns
                     - Transaction list virtualization
                     - Mobile chart interactions
                     - Form optimization for financial inputs
                     - Accessibility compliance for financial data
                     
                     Focus on providing actionable, specific recommendations for Clear Piggy's financial SaaS platform.`,
      ...agentConfig,
    });

    this.config = config;
    this.fileReader = new ComponentFileReader(
      config.projectPath,
      config.componentsPath
    );
    this.analyzer = new ClearPiggyMobileAnalyzer(config);
    this.reportGenerator = new ClearPiggyReportGenerator(config);
  }

  /**
   * Analyze entire Clear Piggy project for mobile optimization
   */
  async analyzeProject(): Promise<ClearPiggyProjectReport> {
    try {
      console.log('🔍 Starting Clear Piggy mobile optimization analysis...');
      
      // Phase 1: Component Discovery
      const components = await this.discoverComponents();
      console.log(`📁 Discovered ${components.length} React components`);

      // Phase 2: Component Analysis
      const analysisResults = await this.analyzeComponents(components);
      console.log(`📊 Analyzed ${analysisResults.length} components`);

      // Phase 3: AI-Powered Insights
      const aiInsights = await this.generateAIInsights(analysisResults);
      console.log('🤖 Generated AI-powered recommendations');

      // Phase 4: Report Generation
      const report = await this.reportGenerator.generateProjectReport(
        analysisResults,
        aiInsights,
        components.length
      );

      // Phase 5: Save Reports
      await this.saveReports(report);
      console.log('💾 Reports saved successfully');

      return report;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Quick assessment focusing on critical mobile issues
   */
  async quickMobileAssessment(): Promise<{
    criticalIssues: ClearPiggyAnalysisResult[];
    summary: {
      totalComponents: number;
      criticalComponents: number;
      highPriorityComponents: number;
      averageMobileScore: number;
      topIssueTypes: string[];
      urgentRecommendations: string[];
    };
  }> {
    console.log('⚡ Running quick mobile assessment...');
    
    const components = await this.discoverComponents();
    const priorityComponents = await this.selectPriorityComponents(components);
    
    const results: ClearPiggyAnalysisResult[] = [];
    
    for (const component of priorityComponents) {
      const result = await this.analyzer.analyzeComponent(component);
      results.push(result);
    }

    const criticalIssues = results.filter(r => r.priority === 'critical');
    const highPriorityIssues = results.filter(r => r.priority === 'high');
    
    const averageMobileScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.overallMobileScore, 0) / results.length 
      : 0;

    // Collect issue types
    const allIssues: string[] = [];
    results.forEach(result => {
      result.touchTargetIssues.forEach(issue => allIssues.push('Touch Target Violation'));
      result.tailwindResponsiveGaps.forEach(gap => allIssues.push('Responsive Design Gap'));
      result.navigationIssues.forEach(issue => allIssues.push('Navigation Pattern Issue'));
      result.layoutComplexityIssues.forEach(issue => allIssues.push('Layout Complexity'));
      result.financialUXIssues.forEach(issue => allIssues.push('Financial UX Issue'));
    });

    const issueCounts = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIssueTypes = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);

    return {
      criticalIssues,
      summary: {
        totalComponents: components.length,
        criticalComponents: criticalIssues.length,
        highPriorityComponents: highPriorityIssues.length,
        averageMobileScore: Math.round(averageMobileScore),
        topIssueTypes,
        urgentRecommendations: await this.generateUrgentRecommendations(criticalIssues),
      },
    };
  }

  /**
   * Analyze specific financial component patterns
   */
  async analyzeFinancialPatterns(): Promise<{
    transactionComponents: ClearPiggyAnalysisResult[];
    dashboardComponents: ClearPiggyAnalysisResult[];
    chartComponents: ClearPiggyAnalysisResult[];
    formComponents: ClearPiggyAnalysisResult[];
    financialRecommendations: {
      [key in FinancialComponentType]: string[];
    };
  }> {
    console.log('💰 Analyzing financial component patterns...');
    
    const components = await this.discoverComponents();
    const results: ClearPiggyAnalysisResult[] = [];
    
    for (const component of components) {
      const result = await this.analyzer.analyzeComponent(component);
      results.push(result);
    }

    // Categorize by financial patterns
    const transactionComponents = results.filter(r => r.financialComponentType === 'transaction-list');
    const dashboardComponents = results.filter(r => r.financialComponentType === 'dashboard-card');
    const chartComponents = results.filter(r => r.financialComponentType === 'budget-chart');
    const formComponents = results.filter(r => r.financialComponentType === 'form');

    const financialRecommendations = await this.generateFinancialRecommendations(results);

    return {
      transactionComponents,
      dashboardComponents,
      chartComponents,
      formComponents,
      financialRecommendations,
    };
  }

  /**
   * Compare desktop vs mobile implementations
   */
  async compareDesktopMobile(): Promise<{
    componentComparisons: Array<{
      componentName: string;
      desktopVersion?: ClearPiggyAnalysisResult;
      mobileVersion?: ClearPiggyAnalysisResult;
      comparisonInsights: string[];
      recommendations: string[];
    }>;
    overallComparison: {
      mobileOptimizationGap: number;
      consistencyScore: number;
      recommendations: string[];
    };
  }> {
    console.log('🔄 Comparing desktop vs mobile implementations...');
    
    const mainComponents = await this.fileReader.readAllComponents();
    const mobileComponents = await this.fileReader.readComponentsFromPath(
      this.config.mobileUIPath || 'mobile-ui'
    );

    const comparisons: Array<{
      componentName: string;
      desktopVersion?: ClearPiggyAnalysisResult;
      mobileVersion?: ClearPiggyAnalysisResult;
      comparisonInsights: string[];
      recommendations: string[];
    }> = [];

    // Find matching components
    for (const mainComponent of mainComponents) {
      const mobileVariant = mobileComponents.find(m => 
        m.name === mainComponent.name || 
        m.name === `Mobile${mainComponent.name}` ||
        mainComponent.name.includes('Mobile')
      );

      if (mobileVariant || mainComponent.name.includes('Mobile')) {
        const desktopAnalysis = !mainComponent.name.includes('Mobile') 
          ? await this.analyzer.analyzeComponent(mainComponent)
          : undefined;
        
        const mobileAnalysis = mobileVariant 
          ? await this.analyzer.analyzeComponent(mobileVariant)
          : mainComponent.name.includes('Mobile')
            ? await this.analyzer.analyzeComponent(mainComponent)
            : undefined;

        const insights = await this.generateComparisonInsights(desktopAnalysis, mobileAnalysis);
        const recommendations = await this.generateComparisonRecommendations(desktopAnalysis, mobileAnalysis);

        comparisons.push({
          componentName: mainComponent.name,
          desktopVersion: desktopAnalysis,
          mobileVersion: mobileAnalysis,
          comparisonInsights: insights,
          recommendations,
        });
      }
    }

    // Calculate overall comparison metrics
    const overallComparison = await this.calculateOverallComparison(comparisons);

    return {
      componentComparisons: comparisons,
      overallComparison,
    };
  }

  /**
   * Generate AI-powered insights using Claude
   */
  async generateAIInsights(results: ClearPiggyAnalysisResult[]): Promise<{
    keyInsights: string[];
    implementationPlan: string[];
    financialUXRecommendations: string[];
    technicalPriorities: string[];
  }> {
    const criticalComponents = results.filter(r => r.priority === 'critical').length;
    const averageScore = results.reduce((sum, r) => sum + r.overallMobileScore, 0) / results.length;
    
    const prompt = `
    As a mobile UX expert analyzing Clear Piggy, a React/TypeScript financial SaaS application, please provide insights based on this analysis:

    PROJECT CONTEXT:
    - Financial SaaS platform built with React 19 + TypeScript
    - Uses Tailwind CSS + Framer Motion for UI
    - Supabase backend with Plaid integration
    - ${results.length} components analyzed
    - ${criticalComponents} critical priority components
    - Average mobile score: ${averageScore.toFixed(1)}/100

    COMPONENT ANALYSIS SUMMARY:
    ${results.slice(0, 10).map(r => `
    - ${r.componentFile.name}:
      * Overall Score: ${r.overallMobileScore}/100
      * Touch Target Issues: ${r.touchTargetIssues.length}
      * Responsive Gaps: ${r.tailwindResponsiveGaps.length}
      * Financial Type: ${r.financialComponentType}
      * Mobile Navigation Issues: ${r.navigationIssues.length}
    `).join('')}

    Please provide:

    1. KEY INSIGHTS (3-5 critical observations about mobile optimization state)
    2. IMPLEMENTATION PLAN (5-7 step plan to improve mobile experience)
    3. FINANCIAL UX RECOMMENDATIONS (specific to financial app mobile patterns)
    4. TECHNICAL PRIORITIES (immediate technical actions needed)

    Focus on actionable advice for a financial SaaS mobile experience, considering:
    - Transaction list performance and usability
    - Dashboard card layouts on mobile
    - Form optimization for financial inputs
    - Chart interactions on touch devices
    - Navigation patterns for financial workflows
    `;

    try {
      const response = await this.run({
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return this.parseAIInsights(response.text);
    } catch (error) {
      console.warn('⚠️ Failed to generate AI insights, using fallback:', error);
      return this.generateFallbackInsights(results);
    }
  }

  // Private helper methods

  private async discoverComponents() {
    const mainComponents = await this.fileReader.readAllComponents();
    
    // Also read mobile UI components if they exist
    let mobileComponents: any[] = [];
    try {
      mobileComponents = await this.fileReader.readComponentsFromPath(
        this.config.mobileUIPath || 'mobile-ui'
      );
    } catch (error) {
      console.log('📱 No mobile-ui directory found, analyzing main components only');
    }

    return [...mainComponents, ...mobileComponents];
  }

  private async analyzeComponents(components: any[]): Promise<ClearPiggyAnalysisResult[]> {
    const results: ClearPiggyAnalysisResult[] = [];
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      console.log(`📊 Analyzing component ${i + 1}/${components.length}: ${component.name}`);
      
      try {
        const result = await this.analyzer.analyzeComponent(component);
        results.push(result);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${component.name}:`, error);
      }
    }

    return results;
  }

  private async selectPriorityComponents(components: any[]) {
    // Select components most likely to have mobile issues
    const priorityPatterns = [
      'Dashboard', 'Transaction', 'Receipt', 'Chart', 'Form', 'Navigation',
      'Mobile', 'Plaid', 'Budget', 'Account', 'Balance'
    ];

    const priority = components.filter(comp => 
      priorityPatterns.some(pattern => 
        comp.name.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    // If no priority matches, take first 10 components
    return priority.length > 0 ? priority : components.slice(0, 10);
  }

  private async generateUrgentRecommendations(criticalIssues: ClearPiggyAnalysisResult[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    const touchTargetViolations = criticalIssues.reduce((sum, r) => sum + r.touchTargetIssues.length, 0);
    if (touchTargetViolations > 0) {
      recommendations.push(`Fix ${touchTargetViolations} touch target size violations (minimum 44px)`);
    }

    const navIssues = criticalIssues.reduce((sum, r) => sum + r.navigationIssues.length, 0);
    if (navIssues > 0) {
      recommendations.push(`Address ${navIssues} critical navigation accessibility issues`);
    }

    const responsiveGaps = criticalIssues.reduce((sum, r) => sum + r.tailwindResponsiveGaps.length, 0);
    if (responsiveGaps > 0) {
      recommendations.push(`Fix ${responsiveGaps} responsive design gaps for mobile screens`);
    }

    if (criticalIssues.length > 0) {
      recommendations.push(`Prioritize ${criticalIssues.length} components with critical mobile issues`);
    }

    return recommendations;
  }

  private async generateFinancialRecommendations(results: ClearPiggyAnalysisResult[]): Promise<{
    [key in FinancialComponentType]: string[];
  }> {
    const recommendations = {
      'transaction-list': [
        'Implement virtual scrolling for large transaction lists',
        'Add swipe actions for quick transaction operations',
        'Optimize touch targets for transaction selection',
        'Include pull-to-refresh for transaction updates'
      ],
      'dashboard-card': [
        'Stack dashboard cards vertically on mobile',
        'Implement progressive disclosure for detailed data',
        'Add touch-friendly expand/collapse interactions',
        'Optimize card spacing for finger navigation'
      ],
      'budget-chart': [
        'Make charts fully touch-interactive',
        'Implement responsive chart sizing',
        'Add mobile-specific tooltip positioning',
        'Include gesture support for chart navigation'
      ],
      'form': [
        'Use appropriate input types for financial data',
        'Implement real-time number formatting',
        'Optimize form validation for mobile',
        'Add contextual keyboards for different input types'
      ],
      'navigation': [
        'Implement hamburger menu for mobile',
        'Add bottom tab navigation for core functions',
        'Include breadcrumb navigation for complex flows',
        'Optimize menu item spacing for touch'
      ],
      'other': [
        'Ensure consistent mobile design patterns',
        'Implement loading states for all async operations',
        'Add offline support for core functionality',
        'Optimize images and assets for mobile bandwidth'
      ]
    };

    return recommendations;
  }

  private async generateComparisonInsights(
    desktop?: ClearPiggyAnalysisResult,
    mobile?: ClearPiggyAnalysisResult
  ): Promise<string[]> {
    const insights: string[] = [];

    if (desktop && mobile) {
      const scoreDiff = mobile.overallMobileScore - desktop.overallMobileScore;
      if (scoreDiff > 20) {
        insights.push(`Mobile version shows significant improvement (+${scoreDiff} points)`);
      } else if (scoreDiff < -10) {
        insights.push(`Mobile version needs optimization (${scoreDiff} points lower)`);
      }

      if (desktop.touchTargetIssues.length > mobile.touchTargetIssues.length) {
        insights.push('Mobile version has better touch target compliance');
      }

      if (desktop.tailwindResponsiveGaps.length > mobile.tailwindResponsiveGaps.length) {
        insights.push('Mobile version has better responsive design implementation');
      }
    } else if (desktop && !mobile) {
      insights.push('Component lacks mobile-specific implementation');
      insights.push('Desktop version may not be optimized for mobile screens');
    } else if (mobile && !desktop) {
      insights.push('Mobile-first component implementation');
    }

    return insights;
  }

  private async generateComparisonRecommendations(
    desktop?: ClearPiggyAnalysisResult,
    mobile?: ClearPiggyAnalysisResult
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (desktop && !mobile) {
      recommendations.push('Create mobile-optimized variant of this component');
      recommendations.push('Implement responsive breakpoints for mobile screens');
      recommendations.push('Consider mobile-first design patterns');
    }

    if (desktop && mobile) {
      if (desktop.overallMobileScore > mobile.overallMobileScore) {
        recommendations.push('Apply desktop optimizations to mobile version');
      }
      recommendations.push('Ensure consistent user experience across versions');
    }

    return recommendations;
  }

  private async calculateOverallComparison(comparisons: any[]): Promise<{
    mobileOptimizationGap: number;
    consistencyScore: number;
    recommendations: string[];
  }> {
    const validComparisons = comparisons.filter(c => c.desktopVersion && c.mobileVersion);
    
    if (validComparisons.length === 0) {
      return {
        mobileOptimizationGap: 0,
        consistencyScore: 0,
        recommendations: ['Create mobile-specific component implementations'],
      };
    }

    const gaps = validComparisons.map(c => 
      c.mobileVersion!.overallMobileScore - c.desktopVersion!.overallMobileScore
    );
    
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const consistency = 100 - (gaps.reduce((sum, gap) => sum + Math.abs(gap), 0) / gaps.length);

    return {
      mobileOptimizationGap: Math.round(averageGap),
      consistencyScore: Math.round(consistency),
      recommendations: [
        'Standardize mobile optimization patterns across components',
        'Create shared mobile component library',
        'Implement consistent touch target sizing',
        'Establish mobile-first design system guidelines'
      ],
    };
  }

  private parseAIInsights(response: string): {
    keyInsights: string[];
    implementationPlan: string[];
    financialUXRecommendations: string[];
    technicalPriorities: string[];
  } {
    const sections = response.split(/\d+\.|KEY INSIGHTS|IMPLEMENTATION PLAN|FINANCIAL UX|TECHNICAL PRIORITIES/i);
    
    return {
      keyInsights: this.extractListItems(sections[1] || ''),
      implementationPlan: this.extractListItems(sections[2] || ''),
      financialUXRecommendations: this.extractListItems(sections[3] || ''),
      technicalPriorities: this.extractListItems(sections[4] || ''),
    };
  }

  private extractListItems(text: string): string[] {
    return text.split('\n')
      .filter(line => line.trim().match(/^[-•*]|\d+\./))
      .map(line => line.replace(/^[-•*]\s*|\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 7); // Limit to 7 items max
  }

  private generateFallbackInsights(results: ClearPiggyAnalysisResult[]): {
    keyInsights: string[];
    implementationPlan: string[];
    financialUXRecommendations: string[];
    technicalPriorities: string[];
  } {
    return {
      keyInsights: [
        'Mobile optimization varies significantly across components',
        'Touch target compliance is the primary concern',
        'Responsive design implementation needs standardization',
        'Financial components require specialized mobile patterns',
      ],
      implementationPlan: [
        'Audit all interactive elements for touch target compliance',
        'Implement mobile-first responsive design patterns',
        'Create mobile-optimized navigation components',
        'Optimize transaction lists for mobile performance',
        'Standardize form patterns for financial inputs',
        'Add mobile-specific chart interactions',
        'Test across various mobile devices and screen sizes',
      ],
      financialUXRecommendations: [
        'Implement swipe gestures for transaction management',
        'Add pull-to-refresh for account data updates',
        'Create mobile-optimized data visualization',
        'Implement quick actions for common financial tasks',
      ],
      technicalPriorities: [
        'Fix critical touch target violations immediately',
        'Add responsive breakpoints to all components',
        'Implement mobile navigation patterns',
        'Optimize performance for mobile devices',
      ],
    };
  }

  private async saveReports(report: ClearPiggyProjectReport): Promise<void> {
    try {
      await fs.mkdir(this.config.outputPath, { recursive: true });
      
      const timestamp = new Date().toISOString().split('T')[0];
      const jsonPath = path.join(this.config.outputPath, `clear-piggy-mobile-analysis-${timestamp}.json`);
      const htmlPath = path.join(this.config.outputPath, `clear-piggy-mobile-analysis-${timestamp}.html`);
      
      // Save JSON report
      await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
      console.log(`📄 JSON report saved: ${jsonPath}`);

      // Generate and save HTML report
      const htmlReport = await this.reportGenerator.generateHTMLReport(report);
      await fs.writeFile(htmlPath, htmlReport);
      console.log(`📄 HTML report saved: ${htmlPath}`);

    } catch (error) {
      console.error('❌ Failed to save reports:', error);
    }
  }
}