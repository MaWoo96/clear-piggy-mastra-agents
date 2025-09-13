/**
 * Accessibility Test Generator for Clear Piggy Mobile
 * Generates comprehensive accessibility tests using axe-core for mobile interfaces,
 * including WCAG compliance, touch target validation, and mobile-specific a11y checks
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  MobileTestingConfig,
  ComponentAnalysis,
  AccessibilityLevel,
  TestScenario,
  MobileDevice
} from '../types/mobile-testing-types.js';

export interface AccessibilityTestOptions {
  wcagLevel: AccessibilityLevel;
  includeColorContrast: boolean;
  includeTouchTargets: boolean;
  includeKeyboardNavigation: boolean;
  includeScreenReader: boolean;
  includeMobileFocus: boolean;
  includeFormLabeling: boolean;
  generateAuditReport: boolean;
  customRules: AccessibilityRule[];
}

export interface AccessibilityRule {
  id: string;
  name: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  enabled: boolean;
  mobileSpecific: boolean;
}

export class AccessibilityTestGenerator {
  private config: MobileTestingConfig;
  private options: AccessibilityTestOptions;

  constructor(config: MobileTestingConfig, options: AccessibilityTestOptions) {
    this.config = config;
    this.options = options;
  }

  /**
   * Generate comprehensive accessibility test suite
   */
  async generateAccessibilityTests(components: ComponentAnalysis[]): Promise<{ files: string[], testCount: number }> {
    const generatedFiles: string[] = [];
    let totalTests = 0;

    try {
      // Generate axe-core configuration
      const axeConfig = await this.generateAxeConfiguration();
      await this.writeFile('tests/accessibility/axe.config.js', axeConfig);
      generatedFiles.push('tests/accessibility/axe.config.js');

      // Generate accessibility test utilities
      const utilities = await this.generateAccessibilityUtilities();
      await this.writeFile('tests/utils/accessibility-utils.js', utilities);
      generatedFiles.push('tests/utils/accessibility-utils.js');

      // Generate mobile-specific accessibility rules
      const customRules = await this.generateCustomAccessibilityRules();
      await this.writeFile('tests/accessibility/mobile-a11y-rules.js', customRules);
      generatedFiles.push('tests/accessibility/mobile-a11y-rules.js');

      // Generate Cypress accessibility commands
      const cypressCommands = await this.generateCypressAccessibilityCommands();
      await this.writeFile('cypress/support/accessibility-commands.js', cypressCommands);
      generatedFiles.push('cypress/support/accessibility-commands.js');

      // Generate Playwright accessibility fixtures
      const playwrightFixtures = await this.generatePlaywrightAccessibilityFixtures();
      await this.writeFile('tests/fixtures/accessibility-fixtures.js', playwrightFixtures);
      generatedFiles.push('tests/fixtures/accessibility-fixtures.js');

      // Generate component-specific accessibility tests
      for (const component of components) {
        const componentTests = await this.generateComponentAccessibilityTests(component);
        for (const [filename, content] of Object.entries(componentTests)) {
          await this.writeFile(`tests/accessibility/components/${filename}`, content);
          generatedFiles.push(`tests/accessibility/components/${filename}`);
          totalTests += this.countTestsInContent(content);
        }
      }

      // Generate WCAG compliance tests
      const wcagTests = await this.generateWCAGComplianceTests();
      await this.writeFile('tests/accessibility/wcag-compliance.spec.js', wcagTests);
      generatedFiles.push('tests/accessibility/wcag-compliance.spec.js');
      totalTests += this.countTestsInContent(wcagTests);

      // Generate mobile-specific accessibility tests
      const mobileA11yTests = await this.generateMobileAccessibilityTests();
      await this.writeFile('tests/accessibility/mobile-accessibility.spec.js', mobileA11yTests);
      generatedFiles.push('tests/accessibility/mobile-accessibility.spec.js');
      totalTests += this.countTestsInContent(mobileA11yTests);

      // Generate touch target accessibility tests
      if (this.options.includeTouchTargets) {
        const touchTargetTests = await this.generateTouchTargetTests();
        await this.writeFile('tests/accessibility/touch-targets.spec.js', touchTargetTests);
        generatedFiles.push('tests/accessibility/touch-targets.spec.js');
        totalTests += this.countTestsInContent(touchTargetTests);
      }

      // Generate keyboard navigation tests
      if (this.options.includeKeyboardNavigation) {
        const keyboardTests = await this.generateKeyboardNavigationTests();
        await this.writeFile('tests/accessibility/keyboard-navigation.spec.js', keyboardTests);
        generatedFiles.push('tests/accessibility/keyboard-navigation.spec.js');
        totalTests += this.countTestsInContent(keyboardTests);
      }

      // Generate screen reader tests
      if (this.options.includeScreenReader) {
        const screenReaderTests = await this.generateScreenReaderTests();
        await this.writeFile('tests/accessibility/screen-reader.spec.js', screenReaderTests);
        generatedFiles.push('tests/accessibility/screen-reader.spec.js');
        totalTests += this.countTestsInContent(screenReaderTests);
      }

      // Generate color contrast tests
      if (this.options.includeColorContrast) {
        const colorContrastTests = await this.generateColorContrastTests();
        await this.writeFile('tests/accessibility/color-contrast.spec.js', colorContrastTests);
        generatedFiles.push('tests/accessibility/color-contrast.spec.js');
        totalTests += this.countTestsInContent(colorContrastTests);
      }

      // Generate form accessibility tests
      if (this.options.includeFormLabeling) {
        const formA11yTests = await this.generateFormAccessibilityTests();
        await this.writeFile('tests/accessibility/form-accessibility.spec.js', formA11yTests);
        generatedFiles.push('tests/accessibility/form-accessibility.spec.js');
        totalTests += this.countTestsInContent(formA11yTests);
      }

      // Generate accessibility audit report generator
      if (this.options.generateAuditReport) {
        const auditGenerator = await this.generateAccessibilityAuditReport();
        await this.writeFile('tests/accessibility/audit-report-generator.js', auditGenerator);
        generatedFiles.push('tests/accessibility/audit-report-generator.js');
      }

      console.log(`✅ Generated ${generatedFiles.length} accessibility test files with ${totalTests} total tests`);
      return { files: generatedFiles, testCount: totalTests };

    } catch (error) {
      console.error('Failed to generate accessibility test suite:', error);
      throw error;
    }
  }

  /**
   * Generate axe-core configuration for mobile testing
   */
  private async generateAxeConfiguration(): Promise<string> {
    const customRules = this.options.customRules.map(rule => ({
      id: rule.id,
      enabled: rule.enabled,
      tags: rule.tags
    }));

    return `// Axe-core configuration for Clear Piggy mobile accessibility testing

const axeConfig = {
  // Global configuration
  locale: 'en-US',
  
  // Rules configuration
  rules: {
    // Standard WCAG rules
    'color-contrast': {
      enabled: ${this.options.includeColorContrast},
      tags: ['wcag2a', 'wcag143', 'mobile']
    },
    
    'color-contrast-enhanced': {
      enabled: ${this.options.wcagLevel === 'AAA'},
      tags: ['wcag2aaa', 'wcag146', 'mobile']
    },
    
    'focus-order-semantics': {
      enabled: ${this.options.includeKeyboardNavigation},
      tags: ['wcag2a', 'wcag241', 'mobile']
    },
    
    'keyboard': {
      enabled: ${this.options.includeKeyboardNavigation},
      tags: ['wcag2a', 'wcag211', 'mobile']
    },
    
    'label': {
      enabled: ${this.options.includeFormLabeling},
      tags: ['wcag2a', 'wcag412', 'mobile']
    },
    
    'aria-label': {
      enabled: ${this.options.includeScreenReader},
      tags: ['wcag2a', 'wcag412', 'mobile']
    },
    
    'aria-labelledby': {
      enabled: ${this.options.includeScreenReader},
      tags: ['wcag2a', 'wcag412', 'mobile']
    },
    
    'aria-describedby': {
      enabled: ${this.options.includeScreenReader},
      tags: ['wcag2a', 'wcag412', 'mobile']
    },
    
    // Mobile-specific rules
    'touch-target-size': {
      enabled: ${this.options.includeTouchTargets},
      tags: ['mobile', 'touch', 'best-practice'],
      check: 'touch-target-size-check'
    },
    
    'mobile-viewport': {
      enabled: true,
      tags: ['mobile', 'viewport', 'best-practice'],
      check: 'mobile-viewport-check'
    },
    
    'mobile-form-inputs': {
      enabled: ${this.options.includeFormLabeling},
      tags: ['mobile', 'forms', 'best-practice'],
      check: 'mobile-form-inputs-check'
    },
    
    'mobile-focus-indicator': {
      enabled: ${this.options.includeMobileFocus},
      tags: ['mobile', 'focus', 'wcag2a'],
      check: 'mobile-focus-indicator-check'
    }
  },
  
  // Tags to include/exclude
  tags: [
    ${this.options.wcagLevel === 'A' ? `'wcag2a'` : ''}
    ${this.options.wcagLevel === 'AA' ? `'wcag2a', 'wcag2aa'` : ''}
    ${this.options.wcagLevel === 'AAA' ? `'wcag2a', 'wcag2aa', 'wcag2aaa'` : ''}
    'mobile',
    'best-practice'
  ],
  
  // Custom rules
  customRules: [
    ${customRules.map(rule => JSON.stringify(rule, null, 4)).join(',\\n    ')}
  ],
  
  // Results configuration
  resultTypes: ['violations', 'incomplete', 'passes'],
  
  // Reporter configuration
  reporter: 'v2',
  
  // Locale configuration
  allowedOrigins: ['http://localhost:3000', 'https://app.clearpiggy.com'],
  
  // Performance configuration
  performanceTimer: process.env.NODE_ENV === 'development',
  
  // Mobile-specific configuration
  mobile: {
    minTouchTargetSize: ${this.config.mobile?.minTouchTargetSize || 44},
    breakpoints: {
      mobile: ${this.config.mobile?.breakpoints?.mobile || 768},
      tablet: ${this.config.mobile?.breakpoints?.tablet || 1024}
    },
    enableTouchOptimizations: ${this.config.mobile?.enableTouchOptimizations || true},
    enableAccessibilityOptimizations: ${this.config.mobile?.enableAccessibilityOptimizations || true}
  }
};

// Custom checks for mobile-specific rules
axeConfig.checks = [
  {
    id: 'touch-target-size-check',
    evaluate: function(node, options, virtualNode) {
      const rect = node.getBoundingClientRect();
      const minSize = options.minSize || 44;
      
      // Check if element is interactive
      const isInteractive = node.matches('button, [role="button"], input, select, textarea, [tabindex="0"], a[href]');
      
      if (!isInteractive) {
        return true; // Not applicable
      }
      
      const actualSize = Math.min(rect.width, rect.height);
      return actualSize >= minSize;
    },
    options: {
      minSize: ${this.config.mobile?.minTouchTargetSize || 44}
    }
  },
  
  {
    id: 'mobile-viewport-check',
    evaluate: function(node, options, virtualNode) {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      
      if (!viewportMeta) {
        return false;
      }
      
      const content = viewportMeta.getAttribute('content');
      return content && content.includes('width=device-width');
    }
  },
  
  {
    id: 'mobile-form-inputs-check',
    evaluate: function(node, options, virtualNode) {
      const inputType = node.getAttribute('type');
      const inputMode = node.getAttribute('inputmode');
      
      // Check mobile-optimized input types
      const mobileOptimizedTypes = {
        'email': 'email',
        'tel': 'tel',
        'number': 'numeric',
        'url': 'url',
        'search': 'search'
      };
      
      if (inputType && mobileOptimizedTypes[inputType]) {
        return inputMode === mobileOptimizedTypes[inputType];
      }
      
      return true; // Not applicable for other input types
    }
  },
  
  {
    id: 'mobile-focus-indicator-check',
    evaluate: function(node, options, virtualNode) {
      // Check if element has visible focus indicator
      const computedStyles = window.getComputedStyle(node, ':focus');
      
      return computedStyles.outline !== 'none' && 
             computedStyles.outline !== '0' &&
             computedStyles.outline !== '0px' ||
             computedStyles.boxShadow !== 'none';
    }
  }
];

module.exports = axeConfig;`;
  }

  /**
   * Generate accessibility testing utilities
   */
  private async generateAccessibilityUtilities(): Promise<string> {
    return `// Accessibility testing utilities for Clear Piggy mobile

const axe = require('axe-core');
const axeConfig = require('../accessibility/axe.config');

class AccessibilityUtils {
  static async runAxeAnalysis(context, options = {}) {
    const config = {
      ...axeConfig,
      ...options,
      rules: {
        ...axeConfig.rules,
        ...options.rules
      }
    };
    
    try {
      const results = await axe.run(context, config);
      return this.processAxeResults(results);
    } catch (error) {
      console.error('Axe analysis failed:', error);
      throw error;
    }
  }
  
  static processAxeResults(results) {
    return {
      violations: results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
          impact: node.impact
        }))
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.map(incomplete => ({
        id: incomplete.id,
        description: incomplete.description,
        nodes: incomplete.nodes.length
      })),
      summary: {
        total: results.violations.length + results.passes.length + results.incomplete.length,
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        score: this.calculateAccessibilityScore(results)
      }
    };
  }
  
  static calculateAccessibilityScore(results) {
    const totalIssues = results.violations.length + results.incomplete.length;
    const totalPasses = results.passes.length;
    const totalChecks = totalIssues + totalPasses;
    
    if (totalChecks === 0) return 100;
    
    // Weight violations by impact
    const violationScore = results.violations.reduce((score, violation) => {
      const impactWeight = {
        minor: 1,
        moderate: 2,
        serious: 4,
        critical: 8
      };
      return score + (impactWeight[violation.impact] || 1) * violation.nodes.length;
    }, 0);
    
    // Calculate score (0-100)
    const maxPossibleScore = totalChecks * 8; // Assuming all critical
    const score = Math.max(0, 100 - (violationScore / maxPossibleScore) * 100);
    
    return Math.round(score);
  }
  
  // Mobile-specific accessibility checks
  static async checkTouchTargetSizes(context, minSize = 44) {
    const interactiveElements = context.querySelectorAll(
      'button, [role="button"], input, select, textarea, [tabindex="0"], a[href]'
    );
    
    const violations = [];
    
    for (const element of interactiveElements) {
      const rect = element.getBoundingClientRect();
      const actualSize = Math.min(rect.width, rect.height);
      
      if (actualSize < minSize) {
        violations.push({
          element: element,
          selector: this.generateSelector(element),
          actualSize: actualSize,
          expectedSize: minSize,
          difference: minSize - actualSize
        });
      }
    }
    
    return violations;
  }
  
  static async checkColorContrast(context, level = 'AA') {
    const textElements = context.querySelectorAll('*');
    const violations = [];
    
    for (const element of textElements) {
      const styles = window.getComputedStyle(element);
      const hasText = element.textContent && element.textContent.trim().length > 0;
      
      if (!hasText) continue;
      
      const contrast = this.calculateContrast(
        styles.color,
        styles.backgroundColor || styles.background
      );
      
      const threshold = this.getContrastThreshold(styles.fontSize, styles.fontWeight, level);
      
      if (contrast < threshold) {
        violations.push({
          element: element,
          selector: this.generateSelector(element),
          actualContrast: contrast,
          expectedContrast: threshold,
          textColor: styles.color,
          backgroundColor: styles.backgroundColor
        });
      }
    }
    
    return violations;
  }
  
  static calculateContrast(foreground, background) {
    // Simplified contrast calculation - in practice, use a proper library
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  static getLuminance(color) {
    // Simplified luminance calculation
    // In practice, use a proper color library
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  static hexToRgb(hex) {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
  
  static getContrastThreshold(fontSize, fontWeight, level) {
    const isLargeText = (
      parseFloat(fontSize) >= 18 || 
      (parseFloat(fontSize) >= 14 && fontWeight >= 700)
    );
    
    if (level === 'AAA') {
      return isLargeText ? 4.5 : 7;
    } else {
      return isLargeText ? 3 : 4.5;
    }
  }
  
  static async checkKeyboardNavigation(context) {
    const focusableElements = context.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const violations = [];
    
    for (const element of focusableElements) {
      // Check if element is focusable
      element.focus();
      if (document.activeElement !== element) {
        violations.push({
          type: 'not-focusable',
          element: element,
          selector: this.generateSelector(element)
        });
        continue;
      }
      
      // Check for visible focus indicator
      const styles = window.getComputedStyle(element, ':focus');
      const hasVisibleFocus = (
        styles.outline !== 'none' &&
        styles.outline !== '0' &&
        styles.outline !== '0px'
      ) || styles.boxShadow !== 'none';
      
      if (!hasVisibleFocus) {
        violations.push({
          type: 'no-focus-indicator',
          element: element,
          selector: this.generateSelector(element)
        });
      }
    }
    
    return violations;
  }
  
  static async checkMobileFormInputs(context) {
    const inputs = context.querySelectorAll('input[type]');
    const violations = [];
    
    const expectedInputModes = {
      'email': 'email',
      'tel': 'tel',
      'number': 'numeric',
      'url': 'url',
      'search': 'search'
    };
    
    for (const input of inputs) {
      const inputType = input.getAttribute('type');
      const inputMode = input.getAttribute('inputmode');
      const expectedMode = expectedInputModes[inputType];
      
      if (expectedMode && inputMode !== expectedMode) {
        violations.push({
          element: input,
          selector: this.generateSelector(input),
          inputType: inputType,
          actualInputMode: inputMode,
          expectedInputMode: expectedMode
        });
      }
      
      // Check for proper labeling
      const label = input.labels?.[0] || 
                   context.querySelector(\`label[for="\${input.id}"]\`) ||
                   input.closest('label');
      
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!label && !ariaLabel && !ariaLabelledBy) {
        violations.push({
          type: 'missing-label',
          element: input,
          selector: this.generateSelector(input)
        });
      }
    }
    
    return violations;
  }
  
  static async checkScreenReaderContent(context) {
    const violations = [];
    
    // Check for proper heading structure
    const headings = context.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    for (const heading of headings) {
      const currentLevel = parseInt(heading.tagName[1]);
      
      if (currentLevel > lastLevel + 1) {
        violations.push({
          type: 'heading-skip',
          element: heading,
          selector: this.generateSelector(heading),
          currentLevel: currentLevel,
          expectedLevel: lastLevel + 1
        });
      }
      
      lastLevel = currentLevel;
    }
    
    // Check for proper landmarks
    const main = context.querySelector('main, [role="main"]');
    if (!main) {
      violations.push({
        type: 'missing-main-landmark',
        message: 'Page should have a main landmark'
      });
    }
    
    // Check for proper list structure
    const listItems = context.querySelectorAll('li');
    for (const li of listItems) {
      const parent = li.parentElement;
      if (!parent.matches('ul, ol, menu')) {
        violations.push({
          type: 'orphaned-list-item',
          element: li,
          selector: this.generateSelector(li)
        });
      }
    }
    
    return violations;
  }
  
  static generateSelector(element) {
    if (element.id) {
      return \`#\${element.id}\`;
    }
    
    if (element.className) {
      return \`\${element.tagName.toLowerCase()}.\${element.className.split(' ').join('.')}\`;
    }
    
    // Generate a more specific selector
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.nodeName.toLowerCase();
      
      if (current.id) {
        selector += \`#\${current.id}\`;
        path.unshift(selector);
        break;
      }
      
      if (current.className) {
        selector += \`.\${current.className.split(' ').join('.')}\`;
      }
      
      path.unshift(selector);
      current = current.parentNode;
    }
    
    return path.join(' > ');
  }
  
  // Report generation
  static generateAccessibilityReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: results.summary,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      recommendations: this.generateRecommendations(results.violations)
    };
    
    return report;
  }
  
  static generateRecommendations(violations) {
    const recommendations = [];
    
    const violationsByType = violations.reduce((acc, violation) => {
      if (!acc[violation.id]) acc[violation.id] = [];
      acc[violation.id].push(violation);
      return acc;
    }, {});
    
    for (const [violationType, violationList] of Object.entries(violationsByType)) {
      recommendations.push({
        type: violationType,
        count: violationList.length,
        priority: this.getRecommendationPriority(violationList[0].impact),
        description: violationList[0].help,
        helpUrl: violationList[0].helpUrl,
        examples: violationList.slice(0, 3).map(v => ({
          target: v.nodes[0]?.target,
          html: v.nodes[0]?.html
        }))
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  static getRecommendationPriority(impact) {
    return impact || 'minor';
  }
}

module.exports = { AccessibilityUtils };`;
  }

  /**
   * Generate custom accessibility rules for mobile
   */
  private async generateCustomAccessibilityRules(): Promise<string> {
    return `// Custom accessibility rules for Clear Piggy mobile application

const customMobileAccessibilityRules = [
  {
    id: 'clear-piggy-touch-targets',
    selector: 'button, [role="button"], input, select, textarea, [tabindex="0"], a[href]',
    tags: ['mobile', 'touch', 'clear-piggy'],
    metadata: {
      description: 'Ensures all interactive elements meet minimum touch target size requirements',
      help: 'Interactive elements must be at least 44px in height and width',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html'
    },
    all: [],
    any: ['clear-piggy-touch-target-size'],
    none: []
  },
  
  {
    id: 'clear-piggy-mobile-forms',
    selector: 'input[type]',
    tags: ['mobile', 'forms', 'clear-piggy'],
    metadata: {
      description: 'Ensures form inputs are optimized for mobile keyboards',
      help: 'Form inputs should use appropriate inputmode attributes for mobile optimization',
      helpUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode'
    },
    all: [],
    any: ['clear-piggy-mobile-input-optimization'],
    none: []
  },
  
  {
    id: 'clear-piggy-financial-context',
    selector: '[data-testid*="amount"], [data-testid*="balance"], [data-testid*="currency"]',
    tags: ['financial', 'context', 'clear-piggy'],
    metadata: {
      description: 'Ensures financial amounts have proper context and formatting',
      help: 'Financial amounts should include currency information and be properly labeled',
      helpUrl: 'https://webaim.org/techniques/forms/controls'
    },
    all: [],
    any: ['clear-piggy-financial-context-check'],
    none: []
  },
  
  {
    id: 'clear-piggy-data-tables',
    selector: 'table, [role="table"]',
    tags: ['tables', 'financial-data', 'clear-piggy'],
    metadata: {
      description: 'Ensures financial data tables are properly structured for screen readers',
      help: 'Data tables should have proper headers and captions for financial information',
      helpUrl: 'https://webaim.org/techniques/tables/'
    },
    all: [],
    any: ['clear-piggy-table-structure'],
    none: []
  },
  
  {
    id: 'clear-piggy-chart-accessibility',
    selector: '[data-testid*="chart"], svg[role="img"]',
    tags: ['charts', 'data-visualization', 'clear-piggy'],
    metadata: {
      description: 'Ensures financial charts are accessible to screen readers',
      help: 'Charts should have descriptive titles, labels, and alternative text representations',
      helpUrl: 'https://www.w3.org/WAI/tutorials/images/complex/'
    },
    all: [],
    any: ['clear-piggy-chart-accessibility-check'],
    none: []
  }
];

// Custom checks for Clear Piggy rules
const customChecks = [
  {
    id: 'clear-piggy-touch-target-size',
    evaluate: function(node, options, virtualNode) {
      const rect = node.getBoundingClientRect();
      const minSize = options.minSize || 44;
      
      const actualWidth = rect.width;
      const actualHeight = rect.height;
      const minDimension = Math.min(actualWidth, actualHeight);
      
      this.data({
        actualWidth: actualWidth,
        actualHeight: actualHeight,
        minSize: minSize,
        passes: minDimension >= minSize
      });
      
      return minDimension >= minSize;
    },
    options: {
      minSize: 44
    },
    metadata: {
      impact: 'serious',
      messages: {
        pass: 'Element meets minimum touch target size requirements',
        fail: 'Element does not meet minimum touch target size of {{minSize}}px'
      }
    }
  },
  
  {
    id: 'clear-piggy-mobile-input-optimization',
    evaluate: function(node, options, virtualNode) {
      const inputType = node.getAttribute('type');
      const inputMode = node.getAttribute('inputmode');
      
      const expectedInputModes = {
        'email': 'email',
        'tel': 'tel',
        'number': 'numeric',
        'url': 'url',
        'search': 'search'
      };
      
      const expectedMode = expectedInputModes[inputType];
      
      if (!expectedMode) {
        return true; // Not applicable
      }
      
      this.data({
        inputType: inputType,
        actualInputMode: inputMode,
        expectedInputMode: expectedMode,
        passes: inputMode === expectedMode
      });
      
      return inputMode === expectedMode;
    },
    metadata: {
      impact: 'moderate',
      messages: {
        pass: 'Input has appropriate inputmode for mobile optimization',
        fail: 'Input type "{{inputType}}" should have inputmode="{{expectedInputMode}}"'
      }
    }
  },
  
  {
    id: 'clear-piggy-financial-context-check',
    evaluate: function(node, options, virtualNode) {
      const text = node.textContent || '';
      const hasNumbers = /\\d/.test(text);
      const hasCurrency = /[$£€¥₹]/.test(text) || /USD|EUR|GBP|JPY|INR/i.test(text);
      
      if (!hasNumbers) {
        return true; // Not a financial amount
      }
      
      // Check for proper labeling
      const ariaLabel = node.getAttribute('aria-label');
      const ariaLabelledBy = node.getAttribute('aria-labelledby');
      const title = node.getAttribute('title');
      const label = document.querySelector(\`label[for="\${node.id}"]\`);
      
      const hasProperLabel = !!(ariaLabel || ariaLabelledBy || title || label);
      const hasContext = hasCurrency || hasProperLabel;
      
      this.data({
        text: text,
        hasCurrency: hasCurrency,
        hasProperLabel: hasProperLabel,
        passes: hasContext
      });
      
      return hasContext;
    },
    metadata: {
      impact: 'moderate',
      messages: {
        pass: 'Financial amount has proper context and labeling',
        fail: 'Financial amount lacks proper currency context or labeling'
      }
    }
  },
  
  {
    id: 'clear-piggy-table-structure',
    evaluate: function(node, options, virtualNode) {
      const isTable = node.tagName.toLowerCase() === 'table' || 
                     node.getAttribute('role') === 'table';
      
      if (!isTable) {
        return true;
      }
      
      // Check for caption or accessible name
      const caption = node.querySelector('caption');
      const ariaLabel = node.getAttribute('aria-label');
      const ariaLabelledBy = node.getAttribute('aria-labelledby');
      
      const hasAccessibleName = !!(caption || ariaLabel || ariaLabelledBy);
      
      // Check for proper headers
      const headers = node.querySelectorAll('th');
      const rows = node.querySelectorAll('tr');
      const hasHeaders = headers.length > 0;
      
      this.data({
        hasAccessibleName: hasAccessibleName,
        hasHeaders: hasHeaders,
        headerCount: headers.length,
        rowCount: rows.length,
        passes: hasAccessibleName && hasHeaders
      });
      
      return hasAccessibleName && hasHeaders;
    },
    metadata: {
      impact: 'serious',
      messages: {
        pass: 'Table has proper structure with headers and accessible name',
        fail: 'Table lacks proper headers or accessible name'
      }
    }
  },
  
  {
    id: 'clear-piggy-chart-accessibility-check',
    evaluate: function(node, options, virtualNode) {
      const isChart = node.matches('[data-testid*="chart"], svg[role="img"]');
      
      if (!isChart) {
        return true;
      }
      
      // Check for accessible name
      const ariaLabel = node.getAttribute('aria-label');
      const ariaLabelledBy = node.getAttribute('aria-labelledby');
      const title = node.querySelector('title');
      
      const hasAccessibleName = !!(ariaLabel || ariaLabelledBy || title);
      
      // Check for description
      const ariaDescribedBy = node.getAttribute('aria-describedby');
      const desc = node.querySelector('desc');
      
      const hasDescription = !!(ariaDescribedBy || desc);
      
      // Check for alternative data representation
      const table = document.querySelector('[data-testid*="chart-table"]');
      const textAlternative = document.querySelector('[data-testid*="chart-text"]');
      
      const hasAlternative = !!(table || textAlternative);
      
      this.data({
        hasAccessibleName: hasAccessibleName,
        hasDescription: hasDescription,
        hasAlternative: hasAlternative,
        passes: hasAccessibleName && (hasDescription || hasAlternative)
      });
      
      return hasAccessibleName && (hasDescription || hasAlternative);
    },
    metadata: {
      impact: 'serious',
      messages: {
        pass: 'Chart has proper accessibility markup and alternative representations',
        fail: 'Chart lacks proper accessibility markup or alternative data representation'
      }
    }
  }
];

module.exports = {
  customMobileAccessibilityRules,
  customChecks
};`;
  }

  /**
   * Generate Cypress accessibility commands
   */
  private async generateCypressAccessibilityCommands(): Promise<string> {
    return `// Cypress accessibility commands for Clear Piggy mobile testing
import 'cypress-axe';
import { AccessibilityUtils } from '../utils/accessibility-utils';

// Configure axe for mobile testing
Cypress.Commands.add('configureAxe', (options = {}) => {
  const mobileConfig = {
    rules: {
      'color-contrast': { enabled: true },
      'touch-target-size': { enabled: true },
      'mobile-viewport': { enabled: true },
      'mobile-form-inputs': { enabled: true },
      ...options.rules
    },
    tags: ['wcag2a', 'wcag2aa', 'mobile', 'best-practice'],
    ...options
  };
  
  cy.configureAxe(mobileConfig);
});

// Check accessibility with mobile-specific rules
Cypress.Commands.add('checkA11yMobile', (context, options = {}) => {
  const mobileOptions = {
    rules: {
      'clear-piggy-touch-targets': { enabled: true },
      'clear-piggy-mobile-forms': { enabled: true },
      'clear-piggy-financial-context': { enabled: true },
      ...options.rules
    },
    tags: ['mobile', 'wcag2a', 'wcag2aa'],
    ...options
  };
  
  cy.checkA11y(context, mobileOptions, (violations) => {
    if (violations.length > 0) {
      cy.task('logAccessibilityViolations', {
        url: window.location.href,
        violations: violations,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Check touch target sizes
Cypress.Commands.add('checkTouchTargets', (minSize = 44) => {
  cy.get('button, [role="button"], input, select, textarea, [tabindex="0"], a[href]')
    .each(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const actualSize = Math.min(rect.width, rect.height);
      
      expect(actualSize).to.be.at.least(minSize, 
        \`Touch target \${$el[0].tagName} should be at least \${minSize}px, but was \${actualSize}px\`
      );
    });
});

// Check color contrast
Cypress.Commands.add('checkColorContrast', (level = 'AA') => {
  cy.window().then((win) => {
    const results = AccessibilityUtils.checkColorContrast(win.document, level);
    
    results.then((violations) => {
      expect(violations).to.have.length(0, 
        \`Found \${violations.length} color contrast violations\`
      );
    });
  });
});

// Check keyboard navigation
Cypress.Commands.add('checkKeyboardNavigation', () => {
  cy.get('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    .each(($el) => {
      // Check if element is focusable
      cy.wrap($el).focus();
      cy.focused().should('be', $el[0]);
      
      // Check for visible focus indicator
      cy.wrap($el).should('satisfy', (el) => {
        const styles = window.getComputedStyle(el, ':focus');
        return (
          styles.outline !== 'none' &&
          styles.outline !== '0' &&
          styles.outline !== '0px'
        ) || styles.boxShadow !== 'none';
      });
    });
});

// Check form accessibility
Cypress.Commands.add('checkFormAccessibility', (formSelector) => {
  cy.get(formSelector).within(() => {
    // Check input labeling
    cy.get('input, select, textarea').each(($input) => {
      const input = $input[0];
      const id = input.id;
      const label = input.labels?.[0] || 
                   Cypress.$(\`label[for="\${id}"]\`)[0] ||
                   input.closest('label');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      expect(label || ariaLabel || ariaLabelledBy).to.exist;
    });
    
    // Check mobile input optimization
    cy.get('input[type="email"]').should('have.attr', 'inputmode', 'email');
    cy.get('input[type="tel"]').should('have.attr', 'inputmode', 'tel');
    cy.get('input[type="number"]').should('have.attr', 'inputmode', 'numeric');
    
    // Check required field indicators
    cy.get('input[required], select[required], textarea[required]').each(($required) => {
      const input = $required[0];
      const hasAriaRequired = input.getAttribute('aria-required') === 'true';
      const hasVisualIndicator = Cypress.$($required).siblings('.required').length > 0 ||
                                 input.getAttribute('aria-label')?.includes('required') ||
                                 input.getAttribute('placeholder')?.includes('*');
      
      expect(hasAriaRequired || hasVisualIndicator).to.be.true;
    });
  });
});

// Check financial data accessibility
Cypress.Commands.add('checkFinancialDataAccessibility', () => {
  // Check currency amounts
  cy.get('[data-testid*="amount"], [data-testid*="balance"], [data-testid*="currency"]')
    .each(($el) => {
      const text = $el.text();
      const hasNumbers = /\\d/.test(text);
      
      if (hasNumbers) {
        const hasCurrency = /[$£€¥₹]/.test(text) || /USD|EUR|GBP|JPY|INR/i.test(text);
        const hasAriaLabel = $el.attr('aria-label');
        const hasTitle = $el.attr('title');
        
        expect(hasCurrency || hasAriaLabel || hasTitle).to.be.true;
      }
    });
  
  // Check data tables
  cy.get('table, [role="table"]').each(($table) => {
    // Check for caption or accessible name
    const hasCaption = $table.find('caption').length > 0;
    const hasAriaLabel = $table.attr('aria-label');
    const hasAriaLabelledBy = $table.attr('aria-labelledby');
    
    expect(hasCaption || hasAriaLabel || hasAriaLabelledBy).to.be.true;
    
    // Check for headers
    const hasHeaders = $table.find('th').length > 0;
    expect(hasHeaders).to.be.true;
  });
});

// Check chart accessibility
Cypress.Commands.add('checkChartAccessibility', () => {
  cy.get('[data-testid*="chart"], svg[role="img"]').each(($chart) => {
    // Check for accessible name
    const hasAriaLabel = $chart.attr('aria-label');
    const hasAriaLabelledBy = $chart.attr('aria-labelledby');
    const hasTitle = $chart.find('title').length > 0;
    
    expect(hasAriaLabel || hasAriaLabelledBy || hasTitle).to.be.true;
    
    // Check for description or alternative representation
    const hasAriaDescribedBy = $chart.attr('aria-describedby');
    const hasDesc = $chart.find('desc').length > 0;
    const hasAlternativeTable = Cypress.$('[data-testid*="chart-table"]').length > 0;
    const hasTextAlternative = Cypress.$('[data-testid*="chart-text"]').length > 0;
    
    expect(hasAriaDescribedBy || hasDesc || hasAlternativeTable || hasTextAlternative).to.be.true;
  });
});

// Generate accessibility report
Cypress.Commands.add('generateA11yReport', (testName) => {
  cy.task('generateAccessibilityReport', {
    testName: testName,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
});

// Test mobile focus management
Cypress.Commands.add('testMobileFocusManagement', () => {
  // Test focus trap in modals
  cy.get('[role="dialog"]').each(($modal) => {
    if ($modal.is(':visible')) {
      // Focus should be trapped within modal
      cy.get($modal).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .first()
        .focus();
      
      // Tab through all focusable elements
      cy.get($modal).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .each(($el) => {
          cy.wrap($el).tab();
          cy.focused().should('be.visible');
        });
    }
  });
  
  // Test focus restoration
  cy.get('button[data-testid*="open"]').each(($button) => {
    cy.wrap($button).focus();
    cy.wrap($button).click();
    
    // If a modal opens, close it and check focus restoration
    cy.get('body').then(($body) => {
      if ($body.find('[role="dialog"]:visible').length > 0) {
        cy.get('[data-testid*="close"]').click();
        cy.focused().should('be', $button[0]);
      }
    });
  });
});`;
  }

  // Additional methods for generating various test types...
  private async generatePlaywrightAccessibilityFixtures(): Promise<string> {
    return `// Playwright accessibility fixtures placeholder`;
  }

  private async generateComponentAccessibilityTests(component: ComponentAnalysis): Promise<Record<string, string>> {
    return {
      [`${component.componentName}-accessibility.spec.js`]: `// Accessibility test for ${component.componentName}`
    };
  }

  private async generateWCAGComplianceTests(): Promise<string> {
    return `// WCAG compliance tests placeholder`;
  }

  private async generateMobileAccessibilityTests(): Promise<string> {
    return `// Mobile accessibility tests placeholder`;
  }

  private async generateTouchTargetTests(): Promise<string> {
    return `// Touch target tests placeholder`;
  }

  private async generateKeyboardNavigationTests(): Promise<string> {
    return `// Keyboard navigation tests placeholder`;
  }

  private async generateScreenReaderTests(): Promise<string> {
    return `// Screen reader tests placeholder`;
  }

  private async generateColorContrastTests(): Promise<string> {
    return `// Color contrast tests placeholder`;
  }

  private async generateFormAccessibilityTests(): Promise<string> {
    return `// Form accessibility tests placeholder`;
  }

  private async generateAccessibilityAuditReport(): Promise<string> {
    return `// Accessibility audit report generator placeholder`;
  }

  // Utility methods
  private countTestsInContent(content: string): number {
    const matches = content.match(/it\(/g) || content.match(/test\(/g);
    return matches ? matches.length : 0;
  }

  private async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.config.testOutputPath, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}