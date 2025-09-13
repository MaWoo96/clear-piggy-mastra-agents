/**
 * TypeScript interfaces for Clear Piggy mobile optimization analysis
 */

export interface ComponentFile {
  path: string;
  name: string;
  content: string;
  size: number;
  lastModified: Date;
}

export interface TailwindClass {
  className: string;
  responsive: boolean;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  category: 'layout' | 'spacing' | 'sizing' | 'typography' | 'color' | 'interaction';
}

export interface TouchTargetIssue {
  element: string;
  currentSize: {
    width: number | 'unknown';
    height: number | 'unknown';
  };
  recommendedSize: {
    width: number;
    height: number;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  context: string;
}

export interface ResponsivenessGap {
  issue: string;
  currentClasses: string[];
  suggestedClasses: string[];
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  impact: 'layout-breaking' | 'ux-degradation' | 'minor-inconsistency';
  line: number;
  element: string;
}

export interface LayoutComplexityMetrics {
  nestingDepth: number;
  flexboxComplexity: number;
  gridComplexity: number;
  conditionalRendering: number;
  totalElements: number;
  mobileOptimizationScore: number; // 0-100
}

export interface NavigationPatternIssue {
  pattern: string;
  issue: string;
  recommendation: string;
  mobilePattern: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
}

export interface FinancialComponentAnalysis {
  componentType: 'transaction-list' | 'budget-chart' | 'dashboard-card' | 'form' | 'navigation' | 'other';
  mobileOptimized: boolean;
  accessibilityScore: number; // 0-100
  performanceScore: number; // 0-100
  financialUXScore: number; // 0-100
  specificIssues: string[];
  recommendations: string[];
}

export interface ComponentAnalysisResult {
  file: ComponentFile;
  tailwindAnalysis: {
    classes: TailwindClass[];
    responsivenessGaps: ResponsivenessGap[];
    mobileFirstScore: number; // 0-100
  };
  touchTargetAnalysis: {
    issues: TouchTargetIssue[];
    passRate: number; // 0-100
  };
  layoutAnalysis: {
    complexity: LayoutComplexityMetrics;
    mobileCompatibility: 'excellent' | 'good' | 'needs-improvement' | 'poor';
    recommendations: string[];
  };
  navigationAnalysis: {
    patterns: string[];
    issues: NavigationPatternIssue[];
    mobileNavScore: number; // 0-100
  };
  financialAnalysis: FinancialComponentAnalysis;
  overallScore: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ProjectAnalysisReport {
  projectInfo: {
    name: string;
    totalComponents: number;
    analyzedComponents: number;
    timestamp: Date;
    version: string;
  };
  summary: {
    overallMobileScore: number; // 0-100
    criticalIssues: number;
    highPriorityIssues: number;
    componentsNeedingWork: number;
    topIssueCategories: string[];
  };
  componentResults: ComponentAnalysisResult[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  financialUXInsights: {
    transactionListOptimization: string[];
    budgetChartImprovements: string[];
    dashboardEnhancements: string[];
    formOptimizations: string[];
  };
}

export interface AnalysisConfig {
  projectPath: string;
  componentsPath: string;
  outputPath: string;
  includeTests: boolean;
  minTouchTargetSize: number;
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  enableFramerMotionAnalysis: boolean;
  enableSupabaseIntegrationCheck: boolean;
  enablePlaidIntegrationCheck: boolean;
}

export interface MobileOptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'touch-targets' | 'responsiveness' | 'layout' | 'navigation' | 'performance' | 'accessibility' | 'financial-ux';
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
  checkFunction: (component: ComponentFile) => Promise<boolean>;
  recommendation: string;
}