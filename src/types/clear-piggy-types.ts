/**
 * TypeScript interfaces for Clear Piggy mobile optimization analysis
 * Specialized for financial SaaS patterns and requirements
 */

export interface ComponentFile {
  path: string;
  name: string;
  content: string;
  size: number;
  lastModified: Date;
  relativePath: string;
  isDesktopVersion: boolean;
  isMobileVersion: boolean;
}

export type FinancialComponentType = 
  | 'transaction-list'
  | 'dashboard-card' 
  | 'budget-chart'
  | 'form'
  | 'navigation'
  | 'other';

export type MobileOptimizationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TailwindClass {
  className: string;
  isResponsive: boolean;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  category: 'layout' | 'spacing' | 'sizing' | 'typography' | 'color' | 'interaction' | 'animation';
  isFinancialOptimized: boolean;
}

export interface TouchTargetIssue {
  elementType: string;
  currentSize: {
    width: number | 'unknown';
    height: number | 'unknown';
  };
  recommendedSize: {
    width: number;
    height: number;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  lineNumber: number;
  context: string;
  isFinancialElement: boolean;
  financialElementType?: 'button' | 'link' | 'form-control' | 'nav-item' | 'chart-element';
  suggestedFix: string;
}

export interface TailwindResponsiveGap {
  issue: string;
  currentClasses: string[];
  suggestedClasses: string[];
  affectedBreakpoint: 'mobile' | 'tablet' | 'desktop';
  impactLevel: 'layout-breaking' | 'ux-degradation' | 'minor-inconsistency';
  lineNumber: number;
  elementContext: string;
  financialImpact?: string;
}

export interface LayoutComplexityIssue {
  type: 'deep-nesting' | 'complex-flexbox' | 'complex-grid' | 'excessive-conditionals';
  severity: 'high' | 'medium' | 'low';
  description: string;
  currentValue: number;
  recommendedValue: number;
  lineNumber: number;
  suggestion: string;
  mobileImpact: string;
}

export interface NavigationIssue {
  pattern: string;
  issue: string;
  recommendation: string;
  mobilePattern: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lineNumber: number;
  accessibilityImpact: boolean;
  financialWorkflowImpact?: string;
}

export interface FinancialUXIssue {
  componentType: FinancialComponentType;
  issue: string;
  mobileSpecificImpact: string;
  recommendation: string;
  priority: MobileOptimizationPriority;
  lineNumber?: number;
  examples: string[];
}

export interface FramerMotionAnalysis {
  hasAnimations: boolean;
  animationTypes: string[];
  mobileOptimized: boolean;
  performanceImpact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface AccessibilityAnalysis {
  score: number; // 0-100
  issues: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    fix: string;
  }>;
  mobileSpecificIssues: string[];
  financialAccessibilityScore: number; // 0-100
}

export interface PerformanceAnalysis {
  score: number; // 0-100
  bundleSize: number;
  renderComplexity: 'low' | 'medium' | 'high';
  mobilePerformanceIssues: string[];
  optimizationSuggestions: string[];
  lazyLoadingOpportunities: string[];
}

export interface ClearPiggyAnalysisResult {
  componentFile: ComponentFile;
  financialComponentType: FinancialComponentType;
  overallMobileScore: number; // 0-100
  priority: MobileOptimizationPriority;
  
  // Core Analysis Areas
  tailwindAnalysis: {
    classes: TailwindClass[];
    mobileFirstScore: number; // 0-100
    responsiveImplementationScore: number; // 0-100
  };
  
  tailwindResponsiveGaps: TailwindResponsiveGap[];
  touchTargetIssues: TouchTargetIssue[];
  layoutComplexityIssues: LayoutComplexityIssue[];
  navigationIssues: NavigationIssue[];
  financialUXIssues: FinancialUXIssue[];
  
  // Advanced Analysis
  framerMotionAnalysis: FramerMotionAnalysis;
  accessibilityAnalysis: AccessibilityAnalysis;
  performanceAnalysis: PerformanceAnalysis;
  
  // Scores (0-100 each)
  touchTargetScore: number;
  responsiveDesignScore: number;
  layoutOptimizationScore: number;
  navigationScore: number;
  financialUXScore: number;
  accessibilityScore: number;
  performanceScore: number;
  
  // Recommendations
  immediateActions: string[];
  shortTermImprovements: string[];
  longTermOptimizations: string[];
}

export interface ClearPiggyProjectReport {
  metadata: {
    projectName: string;
    analysisDate: Date;
    totalComponentsFound: number;
    totalComponentsAnalyzed: number;
    analysisVersion: string;
    configUsed: ClearPiggyConfig;
  };
  
  executiveSummary: {
    overallMobileScore: number; // 0-100
    totalIssuesFound: number;
    criticalIssuesCount: number;
    highPriorityIssuesCount: number;
    componentsNeedingAttention: number;
    estimatedEffortHours: number;
    topIssueCategories: string[];
    quickWins: string[];
  };
  
  componentAnalysis: ClearPiggyAnalysisResult[];
  
  financialUXInsights: {
    transactionListFindings: {
      componentsAnalyzed: number;
      averageScore: number;
      commonIssues: string[];
      recommendations: string[];
    };
    dashboardFindings: {
      componentsAnalyzed: number;
      averageScore: number;
      commonIssues: string[];
      recommendations: string[];
    };
    chartFindings: {
      componentsAnalyzed: number;
      averageScore: number;
      commonIssues: string[];
      recommendations: string[];
    };
    formFindings: {
      componentsAnalyzed: number;
      averageScore: number;
      commonIssues: string[];
      recommendations: string[];
    };
  };
  
  technicalDebt: {
    touchTargetDebt: {
      totalViolations: number;
      criticalViolations: number;
      estimatedFixTime: string;
    };
    responsiveDesignDebt: {
      totalGaps: number;
      majorBreakpoints: string[];
      estimatedFixTime: string;
    };
    performanceDebt: {
      componentsWithIssues: number;
      averagePerformanceScore: number;
      estimatedImprovementTime: string;
    };
  };
  
  implementationRoadmap: {
    phase1_Critical: {
      duration: string;
      components: string[];
      actions: string[];
      expectedImpact: string;
    };
    phase2_HighPriority: {
      duration: string;
      components: string[];
      actions: string[];
      expectedImpact: string;
    };
    phase3_Optimization: {
      duration: string;
      components: string[];
      actions: string[];
      expectedImpact: string;
    };
  };
  
  aiInsights: {
    keyFindings: string[];
    implementationStrategy: string[];
    financialUXRecommendations: string[];
    technicalPriorities: string[];
    riskAssessment: string[];
  };
  
  comparisonAnalysis?: {
    desktopVsMobile: {
      componentsCompared: number;
      averageOptimizationGap: number;
      consistencyScore: number;
      recommendations: string[];
    };
  };
}

export interface ClearPiggyConfig {
  projectPath: string;
  componentsPath: string;
  mobileUIPath?: string;
  outputPath: string;
  
  // Analysis Configuration
  minTouchTargetSize: number;
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  desktopBreakpoint: number;
  
  // Feature Flags
  enableFramerMotionAnalysis: boolean;
  enablePerformanceAnalysis: boolean;
  enableAccessibilityDeepDive: boolean;
  enableAIInsights: boolean;
  enableDesktopMobileComparison: boolean;
  
  // Financial SaaS Specific
  financialComponentPatterns: string[];
  priorityComponents: string[];
  excludePatterns: string[];
  
  // Reporting
  generateHTMLReport: boolean;
  generatePDFReport: boolean;
  includeCodeSamples: boolean;
  includeScreenshots: boolean;
}

export interface MobileOptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'touch-targets' | 'responsive' | 'layout' | 'navigation' | 'performance' | 'accessibility' | 'financial-ux';
  severity: MobileOptimizationPriority;
  financialSpecific: boolean;
  checkFunction: string; // Function name to execute
  autoFixable: boolean;
  estimatedFixTime: string; // e.g., "15 minutes", "2 hours"
  documentation: string;
}

export interface ClearPiggyBenchmark {
  componentType: FinancialComponentType;
  targetScores: {
    overallMobile: number;
    touchTargets: number;
    responsiveDesign: number;
    accessibility: number;
    performance: number;
    financialUX: number;
  };
  industryBenchmarks: {
    averageScore: number;
    topPerformers: number;
    minimumAcceptable: number;
  };
}

export interface OptimizationSuggestion {
  componentName: string;
  issue: string;
  currentImplementation: string;
  suggestedImplementation: string;
  codeExample?: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  difficultyLevel: 'easy' | 'medium' | 'hard';
  tags: string[];
}