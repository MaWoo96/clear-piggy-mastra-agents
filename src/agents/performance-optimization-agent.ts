/**
 * Clear Piggy Performance Optimization Agent
 * Comprehensive React performance optimization for mobile devices
 */

import { PerformanceAnalyzer } from '../utils/performance-analyzer';
import { BundleSizeAnalyzer } from '../utils/bundle-analyzer';
import { ImageOptimizer } from '../utils/image-optimizer';
import { 
  PerformanceOptimizationConfig,
  OptimizationResult,
  PerformanceOptimization,
  OptimizationError,
  BundleAnalysis,
  ImageOptimizationAnalysis,
  ComponentPerformanceAnalysis,
  ServiceWorkerConfig,
  PWAConfig,
  PerformanceMonitoring
} from '../types/performance-optimization-types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ClearPiggyPerformanceAgent {
  private config: PerformanceOptimizationConfig;
  private performanceAnalyzer: PerformanceAnalyzer;
  private bundleAnalyzer: BundleSizeAnalyzer;
  private imageOptimizer: ImageOptimizer;

  constructor(config: PerformanceOptimizationConfig) {
    this.config = config;
    this.performanceAnalyzer = new PerformanceAnalyzer(config);
    this.bundleAnalyzer = new BundleSizeAnalyzer(config.projectPath);
    this.imageOptimizer = new ImageOptimizer(config.projectPath, path.join(config.outputPath, 'optimized-images'));
  }

  /**
   * Run comprehensive performance optimization analysis
   */
  async optimizePerformance(): Promise<OptimizationResult> {
    console.log('🚀 Starting comprehensive performance optimization for Clear Piggy Mobile...\n');

    const startTime = Date.now();
    const optimizations: PerformanceOptimization[] = [];
    const errors: OptimizationError[] = [];
    const warnings: string[] = [];

    try {
      // 1. Bundle Size Analysis and Code Splitting
      if (this.config.enableBundleAnalysis) {
        const bundleOptimizations = await this.optimizeBundleSize();
        optimizations.push(...bundleOptimizations.optimizations);
        errors.push(...bundleOptimizations.errors);
      }

      // 2. Image Optimization
      if (this.config.enableImageOptimization) {
        const imageOptimizations = await this.optimizeImages();
        optimizations.push(...imageOptimizations.optimizations);
        errors.push(...imageOptimizations.errors);
      }

      // 3. React Component Performance
      if (this.config.enableComponentAnalysis) {
        const componentOptimizations = await this.optimizeComponents();
        optimizations.push(...componentOptimizations.optimizations);
        errors.push(...componentOptimizations.errors);
      }

      // 4. Service Worker Setup
      if (this.config.enableServiceWorker) {
        const swOptimizations = await this.setupServiceWorker();
        optimizations.push(...swOptimizations.optimizations);
        errors.push(...swOptimizations.errors);
      }

      // 5. PWA Configuration
      if (this.config.enablePWASetup) {
        const pwaOptimizations = await this.setupPWA();
        optimizations.push(...pwaOptimizations.optimizations);
        errors.push(...pwaOptimizations.errors);
      }

      // 6. Performance Monitoring
      if (this.config.enablePerformanceMonitoring) {
        const monitoringOptimizations = await this.setupPerformanceMonitoring();
        optimizations.push(...monitoringOptimizations.optimizations);
        errors.push(...monitoringOptimizations.errors);
      }

      // 7. Generate optimized files
      const generatedFiles = await this.generateOptimizedFiles(optimizations);

      const duration = Math.round((Date.now() - startTime) / 1000);

      console.log(`\n🎉 Performance optimization complete in ${duration}s!`);
      console.log(`✅ Generated ${optimizations.length} optimization recommendations`);
      console.log(`📁 Created ${generatedFiles.length} optimized files`);

      return {
        success: errors.length === 0,
        optimizations,
        errors,
        warnings,
        summary: {
          totalOptimizations: optimizations.length,
          bundleSizeReduction: this.calculateBundleSizeReduction(optimizations),
          performanceScoreImprovement: this.estimatePerformanceImprovement(optimizations),
          estimatedLoadTimeReduction: this.estimateLoadTimeReduction(optimizations),
          implementedOptimizations: generatedFiles.length,
          pendingOptimizations: optimizations.filter(opt => opt.effort === 'high').length
        },
        generatedFiles
      };

    } catch (error) {
      console.error('❌ Performance optimization failed:', error);
      errors.push({
        type: 'system',
        message: `Performance optimization failed: ${error}`,
        solution: 'Check system requirements and try again'
      });

      return {
        success: false,
        optimizations,
        errors,
        warnings,
        summary: {
          totalOptimizations: 0,
          bundleSizeReduction: 0,
          performanceScoreImprovement: 0,
          estimatedLoadTimeReduction: 0,
          implementedOptimizations: 0,
          pendingOptimizations: 0
        },
        generatedFiles: []
      };
    }
  }

  /**
   * Optimize bundle size and implement code splitting
   */
  private async optimizeBundleSize(): Promise<{ optimizations: PerformanceOptimization[]; errors: OptimizationError[]; }> {
    console.log('📦 Analyzing bundle size and code splitting opportunities...');

    const optimizations: PerformanceOptimization[] = [];
    const errors: OptimizationError[] = [];

    try {
      const analysis = await this.bundleAnalyzer.analyzeBundleStats();
      
      // Process code splitting recommendations
      for (const recommendation of analysis.recommendations) {
        optimizations.push({
          type: 'bundle',
          description: `${recommendation.type} code splitting for ${recommendation.target}`,
          implementation: recommendation.implementation,
          expectedImprovement: `Reduce bundle size by ${Math.floor(recommendation.potentialSavings / 1000)}KB`,
          effort: recommendation.effort,
          priority: recommendation.priority,
          category: 'Code Splitting'
        });
      }

      // Process tree-shaking opportunities
      for (const opportunity of analysis.treeshakingOpportunities) {
        optimizations.push({
          type: 'bundle',
          description: `Tree-shake unused exports from ${opportunity.library}`,
          implementation: opportunity.implementation,
          expectedImprovement: `Reduce bundle size by ${Math.floor(opportunity.potentialSavings / 1000)}KB`,
          effort: 'low',
          priority: opportunity.potentialSavings > 50000 ? 'high' : 'medium',
          category: 'Tree Shaking'
        });
      }

      // Generate webpack optimization config
      const webpackConfig = this.bundleAnalyzer.generateWebpackSplittingConfig();
      await this.writeOptimizedFile('webpack.optimization.js', webpackConfig);

      // Generate dynamic import patterns
      const dynamicImports = this.bundleAnalyzer.generateDynamicImports();
      for (const [type, code] of Object.entries(dynamicImports)) {
        await this.writeOptimizedFile(`dynamic-imports-${type}.tsx`, code);
      }

      console.log(`✅ Bundle analysis complete - found ${optimizations.length} optimization opportunities`);

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      errors.push({
        type: 'bundle',
        message: `Bundle analysis failed: ${error}`,
        solution: 'Ensure webpack stats are available or build the project first'
      });
    }

    return { optimizations, errors };
  }

  /**
   * Optimize images for mobile performance
   */
  private async optimizeImages(): Promise<{ optimizations: PerformanceOptimization[]; errors: OptimizationError[]; }> {
    console.log('🖼️ Analyzing and optimizing images...');

    const optimizations: PerformanceOptimization[] = [];
    const errors: OptimizationError[] = [];

    try {
      const analysis = await this.imageOptimizer.analyzeImages();

      // WebP conversion opportunities
      for (const imagePath of analysis.webpCandidates) {
        optimizations.push({
          type: 'image',
          description: `Convert ${path.basename(imagePath)} to WebP format`,
          implementation: `Use next-gen image format with fallback`,
          expectedImprovement: 'Reduce image size by 25-35%',
          effort: 'low',
          priority: 'high',
          category: 'Image Format'
        });
      }

      // Responsive image opportunities
      for (const responsive of analysis.responsiveImageNeeds) {
        optimizations.push({
          type: 'image',
          description: `Generate responsive variants for ${path.basename(responsive.filePath)}`,
          implementation: responsive.srcSetGeneration,
          expectedImprovement: 'Serve appropriately sized images for different devices',
          effort: 'medium',
          priority: 'medium',
          category: 'Responsive Images'
        });
      }

      // Lazy loading opportunities
      const lazyLoadCandidates = analysis.optimizationOpportunities.filter(opt => opt.lazyLoadCandidate);
      if (lazyLoadCandidates.length > 0) {
        optimizations.push({
          type: 'image',
          description: `Implement lazy loading for ${lazyLoadCandidates.length} images`,
          implementation: 'Use Intersection Observer API with fallback',
          expectedImprovement: 'Reduce initial page load time by 20-40%',
          effort: 'medium',
          priority: 'high',
          category: 'Lazy Loading'
        });
      }

      // Generate optimized image components
      const imageComponents = this.imageOptimizer.generateOptimizedImageComponents();
      for (const [componentName, code] of Object.entries(imageComponents)) {
        await this.writeOptimizedFile(`components/optimized/${componentName}.tsx`, code);
      }

      // Generate image optimization configuration
      const imageConfig = this.imageOptimizer.generateImageOptimizationConfig();
      await this.writeOptimizedFile('config/image-optimization.ts', imageConfig);

      // Generate build scripts
      const buildScripts = this.imageOptimizer.generateImageOptimizationScripts();
      for (const [scriptName, script] of Object.entries(buildScripts)) {
        await this.writeOptimizedFile(`scripts/${scriptName}`, script);
      }

      console.log(`✅ Image optimization complete - found ${optimizations.length} opportunities`);

    } catch (error) {
      console.error('❌ Image optimization failed:', error);
      errors.push({
        type: 'image',
        message: `Image optimization failed: ${error}`,
        solution: 'Check image file permissions and formats'
      });
    }

    return { optimizations, errors };
  }

  /**
   * Optimize React components for mobile performance
   */
  private async optimizeComponents(): Promise<{ optimizations: PerformanceOptimization[]; errors: OptimizationError[]; }> {
    console.log('⚛️ Analyzing React component performance...');

    const optimizations: PerformanceOptimization[] = [];
    const errors: OptimizationError[] = [];

    try {
      const analyses = await this.performanceAnalyzer.analyzeComponentPerformance();

      for (const analysis of analyses) {
        // Process performance issues
        for (const issue of analysis.issues) {
          optimizations.push({
            type: 'component',
            description: `Fix ${issue.type} in ${analysis.componentName}`,
            implementation: issue.solution,
            expectedImprovement: issue.impact,
            effort: issue.severity === 'critical' ? 'high' : 'medium',
            priority: issue.severity === 'critical' ? 'high' : issue.severity === 'high' ? 'medium' : 'low',
            category: 'Performance Issue'
          });
        }

        // Process optimization opportunities
        for (const optimization of analysis.optimizations) {
          optimizations.push({
            type: 'component',
            description: `Apply ${optimization.type} to ${analysis.componentName}`,
            implementation: optimization.implementation,
            expectedImprovement: optimization.expectedImprovement,
            effort: optimization.tradeoffs.length > 2 ? 'high' : 'medium',
            priority: 'medium',
            category: 'React Optimization'
          });
        }

        // Process memoization opportunities
        for (const memo of analysis.memoizationOpportunities) {
          optimizations.push({
            type: 'component',
            description: `Implement ${memo.hookType} in ${analysis.componentName}`,
            implementation: memo.optimizedCode,
            expectedImprovement: memo.benefit,
            effort: 'low',
            priority: 'medium',
            category: 'Memoization'
          });
        }
      }

      // Generate transaction list lazy loading setup
      const lazyLoadingSetup = await this.generateTransactionListOptimization();
      await this.writeOptimizedFile('components/optimized/TransactionListOptimized.tsx', lazyLoadingSetup);

      optimizations.push({
        type: 'component',
        description: 'Implement virtualized transaction list with lazy loading',
        implementation: 'Generated optimized TransactionList component with virtual scrolling',
        expectedImprovement: 'Handle 10,000+ transactions with smooth scrolling',
        effort: 'medium',
        priority: 'high',
        category: 'Virtualization'
      });

      console.log(`✅ Component analysis complete - found ${optimizations.length} optimization opportunities`);

    } catch (error) {
      console.error('❌ Component analysis failed:', error);
      errors.push({
        type: 'component',
        message: `Component analysis failed: ${error}`,
        solution: 'Check React component syntax and file permissions'
      });
    }

    return { optimizations, errors };
  }

  /**
   * Setup service worker for offline functionality
   */
  private async setupServiceWorker(): Promise<{ optimizations: PerformanceOptimization[]; errors: OptimizationError[]; }> {
    console.log('🔧 Setting up service worker for offline functionality...');

    const optimizations: PerformanceOptimization[] = [];
    const errors: OptimizationError[] = [];

    try {
      const serviceWorkerCode = this.generateServiceWorkerCode();
      await this.writeOptimizedFile('public/service-worker.js', serviceWorkerCode);

      const swRegistration = this.generateServiceWorkerRegistration();
      await this.writeOptimizedFile('src/utils/service-worker-registration.ts', swRegistration);

      const cacheStrategies = this.generateCacheStrategies();
      await this.writeOptimizedFile('src/utils/cache-strategies.ts', cacheStrategies);

      const backgroundSync = this.generateBackgroundSyncSetup();
      await this.writeOptimizedFile('src/utils/background-sync.ts', backgroundSync);

      optimizations.push(
        {
          type: 'caching',
          description: 'Implement service worker for offline functionality',
          implementation: 'Generated service worker with caching strategies',
          expectedImprovement: 'Enable offline access to cached pages and data',
          effort: 'medium',
          priority: 'high',
          category: 'Offline Support'
        },
        {
          type: 'caching',
          description: 'Setup background sync for transaction updates',
          implementation: 'Background sync for offline transaction processing',
          expectedImprovement: 'Process transactions when connection is restored',
          effort: 'medium',
          priority: 'medium',
          category: 'Background Sync'
        }
      );

      console.log('✅ Service worker setup complete');

    } catch (error) {
      console.error('❌ Service worker setup failed:', error);
      errors.push({
        type: 'service-worker',
        message: `Service worker setup failed: ${error}`,
        solution: 'Check file permissions and browser support'
      });
    }

    return { optimizations, errors };
  }

  /**
   * Setup PWA configuration for mobile app-like experience
   */
  private async setupPWA(): Promise<{ optimizations: PerformanceOptimization[]; errors: OptimizationError[]; }> {
    console.log('📱 Setting up PWA configuration...');

    const optimizations: PerformanceOptimization[] = [];
    const errors: OptimizationError[] = [];

    try {
      const manifest = this.generateWebAppManifest();
      await this.writeOptimizedFile('public/manifest.json', JSON.stringify(manifest, null, 2));

      const installPrompt = this.generateInstallPromptComponent();
      await this.writeOptimizedFile('src/components/InstallPrompt.tsx', installPrompt);

      const splashScreens = this.generateSplashScreenCSS();
      await this.writeOptimizedFile('src/styles/splash-screens.css', splashScreens);

      const pwaUtils = this.generatePWAUtilities();
      await this.writeOptimizedFile('src/utils/pwa-utils.ts', pwaUtils);

      optimizations.push(
        {
          type: 'pwa',
          description: 'Configure web app manifest for mobile installation',
          implementation: 'Generated manifest.json with mobile-optimized settings',
          expectedImprovement: 'Enable "Add to Home Screen" functionality',
          effort: 'low',
          priority: 'high',
          category: 'PWA Setup'
        },
        {
          type: 'pwa',
          description: 'Implement custom install prompt',
          implementation: 'Custom install prompt with Clear Piggy branding',
          expectedImprovement: 'Increase PWA installation rate',
          effort: 'medium',
          priority: 'medium',
          category: 'Install Prompt'
        },
        {
          type: 'pwa',
          description: 'Add mobile splash screens',
          implementation: 'iOS and Android splash screen optimization',
          expectedImprovement: 'Professional app-like startup experience',
          effort: 'low',
          priority: 'medium',
          category: 'Splash Screens'
        }
      );

      console.log('✅ PWA setup complete');

    } catch (error) {
      console.error('❌ PWA setup failed:', error);
      errors.push({
        type: 'pwa',
        message: `PWA setup failed: ${error}`,
        solution: 'Check manifest.json format and icon files'
      });
    }

    return { optimizations, errors };
  }

  /**
   * Setup performance monitoring
   */
  private async setupPerformanceMonitoring(): Promise<{ optimizations: PerformanceOptimization[]; errors: OptimizationError[]; }> {
    console.log('📊 Setting up performance monitoring...');

    const optimizations: PerformanceOptimization[] = [];
    const errors: OptimizationError[] = [];

    try {
      const webVitalsSetup = this.generateWebVitalsMonitoring();
      await this.writeOptimizedFile('src/utils/web-vitals.ts', webVitalsSetup);

      const performanceDashboard = this.generatePerformanceDashboard();
      await this.writeOptimizedFile('src/components/PerformanceDashboard.tsx', performanceDashboard);

      const errorBoundary = this.generateErrorBoundary();
      await this.writeOptimizedFile('src/components/ErrorBoundary.tsx', errorBoundary);

      const loadingStates = this.generateLoadingStateComponents();
      await this.writeOptimizedFile('src/components/LoadingStates.tsx', loadingStates);

      optimizations.push(
        {
          type: 'monitoring',
          description: 'Implement Web Vitals monitoring',
          implementation: 'Track FCP, LCP, FID, CLS, TTFB metrics',
          expectedImprovement: 'Monitor real-world performance metrics',
          effort: 'low',
          priority: 'medium',
          category: 'Performance Monitoring'
        },
        {
          type: 'monitoring',
          description: 'Add performance dashboard',
          implementation: 'Real-time performance metrics visualization',
          expectedImprovement: 'Track performance trends and issues',
          effort: 'medium',
          priority: 'low',
          category: 'Performance Dashboard'
        },
        {
          type: 'monitoring',
          description: 'Implement error boundaries',
          implementation: 'Graceful error handling with fallback UI',
          expectedImprovement: 'Better user experience during errors',
          effort: 'low',
          priority: 'high',
          category: 'Error Handling'
        }
      );

      console.log('✅ Performance monitoring setup complete');

    } catch (error) {
      console.error('❌ Performance monitoring setup failed:', error);
      errors.push({
        type: 'monitoring',
        message: `Performance monitoring setup failed: ${error}`,
        solution: 'Check browser API support and analytics configuration'
      });
    }

    return { optimizations, errors };
  }

  /**
   * Generate optimized transaction list with virtualization
   */
  private async generateTransactionListOptimization(): Promise<string> {
    return `import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery } from '@tanstack/react-query';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  account: string;
}

interface OptimizedTransactionListProps {
  userId: string;
  filters?: {
    accountId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  };
  onTransactionSelect?: (transaction: Transaction) => void;
  className?: string;
}

export const OptimizedTransactionList: React.FC<OptimizedTransactionListProps> = ({
  userId,
  filters,
  onTransactionSelect,
  className = ''
}) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Optimized data fetching with React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['transactions', userId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch transactions from Supabase with pagination
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          filters,
          page: pageParam,
          limit: 50 // Optimized page size for mobile
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => 
      lastPage.hasMore ? allPages.length : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  // Flatten paginated data
  const transactions = useMemo(() => 
    data?.pages.flatMap(page => page.transactions) ?? [],
    [data]
  );

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => containerRef,
    estimateSize: () => 80, // Estimated row height
    overscan: 5, // Number of items to render outside visible area
  });

  // Intersection observer for infinite scroll
  useEffect(() => {
    const lastItem = virtualizer.getVirtualItems().slice(-1)[0];
    
    if (!lastItem) return;
    
    if (
      lastItem.index >= transactions.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
    transactions.length
  ]);

  // Memoized transaction item renderer
  const TransactionItem = useCallback(({ transaction, index }: { 
    transaction: Transaction; 
    index: number; 
  }) => (
    <motion.div
      className="flex items-center justify-between p-4 bg-white border-b border-gray-100 min-h-[80px] touch-manipulation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      whileTap={{ scale: 0.98 }}
      onTap={() => onTransactionSelect?.(transaction)}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 truncate">
            {transaction.description}
          </h3>
          <span className={`text-lg font-bold \${
            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
          }\`}>
            {\`\${transaction.amount > 0 ? '+' : ''}\${\${Math.abs(transaction.amount).toFixed(2)}\`}
          </span>
        </div>
        <div className="flex items-center mt-1 text-sm text-gray-500">
          <span className="truncate">{transaction.category}</span>
          <span className="mx-2">•</span>
          <span>{new Date(transaction.date).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  ), [onTransactionSelect]);

  // Loading skeleton
  const LoadingSkeleton = useCallback(() => (
    <div className="space-y-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="p-4 bg-white border-b border-gray-100">
          <div className="animate-pulse">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="mt-2 flex space-x-4">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ), []);

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load transactions
        </h3>
        <p className="text-gray-600 mb-4">
          Please check your connection and try again
        </p>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className={\`h-full \${className}\`}>
      <div
        ref={setContainerRef}
        className="h-full overflow-auto"
        style={{
          contain: 'strict', // CSS containment for better performance
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="popLayout">
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const transaction = transactions[virtualItem.index];
              
              if (!transaction) return null;

              return (
                <div
                  key={transaction.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualItem.size,
                    transform: \`translateY(\${virtualItem.start}px)\`,
                  }}
                >
                  <TransactionItem 
                    transaction={transaction}
                    index={virtualItem.index}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading more transactions...</span>
            </div>
          </div>
        )}

        {/* End of data indicator */}
        {!hasNextPage && transactions.length > 0 && (
          <div className="py-8 text-center text-gray-500">
            <p>You've reached the end of your transactions</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or add some transactions to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedTransactionList;`;
  }

  /**
   * Generate service worker code
   */
  private generateServiceWorkerCode(): string {
    return `// Clear Piggy Mobile Service Worker
// Optimized for financial app requirements

const CACHE_NAME = 'clear-piggy-v1';
const STATIC_CACHE = 'clear-piggy-static-v1';
const DYNAMIC_CACHE = 'clear-piggy-dynamic-v1';
const API_CACHE = 'clear-piggy-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html',
  // Add critical assets
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/accounts',
  '/api/categories',
  '/api/user-settings',
];

// Background sync tags
const SYNC_TAGS = {
  TRANSACTIONS: 'sync-transactions',
  RECEIPTS: 'sync-receipts',
  CATEGORIES: 'sync-categories'
};

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for now
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.includes('/static/')) {
    event.respondWith(handleStaticAssets(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE);
  
  // Check if this API endpoint should be cached
  const shouldCache = CACHEABLE_APIS.some(pattern => 
    url.pathname.includes(pattern)
  );
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for cacheable endpoints
    if (networkResponse.ok && shouldCache) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    if (shouldCache) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('Service Worker: Serving API from cache', request.url);
        return cachedResponse;
      }
    }
    
    // Return offline response for critical APIs
    if (url.pathname.includes('/api/accounts')) {
      return new Response(JSON.stringify({
        error: 'offline',
        message: 'Account data unavailable offline',
        cached: false
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch static asset', request.url);
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful page responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving page from cache', request.url);
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await cache.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline response
    return new Response(\`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clear Piggy - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                   margin: 0; padding: 20px; text-align: center; background: #f3f4f6; }
            .container { max-width: 400px; margin: 100px auto; 
                        background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #1f2937; margin-bottom: 20px; }
            p { color: #6b7280; line-height: 1.6; }
            .icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🐷</div>
            <h1>You're Offline</h1>
            <p>Clear Piggy needs an internet connection to sync your latest financial data. 
               Don't worry, your data is safe and will sync when you're back online!</p>
          </div>
        </body>
      </html>
    \`, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === SYNC_TAGS.TRANSACTIONS) {
    event.waitUntil(syncTransactions());
  } else if (event.tag === SYNC_TAGS.RECEIPTS) {
    event.waitUntil(syncReceipts());
  } else if (event.tag === SYNC_TAGS.CATEGORIES) {
    event.waitUntil(syncCategories());
  }
});

async function syncTransactions() {
  try {
    // Get offline transactions from IndexedDB
    const offlineTransactions = await getOfflineTransactions();
    
    if (offlineTransactions.length === 0) {
      return;
    }
    
    // Sync each transaction
    for (const transaction of offlineTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineTransaction(transaction.id);
          console.log('Service Worker: Synced transaction', transaction.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync transaction', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

async function syncReceipts() {
  // Similar implementation for receipts
  console.log('Service Worker: Syncing receipts...');
}

async function syncCategories() {
  // Similar implementation for categories
  console.log('Service Worker: Syncing categories...');
}

// IndexedDB helpers (would be more comprehensive in real implementation)
async function getOfflineTransactions() {
  return []; // Placeholder
}

async function removeOfflineTransaction(id) {
  // Placeholder
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New financial update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Clear Piggy', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

console.log('Service Worker: Clear Piggy SW loaded');`;
  }

  /**
   * Generate service worker registration code
   */
  private generateServiceWorkerRegistration(): string {
    return `/**
 * Service Worker Registration for Clear Piggy Mobile
 * Handles SW lifecycle and provides offline capabilities
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onNeedRefresh?: () => void;
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = \`\${process.env.PUBLIC_URL}/service-worker.js\`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('Service Worker: Running in localhost mode');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker: Registration successful');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('Service Worker: New content available');
              config?.onUpdate?.(registration);
            } else {
              console.log('Service Worker: Content cached for offline use');
              config?.onOfflineReady?.();
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Service Worker: Registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Service Worker: No internet connection. App running in offline mode.');
    });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Service Worker: Unregistration error:', error.message);
      });
  }
}

// Background sync registration
export function registerBackgroundSync(tag: string, data?: any) {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(tag);
    }).catch((error) => {
      console.error('Background Sync: Registration failed:', error);
    });
  } else {
    // Fallback for browsers without background sync
    console.warn('Background Sync: Not supported, using fallback');
    // Implement fallback sync logic
  }
}

// Push notification subscription
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
    });

    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Push notification subscription failed:', error);
    return null;
  }
}`;
  }

  /**
   * Generate cache strategies
   */
  private generateCacheStrategies(): string {
    return `/**
 * Cache Strategies for Clear Piggy Mobile
 * Optimized caching patterns for financial data
 */

export interface CacheConfig {
  cacheName: string;
  maxAge: number; // milliseconds
  maxEntries: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

// Cache configurations for different data types
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static assets - cache first for performance
  static: {
    cacheName: 'clear-piggy-static',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
    strategy: 'cache-first'
  },

  // User accounts - network first for accuracy
  accounts: {
    cacheName: 'clear-piggy-accounts',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 10,
    strategy: 'network-first'
  },

  // Transactions - stale while revalidate for balance
  transactions: {
    cacheName: 'clear-piggy-transactions',
    maxAge: 10 * 60 * 1000, // 10 minutes
    maxEntries: 50,
    strategy: 'stale-while-revalidate'
  },

  // Categories - cache first (rarely changes)
  categories: {
    cacheName: 'clear-piggy-categories',
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 20,
    strategy: 'cache-first'
  },

  // Settings - network first for real-time updates
  settings: {
    cacheName: 'clear-piggy-settings',
    maxAge: 30 * 60 * 1000, // 30 minutes
    maxEntries: 5,
    strategy: 'network-first'
  }
};

export class CacheManager {
  private static instance: CacheManager;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get(key: string, cacheConfig: CacheConfig): Promise<Response | null> {
    const cache = await caches.open(cacheConfig.cacheName);
    const cachedResponse = await cache.match(key);

    if (!cachedResponse) {
      return null;
    }

    // Check if cache entry is expired
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || '');
    const isExpired = Date.now() - cacheDate.getTime() > cacheConfig.maxAge;

    if (isExpired) {
      await cache.delete(key);
      return null;
    }

    return cachedResponse;
  }

  async set(key: string, response: Response, cacheConfig: CacheConfig): Promise<void> {
    const cache = await caches.open(cacheConfig.cacheName);
    
    // Clone response and add cache timestamp
    const responseToCache = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'sw-cache-date': new Date().toISOString()
      }
    });

    await cache.put(key, responseToCache);
    await this.enforceMaxEntries(cache, cacheConfig.maxEntries);
  }

  private async enforceMaxEntries(cache: Cache, maxEntries: number): Promise<void> {
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
      // Remove oldest entries (FIFO)
      const entriesToRemove = keys.slice(0, keys.length - maxEntries);
      await Promise.all(entriesToRemove.map(key => cache.delete(key)));
    }
  }

  async clearAll(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('clear-piggy-'))
        .map(name => caches.delete(name))
    );
  }

  async getCacheInfo(): Promise<{ name: string; size: number; entries: number }[]> {
    const cacheNames = await caches.keys();
    const info = [];

    for (const name of cacheNames.filter(n => n.startsWith('clear-piggy-'))) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      
      let totalSize = 0;
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      info.push({
        name,
        size: totalSize,
        entries: keys.length
      });
    }

    return info;
  }
}

// Strategy implementations
export class CacheStrategies {
  static async cacheFirst(
    request: Request,
    cacheConfig: CacheConfig
  ): Promise<Response> {
    const cacheManager = CacheManager.getInstance();
    
    // Try cache first
    const cachedResponse = await cacheManager.get(request.url, cacheConfig);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network and cache
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cacheManager.set(request.url, networkResponse.clone(), cacheConfig);
      }
      return networkResponse;
    } catch (error) {
      throw new Error(\`Cache-first strategy failed: \${error}\`);
    }
  }

  static async networkFirst(
    request: Request,
    cacheConfig: CacheConfig
  ): Promise<Response> {
    const cacheManager = CacheManager.getInstance();

    try {
      // Try network first
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cacheManager.set(request.url, networkResponse.clone(), cacheConfig);
      }
      return networkResponse;
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await cacheManager.get(request.url, cacheConfig);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  static async staleWhileRevalidate(
    request: Request,
    cacheConfig: CacheConfig
  ): Promise<Response> {
    const cacheManager = CacheManager.getInstance();
    const cachedResponse = await cacheManager.get(request.url, cacheConfig);

    // Start network request (don't wait for it)
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await cacheManager.set(request.url, networkResponse.clone(), cacheConfig);
      }
      return networkResponse;
    });

    // Return cached response immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache, wait for network
    return networkPromise;
  }
}

// Usage in service worker
export function getCacheStrategy(request: Request): CacheConfig {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/api/accounts')) {
    return CACHE_CONFIGS.accounts;
  } else if (url.pathname.includes('/api/transactions')) {
    return CACHE_CONFIGS.transactions;
  } else if (url.pathname.includes('/api/categories')) {
    return CACHE_CONFIGS.categories;
  } else if (url.pathname.includes('/api/settings')) {
    return CACHE_CONFIGS.settings;
  } else if (url.pathname.includes('/static/')) {
    return CACHE_CONFIGS.static;
  }
  
  // Default to stale-while-revalidate
  return {
    cacheName: 'clear-piggy-default',
    maxAge: 30 * 60 * 1000, // 30 minutes
    maxEntries: 50,
    strategy: 'stale-while-revalidate'
  };
}`;
  }

  /**
   * Helper methods for writing optimized files and calculating metrics
   */
  private async writeOptimizedFile(filename: string, content: string): Promise<void> {
    const outputDir = path.join(this.config.projectPath, this.config.outputPath);
    const filePath = path.join(outputDir, filename);
    
    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async generateOptimizedFiles(optimizations: PerformanceOptimization[]): Promise<any[]> {
    const files = [];
    
    // Generate summary report
    const summaryReport = this.generateOptimizationSummaryReport(optimizations);
    const summaryPath = path.join(this.config.outputPath, 'optimization-summary.md');
    await this.writeOptimizedFile('optimization-summary.md', summaryReport);
    
    files.push({
      filePath: summaryPath,
      type: 'optimization',
      size: summaryReport.length,
      description: 'Performance optimization summary report'
    });

    return files;
  }

  private generateOptimizationSummaryReport(optimizations: PerformanceOptimization[]): string {
    const bundleOpts = optimizations.filter(o => o.type === 'bundle');
    const imageOpts = optimizations.filter(o => o.type === 'image');
    const componentOpts = optimizations.filter(o => o.type === 'component');
    const cacheOpts = optimizations.filter(o => o.type === 'caching');
    const pwaOpts = optimizations.filter(o => o.type === 'pwa');
    const monitoringOpts = optimizations.filter(o => o.type === 'monitoring');

    return `# Clear Piggy Mobile Performance Optimization Report

## 📊 Summary

- **Total Optimizations**: ${optimizations.length}
- **High Priority**: ${optimizations.filter(o => o.priority === 'high').length}
- **Medium Priority**: ${optimizations.filter(o => o.priority === 'medium').length}
- **Low Priority**: ${optimizations.filter(o => o.priority === 'low').length}

## 🎯 Optimization Categories

### 📦 Bundle Optimization (${bundleOpts.length} items)
${bundleOpts.map(opt => `- **${opt.description}**
  - Expected Improvement: ${opt.expectedImprovement}
  - Effort: ${opt.effort}
  - Priority: ${opt.priority}`).join('\n\n')}

### 🖼️ Image Optimization (${imageOpts.length} items)
${imageOpts.map(opt => `- **${opt.description}**
  - Expected Improvement: ${opt.expectedImprovement}
  - Effort: ${opt.effort}
  - Priority: ${opt.priority}`).join('\n\n')}

### ⚛️ Component Optimization (${componentOpts.length} items)
${componentOpts.map(opt => `- **${opt.description}**
  - Expected Improvement: ${opt.expectedImprovement}
  - Effort: ${opt.effort}
  - Priority: ${opt.priority}`).join('\n\n')}

### 🔧 Caching & Service Worker (${cacheOpts.length} items)
${cacheOpts.map(opt => `- **${opt.description}**
  - Expected Improvement: ${opt.expectedImprovement}
  - Effort: ${opt.effort}
  - Priority: ${opt.priority}`).join('\n\n')}

### 📱 PWA Setup (${pwaOpts.length} items)
${pwaOpts.map(opt => `- **${opt.description}**
  - Expected Improvement: ${opt.expectedImprovement}
  - Effort: ${opt.effort}
  - Priority: ${opt.priority}`).join('\n\n')}

### 📊 Performance Monitoring (${monitoringOpts.length} items)
${monitoringOpts.map(opt => `- **${opt.description}**
  - Expected Improvement: ${opt.expectedImprovement}
  - Effort: ${opt.effort}
  - Priority: ${opt.priority}`).join('\n\n')}

## 🚀 Implementation Priority

### Phase 1 (High Priority - Low Effort)
${optimizations
  .filter(o => o.priority === 'high' && o.effort === 'low')
  .map(o => `- ${o.description}`)
  .join('\n')}

### Phase 2 (High Priority - Medium Effort)
${optimizations
  .filter(o => o.priority === 'high' && o.effort === 'medium')
  .map(o => `- ${o.description}`)
  .join('\n')}

### Phase 3 (Medium Priority)
${optimizations
  .filter(o => o.priority === 'medium')
  .map(o => `- ${o.description}`)
  .join('\n')}

## 📈 Expected Performance Improvements

- **Bundle Size Reduction**: ~${this.calculateBundleSizeReduction(optimizations)}KB
- **Load Time Improvement**: ~${this.estimateLoadTimeReduction(optimizations)}ms faster
- **Performance Score**: +${this.estimatePerformanceImprovement(optimizations)} points
- **Mobile Experience**: Significantly improved with PWA capabilities

---

*Generated by Clear Piggy Performance Optimization Agent*`;
  }

  private calculateBundleSizeReduction(optimizations: PerformanceOptimization[]): number {
    return optimizations
      .filter(o => o.type === 'bundle' || o.type === 'image')
      .reduce((total, opt) => {
        const match = opt.expectedImprovement.match(/(\d+)KB/);
        return total + (match ? parseInt(match[1]) : 0);
      }, 0);
  }

  private estimateLoadTimeReduction(optimizations: PerformanceOptimization[]): number {
    const bundleReduction = this.calculateBundleSizeReduction(optimizations);
    const imageOptimizations = optimizations.filter(o => o.type === 'image').length;
    const componentOptimizations = optimizations.filter(o => o.type === 'component').length;
    
    // Rough estimation: 1KB = 10ms on 3G, plus component optimization benefits
    return Math.floor(bundleReduction * 10 + imageOptimizations * 200 + componentOptimizations * 50);
  }

  private estimatePerformanceImprovement(optimizations: PerformanceOptimization[]): number {
    const highPriority = optimizations.filter(o => o.priority === 'high').length;
    const mediumPriority = optimizations.filter(o => o.priority === 'medium').length;
    const lowPriority = optimizations.filter(o => o.priority === 'low').length;
    
    // Rough scoring: high priority = 5 points, medium = 3, low = 1
    return Math.min(50, highPriority * 5 + mediumPriority * 3 + lowPriority * 1);
  }

  /**
   * Generate web app manifest for PWA
   */
  private generateWebAppManifest(): any {
    return {
      name: 'Clear Piggy - Personal Finance Manager',
      short_name: 'Clear Piggy',
      description: 'Take control of your finances with intelligent budgeting and expense tracking',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: '#10B981',
      background_color: '#FFFFFF',
      categories: ['finance', 'productivity'],
      lang: 'en-US',
      dir: 'ltr',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      screenshots: [
        {
          src: '/screenshots/mobile-dashboard.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Dashboard view on mobile'
        },
        {
          src: '/screenshots/desktop-dashboard.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Dashboard view on desktop'
        }
      ],
      related_applications: [],
      prefer_related_applications: false,
      shortcuts: [
        {
          name: 'Add Transaction',
          short_name: 'Add Transaction',
          description: 'Quickly add a new transaction',
          url: '/transactions/new',
          icons: [{
            src: '/icons/shortcut-add.png',
            sizes: '96x96'
          }]
        },
        {
          name: 'View Budget',
          short_name: 'Budget',
          description: 'Check your budget status',
          url: '/budget',
          icons: [{
            src: '/icons/shortcut-budget.png',
            sizes: '96x96'
          }]
        }
      ],
      protocol_handlers: []
    };
  }

  /**
   * Generate PWA install prompt component
   */
  private generateInstallPromptComponent(): string {
    return `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay to avoid interrupting user
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        onInstall?.();
      } else {
        onDismiss?.();
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
    
    // Don't show again for 24 hours
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if recently dismissed
  const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
  if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
    return null;
  }

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🐷</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Install Clear Piggy
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Get the full app experience with offline access and quick shortcuts
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-emerald-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-700 text-xs font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;`;
  }

  /**
   * Generate splash screen CSS for PWA
   */
  private generateSplashScreenCSS(): string {
    return `/* Clear Piggy PWA Splash Screens */
/* Optimized for iOS and Android devices */

/* iPhone X, XS, 11 Pro */
@media only screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) {
  .splash-screen {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    background-size: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
  }
}

/* iPhone XR, 11 */
@media only screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) {
  .splash-screen {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
}

/* iPhone XS Max, 11 Pro Max */
@media only screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) {
  .splash-screen {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
}

/* iPhone 12, 12 Pro */
@media only screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) {
  .splash-screen {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
}

/* iPhone 12 Pro Max */
@media only screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) {
  .splash-screen {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
}

/* Generic mobile splash screen */
.splash-screen {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.splash-logo {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.splash-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
}

.splash-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  text-align: center;
  margin-bottom: 2rem;
}

.splash-loading {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Hide splash screen when app loads */
.splash-screen.hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease-out;
}

/* Tablet optimizations */
@media (min-width: 768px) {
  .splash-logo {
    font-size: 6rem;
  }
  
  .splash-title {
    font-size: 3rem;
  }
  
  .splash-subtitle {
    font-size: 1.25rem;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .splash-screen {
    background-image: 
      radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .splash-screen {
    background: linear-gradient(135deg, #065F46 0%, #047857 100%);
  }
}`;
  }

  /**
   * Generate PWA utilities
   */
  private generatePWAUtilities(): string {
    return `/**
 * PWA Utilities for Clear Piggy Mobile
 * Handles installation, updates, and offline functionality
 */

export interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
}

export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: any = null;
  private updateAvailable = false;
  private listeners: Map<string, Function[]> = new Map();

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.emit('installable', true);
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.emit('installed', true);
    });

    // Service worker update
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.emit('updated', true);
      });
    }

    // Online/offline status
    window.addEventListener('online', () => this.emit('online', true));
    window.addEventListener('offline', () => this.emit('offline', true));
  }

  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  }

  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  async checkForUpdates(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return this.updateAvailable;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }

  async reloadToUpdate(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
    
    window.location.reload();
  }

  getStatus(): PWAStatus {
    return {
      isInstalled: this.isInstalled(),
      isInstallable: this.isInstallable(),
      isUpdateAvailable: this.updateAvailable,
      isOffline: !navigator.onLine
    };
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// React hook for PWA functionality
export function usePWA() {
  const [status, setStatus] = React.useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isUpdateAvailable: false,
    isOffline: false
  });

  const pwaManager = React.useMemo(() => PWAManager.getInstance(), []);

  React.useEffect(() => {
    const updateStatus = () => {
      setStatus(pwaManager.getStatus());
    };

    // Initial status
    updateStatus();

    // Listen for changes
    pwaManager.on('installable', updateStatus);
    pwaManager.on('installed', updateStatus);
    pwaManager.on('updated', updateStatus);
    pwaManager.on('online', updateStatus);
    pwaManager.on('offline', updateStatus);

    return () => {
      pwaManager.off('installable', updateStatus);
      pwaManager.off('installed', updateStatus);
      pwaManager.off('updated', updateStatus);
      pwaManager.off('online', updateStatus);
      pwaManager.off('offline', updateStatus);
    };
  }, [pwaManager]);

  const install = React.useCallback(() => {
    return pwaManager.install();
  }, [pwaManager]);

  const update = React.useCallback(() => {
    return pwaManager.reloadToUpdate();
  }, [pwaManager]);

  const checkForUpdates = React.useCallback(() => {
    return pwaManager.checkForUpdates();
  }, [pwaManager]);

  return {
    ...status,
    install,
    update,
    checkForUpdates
  };
}

// Offline storage utilities
export class OfflineStorage {
  private dbName = 'clear-piggy-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('date', 'date');
          transactionStore.createIndex('account', 'accountId');
        }
        
        if (!db.objectStoreNames.contains('sync-queue')) {
          db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async storeOfflineTransaction(transaction: any): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(['sync-queue'], 'readwrite');
    const store = tx.objectStore('sync-queue');
    
    await store.add({
      type: 'transaction',
      data: transaction,
      timestamp: Date.now()
    });
  }

  async getOfflineTransactions(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['sync-queue'], 'readonly');
      const store = tx.objectStore('sync-queue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items = request.result.filter(item => item.type === 'transaction');
        resolve(items.map(item => item.data));
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(['sync-queue'], 'readwrite');
    const store = tx.objectStore('sync-queue');
    await store.clear();
  }
}

export const offlineStorage = new OfflineStorage();`;
  }

  /**
   * Generate Web Vitals monitoring setup
   */
  private generateWebVitalsMonitoring(): string {
    return `/**
 * Web Vitals Monitoring for Clear Piggy Mobile
 * Tracks Core Web Vitals and custom performance metrics
 */

import { onCLS, onFCP, onFID, onLCP, onTTFB, Metric } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
}

interface CustomMetrics {
  appLoadTime: number;
  routeChangeTime: number;
  apiResponseTime: number;
  componentRenderTime: number;
  memoryUsage: number;
}

export class WebVitalsMonitor {
  private static instance: WebVitalsMonitor;
  private metrics: PerformanceMetric[] = [];
  private customMetrics: Partial<CustomMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private startTime = performance.now();

  static getInstance(): WebVitalsMonitor {
    if (!WebVitalsMonitor.instance) {
      WebVitalsMonitor.instance = new WebVitalsMonitor();
    }
    return WebVitalsMonitor.instance;
  }

  constructor() {
    this.initWebVitals();
    this.initCustomMetrics();
  }

  private initWebVitals(): void {
    // Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onFID(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
  }

  private initCustomMetrics(): void {
    // App load time
    window.addEventListener('load', () => {
      this.customMetrics.appLoadTime = performance.now() - this.startTime;
      this.reportCustomMetric('appLoadTime', this.customMetrics.appLoadTime);
    });

    // Memory usage monitoring
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.customMetrics.memoryUsage = memory.usedJSHeapSize;
        this.reportCustomMetric('memoryUsage', memory.usedJSHeapSize);
      }, 30000); // Every 30 seconds
    }

    // Navigation timing
    this.observeNavigationTiming();
    
    // Resource timing
    this.observeResourceTiming();
    
    // Long tasks
    this.observeLongTasks();
  }

  private observeNavigationTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              
              // DNS lookup time
              this.reportCustomMetric('dnsLookup', navEntry.domainLookupEnd - navEntry.domainLookupStart);
              
              // Connection time
              this.reportCustomMetric('connection', navEntry.connectEnd - navEntry.connectStart);
              
              // Server response time
              this.reportCustomMetric('serverResponse', navEntry.responseEnd - navEntry.requestStart);
              
              // DOM processing time
              this.reportCustomMetric('domProcessing', navEntry.domContentLoadedEventEnd - navEntry.domLoading);
            }
          }
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }
    }
  }

  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track API response times
            if (resourceEntry.name.includes('/api/')) {
              const responseTime = resourceEntry.responseEnd - resourceEntry.requestStart;
              this.reportCustomMetric('apiResponseTime', responseTime, resourceEntry.name);
            }
            
            // Track image load times
            if (resourceEntry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
              const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
              this.reportCustomMetric('imageLoadTime', loadTime, resourceEntry.name);
            }
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Resource timing observer not supported:', error);
      }
    }
  }

  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Report long tasks that block the main thread
            this.reportCustomMetric('longTask', entry.duration, entry.name);
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  private handleMetric(metric: Metric): void {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    };

    this.metrics.push(performanceMetric);
    this.sendMetricToAnalytics(performanceMetric);
    
    // Log poor performance
    if (this.isMetricPoor(metric)) {
      console.warn(`Poor ${metric.name} performance:`, metric.value);
    }
  }

  private reportCustomMetric(name: string, value: number, url?: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      delta: value,
      id: `${name}-${Date.now()}`,
      timestamp: Date.now(),
      url: url || window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    };

    this.metrics.push(metric);
    this.sendMetricToAnalytics(metric);
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || connection.type : 'unknown';
  }

  private isMetricPoor(metric: Metric): boolean {
    const thresholds = {
      CLS: 0.25,
      FCP: 3000,
      FID: 300,
      LCP: 4000,
      TTFB: 2000
    };
    
    return metric.value > (thresholds[metric.name as keyof typeof thresholds] || Infinity);
  }

  private async sendMetricToAnalytics(metric: PerformanceMetric): Promise<void> {
    try {
      // Send to your analytics service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metric)
        });
      }
    } catch (error) {
      console.warn('Failed to send metric to analytics:', error);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { values: number[]; avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { values: [], avg: 0, min: Infinity, max: 0, count: 0 };
      }
      
      summary[metric.name].values.push(metric.value);
      summary[metric.name].min = Math.min(summary[metric.name].min, metric.value);
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.value);
      summary[metric.name].count++;
    });
    
    // Calculate averages
    Object.keys(summary).forEach(name => {
      const values = summary[name].values;
      summary[name].avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      delete (summary[name] as any).values; // Remove values array from final result
    });
    
    return summary;
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.customMetrics = {};
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// React hook for Web Vitals
export function useWebVitals() {
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = React.useState<Record<string, any>>({});
  
  const monitor = React.useMemo(() => WebVitalsMonitor.getInstance(), []);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
      setSummary(monitor.getMetricsSummary());
    }, 5000); // Update every 5 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [monitor]);
  
  return {
    metrics,
    summary,
    clearMetrics: () => monitor.clearMetrics()
  };
}

// Initialize monitoring
export const webVitalsMonitor = WebVitalsMonitor.getInstance();`;
  }

  /**
   * Generate performance dashboard component
   */
  private generatePerformanceDashboard(): string {
    return `import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebVitals } from '../utils/web-vitals';
import { usePWA } from '../utils/pwa-utils';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold: number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, threshold, description, trend }) => {
  const isGood = value <= threshold;
  const status = isGood ? 'good' : 'poor';
  
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    poor: 'text-red-600 bg-red-50 border-red-200'
  };
  
  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };
  
  return (
    <motion.div
      className={`p-4 rounded-lg border-2 ${statusColors[status]} transition-all duration-200`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        {trend && (
          <span className="text-lg" title={`Trend: ${trend}`}>
            {trendIcons[trend]}
          </span>
        )}
      </div>
      
      <div className="flex items-baseline space-x-1 mb-2">
        <span className="text-2xl font-bold">
          {value < 1000 ? value.toFixed(0) : (value / 1000).toFixed(1)}
        </span>
        <span className="text-sm opacity-75">
          {value < 1000 ? unit : unit === 'ms' ? 's' : 'K' + unit}
        </span>
      </div>
      
      <p className="text-xs opacity-75 mb-2">{description}</p>
      
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isGood ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, (value / (threshold * 2)) * 100)}%` }}
          />
        </div>
        <span className="text-xs opacity-60">
          ≤{threshold}{unit}
        </span>
      </div>
    </motion.div>
  );
};

interface CacheInfoProps {
  name: string;
  size: number;
  entries: number;
  onClear: () => void;
}

const CacheInfo: React.FC<CacheInfoProps> = ({ name, size, entries, onClear }) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <h4 className="font-medium text-sm text-gray-900">{name}</h4>
        <p className="text-xs text-gray-600">
          {entries} entries • {formatSize(size)}
        </p>
      </div>
      <button
        onClick={onClear}
        className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
      >
        Clear
      </button>
    </div>
  );
};

const PerformanceDashboard: React.FC = () => {
  const { metrics, summary, clearMetrics } = useWebVitals();
  const { isInstalled, isInstallable, isUpdateAvailable, isOffline, install, update } = usePWA();
  const [cacheInfo, setCacheInfo] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Load cache information
    loadCacheInfo();
  }, []);
  
  const loadCacheInfo = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const info = [];
        
        for (const name of cacheNames.filter(n => n.startsWith('clear-piggy-'))) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          
          let totalSize = 0;
          for (const key of keys) {
            const response = await cache.match(key);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          }
          
          info.push({ name, size: totalSize, entries: keys.length });
        }
        
        setCacheInfo(info);
      }
    } catch (error) {
      console.error('Failed to load cache info:', error);
    }
  };
  
  const clearCache = async (cacheName: string) => {
    try {
      await caches.delete(cacheName);
      await loadCacheInfo();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };
  
  const clearAllCaches = async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith('clear-piggy-'))
          .map(name => caches.delete(name))
      );
      await loadCacheInfo();
    } catch (error) {
      console.error('Failed to clear all caches:', error);
    }
  };
  
  // Toggle dashboard visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        title="Open Performance Dashboard (Ctrl+Shift+P)"
      >
        📊
      </button>
    );
  }
  
  const coreMetrics = {
    CLS: { threshold: 0.1, description: 'Visual stability of page elements' },
    FCP: { threshold: 1800, description: 'Time to first visual content' },
    FID: { threshold: 100, description: 'Input responsiveness' },
    LCP: { threshold: 2500, description: 'Loading performance' },
    TTFB: { threshold: 800, description: 'Server response time' }
  };
  
  return (
    <motion.div
      className="fixed inset-4 bg-white rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Performance Dashboard</h2>
          <p className="text-blue-100 text-sm">Real-time performance monitoring</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isOffline && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
              Offline
            </span>
          )}
          
          {isUpdateAvailable && (
            <button
              onClick={update}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Update Available
            </button>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Core Web Vitals */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            🎯 Core Web Vitals
            <button
              onClick={clearMetrics}
              className="ml-auto px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              Clear Metrics
            </button>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(coreMetrics).map(([metric, config]) => {
              const metricData = summary[metric];
              if (!metricData) return null;
              
              return (
                <MetricCard
                  key={metric}
                  title={metric}
                  value={metricData.avg}
                  unit={metric === 'CLS' ? '' : 'ms'}
                  threshold={config.threshold}
                  description={config.description}
                />
              );
            })}
          </div>
        </section>
        
        {/* PWA Status */}
        <section>
          <h3 className="text-lg font-semibold mb-4">📱 PWA Status</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg text-center ${
              isInstalled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
            }`}>
              <div className="text-2xl mb-1">{isInstalled ? '✅' : '📱'}</div>
              <div className="text-sm font-medium">Installed</div>
            </div>
            
            <div className={`p-3 rounded-lg text-center ${
              isInstallable ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
            }`}>
              <div className="text-2xl mb-1">{isInstallable ? '⬇️' : '🚫'}</div>
              <div className="text-sm font-medium">Installable</div>
              {isInstallable && (
                <button
                  onClick={install}
                  className="mt-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                >
                  Install
                </button>
              )}
            </div>
            
            <div className={`p-3 rounded-lg text-center ${
              !isOffline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="text-2xl mb-1">{!isOffline ? '🌐' : '📴'}</div>
              <div className="text-sm font-medium">{!isOffline ? 'Online' : 'Offline'}</div>
            </div>
            
            <div className={`p-3 rounded-lg text-center ${
              isUpdateAvailable ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
            }`}>
              <div className="text-2xl mb-1">{isUpdateAvailable ? '🔄' : '✅'}</div>
              <div className="text-sm font-medium">Up to Date</div>
            </div>
          </div>
        </section>
        
        {/* Cache Management */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            🗂️ Cache Management
            <button
              onClick={clearAllCaches}
              className="ml-auto px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
            >
              Clear All Caches
            </button>
          </h3>
          
          <div className="space-y-2">
            {cacheInfo.length > 0 ? (
              cacheInfo.map((cache, index) => (
                <CacheInfo
                  key={index}
                  name={cache.name}
                  size={cache.size}
                  entries={cache.entries}
                  onClear={() => clearCache(cache.name)}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No caches found</p>
            )}
          </div>
        </section>
        
        {/* Performance Tips */}
        <section>
          <h3 className="text-lg font-semibold mb-4">💡 Performance Tips</h3>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Use Ctrl+Shift+P to toggle this dashboard</li>
              <li>• Clear metrics regularly to see fresh performance data</li>
              <li>• Install the PWA for better performance and offline access</li>
              <li>• Monitor Core Web Vitals to ensure good user experience</li>
              <li>• Clear caches if you notice stale data or performance issues</li>
            </ul>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default PerformanceDashboard;`;
  }

}`;
  }

Now let me continue with the remaining methods and create the CLI interface:

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create React performance optimization agent types and interfaces", "status": "completed", "activeForm": "Created React performance optimization agent types and interfaces"}, {"content": "Build performance analysis utilities", "status": "completed", "activeForm": "Built performance analysis utilities"}, {"content": "Implement bundle size and code splitting analysis", "status": "completed", "activeForm": "Implemented bundle size and code splitting analysis"}, {"content": "Create image optimization utilities", "status": "completed", "activeForm": "Created image optimization utilities"}, {"content": "Build main performance optimization agent", "status": "completed", "activeForm": "Built main performance optimization agent"}, {"content": "Create CLI interface for performance agent", "status": "in_progress", "activeForm": "Creating CLI interface for performance agent"}, {"content": "Add remaining helper methods to performance agent", "status": "pending", "activeForm": "Adding remaining helper methods to performance agent"}]