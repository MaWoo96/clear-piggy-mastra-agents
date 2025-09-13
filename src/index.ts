#!/usr/bin/env node

/**
 * Clear Piggy Mobile Optimization CLI
 * Main entry point for the mobile optimization analysis tool
 */

import * as dotenv from 'dotenv';
import { ClearPiggyMobileOptimizationAgent } from './agents/mobile-optimization-agent';
import { AnalysisConfig } from './types/analysis';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Default configuration
const DEFAULT_CONFIG: AnalysisConfig = {
  projectPath: process.env.CLEAR_PIGGY_PROJECT_PATH || './clear-piggy-project',
  componentsPath: process.env.CLEAR_PIGGY_COMPONENTS_PATH || 'src/components',
  outputPath: process.env.ANALYSIS_OUTPUT_DIR || './analysis-reports',
  includeTests: false,
  minTouchTargetSize: parseInt(process.env.MIN_TOUCH_TARGET_SIZE || '44'),
  mobileBreakpoint: parseInt(process.env.MOBILE_BREAKPOINT || '768'),
  tabletBreakpoint: parseInt(process.env.TABLET_BREAKPOINT || '1024'),
  enableFramerMotionAnalysis: true,
  enableSupabaseIntegrationCheck: true,
  enablePlaidIntegrationCheck: true,
};

async function main() {
  console.log('🚀 Clear Piggy Mobile Optimization Tool');
  console.log('=====================================');

  try {
    // Validate environment
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is required');
      console.log('Please set your Anthropic API key in .env file');
      process.exit(1);
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';

    // Create agent with configuration
    const agent = new ClearPiggyMobileOptimizationAgent(DEFAULT_CONFIG, {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.1,
      maxTokens: 8192,
    });

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

      case 'pattern':
        const pattern = args[1];
        if (!pattern) {
          console.error('❌ Pattern argument required for pattern analysis');
          console.log('Usage: npm start pattern <search-pattern>');
          process.exit(1);
        }
        await runPatternAnalysis(agent, pattern);
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
    process.exit(1);
  }
}

async function runFullAnalysis(agent: ClearPiggyMobileOptimizationAgent) {
  console.log('🔍 Running full mobile optimization analysis...\n');
  
  const report = await agent.analyzeProject();
  
  console.log('\n📊 Analysis Results:');
  console.log(`Overall Mobile Score: ${report.summary.overallMobileScore}/100`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`High Priority Issues: ${report.summary.highPriorityIssues}`);
  console.log(`Components Needing Work: ${report.summary.componentsNeedingWork}/${report.projectInfo.analyzedComponents}`);
  
  console.log('\n🎯 Top Issue Categories:');
  report.summary.topIssueCategories.forEach(category => {
    console.log(`• ${category}`);
  });

  console.log('\n🚨 Immediate Actions Required:');
  report.recommendations.immediate.forEach(action => {
    console.log(`• ${action}`);
  });

  // Generate AI insights
  console.log('\n🤖 Generating AI-powered insights...');
  try {
    const insights = await agent.generateAIInsights(report.componentResults);
    
    console.log('\n💡 Key Insights:');
    insights.insights.forEach(insight => {
      console.log(`• ${insight}`);
    });

    console.log('\n⚡ Implementation Plan:');
    insights.implementationPlan.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
  } catch (error) {
    console.warn('⚠️ Could not generate AI insights:', error);
  }
}

async function runQuickAssessment(agent: ClearPiggyMobileOptimizationAgent) {
  console.log('⚡ Running quick mobile assessment...\n');
  
  const assessment = await agent.quickMobileAssessment();
  
  console.log('📊 Quick Assessment Results:');
  console.log(`Total Components: ${assessment.summary.totalComponents}`);
  console.log(`Critical Components: ${assessment.summary.criticalComponents}`);
  
  console.log('\n🚨 Most Common Issues:');
  assessment.summary.commonIssues.forEach(issue => {
    console.log(`• ${issue}`);
  });

  console.log('\n🎯 Recommended Actions:');
  assessment.summary.recommendedActions.forEach(action => {
    console.log(`• ${action}`);
  });

  if (assessment.criticalIssues.length > 0) {
    console.log('\n🔥 Critical Components:');
    assessment.criticalIssues.slice(0, 5).forEach(result => {
      console.log(`• ${result.file.name} (Score: ${result.overallScore}/100)`);
    });
  }
}

async function runFinancialAnalysis(agent: ClearPiggyMobileOptimizationAgent) {
  console.log('💰 Analyzing financial components...\n');
  
  const results = await agent.analyzeFinancialComponents();
  
  console.log(`📊 Analyzed ${results.length} financial components:`);
  
  results.forEach(result => {
    console.log(`\n📈 ${result.file.name}`);
    console.log(`  Type: ${result.financialAnalysis.componentType}`);
    console.log(`  Overall Score: ${result.overallScore}/100`);
    console.log(`  Financial UX Score: ${result.financialAnalysis.financialUXScore}/100`);
    console.log(`  Mobile Optimized: ${result.financialAnalysis.mobileOptimized ? '✅' : '❌'}`);
    
    if (result.financialAnalysis.specificIssues.length > 0) {
      console.log('  Issues:');
      result.financialAnalysis.specificIssues.forEach(issue => {
        console.log(`    • ${issue}`);
      });
    }
  });

  // Summary
  const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  const optimizedCount = results.filter(r => r.financialAnalysis.mobileOptimized).length;
  
  console.log(`\n📊 Financial Components Summary:`);
  console.log(`Average Score: ${averageScore.toFixed(1)}/100`);
  console.log(`Mobile Optimized: ${optimizedCount}/${results.length} (${((optimizedCount/results.length)*100).toFixed(1)}%)`);
}

async function runPatternAnalysis(agent: ClearPiggyMobileOptimizationAgent, pattern: string) {
  console.log(`🔍 Analyzing components matching pattern: "${pattern}"\n`);
  
  const results = await agent.analyzeComponentsByPattern(pattern);
  
  if (results.length === 0) {
    console.log(`❌ No components found matching pattern: "${pattern}"`);
    return;
  }

  console.log(`📊 Found ${results.length} components matching pattern:`);
  
  results.forEach(result => {
    console.log(`\n📄 ${result.file.name}`);
    console.log(`  Path: ${result.file.path}`);
    console.log(`  Score: ${result.overallScore}/100`);
    console.log(`  Priority: ${result.priority}`);
    
    // Show key issues
    const touchIssues = result.touchTargetAnalysis.issues.length;
    const respGaps = result.tailwindAnalysis.responsivenessGaps.length;
    const navIssues = result.navigationAnalysis.issues.length;
    
    if (touchIssues > 0) console.log(`  Touch Target Issues: ${touchIssues}`);
    if (respGaps > 0) console.log(`  Responsive Gaps: ${respGaps}`);
    if (navIssues > 0) console.log(`  Navigation Issues: ${navIssues}`);
  });
}

function showHelp() {
  console.log(`
Clear Piggy Mobile Optimization Tool

Commands:
  analyze, full    Run complete mobile optimization analysis
  quick           Run quick assessment of critical issues
  financial       Focus analysis on financial components
  pattern <name>  Analyze components matching a pattern
  help           Show this help message

Examples:
  npm start analyze          # Full analysis
  npm start quick           # Quick assessment
  npm start financial       # Financial components only
  npm start pattern Button  # Analyze all Button components

Configuration:
  Set environment variables in .env file:
  - ANTHROPIC_API_KEY (required)
  - CLEAR_PIGGY_PROJECT_PATH
  - ANALYSIS_OUTPUT_DIR
  - MIN_TOUCH_TARGET_SIZE
  
For more information, see README.md
  `);
}

// Run the CLI
if (require.main === module) {
  main();
}

export { ClearPiggyMobileOptimizationAgent };
export * from './types/analysis';
export * from './utils/file-reader';
export * from './analyzers/mobile-optimizer';