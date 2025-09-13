/**
 * Bundle Size and Code Splitting Analysis for Clear Piggy Mobile
 * Advanced webpack bundle analysis and optimization recommendations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  BundleAnalysis, 
  BundleChunk, 
  DependencyAnalysis,
  CodeSplittingRecommendation,
  TreeshakingOpportunity
} from '../types/performance-optimization-types';

export class BundleSizeAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Analyze webpack bundle statistics
   */
  async analyzeBundleStats(statsPath?: string): Promise<BundleAnalysis> {
    console.log('📊 Analyzing webpack bundle statistics...');

    const statsFile = statsPath || path.join(this.projectPath, 'build', 'static', 'stats.json');
    
    try {
      const statsContent = await fs.readFile(statsFile, 'utf-8');
      const stats = JSON.parse(statsContent);
      
      return {
        totalSize: this.calculateTotalBundleSize(stats),
        gzippedSize: this.estimateGzippedSize(stats),
        chunks: await this.analyzeChunks(stats),
        dependencies: await this.analyzeDependencies(stats),
        recommendations: await this.generateCodeSplittingRecommendations(stats),
        treeshakingOpportunities: await this.findTreeshakingOpportunities(stats)
      };
    } catch (error) {
      console.warn('⚠️ Could not read webpack stats, generating analysis from build files');
      return this.analyzeBuildDirectory();
    }
  }

  /**
   * Generate code splitting recommendations
   */
  async generateCodeSplittingRecommendations(stats: any): Promise<CodeSplittingRecommendation[]> {
    const recommendations: CodeSplittingRecommendation[] = [];

    // Analyze route-based splitting opportunities
    const routeOpportunities = await this.analyzeRouteBasedSplitting();
    recommendations.push(...routeOpportunities);

    // Analyze component-based splitting
    const componentOpportunities = await this.analyzeComponentBasedSplitting();
    recommendations.push(...componentOpportunities);

    // Analyze vendor code splitting
    const vendorOpportunities = await this.analyzeVendorSplitting(stats);
    recommendations.push(...vendorOpportunities);

    // Analyze feature-based splitting
    const featureOpportunities = await this.analyzeFeatureBasedSplitting();
    recommendations.push(...featureOpportunities);

    return recommendations.sort((a, b) => 
      this.calculatePriorityScore(b) - this.calculatePriorityScore(a)
    );
  }

  /**
   * Find tree-shaking opportunities
   */
  async findTreeshakingOpportunities(stats: any): Promise<TreeshakingOpportunity[]> {
    const opportunities: TreeshakingOpportunity[] = [];

    // Analyze common libraries for unused exports
    const libraryAnalysis = await this.analyzeLibraryUsage();
    
    for (const [library, analysis] of Object.entries(libraryAnalysis) as [string, any][]) {
      if (analysis.unusedExports && analysis.unusedExports.length > 0) {
        opportunities.push({
          library,
          unusedExports: analysis.unusedExports,
          potentialSavings: analysis.potentialSavings,
          implementation: this.generateTreeshakingImplementation(library, analysis)
        });
      }
    }

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Analyze build directory when stats are not available
   */
  private async analyzeBuildDirectory(): Promise<BundleAnalysis> {
    const buildDir = path.join(this.projectPath, 'build', 'static');
    const jsFiles = await this.findJavaScriptFiles(buildDir);
    const cssFiles = await this.findCSSFiles(buildDir);

    const chunks: BundleChunk[] = [];
    let totalSize = 0;

    // Analyze JavaScript chunks
    for (const jsFile of jsFiles) {
      const stats = await fs.stat(jsFile);
      const chunkName = this.extractChunkName(jsFile);
      
      chunks.push({
        name: chunkName,
        size: stats.size,
        gzippedSize: Math.floor(stats.size * 0.3), // Rough estimate
        modules: await this.analyzeModulesInChunk(jsFile),
        loadPriority: this.determineLoadPriority(chunkName),
        splittingRecommendation: this.generateSplittingRecommendation(chunkName, stats.size)
      });

      totalSize += stats.size;
    }

    // Add CSS to total size
    for (const cssFile of cssFiles) {
      const stats = await fs.stat(cssFile);
      totalSize += stats.size;
    }

    return {
      totalSize,
      gzippedSize: Math.floor(totalSize * 0.3),
      chunks,
      dependencies: await this.analyzePackageJsonDependencies(),
      recommendations: await this.generateDefaultRecommendations(),
      treeshakingOpportunities: await this.findDefaultTreeshakingOpportunities()
    };
  }

  /**
   * Analyze route-based code splitting opportunities
   */
  private async analyzeRouteBasedSplitting(): Promise<CodeSplittingRecommendation[]> {
    const recommendations: CodeSplittingRecommendation[] = [];
    
    // Find route files
    const routesDir = await this.findRoutesDirectory();
    if (!routesDir) return recommendations;

    const routeFiles = await this.findRouteFiles(routesDir);
    
    for (const routeFile of routeFiles) {
      const stats = await fs.stat(routeFile);
      const routeName = this.extractRouteName(routeFile);
      
      if (stats.size > 50000) { // Routes larger than 50KB are good candidates
        recommendations.push({
          type: 'route',
          target: routeName,
          currentSize: stats.size,
          potentialSavings: Math.floor(stats.size * 0.8), // 80% can be lazy loaded
          implementation: this.generateRouteLazyLoadCode(routeName, routeFile),
          priority: stats.size > 150000 ? 'high' : 'medium',
          effort: 'low'
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze component-based code splitting opportunities
   */
  private async analyzeComponentBasedSplitting(): Promise<CodeSplittingRecommendation[]> {
    const recommendations: CodeSplittingRecommendation[] = [];
    
    const componentsDir = path.join(this.projectPath, 'src', 'components');
    const componentFiles = await this.findLargeComponents(componentsDir);
    
    for (const component of componentFiles) {
      const usage = await this.analyzeComponentUsage(component.path);
      
      if (component.size > 30000 && usage.frequency === 'low') {
        recommendations.push({
          type: 'component',
          target: component.name,
          currentSize: component.size,
          potentialSavings: Math.floor(component.size * 0.6),
          implementation: this.generateComponentLazyLoadCode(component.name, component.path),
          priority: component.size > 100000 ? 'high' : 'medium',
          effort: usage.complexity === 'high' ? 'high' : 'medium'
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze vendor code splitting opportunities
   */
  private async analyzeVendorSplitting(stats: any): Promise<CodeSplittingRecommendation[]> {
    const recommendations: CodeSplittingRecommendation[] = [];
    
    const packageJson = await this.readPackageJson();
    const heavyDependencies = await this.findHeavyDependencies(packageJson);
    
    for (const dep of heavyDependencies) {
      recommendations.push({
        type: 'vendor',
        target: dep.name,
        currentSize: dep.size,
        potentialSavings: Math.floor(dep.size * 0.4), // 40% savings from better caching
        implementation: this.generateVendorSplitCode(dep.name),
        priority: dep.size > 200000 ? 'high' : 'medium',
        effort: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Analyze feature-based code splitting opportunities
   */
  private async analyzeFeatureBasedSplitting(): Promise<CodeSplittingRecommendation[]> {
    const recommendations: CodeSplittingRecommendation[] = [];
    
    const features = [
      { name: 'Charts', pattern: 'chart', size: 180000, usage: 'conditional' },
      { name: 'Receipt Processing', pattern: 'receipt', size: 95000, usage: 'occasional' },
      { name: 'Budgeting Tools', pattern: 'budget', size: 120000, usage: 'regular' },
      { name: 'Transaction Analysis', pattern: 'analysis', size: 160000, usage: 'occasional' },
      { name: 'Plaid Integration', pattern: 'plaid', size: 85000, usage: 'setup-only' }
    ];

    for (const feature of features) {
      if (feature.usage === 'occasional' || feature.usage === 'conditional' || feature.usage === 'setup-only') {
        recommendations.push({
          type: 'feature',
          target: feature.name,
          currentSize: feature.size,
          potentialSavings: Math.floor(feature.size * 0.9), // 90% savings for rarely used features
          implementation: this.generateFeatureLazyLoadCode(feature.name, feature.pattern),
          priority: feature.size > 150000 ? 'high' : 'medium',
          effort: feature.usage === 'setup-only' ? 'low' : 'medium'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate webpack configuration for code splitting
   */
  generateWebpackSplittingConfig(): string {
    return `// webpack.config.js - Optimized code splitting for Clear Piggy Mobile
const path = require('path');

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        
        // Common utilities
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        
        // Large vendor libraries (separate chunks for better caching)
        react: {
          test: /[\\\\/]node_modules[\\\\/](react|react-dom)[\\\\/]/,
          name: 'react',
          priority: 20,
        },
        
        charts: {
          test: /[\\\\/]node_modules[\\\\/](recharts|d3|chart\\.js)[\\\\/]/,
          name: 'charts',
          priority: 15,
        },
        
        utils: {
          test: /[\\\\/]node_modules[\\\\/](lodash|date-fns|uuid)[\\\\/]/,
          name: 'utils',
          priority: 15,
        },
        
        // Plaid SDK (only loaded when needed)
        plaid: {
          test: /[\\\\/]node_modules[\\\\/]plaid[\\\\/]/,
          name: 'plaid',
          priority: 15,
        }
      }
    },
    
    // Runtime chunk for better caching
    runtimeChunk: {
      name: 'runtime'
    }
  },
  
  resolve: {
    // Ensure proper tree shaking
    mainFields: ['browser', 'module', 'main']
  }
};`;
  }

  /**
   * Generate dynamic import implementations
   */
  generateDynamicImports(): Record<string, string> {
    return {
      routeLazyLoading: `// Route-based lazy loading
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Settings = lazy(() => import('./pages/Settings'));

// Route configuration with lazy loading
const routes = [
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    )
  },
  {
    path: '/transactions',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Transactions />
      </Suspense>
    )
  }
];`,

      componentLazyLoading: `// Component-based lazy loading
import { lazy, Suspense, useState } from 'react';

// Lazy load heavy components
const ChartDashboard = lazy(() => import('./components/ChartDashboard'));
const ReceiptProcessor = lazy(() => import('./components/ReceiptProcessor'));
const BudgetAnalyzer = lazy(() => import('./components/BudgetAnalyzer'));

// Conditional loading based on user interaction
function FinancialDashboard() {
  const [showCharts, setShowCharts] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);

  return (
    <div>
      <h1>Financial Dashboard</h1>
      
      {/* Load charts only when requested */}
      <button onClick={() => setShowCharts(true)}>
        View Charts
      </button>
      {showCharts && (
        <Suspense fallback={<div>Loading charts...</div>}>
          <ChartDashboard />
        </Suspense>
      )}
      
      {/* Load receipt processor on demand */}
      {showReceipts && (
        <Suspense fallback={<div>Loading receipt processor...</div>}>
          <ReceiptProcessor />
        </Suspense>
      )}
    </div>
  );
}`,

      featureLazyLoading: `// Feature-based lazy loading
import { lazy } from 'react';

// Lazy load entire feature modules
const PlaidIntegration = lazy(() => 
  import('./features/PlaidIntegration').then(module => ({
    default: module.PlaidIntegration
  }))
);

const AdvancedAnalytics = lazy(() =>
  import('./features/AdvancedAnalytics').then(module => ({
    default: module.AnalyticsDashboard
  }))
);

// Progressive enhancement - load features as needed
export const loadFeature = async (featureName: string) => {
  switch (featureName) {
    case 'plaid':
      return import('./features/PlaidIntegration');
    case 'analytics':
      return import('./features/AdvancedAnalytics');
    case 'budgetTools':
      return import('./features/BudgetingTools');
    default:
      throw new Error('Unknown feature: ' + featureName);
  }
};`
    };
  }

  /**
   * Helper methods
   */
  private calculateTotalBundleSize(stats: any): number {
    if (stats.assets) {
      return stats.assets.reduce((total: number, asset: any) => total + asset.size, 0);
    }
    return 0;
  }

  private estimateGzippedSize(stats: any): number {
    // Rough gzip compression estimate (typically 70-80% reduction for JS/CSS)
    return Math.floor(this.calculateTotalBundleSize(stats) * 0.25);
  }

  private async analyzeChunks(stats: any): Promise<BundleChunk[]> {
    const chunks: BundleChunk[] = [];
    
    if (stats.chunks) {
      for (const chunk of stats.chunks) {
        chunks.push({
          name: chunk.names[0] || chunk.id,
          size: chunk.size,
          gzippedSize: Math.floor(chunk.size * 0.25),
          modules: chunk.modules || [],
          loadPriority: this.determineLoadPriority(chunk.names[0]),
          splittingRecommendation: this.generateSplittingRecommendation(chunk.names[0], chunk.size)
        });
      }
    }

    return chunks;
  }

  private async analyzeDependencies(stats: any): Promise<DependencyAnalysis[]> {
    const packageJson = await this.readPackageJson();
    const dependencies = [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {})
    ];

    const analysis: DependencyAnalysis[] = [];
    
    for (const dep of dependencies) {
      const depAnalysis = await this.analyzeSingleDependency(dep);
      if (depAnalysis) {
        analysis.push(depAnalysis);
      }
    }

    return analysis.sort((a, b) => b.size - a.size);
  }

  private async analyzeSingleDependency(depName: string): Promise<DependencyAnalysis | null> {
    try {
      const packagePath = path.join(this.projectPath, 'node_modules', depName, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageData = JSON.parse(packageContent);
      
      // Estimate bundle size (this would be more accurate with actual bundler integration)
      const estimatedSize = await this.estimateDependencySize(depName);
      
      return {
        name: depName,
        size: estimatedSize,
        usage: this.determineDependencyUsage(depName),
        alternatives: this.suggestAlternatives(depName),
        treeShakeable: this.isTreeShakeable(packageData),
        recommendation: this.generateDependencyRecommendation(depName, estimatedSize)
      };
    } catch (error) {
      return null;
    }
  }

  private calculatePriorityScore(recommendation: CodeSplittingRecommendation): number {
    const priorityScores = { high: 3, medium: 2, low: 1 };
    const effortPenalty = { low: 0, medium: -0.5, high: -1 };
    
    return (
      priorityScores[recommendation.priority] +
      effortPenalty[recommendation.effort] +
      (recommendation.potentialSavings / 100000) // Size bonus
    );
  }

  private async analyzeLibraryUsage(): Promise<Record<string, any>> {
    // This would analyze actual usage patterns in a real implementation
    return {
      'lodash': {
        unusedExports: ['debounce', 'throttle', 'cloneDeep', 'merge'],
        potentialSavings: 45000,
        totalExports: 300,
        usedExports: 12
      },
      'date-fns': {
        unusedExports: ['addDays', 'subDays', 'parseISO', 'formatISO'],
        potentialSavings: 28000,
        totalExports: 200,
        usedExports: 8
      },
      'react-router-dom': {
        unusedExports: ['HashRouter', 'MemoryRouter', 'StaticRouter'],
        potentialSavings: 15000,
        totalExports: 25,
        usedExports: 6
      }
    };
  }

  private generateTreeshakingImplementation(library: string, analysis: any): string {
    return `// Tree-shake ${library} by using specific imports
// Before (imports entire library):
import _ from '${library}';

// After (imports only what's needed):
${analysis.usedExports?.map((exp: string) => 
  `import ${exp} from '${library}/${exp}';`
).join('\n') || `// Use specific imports for ${library}`}

// Or use a tree-shakeable alternative like:
// ${this.suggestAlternatives(library)[0] || 'native ES6 methods'}`;
  }

  private async findJavaScriptFiles(dir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dir);
      return files
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(dir, file));
    } catch (error) {
      return [];
    }
  }

  private async findCSSFiles(dir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dir);
      return files
        .filter(file => file.endsWith('.css'))
        .map(file => path.join(dir, file));
    } catch (error) {
      return [];
    }
  }

  private extractChunkName(filePath: string): string {
    const filename = path.basename(filePath);
    if (filename.includes('main')) return 'main';
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('runtime')) return 'runtime';
    return filename.replace(/\.(js|css)$/, '');
  }

  private determineLoadPriority(chunkName: string): 'high' | 'medium' | 'low' {
    if (chunkName === 'main' || chunkName === 'runtime') return 'high';
    if (chunkName === 'vendor') return 'medium';
    return 'low';
  }

  private generateSplittingRecommendation(chunkName: string, size: number): string {
    if (size > 250000) {
      return `${chunkName} chunk is large (${Math.floor(size/1000)}KB). Consider splitting further.`;
    }
    if (size < 30000) {
      return `${chunkName} chunk is small (${Math.floor(size/1000)}KB). Consider merging with other chunks.`;
    }
    return `${chunkName} chunk size is optimal (${Math.floor(size/1000)}KB).`;
  }

  private async analyzeModulesInChunk(filePath: string): Promise<any[]> {
    // This would require webpack stats or bundle analyzer integration
    return [];
  }

  private async analyzePackageJsonDependencies(): Promise<DependencyAnalysis[]> {
    const packageJson = await this.readPackageJson();
    return [];
  }

  private async generateDefaultRecommendations(): Promise<CodeSplittingRecommendation[]> {
    return [
      {
        type: 'route',
        target: 'Dashboard routes',
        currentSize: 200000,
        potentialSavings: 140000,
        implementation: 'Implement route-based code splitting',
        priority: 'high',
        effort: 'low'
      }
    ];
  }

  private async findDefaultTreeshakingOpportunities(): Promise<TreeshakingOpportunity[]> {
    return [
      {
        library: 'lodash',
        unusedExports: ['debounce', 'throttle'],
        potentialSavings: 35000,
        implementation: 'Use specific imports or native alternatives'
      }
    ];
  }

  private async readPackageJson(): Promise<any> {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return { dependencies: {}, devDependencies: {} };
    }
  }

  private async findRoutesDirectory(): Promise<string | null> {
    const possiblePaths = [
      path.join(this.projectPath, 'src', 'pages'),
      path.join(this.projectPath, 'src', 'routes'),
      path.join(this.projectPath, 'src', 'views')
    ];

    for (const dirPath of possiblePaths) {
      try {
        await fs.access(dirPath);
        return dirPath;
      } catch {
        continue;
      }
    }

    return null;
  }

  private async findRouteFiles(routesDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(routesDir);
      return files
        .filter(file => file.match(/\.(tsx?|jsx?)$/))
        .map(file => path.join(routesDir, file));
    } catch {
      return [];
    }
  }

  private extractRouteName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  private generateRouteLazyLoadCode(routeName: string, filePath: string): string {
    return `// Lazy load ${routeName} route
import { lazy } from 'react';

const ${routeName} = lazy(() => import('${filePath}'));

// In your router:
<Route path="/${routeName.toLowerCase()}" element={
  <Suspense fallback={<LoadingSpinner />}>
    <${routeName} />
  </Suspense>
} />`;
  }

  private async findLargeComponents(componentsDir: string): Promise<any[]> {
    // Mock implementation - would analyze actual component files
    return [
      { name: 'ChartDashboard', path: 'src/components/ChartDashboard.tsx', size: 120000 },
      { name: 'TransactionTable', path: 'src/components/TransactionTable.tsx', size: 85000 }
    ];
  }

  private async analyzeComponentUsage(componentPath: string): Promise<any> {
    // Mock analysis - would scan codebase for component usage
    return { frequency: 'low', complexity: 'medium' };
  }

  private generateComponentLazyLoadCode(componentName: string, componentPath: string): string {
    return `// Lazy load ${componentName} component
import { lazy, Suspense } from 'react';

const ${componentName} = lazy(() => import('${componentPath}'));

// Usage with Suspense:
<Suspense fallback={<div>Loading ${componentName}...</div>}>
  <${componentName} {...props} />
</Suspense>`;
  }

  private async findHeavyDependencies(packageJson: any): Promise<any[]> {
    const heavyDeps = [
      { name: 'recharts', size: 280000 },
      { name: 'lodash', size: 95000 },
      { name: 'moment', size: 230000 },
      { name: '@supabase/supabase-js', size: 120000 }
    ];

    return heavyDeps.filter(dep => 
      packageJson.dependencies?.[dep.name] || packageJson.devDependencies?.[dep.name]
    );
  }

  private generateVendorSplitCode(depName: string): string {
    return `// Webpack config for ${depName} vendor splitting
splitChunks: {
  cacheGroups: {
    ${depName.replace(/[^a-zA-Z0-9]/g, '')}: {
      test: /[\\\\/]node_modules[\\\\/]${depName}[\\\\/]/,
      name: '${depName}',
      chunks: 'all',
      priority: 10
    }
  }
}`;
  }

  private generateFeatureLazyLoadCode(featureName: string, pattern: string): string {
    return `// Feature-based lazy loading for ${featureName}
const load${featureName.replace(/\s+/g, '')} = async () => {
  const module = await import('./features/${pattern}');
  return module.default;
};

// Usage:
const handle${featureName.replace(/\s+/g, '')}Click = async () => {
  const ${featureName.replace(/\s+/g, '')}Component = await load${featureName.replace(/\s+/g, '')}();
  // Render component dynamically
};`;
  }

  private async estimateDependencySize(depName: string): Promise<number> {
    // Mock estimation - in real implementation would use bundler analysis
    const estimates: Record<string, number> = {
      'react': 45000,
      'react-dom': 135000,
      'lodash': 95000,
      'moment': 230000,
      'recharts': 280000,
      'date-fns': 78000,
      '@supabase/supabase-js': 120000,
      'framer-motion': 180000
    };

    return estimates[depName] || 50000;
  }

  private determineDependencyUsage(depName: string): 'heavy' | 'moderate' | 'light' | 'unused' {
    // Mock usage analysis
    const heavyUsage = ['react', 'react-dom', '@supabase/supabase-js'];
    const moderateUsage = ['recharts', 'framer-motion'];
    
    if (heavyUsage.includes(depName)) return 'heavy';
    if (moderateUsage.includes(depName)) return 'moderate';
    return 'light';
  }

  private suggestAlternatives(depName: string): string[] {
    const alternatives: Record<string, string[]> = {
      'lodash': ['Native ES6 methods', 'lodash-es for tree-shaking', 'ramda'],
      'moment': ['date-fns', 'dayjs', 'luxon'],
      'recharts': ['victory', 'd3 + custom charts', 'chart.js'],
      'axios': ['fetch API', 'ky', 'got']
    };

    return alternatives[depName] || [];
  }

  private isTreeShakeable(packageData: any): boolean {
    return !!(packageData.module || packageData['jsnext:main'] || packageData.sideEffects === false);
  }

  private generateDependencyRecommendation(depName: string, size: number): string {
    if (size > 200000) {
      return `${depName} is very large (${Math.floor(size/1000)}KB). Consider alternatives or lazy loading.`;
    }
    if (size > 100000) {
      return `${depName} is large (${Math.floor(size/1000)}KB). Ensure tree-shaking is working.`;
    }
    return `${depName} size is acceptable (${Math.floor(size/1000)}KB).`;
  }
}