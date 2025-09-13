import { Mastra, AgentConfig } from '@mastra/core';
import { AnthropicProvider } from '@mastra/anthropic';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Claude Sonnet 4 configuration optimized for code analysis
const claudeSonnet4Config: AgentConfig = {
  model: 'claude-3-5-sonnet-20241022',
  provider: new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  }),
  temperature: 0.1, // Low temperature for precise code analysis
  maxTokens: 8192,
  systemMessage: `You are a mobile optimization expert specializing in React/TypeScript applications for financial SaaS platforms. 
  You analyze code for mobile UX issues, accessibility concerns, and performance optimizations specifically for financial applications like Clear Piggy.
  
  Focus on:
  - Touch target sizing (minimum 44px)
  - Mobile-first responsive design patterns
  - Financial UI/UX best practices
  - Tailwind CSS mobile optimization
  - React component accessibility
  - Performance on mobile devices`,
};

// Initialize Mastra with mobile optimization agents
export const mastra = new Mastra({
  agents: {
    // Primary mobile optimization analyst
    mobileOptimizer: {
      ...claudeSonnet4Config,
      name: 'Clear Piggy Mobile Optimizer',
      description: 'Analyzes React components for mobile optimization opportunities in financial SaaS applications',
    },

    // Component architecture reviewer
    componentArchitect: {
      ...claudeSonnet4Config,
      name: 'Component Architecture Analyst',
      description: 'Reviews component structure for mobile-first design patterns and reusability',
      temperature: 0.2,
    },

    // Accessibility and UX specialist
    a11ySpecialist: {
      ...claudeSonnet4Config,
      name: 'Accessibility & UX Specialist', 
      description: 'Focuses on mobile accessibility and user experience for financial applications',
      temperature: 0.15,
    },

    // Performance analyzer
    performanceAnalyst: {
      ...claudeSonnet4Config,
      name: 'Mobile Performance Analyst',
      description: 'Identifies performance bottlenecks and optimization opportunities for mobile devices',
      temperature: 0.1,
    },

    // Financial UX pattern expert
    finUXExpert: {
      ...claudeSonnet4Config,
      name: 'Financial UX Pattern Expert',
      description: 'Specializes in mobile UX patterns for financial applications, budgeting, and transaction interfaces',
      temperature: 0.2,
    },
  },

  // Workflows for different types of analysis
  workflows: {
    fullMobileAudit: {
      name: 'Complete Mobile Optimization Audit',
      description: 'Comprehensive analysis of all components for mobile optimization',
      steps: [
        'componentArchitect',
        'mobileOptimizer', 
        'a11ySpecialist',
        'performanceAnalyst',
        'finUXExpert'
      ],
    },

    quickMobileCheck: {
      name: 'Quick Mobile Assessment',
      description: 'Rapid assessment of critical mobile issues',
      steps: [
        'mobileOptimizer',
        'a11ySpecialist'
      ],
    },

    financialComponentReview: {
      name: 'Financial Component Mobile Review',
      description: 'Specialized review for financial UI components',
      steps: [
        'finUXExpert',
        'mobileOptimizer',
        'performanceAnalyst'
      ],
    },
  },

  // Tools and integrations
  tools: {
    fileSystem: {
      enabled: true,
      basePath: process.env.CLEAR_PIGGY_PROJECT_PATH || './clear-piggy-project',
    },
    
    codeAnalysis: {
      enabled: true,
      supportedExtensions: ['.tsx', '.ts', '.jsx', '.js'],
      excludePatterns: [
        'node_modules/**',
        'dist/**', 
        'build/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
    },
  },

  // Configuration for Clear Piggy specific analysis
  config: {
    project: {
      name: 'Clear Piggy',
      type: 'financial-saas',
      framework: 'react-typescript',
      styling: 'tailwindcss',
      animations: 'framer-motion',
      backend: 'supabase',
      integrations: ['plaid', 'stripe'],
    },
    
    mobile: {
      breakpoints: {
        mobile: parseInt(process.env.MOBILE_BREAKPOINT || '768'),
        tablet: parseInt(process.env.TABLET_BREAKPOINT || '1024'),
      },
      touchTargetSize: parseInt(process.env.MIN_TOUCH_TARGET_SIZE || '44'),
      priorityComponents: [
        'transaction-list',
        'budget-chart', 
        'dashboard-widget',
        'navigation',
        'form-input',
        'button',
        'modal',
        'card'
      ],
    },

    analysis: {
      outputDirectory: process.env.ANALYSIS_OUTPUT_DIR || './analysis-reports',
      enableDetailedLogging: process.env.ENABLE_DETAILED_LOGGING === 'true',
      generateScreenshots: false, // Set to true if you have screenshot capabilities
      includeBenchmarks: true,
    },
  },
});

export default mastra;