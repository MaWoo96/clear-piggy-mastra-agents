#!/usr/bin/env node

/**
 * Clear Piggy Mobile Component Generator CLI
 * Mastra AI agent for generating mobile-optimized React components
 */

import * as dotenv from 'dotenv';
import { ClearPiggyComponentGeneratorAgent } from './agents/component-generator-agent';
import { ComponentGenerationConfig } from './types/component-generation-types';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Component generation configuration
const GENERATION_CONFIG: ComponentGenerationConfig = {
  projectPath: process.env.CLEAR_PIGGY_PROJECT_PATH || '/Users/TREM/Downloads/clear-piggy-neo-main',
  outputPath: process.env.GENERATION_OUTPUT_PATH || './generated-mobile-components',
  componentsPath: process.env.CLEAR_PIGGY_COMPONENTS_PATH || 'src/components',
  storybookPath: process.env.STORYBOOK_PATH || '.storybook',
  
  // Feature flags
  enableStorybook: process.env.ENABLE_STORYBOOK !== 'false',
  enableTypescriptInterfaces: process.env.ENABLE_TYPESCRIPT_INTERFACES !== 'false',
  enableSupabaseIntegration: process.env.ENABLE_SUPABASE_INTEGRATION !== 'false',
  
  // Target frameworks
  targetFrameworks: {
    tailwindcss: true,
    framerMotion: true,
    recharts: true,
    reactQuery: true,
  },
  
  // Accessibility settings
  accessibility: {
    wcagLevel: 'AA',
    enableAriaLabels: true,
    enableKeyboardNavigation: true,
  },
};

async function main() {
  console.log('🎨 Clear Piggy Mobile Component Generator');
  console.log('========================================');
  console.log('AI-powered mobile-first React component generation\n');

  try {
    // Validate environment
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is required');
      console.log('Please set your Anthropic API key in .env file');
      process.exit(1);
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'generate';

    // Create component generator agent
    const agent = new ClearPiggyComponentGeneratorAgent(GENERATION_CONFIG, {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.2, // Slightly higher for creative component generation
      maxTokens: 8192,
    });

    console.log(`📁 Source: ${GENERATION_CONFIG.projectPath}`);
    console.log(`📱 Output: ${GENERATION_CONFIG.outputPath}`);
    console.log(`📚 Storybook: ${GENERATION_CONFIG.enableStorybook ? '✅' : '❌'}`);
    console.log(`🔷 TypeScript: ${GENERATION_CONFIG.enableTypescriptInterfaces ? '✅' : '❌'}`);
    console.log(`🗄️  Supabase: ${GENERATION_CONFIG.enableSupabaseIntegration ? '✅' : '❌'}\n`);

    // Execute command
    switch (command) {
      case 'generate':
      case 'all':
        await runFullGeneration(agent, args.slice(1));
        break;

      case 'component':
        const componentName = args[1];
        if (!componentName) {
          console.error('❌ Component name required');
          console.log('Usage: npm run generate component <ComponentName>');
          process.exit(1);
        }
        await runSingleComponentGeneration(agent, componentName);
        break;

      case 'pattern':
        const pattern = args[1] as any;
        if (!pattern) {
          console.error('❌ Pattern name required');
          console.log('Available patterns: transaction-list, budget-card, dashboard-metrics, navigation-bar, chart-component');
          process.exit(1);
        }
        await runPatternGeneration(agent, pattern);
        break;

      case 'list':
        await listAvailableComponents(agent);
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
    console.error('❌ Generation failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that your project path is correct');
    console.log('2. Ensure ANTHROPIC_API_KEY is set in .env');
    console.log('3. Verify source components exist and are valid React components');
    process.exit(1);
  }
}

async function runFullGeneration(agent: ClearPiggyComponentGeneratorAgent, componentNames?: string[]) {
  console.log('🚀 Generating mobile components from desktop versions...\n');
  
  const startTime = Date.now();
  const result = await agent.generateMobileComponents(componentNames);
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n🎉 Generation Complete!');
  console.log('======================');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Successful: ${result.summary.successfulGenerations}`);
  console.log(`❌ Failed: ${result.summary.failedGenerations}`);
  console.log(`📱 Mobile optimizations: ${result.summary.optimizationsApplied}`);
  console.log(`♿ Accessibility features: ${result.summary.accessibilityFeatures}`);

  if (result.componentsGenerated.length > 0) {
    console.log('\n📦 Generated Components:');
    result.componentsGenerated.forEach(component => {
      console.log(`✨ ${component.componentName}`);
      console.log(`   📄 Component: ${component.filePath}`);
      if (component.interfaceCode) {
        console.log(`   🔷 Interfaces: ${component.filePath.replace('.tsx', 'Types.ts').replace('/components/', '/types/')}`);
      }
      if (component.storybookCode) {
        console.log(`   📚 Story: ${component.filePath.replace('.tsx', '.stories.tsx').replace('/components/', '/stories/')}`);
      }
      console.log(`   📖 Docs: ${component.filePath.replace('.tsx', '.md').replace('/components/', '/docs/')}`);
    });

    console.log('\n🎯 Key Mobile Optimizations Applied:');
    const uniqueOptimizations = new Set<string>();
    result.componentsGenerated.forEach(component => {
      component.mobileOptimizations.forEach(opt => {
        uniqueOptimizations.add(opt.description);
      });
    });
    
    Array.from(uniqueOptimizations).slice(0, 8).forEach(opt => {
      console.log(`📱 ${opt}`);
    });

    console.log('\n♿ Accessibility Features:');
    const uniqueAccessibilityFeatures = new Set<string>();
    result.componentsGenerated.forEach(component => {
      component.accessibilityFeatures.forEach(feature => {
        uniqueAccessibilityFeatures.add(feature.feature);
      });
    });

    Array.from(uniqueAccessibilityFeatures).slice(0, 5).forEach(feature => {
      console.log(`♿ ${feature}`);
    });
  }

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.forEach(error => {
      console.log(`❌ ${error.componentName}: ${error.error}`);
      console.log(`   💡 ${error.suggestion}`);
    });
  }

  console.log(`\n📁 Output directory: ${GENERATION_CONFIG.outputPath}`);
  console.log('🚀 Ready to integrate into your Clear Piggy mobile app!');
}

async function runSingleComponentGeneration(agent: ClearPiggyComponentGeneratorAgent, componentName: string) {
  console.log(`🎨 Generating mobile version of: ${componentName}\n`);
  
  const result = await agent.generateMobileComponents([componentName]);
  
  if (result.componentsGenerated.length === 0) {
    console.log(`❌ Component "${componentName}" not found or failed to generate`);
    if (result.errors.length > 0) {
      console.log(`Error: ${result.errors[0].error}`);
      console.log(`Suggestion: ${result.errors[0].suggestion}`);
    }
    return;
  }

  const component = result.componentsGenerated[0];
  
  console.log('✅ Generation Successful!');
  console.log('========================');
  console.log(`📱 Mobile Component: ${component.componentName}`);
  console.log(`📄 File: ${component.filePath}`);
  console.log(`📏 Size: ${Math.round(component.componentCode.length / 1024)}KB`);

  console.log('\n🎯 Mobile Optimizations:');
  component.mobileOptimizations.forEach((opt, index) => {
    console.log(`${index + 1}. ${opt.description}`);
    console.log(`   💡 ${opt.benefit}`);
  });

  console.log('\n♿ Accessibility Features:');
  component.accessibilityFeatures.forEach((feature, index) => {
    console.log(`${index + 1}. ${feature.feature}`);
    console.log(`   🎯 ${feature.wcagCriterion}`);
  });

  console.log(`\n📖 Documentation: ${component.filePath.replace('.tsx', '.md').replace('/components/', '/docs/')}`);
  
  if (component.interfaceCode) {
    console.log(`🔷 TypeScript Interfaces: ${component.filePath.replace('.tsx', 'Types.ts').replace('/components/', '/types/')}`);
  }
  
  if (component.storybookCode) {
    console.log(`📚 Storybook Story: ${component.filePath.replace('.tsx', '.stories.tsx').replace('/components/', '/stories/')}`);
  }
}

async function runPatternGeneration(agent: ClearPiggyComponentGeneratorAgent, pattern: string) {
  console.log(`🎨 Generating components matching pattern: ${pattern}\n`);
  
  // This would need to be implemented in the agent to filter by detected pattern
  console.log('Pattern-based generation not yet implemented');
  console.log('Available patterns:');
  console.log('• transaction-list - Transaction and history components');
  console.log('• budget-card - Budget and spending components');
  console.log('• dashboard-metrics - Dashboard and metrics components');
  console.log('• navigation-bar - Navigation and menu components');
  console.log('• chart-component - Chart and visualization components');
}

async function listAvailableComponents(agent: ClearPiggyComponentGeneratorAgent) {
  console.log('📋 Scanning Clear Piggy components for mobile generation...\n');
  
  // Use the file reader to discover components
  const fileReader = (agent as any).fileReader;
  const components = await fileReader.readAllComponents();
  
  if (components.length === 0) {
    console.log('❌ No React components found in the specified directory');
    console.log(`Check: ${GENERATION_CONFIG.projectPath}/${GENERATION_CONFIG.componentsPath}`);
    return;
  }

  console.log(`📦 Found ${components.length} components available for mobile generation:\n`);
  
  // Group by likely patterns
  const patterns = {
    'Transaction & Finance': [] as any[],
    'Dashboard & Metrics': [] as any[],
    'Navigation & Layout': [] as any[],
    'Charts & Visualization': [] as any[],
    'Forms & Input': [] as any[],
    'Other': [] as any[]
  };

  components.forEach((component: any) => {
    const name = component.name.toLowerCase();
    const content = component.content.toLowerCase();
    
    if (name.includes('transaction') || name.includes('receipt') || name.includes('budget')) {
      patterns['Transaction & Finance'].push(component);
    } else if (name.includes('dashboard') || name.includes('metric') || name.includes('summary')) {
      patterns['Dashboard & Metrics'].push(component);
    } else if (name.includes('nav') || name.includes('header') || name.includes('menu')) {
      patterns['Navigation & Layout'].push(component);
    } else if (name.includes('chart') || name.includes('graph') || content.includes('recharts')) {
      patterns['Charts & Visualization'].push(component);
    } else if (name.includes('form') || name.includes('input') || name.includes('upload')) {
      patterns['Forms & Input'].push(component);
    } else {
      patterns['Other'].push(component);
    }
  });

  Object.entries(patterns).forEach(([category, comps]) => {
    if (comps.length > 0) {
      console.log(`📁 ${category}:`);
      comps.forEach(comp => {
        const size = Math.round(comp.size / 1024);
        const modified = comp.lastModified.toLocaleDateString();
        console.log(`   📄 ${comp.name} (${size}KB, modified ${modified})`);
      });
      console.log('');
    }
  });

  console.log('🚀 Generate mobile versions with:');
  console.log('   npm run generate component <ComponentName>');
  console.log('   npm run generate all');
}

function showHelp() {
  console.log(`
🎨 Clear Piggy Mobile Component Generator
========================================

AI-powered tool for generating mobile-optimized React components from desktop versions.

Commands:
  generate [components...]   Generate mobile versions of specified components (or all)
  component <name>          Generate single mobile component
  pattern <pattern>         Generate components matching pattern
  list                      List available components for generation
  help                      Show this help message

Examples:
  npm run generate                           # Generate all components
  npm run generate Dashboard TransactionList # Generate specific components
  npm run generate component MobileDashboard # Generate single component
  npm run generate pattern transaction-list  # Generate transaction components
  npm run generate list                      # List available components

Features:
  ✅ Mobile-first responsive design with Tailwind CSS
  ✅ Touch-friendly interactions (44px minimum targets)
  ✅ Framer Motion animations for smooth UX
  ✅ WCAG 2.1 AA accessibility compliance
  ✅ TypeScript interfaces and proper typing
  ✅ Storybook stories for testing
  ✅ Supabase integration patterns
  ✅ Financial SaaS UX best practices
  ✅ Error handling and loading states

Output Structure:
  generated-mobile-components/
  ├── components/           # Generated React components
  ├── types/               # TypeScript interfaces
  ├── stories/             # Storybook stories
  └── docs/                # Component documentation

Configuration:
  Set environment variables in .env file:
  - ANTHROPIC_API_KEY (required)
  - CLEAR_PIGGY_PROJECT_PATH (source project location)
  - GENERATION_OUTPUT_PATH (output directory)
  - ENABLE_STORYBOOK (true/false)
  - ENABLE_TYPESCRIPT_INTERFACES (true/false)
  - ENABLE_SUPABASE_INTEGRATION (true/false)

Supported Component Patterns:
  📱 transaction-list      - Transaction lists with virtual scrolling
  📊 budget-card          - Collapsible budget cards with progress
  📈 dashboard-metrics    - Responsive dashboard metrics grid
  🧭 navigation-bar       - Mobile-first navigation with hamburger menu
  📊 chart-component      - Touch-friendly charts with gestures
  📝 form-financial       - Financial forms with proper input types
  📄 receipt-upload       - Mobile receipt capture and upload
  💳 account-summary      - Account balances and summaries

For more information: https://github.com/clear-piggy/mobile-optimizer
  `);
}

// Run the CLI
if (require.main === module) {
  main();
}

export { ClearPiggyComponentGeneratorAgent };
export * from './types/component-generation-types';
export * from './agents/component-generator-agent';
export * from './utils/supabase-patterns';