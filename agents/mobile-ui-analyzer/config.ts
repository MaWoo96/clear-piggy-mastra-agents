import { MobileAnalysisConfig } from '../../types/clear-piggy-types';

export const MobileUIAnalyzerConfig: MobileAnalysisConfig = {
  name: 'mobile-ui-analyzer',
  version: '1.0.0',
  description: 'Analyzes React components for mobile optimization opportunities',
  
  capabilities: [
    'component_analysis',
    'touch_target_validation',
    'responsive_design_audit',
    'accessibility_check',
    'performance_analysis'
  ],
  
  settings: {
    minTouchTargetSize: 44,
    mobileBreakpoint: 768,
    tabletBreakpoint: 1024,
    analysisDepth: 'comprehensive',
    
    scoring: {
      touchTargetWeight: 0.3,
      responsiveWeight: 0.25,
      accessibilityWeight: 0.2,
      performanceWeight: 0.15,
      uxWeight: 0.1
    },
    
    thresholds: {
      critical: 30,
      high: 50,
      medium: 70,
      low: 85
    }
  },
  
  integrations: {
    tailwindcss: {
      enabled: true,
      configPath: './tailwind.config.js'
    },
    typescript: {
      enabled: true,
      strict: true
    },
    react: {
      version: '18+',
      strictMode: true
    }
  },
  
  output: {
    formats: ['json', 'html', 'markdown'],
    includeRecommendations: true,
    includeCodeSamples: true,
    generatePriority: true
  }
};

export default MobileUIAnalyzerConfig;