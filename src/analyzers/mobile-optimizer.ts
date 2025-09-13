/**
 * Mobile Optimization Analyzer for Clear Piggy React Components
 * Identifies mobile optimization opportunities and issues
 */

import { 
  ComponentFile, 
  ComponentAnalysisResult, 
  ProjectAnalysisReport, 
  TailwindClass,
  ResponsivenessGap,
  TouchTargetIssue,
  LayoutComplexityMetrics,
  NavigationPatternIssue,
  FinancialComponentAnalysis,
  AnalysisConfig 
} from '../types/analysis';

export class MobileOptimizationAnalyzer {
  private config: AnalysisConfig;

  // Tailwind responsive prefixes
  private responsivePrefixes = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  
  // Touch target classes that might indicate interactive elements
  private interactiveClasses = [
    'cursor-pointer', 'hover:', 'active:', 'focus:', 'button', 'btn', 
    'clickable', 'tap', 'touch', 'interactive'
  ];

  // Financial component patterns
  private financialPatterns = {
    transactionList: ['transaction', 'list', 'history', 'statement'],
    budgetChart: ['chart', 'graph', 'budget', 'spending', 'analytics'],
    dashboardCard: ['card', 'widget', 'summary', 'overview', 'dashboard'],
    form: ['form', 'input', 'field', 'submit', 'validation'],
    navigation: ['nav', 'menu', 'header', 'footer', 'sidebar', 'tab']
  };

  constructor(config: AnalysisConfig) {
    this.config = config;
  }

  /**
   * Analyze a single React component for mobile optimization
   */
  async analyzeComponent(component: ComponentFile): Promise<ComponentAnalysisResult> {
    const tailwindAnalysis = await this.analyzeTailwindClasses(component);
    const touchTargetAnalysis = await this.analyzeTouchTargets(component);
    const layoutAnalysis = await this.analyzeLayoutComplexity(component);
    const navigationAnalysis = await this.analyzeNavigationPatterns(component);
    const financialAnalysis = await this.analyzeFinancialComponent(component);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      tailwindScore: tailwindAnalysis.mobileFirstScore,
      touchTargetScore: touchTargetAnalysis.passRate,
      layoutScore: layoutAnalysis.complexity.mobileOptimizationScore,
      navigationScore: navigationAnalysis.mobileNavScore,
      financialScore: financialAnalysis.financialUXScore,
    });

    const priority = this.determinePriority(overallScore, {
      criticalTouchIssues: touchTargetAnalysis.issues.filter(i => i.severity === 'critical').length,
      criticalNavIssues: navigationAnalysis.issues.filter(i => i.severity === 'critical').length,
      layoutComplexity: layoutAnalysis.complexity.nestingDepth,
    });

    return {
      file: component,
      tailwindAnalysis,
      touchTargetAnalysis,
      layoutAnalysis,
      navigationAnalysis,
      financialAnalysis,
      overallScore,
      priority,
    };
  }

  /**
   * Analyze Tailwind CSS classes for mobile responsiveness
   */
  private async analyzeTailwindClasses(component: ComponentFile): Promise<{
    classes: TailwindClass[];
    responsivenessGaps: ResponsivenessGap[];
    mobileFirstScore: number;
  }> {
    const classes = this.extractTailwindClasses(component.content);
    const responsivenessGaps = this.findResponsivenessGaps(component, classes);
    const mobileFirstScore = this.calculateMobileFirstScore(classes);

    return {
      classes,
      responsivenessGaps,
      mobileFirstScore,
    };
  }

  /**
   * Extract all Tailwind classes from component content
   */
  private extractTailwindClasses(content: string): TailwindClass[] {
    const classes: TailwindClass[] = [];
    
    // Regex to find className attributes
    const classNameRegex = /className\s*=\s*["'`]([^"'`]*)["'`]/g;
    const classMatches = [...content.matchAll(classNameRegex)];

    classMatches.forEach(match => {
      const classString = match[1];
      const individualClasses = classString.split(/\s+/).filter(cls => cls.length > 0);

      individualClasses.forEach(className => {
        const responsive = this.responsivePrefixes.some(prefix => className.startsWith(prefix));
        const breakpoint = responsive ? this.getBreakpointFromClass(className) : undefined;
        const category = this.categorizeClass(className);

        classes.push({
          className,
          responsive,
          breakpoint,
          category,
        });
      });
    });

    return classes;
  }

  /**
   * Find responsiveness gaps in component
   */
  private findResponsivenessGaps(component: ComponentFile, classes: TailwindClass[]): ResponsivenessGap[] {
    const gaps: ResponsivenessGap[] = [];
    const lines = component.content.split('\n');

    // Check for common responsive patterns
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for fixed widths without responsive variants
      if (line.includes('className') && /w-\d+/.test(line) && !this.hasResponsiveVariant(line, 'w-')) {
        gaps.push({
          issue: 'Fixed width without responsive variants',
          currentClasses: this.extractClassesFromLine(line),
          suggestedClasses: ['w-full', 'md:w-auto'],
          breakpoint: 'mobile',
          impact: 'layout-breaking',
          line: lineNumber,
          element: this.extractElementFromLine(line),
        });
      }

      // Check for fixed heights that might cause issues
      if (line.includes('className') && /h-\d+/.test(line) && !line.includes('min-h-')) {
        gaps.push({
          issue: 'Fixed height may cause mobile overflow',
          currentClasses: this.extractClassesFromLine(line),
          suggestedClasses: ['min-h-', 'h-auto'],
          breakpoint: 'mobile',
          impact: 'ux-degradation',
          line: lineNumber,
          element: this.extractElementFromLine(line),
        });
      }

      // Check for text sizes without mobile optimization
      if (line.includes('className') && /text-(xl|2xl|3xl|4xl|5xl|6xl)/.test(line) && !this.hasResponsiveVariant(line, 'text-')) {
        gaps.push({
          issue: 'Large text size without mobile variant',
          currentClasses: this.extractClassesFromLine(line),
          suggestedClasses: ['text-lg', 'md:text-xl'],
          breakpoint: 'mobile',
          impact: 'ux-degradation',
          line: lineNumber,
          element: this.extractElementFromLine(line),
        });
      }

      // Check for grid layouts without mobile stacking
      if (line.includes('grid-cols-') && !this.hasResponsiveVariant(line, 'grid-cols-')) {
        gaps.push({
          issue: 'Grid layout needs mobile stacking',
          currentClasses: this.extractClassesFromLine(line),
          suggestedClasses: ['grid-cols-1', 'md:grid-cols-2'],
          breakpoint: 'mobile',
          impact: 'layout-breaking',
          line: lineNumber,
          element: this.extractElementFromLine(line),
        });
      }
    });

    return gaps;
  }

  /**
   * Analyze touch targets for size compliance
   */
  private async analyzeTouchTargets(component: ComponentFile): Promise<{
    issues: TouchTargetIssue[];
    passRate: number;
  }> {
    const issues: TouchTargetIssue[] = [];
    const lines = component.content.split('\n');
    let totalInteractiveElements = 0;
    let compliantElements = 0;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for interactive elements
      if (this.isInteractiveElement(line)) {
        totalInteractiveElements++;
        
        const sizeIssue = this.checkTouchTargetSize(line, lineNumber);
        if (sizeIssue) {
          issues.push(sizeIssue);
        } else {
          compliantElements++;
        }
      }
    });

    const passRate = totalInteractiveElements > 0 ? (compliantElements / totalInteractiveElements) * 100 : 100;

    return {
      issues,
      passRate,
    };
  }

  /**
   * Check if a line contains an interactive element
   */
  private isInteractiveElement(line: string): boolean {
    const interactivePatterns = [
      /(<button|<Button)/,
      /onClick\s*=/,
      /onPress\s*=/,
      /onTouchStart\s*=/,
      /cursor-pointer/,
      /hover:/,
      /<a\s+/,
      /role\s*=\s*["']button["']/,
      /tabIndex/,
    ];

    return interactivePatterns.some(pattern => pattern.test(line));
  }

  /**
   * Check touch target size for a line
   */
  private checkTouchTargetSize(line: string, lineNumber: number): TouchTargetIssue | null {
    const minSize = this.config.minTouchTargetSize;
    
    // Extract size classes
    const widthMatch = line.match(/w-(\d+)/);
    const heightMatch = line.match(/h-(\d+)/);
    const sizeMatch = line.match(/size-(\d+)/);
    
    let width: number | 'unknown' = 'unknown';
    let height: number | 'unknown' = 'unknown';

    // Convert Tailwind spacing to pixels (assuming 1 unit = 4px)
    if (widthMatch) {
      width = parseInt(widthMatch[1]) * 4;
    }
    if (heightMatch) {
      height = parseInt(heightMatch[1]) * 4;
    }
    if (sizeMatch) {
      width = height = parseInt(sizeMatch[1]) * 4;
    }

    // Check for explicit pixel values
    const pxWidthMatch = line.match(/w-\[(\d+)px\]/);
    const pxHeightMatch = line.match(/h-\[(\d+)px\]/);
    if (pxWidthMatch) width = parseInt(pxWidthMatch[1]);
    if (pxHeightMatch) height = parseInt(pxHeightMatch[1]);

    // Determine if this is a touch target issue
    const hasIssue = (
      (typeof width === 'number' && width < minSize) ||
      (typeof height === 'number' && height < minSize)
    );

    if (hasIssue || (width === 'unknown' && height === 'unknown')) {
      return {
        element: this.extractElementFromLine(line),
        currentSize: { width, height },
        recommendedSize: { width: minSize, height: minSize },
        severity: width === 'unknown' && height === 'unknown' ? 'medium' : 'high',
        line: lineNumber,
        context: line.trim(),
      };
    }

    return null;
  }

  /**
   * Analyze layout complexity
   */
  private async analyzeLayoutComplexity(component: ComponentFile): Promise<{
    complexity: LayoutComplexityMetrics;
    mobileCompatibility: 'excellent' | 'good' | 'needs-improvement' | 'poor';
    recommendations: string[];
  }> {
    const content = component.content;
    
    const nestingDepth = this.calculateNestingDepth(content);
    const flexboxComplexity = this.calculateFlexboxComplexity(content);
    const gridComplexity = this.calculateGridComplexity(content);
    const conditionalRendering = this.countConditionalRendering(content);
    const totalElements = this.countElements(content);
    
    // Calculate mobile optimization score
    const mobileOptimizationScore = this.calculateMobileOptimizationScore({
      nestingDepth,
      flexboxComplexity,
      gridComplexity,
      conditionalRendering,
      totalElements,
    });

    const complexity: LayoutComplexityMetrics = {
      nestingDepth,
      flexboxComplexity,
      gridComplexity,
      conditionalRendering,
      totalElements,
      mobileOptimizationScore,
    };

    const mobileCompatibility = this.determineMobileCompatibility(mobileOptimizationScore);
    const recommendations = this.generateLayoutRecommendations(complexity);

    return {
      complexity,
      mobileCompatibility,
      recommendations,
    };
  }

  /**
   * Analyze navigation patterns
   */
  private async analyzeNavigationPatterns(component: ComponentFile): Promise<{
    patterns: string[];
    issues: NavigationPatternIssue[];
    mobileNavScore: number;
  }> {
    const patterns = this.identifyNavigationPatterns(component.content);
    const issues = this.findNavigationIssues(component);
    const mobileNavScore = this.calculateMobileNavScore(patterns, issues);

    return {
      patterns,
      issues,
      mobileNavScore,
    };
  }

  /**
   * Analyze financial component specifics
   */
  private async analyzeFinancialComponent(component: ComponentFile): Promise<FinancialComponentAnalysis> {
    const componentType = this.identifyFinancialComponentType(component);
    const mobileOptimized = this.checkFinancialMobileOptimization(component, componentType);
    const accessibilityScore = this.calculateAccessibilityScore(component);
    const performanceScore = this.calculatePerformanceScore(component);
    const financialUXScore = this.calculateFinancialUXScore(component, componentType);
    const specificIssues = this.identifyFinancialSpecificIssues(component, componentType);
    const recommendations = this.generateFinancialRecommendations(component, componentType);

    return {
      componentType,
      mobileOptimized,
      accessibilityScore,
      performanceScore,
      financialUXScore,
      specificIssues,
      recommendations,
    };
  }

  // Helper methods...

  private getBreakpointFromClass(className: string): 'sm' | 'md' | 'lg' | 'xl' | '2xl' | undefined {
    if (className.startsWith('sm:')) return 'sm';
    if (className.startsWith('md:')) return 'md';
    if (className.startsWith('lg:')) return 'lg';
    if (className.startsWith('xl:')) return 'xl';
    if (className.startsWith('2xl:')) return '2xl';
    return undefined;
  }

  private categorizeClass(className: string): 'layout' | 'spacing' | 'sizing' | 'typography' | 'color' | 'interaction' {
    if (/^(flex|grid|block|inline|absolute|relative|fixed)/.test(className)) return 'layout';
    if (/^(p|m|space|gap)-/.test(className)) return 'spacing';
    if (/^(w|h|min-|max-|size)-/.test(className)) return 'sizing';
    if (/^(text|font|leading|tracking)/.test(className)) return 'typography';
    if (/^(bg|text|border|ring|shadow)-\w*-/.test(className)) return 'color';
    if (/^(hover|focus|active|disabled|group|peer):/.test(className)) return 'interaction';
    return 'layout';
  }

  private hasResponsiveVariant(line: string, prefix: string): boolean {
    return this.responsivePrefixes.some(responsive => 
      line.includes(`${responsive}${prefix}`)
    );
  }

  private extractClassesFromLine(line: string): string[] {
    const match = line.match(/className\s*=\s*["'`]([^"'`]*)["'`]/);
    return match ? match[1].split(/\s+/).filter(cls => cls.length > 0) : [];
  }

  private extractElementFromLine(line: string): string {
    const match = line.match(/<(\w+)/);
    return match ? match[1] : 'unknown';
  }

  private calculateNestingDepth(content: string): number {
    const lines = content.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;

    lines.forEach(line => {
      const openTags = (line.match(/</g) || []).length;
      const closeTags = (line.match(/>/g) || []).length;
      const selfClosing = (line.match(/\/>/g) || []).length;
      
      currentDepth += openTags - closeTags - selfClosing;
      maxDepth = Math.max(maxDepth, currentDepth);
    });

    return maxDepth;
  }

  private calculateFlexboxComplexity(content: string): number {
    const flexPatterns = [
      /flex-col/g, /flex-row/g, /flex-wrap/g, /flex-nowrap/g,
      /justify-/g, /items-/g, /content-/g, /self-/g, /flex-1/g, /flex-auto/g
    ];

    return flexPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
  }

  private calculateGridComplexity(content: string): number {
    const gridPatterns = [
      /grid-cols-/g, /grid-rows-/g, /col-span-/g, /row-span-/g,
      /col-start-/g, /col-end-/g, /row-start-/g, /row-end-/g, /gap-/g
    ];

    return gridPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
  }

  private countConditionalRendering(content: string): number {
    const conditionalPatterns = [
      /\{.*\?.*:.*\}/g,  // Ternary operators
      /\{.*&&.*\}/g,     // Logical AND
      /\{.*\|\|.*\}/g,   // Logical OR
    ];

    return conditionalPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
  }

  private countElements(content: string): number {
    return (content.match(/<[a-zA-Z]/g) || []).length;
  }

  private calculateMobileOptimizationScore(metrics: Omit<LayoutComplexityMetrics, 'mobileOptimizationScore'>): number {
    let score = 100;

    // Penalize high nesting depth
    if (metrics.nestingDepth > 8) score -= 20;
    else if (metrics.nestingDepth > 5) score -= 10;

    // Penalize complex layouts
    if (metrics.flexboxComplexity + metrics.gridComplexity > 20) score -= 15;
    else if (metrics.flexboxComplexity + metrics.gridComplexity > 10) score -= 8;

    // Penalize excessive conditional rendering
    if (metrics.conditionalRendering > 10) score -= 15;
    else if (metrics.conditionalRendering > 5) score -= 8;

    // Penalize too many elements
    if (metrics.totalElements > 50) score -= 10;
    else if (metrics.totalElements > 30) score -= 5;

    return Math.max(0, score);
  }

  private determineMobileCompatibility(score: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }

  private generateLayoutRecommendations(complexity: LayoutComplexityMetrics): string[] {
    const recommendations: string[] = [];

    if (complexity.nestingDepth > 5) {
      recommendations.push('Consider flattening component structure to reduce nesting depth');
    }

    if (complexity.flexboxComplexity > 10) {
      recommendations.push('Simplify flexbox layouts or break into smaller components');
    }

    if (complexity.gridComplexity > 8) {
      recommendations.push('Consider using CSS Grid more efficiently or simplify grid layouts');
    }

    if (complexity.conditionalRendering > 5) {
      recommendations.push('Extract conditional rendering logic into separate components');
    }

    return recommendations;
  }

  private identifyNavigationPatterns(content: string): string[] {
    const patterns: string[] = [];

    if (/nav|Nav|navigation/i.test(content)) patterns.push('navigation-component');
    if (/menu|Menu/i.test(content)) patterns.push('menu');
    if (/header|Header/i.test(content)) patterns.push('header');
    if (/footer|Footer/i.test(content)) patterns.push('footer');
    if (/sidebar|Sidebar/i.test(content)) patterns.push('sidebar');
    if (/tab|Tab|tabs|Tabs/i.test(content)) patterns.push('tabs');
    if (/breadcrumb|Breadcrumb/i.test(content)) patterns.push('breadcrumb');

    return patterns;
  }

  private findNavigationIssues(component: ComponentFile): NavigationPatternIssue[] {
    const issues: NavigationPatternIssue[] = [];
    const lines = component.content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for hamburger menu implementation
      if (/menu.*button|button.*menu/i.test(line) && !this.hasAriaLabel(line)) {
        issues.push({
          pattern: 'hamburger-menu',
          issue: 'Missing aria-label for menu button',
          recommendation: 'Add aria-label="Menu" for accessibility',
          mobilePattern: 'hamburger-menu',
          severity: 'high',
          line: lineNumber,
        });
      }

      // Check for proper mobile navigation structure
      if (/nav.*className/i.test(line) && !line.includes('md:') && !line.includes('lg:')) {
        issues.push({
          pattern: 'navigation',
          issue: 'Navigation lacks responsive design classes',
          recommendation: 'Add mobile-first responsive navigation classes',
          mobilePattern: 'responsive-navigation',
          severity: 'medium',
          line: lineNumber,
        });
      }
    });

    return issues;
  }

  private hasAriaLabel(line: string): boolean {
    return /aria-label\s*=/i.test(line);
  }

  private calculateMobileNavScore(patterns: string[], issues: NavigationPatternIssue[]): number {
    let score = 100;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    score -= (criticalIssues * 25) + (highIssues * 15) + (mediumIssues * 8);

    return Math.max(0, score);
  }

  private identifyFinancialComponentType(component: ComponentFile): FinancialComponentAnalysis['componentType'] {
    const content = component.content.toLowerCase();
    const name = component.name.toLowerCase();

    for (const [type, patterns] of Object.entries(this.financialPatterns)) {
      if (patterns.some(pattern => content.includes(pattern) || name.includes(pattern))) {
        return type as FinancialComponentAnalysis['componentType'];
      }
    }

    return 'other';
  }

  private checkFinancialMobileOptimization(component: ComponentFile, type: FinancialComponentAnalysis['componentType']): boolean {
    // Implementation specific to financial component types
    const content = component.content;

    switch (type) {
      case 'transaction-list':
        return this.hasResponsiveVariant(content, 'grid-cols-') || content.includes('scroll');
      case 'budget-chart':
        return content.includes('responsive') || content.includes('mobile');
      case 'dashboard-card':
        return this.hasResponsiveVariant(content, 'p-') && this.hasResponsiveVariant(content, 'text-');
      case 'form':
        return content.includes('w-full') && this.hasResponsiveVariant(content, 'space-y-');
      case 'navigation':
        return this.hasResponsiveVariant(content, 'hidden') || content.includes('mobile');
      default:
        return this.hasResponsiveVariant(content, 'w-') || this.hasResponsiveVariant(content, 'text-');
    }
  }

  private calculateAccessibilityScore(component: ComponentFile): number {
    let score = 100;
    const content = component.content;

    // Check for aria labels
    if (!content.includes('aria-')) score -= 15;
    
    // Check for semantic HTML
    if (!/<(header|main|section|article|aside|footer|nav)/i.test(content)) score -= 10;
    
    // Check for alt tags on images
    if (/<img/i.test(content) && !content.includes('alt=')) score -= 20;
    
    // Check for proper heading structure
    if (!/<h[1-6]/i.test(content) && content.includes('heading')) score -= 10;

    return Math.max(0, score);
  }

  private calculatePerformanceScore(component: ComponentFile): number {
    let score = 100;
    const content = component.content;

    // Check for React.memo or useMemo
    if (content.includes('useState') && !content.includes('useMemo') && !content.includes('useCallback')) {
      score -= 15;
    }

    // Check for inline functions in render
    if (/onClick\s*=\s*{.*=>/.test(content)) score -= 10;

    // Check for key prop in lists
    if (content.includes('map(') && !content.includes('key=')) score -= 20;

    return Math.max(0, score);
  }

  private calculateFinancialUXScore(component: ComponentFile, type: FinancialComponentAnalysis['componentType']): number {
    let score = 100;
    const content = component.content;

    // Type-specific scoring
    switch (type) {
      case 'transaction-list':
        if (!content.includes('currency') && !content.includes('$')) score -= 15;
        if (!content.includes('date')) score -= 10;
        break;
      case 'budget-chart':
        if (!content.includes('loading') && !content.includes('skeleton')) score -= 10;
        break;
      case 'dashboard-card':
        if (!content.includes('skeleton') && !content.includes('placeholder')) score -= 10;
        break;
    }

    return Math.max(0, score);
  }

  private identifyFinancialSpecificIssues(component: ComponentFile, type: FinancialComponentAnalysis['componentType']): string[] {
    const issues: string[] = [];
    const content = component.content;

    // Common financial app issues
    if (content.includes('$') && !content.includes('currency')) {
      issues.push('Hard-coded currency symbol - consider internationalization');
    }

    if (type === 'transaction-list' && !content.includes('virtual')) {
      issues.push('Large transaction lists should implement virtualization for mobile performance');
    }

    if (type === 'budget-chart' && !content.includes('loading')) {
      issues.push('Chart components should show loading states for better mobile UX');
    }

    return issues;
  }

  private generateFinancialRecommendations(component: ComponentFile, type: FinancialComponentAnalysis['componentType']): string[] {
    const recommendations: string[] = [];

    switch (type) {
      case 'transaction-list':
        recommendations.push('Implement pull-to-refresh for mobile');
        recommendations.push('Add swipe actions for common operations');
        recommendations.push('Use virtualization for large lists');
        break;
      case 'budget-chart':
        recommendations.push('Make charts touch-interactive on mobile');
        recommendations.push('Ensure chart labels are readable on small screens');
        break;
      case 'dashboard-card':
        recommendations.push('Implement card stacking for mobile layout');
        recommendations.push('Add tap-to-expand functionality');
        break;
      case 'form':
        recommendations.push('Use proper input types for financial data');
        recommendations.push('Implement number formatting as user types');
        break;
    }

    return recommendations;
  }

  private calculateMobileFirstScore(classes: TailwindClass[]): number {
    const totalClasses = classes.length;
    const responsiveClasses = classes.filter(c => c.responsive).length;
    
    if (totalClasses === 0) return 0;
    
    return (responsiveClasses / totalClasses) * 100;
  }

  private calculateOverallScore(scores: {
    tailwindScore: number;
    touchTargetScore: number;
    layoutScore: number;
    navigationScore: number;
    financialScore: number;
  }): number {
    // Weighted average
    const weights = {
      tailwindScore: 0.25,
      touchTargetScore: 0.25,
      layoutScore: 0.2,
      navigationScore: 0.15,
      financialScore: 0.15,
    };

    return Object.entries(scores).reduce((total, [key, score]) => {
      const weight = weights[key as keyof typeof weights];
      return total + (score * weight);
    }, 0);
  }

  private determinePriority(
    overallScore: number, 
    factors: { 
      criticalTouchIssues: number; 
      criticalNavIssues: number; 
      layoutComplexity: number; 
    }
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (factors.criticalTouchIssues > 0 || factors.criticalNavIssues > 0) {
      return 'critical';
    }
    
    if (overallScore < 50) return 'high';
    if (overallScore < 70) return 'medium';
    return 'low';
  }
}