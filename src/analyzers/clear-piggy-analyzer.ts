/**
 * Clear Piggy Mobile Analyzer
 * Advanced analyzer specifically for Clear Piggy's financial SaaS components
 */

import { 
  ComponentFile,
  ClearPiggyAnalysisResult,
  ClearPiggyConfig,
  FinancialComponentType,
  MobileOptimizationPriority,
  TailwindClass,
  TailwindResponsiveGap,
  TouchTargetIssue,
  LayoutComplexityIssue,
  NavigationIssue,
  FinancialUXIssue,
  FramerMotionAnalysis,
  AccessibilityAnalysis,
  PerformanceAnalysis
} from '../types/clear-piggy-types';

export class ClearPiggyMobileAnalyzer {
  private config: ClearPiggyConfig;

  // Clear Piggy specific patterns
  private readonly financialPatterns = {
    'transaction-list': [
      'transaction', 'transactions', 'history', 'statement', 'activity',
      'recenttransactions', 'transactionlist', 'transactionpreview'
    ],
    'dashboard-card': [
      'dashboard', 'card', 'widget', 'summary', 'overview', 'balance',
      'accountbalance', 'quickstatus', 'mobiledashboard'
    ],
    'budget-chart': [
      'chart', 'graph', 'budget', 'spending', 'cashflow', 'analytics',
      'spendingcategories', 'budgetprogress'
    ],
    'form': [
      'form', 'input', 'field', 'upload', 'receipt', 'auth', 'onboard',
      'plaidlink', 'receiptupload'
    ],
    'navigation': [
      'nav', 'menu', 'header', 'footer', 'sidebar', 'tab', 'breadcrumb',
      'responsive', 'quickactions'
    ]
  };

  private readonly responsivePrefixes = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  private readonly interactiveElements = [
    'button', 'btn', 'link', 'input', 'select', 'textarea', 'clickable',
    'cursor-pointer', 'hover:', 'active:', 'focus:', 'touch'
  ];

  private readonly financialKeywords = [
    'amount', 'balance', 'currency', 'dollar', 'transaction', 'payment',
    'budget', 'expense', 'income', 'account', 'bank', 'card'
  ];

  constructor(config: ClearPiggyConfig) {
    this.config = config;
  }

  /**
   * Analyze a single React component for Clear Piggy mobile optimization
   */
  async analyzeComponent(component: ComponentFile): Promise<ClearPiggyAnalysisResult> {
    const financialComponentType = this.identifyFinancialComponentType(component);
    
    // Core analyses
    const tailwindAnalysis = await this.analyzeTailwindClasses(component);
    const tailwindResponsiveGaps = await this.findResponsiveGaps(component, tailwindAnalysis.classes);
    const touchTargetIssues = await this.analyzeTouchTargets(component);
    const layoutComplexityIssues = await this.analyzeLayoutComplexity(component);
    const navigationIssues = await this.analyzeNavigationPatterns(component);
    const financialUXIssues = await this.analyzeFinancialUX(component, financialComponentType);
    
    // Advanced analyses
    const framerMotionAnalysis = this.config.enableFramerMotionAnalysis 
      ? await this.analyzeFramerMotion(component)
      : this.getDefaultFramerMotionAnalysis();
      
    const accessibilityAnalysis = this.config.enableAccessibilityDeepDive
      ? await this.analyzeAccessibility(component, financialComponentType)
      : this.getDefaultAccessibilityAnalysis();
      
    const performanceAnalysis = this.config.enablePerformanceAnalysis
      ? await this.analyzePerformance(component, financialComponentType)
      : this.getDefaultPerformanceAnalysis();

    // Calculate scores
    const touchTargetScore = this.calculateTouchTargetScore(touchTargetIssues);
    const responsiveDesignScore = tailwindAnalysis.responsiveImplementationScore;
    const layoutOptimizationScore = this.calculateLayoutScore(layoutComplexityIssues);
    const navigationScore = this.calculateNavigationScore(navigationIssues);
    const financialUXScore = this.calculateFinancialUXScore(financialUXIssues, financialComponentType);
    const accessibilityScore = accessibilityAnalysis.score;
    const performanceScore = performanceAnalysis.score;

    // Calculate overall mobile score
    const overallMobileScore = this.calculateOverallMobileScore({
      touchTargetScore,
      responsiveDesignScore,
      layoutOptimizationScore,
      navigationScore,
      financialUXScore,
      accessibilityScore,
      performanceScore
    });

    // Determine priority
    const priority = this.determinePriority(overallMobileScore, {
      criticalTouchIssues: touchTargetIssues.filter(i => i.severity === 'critical').length,
      criticalNavIssues: navigationIssues.filter(i => i.severity === 'critical').length,
      financialUXIssues: financialUXIssues.filter(i => i.priority === 'critical').length,
      layoutComplexity: layoutComplexityIssues.filter(i => i.severity === 'high').length
    });

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      touchTargetIssues,
      tailwindResponsiveGaps,
      layoutComplexityIssues,
      navigationIssues,
      financialUXIssues,
      financialComponentType
    );

    return {
      componentFile: component,
      financialComponentType,
      overallMobileScore,
      priority,
      tailwindAnalysis,
      tailwindResponsiveGaps,
      touchTargetIssues,
      layoutComplexityIssues,
      navigationIssues,
      financialUXIssues,
      framerMotionAnalysis,
      accessibilityAnalysis,
      performanceAnalysis,
      touchTargetScore,
      responsiveDesignScore,
      layoutOptimizationScore,
      navigationScore,
      financialUXScore,
      accessibilityScore,
      performanceScore,
      ...recommendations
    };
  }

  /**
   * Identify the type of financial component
   */
  private identifyFinancialComponentType(component: ComponentFile): FinancialComponentType {
    const content = component.content.toLowerCase();
    const name = component.name.toLowerCase();
    
    for (const [type, patterns] of Object.entries(this.financialPatterns)) {
      if (patterns.some(pattern => content.includes(pattern) || name.includes(pattern))) {
        return type as FinancialComponentType;
      }
    }
    
    return 'other';
  }

  /**
   * Analyze Tailwind CSS classes with Clear Piggy specifics
   */
  private async analyzeTailwindClasses(component: ComponentFile): Promise<{
    classes: TailwindClass[];
    mobileFirstScore: number;
    responsiveImplementationScore: number;
  }> {
    const classes = this.extractTailwindClasses(component.content);
    const mobileFirstScore = this.calculateMobileFirstScore(classes);
    const responsiveImplementationScore = this.calculateResponsiveImplementationScore(classes, component);
    
    return {
      classes,
      mobileFirstScore,
      responsiveImplementationScore
    };
  }

  /**
   * Extract and categorize Tailwind classes
   */
  private extractTailwindClasses(content: string): TailwindClass[] {
    const classes: TailwindClass[] = [];
    const classNameRegex = /className\s*=\s*[{"'`]([^"'`}]*)[}"'`]/g;
    
    let match;
    while ((match = classNameRegex.exec(content)) !== null) {
      const classString = match[1];
      const individualClasses = classString.split(/\s+/).filter(cls => cls.length > 0);
      
      individualClasses.forEach(className => {
        if (this.isTailwindClass(className)) {
          const isResponsive = this.responsivePrefixes.some(prefix => className.startsWith(prefix));
          const breakpoint = isResponsive ? this.getBreakpointFromClass(className) : undefined;
          const category = this.categorizeClass(className);
          const isFinancialOptimized = this.isFinancialOptimized(className);
          
          classes.push({
            className,
            isResponsive,
            breakpoint,
            category,
            isFinancialOptimized
          });
        }
      });
    }
    
    return classes;
  }

  /**
   * Find responsive design gaps specific to financial components
   */
  private async findResponsiveGaps(component: ComponentFile, classes: TailwindClass[]): Promise<TailwindResponsiveGap[]> {
    const gaps: TailwindResponsiveGap[] = [];
    const lines = component.content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for financial-specific responsive issues
      if (line.includes('className')) {
        // Fixed widths in financial tables/lists
        if (/w-\d+/.test(line) && !this.hasResponsiveVariant(line, 'w-') && 
            this.containsFinancialPattern(line)) {
          gaps.push({
            issue: 'Financial data table needs responsive width',
            currentClasses: this.extractClassesFromLine(line),
            suggestedClasses: ['w-full', 'md:w-auto', 'overflow-x-auto'],
            affectedBreakpoint: 'mobile',
            impactLevel: 'layout-breaking',
            lineNumber,
            elementContext: this.extractElementFromLine(line),
            financialImpact: 'Transaction data may be truncated on mobile screens'
          });
        }

        // Text sizes for financial amounts
        if (/text-(2xl|3xl|4xl|5xl)/.test(line) && !this.hasResponsiveVariant(line, 'text-') &&
            this.containsFinancialKeywords(line)) {
          gaps.push({
            issue: 'Financial amount text size needs mobile optimization',
            currentClasses: this.extractClassesFromLine(line),
            suggestedClasses: ['text-lg', 'md:text-2xl', 'font-semibold'],
            affectedBreakpoint: 'mobile',
            impactLevel: 'ux-degradation',
            lineNumber,
            elementContext: this.extractElementFromLine(line),
            financialImpact: 'Large amounts may be hard to read on mobile'
          });
        }

        // Grid layouts for dashboard cards
        if (/grid-cols-[3-9]/.test(line) && !this.hasResponsiveVariant(line, 'grid-cols-')) {
          gaps.push({
            issue: 'Dashboard grid needs mobile stacking',
            currentClasses: this.extractClassesFromLine(line),
            suggestedClasses: ['grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3'],
            affectedBreakpoint: 'mobile',
            impactLevel: 'layout-breaking',
            lineNumber,
            elementContext: this.extractElementFromLine(line),
            financialImpact: 'Financial cards will be too small on mobile screens'
          });
        }

        // Padding for touch-friendly financial buttons
        if (/p-[12](?:\s|$)/.test(line) && this.isInteractiveFinancialElement(line)) {
          gaps.push({
            issue: 'Financial action button needs larger touch padding',
            currentClasses: this.extractClassesFromLine(line),
            suggestedClasses: ['p-3', 'md:p-4', 'min-h-[44px]'],
            affectedBreakpoint: 'mobile',
            impactLevel: 'ux-degradation',
            lineNumber,
            elementContext: this.extractElementFromLine(line),
            financialImpact: 'Important financial actions may be hard to tap'
          });
        }
      }
    });
    
    return gaps;
  }

  /**
   * Analyze touch targets with financial UX focus
   */
  private async analyzeTouchTargets(component: ComponentFile): Promise<TouchTargetIssue[]> {
    const issues: TouchTargetIssue[] = [];
    const lines = component.content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      if (this.isInteractiveElement(line)) {
        const issue = this.checkTouchTargetSize(line, lineNumber);
        if (issue) {
          // Enhanced for financial elements
          const isFinancialElement = this.containsFinancialPattern(line) || 
                                   this.isInteractiveFinancialElement(line);
          
          let financialElementType: TouchTargetIssue['financialElementType'];
          if (line.includes('button') || line.includes('btn')) financialElementType = 'button';
          else if (line.includes('input') || line.includes('select')) financialElementType = 'form-control';
          else if (line.includes('nav') || line.includes('menu')) financialElementType = 'nav-item';
          else if (line.includes('chart') || line.includes('graph')) financialElementType = 'chart-element';
          else financialElementType = 'link';

          issues.push({
            ...issue,
            isFinancialElement,
            financialElementType,
            suggestedFix: this.generateTouchTargetFix(issue, isFinancialElement, financialElementType)
          });
        }
      }
    });
    
    return issues;
  }

  /**
   * Analyze layout complexity for financial components
   */
  private async analyzeLayoutComplexity(component: ComponentFile): Promise<LayoutComplexityIssue[]> {
    const issues: LayoutComplexityIssue[] = [];
    const content = component.content;
    
    // Deep nesting analysis
    const nestingDepth = this.calculateNestingDepth(content);
    if (nestingDepth > 6) {
      issues.push({
        type: 'deep-nesting',
        severity: nestingDepth > 10 ? 'high' : 'medium',
        description: `Component has ${nestingDepth} levels of nesting`,
        currentValue: nestingDepth,
        recommendedValue: 6,
        lineNumber: this.findDeepestNestingLine(content),
        suggestion: 'Break component into smaller, reusable sub-components',
        mobileImpact: 'Deep nesting can cause performance issues and layout problems on mobile'
      });
    }

    // Complex flexbox patterns
    const flexboxComplexity = this.calculateFlexboxComplexity(content);
    if (flexboxComplexity > 15) {
      issues.push({
        type: 'complex-flexbox',
        severity: flexboxComplexity > 25 ? 'high' : 'medium',
        description: `Component uses ${flexboxComplexity} flexbox utilities`,
        currentValue: flexboxComplexity,
        recommendedValue: 15,
        lineNumber: this.findMostComplexFlexboxLine(content),
        suggestion: 'Consider using CSS Grid for complex layouts or simplify flexbox usage',
        mobileImpact: 'Complex flexbox can cause unexpected layout shifts on mobile'
      });
    }

    // Conditional rendering complexity
    const conditionalComplexity = this.countConditionalRendering(content);
    if (conditionalComplexity > 8) {
      issues.push({
        type: 'excessive-conditionals',
        severity: conditionalComplexity > 15 ? 'high' : 'medium',
        description: `Component has ${conditionalComplexity} conditional rendering patterns`,
        currentValue: conditionalComplexity,
        recommendedValue: 8,
        lineNumber: this.findMostConditionalLine(content),
        suggestion: 'Extract conditional logic into separate components or custom hooks',
        mobileImpact: 'Complex conditionals can cause layout shifts and performance issues'
      });
    }

    return issues;
  }

  /**
   * Analyze navigation patterns for financial flows
   */
  private async analyzeNavigationPatterns(component: ComponentFile): Promise<NavigationIssue[]> {
    const issues: NavigationIssue[] = [];
    const lines = component.content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for missing aria labels on financial navigation
      if (/nav|menu|button/i.test(line) && this.containsFinancialPattern(line) && !this.hasAriaLabel(line)) {
        issues.push({
          pattern: 'financial-navigation',
          issue: 'Missing aria-label on financial navigation element',
          recommendation: 'Add descriptive aria-label for screen readers',
          mobilePattern: 'accessible-financial-nav',
          severity: 'high',
          lineNumber,
          accessibilityImpact: true,
          financialWorkflowImpact: 'Users may not understand navigation options for financial actions'
        });
      }

      // Check for hamburger menu implementation
      if (/menu.*button|hamburger/i.test(line) && !line.includes('md:hidden')) {
        issues.push({
          pattern: 'hamburger-menu',
          issue: 'Hamburger menu not properly hidden on desktop',
          recommendation: 'Add responsive classes: hidden md:block for desktop nav, md:hidden for mobile menu',
          mobilePattern: 'responsive-hamburger',
          severity: 'medium',
          lineNumber,
          accessibilityImpact: false
        });
      }

      // Check for touch-friendly navigation spacing
      if (/nav.*space-x-[12]|space-y-[12]/.test(line)) {
        issues.push({
          pattern: 'navigation-spacing',
          issue: 'Navigation items too close for comfortable touch interaction',
          recommendation: 'Increase spacing: space-x-4 md:space-x-6 for horizontal, space-y-3 for vertical',
          mobilePattern: 'touch-friendly-nav',
          severity: 'medium',
          lineNumber,
          accessibilityImpact: false,
          financialWorkflowImpact: 'Difficult navigation may lead to user errors in financial operations'
        });
      }
    });
    
    return issues;
  }

  /**
   * Analyze financial UX patterns
   */
  private async analyzeFinancialUX(component: ComponentFile, componentType: FinancialComponentType): Promise<FinancialUXIssue[]> {
    const issues: FinancialUXIssue[] = [];
    const content = component.content;
    const lines = content.split('\n');

    switch (componentType) {
      case 'transaction-list':
        // Check for virtualization
        if (!content.includes('virtual') && !content.includes('FixedSizeList') && content.includes('map(')) {
          issues.push({
            componentType,
            issue: 'Large transaction lists should implement virtualization',
            mobileSpecificImpact: 'Non-virtualized lists cause poor performance and battery drain on mobile',
            recommendation: 'Implement react-window or similar virtualization library',
            priority: 'high',
            examples: [
              'Use FixedSizeList for consistent row heights',
              'Implement pull-to-refresh for mobile',
              'Add skeleton loading states'
            ]
          });
        }

        // Check for swipe actions
        if (!content.includes('swipe') && !content.includes('gesture')) {
          issues.push({
            componentType,
            issue: 'Missing swipe actions for transaction management',
            mobileSpecificImpact: 'Users expect swipe gestures for quick actions on mobile',
            recommendation: 'Add swipe-to-reveal actions for common operations',
            priority: 'medium',
            examples: [
              'Swipe left to categorize',
              'Swipe right to mark as reviewed',
              'Long press for multi-select'
            ]
          });
        }
        break;

      case 'dashboard-card':
        // Check for mobile stacking
        if (content.includes('grid-cols-') && !this.hasResponsiveGridStacking(content)) {
          issues.push({
            componentType,
            issue: 'Dashboard cards need mobile stacking pattern',
            mobileSpecificImpact: 'Cards become too small and unreadable on mobile screens',
            recommendation: 'Implement responsive grid with mobile stacking',
            priority: 'high',
            examples: [
              'Use grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
              'Add progressive disclosure for detailed data',
              'Include tap-to-expand functionality'
            ]
          });
        }

        // Check for loading states
        if (!content.includes('loading') && !content.includes('skeleton')) {
          issues.push({
            componentType,
            issue: 'Missing loading states for financial data',
            mobileSpecificImpact: 'Mobile users need clear feedback during data loading',
            recommendation: 'Add skeleton screens and loading indicators',
            priority: 'medium',
            examples: [
              'Skeleton placeholders for balance amounts',
              'Loading spinners for chart data',
              'Progressive loading for dashboard sections'
            ]
          });
        }
        break;

      case 'budget-chart':
        // Check for touch interactions
        if (!content.includes('onTouch') && !content.includes('gesture') && content.includes('Chart')) {
          issues.push({
            componentType,
            issue: 'Charts lack touch interaction support',
            mobileSpecificImpact: 'Mobile users cannot interact with chart data effectively',
            recommendation: 'Implement touch-friendly chart interactions',
            priority: 'high',
            examples: [
              'Pinch-to-zoom for detailed views',
              'Tap to show data points',
              'Swipe to navigate time periods'
            ]
          });
        }
        break;

      case 'form':
        // Check for input types
        if (content.includes('input') && !this.hasProperInputTypes(content)) {
          issues.push({
            componentType,
            issue: 'Form inputs lack proper types for financial data',
            mobileSpecificImpact: 'Wrong keyboards appear on mobile, hindering data entry',
            recommendation: 'Use appropriate input types and patterns',
            priority: 'high',
            examples: [
              'type="number" for amounts',
              'inputMode="decimal" for currency',
              'pattern="[0-9]*" for numeric inputs',
              'autocomplete attributes for faster filling'
            ]
          });
        }
        break;
    }

    // Universal financial UX checks
    if (content.includes('$') && !content.includes('currency') && !content.includes('Intl.NumberFormat')) {
      issues.push({
        componentType,
        issue: 'Hard-coded currency symbols limit internationalization',
        mobileSpecificImpact: 'Mobile users in different regions see incorrect currency formatting',
        recommendation: 'Use proper currency formatting utilities',
        priority: 'medium',
        examples: [
          'Intl.NumberFormat for currency display',
          'React-Intl for internationalization',
          'Support for multiple currencies'
        ]
      });
    }

    return issues;
  }

  /**
   * Analyze Framer Motion usage for mobile performance
   */
  private async analyzeFramerMotion(component: ComponentFile): Promise<FramerMotionAnalysis> {
    const content = component.content;
    const hasAnimations = content.includes('framer-motion') || content.includes('motion.');
    
    if (!hasAnimations) {
      return {
        hasAnimations: false,
        animationTypes: [],
        mobileOptimized: true,
        performanceImpact: 'low',
        recommendations: []
      };
    }

    const animationTypes: string[] = [];
    if (content.includes('animate=')) animationTypes.push('animate');
    if (content.includes('initial=')) animationTypes.push('initial');
    if (content.includes('exit=')) animationTypes.push('exit');
    if (content.includes('whileHover=')) animationTypes.push('whileHover');
    if (content.includes('whileTap=')) animationTypes.push('whileTap');
    if (content.includes('layout')) animationTypes.push('layout');

    const mobileOptimized = !content.includes('whileHover') || content.includes('whileTap');
    const performanceImpact = animationTypes.length > 5 ? 'high' : 
                             animationTypes.length > 2 ? 'medium' : 'low';

    const recommendations: string[] = [];
    if (!mobileOptimized) {
      recommendations.push('Replace hover animations with tap/focus for mobile');
    }
    if (performanceImpact === 'high') {
      recommendations.push('Reduce number of simultaneous animations for mobile performance');
    }
    if (content.includes('layout') && !content.includes('layoutId')) {
      recommendations.push('Use layoutId for better shared element transitions');
    }

    return {
      hasAnimations,
      animationTypes,
      mobileOptimized,
      performanceImpact,
      recommendations
    };
  }

  /**
   * Analyze accessibility with financial context
   */
  private async analyzeAccessibility(component: ComponentFile, componentType: FinancialComponentType): Promise<AccessibilityAnalysis> {
    const content = component.content;
    let score = 100;
    const issues: AccessibilityAnalysis['issues'] = [];
    const mobileSpecificIssues: string[] = [];

    // Check for aria labels
    if (!content.includes('aria-label') && this.hasInteractiveElements(content)) {
      score -= 15;
      issues.push({
        type: 'missing-aria-labels',
        severity: 'high',
        description: 'Interactive elements missing descriptive labels',
        fix: 'Add aria-label attributes to buttons and interactive elements'
      });
    }

    // Check for semantic HTML
    if (!/<(header|main|section|article|aside|footer|nav)/i.test(content)) {
      score -= 10;
      issues.push({
        type: 'non-semantic-html',
        severity: 'medium',
        description: 'Component uses div instead of semantic HTML elements',
        fix: 'Use semantic HTML elements like header, main, section, nav'
      });
    }

    // Check for image alt text
    if (/<img/i.test(content) && !content.includes('alt=')) {
      score -= 20;
      issues.push({
        type: 'missing-alt-text',
        severity: 'critical',
        description: 'Images missing alt text',
        fix: 'Add descriptive alt attributes to all images'
      });
    }

    // Financial-specific accessibility
    if (componentType === 'transaction-list' && !content.includes('role="table"')) {
      score -= 10;
      mobileSpecificIssues.push('Transaction lists should use table role for screen reader navigation');
    }

    if (this.containsFinancialAmounts(content) && !content.includes('aria-label')) {
      score -= 15;
      mobileSpecificIssues.push('Financial amounts need descriptive labels for screen readers');
    }

    const financialAccessibilityScore = Math.max(0, score - (mobileSpecificIssues.length * 5));

    return {
      score: Math.max(0, score),
      issues,
      mobileSpecificIssues,
      financialAccessibilityScore
    };
  }

  /**
   * Analyze performance for mobile devices
   */
  private async analyzePerformance(component: ComponentFile, componentType: FinancialComponentType): Promise<PerformanceAnalysis> {
    const content = component.content;
    let score = 100;
    const mobilePerformanceIssues: string[] = [];
    const optimizationSuggestions: string[] = [];
    const lazyLoadingOpportunities: string[] = [];

    // Check for React.memo
    if (!content.includes('React.memo') && !content.includes('memo(') && this.isComplexComponent(content)) {
      score -= 15;
      mobilePerformanceIssues.push('Complex component not memoized');
      optimizationSuggestions.push('Wrap component in React.memo to prevent unnecessary re-renders');
    }

    // Check for inline functions
    if (/onClick\s*=\s*{.*=>/.test(content)) {
      score -= 10;
      mobilePerformanceIssues.push('Inline functions in render cause unnecessary re-renders');
      optimizationSuggestions.push('Extract inline functions to useCallback hooks');
    }

    // Check for missing keys in lists
    if (content.includes('.map(') && !content.includes('key=')) {
      score -= 20;
      mobilePerformanceIssues.push('List items missing key prop');
      optimizationSuggestions.push('Add unique key prop to all list items');
    }

    // Financial component specific checks
    if (componentType === 'transaction-list' && content.includes('.map(') && !content.includes('virtual')) {
      score -= 25;
      mobilePerformanceIssues.push('Large transaction list not virtualized');
      optimizationSuggestions.push('Implement virtualization for large transaction lists');
    }

    // Check for lazy loading opportunities
    if (content.includes('img') && !content.includes('loading="lazy"')) {
      lazyLoadingOpportunities.push('Images can be lazy loaded');
    }

    if (componentType === 'budget-chart' && content.includes('Chart') && !content.includes('lazy')) {
      lazyLoadingOpportunities.push('Chart components can be dynamically imported');
    }

    const bundleSize = this.estimateBundleSize(content);
    const renderComplexity = this.calculateRenderComplexity(content);

    return {
      score: Math.max(0, score),
      bundleSize,
      renderComplexity,
      mobilePerformanceIssues,
      optimizationSuggestions,
      lazyLoadingOpportunities
    };
  }

  // Scoring and calculation methods

  private calculateTouchTargetScore(issues: TouchTargetIssue[]): number {
    if (issues.length === 0) return 100;
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    
    let score = 100;
    score -= (criticalIssues * 25);
    score -= (highIssues * 15);
    score -= (mediumIssues * 8);
    
    return Math.max(0, score);
  }

  private calculateLayoutScore(issues: LayoutComplexityIssue[]): number {
    if (issues.length === 0) return 100;
    
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;
    
    let score = 100;
    score -= (highIssues * 20);
    score -= (mediumIssues * 12);
    score -= (lowIssues * 5);
    
    return Math.max(0, score);
  }

  private calculateNavigationScore(issues: NavigationIssue[]): number {
    if (issues.length === 0) return 100;
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    
    let score = 100;
    score -= (criticalIssues * 30);
    score -= (highIssues * 18);
    score -= (mediumIssues * 10);
    
    return Math.max(0, score);
  }

  private calculateFinancialUXScore(issues: FinancialUXIssue[], componentType: FinancialComponentType): number {
    if (issues.length === 0) return 100;
    
    const criticalIssues = issues.filter(i => i.priority === 'critical').length;
    const highIssues = issues.filter(i => i.priority === 'high').length;
    const mediumIssues = issues.filter(i => i.priority === 'medium').length;
    
    let score = 100;
    score -= (criticalIssues * 25);
    score -= (highIssues * 15);
    score -= (mediumIssues * 8);
    
    // Bonus for financial component specific optimizations
    if (componentType !== 'other') {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallMobileScore(scores: {
    touchTargetScore: number;
    responsiveDesignScore: number;
    layoutOptimizationScore: number;
    navigationScore: number;
    financialUXScore: number;
    accessibilityScore: number;
    performanceScore: number;
  }): number {
    // Weighted scoring for financial SaaS priorities
    const weights = {
      touchTargetScore: 0.20,      // Critical for mobile financial apps
      responsiveDesignScore: 0.18, // Essential for mobile-first
      financialUXScore: 0.17,      // Key for financial user experience
      navigationScore: 0.15,       // Important for app navigation
      accessibilityScore: 0.12,    // Important for compliance
      performanceScore: 0.10,      // Important for mobile performance
      layoutOptimizationScore: 0.08 // Important but less critical
    };

    return Object.entries(scores).reduce((total, [key, score]) => {
      const weight = weights[key as keyof typeof weights] || 0;
      return total + (score * weight);
    }, 0);
  }

  private determinePriority(
    overallScore: number,
    factors: {
      criticalTouchIssues: number;
      criticalNavIssues: number;
      financialUXIssues: number;
      layoutComplexity: number;
    }
  ): MobileOptimizationPriority {
    // Critical priority
    if (factors.criticalTouchIssues > 0 || factors.criticalNavIssues > 0 || factors.financialUXIssues > 0) {
      return 'critical';
    }
    
    // High priority
    if (overallScore < 60 || factors.layoutComplexity > 2) {
      return 'high';
    }
    
    // Medium priority
    if (overallScore < 80) {
      return 'medium';
    }
    
    // Low priority
    return 'low';
  }

  // Helper methods

  private isTailwindClass(className: string): boolean {
    // Basic Tailwind class patterns
    const tailwindPatterns = [
      /^(sm|md|lg|xl|2xl):/,
      /^(p|m|mx|my|px|py|pt|pr|pb|pl|mt|mr|mb|ml)-/,
      /^(w|h|min-w|min-h|max-w|max-h)-/,
      /^(text|font|leading|tracking)-/,
      /^(bg|text|border|ring|shadow)-/,
      /^(flex|grid|block|inline|hidden|visible)/,
      /^(justify|items|content|self)-/,
      /^(border|rounded|cursor|overflow)/,
      /^(hover|focus|active|disabled|group|peer):/
    ];
    
    return tailwindPatterns.some(pattern => pattern.test(className));
  }

  private getBreakpointFromClass(className: string): 'sm' | 'md' | 'lg' | 'xl' | '2xl' | undefined {
    const match = className.match(/^(sm|md|lg|xl|2xl):/);
    return match ? match[1] as 'sm' | 'md' | 'lg' | 'xl' | '2xl' : undefined;
  }

  private categorizeClass(className: string): TailwindClass['category'] {
    if (/^(flex|grid|block|inline|absolute|relative|fixed|static)/.test(className)) return 'layout';
    if (/^(p|m|space|gap)-/.test(className)) return 'spacing';
    if (/^(w|h|min-|max-|size)-/.test(className)) return 'sizing';
    if (/^(text|font|leading|tracking)/.test(className)) return 'typography';
    if (/^(bg|text|border|ring|shadow)-\w*-/.test(className)) return 'color';
    if (/^(hover|focus|active|disabled|group|peer):/.test(className)) return 'interaction';
    if (/^(animate|transition|duration|ease)/.test(className)) return 'animation';
    return 'layout';
  }

  private isFinancialOptimized(className: string): boolean {
    // Classes that are specifically good for financial components
    const financialOptimizedClasses = [
      'tabular-nums',     // For aligning numbers
      'font-mono',        // For consistent number display
      'text-right',       // For right-aligning amounts
      'min-h-\\[44px\\]', // Touch target compliance
      'touch-manipulation', // Better touch performance
      'select-none',      // Prevent text selection on buttons
      'overflow-x-auto',  // For responsive tables
      'w-full',          // Responsive width
      'grid-cols-1',     // Mobile stacking
      'space-y-',        // Consistent vertical spacing
    ];
    
    return financialOptimizedClasses.some(pattern => 
      new RegExp(pattern).test(className)
    );
  }

  private hasResponsiveVariant(line: string, prefix: string): boolean {
    return this.responsivePrefixes.some(responsive => 
      line.includes(`${responsive}${prefix}`)
    );
  }

  private containsFinancialPattern(line: string): boolean {
    const financialPatterns = [
      'transaction', 'amount', 'balance', 'payment', 'budget', 'expense',
      'income', 'account', 'bank', 'card', 'currency', 'dollar', 'money'
    ];
    
    return financialPatterns.some(pattern => 
      line.toLowerCase().includes(pattern)
    );
  }

  private containsFinancialKeywords(line: string): boolean {
    return this.financialKeywords.some(keyword =>
      line.toLowerCase().includes(keyword)
    );
  }

  private isInteractiveFinancialElement(line: string): boolean {
    const interactivePatterns = ['button', 'btn', 'link', 'click', 'tap', 'touch'];
    const hasInteractive = interactivePatterns.some(pattern =>
      line.toLowerCase().includes(pattern)
    );
    
    return hasInteractive && this.containsFinancialPattern(line);
  }

  private isInteractiveElement(line: string): boolean {
    const patterns = [
      /(<button|<Button)/,
      /onClick\s*=/,
      /onPress\s*=/,
      /cursor-pointer/,
      /hover:/,
      /<a\s+/,
      /role\s*=\s*["']button["']/,
      /tabIndex/,
    ];
    
    return patterns.some(pattern => pattern.test(line));
  }

  private checkTouchTargetSize(line: string, lineNumber: number): Omit<TouchTargetIssue, 'isFinancialElement' | 'financialElementType' | 'suggestedFix'> | null {
    const minSize = this.config.minTouchTargetSize;
    
    // Extract size information
    const widthMatch = line.match(/w-(\d+)/) || line.match(/w-\[(\d+)px\]/);
    const heightMatch = line.match(/h-(\d+)/) || line.match(/h-\[(\d+)px\]/);
    const minHeightMatch = line.match(/min-h-\[(\d+)px\]/);
    const sizeMatch = line.match(/size-(\d+)/);
    
    let width: number | 'unknown' = 'unknown';
    let height: number | 'unknown' = 'unknown';
    
    if (sizeMatch) {
      width = height = parseInt(sizeMatch[1]) * 4; // Tailwind spacing units
    }
    if (widthMatch) {
      width = widthMatch[1].includes('px') ? 
        parseInt(widthMatch[1]) : 
        parseInt(widthMatch[1]) * 4;
    }
    if (heightMatch) {
      height = heightMatch[1].includes('px') ? 
        parseInt(heightMatch[1]) : 
        parseInt(heightMatch[1]) * 4;
    }
    if (minHeightMatch) {
      height = parseInt(minHeightMatch[1]);
    }
    
    // Check for touch target violations
    const hasWidthIssue = typeof width === 'number' && width < minSize;
    const hasHeightIssue = typeof height === 'number' && height < minSize;
    const hasUnknownSize = width === 'unknown' && height === 'unknown';
    
    if (hasWidthIssue || hasHeightIssue || hasUnknownSize) {
      let severity: TouchTargetIssue['severity'] = 'medium';
      if (hasUnknownSize) severity = 'medium';
      else if ((typeof width === 'number' && width < 32) || (typeof height === 'number' && height < 32)) {
        severity = 'critical';
      } else if ((typeof width === 'number' && width < 40) || (typeof height === 'number' && height < 40)) {
        severity = 'high';
      }
      
      return {
        elementType: this.extractElementFromLine(line),
        currentSize: { width, height },
        recommendedSize: { width: minSize, height: minSize },
        severity,
        lineNumber,
        context: line.trim()
      };
    }
    
    return null;
  }

  private generateTouchTargetFix(
    issue: Omit<TouchTargetIssue, 'isFinancialElement' | 'financialElementType' | 'suggestedFix'>,
    isFinancialElement: boolean,
    elementType?: TouchTargetIssue['financialElementType']
  ): string {
    const minSize = this.config.minTouchTargetSize;
    
    if (isFinancialElement) {
      switch (elementType) {
        case 'button':
          return `Add "min-h-[${minSize}px] min-w-[${minSize}px] p-3 touch-manipulation" for financial action buttons`;
        case 'form-control':
          return `Use "h-12 px-4 py-3 touch-manipulation" for financial form inputs`;
        case 'nav-item':
          return `Apply "min-h-[${minSize}px] px-4 py-3" for navigation items`;
        case 'chart-element':
          return `Ensure chart interactive elements have minimum ${minSize}px touch areas`;
        default:
          return `Add "min-h-[${minSize}px] min-w-[${minSize}px] p-2" for touch compliance`;
      }
    }
    
    return `Add "min-h-[${minSize}px] min-w-[${minSize}px]" classes to meet touch target requirements`;
  }

  private calculateMobileFirstScore(classes: TailwindClass[]): number {
    if (classes.length === 0) return 0;
    
    const responsiveClasses = classes.filter(c => c.isResponsive).length;
    return (responsiveClasses / classes.length) * 100;
  }

  private calculateResponsiveImplementationScore(classes: TailwindClass[], component: ComponentFile): number {
    let score = 100;
    
    // Check for common responsive patterns
    const hasResponsiveWidth = classes.some(c => c.className.includes('w-') && c.isResponsive);
    const hasResponsiveText = classes.some(c => c.className.includes('text-') && c.isResponsive);
    const hasResponsiveSpacing = classes.some(c => c.className.includes('p-') && c.isResponsive);
    const hasResponsiveGrid = classes.some(c => c.className.includes('grid-cols-') && c.isResponsive);
    
    if (!hasResponsiveWidth) score -= 15;
    if (!hasResponsiveText) score -= 10;
    if (!hasResponsiveSpacing) score -= 10;
    if (component.content.includes('grid-cols-') && !hasResponsiveGrid) score -= 20;
    
    // Bonus for mobile-first approach (base classes without prefixes)
    const baseClasses = classes.filter(c => !c.isResponsive).length;
    const responsiveClasses = classes.filter(c => c.isResponsive).length;
    
    if (baseClasses > 0 && responsiveClasses > 0) {
      score += 10; // Bonus for mobile-first approach
    }
    
    return Math.max(0, score);
  }

  // Additional helper methods...
  
  private extractClassesFromLine(line: string): string[] {
    const match = line.match(/className\s*=\s*["'`{]([^"'`}]*)["'`}]/);
    return match ? match[1].split(/\s+/).filter(cls => cls.length > 0) : [];
  }

  private extractElementFromLine(line: string): string {
    const match = line.match(/<(\w+)/);
    return match ? match[1] : 'element';
  }

  private hasAriaLabel(line: string): boolean {
    return /aria-label\s*=/i.test(line);
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
      /flex-col/g, /flex-row/g, /flex-wrap/g, /justify-/g,
      /items-/g, /content-/g, /self-/g, /flex-1/g, /flex-auto/g,
      /flex-none/g, /flex-shrink/g, /flex-grow/g
    ];
    
    return flexPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
  }

  private countConditionalRendering(content: string): number {
    const conditionalPatterns = [
      /\{[^}]*\?[^}]*:[^}]*\}/g,  // Ternary operators
      /\{[^}]*&&[^}]*\}/g,        // Logical AND
      /\{[^}]*\|\|[^}]*\}/g,      // Logical OR
    ];
    
    return conditionalPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
  }

  private hasResponsiveGridStacking(content: string): boolean {
    return /grid-cols-1\s+.*grid-cols-[2-9]/.test(content) ||
           /grid-cols-1.*md:grid-cols/.test(content) ||
           /grid-cols-1.*lg:grid-cols/.test(content);
  }

  private hasProperInputTypes(content: string): boolean {
    return content.includes('type="number"') ||
           content.includes('type="tel"') ||
           content.includes('inputMode="decimal"') ||
           content.includes('pattern="[0-9]');
  }

  private containsFinancialAmounts(content: string): boolean {
    return /\$[\d,]+|\d+\.\d{2}|balance|amount|total|price/.test(content);
  }

  private hasInteractiveElements(content: string): boolean {
    return this.interactiveElements.some(element =>
      content.toLowerCase().includes(element)
    );
  }

  private isComplexComponent(content: string): boolean {
    return content.length > 500 && 
           (content.includes('useState') || content.includes('useEffect') ||
            content.split('\n').length > 50);
  }

  private estimateBundleSize(content: string): number {
    // Rough estimation based on content length and import statements
    const importCount = (content.match(/import/g) || []).length;
    return Math.round(content.length * 0.8 + importCount * 100);
  }

  private calculateRenderComplexity(content: string): 'low' | 'medium' | 'high' {
    const factors = [
      (content.match(/\.map\(/g) || []).length,           // List rendering
      (content.match(/useState|useEffect/g) || []).length, // State management
      (content.match(/\?.*:/g) || []).length,             // Conditional rendering
      this.calculateNestingDepth(content)                  // Component nesting
    ];
    
    const complexityScore = factors.reduce((sum, factor) => sum + factor, 0);
    
    if (complexityScore > 15) return 'high';
    if (complexityScore > 8) return 'medium';
    return 'low';
  }

  // Default analysis methods for optional features
  private getDefaultFramerMotionAnalysis(): FramerMotionAnalysis {
    return {
      hasAnimations: false,
      animationTypes: [],
      mobileOptimized: true,
      performanceImpact: 'low',
      recommendations: []
    };
  }

  private getDefaultAccessibilityAnalysis(): AccessibilityAnalysis {
    return {
      score: 85,
      issues: [],
      mobileSpecificIssues: [],
      financialAccessibilityScore: 85
    };
  }

  private getDefaultPerformanceAnalysis(): PerformanceAnalysis {
    return {
      score: 85,
      bundleSize: 0,
      renderComplexity: 'low',
      mobilePerformanceIssues: [],
      optimizationSuggestions: [],
      lazyLoadingOpportunities: []
    };
  }

  private async generateRecommendations(
    touchTargetIssues: TouchTargetIssue[],
    responsiveGaps: TailwindResponsiveGap[],
    layoutIssues: LayoutComplexityIssue[],
    navigationIssues: NavigationIssue[],
    financialUXIssues: FinancialUXIssue[],
    componentType: FinancialComponentType
  ) {
    const immediateActions: string[] = [];
    const shortTermImprovements: string[] = [];
    const longTermOptimizations: string[] = [];

    // Immediate actions (critical issues)
    const criticalTouchIssues = touchTargetIssues.filter(i => i.severity === 'critical');
    if (criticalTouchIssues.length > 0) {
      immediateActions.push(`Fix ${criticalTouchIssues.length} critical touch target violations`);
    }

    const criticalNavIssues = navigationIssues.filter(i => i.severity === 'critical');
    if (criticalNavIssues.length > 0) {
      immediateActions.push(`Address ${criticalNavIssues.length} critical navigation accessibility issues`);
    }

    // Short-term improvements
    if (responsiveGaps.length > 0) {
      shortTermImprovements.push(`Implement responsive design for ${responsiveGaps.length} elements`);
    }

    const highPriorityUXIssues = financialUXIssues.filter(i => i.priority === 'high');
    if (highPriorityUXIssues.length > 0) {
      shortTermImprovements.push(`Optimize ${highPriorityUXIssues.length} high-priority financial UX patterns`);
    }

    // Long-term optimizations
    const highLayoutIssues = layoutIssues.filter(i => i.severity === 'high');
    if (highLayoutIssues.length > 0) {
      longTermOptimizations.push(`Refactor ${highLayoutIssues.length} complex layout structures`);
    }

    // Component-specific recommendations
    switch (componentType) {
      case 'transaction-list':
        longTermOptimizations.push('Implement virtualization for better mobile performance');
        shortTermImprovements.push('Add swipe gestures for transaction actions');
        break;
      case 'dashboard-card':
        shortTermImprovements.push('Implement mobile-first responsive stacking');
        longTermOptimizations.push('Add progressive disclosure for detailed data');
        break;
      case 'budget-chart':
        shortTermImprovements.push('Add touch interactions for chart elements');
        longTermOptimizations.push('Implement responsive chart sizing');
        break;
    }

    return {
      immediateActions,
      shortTermImprovements,
      longTermOptimizations
    };
  }

  // Line finding helper methods
  private findDeepestNestingLine(content: string): number {
    const lines = content.split('\n');
    let maxDepth = 0;
    let maxDepthLine = 1;
    let currentDepth = 0;
    
    lines.forEach((line, index) => {
      const openTags = (line.match(/</g) || []).length;
      const closeTags = (line.match(/>/g) || []).length;
      const selfClosing = (line.match(/\/>/g) || []).length;
      
      currentDepth += openTags - closeTags - selfClosing;
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        maxDepthLine = index + 1;
      }
    });
    
    return maxDepthLine;
  }

  private findMostComplexFlexboxLine(content: string): number {
    const lines = content.split('\n');
    let maxComplexity = 0;
    let maxComplexityLine = 1;
    
    lines.forEach((line, index) => {
      const flexCount = (line.match(/flex|justify|items|content|self/g) || []).length;
      if (flexCount > maxComplexity) {
        maxComplexity = flexCount;
        maxComplexityLine = index + 1;
      }
    });
    
    return maxComplexityLine;
  }

  private findMostConditionalLine(content: string): number {
    const lines = content.split('\n');
    let maxConditionals = 0;
    let maxConditionalsLine = 1;
    
    lines.forEach((line, index) => {
      const conditionals = (line.match(/\?|&&|\|\||if\s*\(/g) || []).length;
      if (conditionals > maxConditionals) {
        maxConditionals = conditionals;
        maxConditionalsLine = index + 1;
      }
    });
    
    return maxConditionalsLine;
  }
}