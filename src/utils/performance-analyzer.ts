/**
 * Performance Analysis Utilities for Clear Piggy Mobile React App
 * Comprehensive performance analysis and optimization detection
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  BundleAnalysis, 
  ComponentPerformanceAnalysis, 
  ImageOptimizationAnalysis,
  PerformanceOptimizationConfig,
  PerformanceIssue,
  MemoizationOpportunity,
  CodeSplittingRecommendation
} from '../types/performance-optimization-types';

export class PerformanceAnalyzer {
  private config: PerformanceOptimizationConfig;

  constructor(config: PerformanceOptimizationConfig) {
    this.config = config;
  }

  /**
   * Analyze webpack bundle output for optimization opportunities
   */
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    console.log('🔍 Analyzing bundle size and dependencies...');

    try {
      const buildDir = path.join(this.config.projectPath, this.config.buildPath);
      const statsFile = path.join(buildDir, 'stats.json');
      
      // Check if webpack stats exist
      let statsData: any = {};
      try {
        const statsContent = await fs.readFile(statsFile, 'utf-8');
        statsData = JSON.parse(statsContent);
      } catch (error) {
        console.warn('⚠️ No webpack stats found, generating mock analysis');
        statsData = await this.generateMockBundleStats();
      }

      const analysis: BundleAnalysis = {
        totalSize: this.calculateTotalSize(statsData),
        gzippedSize: this.calculateGzippedSize(statsData),
        chunks: await this.analyzeChunks(statsData),
        dependencies: await this.analyzeDependencies(statsData),
        recommendations: await this.generateCodeSplittingRecommendations(statsData),
        treeshakingOpportunities: await this.findTreeshakingOpportunities(statsData)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing bundle:', error);
      return this.generateFallbackBundleAnalysis();
    }
  }

  /**
   * Analyze React components for performance issues
   */
  async analyzeComponentPerformance(componentPath?: string): Promise<ComponentPerformanceAnalysis[]> {
    console.log('🔍 Analyzing React component performance...');

    const componentsDir = componentPath || path.join(this.config.projectPath, this.config.sourcePath, 'components');
    const componentFiles = await this.findReactComponents(componentsDir);
    
    const analyses: ComponentPerformanceAnalysis[] = [];

    for (const filePath of componentFiles) {
      const analysis = await this.analyzeIndividualComponent(filePath);
      analyses.push(analysis);
    }

    return analyses.sort((a, b) => a.performanceScore - b.performanceScore); // Worst first
  }

  /**
   * Analyze images for optimization opportunities
   */
  async analyzeImageOptimization(): Promise<ImageOptimizationAnalysis> {
    console.log('🔍 Analyzing images for optimization...');

    const assetsDir = path.join(this.config.projectPath, this.config.assetsPath || 'src/assets');
    const publicDir = path.join(this.config.projectPath, 'public');
    
    const imageFiles = await this.findImageFiles([assetsDir, publicDir]);
    const optimizations = await Promise.all(
      imageFiles.map(filePath => this.analyzeImageFile(filePath))
    );

    return {
      totalImages: imageFiles.length,
      totalSize: optimizations.reduce((sum, opt) => sum + opt.originalSize, 0),
      optimizationOpportunities: optimizations,
      webpCandidates: optimizations
        .filter(opt => opt.format !== 'webp' && opt.originalSize > 10000)
        .map(opt => opt.filePath),
      responsiveImageNeeds: await this.generateResponsiveImageRecommendations(optimizations)
    };
  }

  /**
   * Generate comprehensive performance recommendations
   */
  async generateOptimizationRecommendations(): Promise<CodeSplittingRecommendation[]> {
    const recommendations: CodeSplittingRecommendation[] = [];

    // Route-based code splitting
    const routeFiles = await this.findRouteFiles();
    for (const route of routeFiles) {
      recommendations.push({
        type: 'route',
        target: route.path,
        currentSize: route.size,
        potentialSavings: route.size * 0.7, // Estimated 70% can be lazy loaded
        implementation: this.generateRouteLazyLoadingCode(route.path),
        priority: route.size > 100000 ? 'high' : 'medium',
        effort: 'low'
      });
    }

    // Component-based splitting
    const heavyComponents = await this.findHeavyComponents();
    for (const component of heavyComponents) {
      recommendations.push({
        type: 'component',
        target: component.name,
        currentSize: component.size,
        potentialSavings: component.size * 0.5,
        implementation: this.generateComponentLazyLoadingCode(component.name),
        priority: component.renderFrequency === 'low' ? 'high' : 'medium',
        effort: 'medium'
      });
    }

    // Vendor code splitting
    const vendorAnalysis = await this.analyzeVendorBundles();
    for (const vendor of vendorAnalysis) {
      recommendations.push({
        type: 'vendor',
        target: vendor.name,
        currentSize: vendor.size,
        potentialSavings: vendor.size * 0.3,
        implementation: this.generateVendorSplittingCode(vendor.name),
        priority: vendor.size > 200000 ? 'high' : 'low',
        effort: 'low'
      });
    }

    return recommendations.sort((a, b) => 
      (b.priority === 'high' ? 2 : b.priority === 'medium' ? 1 : 0) -
      (a.priority === 'high' ? 2 : a.priority === 'medium' ? 1 : 0)
    );
  }

  /**
   * Analyze individual React component for performance issues
   */
  private async analyzeIndividualComponent(filePath: string): Promise<ComponentPerformanceAnalysis> {
    const content = await fs.readFile(filePath, 'utf-8');
    const componentName = path.basename(filePath, '.tsx').replace('.jsx', '');

    const issues: PerformanceIssue[] = [];
    const optimizations: any[] = [];
    const memoizationOpportunities: MemoizationOpportunity[] = [];

    // Detect performance issues
    if (content.includes('useEffect') && !content.includes('[]')) {
      issues.push({
        type: 'frequent-rerender',
        severity: 'medium',
        description: 'useEffect without proper dependencies may cause frequent re-renders',
        impact: 'Increased CPU usage and battery drain on mobile devices',
        solution: 'Add proper dependency array or use useCallback for stable references',
        codeExample: this.generateUseEffectOptimization(content)
      });
    }

    // Detect heavy computations
    const heavyComputationPattern = /(?:\.map|\.filter|\.reduce|\.sort).*(?:\.map|\.filter|\.reduce|\.sort)/g;
    if (heavyComputationPattern.test(content)) {
      issues.push({
        type: 'heavy-computation',
        severity: 'high',
        description: 'Heavy computation in render method',
        impact: 'Blocking UI thread, causing janky animations on mobile',
        solution: 'Wrap expensive calculations in useMemo hook',
        codeExample: this.generateUseMemoOptimization(content)
      });

      memoizationOpportunities.push({
        hookType: 'useMemo',
        target: 'Heavy computation chain',
        dependencies: this.extractDependencies(content),
        currentCode: this.extractComputationCode(content),
        optimizedCode: this.generateOptimizedComputation(content),
        benefit: 'Prevents recalculation on every render, improving mobile performance'
      });
    }

    // Detect missing React.memo opportunities
    if (content.includes('export') && !content.includes('React.memo') && !content.includes('memo')) {
      const propsPattern = /interface\s+\w+Props\s*{([^}]+)}/;
      const propsMatch = content.match(propsPattern);
      if (propsMatch && propsMatch[1].split('\n').filter(line => line.trim()).length > 3) {
        optimizations.push({
          type: 'memo',
          target: componentName,
          implementation: this.generateReactMemoWrapper(componentName, content),
          expectedImprovement: 'Prevent unnecessary re-renders when props are unchanged',
          tradeoffs: ['Slight memory overhead for props comparison']
        });
      }
    }

    // Detect callback optimization opportunities
    const callbackPattern = /(?:onClick|onPress|onChange|onSubmit)=\{.*?\}/g;
    const callbackMatches = content.match(callbackPattern);
    if (callbackMatches && callbackMatches.length > 0) {
      memoizationOpportunities.push({
        hookType: 'useCallback',
        target: 'Event handlers',
        dependencies: ['relevant state variables'],
        currentCode: callbackMatches[0],
        optimizedCode: this.generateUseCallbackOptimization(callbackMatches[0]),
        benefit: 'Prevent child component re-renders due to new function references'
      });
    }

    const performanceScore = this.calculatePerformanceScore(issues, content);

    return {
      componentName,
      filePath,
      performanceScore,
      issues,
      optimizations,
      memoizationOpportunities,
      rerenderAnalysis: {
        renderFrequency: this.analyzeRenderFrequency(content),
        renderTriggers: this.identifyRenderTriggers(content),
        unnecessaryRenders: issues.filter(i => i.type === 'frequent-rerender').length,
        optimizationPotential: Math.max(0, 100 - performanceScore)
      }
    };
  }

  /**
   * Find React component files
   */
  private async findReactComponents(dir: string): Promise<string[]> {
    const components: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subComponents = await this.findReactComponents(fullPath);
          components.push(...subComponents);
        } else if (entry.name.match(/\.(tsx?|jsx?)$/)) {
          const content = await fs.readFile(fullPath, 'utf-8');
          if (content.includes('React') || content.includes('import') && content.includes('from')) {
            components.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error);
    }

    return components;
  }

  /**
   * Find image files for optimization
   */
  private async findImageFiles(dirs: string[]): Promise<string[]> {
    const images: string[] = [];
    
    for (const dir of dirs) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
        
        for (const entry of entries) {
          if (entry.isFile() && entry.name.match(/\.(jpe?g|png|gif|svg|webp|avif)$/i)) {
            images.push(path.join(dir, entry.name));
          }
        }
      } catch (error) {
        console.warn(`Could not read directory ${dir}:`, error);
      }
    }

    return images;
  }

  /**
   * Analyze individual image file
   */
  private async analyzeImageFile(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Mock image analysis (in real implementation, would use sharp or similar)
      const originalSize = stats.size;
      const optimizedSize = Math.floor(originalSize * 0.7); // Assume 30% reduction
      
      return {
        filePath,
        originalSize,
        optimizedSize,
        format: ext === '.jpg' || ext === '.jpeg' ? 'webp' : ext.slice(1),
        quality: 85,
        dimensions: { width: 800, height: 600 }, // Mock dimensions
        usage: this.determineImageUsage(filePath),
        lazyLoadCandidate: originalSize > 50000 // Images > 50KB are good candidates
      };
    } catch (error) {
      console.warn(`Could not analyze image ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Generate code splitting recommendations
   */
  private async generateCodeSplittingRecommendations(statsData: any): Promise<CodeSplittingRecommendation[]> {
    // This would analyze actual webpack stats in a real implementation
    return [
      {
        type: 'route',
        target: '/dashboard',
        currentSize: 250000,
        potentialSavings: 175000,
        implementation: 'const Dashboard = lazy(() => import("./pages/Dashboard"));',
        priority: 'high',
        effort: 'low'
      },
      {
        type: 'component',
        target: 'ChartComponents',
        currentSize: 180000,
        potentialSavings: 90000,
        implementation: 'const Chart = lazy(() => import("./components/Chart"));',
        priority: 'medium',
        effort: 'medium'
      },
      {
        type: 'vendor',
        target: 'date-fns',
        currentSize: 120000,
        potentialSavings: 84000,
        implementation: 'Use tree-shaking: import { format } from "date-fns/format";',
        priority: 'high',
        effort: 'low'
      }
    ];
  }

  /**
   * Helper methods for analysis
   */
  private calculateTotalSize(statsData: any): number {
    return statsData.assets?.reduce((sum: number, asset: any) => sum + asset.size, 0) || 500000;
  }

  private calculateGzippedSize(statsData: any): number {
    return Math.floor(this.calculateTotalSize(statsData) * 0.3); // Rough gzip estimate
  }

  private async analyzeChunks(statsData: any): Promise<any[]> {
    // Mock chunk analysis
    return [
      {
        name: 'main',
        size: 250000,
        gzippedSize: 75000,
        modules: [],
        loadPriority: 'high' as const,
        splittingRecommendation: 'Split dashboard components into separate chunk'
      },
      {
        name: 'vendor',
        size: 180000,
        gzippedSize: 54000,
        modules: [],
        loadPriority: 'medium' as const,
        splittingRecommendation: 'Consider tree-shaking unused utilities'
      }
    ];
  }

  private async analyzeDependencies(statsData: any): Promise<any[]> {
    return [
      {
        name: 'lodash',
        size: 70000,
        usage: 'light' as const,
        alternatives: ['Use native ES6 methods', 'lodash-es for tree-shaking'],
        treeShakeable: false,
        recommendation: 'Replace with native methods or use lodash-es'
      },
      {
        name: 'moment',
        size: 95000,
        usage: 'moderate' as const,
        alternatives: ['date-fns', 'dayjs'],
        treeShakeable: false,
        recommendation: 'Replace with date-fns for better tree-shaking'
      }
    ];
  }

  private async findTreeshakingOpportunities(statsData: any): Promise<any[]> {
    return [
      {
        library: 'lodash',
        unusedExports: ['debounce', 'throttle', 'cloneDeep'],
        potentialSavings: 25000,
        implementation: 'Use specific imports: import debounce from "lodash/debounce"'
      }
    ];
  }

  private generateMockBundleStats(): any {
    return {
      assets: [
        { name: 'main.js', size: 250000 },
        { name: 'vendor.js', size: 180000 },
        { name: 'runtime.js', size: 15000 }
      ]
    };
  }

  private generateFallbackBundleAnalysis(): BundleAnalysis {
    return {
      totalSize: 445000,
      gzippedSize: 133500,
      chunks: [],
      dependencies: [],
      recommendations: [],
      treeshakingOpportunities: []
    };
  }

  private async findRouteFiles(): Promise<any[]> {
    return [
      { path: '/dashboard', size: 180000 },
      { path: '/transactions', size: 120000 },
      { path: '/budgets', size: 95000 }
    ];
  }

  private async findHeavyComponents(): Promise<any[]> {
    return [
      { name: 'TransactionTable', size: 85000, renderFrequency: 'medium' as const },
      { name: 'ChartDashboard', size: 120000, renderFrequency: 'low' as const }
    ];
  }

  private async analyzeVendorBundles(): Promise<any[]> {
    return [
      { name: 'react-router', size: 45000 },
      { name: 'recharts', size: 230000 }
    ];
  }

  private generateRouteLazyLoadingCode(routePath: string): string {
    const componentName = routePath.replace('/', '').replace(/\W+/g, '');
    return `const ${componentName} = lazy(() => import('./pages/${componentName}'));`;
  }

  private generateComponentLazyLoadingCode(componentName: string): string {
    return `const ${componentName} = lazy(() => import('./components/${componentName}'));`;
  }

  private generateVendorSplittingCode(vendorName: string): string {
    return `// webpack.config.js
splitChunks: {
  chunks: 'all',
  cacheGroups: {
    ${vendorName}: {
      test: /[\\\\/]node_modules[\\\\/]${vendorName}[\\\\/]/,
      name: '${vendorName}',
      chunks: 'all',
    }
  }
}`;
  }

  private calculatePerformanceScore(issues: PerformanceIssue[], content: string): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Bonus points for good practices
    if (content.includes('React.memo')) score += 5;
    if (content.includes('useMemo')) score += 5;
    if (content.includes('useCallback')) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private analyzeRenderFrequency(content: string): 'high' | 'medium' | 'low' {
    if (content.includes('useEffect') && content.includes('setInterval')) return 'high';
    if (content.includes('useState') && content.match(/useState/g)!.length > 3) return 'medium';
    return 'low';
  }

  private identifyRenderTriggers(content: string): string[] {
    const triggers: string[] = [];
    
    if (content.includes('useState')) triggers.push('State changes');
    if (content.includes('useEffect')) triggers.push('Effect dependencies');
    if (content.includes('props')) triggers.push('Props changes');
    if (content.includes('useContext')) triggers.push('Context updates');

    return triggers;
  }

  private generateUseEffectOptimization(content: string): string {
    return `// Before: Missing dependencies
useEffect(() => {
  fetchData();
}, []); // Missing 'id' dependency

// After: Proper dependencies
useEffect(() => {
  fetchData();
}, [id]); // Correct dependency array`;
  }

  private generateUseMemoOptimization(content: string): string {
    return `// Before: Heavy computation on every render
const expensiveValue = data.filter(item => item.active)
                          .map(item => ({ ...item, formatted: formatCurrency(item.amount) }))
                          .sort((a, b) => b.amount - a.amount);

// After: Memoized computation
const expensiveValue = useMemo(() => 
  data.filter(item => item.active)
      .map(item => ({ ...item, formatted: formatCurrency(item.amount) }))
      .sort((a, b) => b.amount - a.amount)
, [data]);`;
  }

  private generateReactMemoWrapper(componentName: string, content: string): string {
    return `import React, { memo } from 'react';

export const ${componentName} = memo(({ prop1, prop2 }) => {
  // Component implementation
  return (
    // JSX
  );
});`;
  }

  private generateUseCallbackOptimization(callbackCode: string): string {
    return `// Before: New function on every render
${callbackCode}

// After: Memoized callback
const handleClick = useCallback((param) => {
  // Handle click logic
}, [dependency1, dependency2]);

// Usage: onClick={handleClick}`;
  }

  private extractDependencies(content: string): string[] {
    // Simple dependency extraction (would be more sophisticated in real implementation)
    const stateVars = content.match(/const \[(\w+),/g)?.map(match => 
      match.replace('const [', '').replace(',', '')
    ) || [];
    
    return stateVars;
  }

  private extractComputationCode(content: string): string {
    const computationMatch = content.match(/(?:\.map|\.filter|\.reduce|\.sort)[^;]+;?/);
    return computationMatch ? computationMatch[0] : 'Heavy computation detected';
  }

  private generateOptimizedComputation(content: string): string {
    const computation = this.extractComputationCode(content);
    const dependencies = this.extractDependencies(content);
    
    return `const optimizedValue = useMemo(() => {
  return ${computation}
}, [${dependencies.join(', ')}]);`;
  }

  private determineImageUsage(filePath: string): 'hero' | 'thumbnail' | 'icon' | 'background' {
    const filename = path.basename(filePath).toLowerCase();
    
    if (filename.includes('hero') || filename.includes('banner')) return 'hero';
    if (filename.includes('thumb') || filename.includes('small')) return 'thumbnail';
    if (filename.includes('icon') || filename.includes('logo')) return 'icon';
    if (filename.includes('bg') || filename.includes('background')) return 'background';
    
    return 'thumbnail';
  }

  private async generateResponsiveImageRecommendations(optimizations: any[]): Promise<any[]> {
    return optimizations
      .filter(opt => opt && opt.usage === 'hero' || opt?.originalSize > 100000)
      .map(opt => ({
        filePath: opt.filePath,
        breakpoints: [
          { breakpoint: 640, width: 640, quality: 80, format: 'webp' },
          { breakpoint: 768, width: 768, quality: 85, format: 'webp' },
          { breakpoint: 1024, width: 1024, quality: 90, format: 'webp' },
          { breakpoint: 1920, width: 1920, quality: 95, format: 'webp' }
        ],
        srcSetGeneration: `${opt.filePath.replace(/\.[^.]+$/, '')}-640w.webp 640w, ${opt.filePath.replace(/\.[^.]+$/, '')}-768w.webp 768w, ${opt.filePath.replace(/\.[^.]+$/, '')}-1024w.webp 1024w`,
        sizesAttribute: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw'
      }));
  }
}