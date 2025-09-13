# Mobile UI Analyzer Agent

A specialized Mastra AI agent for analyzing React components and identifying mobile optimization opportunities in Clear Piggy's financial SaaS platform.

## Overview

The Mobile UI Analyzer Agent performs comprehensive analysis of React/TypeScript components, focusing on mobile-first design principles, touch target validation, responsive design patterns, and financial UX best practices.

## Features

- **Touch Target Analysis** - Validates minimum 44px touch targets for mobile accessibility
- **Responsive Design Audit** - Identifies missing breakpoints and mobile-first design gaps
- **Accessibility Validation** - Ensures WCAG compliance for mobile interfaces
- **Performance Analysis** - Detects mobile performance bottlenecks and optimization opportunities
- **Financial UX Patterns** - Specialized analysis for financial application components

## Usage

### Basic Component Analysis

```typescript
import { MobileUIAnalyzer } from './index';

const analyzer = new MobileUIAnalyzer({
  minTouchTargetSize: 44,
  mobileBreakpoint: 768,
  analysisDepth: 'comprehensive'
});

// Analyze a single component
const analysis = await analyzer.analyzeComponent({
  componentPath: './src/components/TransactionList.tsx',
  analysisType: 'full',
  options: {
    includeRecommendations: true,
    generateReport: true
  }
});

console.log(`Overall Score: ${analysis.overallScore}/100`);
console.log(`Priority: ${analysis.priority}`);
```

### Batch Analysis

```typescript
// Analyze multiple components
const batchResults = await analyzer.analyzeBatch({
  projectPath: './src/components',
  filters: {
    includePatterns: ['**/*.tsx', '**/*.jsx'],
    excludePatterns: ['**/*.test.*', '**/stories/**']
  },
  analysisOptions: {
    analysisType: 'full',
    priority: 'all',
    generateReports: true,
    outputFormat: 'html'
  }
});

console.log(`Analyzed ${batchResults.summary.analyzedComponents} components`);
console.log(`Average Score: ${batchResults.summary.averageScore}/100`);
```

### Quick Assessment

```typescript
// Quick analysis for critical issues only
const quickAnalysis = await analyzer.analyzeComponent({
  componentPath: './src/components/PaymentForm.tsx',
  analysisType: 'quick',
  options: {
    minTouchTargetSize: 44
  }
});

// Focus on specific areas
const touchTargetAnalysis = await analyzer.analyzeComponent({
  componentPath: './src/components/Button.tsx',
  analysisType: 'touch-targets'
});

const responsiveAnalysis = await analyzer.analyzeComponent({
  componentPath: './src/components/Dashboard.tsx',
  analysisType: 'responsive'
});
```

## Configuration

### Agent Configuration

```typescript
const config = {
  name: 'mobile-ui-analyzer',
  version: '1.0.0',
  description: 'Analyzes React components for mobile optimization opportunities',
  
  settings: {
    minTouchTargetSize: 44,        // Minimum touch target size in pixels
    mobileBreakpoint: 768,         // Mobile breakpoint in pixels
    tabletBreakpoint: 1024,        // Tablet breakpoint in pixels
    analysisDepth: 'comprehensive', // 'quick' | 'standard' | 'comprehensive'
    
    // Scoring weights
    scoring: {
      touchTargetWeight: 0.3,      // 30% of overall score
      responsiveWeight: 0.25,      // 25% of overall score
      accessibilityWeight: 0.2,    // 20% of overall score
      performanceWeight: 0.15,     // 15% of overall score
      uxWeight: 0.1               // 10% of overall score
    },
    
    // Priority thresholds
    thresholds: {
      critical: 30,               // Scores below 30 are critical
      high: 50,                   // Scores 30-49 are high priority
      medium: 70,                 // Scores 50-69 are medium priority
      low: 85                     // Scores 70+ are low priority
    }
  },
  
  // Integration settings
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
  
  // Output configuration
  output: {
    formats: ['json', 'html', 'markdown'],
    includeRecommendations: true,
    includeCodeSamples: true,
    generatePriority: true
  }
};
```

### Environment Variables

```env
# Agent Configuration
MOBILE_UI_ANALYZER_MIN_TOUCH_TARGET=44
MOBILE_UI_ANALYZER_MOBILE_BREAKPOINT=768
MOBILE_UI_ANALYZER_ANALYSIS_DEPTH=comprehensive

# Project Paths
CLEAR_PIGGY_PROJECT_PATH=/path/to/clear-piggy
CLEAR_PIGGY_COMPONENTS_PATH=src/components

# Output Configuration
ANALYSIS_OUTPUT_DIR=./analysis-reports
ANALYSIS_OUTPUT_FORMAT=html

# Performance Settings
ANALYSIS_CONCURRENT_LIMIT=4
ANALYSIS_TIMEOUT=300000
```

## Analysis Types

### Full Analysis
Comprehensive analysis covering all aspects:
- Touch target validation
- Responsive design audit
- Accessibility compliance
- Performance optimization
- UX pattern analysis

### Quick Analysis
Fast assessment focusing on critical issues:
- Touch target violations
- Missing responsive breakpoints
- Major accessibility violations

### Targeted Analysis
Focus on specific areas:
- `touch-targets` - Only touch target analysis
- `responsive` - Only responsive design analysis
- `accessibility` - Only accessibility analysis
- `performance` - Only performance analysis

## Analysis Results

### Touch Target Analysis
```typescript
interface TouchTargetAnalysis {
  score: number;                    // 0-100 score
  issues: TouchTargetIssue[];       // Specific issues found
  passedElements: number;           // Elements meeting requirements
  failedElements: number;           // Elements failing requirements
}
```

### Responsive Design Analysis
```typescript
interface ResponsiveAnalysis {
  score: number;                    // 0-100 score
  issues: ResponsiveDesignIssue[];  // Responsive design issues
  breakpointsCovered: string[];     // Covered breakpoints (sm:, md:, lg:)
  missingBreakpoints: string[];     // Missing breakpoints
  responsiveScore: {
    mobile: number;                 // Mobile-specific score
    tablet: number;                 // Tablet-specific score
    desktop: number;                // Desktop-specific score
  };
}
```

### Accessibility Analysis
```typescript
interface AccessibilityAnalysis {
  score: number;                    // 0-100 score
  violations: AccessibilityViolation[]; // WCAG violations
  wcagCompliance: {
    levelA: boolean;                // WCAG Level A compliance
    levelAA: boolean;               // WCAG Level AA compliance
    levelAAA: boolean;              // WCAG Level AAA compliance
  };
}
```

## Financial UX Patterns

The agent includes specialized analysis for financial application components:

### Transaction Lists
- Validates virtualization for performance
- Checks for swipe actions and gestures
- Ensures proper loading states
- Validates touch-friendly list items

### Budget Charts
- Analyzes touch interactions
- Validates mobile sizing
- Checks responsive design
- Ensures accessible color schemes

### Dashboard Cards
- Validates stacking patterns on mobile
- Checks for progressive disclosure
- Analyzes tap-to-expand functionality
- Ensures proper information hierarchy

### Forms and Inputs
- Validates appropriate input types
- Checks mobile keyboard optimization
- Analyzes real-time formatting
- Validates touch-friendly validation

## Common Issues and Solutions

### Touch Target Violations
**Issue**: Interactive elements smaller than 44px
```tsx
// ❌ Too small
<button className="w-6 h-6 p-1">×</button>

// ✅ Proper size
<button className="w-11 h-11 p-2 flex items-center justify-center">×</button>
```

### Missing Responsive Breakpoints
**Issue**: No mobile-first responsive design
```tsx
// ❌ No responsive classes
<div className="grid grid-cols-4 gap-4">

// ✅ Mobile-first responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Poor Mobile Navigation
**Issue**: Desktop navigation not optimized for mobile
```tsx
// ❌ Desktop-only navigation
<nav className="flex space-x-8">

// ✅ Mobile-optimized navigation
<nav className="hidden md:flex md:space-x-8">
  {/* Desktop nav */}
</nav>
<nav className="md:hidden">
  {/* Mobile hamburger menu */}
</nav>
```

### Accessibility Issues
**Issue**: Missing alt text and ARIA labels
```tsx
// ❌ Missing accessibility
<img src="chart.png" />
<button onClick={handleClick}>⋮</button>

// ✅ Proper accessibility
<img src="chart.png" alt="Monthly spending chart showing $2,341 total" />
<button onClick={handleClick} aria-label="Open menu">⋮</button>
```

## Performance Considerations

### Memory Usage
- Component analysis uses approximately 50-100MB per component
- Batch analysis automatically manages memory with pagination
- Large components (>10,000 lines) are analyzed in chunks

### Analysis Speed
- **Quick analysis**: ~2-5 seconds per component
- **Full analysis**: ~10-30 seconds per component
- **Batch analysis**: Processes 4 components concurrently by default

### Optimization Tips
```typescript
// Configure for faster analysis
const fastConfig = {
  analysisDepth: 'quick',
  concurrentLimit: 8,
  timeout: 60000,
  skipLargeFiles: true
};

// Configure for thorough analysis
const thoroughConfig = {
  analysisDepth: 'comprehensive',
  concurrentLimit: 2,
  timeout: 300000,
  includeCodeSamples: true
};
```

## Integration with Clear Piggy

### Stack Compatibility
- ✅ React 18+ with TypeScript
- ✅ Tailwind CSS 3.x
- ✅ Framer Motion animations
- ✅ Supabase integration patterns
- ✅ Plaid API components

### CI/CD Integration
Add to your GitHub Actions workflow:
```yaml
- name: Mobile UI Analysis
  run: |
    npm run analyze:mobile-ui
    # Upload analysis reports
    - uses: actions/upload-artifact@v4
      with:
        name: mobile-ui-analysis
        path: analysis-reports/
```

### VS Code Integration
Recommended VS Code settings:
```json
{
  "mastra.mobileUIAnalyzer.enabled": true,
  "mastra.mobileUIAnalyzer.analysisOnSave": true,
  "mastra.mobileUIAnalyzer.showInlineHints": true
}
```

## API Reference

### Core Methods

#### `analyzeComponent(request: ComponentAnalysisRequest)`
Analyzes a single React component for mobile optimization opportunities.

#### `analyzeBatch(request: BatchAnalysisRequest)`
Analyzes multiple components in batch with parallel processing.

#### `generateReport(analysis: MobileOptimizationReport, format: string)`
Generates formatted reports in JSON, HTML, or Markdown format.

#### `getPerformanceMetrics()`
Returns performance metrics for the agent including analysis time and accuracy.

### Tools Available

- **analyze-component** - Main component analysis tool
- **validate-touch-targets** - Touch target validation tool
- **analyze-responsive-design** - Responsive design analysis tool
- **generate-recommendations** - Recommendation generation tool

## Troubleshooting

### Common Issues

**"Component not found"**
- Verify the component path is correct
- Ensure the file exists and is readable

**"Analysis timeout"**
- Increase timeout settings for large components
- Use 'quick' analysis for faster results

**"Memory errors"**
- Reduce concurrent analysis limit
- Increase Node.js memory limit: `--max-old-space-size=8192`

### Debug Mode
Enable detailed logging:
```typescript
const analyzer = new MobileUIAnalyzer({
  debug: true,
  logLevel: 'verbose'
});
```

## Contributing

1. Follow the component analysis patterns in `tools.ts`
2. Add new analysis rules to the appropriate analyzer functions
3. Update TypeScript interfaces in `types.ts`
4. Add comprehensive tests for new functionality
5. Update documentation with examples

## License

MIT License - see [LICENSE](../../LICENSE) file for details.