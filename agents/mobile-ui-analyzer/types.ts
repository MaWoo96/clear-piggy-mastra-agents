export interface MobileUIAnalyzerConfig {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  settings: {
    minTouchTargetSize: number;
    mobileBreakpoint: number;
    tabletBreakpoint: number;
    analysisDepth: 'quick' | 'standard' | 'comprehensive';
    scoring: {
      touchTargetWeight: number;
      responsiveWeight: number;
      accessibilityWeight: number;
      performanceWeight: number;
      uxWeight: number;
    };
    thresholds: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  integrations: {
    tailwindcss?: {
      enabled: boolean;
      configPath: string;
    };
    typescript?: {
      enabled: boolean;
      strict: boolean;
    };
    react?: {
      version: string;
      strictMode: boolean;
    };
  };
  output: {
    formats: string[];
    includeRecommendations: boolean;
    includeCodeSamples: boolean;
    generatePriority: boolean;
  };
}

export interface ComponentAnalysisRequest {
  componentPath: string;
  analysisType?: 'full' | 'quick' | 'touch-targets' | 'responsive';
  options?: {
    minTouchTargetSize?: number;
    breakpoints?: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
    includeRecommendations?: boolean;
    generateReport?: boolean;
  };
}

export interface TouchTargetIssue {
  element: string;
  currentSize: string;
  requiredSize: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: {
    line: number;
    column: number;
  };
  suggestion: string;
}

export interface ResponsiveDesignIssue {
  type: 'missing-breakpoint' | 'fixed-size' | 'overflow' | 'layout';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: {
    line: number;
    column: number;
  };
  suggestion: string;
  affectedBreakpoints: string[];
}

export interface AccessibilityViolation {
  type: 'missing-alt' | 'missing-aria' | 'poor-contrast' | 'keyboard-nav';
  element: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  wcagLevel: 'A' | 'AA' | 'AAA';
  suggestion: string;
}

export interface PerformanceIssue {
  type: 'unnecessary-render' | 'inline-style' | 'large-bundle' | 'memory-leak';
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  currentValue: number;
  targetValue: number;
  suggestion: string;
}

export interface UXPatternAnalysis {
  hasLoadingStates: boolean;
  hasErrorHandling: boolean;
  hasEmptyStates: boolean;
  hasFeedback: boolean;
  mobileGestures: string[];
  interactionPatterns: string[];
  issues: string[];
  recommendations: string[];
}

export interface MobileOptimizationReport {
  componentName: string;
  componentPath: string;
  timestamp: string;
  
  // Analysis results
  touchTargetAnalysis: {
    score: number;
    issues: TouchTargetIssue[];
    passedElements: number;
    failedElements: number;
  };
  
  responsiveAnalysis: {
    score: number;
    issues: ResponsiveDesignIssue[];
    breakpointsCovered: string[];
    missingBreakpoints: string[];
    responsiveScore: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
  
  accessibilityAnalysis: {
    score: number;
    violations: AccessibilityViolation[];
    wcagCompliance: {
      levelA: boolean;
      levelAA: boolean;
      levelAAA: boolean;
    };
  };
  
  performanceAnalysis: {
    score: number;
    issues: PerformanceIssue[];
    metrics: {
      bundleSize: number;
      renderTime: number;
      memoryUsage: number;
    };
  };
  
  uxAnalysis: UXPatternAnalysis;
  
  // Overall results
  overallScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  
  // Code improvements
  codeImprovements: {
    before: string;
    after: string;
    description: string;
    impact: string;
  }[];
}

export interface BatchAnalysisRequest {
  projectPath: string;
  componentPaths?: string[];
  filters?: {
    includePatterns: string[];
    excludePatterns: string[];
    minFileSize?: number;
    maxFileSize?: number;
  };
  analysisOptions: {
    analysisType: 'full' | 'quick' | 'targeted';
    priority: 'all' | 'critical' | 'high';
    generateReports: boolean;
    outputFormat: 'json' | 'html' | 'markdown' | 'csv';
  };
}

export interface BatchAnalysisResults {
  projectPath: string;
  timestamp: string;
  summary: {
    totalComponents: number;
    analyzedComponents: number;
    skippedComponents: number;
    averageScore: number;
    criticalIssues: number;
    highPriorityIssues: number;
  };
  componentReports: MobileOptimizationReport[];
  aggregatedInsights: {
    mostCommonIssues: Array<{
      type: string;
      count: number;
      impact: string;
    }>;
    improvementOpportunities: string[];
    recommendedActions: string[];
  };
}

export interface AgentPerformanceMetrics {
  analysisTime: number;
  memoryUsage: number;
  componentsPerSecond: number;
  accuracyScore: number;
  errorRate: number;
}

export interface MobileUIAnalyzerAgent {
  config: MobileUIAnalyzerConfig;
  analyzeComponent(request: ComponentAnalysisRequest): Promise<MobileOptimizationReport>;
  analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResults>;
  generateReport(analysis: MobileOptimizationReport, format: 'json' | 'html' | 'markdown'): Promise<string>;
  getPerformanceMetrics(): AgentPerformanceMetrics;
  validateConfiguration(): boolean;
  updateConfiguration(updates: Partial<MobileUIAnalyzerConfig>): void;
}