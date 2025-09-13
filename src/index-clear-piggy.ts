#!/usr/bin/env node

/**
 * Clear Piggy Mobile Optimization CLI
 * Enhanced entry point for the specialized Clear Piggy mobile optimization agent
 */

import * as dotenv from 'dotenv';
import { ClearPiggyMobileAgent } from './agents/clear-piggy-mobile-agent';
import { ClearPiggyConfig } from './types/clear-piggy-types';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Clear Piggy specific configuration
const CLEAR_PIGGY_CONFIG: ClearPiggyConfig = {
  projectPath: process.env.CLEAR_PIGGY_PROJECT_PATH || '/Users/TREM/Downloads/clear-piggy-neo-main',
  componentsPath: process.env.CLEAR_PIGGY_COMPONENTS_PATH || 'src/components',
  mobileUIPath: process.env.CLEAR_PIGGY_MOBILE_UI_PATH || 'mobile-ui',
  outputPath: process.env.ANALYSIS_OUTPUT_DIR || './analysis-reports',
  
  // Analysis Configuration
  minTouchTargetSize: parseInt(process.env.MIN_TOUCH_TARGET_SIZE || '44'),
  mobileBreakpoint: parseInt(process.env.MOBILE_BREAKPOINT || '768'),
  tabletBreakpoint: parseInt(process.env.TABLET_BREAKPOINT || '1024'),
  desktopBreakpoint: parseInt(process.env.DESKTOP_BREAKPOINT || '1280'),
  
  // Feature Flags
  enableFramerMotionAnalysis: process.env.ENABLE_FRAMER_MOTION_ANALYSIS === 'true',
  enablePerformanceAnalysis: process.env.ENABLE_PERFORMANCE_ANALYSIS === 'true',
  enableAccessibilityDeepDive: process.env.ENABLE_ACCESSIBILITY_DEEP_DIVE === 'true',
  enableAIInsights: process.env.ENABLE_AI_INSIGHTS !== 'false', // Default true
  enableDesktopMobileComparison: process.env.ENABLE_DESKTOP_MOBILE_COMPARISON !== 'false',
  
  // Clear Piggy Financial Patterns
  financialComponentPatterns: [
    'transaction', 'budget', 'dashboard', 'account', 'balance', 'spending',
    'receipt', 'cash', 'flow', 'insight', 'ai', 'plaid', 'bank', 'chart',
    'form', 'upload', 'auth', 'onboard'
  ],
  
  priorityComponents: [
    'Dashboard', 'MobileDashboard', 'TransactionList', 'RecentTransactionsList',
    'AccountBalanceSummary', 'BudgetProgressCards', 'AIInsightsDashboard',
    'PlaidLink', 'ReceiptUpload', 'SmartReceiptTable'
  ],
  
  excludePatterns: [
    'test', 'spec', 'story', 'stories', '__tests__', 'node_modules'
  ],
  
  // Reporting
  generateHTMLReport: true,
  generatePDFReport: false,
  includeCodeSamples: true,
  includeScreenshots: false
};

async function main() {
  console.log('🚀 Clear Piggy Mobile Optimization Agent');
  console.log('=========================================');
  console.log('Specialized for Financial SaaS Mobile UX\n');

  try {
    // Validate environment
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is required');
      console.log('Please set your Anthropic API key in .env file');
      console.log('Get your API key from: https://console.anthropic.com/');
      process.exit(1);
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';

    // Create specialized Clear Piggy agent
    const agent = new ClearPiggyMobileAgent(CLEAR_PIGGY_CONFIG, {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.1,
      maxTokens: 8192,
    });

    console.log(`📁 Project Path: ${CLEAR_PIGGY_CONFIG.projectPath}`);
    console.log(`📱 Mobile UI Path: ${CLEAR_PIGGY_CONFIG.mobileUIPath}`);
    console.log(`📊 Output Directory: ${CLEAR_PIGGY_CONFIG.outputPath}\n`);

    // Execute command
    switch (command) {
      case 'analyze':
      case 'full':
        await runFullAnalysis(agent);
        break;

      case 'quick':
        await runQuickAssessment(agent);
        break;

      case 'financial':
        await runFinancialAnalysis(agent);
        break;

      case 'compare':
        await runDesktopMobileComparison(agent);
        break;

      case 'pattern':
        const pattern = args[1];
        if (!pattern) {
          console.error('❌ Pattern argument required');
          console.log('Usage: npm start pattern <search-pattern>');
          console.log('Examples:');
          console.log('  npm start pattern Dashboard');
          console.log('  npm start pattern Transaction');
          console.log('  npm start pattern Mobile');
          process.exit(1);
        }
        await runPatternAnalysis(agent, pattern);
        break;

      case 'component':
        const componentName = args[1];
        if (!componentName) {
          console.error('❌ Component name required');
          console.log('Usage: npm start component <component-name>');
          process.exit(1);
        }
        await runSingleComponentAnalysis(agent, componentName);
        break;

      case 'help':
        showHelp();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that your project path is correct');
    console.log('2. Ensure ANTHROPIC_API_KEY is set in .env');
    console.log('3. Verify components directory exists');
    console.log('4. Run with ENABLE_DETAILED_LOGGING=true for more info');
    process.exit(1);
  }
}

async function runFullAnalysis(agent: ClearPiggyMobileAgent) {
  console.log('🔍 Running comprehensive Clear Piggy mobile analysis...\n');
  
  const startTime = Date.now();
  const report = await agent.analyzeProject();
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n📊 Analysis Complete!');
  console.log('===================');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📱 Overall Mobile Score: ${report.executiveSummary.overallMobileScore}/100`);
  console.log(`🚨 Critical Issues: ${report.executiveSummary.criticalIssuesCount}`);
  console.log(`⚠️  High Priority Issues: ${report.executiveSummary.highPriorityIssuesCount}`);
  console.log(`📝 Components Needing Attention: ${report.executiveSummary.componentsNeedingAttention}/${report.metadata.totalComponentsAnalyzed}`);
  console.log(`⏳ Estimated Fix Time: ${report.executiveSummary.estimatedEffortHours} hours`);
  
  console.log('\n🎯 Top Issue Categories:');
  report.executiveSummary.topIssueCategories.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });

  console.log('\n🚀 Quick Wins (Easy Fixes):');
  report.executiveSummary.quickWins.forEach((win, index) => {
    console.log(`${index + 1}. ${win}`);
  });

  console.log('\n💰 Financial UX Insights:');
  console.log(`📋 Transaction Lists: ${report.financialUXInsights.transactionListFindings.componentsAnalyzed} components (avg: ${report.financialUXInsights.transactionListFindings.averageScore}/100)`);
  console.log(`📊 Dashboard Cards: ${report.financialUXInsights.dashboardFindings.componentsAnalyzed} components (avg: ${report.financialUXInsights.dashboardFindings.averageScore}/100)`);
  console.log(`📈 Budget Charts: ${report.financialUXInsights.chartFindings.componentsAnalyzed} components (avg: ${report.financialUXInsights.chartFindings.averageScore}/100)`);
  console.log(`📝 Forms: ${report.financialUXInsights.formFindings.componentsAnalyzed} components (avg: ${report.financialUXInsights.formFindings.averageScore}/100)`);

  console.log('\n🤖 AI Key Findings:');
  report.aiInsights.keyFindings.slice(0, 3).forEach((finding, index) => {
    console.log(`${index + 1}. ${finding}`);
  });

  console.log('\n📋 Implementation Roadmap:');
  console.log(`Phase 1 (${report.implementationRoadmap.phase1_Critical.duration}): ${report.implementationRoadmap.phase1_Critical.components.length} critical components`);
  console.log(`Phase 2 (${report.implementationRoadmap.phase2_HighPriority.duration}): ${report.implementationRoadmap.phase2_HighPriority.components.length} high priority components`);
  console.log(`Phase 3 (${report.implementationRoadmap.phase3_Optimization.duration}): ${report.implementationRoadmap.phase3_Optimization.components.length} optimization components`);

  console.log(`\n📄 Reports saved to: ${CLEAR_PIGGY_CONFIG.outputPath}/`);
  console.log('📝 Open the HTML report for detailed analysis and visual insights');
}

async function runQuickAssessment(agent: ClearPiggyMobileAgent) {
  console.log('⚡ Running Clear Piggy quick mobile assessment...\n');
  
  const assessment = await agent.quickMobileAssessment();
  
  console.log('📊 Quick Assessment Results:');
  console.log('==========================');
  console.log(`📱 Total Components: ${assessment.summary.totalComponents}`);
  console.log(`🚨 Critical Components: ${assessment.summary.criticalComponents}`);
  console.log(`⚠️  High Priority Components: ${assessment.summary.highPriorityComponents}`);
  console.log(`📊 Average Mobile Score: ${assessment.summary.averageMobileScore}/100`);
  
  console.log('\n🔥 Most Common Issues:');
  assessment.summary.topIssueTypes.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });

  console.log('\n🎯 Urgent Recommendations:');
  assessment.summary.urgentRecommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  if (assessment.criticalIssues.length > 0) {
    console.log('\n🚨 Critical Components:');
    assessment.criticalIssues.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.componentFile.name} (Score: ${result.overallMobileScore}/100)`);
      console.log(`   📱 Type: ${result.financialComponentType}`);
      console.log(`   🎯 Issues: ${result.touchTargetIssues.length} touch, ${result.tailwindResponsiveGaps.length} responsive, ${result.financialUXIssues.length} financial`);
    });
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Run full analysis: npm start analyze');
  console.log('2. Focus on financial components: npm start financial');
  console.log('3. Compare desktop vs mobile: npm start compare');
}

async function runFinancialAnalysis(agent: ClearPiggyMobileAgent) {
  console.log('💰 Analyzing Clear Piggy financial components...\n');
  
  const results = await agent.analyzeFinancialPatterns();
  
  console.log('📊 Financial Component Analysis:');
  console.log('===============================');

  console.log(`\n📋 Transaction Components (${results.transactionComponents.length}):`);
  results.transactionComponents.forEach((result, index) => {
    console.log(`${index + 1}. ${result.componentFile.name} - Score: ${result.overallMobileScore}/100`);
    console.log(`   💰 Financial UX: ${result.financialUXScore}/100`);
    console.log(`   📱 Touch Targets: ${result.touchTargetIssues.length} issues`);
    if (result.financialUXIssues.length > 0) {
      console.log(`   ⚠️  Key Issues: ${result.financialUXIssues.slice(0, 2).map(i => i.issue).join(', ')}`);
    }
  });

  console.log(`\n📊 Dashboard Components (${results.dashboardComponents.length}):`);
  results.dashboardComponents.forEach((result, index) => {
    console.log(`${index + 1}. ${result.componentFile.name} - Score: ${result.overallMobileScore}/100`);
    console.log(`   📐 Layout: ${result.layoutOptimizationScore}/100`);
    console.log(`   📱 Responsive: ${result.responsiveDesignScore}/100`);
  });

  console.log(`\n📈 Chart Components (${results.chartComponents.length}):`);
  results.chartComponents.forEach((result, index) => {
    console.log(`${index + 1}. ${result.componentFile.name} - Score: ${result.overallMobileScore}/100`);
    console.log(`   🎯 Touch Interactions: ${result.touchTargetScore}/100`);
    console.log(`   ⚡ Performance: ${result.performanceScore}/100`);
  });

  console.log(`\n📝 Form Components (${results.formComponents.length}):`);
  results.formComponents.forEach((result, index) => {
    console.log(`${index + 1}. ${result.componentFile.name} - Score: ${result.overallMobileScore}/100`);
    console.log(`   ♿ Accessibility: ${result.accessibilityScore}/100`);
    console.log(`   📱 Mobile UX: ${result.financialUXScore}/100`);
  });

  console.log('\n💡 Financial UX Recommendations by Type:');
  Object.entries(results.financialRecommendations).forEach(([type, recommendations]) => {
    if (recommendations.length > 0) {
      console.log(`\n${type.toUpperCase()}:`);
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  });
}

async function runDesktopMobileComparison(agent: ClearPiggyMobileAgent) {
  console.log('🔄 Comparing Clear Piggy desktop vs mobile implementations...\n');
  
  const comparison = await agent.compareDesktopMobile();
  
  console.log('📊 Desktop vs Mobile Comparison:');
  console.log('===============================');
  console.log(`📱 Mobile Optimization Gap: ${comparison.overallComparison.mobileOptimizationGap} points`);
  console.log(`🎯 Consistency Score: ${comparison.overallComparison.consistencyScore}/100`);
  console.log(`🔄 Components Compared: ${comparison.componentComparisons.length}`);

  console.log('\n📋 Component Comparisons:');
  comparison.componentComparisons.slice(0, 10).forEach((comp, index) => {
    console.log(`\n${index + 1}. ${comp.componentName}`);
    if (comp.desktopVersion && comp.mobileVersion) {
      const scoreDiff = comp.mobileVersion.overallMobileScore - comp.desktopVersion.overallMobileScore;
      console.log(`   📊 Desktop: ${comp.desktopVersion.overallMobileScore}/100 | Mobile: ${comp.mobileVersion.overallMobileScore}/100 (${scoreDiff > 0 ? '+' : ''}${scoreDiff})`);
    } else if (comp.desktopVersion && !comp.mobileVersion) {
      console.log(`   📱 No mobile variant found (Desktop: ${comp.desktopVersion.overallMobileScore}/100)`);
    } else if (comp.mobileVersion && !comp.desktopVersion) {
      console.log(`   📱 Mobile-first component (Score: ${comp.mobileVersion.overallMobileScore}/100)`);
    }
    
    if (comp.comparisonInsights.length > 0) {
      console.log(`   💡 ${comp.comparisonInsights[0]}`);
    }
  });

  console.log('\n🎯 Overall Recommendations:');
  comparison.overallComparison.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}

async function runPatternAnalysis(agent: ClearPiggyMobileAgent, pattern: string) {
  console.log(`🔍 Analyzing Clear Piggy components matching: "${pattern}"\n`);
  
  // Use the file reader to find matching components
  const fileReader = (agent as any).fileReader;
  const components = await fileReader.findComponentsByPattern(pattern);
  
  if (components.length === 0) {
    console.log(`❌ No components found matching pattern: "${pattern}"`);
    console.log('\n💡 Try these patterns:');
    console.log('• Dashboard - for dashboard components');
    console.log('• Transaction - for transaction-related components');
    console.log('• Mobile - for mobile-specific components');
    console.log('• Budget - for budget and spending components');
    console.log('• Receipt - for receipt processing components');
    return;
  }

  console.log(`📊 Found ${components.length} components matching "${pattern}":`);
  
  const analyzer = (agent as any).analyzer;
  const results = [];
  
  for (const component of components) {
    console.log(`📄 Analyzing: ${component.name}...`);
    const result = await analyzer.analyzeComponent(component);
    results.push(result);
  }

  console.log('\n📊 Pattern Analysis Results:');
  console.log('===========================');
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.componentFile.name}`);
    console.log(`   📁 Path: ${result.componentFile.path}`);
    console.log(`   📱 Overall Score: ${result.overallMobileScore}/100`);
    console.log(`   🎯 Priority: ${result.priority}`);
    console.log(`   💰 Type: ${result.financialComponentType}`);
    
    const issues = [
      `${result.touchTargetIssues.length} touch target`,
      `${result.tailwindResponsiveGaps.length} responsive`,
      `${result.navigationIssues.length} navigation`,
      `${result.financialUXIssues.length} financial UX`
    ].filter(issue => !issue.startsWith('0'));
    
    if (issues.length > 0) {
      console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
    }
    
    if (result.immediateActions.length > 0) {
      console.log(`   🚀 Immediate: ${result.immediateActions[0]}`);
    }
  });

  // Summary statistics
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.overallMobileScore, 0) / results.length);
  const criticalCount = results.filter(r => r.priority === 'critical').length;
  const highCount = results.filter(r => r.priority === 'high').length;

  console.log('\n📈 Pattern Summary:');
  console.log(`📊 Average Score: ${averageScore}/100`);
  console.log(`🚨 Critical Priority: ${criticalCount}`);
  console.log(`⚠️  High Priority: ${highCount}`);
}

async function runSingleComponentAnalysis(agent: ClearPiggyMobileAgent, componentName: string) {
  console.log(`🔍 Analyzing single component: "${componentName}"\n`);
  
  const fileReader = (agent as any).fileReader;
  const components = await fileReader.findComponentsByPattern(componentName);
  
  const exactMatch = components.find(c => c.name === componentName || c.name === `${componentName}.tsx`);
  const component = exactMatch || components[0];
  
  if (!component) {
    console.log(`❌ Component "${componentName}" not found`);
    return;
  }

  console.log(`📄 Found: ${component.name}`);
  console.log(`📁 Path: ${component.path}`);
  console.log(`📏 Size: ${Math.round(component.size / 1024)}KB`);
  console.log(`📅 Modified: ${component.lastModified.toLocaleDateString()}\n`);

  const analyzer = (agent as any).analyzer;
  const result = await analyzer.analyzeComponent(component);

  console.log('📊 Detailed Analysis Results:');
  console.log('============================');
  console.log(`📱 Overall Mobile Score: ${result.overallMobileScore}/100`);
  console.log(`🎯 Priority: ${result.priority}`);
  console.log(`💰 Financial Component Type: ${result.financialComponentType}`);

  console.log('\n📐 Score Breakdown:');
  console.log(`🎯 Touch Targets: ${result.touchTargetScore}/100`);
  console.log(`📱 Responsive Design: ${result.responsiveDesignScore}/100`);
  console.log(`📐 Layout Optimization: ${result.layoutOptimizationScore}/100`);
  console.log(`🧭 Navigation: ${result.navigationScore}/100`);
  console.log(`💰 Financial UX: ${result.financialUXScore}/100`);
  console.log(`♿ Accessibility: ${result.accessibilityScore}/100`);
  console.log(`⚡ Performance: ${result.performanceScore}/100`);

  if (result.touchTargetIssues.length > 0) {
    console.log('\n🎯 Touch Target Issues:');
    result.touchTargetIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.elementType} (Line ${issue.lineNumber}) - ${issue.severity}`);
      console.log(`   💡 ${issue.suggestedFix}`);
    });
  }

  if (result.tailwindResponsiveGaps.length > 0) {
    console.log('\n📱 Responsive Design Gaps:');
    result.tailwindResponsiveGaps.slice(0, 5).forEach((gap, index) => {
      console.log(`${index + 1}. ${gap.issue} (Line ${gap.lineNumber})`);
      console.log(`   💡 Suggested: ${gap.suggestedClasses.join(', ')}`);
    });
  }

  if (result.financialUXIssues.length > 0) {
    console.log('\n💰 Financial UX Issues:');
    result.financialUXIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issue} (${issue.priority})`);
      console.log(`   📱 Mobile Impact: ${issue.mobileSpecificImpact}`);
      console.log(`   💡 Recommendation: ${issue.recommendation}`);
    });
  }

  console.log('\n🚀 Action Items:');
  console.log('\nImmediate Actions:');
  result.immediateActions.forEach((action, index) => {
    console.log(`${index + 1}. ${action}`);
  });

  if (result.shortTermImprovements.length > 0) {
    console.log('\nShort-term Improvements:');
    result.shortTermImprovements.forEach((improvement, index) => {
      console.log(`${index + 1}. ${improvement}`);
    });
  }

  if (result.longTermOptimizations.length > 0) {
    console.log('\nLong-term Optimizations:');
    result.longTermOptimizations.forEach((optimization, index) => {
      console.log(`${index + 1}. ${optimization}`);
    });
  }
}

function showHelp() {
  console.log(`
🚀 Clear Piggy Mobile Optimization Agent
=========================================

Specialized Mastra AI agent for analyzing React/TypeScript financial SaaS components
for mobile optimization opportunities.

Commands:
  analyze, full    Complete mobile optimization analysis
  quick           Quick assessment of critical mobile issues  
  financial       Focus analysis on financial component patterns
  compare         Compare desktop vs mobile implementations
  pattern <name>  Analyze components matching a pattern
  component <name> Detailed analysis of a single component
  help           Show this help message

Examples:
  npm start analyze                    # Full comprehensive analysis
  npm start quick                      # Quick critical issues check
  npm start financial                  # Financial components focus
  npm start compare                    # Desktop vs mobile comparison
  npm start pattern Dashboard         # All dashboard components
  npm start pattern Transaction       # Transaction-related components
  npm start pattern Mobile           # Mobile-specific components
  npm start component MobileDashboard # Single component deep dive

Configuration:
  Set environment variables in .env file:
  - ANTHROPIC_API_KEY (required)
  - CLEAR_PIGGY_PROJECT_PATH (your project location)
  - CLEAR_PIGGY_MOBILE_UI_PATH (mobile components directory)
  - ANALYSIS_OUTPUT_DIR (report output location)

Features:
  ✅ Touch target compliance (44px minimum)
  ✅ Tailwind CSS responsive design analysis  
  ✅ Financial UX pattern validation
  ✅ Layout complexity assessment
  ✅ Navigation pattern checking
  ✅ Accessibility compliance
  ✅ Performance optimization
  ✅ AI-powered insights and recommendations
  ✅ Beautiful HTML reports with visualizations

Stack Support:
  ✅ React 18+ with TypeScript
  ✅ Tailwind CSS + Framer Motion
  ✅ Supabase + Plaid integration patterns
  ✅ Financial SaaS specific optimizations

For more information: https://github.com/clear-piggy/mobile-optimizer
  `);
}

// Run the CLI
if (require.main === module) {
  main();
}

export { ClearPiggyMobileAgent };
export * from './types/clear-piggy-types';
export * from './analyzers/clear-piggy-analyzer';
export * from './reports/clear-piggy-reports';