# 📱 Clear Piggy Mobile Testing Agent

A comprehensive mobile testing agent for Clear Piggy financial SaaS application that generates and executes mobile-specific tests across multiple frameworks, devices, and scenarios.

## 🎯 Features

### 🔧 Test Generation
- **Cypress Tests**: Mobile viewport scenarios with touch interactions
- **Playwright Tests**: Cross-browser mobile testing with device simulation
- **Accessibility Tests**: WCAG compliance testing with axe-core
- **Visual Regression**: Responsive layout testing across devices
- **Performance Tests**: Mobile network simulation and Web Vitals monitoring
- **Touch Interaction Tests**: Gesture-based testing for mobile interfaces

### 📱 Mobile-Specific Testing
- **Device Simulation**: iPhone, Android, and tablet testing
- **Network Conditions**: 3G, 4G, WiFi, and offline scenarios
- **Touch Gestures**: Tap, swipe, pinch, and pan interactions
- **Mobile Forms**: Keyboard optimization and input validation
- **Responsive Design**: Breakpoint testing and layout validation
- **PWA Testing**: Offline functionality and installation flows

### ♿ Accessibility Testing
- **WCAG Compliance**: A, AA, and AAA level testing
- **Touch Targets**: Minimum size validation (44px)
- **Color Contrast**: Automated contrast ratio checking
- **Keyboard Navigation**: Focus management and tab order
- **Screen Reader**: ARIA label and semantic markup validation
- **Mobile Focus**: Focus indicator visibility on touch devices

### 📊 Performance Testing
- **Web Vitals**: FCP, LCP, FID, CLS, TTFB measurement
- **Scroll Performance**: Frame rate and smoothness testing
- **Load Testing**: Bundle size and resource optimization
- **Network Simulation**: Throttling and offline scenarios
- **Memory Usage**: Mobile device memory constraints

## 🚀 Quick Start

### Installation
```bash
# Install the package
npm install

# Build the project
npm run build

# Initialize mobile testing configuration
npm run test:mobile:init
```

### Basic Usage
```bash
# Generate complete mobile test suite
npm run test:mobile

# Generate specific test types
npm run test:mobile:cypress
npm run test:mobile:playwright
npm run test:mobile:accessibility

# Run tests
npm run test:mobile:run

# Check testing environment
npm run test:mobile:doctor
```

## 📋 CLI Commands

### `generate`
Generate comprehensive mobile test suite.

```bash
clear-piggy-mobile-test generate [options]

Options:
  -c, --config <path>        Configuration file path
  -o, --output <path>        Output directory path
  -f, --frameworks <list>    Test frameworks (cypress, playwright)
  -d, --devices <list>       Mobile devices to test
  --cypress                  Generate Cypress tests only
  --playwright               Generate Playwright tests only
  --accessibility            Generate accessibility tests only
  --performance              Generate performance tests only
  --visual                   Generate visual regression tests only
  --touch                    Generate touch interaction tests only
  --offline                  Include offline functionality tests
  --network-throttling       Include network throttling tests
  --page-objects             Generate page objects
  --test-data                Generate test data fixtures
  --ci-cd                    Setup CI/CD integration
  --parallel                 Enable parallel test execution
  --interactive              Run in interactive mode

Examples:
  clear-piggy-mobile-test generate --interactive
  clear-piggy-mobile-test generate --cypress --accessibility
  clear-piggy-mobile-test generate -d iPhone12,galaxyS21 --parallel
```

### `init`
Initialize mobile testing configuration.

```bash
clear-piggy-mobile-test init [options]

Options:
  --template <template>      Configuration template (basic, comprehensive)

Examples:
  clear-piggy-mobile-test init
  clear-piggy-mobile-test init --template comprehensive
```

### `run`
Execute mobile tests.

```bash
clear-piggy-mobile-test run [options]

Options:
  -f, --framework <framework>  Framework to run (cypress, playwright, all)
  -d, --device <device>        Specific device to test
  -s, --scenario <scenario>    Specific scenario to run
  --headless                   Run tests in headless mode
  --parallel                   Run tests in parallel
  --reporter <reporter>        Test reporter (html, json, junit)

Examples:
  clear-piggy-mobile-test run --framework cypress --device iPhone12
  clear-piggy-mobile-test run --parallel --headless
```

### `doctor`
Diagnose mobile testing environment.

```bash
clear-piggy-mobile-test doctor

Checks:
  ✓ Node.js version
  ✓ Browser installations
  ✓ Testing dependencies
  ✓ Configuration validity
  ✓ Mobile simulator setup
```

## ⚙️ Configuration

### Basic Configuration
```javascript
// mobile-testing.config.js
export default {
  projectPath: './src',
  testOutputPath: './tests',
  componentPaths: ['src/components', 'src/pages'],
  testFrameworks: ['cypress', 'playwright'],
  mobileDevices: [
    {
      name: 'iPhone 12',
      width: 390,
      height: 844,
      pixelRatio: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      touchEnabled: true,
      type: 'phone'
    }
  ],
  accessibilityLevel: 'AA',
  performanceThresholds: {
    firstContentfulPaint: 1800,
    largestContentfulPaint: 2500,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1
  }
};
```

### Advanced Configuration
```javascript
export default {
  // ... basic config
  browsers: [
    { name: 'chrome', headless: true, mobileEmulation: true },
    { name: 'firefox', headless: true, mobileEmulation: true },
    { name: 'safari', headless: true, mobileEmulation: true }
  ],
  networkConditions: [
    {
      name: '3G Slow',
      downloadThroughput: 400 * 1024,
      uploadThroughput: 400 * 1024,
      latency: 400
    }
  ],
  visualRegressionConfig: {
    enabled: true,
    threshold: 0.1,
    baselineDir: './tests/visual/baselines',
    screenshotDir: './tests/visual/screenshots',
    diffDir: './tests/visual/diffs'
  },
  cicdIntegration: {
    provider: 'github-actions',
    parallelization: 4,
    retryAttempts: 2,
    reportFormat: ['html', 'json', 'junit']
  }
};
```

## 📁 Generated Test Structure

```
tests/
├── cypress/
│   ├── e2e/
│   │   ├── mobile/
│   │   │   ├── transaction-list-mobile.cy.js
│   │   │   ├── budget-creation-mobile.cy.js
│   │   │   └── navigation-mobile.cy.js
│   │   ├── scenarios/
│   │   │   ├── mobile-transaction-scrolling.cy.js
│   │   │   ├── mobile-budget-creation.cy.js
│   │   │   └── mobile-chart-interactions.cy.js
│   │   ├── accessibility/
│   │   │   └── mobile-a11y.cy.js
│   │   └── cross-device/
│   │       └── responsive.cy.js
│   ├── support/
│   │   ├── commands.js
│   │   ├── utils.js
│   │   └── pages/
│   │       ├── DashboardPage.js
│   │       ├── TransactionListPage.js
│   │       └── BudgetPage.js
│   └── fixtures/
│       ├── transactions-large.json
│       ├── budget-data.json
│       └── user-data.json
├── playwright/
│   ├── tests/
│   │   ├── mobile/
│   │   ├── scenarios/
│   │   ├── accessibility/
│   │   ├── performance/
│   │   └── visual/
│   ├── fixtures/
│   ├── pages/
│   └── utils/
├── accessibility/
│   ├── axe.config.js
│   ├── mobile-a11y-rules.js
│   └── components/
└── reports/
    ├── html/
    ├── json/
    └── junit/
```

## 🧪 Test Scenarios

### Core Mobile Scenarios

#### 1. Transaction List Scrolling Performance
- **Objective**: Test virtual scrolling performance on mobile devices
- **Devices**: iPhone 12, Galaxy S21, iPad Air
- **Metrics**: FPS, scroll smoothness, infinite scroll loading
- **Duration**: ~3 minutes per device

#### 2. Budget Creation Flow
- **Objective**: Test complete budget creation on mobile
- **Focus**: Form inputs, mobile keyboards, validation, submission
- **Interactions**: Touch inputs, category selection, date picking
- **Duration**: ~2 minutes per scenario

#### 3. Chart Touch Interactions
- **Objective**: Test chart interactions with touch gestures
- **Gestures**: Tap, pinch zoom, pan, swipe
- **Validation**: Chart responsiveness, data accuracy
- **Duration**: ~1.5 minutes per chart

#### 4. Navigation Menu Responsiveness
- **Objective**: Test mobile navigation across breakpoints
- **Elements**: Hamburger menu, bottom navigation, sidebar
- **Validation**: Touch targets, accessibility, transitions
- **Duration**: ~1 minute per breakpoint

#### 5. Form Input Mobile Optimization
- **Objective**: Test mobile-optimized form inputs
- **Validation**: Input modes, keyboards, autocomplete
- **Accessibility**: Labels, focus indicators, error messages
- **Duration**: ~2 minutes per form

#### 6. Offline Functionality
- **Objective**: Test app behavior when offline
- **Features**: Data persistence, sync on reconnect, error handling
- **Validation**: Service worker, cache management, user feedback
- **Duration**: ~4 minutes per scenario

### Accessibility Scenarios

#### 1. WCAG AA Compliance
- **Standards**: WCAG 2.1 Level AA
- **Checks**: Color contrast, focus management, semantic markup
- **Tools**: axe-core, manual verification
- **Coverage**: All interactive elements

#### 2. Touch Target Validation
- **Requirement**: Minimum 44px touch targets
- **Elements**: Buttons, links, form controls, interactive icons
- **Validation**: Size measurement, overlap detection
- **Reports**: Violations with recommendations

#### 3. Keyboard Navigation
- **Focus Management**: Tab order, focus trapping, restoration
- **Indicators**: Visible focus indicators on all interactive elements
- **Shortcuts**: Keyboard shortcuts and accessibility keys
- **Screen Reader**: ARIA labels and descriptions

### Performance Scenarios

#### 1. Web Vitals Monitoring
- **Metrics**: FCP, LCP, FID, CLS, TTFB
- **Thresholds**: Based on Google recommendations
- **Devices**: Multiple mobile devices and network conditions
- **Reporting**: Performance budgets and alerts

#### 2. Network Condition Testing
- **Conditions**: 3G Slow, 3G Fast, 4G, WiFi, Offline
- **Validation**: Load times, error handling, user experience
- **Optimization**: Resource prioritization, compression
- **Fallbacks**: Offline functionality, error states

## 📊 Reporting and Analytics

### Test Reports
- **HTML Reports**: Interactive test results with screenshots
- **JSON Reports**: Machine-readable results for CI/CD
- **JUnit Reports**: Integration with CI/CD systems
- **Allure Reports**: Comprehensive test analytics

### Performance Metrics
- **Web Vitals Dashboard**: Real-time performance monitoring
- **Accessibility Audit**: WCAG compliance tracking
- **Visual Regression**: Layout change detection
- **Mobile Metrics**: Device-specific performance data

### CI/CD Integration

#### GitHub Actions
```yaml
name: Mobile Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  mobile-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        framework: [cypress, playwright]
        device: [iPhone12, galaxyS21, iPadAir]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run mobile tests
      run: npm run test:mobile:run -- --framework ${{ matrix.framework }}
      env:
        DEVICE: ${{ matrix.device }}
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results-${{ matrix.framework }}-${{ matrix.device }}
        path: test-results/
```

## 🔧 Development

### Adding Custom Tests
1. Create component-specific test files
2. Use provided page objects and utilities
3. Follow naming conventions
4. Include accessibility checks
5. Add performance assertions

### Custom Assertions
```javascript
// Cypress custom assertions
cy.checkTouchTargets(44); // Minimum 44px touch targets
cy.checkColorContrast('AA'); // WCAG AA compliance
cy.measureScrollPerformance('[data-testid="list"]');
cy.testMobileFormInputs('[data-testid="form"]');

// Playwright custom assertions
await expect(page.locator('button')).toHaveTouchTargetSize(44);
await expect(page).toPassA11yCheck();
await expect(page).toMeetPerformanceThresholds();
```

### Page Objects
```javascript
// Example page object usage
const transactionListPage = new TransactionListPage(page);
await transactionListPage.navigate();
await transactionListPage.testInfiniteScroll();
await transactionListPage.testVirtualScrolling();
await transactionListPage.verifyAccessibility();
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Tests Failing on Mobile Devices
- **Check viewport settings**: Ensure correct device dimensions
- **Verify touch events**: Use proper touch event simulation
- **Network timing**: Adjust timeouts for mobile networks
- **Element visibility**: Check responsive layout changes

#### 2. Accessibility Test Failures
- **Update axe-core**: Ensure latest version for accurate results
- **Check custom rules**: Verify mobile-specific accessibility rules
- **Color contrast**: Test in different themes and conditions
- **Focus indicators**: Ensure visible focus on all interactive elements

#### 3. Performance Test Inconsistencies
- **Network conditions**: Stabilize network throttling
- **Resource loading**: Check for external dependencies
- **Memory constraints**: Monitor memory usage on mobile devices
- **Background processes**: Minimize system load during testing

#### 4. Cross-Browser Differences
- **User agents**: Verify correct mobile user agents
- **Feature support**: Check browser compatibility
- **Rendering differences**: Account for browser-specific behaviors
- **Touch simulation**: Ensure proper touch event handling

### Debug Mode
```bash
# Run tests with debug information
DEBUG=1 npm run test:mobile:run

# Generate verbose reports
npm run test:mobile:run --reporter verbose

# Check environment setup
npm run test:mobile:doctor
```

## 📚 Best Practices

### 1. Test Organization
- Group tests by functionality, not by page
- Use descriptive test names and descriptions
- Implement proper setup and teardown
- Maintain test data consistency

### 2. Mobile-Specific Considerations
- Test on actual devices when possible
- Use realistic network conditions
- Account for touch input differences
- Consider mobile-specific user patterns

### 3. Performance Testing
- Set realistic performance budgets
- Test under various network conditions
- Monitor memory usage on mobile devices
- Use performance baselines for comparison

### 4. Accessibility Testing
- Test with actual assistive technologies
- Include users with disabilities in testing
- Validate keyboard navigation thoroughly
- Check color contrast in different lighting

### 5. Maintenance
- Update device profiles regularly
- Review and update performance thresholds
- Maintain test data freshness
- Monitor test execution times

## 🤝 Contributing

### Adding New Test Scenarios
1. Create scenario definition in types
2. Implement test generator methods
3. Add CLI options if needed
4. Update documentation
5. Include example tests

### Extending Device Support
1. Add device configuration to types
2. Update mobile device constants
3. Test on actual device if possible
4. Verify touch event compatibility
5. Update documentation

### Framework Integration
1. Implement framework-specific generator
2. Add configuration options
3. Create utilities and helpers
4. Write example tests
5. Update CLI interface

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Clear Piggy Team** - For the amazing financial application
- **Cypress Team** - For excellent E2E testing framework
- **Playwright Team** - For powerful cross-browser testing
- **axe-core Team** - For accessibility testing standards
- **Web Platform Tests** - For mobile testing best practices

---

**Generated by Clear Piggy Mobile Testing Agent** 📱🧪

For support and issues, please visit our [GitHub repository](https://github.com/clear-piggy/mobile-optimizer).