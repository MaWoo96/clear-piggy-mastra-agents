/**
 * TypeScript interfaces for Clear Piggy mobile component generation
 */

export interface ComponentGenerationConfig {
  projectPath: string;
  outputPath: string;
  componentsPath: string;
  storybookPath?: string;
  enableStorybook: boolean;
  enableTypescriptInterfaces: boolean;
  enableSupabaseIntegration: boolean;
  targetFrameworks: {
    tailwindcss: boolean;
    framerMotion: boolean;
    recharts: boolean;
    reactQuery: boolean;
  };
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA';
    enableAriaLabels: boolean;
    enableKeyboardNavigation: boolean;
  };
}

export type FinancialComponentPattern = 
  | 'transaction-list'
  | 'budget-card' 
  | 'dashboard-metrics'
  | 'navigation-bar'
  | 'chart-component'
  | 'form-financial'
  | 'receipt-upload'
  | 'account-summary';

export interface DesktopComponentInput {
  filePath: string;
  componentName: string;
  content: string;
  detectedPattern: FinancialComponentPattern;
  dependencies: string[];
  props: ComponentPropDefinition[];
  supabaseIntegrations: SupabaseIntegration[];
}

export interface ComponentPropDefinition {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

export interface SupabaseIntegration {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'subscribe';
  columns: string[];
  filters?: Record<string, any>;
  realtime?: boolean;
}

export interface MobileComponentOutput {
  componentName: string;
  filePath: string;
  componentCode: string;
  interfaceCode: string;
  storybookCode?: string;
  testCode?: string;
  documentation: string;
  mobileOptimizations: MobileOptimization[];
  accessibilityFeatures: AccessibilityFeature[];
}

export interface MobileOptimization {
  type: 'touch-targets' | 'responsive-layout' | 'performance' | 'gestures' | 'loading-states';
  description: string;
  implementation: string;
  benefit: string;
}

export interface AccessibilityFeature {
  feature: string;
  wcagCriterion: string;
  implementation: string;
  testing: string;
}

export interface ComponentTemplate {
  pattern: FinancialComponentPattern;
  name: string;
  description: string;
  baseTemplate: string;
  mobileOptimizations: string[];
  requiredDependencies: string[];
  tailwindClasses: string[];  // Simplified to string array
  framerMotionAnimations: string[];  // Simplified to string array
  accessibilityRequirements: string[];  // Simplified to string array
}

export interface TailwindPattern {
  breakpoint: 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  classes: string[];
  purpose: string;
}

export interface FramerMotionPattern {
  animationType: 'initial' | 'animate' | 'exit' | 'whileHover' | 'whileTap' | 'layout';
  properties: Record<string, any>;
  timing: {
    duration?: number;
    delay?: number;
    ease?: string;
  };
  trigger: string;
}

export interface AccessibilityRequirement {
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  implementation: string;
  testing: string;
}

export interface GenerationResult {
  success: boolean;
  componentsGenerated: MobileComponentOutput[];
  errors: GenerationError[];
  warnings: string[];
  summary: {
    totalComponents: number;
    successfulGenerations: number;
    failedGenerations: number;
    optimizationsApplied: number;
    accessibilityFeatures: number;
  };
}

export interface GenerationError {
  componentName: string;
  error: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface FinancialDataPattern {
  type: 'currency' | 'percentage' | 'date' | 'account-number' | 'transaction-id';
  format: string;
  validation: {
    pattern: string;
    errorMessage: string;
  };
  mobileDisplay: {
    compact: string;
    full: string;
  };
}

export interface TouchInteractionPattern {
  gesture: 'tap' | 'long-press' | 'swipe-left' | 'swipe-right' | 'pinch' | 'pan';
  action: string;
  feedback: {
    haptic?: boolean;
    visual?: string;
    audio?: boolean;
  };
  accessibility: {
    alternativeMethod: string;
    announcement: string;
  };
}