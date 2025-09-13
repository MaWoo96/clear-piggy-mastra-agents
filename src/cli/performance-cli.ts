#!/usr/bin/env node

/**
 * CLI interface for Clear Piggy Performance Optimization Agent
 * Provides command-line access to performance optimization features
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import path from 'path';
import { ClearPiggyPerformanceAgent } from '../agents/performance-optimization-agent.js';
import { PerformanceOptimizationConfig } from '../types/performance-optimization-types.js';

const program = new Command();

// CLI configuration
program
  .name('clear-piggy-optimize')
  .description('Performance optimization tool for Clear Piggy Mobile')
  .version('1.0.0');

// Default configuration
const getDefaultConfig = (): PerformanceOptimizationConfig => ({
  projectPath: process.cwd(),
  outputPath: './optimization-output',
  analysis: {
    enableBundleAnalysis: true,
    enableImageOptimization: true,
    enableComponentAnalysis: true,
    enableServiceWorkerSetup: true,
    enablePWASetup: true,
    enablePerformanceMonitoring: true,
    customMetrics: [],
    thresholds: {
      bundleSize: 250000, // 250KB
      imageSize: 100000,  // 100KB
      componentRenderTime: 16, // 16ms for 60fps
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100,
      timeToFirstByte: 800
    }
  },
  optimization: {
    bundleOptimization: {
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enableMinification: true,
      enableCompression: true,
      chunkStrategy: 'async-imports'
    },
    imageOptimization: {
      enableWebP: true,
      enableAVIF: true,
      enableResponsiveImages: true,
      enableLazyLoading: true,
      quality: 85,
      formats: ['webp', 'avif', 'jpg'],
      sizes: [320, 640, 1024, 1920]
    },
    componentOptimization: {
      enableMemoization: true,
      enableLazyLoading: true,
      enableVirtualization: true,
      enableCodeSplitting: true
    },
    serviceWorker: {
      enableCaching: true,
      enableBackgroundSync: true,
      enablePushNotifications: true,
      cacheStrategy: 'stale-while-revalidate',
      cacheDuration: 86400000 // 24 hours
    },
    pwa: {
      enableManifest: true,
      enableInstallPrompt: true,
      enableSplashScreens: true,
      enableShortcuts: true
    }
  },
  mobile: {
    minTouchTargetSize: 44,
    breakpoints: {
      mobile: 768,
      tablet: 1024
    },
    enableTouchOptimizations: true,
    enableAccessibilityOptimizations: true
  }
});

// Optimize command
program
  .command('optimize')
  .description('Run complete performance optimization')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <path>', 'Output directory path')
  .option('--bundle', 'Enable bundle optimization only')
  .option('--images', 'Enable image optimization only')
  .option('--components', 'Enable component optimization only')
  .option('--service-worker', 'Enable service worker setup only')
  .option('--pwa', 'Enable PWA setup only')
  .option('--monitoring', 'Enable performance monitoring setup only')
  .option('--interactive', 'Run in interactive mode')
  .action(async (options) => {
    try {
      let config = getDefaultConfig();

      // Load custom config if provided
      if (options.config) {
        try {
          const configPath = path.resolve(options.config);
          const customConfig = await import(configPath);
          config = { ...config, ...customConfig.default || customConfig };
        } catch (error) {
          console.error(chalk.red(`Failed to load config file: ${error}`));
          process.exit(1);
        }
      }

      // Override output path if provided
      if (options.output) {
        config.outputPath = options.output;
      }

      // Interactive mode
      if (options.interactive) {
        config = await runInteractiveMode(config);
      }

      // Selective optimization based on flags
      if (options.bundle || options.images || options.components || 
          options.serviceWorker || options.pwa || options.monitoring) {
        config.analysis = {
          ...config.analysis,
          enableBundleAnalysis: !!options.bundle,
          enableImageOptimization: !!options.images,
          enableComponentAnalysis: !!options.components,
          enableServiceWorkerSetup: !!options.serviceWorker,
          enablePWASetup: !!options.pwa,
          enablePerformanceMonitoring: !!options.monitoring
        };
      }

      // Initialize and run optimization
      console.log(chalk.blue('🚀 Starting Clear Piggy Performance Optimization...\n'));
      
      const spinner = ora('Initializing performance agent...').start();
      const agent = new ClearPiggyPerformanceAgent(config);
      spinner.succeed('Performance agent initialized');

      const result = await agent.optimizePerformance();

      // Display results
      displayResults(result);

    } catch (error) {
      console.error(chalk.red(`Optimization failed: ${error}`));
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze current performance without optimization')
  .option('-c, --config <path>', 'Configuration file path')
  .option('--bundle', 'Analyze bundle only')
  .option('--images', 'Analyze images only')
  .option('--components', 'Analyze components only')
  .action(async (options) => {
    try {
      let config = getDefaultConfig();

      if (options.config) {
        const configPath = path.resolve(options.config);
        const customConfig = await import(configPath);
        config = { ...config, ...customConfig.default || customConfig };
      }

      const spinner = ora('Analyzing project performance...').start();
      const agent = new ClearPiggyPerformanceAgent(config);

      // Run selective analysis
      const results = [];

      if (!options.bundle && !options.images && !options.components) {
        // Run all analyses if no specific flags
        if (config.analysis.enableBundleAnalysis) {
          results.push(await agent['analyzeBundleSize']());
        }
        if (config.analysis.enableImageOptimization) {
          results.push(await agent['analyzeImages']());
        }
        if (config.analysis.enableComponentAnalysis) {
          results.push(await agent['analyzeComponents']());
        }
      } else {
        if (options.bundle) results.push(await agent['analyzeBundleSize']());
        if (options.images) results.push(await agent['analyzeImages']());
        if (options.components) results.push(await agent['analyzeComponents']());
      }

      spinner.succeed('Analysis complete');
      
      // Display analysis results
      results.forEach(result => {
        displayAnalysisResults(result);
      });

    } catch (error) {
      console.error(chalk.red(`Analysis failed: ${error}`));
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate <type>')
  .description('Generate specific optimization components')
  .option('-o, --output <path>', 'Output directory')
  .choices(['service-worker', 'pwa-manifest', 'install-prompt', 'performance-dashboard', 'web-vitals'])
  .action(async (type, options) => {
    try {
      const config = getDefaultConfig();
      if (options.output) {
        config.outputPath = options.output;
      }

      const spinner = ora(`Generating ${type}...`).start();
      const agent = new ClearPiggyPerformanceAgent(config);

      let result;
      switch (type) {
        case 'service-worker':
          result = await agent['setupServiceWorker']();
          break;
        case 'pwa-manifest':
        case 'install-prompt':
          result = await agent['setupPWA']();
          break;
        case 'performance-dashboard':
        case 'web-vitals':
          result = await agent['setupPerformanceMonitoring']();
          break;
        default:
          throw new Error(`Unknown generation type: ${type}`);
      }

      spinner.succeed(`${type} generated successfully`);
      console.log(chalk.green(`Files generated in: ${config.outputPath}`));

    } catch (error) {
      console.error(chalk.red(`Generation failed: ${error}`));
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize optimization configuration')
  .action(async () => {
    try {
      console.log(chalk.blue('🐷 Clear Piggy Performance Optimization Setup\n'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectPath',
          message: 'Project root path:',
          default: process.cwd()
        },
        {
          type: 'input',
          name: 'outputPath',
          message: 'Output directory for optimized files:',
          default: './optimization-output'
        },
        {
          type: 'checkbox',
          name: 'optimizations',
          message: 'Select optimizations to enable:',
          choices: [
            { name: 'Bundle optimization (code splitting, minification)', value: 'bundle', checked: true },
            { name: 'Image optimization (WebP, responsive images)', value: 'images', checked: true },
            { name: 'Component optimization (memoization, virtualization)', value: 'components', checked: true },
            { name: 'Service Worker setup (caching, offline support)', value: 'serviceWorker', checked: true },
            { name: 'PWA configuration (manifest, install prompt)', value: 'pwa', checked: true },
            { name: 'Performance monitoring (Web Vitals, dashboard)', value: 'monitoring', checked: true }
          ]
        },
        {
          type: 'number',
          name: 'bundleSizeThreshold',
          message: 'Bundle size threshold (KB):',
          default: 250
        },
        {
          type: 'number',
          name: 'imageSizeThreshold',
          message: 'Image size threshold (KB):',
          default: 100
        }
      ]);

      const config = getDefaultConfig();
      config.projectPath = answers.projectPath;
      config.outputPath = answers.outputPath;
      config.analysis.enableBundleAnalysis = answers.optimizations.includes('bundle');
      config.analysis.enableImageOptimization = answers.optimizations.includes('images');
      config.analysis.enableComponentAnalysis = answers.optimizations.includes('components');
      config.analysis.enableServiceWorkerSetup = answers.optimizations.includes('serviceWorker');
      config.analysis.enablePWASetup = answers.optimizations.includes('pwa');
      config.analysis.enablePerformanceMonitoring = answers.optimizations.includes('monitoring');
      config.analysis.thresholds.bundleSize = answers.bundleSizeThreshold * 1000;
      config.analysis.thresholds.imageSize = answers.imageSizeThreshold * 1000;

      // Write configuration file
      const configPath = path.join(process.cwd(), 'clear-piggy-optimization.config.js');
      const configContent = `export default ${JSON.stringify(config, null, 2)};`;
      
      const fs = await import('fs/promises');
      await fs.writeFile(configPath, configContent);

      console.log(chalk.green(`✅ Configuration saved to: ${configPath}`));
      console.log(chalk.blue('\nRun `clear-piggy-optimize optimize` to start optimization!'));

    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${error}`));
      process.exit(1);
    }
  });

// Interactive mode function
async function runInteractiveMode(config: PerformanceOptimizationConfig): Promise<PerformanceOptimizationConfig> {
  console.log(chalk.blue('🔧 Interactive Optimization Configuration\n'));

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'optimizations',
      message: 'Select optimizations to run:',
      choices: [
        { name: 'Bundle Analysis & Optimization', value: 'bundle', checked: config.analysis.enableBundleAnalysis },
        { name: 'Image Optimization', value: 'images', checked: config.analysis.enableImageOptimization },
        { name: 'Component Optimization', value: 'components', checked: config.analysis.enableComponentAnalysis },
        { name: 'Service Worker Setup', value: 'serviceWorker', checked: config.analysis.enableServiceWorkerSetup },
        { name: 'PWA Configuration', value: 'pwa', checked: config.analysis.enablePWASetup },
        { name: 'Performance Monitoring', value: 'monitoring', checked: config.analysis.enablePerformanceMonitoring }
      ]
    },
    {
      type: 'confirm',
      name: 'enableWebP',
      message: 'Enable WebP image conversion?',
      default: config.optimization.imageOptimization.enableWebP,
      when: (answers) => answers.optimizations.includes('images')
    },
    {
      type: 'confirm',
      name: 'enableCodeSplitting',
      message: 'Enable code splitting?',
      default: config.optimization.bundleOptimization.enableCodeSplitting,
      when: (answers) => answers.optimizations.includes('bundle')
    },
    {
      type: 'confirm',
      name: 'enableVirtualization',
      message: 'Enable component virtualization for long lists?',
      default: config.optimization.componentOptimization.enableVirtualization,
      when: (answers) => answers.optimizations.includes('components')
    },
    {
      type: 'list',
      name: 'cacheStrategy',
      message: 'Select cache strategy for service worker:',
      choices: [
        { name: 'Network First (fresh data priority)', value: 'network-first' },
        { name: 'Cache First (performance priority)', value: 'cache-first' },
        { name: 'Stale While Revalidate (balanced)', value: 'stale-while-revalidate' }
      ],
      default: config.optimization.serviceWorker.cacheStrategy,
      when: (answers) => answers.optimizations.includes('serviceWorker')
    }
  ]);

  // Update configuration based on answers
  config.analysis.enableBundleAnalysis = answers.optimizations.includes('bundle');
  config.analysis.enableImageOptimization = answers.optimizations.includes('images');
  config.analysis.enableComponentAnalysis = answers.optimizations.includes('components');
  config.analysis.enableServiceWorkerSetup = answers.optimizations.includes('serviceWorker');
  config.analysis.enablePWASetup = answers.optimizations.includes('pwa');
  config.analysis.enablePerformanceMonitoring = answers.optimizations.includes('monitoring');

  if (answers.enableWebP !== undefined) {
    config.optimization.imageOptimization.enableWebP = answers.enableWebP;
  }
  if (answers.enableCodeSplitting !== undefined) {
    config.optimization.bundleOptimization.enableCodeSplitting = answers.enableCodeSplitting;
  }
  if (answers.enableVirtualization !== undefined) {
    config.optimization.componentOptimization.enableVirtualization = answers.enableVirtualization;
  }
  if (answers.cacheStrategy) {
    config.optimization.serviceWorker.cacheStrategy = answers.cacheStrategy;
  }

  return config;
}

// Display optimization results
function displayResults(result: any): void {
  console.log('\n' + chalk.blue('📊 Optimization Results') + '\n');
  console.log('='.repeat(50));

  // Summary
  const totalOptimizations = result.optimizations?.length || 0;
  const totalErrors = result.errors?.length || 0;
  
  console.log(chalk.green(`✅ Optimizations Applied: ${totalOptimizations}`));
  console.log(chalk.red(`❌ Errors Encountered: ${totalErrors}`));
  console.log();

  // Optimizations by category
  if (result.optimizations?.length > 0) {
    const categories = result.optimizations.reduce((acc: any, opt: any) => {
      if (!acc[opt.category]) acc[opt.category] = [];
      acc[opt.category].push(opt);
      return acc;
    }, {});

    Object.entries(categories).forEach(([category, opts]: [string, any]) => {
      console.log(chalk.cyan(`📦 ${category}:`));
      opts.forEach((opt: any) => {
        console.log(`  • ${opt.description}`);
        console.log(`    ${chalk.gray('Expected:')} ${opt.expectedImprovement}`);
        console.log(`    ${chalk.gray('Effort:')} ${opt.effort} | ${chalk.gray('Priority:')} ${opt.priority}`);
        console.log();
      });
    });
  }

  // Errors
  if (result.errors?.length > 0) {
    console.log(chalk.red('❌ Errors:'));
    result.errors.forEach((error: any) => {
      console.log(`  • ${error.message}`);
      if (error.solution) {
        console.log(`    ${chalk.gray('Solution:')} ${error.solution}`);
      }
      console.log();
    });
  }

  // Files generated
  if (result.files?.length > 0) {
    console.log(chalk.blue('📁 Generated Files:'));
    result.files.forEach((file: any) => {
      console.log(`  • ${file.filePath} (${file.type})`);
    });
    console.log();
  }

  console.log('='.repeat(50));
  console.log(chalk.green('🎉 Optimization complete!'));
  
  if (result.optimizations?.some((opt: any) => opt.type === 'pwa')) {
    console.log(chalk.blue('\n💡 Don\'t forget to:'));
    console.log('  • Add the generated service worker to your build process');
    console.log('  • Include the PWA manifest in your HTML head');
    console.log('  • Add the performance monitoring components to your app');
    console.log('  • Test the PWA installation flow on mobile devices');
  }
}

// Display analysis results
function displayAnalysisResults(result: any): void {
  console.log(`\n${chalk.blue('🔍 Analysis Results')} - ${result.type}\n`);
  
  if (result.recommendations?.length > 0) {
    console.log(chalk.cyan('Recommendations:'));
    result.recommendations.forEach((rec: any, index: number) => {
      console.log(`${index + 1}. ${rec.description}`);
      console.log(`   ${chalk.gray('Impact:')} ${rec.impact} | ${chalk.gray('Effort:')} ${rec.effort}`);
      console.log();
    });
  }

  if (result.metrics) {
    console.log(chalk.cyan('Metrics:'));
    Object.entries(result.metrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log();
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error);
  process.exit(1);
});

// Parse command line arguments
program.parse();