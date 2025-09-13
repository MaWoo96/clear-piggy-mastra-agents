import { Tool } from '@mastra/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ComponentAnalysis, TouchTargetAnalysis, ResponsiveAnalysis } from '../../types/clear-piggy-types';

export const analyzeComponentTool: Tool = {
  id: 'analyze-component',
  name: 'Analyze Component',
  description: 'Analyzes a React component for mobile optimization opportunities',
  parameters: {
    type: 'object',
    properties: {
      componentPath: {
        type: 'string',
        description: 'Path to the React component file'
      },
      analysisType: {
        type: 'string',
        enum: ['full', 'quick', 'touch-targets', 'responsive'],
        description: 'Type of analysis to perform'
      }
    },
    required: ['componentPath']
  },
  
  execute: async ({ componentPath, analysisType = 'full' }) => {
    try {
      const componentCode = await fs.readFile(componentPath, 'utf-8');
      const analysis = await performComponentAnalysis(componentCode, componentPath, analysisType);
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export const validateTouchTargetsTool: Tool = {
  id: 'validate-touch-targets',
  name: 'Validate Touch Targets',
  description: 'Validates touch target sizes in component code',
  parameters: {
    type: 'object',
    properties: {
      componentCode: {
        type: 'string',
        description: 'The component code to analyze'
      },
      minSize: {
        type: 'number',
        description: 'Minimum touch target size in pixels',
        default: 44
      }
    },
    required: ['componentCode']
  },
  
  execute: async ({ componentCode, minSize = 44 }) => {
    const touchTargetAnalysis = analyzeTouchTargets(componentCode, minSize);
    return {
      success: true,
      data: touchTargetAnalysis
    };
  }
};

export const analyzeResponsiveDesignTool: Tool = {
  id: 'analyze-responsive-design',
  name: 'Analyze Responsive Design',
  description: 'Analyzes component for responsive design patterns',
  parameters: {
    type: 'object',
    properties: {
      componentCode: {
        type: 'string',
        description: 'The component code to analyze'
      },
      breakpoints: {
        type: 'object',
        description: 'Breakpoint configuration',
        properties: {
          mobile: { type: 'number', default: 768 },
          tablet: { type: 'number', default: 1024 },
          desktop: { type: 'number', default: 1440 }
        }
      }
    },
    required: ['componentCode']
  },
  
  execute: async ({ componentCode, breakpoints = { mobile: 768, tablet: 1024, desktop: 1440 } }) => {
    const responsiveAnalysis = analyzeResponsivePatterns(componentCode, breakpoints);
    return {
      success: true,
      data: responsiveAnalysis
    };
  }
};

export const generateRecommendationsTool: Tool = {
  id: 'generate-recommendations',
  name: 'Generate Recommendations',
  description: 'Generates actionable recommendations based on analysis results',
  parameters: {
    type: 'object',
    properties: {
      analysis: {
        type: 'object',
        description: 'Component analysis results'
      },
      priority: {
        type: 'string',
        enum: ['all', 'critical', 'high', 'medium'],
        description: 'Priority level for recommendations',
        default: 'all'
      }
    },
    required: ['analysis']
  },
  
  execute: async ({ analysis, priority = 'all' }) => {
    const recommendations = generateOptimizationRecommendations(analysis, priority);
    return {
      success: true,
      data: recommendations
    };
  }
};

// Helper functions
async function performComponentAnalysis(
  componentCode: string, 
  componentPath: string, 
  analysisType: string
): Promise<ComponentAnalysis> {
  const analysis: ComponentAnalysis = {
    componentPath,
    componentName: path.basename(componentPath, path.extname(componentPath)),
    timestamp: new Date().toISOString(),
    
    // Initialize analysis results
    touchTargets: { score: 0, issues: [], violations: [] },
    responsive: { score: 0, issues: [], missingBreakpoints: [], suggestions: [] },
    accessibility: { score: 0, issues: [], violations: [] },
    performance: { score: 0, issues: [], metrics: {} },
    ux: { score: 0, issues: [], patterns: [] },
    
    overallScore: 0,
    priority: 'medium',
    recommendations: []
  };

  // Perform different types of analysis based on analysisType
  switch (analysisType) {
    case 'full':
      analysis.touchTargets = analyzeTouchTargets(componentCode);
      analysis.responsive = analyzeResponsivePatterns(componentCode);
      analysis.accessibility = analyzeAccessibility(componentCode);
      analysis.performance = analyzePerformance(componentCode);
      analysis.ux = analyzeUXPatterns(componentCode);
      break;
    case 'quick':
      analysis.touchTargets = analyzeTouchTargets(componentCode);
      analysis.responsive = analyzeResponsivePatterns(componentCode);
      break;
    case 'touch-targets':
      analysis.touchTargets = analyzeTouchTargets(componentCode);
      break;
    case 'responsive':
      analysis.responsive = analyzeResponsivePatterns(componentCode);
      break;
  }

  // Calculate overall score
  analysis.overallScore = calculateOverallScore(analysis);
  analysis.priority = determinePriority(analysis.overallScore);
  analysis.recommendations = generateOptimizationRecommendations(analysis);

  return analysis;
}

function analyzeTouchTargets(componentCode: string, minSize: number = 44): TouchTargetAnalysis {
  const violations: string[] = [];
  const issues: string[] = [];
  
  // Look for interactive elements with potentially small touch targets
  const interactiveElements = [
    'button', 'a', 'input', 'select', 'textarea',
    'Button', 'Link', 'IconButton'
  ];
  
  interactiveElements.forEach(element => {
    const regex = new RegExp(`<${element}[^>]*>`, 'gi');
    const matches = componentCode.match(regex);
    
    if (matches) {
      matches.forEach(match => {
        // Check for explicit size classes that might be too small
        if (match.includes('w-4') || match.includes('h-4') || 
            match.includes('p-1') || match.includes('text-xs')) {
          violations.push(`${element} may have touch target smaller than ${minSize}px: ${match}`);
        }
        
        // Check for missing padding/margin
        if (!match.includes('p-') && !match.includes('px-') && !match.includes('py-')) {
          issues.push(`${element} missing touch padding: ${match}`);
        }
      });
    }
  });
  
  const score = Math.max(0, 100 - (violations.length * 20) - (issues.length * 10));
  
  return {
    score,
    issues,
    violations,
    recommendations: violations.length > 0 
      ? [`Ensure all touch targets are at least ${minSize}px in size`]
      : []
  };
}

function analyzeResponsivePatterns(componentCode: string, breakpoints = { mobile: 768, tablet: 1024, desktop: 1440 }): ResponsiveAnalysis {
  const missingBreakpoints: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for responsive Tailwind classes
  const responsivePatterns = [
    'sm:', 'md:', 'lg:', 'xl:', '2xl:',
    'mobile:', 'tablet:', 'desktop:'
  ];
  
  const hasResponsiveClasses = responsivePatterns.some(pattern => 
    componentCode.includes(pattern)
  );
  
  if (!hasResponsiveClasses) {
    missingBreakpoints.push('No responsive breakpoints found');
    issues.push('Component may not be responsive');
  }
  
  // Check for fixed widths/heights that might not be responsive
  const fixedSizeRegex = /w-\d+|h-\d+|width:\s*\d+px|height:\s*\d+px/g;
  const fixedSizes = componentCode.match(fixedSizeRegex);
  
  if (fixedSizes && fixedSizes.length > 0) {
    issues.push(`Found fixed sizes that may not be responsive: ${fixedSizes.join(', ')}`);
    suggestions.push('Consider using responsive width/height classes like w-full, h-auto');
  }
  
  // Check for horizontal scrolling risks
  if (componentCode.includes('overflow-x-auto') || componentCode.includes('whitespace-nowrap')) {
    issues.push('Potential horizontal scrolling on mobile');
    suggestions.push('Consider vertical stacking on mobile breakpoints');
  }
  
  const score = Math.max(0, 100 - (missingBreakpoints.length * 30) - (issues.length * 15));
  
  return {
    score,
    issues,
    missingBreakpoints,
    suggestions,
    hasResponsiveClasses,
    breakpointsCovered: responsivePatterns.filter(pattern => componentCode.includes(pattern))
  };
}

function analyzeAccessibility(componentCode: string) {
  const violations: string[] = [];
  const issues: string[] = [];
  
  // Check for missing alt text on images
  if (componentCode.includes('<img') && !componentCode.includes('alt=')) {
    violations.push('Images missing alt text');
  }
  
  // Check for missing ARIA labels on interactive elements
  const interactiveWithoutLabels = componentCode.match(/<button[^>]*>/g);
  if (interactiveWithoutLabels) {
    interactiveWithoutLabels.forEach(button => {
      if (!button.includes('aria-label') && !button.includes('aria-labelledby')) {
        issues.push('Button missing accessibility label');
      }
    });
  }
  
  const score = Math.max(0, 100 - (violations.length * 25) - (issues.length * 10));
  
  return {
    score,
    issues,
    violations
  };
}

function analyzePerformance(componentCode: string) {
  const issues: string[] = [];
  const metrics: Record<string, any> = {};
  
  // Check for potential performance issues
  if (componentCode.includes('useEffect(') && componentCode.includes('[]')) {
    metrics.hasEffects = true;
    if (!componentCode.includes('useCallback') && !componentCode.includes('useMemo')) {
      issues.push('useEffect without proper memoization');
    }
  }
  
  // Check for inline styles (performance issue)
  const inlineStyleRegex = /style=\{[^}]+\}/g;
  const inlineStyles = componentCode.match(inlineStyleRegex);
  if (inlineStyles && inlineStyles.length > 3) {
    issues.push('Multiple inline styles detected - consider using CSS classes');
  }
  
  // Check for large inline objects/arrays
  if (componentCode.includes('{...') || componentCode.includes('[...')) {
    issues.push('Spread operators detected - ensure proper memoization');
  }
  
  const score = Math.max(0, 100 - (issues.length * 15));
  
  return {
    score,
    issues,
    metrics
  };
}

function analyzeUXPatterns(componentCode: string) {
  const issues: string[] = [];
  const patterns: string[] = [];
  
  // Check for loading states
  if (componentCode.includes('loading') || componentCode.includes('isLoading')) {
    patterns.push('loading-states');
  } else {
    issues.push('No loading states detected');
  }
  
  // Check for error handling
  if (componentCode.includes('error') || componentCode.includes('isError')) {
    patterns.push('error-handling');
  } else {
    issues.push('No error handling detected');
  }
  
  // Check for empty states
  if (componentCode.includes('empty') || componentCode.includes('no data')) {
    patterns.push('empty-states');
  }
  
  const score = Math.max(0, 100 - (issues.length * 20));
  
  return {
    score,
    issues,
    patterns
  };
}

function calculateOverallScore(analysis: ComponentAnalysis): number {
  const weights = {
    touchTargets: 0.3,
    responsive: 0.25,
    accessibility: 0.2,
    performance: 0.15,
    ux: 0.1
  };
  
  return Math.round(
    analysis.touchTargets.score * weights.touchTargets +
    analysis.responsive.score * weights.responsive +
    analysis.accessibility.score * weights.accessibility +
    analysis.performance.score * weights.performance +
    analysis.ux.score * weights.ux
  );
}

function determinePriority(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score < 30) return 'critical';
  if (score < 50) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

function generateOptimizationRecommendations(analysis: ComponentAnalysis, priority?: string): string[] {
  const recommendations: string[] = [];
  
  // Touch target recommendations
  if (analysis.touchTargets.violations.length > 0) {
    recommendations.push('Increase touch target sizes to minimum 44px');
    recommendations.push('Add adequate padding to interactive elements');
  }
  
  // Responsive design recommendations
  if (analysis.responsive.missingBreakpoints.length > 0) {
    recommendations.push('Add responsive breakpoints for mobile-first design');
    recommendations.push('Use Tailwind responsive classes (sm:, md:, lg:)');
  }
  
  // Accessibility recommendations
  if (analysis.accessibility.violations.length > 0) {
    recommendations.push('Add alt text to all images');
    recommendations.push('Include ARIA labels for interactive elements');
  }
  
  // Performance recommendations
  if (analysis.performance.issues.length > 0) {
    recommendations.push('Optimize component re-renders with React.memo');
    recommendations.push('Use useCallback and useMemo for expensive operations');
  }
  
  // UX recommendations
  if (analysis.ux.issues.length > 0) {
    recommendations.push('Add loading states for better user experience');
    recommendations.push('Implement proper error handling');
  }
  
  return recommendations;
}

export const tools = [
  analyzeComponentTool,
  validateTouchTargetsTool,
  analyzeResponsiveDesignTool,
  generateRecommendationsTool
];