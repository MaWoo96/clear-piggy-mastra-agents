/**
 * Cypress Mobile Test Generator for Clear Piggy
 * Generates comprehensive mobile-specific Cypress tests with touch interactions,
 * responsive testing, and mobile viewport scenarios
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  MobileTestingConfig,
  TestScenario,
  MobileDevice,
  NetworkCondition,
  ComponentAnalysis,
  TestDataSet,
  MOBILE_DEVICES,
  NETWORK_CONDITIONS
} from '../types/mobile-testing-types.js';

export interface CypressTestGenerationOptions {
  includeVisualTesting: boolean;
  includePerformanceTesting: boolean;
  includeAccessibilityTesting: boolean;
  includeTouchGestures: boolean;
  includeOfflineTesting: boolean;
  generatePageObjects: boolean;
  generateCommands: boolean;
  generateUtilities: boolean;
}

export class CypressMobileTestGenerator {
  private config: MobileTestingConfig;
  private options: CypressTestGenerationOptions;

  constructor(config: MobileTestingConfig, options: CypressTestGenerationOptions) {
    this.config = config;
    this.options = options;
  }

  /**
   * Generate complete Cypress test suite for mobile testing
   */
  async generateTestSuite(components: ComponentAnalysis[]): Promise<{ files: string[], testCount: number }> {
    const generatedFiles: string[] = [];
    let totalTests = 0;

    try {
      // Create base Cypress configuration
      const cypressConfig = await this.generateCypressConfig();
      await this.writeFile('cypress.config.js', cypressConfig);
      generatedFiles.push('cypress.config.js');

      // Generate custom commands for mobile testing
      if (this.options.generateCommands) {
        const commands = await this.generateCustomCommands();
        await this.writeFile('cypress/support/commands.js', commands);
        generatedFiles.push('cypress/support/commands.js');
      }

      // Generate utility functions
      if (this.options.generateUtilities) {
        const utilities = await this.generateUtilities();
        await this.writeFile('cypress/support/utils.js', utilities);
        generatedFiles.push('cypress/support/utils.js');
      }

      // Generate page objects
      if (this.options.generatePageObjects) {
        const pageObjects = await this.generatePageObjects(components);
        for (const [filename, content] of Object.entries(pageObjects)) {
          await this.writeFile(`cypress/support/pages/${filename}`, content);
          generatedFiles.push(`cypress/support/pages/${filename}`);
        }
      }

      // Generate component-specific tests
      for (const component of components) {
        const componentTests = await this.generateComponentTests(component);
        for (const [filename, content] of Object.entries(componentTests)) {
          await this.writeFile(`cypress/e2e/mobile/${filename}`, content);
          generatedFiles.push(`cypress/e2e/mobile/${filename}`);
          totalTests += this.countTestsInContent(content);
        }
      }

      // Generate scenario-specific tests
      const scenarios = await this.generateMobileScenarios();
      for (const scenario of scenarios) {
        const testContent = await this.generateScenarioTest(scenario);
        const filename = `${scenario.id}.cy.js`;
        await this.writeFile(`cypress/e2e/scenarios/${filename}`, testContent);
        generatedFiles.push(`cypress/e2e/scenarios/${filename}`);
        totalTests += this.countTestsInContent(testContent);
      }

      // Generate cross-device tests
      const crossDeviceTests = await this.generateCrossDeviceTests();
      await this.writeFile('cypress/e2e/cross-device/responsive.cy.js', crossDeviceTests);
      generatedFiles.push('cypress/e2e/cross-device/responsive.cy.js');
      totalTests += this.countTestsInContent(crossDeviceTests);

      // Generate performance tests
      if (this.options.includePerformanceTesting) {
        const performanceTests = await this.generatePerformanceTests();
        await this.writeFile('cypress/e2e/performance/mobile-performance.cy.js', performanceTests);
        generatedFiles.push('cypress/e2e/performance/mobile-performance.cy.js');
        totalTests += this.countTestsInContent(performanceTests);
      }

      // Generate accessibility tests
      if (this.options.includeAccessibilityTesting) {
        const accessibilityTests = await this.generateAccessibilityTests();
        await this.writeFile('cypress/e2e/accessibility/mobile-a11y.cy.js', accessibilityTests);
        generatedFiles.push('cypress/e2e/accessibility/mobile-a11y.cy.js');
        totalTests += this.countTestsInContent(accessibilityTests);
      }

      // Generate offline tests
      if (this.options.includeOfflineTesting) {
        const offlineTests = await this.generateOfflineTests();
        await this.writeFile('cypress/e2e/offline/offline-functionality.cy.js', offlineTests);
        generatedFiles.push('cypress/e2e/offline/offline-functionality.cy.js');
        totalTests += this.countTestsInContent(offlineTests);
      }

      // Generate test data fixtures
      const fixtures = await this.generateTestDataFixtures();
      for (const [filename, content] of Object.entries(fixtures)) {
        await this.writeFile(`cypress/fixtures/${filename}`, JSON.stringify(content, null, 2));
        generatedFiles.push(`cypress/fixtures/${filename}`);
      }

      console.log(`✅ Generated ${generatedFiles.length} Cypress test files with ${totalTests} total tests`);
      return { files: generatedFiles, testCount: totalTests };

    } catch (error) {
      console.error('Failed to generate Cypress test suite:', error);
      throw error;
    }
  }

  /**
   * Generate Cypress configuration with mobile-specific settings
   */
  private async generateCypressConfig(): Promise<string> {
    const devices = this.config.mobileDevices.length > 0 ? this.config.mobileDevices : [
      MOBILE_DEVICES.iPhone12,
      MOBILE_DEVICES.galaxyS21,
      MOBILE_DEVICES.iPadAir
    ];

    return `import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 390,
    viewportHeight: 844,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    video: true,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      // Mobile devices for testing
      mobileDevices: ${JSON.stringify(devices, null, 6)},
      
      // Network conditions
      networkConditions: ${JSON.stringify(NETWORK_CONDITIONS, null, 6)},
      
      // Performance thresholds
      performanceThresholds: {
        firstContentfulPaint: 1800,
        largestContentfulPaint: 2500,
        firstInputDelay: 100,
        cumulativeLayoutShift: 0.1,
        scrollFPS: 60,
        touchResponseTime: 50
      },
      
      // Test configuration
      testConfig: {
        includeVisualTesting: ${this.options.includeVisualTesting},
        includePerformanceTesting: ${this.options.includePerformanceTesting},
        includeAccessibilityTesting: ${this.options.includeAccessibilityTesting},
        includeTouchGestures: ${this.options.includeTouchGestures}
      }
    },
    setupNodeEvents(on, config) {
      // Task for network throttling
      on('task', {
        setNetworkConditions(condition) {
          return new Promise((resolve) => {
            // Network throttling implementation would go here
            console.log(\`Setting network to \${condition.name}\`);
            resolve(null);
          });
        },
        
        measurePerformance(metrics) {
          console.log('Performance metrics:', metrics);
          return null;
        },
        
        generateTestReport(data) {
          // Test report generation
          console.log('Generating test report...', data);
          return null;
        }
      });
      
      // Plugin setup
      ${this.options.includeAccessibilityTesting ? "require('cypress-axe/plugin')(on, config);" : ''}
      ${this.options.includeVisualTesting ? "require('cypress-plugin-snapshots/plugin').initPlugin(on, config);" : ''}
      
      return config;
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack'
    },
    supportFile: 'cypress/support/component.js',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 390,
    viewportHeight: 844
  }
});`;
  }

  /**
   * Generate custom Cypress commands for mobile testing
   */
  private async generateCustomCommands(): Promise<string> {
    return `// Custom Cypress commands for Clear Piggy Mobile Testing

// Mobile device simulation
Cypress.Commands.add('setMobileDevice', (deviceName) => {
  const device = Cypress.env('mobileDevices')[deviceName];
  if (!device) {
    throw new Error(\`Device \${deviceName} not found\`);
  }
  
  cy.viewport(device.width, device.height);
  cy.window().then((win) => {
    Object.defineProperty(win.navigator, 'userAgent', {
      value: device.userAgent,
      writable: false
    });
  });
});

// Touch gestures
Cypress.Commands.add('touchTap', (selector, options = {}) => {
  cy.get(selector).trigger('touchstart', {
    touches: [{ clientX: 0, clientY: 0 }],
    ...options
  });
  cy.get(selector).trigger('touchend');
});

Cypress.Commands.add('touchSwipe', (selector, direction, distance = 100) => {
  const directions = {
    left: { startX: distance, startY: 0, endX: 0, endY: 0 },
    right: { startX: 0, startY: 0, endX: distance, endY: 0 },
    up: { startX: 0, startY: distance, endX: 0, endY: 0 },
    down: { startX: 0, startY: 0, endX: 0, endY: distance }
  };
  
  const coords = directions[direction];
  
  cy.get(selector)
    .trigger('touchstart', {
      touches: [{ clientX: coords.startX, clientY: coords.startY }]
    })
    .trigger('touchmove', {
      touches: [{ clientX: coords.endX, clientY: coords.endY }]
    })
    .trigger('touchend');
});

Cypress.Commands.add('touchPinch', (selector, scale = 2) => {
  cy.get(selector)
    .trigger('touchstart', {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 }
      ]
    })
    .trigger('touchmove', {
      touches: [
        { clientX: 100 - (50 * scale), clientY: 100 - (50 * scale) },
        { clientX: 200 + (50 * scale), clientY: 200 + (50 * scale) }
      ]
    })
    .trigger('touchend');
});

// Scroll performance testing
Cypress.Commands.add('measureScrollPerformance', (selector, scrollDistance = 1000) => {
  const performanceData = [];
  
  cy.get(selector).then((\$el) => {
    const element = \$el[0];
    let lastTimestamp = 0;
    let frameCount = 0;
    
    const measureFrame = (timestamp) => {
      if (lastTimestamp) {
        const deltaTime = timestamp - lastTimestamp;
        const fps = 1000 / deltaTime;
        performanceData.push({ timestamp, fps, deltaTime });
        frameCount++;
      }
      lastTimestamp = timestamp;
      
      if (element.scrollTop < scrollDistance) {
        element.scrollTop += 10;
        requestAnimationFrame(measureFrame);
      } else {
        const averageFPS = performanceData.reduce((sum, frame) => sum + frame.fps, 0) / frameCount;
        const minFPS = Math.min(...performanceData.map(frame => frame.fps));
        
        cy.task('measurePerformance', {
          type: 'scroll',
          averageFPS,
          minFPS,
          frameCount,
          data: performanceData
        });
      }
    };
    
    requestAnimationFrame(measureFrame);
  });
});

// Network condition simulation
Cypress.Commands.add('setNetworkCondition', (conditionName) => {
  const condition = Cypress.env('networkConditions')[conditionName];
  if (!condition) {
    throw new Error(\`Network condition \${conditionName} not found\`);
  }
  
  cy.task('setNetworkConditions', condition);
});

// Performance measurement
Cypress.Commands.add('measureWebVitals', () => {
  cy.window().then((win) => {
    return new Promise((resolve) => {
      const vitals = {};
      
      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.firstContentfulPaint = entry.startTime;
          }
        });
      }).observe({ entryTypes: ['paint'] });
      
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.largestContentfulPaint = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay (simulated)
      let firstInputDelay = null;
      const recordFID = (event) => {
        if (firstInputDelay === null) {
          firstInputDelay = performance.now() - event.timeStamp;
          vitals.firstInputDelay = firstInputDelay;
          win.removeEventListener('click', recordFID);
          win.removeEventListener('keydown', recordFID);
        }
      };
      
      win.addEventListener('click', recordFID);
      win.addEventListener('keydown', recordFID);
      
      // Cumulative Layout Shift
      let cumulativeLayoutShift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
          }
        }
        vitals.cumulativeLayoutShift = cumulativeLayoutShift;
      }).observe({ entryTypes: ['layout-shift'] });
      
      setTimeout(() => {
        resolve(vitals);
      }, 3000);
    });
  });
});

// Mobile form testing
Cypress.Commands.add('testMobileForm', (formSelector) => {
  cy.get(formSelector).within(() => {
    // Test touch target sizes
    cy.get('input, button, select, textarea').each((\$el) => {
      const rect = \$el[0].getBoundingClientRect();
      const touchTargetSize = Math.min(rect.width, rect.height);
      expect(touchTargetSize).to.be.at.least(44, 'Touch target should be at least 44px');
    });
    
    // Test mobile keyboard interactions
    cy.get('input[type="email"]').should('have.attr', 'inputmode', 'email');
    cy.get('input[type="tel"]').should('have.attr', 'inputmode', 'tel');
    cy.get('input[type="number"]').should('have.attr', 'inputmode', 'numeric');
    
    // Test viewport meta tag for zoom prevention
    cy.document().its('head').should('contain.html', 'user-scalable=no');
  });
});

// Accessibility testing for mobile
Cypress.Commands.add('checkMobileAccessibility', () => {
  // Check color contrast
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: true }
    }
  });
  
  // Check touch target sizes
  cy.get('[role="button"], button, [tabindex="0"]').each((\$el) => {
    const rect = \$el[0].getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    expect(size).to.be.at.least(44, 'Interactive element should be at least 44px');
  });
  
  // Check focus indicators
  cy.get('input, button, select, textarea, [tabindex="0"]').each((\$el) => {
    cy.wrap(\$el).focus();
    cy.wrap(\$el).should('have.focus');
    // Check if focus is visible
    cy.wrap(\$el).should('satisfy', (el) => {
      const styles = window.getComputedStyle(el, ':focus');
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
  });
});

// Visual regression testing
Cypress.Commands.add('compareScreenshot', (name, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    thresholdType: 'percent',
    ...options
  };
  
  cy.screenshot(name);
  cy.matchImageSnapshot(name, defaultOptions);
});

// Transaction list specific commands
Cypress.Commands.add('testTransactionListScrolling', (listSelector) => {
  cy.get(listSelector).within(() => {
    // Test virtual scrolling performance
    cy.measureScrollPerformance(listSelector, 2000);
    
    // Test infinite scroll loading
    cy.scrollTo('bottom');
    cy.get('[data-testid="loading-indicator"]').should('be.visible');
    cy.get('[data-testid="transaction-item"]').should('have.length.greaterThan', 20);
    
    // Test scroll position restoration
    cy.scrollTo(0, 500);
    const scrollPosition = cy.window().its('scrollY');
    cy.reload();
    cy.window().its('scrollY').should('equal', scrollPosition);
  });
});

// Budget creation flow testing
Cypress.Commands.add('testMobileBudgetFlow', () => {
  // Test responsive form layout
  cy.setMobileDevice('iPhone12');
  cy.visit('/budget/new');
  
  // Test form field accessibility on mobile
  cy.testMobileForm('[data-testid="budget-form"]');
  
  // Test category selection with touch
  cy.get('[data-testid="category-selector"]').touchTap();
  cy.get('[data-testid="category-option"]').first().touchTap();
  
  // Test amount input with mobile keyboard
  cy.get('[data-testid="amount-input"]')
    .should('have.attr', 'inputmode', 'decimal')
    .type('500.00');
  
  // Test date picker on mobile
  cy.get('[data-testid="date-picker"]').touchTap();
  cy.get('[data-testid="calendar-day"]').first().touchTap();
  
  // Test form submission
  cy.get('[data-testid="submit-button"]').touchTap();
  cy.url().should('include', '/budget/');
});`;
  }

  /**
   * Generate utility functions for mobile testing
   */
  private async generateUtilities(): Promise<string> {
    return `// Mobile testing utilities for Clear Piggy

export const MobileTestUtils = {
  // Device simulation utilities
  simulateDevice(deviceName) {
    const devices = Cypress.env('mobileDevices');
    const device = devices[deviceName];
    
    if (!device) {
      throw new Error(\`Device \${deviceName} not found\`);
    }
    
    cy.viewport(device.width, device.height);
    
    // Set device pixel ratio
    cy.window().then((win) => {
      Object.defineProperty(win, 'devicePixelRatio', {
        value: device.pixelRatio,
        writable: false
      });
    });
  },
  
  // Touch event utilities
  createTouchEvent(type, touches) {
    return {
      type,
      touches: touches.map(touch => ({
        identifier: touch.id || 0,
        clientX: touch.x,
        clientY: touch.y,
        screenX: touch.x,
        screenY: touch.y,
        pageX: touch.x,
        pageY: touch.y,
        target: touch.target
      }))
    };
  },
  
  // Performance measurement utilities
  measureRenderTime(componentSelector) {
    const startTime = performance.now();
    
    cy.get(componentSelector).should('be.visible').then(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      cy.task('measurePerformance', {
        type: 'render',
        component: componentSelector,
        time: renderTime,
        threshold: 16.67 // 60 FPS threshold
      });
      
      expect(renderTime).to.be.lessThan(50, 'Component render time should be under 50ms');
    });
  },
  
  // Network condition utilities
  simulateSlowNetwork() {
    cy.setNetworkCondition('3G_SLOW');
  },
  
  simulateOffline() {
    cy.setNetworkCondition('OFFLINE');
  },
  
  // Responsive layout utilities
  testBreakpoints(breakpoints) {
    Object.entries(breakpoints).forEach(([name, width]) => {
      cy.viewport(width, 800);
      cy.get('[data-testid="responsive-layout"]')
        .should('have.class', \`\${name}-layout\`);
    });
  },
  
  // Financial data utilities
  generateTransactionData(count = 10) {
    return Array.from({ length: count }, (_, index) => ({
      id: \`txn_\${index + 1}\`,
      amount: (Math.random() * 1000).toFixed(2),
      description: \`Transaction \${index + 1}\`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: ['Food', 'Transport', 'Shopping', 'Entertainment'][Math.floor(Math.random() * 4)],
      type: Math.random() > 0.3 ? 'expense' : 'income'
    }));
  },
  
  generateBudgetData() {
    return {
      name: 'Monthly Budget',
      amount: 2000,
      period: 'monthly',
      categories: [
        { name: 'Food', allocated: 400, spent: 320 },
        { name: 'Transport', allocated: 300, spent: 280 },
        { name: 'Shopping', allocated: 200, spent: 150 },
        { name: 'Entertainment', allocated: 150, spent: 100 }
      ]
    };
  },
  
  // Accessibility utilities
  checkTouchTargetSizes(minSize = 44) {
    cy.get('button, [role="button"], input, select, textarea, [tabindex="0"]')
      .each((\$el) => {
        const rect = \$el[0].getBoundingClientRect();
        const actualSize = Math.min(rect.width, rect.height);
        expect(actualSize).to.be.at.least(minSize, 
          \`Touch target \${$el[0].tagName} should be at least \${minSize}px\`);
      });
  },
  
  checkColorContrast() {
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  },
  
  // Chart interaction utilities
  testChartTouch(chartSelector) {
    cy.get(chartSelector).within(() => {
      // Test touch interactions on chart
      cy.get('svg').should('be.visible');
      
      // Test tap to select data points
      cy.get('[data-testid="chart-point"]').first().touchTap();
      cy.get('[data-testid="chart-tooltip"]').should('be.visible');
      
      // Test pinch to zoom
      cy.get('svg').touchPinch(2);
      
      // Test pan gesture
      cy.get('svg').touchSwipe('left', 100);
    });
  },
  
  // Form validation utilities
  testMobileFormValidation(formSelector) {
    cy.get(formSelector).within(() => {
      // Test required field validation
      cy.get('[required]').each((\$field) => {
        cy.wrap(\$field).clear();
        cy.get('[type="submit"]').click();
        cy.wrap(\$field).should('have.class', 'error');
      });
      
      // Test input format validation
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('[type="submit"]').click();
      cy.get('input[type="email"]').should('have.class', 'error');
      
      // Test mobile-optimized inputs
      cy.get('input[type="tel"]').should('have.attr', 'inputmode', 'tel');
      cy.get('input[type="number"]').should('have.attr', 'inputmode', 'numeric');
    });
  },
  
  // Storage utilities
  mockLocalStorage(data) {
    cy.window().then((win) => {
      Object.entries(data).forEach(([key, value]) => {
        win.localStorage.setItem(key, JSON.stringify(value));
      });
    });
  },
  
  mockIndexedDB(storeName, data) {
    cy.window().then((win) => {
      // Mock IndexedDB for offline testing
      const mockDB = {
        [storeName]: data
      };
      win.mockIndexedDB = mockDB;
    });
  },
  
  // Service Worker utilities
  registerMockServiceWorker() {
    cy.window().then((win) => {
      if ('serviceWorker' in win.navigator) {
        win.navigator.serviceWorker.register('/mock-sw.js');
      }
    });
  },
  
  // Visual testing utilities
  compareVisual(name, options = {}) {
    const defaultOptions = {
      threshold: 0.1,
      failureThreshold: 0.01,
      ...options
    };
    
    cy.compareScreenshot(name, defaultOptions);
  },
  
  // Wait utilities
  waitForTransactionLoad() {
    cy.get('[data-testid="transaction-list"]').should('be.visible');
    cy.get('[data-testid="loading-indicator"]').should('not.exist');
    cy.get('[data-testid="transaction-item"]').should('have.length.at.least', 1);
  },
  
  waitForChartRender() {
    cy.get('[data-testid="chart-container"] svg').should('be.visible');
    cy.get('[data-testid="chart-loading"]').should('not.exist');
  },
  
  // Error state testing
  testErrorStates() {
    // Test network error
    cy.intercept('GET', '/api/**', { forceNetworkError: true });
    cy.reload();
    cy.get('[data-testid="error-message"]').should('be.visible');
    
    // Test 500 error
    cy.intercept('GET', '/api/**', { statusCode: 500 });
    cy.reload();
    cy.get('[data-testid="error-500"]').should('be.visible');
  }
};

// Export for use in tests
window.MobileTestUtils = MobileTestUtils;`;
  }

  /**
   * Generate page objects for mobile testing
   */
  private async generatePageObjects(components: ComponentAnalysis[]): Promise<Record<string, string>> {
    const pageObjects: Record<string, string> = {};

    // Generate main page objects
    pageObjects['DashboardPage.js'] = this.generateDashboardPageObject();
    pageObjects['TransactionListPage.js'] = this.generateTransactionListPageObject();
    pageObjects['BudgetPage.js'] = this.generateBudgetPageObject();
    pageObjects['NavigationPage.js'] = this.generateNavigationPageObject();

    // Generate component-specific page objects
    for (const component of components) {
      if (component.componentType === 'form') {
        pageObjects[`${component.componentName}Page.js`] = this.generateFormPageObject(component);
      } else if (component.componentType === 'list') {
        pageObjects[`${component.componentName}Page.js`] = this.generateListPageObject(component);
      } else if (component.componentType === 'chart') {
        pageObjects[`${component.componentName}Page.js`] = this.generateChartPageObject(component);
      }
    }

    return pageObjects;
  }

  private generateDashboardPageObject(): string {
    return `// Dashboard Page Object for Mobile Testing

export class DashboardPage {
  // Selectors
  get container() { return cy.get('[data-testid="dashboard-container"]'); }
  get balanceCard() { return cy.get('[data-testid="balance-card"]'); }
  get recentTransactions() { return cy.get('[data-testid="recent-transactions"]'); }
  get budgetOverview() { return cy.get('[data-testid="budget-overview"]'); }
  get chartContainer() { return cy.get('[data-testid="chart-container"]'); }
  get navigationMenu() { return cy.get('[data-testid="nav-menu"]'); }
  get addTransactionButton() { return cy.get('[data-testid="add-transaction-btn"]'); }
  
  // Mobile-specific selectors
  get mobileHeader() { return cy.get('[data-testid="mobile-header"]'); }
  get hamburgerMenu() { return cy.get('[data-testid="hamburger-menu"]'); }
  get bottomNavigation() { return cy.get('[data-testid="bottom-nav"]'); }
  
  // Actions
  visit() {
    cy.visit('/dashboard');
    return this;
  }
  
  waitForLoad() {
    this.container.should('be.visible');
    cy.get('[data-testid="loading-indicator"]').should('not.exist');
    return this;
  }
  
  openMobileMenu() {
    this.hamburgerMenu.touchTap();
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
    return this;
  }
  
  scrollToSection(section) {
    cy.get(\`[data-testid="\${section}"]\`).scrollIntoView();
    return this;
  }
  
  testResponsiveLayout() {
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 390, height: 844 }, // iPhone 12
      { width: 428, height: 926 }  // iPhone 12 Pro Max
    ];
    
    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);
      this.container.should('be.visible');
      this.balanceCard.should('be.visible');
    });
    
    return this;
  }
  
  testTouchInteractions() {
    // Test touch interactions on dashboard elements
    this.balanceCard.touchTap();
    this.addTransactionButton.touchTap();
    return this;
  }
  
  measurePerformance() {
    cy.measureWebVitals();
    cy.measureRenderTime('[data-testid="dashboard-container"]');
    return this;
  }
  
  // Assertions
  shouldDisplayBalance() {
    this.balanceCard.should('be.visible');
    this.balanceCard.find('[data-testid="balance-amount"]').should('not.be.empty');
    return this;
  }
  
  shouldDisplayRecentTransactions() {
    this.recentTransactions.should('be.visible');
    this.recentTransactions.find('[data-testid="transaction-item"]')
      .should('have.length.at.least', 1);
    return this;
  }
  
  shouldBeResponsive() {
    // Check responsive breakpoints
    cy.viewport(375, 667); // Mobile
    this.mobileHeader.should('be.visible');
    
    cy.viewport(768, 1024); // Tablet
    this.container.should('have.class', 'tablet-layout');
    
    return this;
  }
}`;
  }

  private generateTransactionListPageObject(): string {
    return `// Transaction List Page Object for Mobile Testing

export class TransactionListPage {
  // Selectors
  get container() { return cy.get('[data-testid="transaction-list-container"]'); }
  get transactionItems() { return cy.get('[data-testid="transaction-item"]'); }
  get loadingIndicator() { return cy.get('[data-testid="loading-indicator"]'); }
  get emptyState() { return cy.get('[data-testid="empty-state"]'); }
  get filterButton() { return cy.get('[data-testid="filter-button"]'); }
  get searchInput() { return cy.get('[data-testid="search-input"]'); }
  get pullToRefresh() { return cy.get('[data-testid="pull-to-refresh"]'); }
  
  // Actions
  visit() {
    cy.visit('/transactions');
    return this;
  }
  
  waitForLoad() {
    this.container.should('be.visible');
    this.loadingIndicator.should('not.exist');
    return this;
  }
  
  testInfiniteScroll() {
    // Test infinite scroll loading
    const initialCount = this.getTransactionCount();
    
    cy.scrollTo('bottom');
    this.loadingIndicator.should('be.visible');
    
    cy.wait(2000);
    this.loadingIndicator.should('not.exist');
    
    this.transactionItems.should('have.length.greaterThan', initialCount);
    return this;
  }
  
  testVirtualScrolling() {
    // Measure scroll performance
    cy.testTransactionListScrolling('[data-testid="transaction-list-container"]');
    return this;
  }
  
  testPullToRefresh() {
    // Simulate pull to refresh gesture
    this.container.touchSwipe('down', 150);
    this.pullToRefresh.should('be.visible');
    
    cy.wait(1000);
    this.pullToRefresh.should('not.exist');
    return this;
  }
  
  testTransactionTap() {
    // Test tapping on transaction items
    this.transactionItems.first().touchTap();
    cy.url().should('include', '/transaction/');
    return this;
  }
  
  testSearchFunctionality() {
    this.searchInput.type('grocery');
    cy.wait(500);
    
    this.transactionItems.each((\$item) => {
      cy.wrap(\$item).should('contain.text', 'grocery');
    });
    
    return this;
  }
  
  testFilterOptions() {
    this.filterButton.touchTap();
    cy.get('[data-testid="filter-modal"]').should('be.visible');
    
    // Test category filter
    cy.get('[data-testid="filter-category"]').select('Food');
    cy.get('[data-testid="apply-filter"]').touchTap();
    
    this.waitForLoad();
    return this;
  }
  
  // Utilities
  getTransactionCount() {
    return cy.get('[data-testid="transaction-item"]').then((\$items) => \$items.length);
  }
  
  // Assertions
  shouldDisplayTransactions() {
    this.transactionItems.should('have.length.at.least', 1);
    return this;
  }
  
  shouldShowEmptyState() {
    this.emptyState.should('be.visible');
    this.transactionItems.should('not.exist');
    return this;
  }
  
  shouldHandleScrollPerformance() {
    // Check scroll performance metrics
    cy.measureScrollPerformance('[data-testid="transaction-list-container"]');
    return this;
  }
}`;
  }

  private generateBudgetPageObject(): string {
    return `// Budget Page Object for Mobile Testing

export class BudgetPage {
  // Selectors
  get container() { return cy.get('[data-testid="budget-container"]'); }
  get budgetForm() { return cy.get('[data-testid="budget-form"]'); }
  get nameInput() { return cy.get('[data-testid="budget-name"]'); }
  get amountInput() { return cy.get('[data-testid="budget-amount"]'); }
  get categorySelector() { return cy.get('[data-testid="category-selector"]'); }
  get datePicker() { return cy.get('[data-testid="date-picker"]'); }
  get submitButton() { return cy.get('[data-testid="submit-button"]'); }
  get budgetChart() { return cy.get('[data-testid="budget-chart"]'); }
  get progressBars() { return cy.get('[data-testid="progress-bar"]'); }
  
  // Actions
  visit() {
    cy.visit('/budget');
    return this;
  }
  
  visitNewBudget() {
    cy.visit('/budget/new');
    return this;
  }
  
  fillBudgetForm(budgetData) {
    this.nameInput.clear().type(budgetData.name);
    this.amountInput.clear().type(budgetData.amount.toString());
    
    // Test mobile-optimized number input
    this.amountInput.should('have.attr', 'inputmode', 'decimal');
    
    return this;
  }
  
  selectCategory(category) {
    this.categorySelector.touchTap();
    cy.get(\`[data-testid="category-option-\${category}"]\`).touchTap();
    return this;
  }
  
  selectDate(date) {
    this.datePicker.touchTap();
    cy.get('[data-testid="calendar-modal"]').should('be.visible');
    cy.get(\`[data-value="\${date}"]\`).touchTap();
    return this;
  }
  
  submitBudget() {
    this.submitButton.touchTap();
    return this;
  }
  
  testMobileFormValidation() {
    cy.testMobileForm('[data-testid="budget-form"]');
    return this;
  }
  
  testChartInteractions() {
    cy.testChartTouch('[data-testid="budget-chart"]');
    return this;
  }
  
  testResponsiveLayout() {
    // Test form layout on different screen sizes
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 }
    ];
    
    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);
      this.budgetForm.should('be.visible');
      this.submitButton.should('be.visible');
    });
    
    return this;
  }
  
  // Assertions
  shouldDisplayBudgetForm() {
    this.budgetForm.should('be.visible');
    this.nameInput.should('be.visible');
    this.amountInput.should('be.visible');
    this.submitButton.should('be.visible');
    return this;
  }
  
  shouldValidateRequiredFields() {
    this.submitButton.touchTap();
    this.nameInput.should('have.class', 'error');
    this.amountInput.should('have.class', 'error');
    return this;
  }
  
  shouldRedirectAfterSubmission() {
    cy.url().should('match', /\\/budget\\/\\d+/);
    return this;
  }
}`;
  }

  private generateNavigationPageObject(): string {
    return `// Navigation Page Object for Mobile Testing

export class NavigationPage {
  // Selectors
  get mobileMenu() { return cy.get('[data-testid="mobile-menu"]'); }
  get hamburgerButton() { return cy.get('[data-testid="hamburger-button"]'); }
  get bottomNavigation() { return cy.get('[data-testid="bottom-navigation"]'); }
  get navItems() { return cy.get('[data-testid="nav-item"]'); }
  get backButton() { return cy.get('[data-testid="back-button"]'); }
  get breadcrumbs() { return cy.get('[data-testid="breadcrumbs"]'); }
  
  // Navigation links
  get dashboardLink() { return cy.get('[data-testid="nav-dashboard"]'); }
  get transactionsLink() { return cy.get('[data-testid="nav-transactions"]'); }
  get budgetLink() { return cy.get('[data-testid="nav-budget"]'); }
  get reportsLink() { return cy.get('[data-testid="nav-reports"]'); }
  get settingsLink() { return cy.get('[data-testid="nav-settings"]'); }
  
  // Actions
  openMobileMenu() {
    this.hamburgerButton.touchTap();
    this.mobileMenu.should('be.visible');
    return this;
  }
  
  closeMobileMenu() {
    cy.get('[data-testid="menu-overlay"]').touchTap();
    this.mobileMenu.should('not.be.visible');
    return this;
  }
  
  navigateToSection(section) {
    this.openMobileMenu();
    cy.get(\`[data-testid="nav-\${section}"]\`).touchTap();
    cy.url().should('include', \`/\${section}\`);
    return this;
  }
  
  testBottomNavigation() {
    // Test bottom navigation on mobile
    this.bottomNavigation.should('be.visible');
    
    const navItems = ['dashboard', 'transactions', 'budget', 'reports'];
    navItems.forEach(item => {
      cy.get(\`[data-testid="bottom-nav-\${item}"]\`).touchTap();
      cy.url().should('include', \`/\${item}\`);
    });
    
    return this;
  }
  
  testGestureNavigation() {
    // Test swipe gestures for navigation
    cy.get('body').touchSwipe('right'); // Back gesture
    
    return this;
  }
  
  testTabNavigation() {
    // Test keyboard navigation for accessibility
    this.navItems.each((\$item, index) => {
      cy.wrap(\$item).tab();
      cy.wrap(\$item).should('have.focus');
    });
    
    return this;
  }
  
  testTouchTargets() {
    // Verify touch target sizes
    MobileTestUtils.checkTouchTargetSizes(44);
    return this;
  }
  
  // Assertions
  shouldBeVisible() {
    this.hamburgerButton.should('be.visible');
    return this;
  }
  
  shouldShowActiveState(section) {
    cy.get(\`[data-testid="nav-\${section}"]\`).should('have.class', 'active');
    return this;
  }
  
  shouldBeAccessible() {
    // Check navigation accessibility
    this.navItems.each((\$item) => {
      cy.wrap(\$item).should('have.attr', 'role');
      cy.wrap(\$item).should('have.attr', 'aria-label');
    });
    
    return this;
  }
}`;
  }

  /**
   * Generate mobile-specific test scenarios
   */
  private async generateMobileScenarios(): Promise<TestScenario[]> {
    return [
      {
        id: 'mobile-transaction-scrolling',
        name: 'Mobile Transaction List Scrolling Performance',
        description: 'Test transaction list scrolling performance on mobile devices',
        type: 'performance',
        priority: 'high',
        tags: ['mobile', 'performance', 'scrolling'],
        mobileSpecific: true,
        estimatedDuration: 60,
        steps: [],
        assertions: []
      },
      {
        id: 'mobile-budget-creation',
        name: 'Mobile Budget Creation Flow',
        description: 'Test complete budget creation flow on mobile devices',
        type: 'functional',
        priority: 'high',
        tags: ['mobile', 'budget', 'form'],
        mobileSpecific: true,
        estimatedDuration: 90,
        steps: [],
        assertions: []
      },
      {
        id: 'mobile-chart-interactions',
        name: 'Mobile Chart Touch Interactions',
        description: 'Test chart interactions with touch gestures',
        type: 'touch-interaction',
        priority: 'medium',
        tags: ['mobile', 'chart', 'touch'],
        mobileSpecific: true,
        estimatedDuration: 45,
        steps: [],
        assertions: []
      },
      {
        id: 'mobile-navigation-responsiveness',
        name: 'Mobile Navigation Menu Responsiveness',
        description: 'Test navigation menu responsiveness across devices',
        type: 'responsive',
        priority: 'high',
        tags: ['mobile', 'navigation', 'responsive'],
        mobileSpecific: true,
        estimatedDuration: 30,
        steps: [],
        assertions: []
      },
      {
        id: 'mobile-form-keyboard',
        name: 'Mobile Form Input with Keyboard',
        description: 'Test form inputs with mobile keyboard variations',
        type: 'functional',
        priority: 'medium',
        tags: ['mobile', 'form', 'keyboard'],
        mobileSpecific: true,
        estimatedDuration: 60,
        steps: [],
        assertions: []
      },
      {
        id: 'mobile-offline-functionality',
        name: 'Mobile Offline Functionality',
        description: 'Test app functionality in offline scenarios',
        type: 'offline',
        priority: 'high',
        tags: ['mobile', 'offline', 'pwa'],
        mobileSpecific: true,
        estimatedDuration: 120,
        steps: [],
        assertions: []
      }
    ];
  }

  private async generateScenarioTest(scenario: TestScenario): Promise<string> {
    switch (scenario.id) {
      case 'mobile-transaction-scrolling':
        return this.generateTransactionScrollingTest();
      case 'mobile-budget-creation':
        return this.generateBudgetCreationTest();
      case 'mobile-chart-interactions':
        return this.generateChartInteractionTest();
      case 'mobile-navigation-responsiveness':
        return this.generateNavigationResponsivenessTest();
      case 'mobile-form-keyboard':
        return this.generateFormKeyboardTest();
      case 'mobile-offline-functionality':
        return this.generateOfflineFunctionalityTest();
      default:
        return this.generateGenericMobileTest(scenario);
    }
  }

  /**
   * Generate component-specific tests
   */
  private async generateComponentTests(component: ComponentAnalysis): Promise<Record<string, string>> {
    const tests: Record<string, string> = {};

    // Generate base component test
    tests[`${component.componentName}.cy.js`] = this.generateBaseComponentTest(component);

    // Generate specific tests based on component type
    if (component.componentType === 'form') {
      tests[`${component.componentName}-mobile-form.cy.js`] = this.generateMobileFormTest(component);
    }

    if (component.componentType === 'list') {
      tests[`${component.componentName}-mobile-list.cy.js`] = this.generateMobileListTest(component);
    }

    if (component.componentType === 'chart') {
      tests[`${component.componentName}-mobile-chart.cy.js`] = this.generateMobileChartTest(component);
    }

    return tests;
  }

  // Helper methods for test generation
  private generateBaseComponentTest(component: ComponentAnalysis): string {
    return `// Mobile test for ${component.componentName} component
import { MobileTestUtils } from '../../support/utils';

describe('${component.componentName} - Mobile Tests', () => {
  const mobileDevices = ['iPhone12', 'galaxyS21', 'iPadAir'];
  
  beforeEach(() => {
    cy.visit('/${component.componentName.toLowerCase()}');
  });

  mobileDevices.forEach(device => {
    describe(\`\${device} viewport\`, () => {
      beforeEach(() => {
        cy.setMobileDevice(device);
      });

      it('should render correctly on mobile', () => {
        cy.get('[data-testid="${component.componentName.toLowerCase()}-container"]')
          .should('be.visible');
        
        // Test responsive layout
        MobileTestUtils.measureRenderTime('[data-testid="${component.componentName.toLowerCase()}-container"]');
      });

      it('should handle touch interactions', () => {
        // Test touch events based on component events
        ${component.events.map(event => `
        cy.get('[data-testid="${event.name}-target"]').touchTap();`).join('')}
      });

      it('should be accessible on mobile', () => {
        cy.checkMobileAccessibility();
      });

      ${this.options.includePerformanceTesting ? `
      it('should meet performance thresholds', () => {
        cy.measureWebVitals().then((vitals) => {
          expect(vitals.firstContentfulPaint).to.be.lessThan(1800);
          expect(vitals.largestContentfulPaint).to.be.lessThan(2500);
          expect(vitals.cumulativeLayoutShift).to.be.lessThan(0.1);
        });
      });` : ''}

      ${this.options.includeVisualTesting ? `
      it('should match visual baseline', () => {
        cy.compareScreenshot(\`\${device}-${component.componentName.toLowerCase()}\`);
      });` : ''}
    });
  });
});`;
  }

  private generateTransactionScrollingTest(): string {
    return `// Transaction List Scrolling Performance Test
import { TransactionListPage } from '../support/pages/TransactionListPage';
import { MobileTestUtils } from '../support/utils';

describe('Transaction List Scrolling Performance', () => {
  const transactionListPage = new TransactionListPage();
  const mobileDevices = ['iPhone12', 'galaxyS21', 'iPadAir'];

  beforeEach(() => {
    // Setup test data
    cy.fixture('transactions-large.json').then((transactions) => {
      cy.intercept('GET', '/api/transactions*', { body: transactions });
    });
  });

  mobileDevices.forEach(device => {
    describe(\`\${device} Performance Tests\`, () => {
      beforeEach(() => {
        cy.setMobileDevice(device);
        transactionListPage.visit().waitForLoad();
      });

      it('should maintain 60fps during scrolling', () => {
        transactionListPage.testVirtualScrolling();
        
        cy.measureScrollPerformance('[data-testid="transaction-list"]', 2000)
          .then((metrics) => {
            expect(metrics.averageFPS).to.be.at.least(55);
            expect(metrics.minFPS).to.be.at.least(45);
          });
      });

      it('should handle infinite scroll smoothly', () => {
        transactionListPage.testInfiniteScroll();
        
        // Verify no frame drops during loading
        cy.get('[data-testid="loading-indicator"]').should('not.exist');
        cy.get('[data-testid="transaction-item"]').should('have.length.at.least', 50);
      });

      it('should support pull-to-refresh', () => {
        transactionListPage.testPullToRefresh();
        
        // Verify data refresh
        cy.get('[data-testid="refresh-timestamp"]').should('contain', new Date().toDateString());
      });

      it('should restore scroll position after navigation', () => {
        // Scroll to specific position
        cy.scrollTo(0, 500);
        const scrollPosition = cy.window().its('scrollY');
        
        // Navigate away and back
        cy.visit('/dashboard');
        cy.visit('/transactions');
        
        // Verify scroll position restored
        cy.window().its('scrollY').should('equal', scrollPosition);
      });

      it('should handle touch interactions on list items', () => {
        cy.get('[data-testid="transaction-item"]').first().as('firstTransaction');
        
        // Test tap to select
        cy.get('@firstTransaction').touchTap();
        cy.get('@firstTransaction').should('have.class', 'selected');
        
        // Test swipe actions
        cy.get('@firstTransaction').touchSwipe('left');
        cy.get('[data-testid="swipe-actions"]').should('be.visible');
      });
    });
  });

  describe('Network Condition Tests', () => {
    ['3G_SLOW', '3G_FAST', '4G'].forEach(networkCondition => {
      it(\`should handle scrolling on \${networkCondition}\`, () => {
        cy.setNetworkCondition(networkCondition);
        cy.setMobileDevice('iPhone12');
        
        transactionListPage.visit().waitForLoad();
        transactionListPage.testInfiniteScroll();
        
        // Verify performance doesn't degrade too much on slow networks
        if (networkCondition === '3G_SLOW') {
          cy.measureScrollPerformance('[data-testid="transaction-list"]', 1000)
            .then((metrics) => {
              expect(metrics.averageFPS).to.be.at.least(30);
            });
        }
      });
    });
  });
});`;
  }

  private generateBudgetCreationTest(): string {
    return `// Budget Creation Flow Mobile Test
import { BudgetPage } from '../support/pages/BudgetPage';
import { NavigationPage } from '../support/pages/NavigationPage';

describe('Budget Creation Flow - Mobile', () => {
  const budgetPage = new BudgetPage();
  const navigationPage = new NavigationPage();
  const mobileDevices = ['iPhone12', 'galaxyS21'];

  beforeEach(() => {
    cy.fixture('budget-data.json').as('budgetData');
  });

  mobileDevices.forEach(device => {
    describe(\`\${device} Budget Creation\`, () => {
      beforeEach(() => {
        cy.setMobileDevice(device);
        budgetPage.visitNewBudget();
      });

      it('should display mobile-optimized budget form', function() {
        budgetPage.shouldDisplayBudgetForm();
        budgetPage.testResponsiveLayout();
        
        // Test form field optimization for mobile
        cy.get('[data-testid="budget-amount"]')
          .should('have.attr', 'inputmode', 'decimal')
          .should('have.attr', 'pattern', '[0-9]*');
        
        cy.get('[data-testid="budget-name"]')
          .should('have.attr', 'autocomplete', 'off')
          .should('have.attr', 'autocorrect', 'off');
      });

      it('should handle mobile keyboard interactions', function() {
        const budgetData = this.budgetData;
        
        // Test amount input with mobile number keyboard
        budgetPage.amountInput.touchTap();
        cy.focused().should('have.attr', 'inputmode', 'decimal');
        
        budgetPage.fillBudgetForm(budgetData);
        budgetPage.selectCategory(budgetData.category);
        budgetPage.selectDate(budgetData.startDate);
      });

      it('should validate form fields on mobile', function() {
        budgetPage.testMobileFormValidation();
        
        // Test specific mobile validation behaviors
        budgetPage.submitButton.touchTap();
        budgetPage.shouldValidateRequiredFields();
        
        // Test inline validation
        budgetPage.amountInput.type('invalid');
        budgetPage.amountInput.should('have.class', 'error');
        cy.get('[data-testid="amount-error"]').should('contain', 'Please enter a valid amount');
      });

      it('should handle category selection with touch', function() {
        const budgetData = this.budgetData;
        
        budgetPage.categorySelector.touchTap();
        cy.get('[data-testid="category-modal"]').should('be.visible');
        
        // Test scrolling through categories
        cy.get('[data-testid="category-list"]').touchSwipe('up', 200);
        
        budgetPage.selectCategory(budgetData.category);
        cy.get('[data-testid="category-modal"]').should('not.exist');
        
        budgetPage.categorySelector.should('contain', budgetData.category);
      });

      it('should handle date picker on mobile', function() {
        const budgetData = this.budgetData;
        
        budgetPage.datePicker.touchTap();
        cy.get('[data-testid="date-modal"]').should('be.visible');
        
        // Test date navigation with touch
        cy.get('[data-testid="prev-month"]').touchTap();
        cy.get('[data-testid="next-month"]').touchTap();
        
        budgetPage.selectDate(budgetData.startDate);
        cy.get('[data-testid="date-modal"]').should('not.exist');
      });

      it('should complete budget creation flow', function() {
        const budgetData = this.budgetData;
        
        budgetPage
          .fillBudgetForm(budgetData)
          .selectCategory(budgetData.category)
          .selectDate(budgetData.startDate)
          .submitBudget();
        
        budgetPage.shouldRedirectAfterSubmission();
        
        // Verify budget was created
        cy.get('[data-testid="budget-success-message"]')
          .should('contain', 'Budget created successfully');
      });

      it('should handle form errors gracefully', () => {
        // Test network errors
        cy.intercept('POST', '/api/budgets', { statusCode: 500 }).as('budgetError');
        
        budgetPage.fillBudgetForm({
          name: 'Test Budget',
          amount: 1000
        });
        budgetPage.submitBudget();
        
        cy.wait('@budgetError');
        cy.get('[data-testid="error-message"]')
          .should('contain', 'Failed to create budget');
        
        // Verify form data is preserved
        budgetPage.nameInput.should('have.value', 'Test Budget');
        budgetPage.amountInput.should('have.value', '1000');
      });

      it('should be accessible on mobile', () => {
        budgetPage.shouldDisplayBudgetForm();
        
        // Test form accessibility
        cy.checkMobileAccessibility();
        
        // Test keyboard navigation
        budgetPage.nameInput.tab();
        budgetPage.amountInput.should('have.focus');
        
        budgetPage.amountInput.tab();
        budgetPage.categorySelector.should('have.focus');
      });
    });
  });

  describe('Cross-device consistency', () => {
    it('should maintain form state across orientations', () => {
      cy.setMobileDevice('iPhone12');
      budgetPage.visitNewBudget();
      
      // Fill form in portrait
      budgetPage.nameInput.type('Test Budget');
      budgetPage.amountInput.type('1500');
      
      // Rotate to landscape
      cy.viewport(844, 390); // Landscape
      
      // Verify form state preserved
      budgetPage.nameInput.should('have.value', 'Test Budget');
      budgetPage.amountInput.should('have.value', '1500');
      
      // Verify layout adjusts
      budgetPage.container.should('have.class', 'landscape-layout');
    });
  });
});`;
  }

  // Additional helper methods...
  private countTestsInContent(content: string): number {
    const matches = content.match(/it\\(/g);
    return matches ? matches.length : 0;
  }

  private async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.config.testOutputPath, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  // Additional methods for generating other test types would be implemented here...
  private generateCrossDeviceTests(): Promise<string> {
    // Implementation for cross-device tests
    return Promise.resolve('// Cross-device tests placeholder');
  }

  private generatePerformanceTests(): Promise<string> {
    // Implementation for performance tests
    return Promise.resolve('// Performance tests placeholder');
  }

  private generateAccessibilityTests(): Promise<string> {
    // Implementation for accessibility tests
    return Promise.resolve('// Accessibility tests placeholder');
  }

  private generateOfflineTests(): Promise<string> {
    // Implementation for offline tests
    return Promise.resolve('// Offline tests placeholder');
  }

  private generateTestDataFixtures(): Promise<Record<string, any>> {
    // Implementation for test data fixtures
    return Promise.resolve({
      'transactions-small.json': [],
      'budget-data.json': {}
    });
  }

  private generateFormPageObject(component: ComponentAnalysis): string {
    return `// Form page object for ${component.componentName}`;
  }

  private generateListPageObject(component: ComponentAnalysis): string {
    return `// List page object for ${component.componentName}`;
  }

  private generateChartPageObject(component: ComponentAnalysis): string {
    return `// Chart page object for ${component.componentName}`;
  }

  private generateMobileFormTest(component: ComponentAnalysis): string {
    return `// Mobile form test for ${component.componentName}`;
  }

  private generateMobileListTest(component: ComponentAnalysis): string {
    return `// Mobile list test for ${component.componentName}`;
  }

  private generateMobileChartTest(component: ComponentAnalysis): string {
    return `// Mobile chart test for ${component.componentName}`;
  }

  private generateChartInteractionTest(): string {
    return `// Chart interaction test implementation`;
  }

  private generateNavigationResponsivenessTest(): string {
    return `// Navigation responsiveness test implementation`;
  }

  private generateFormKeyboardTest(): string {
    return `// Form keyboard test implementation`;
  }

  private generateOfflineFunctionalityTest(): string {
    return `// Offline functionality test implementation`;
  }

  private generateGenericMobileTest(scenario: TestScenario): string {
    return `// Generic mobile test for ${scenario.name}`;
  }
}