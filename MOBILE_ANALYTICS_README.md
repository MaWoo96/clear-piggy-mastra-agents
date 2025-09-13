# Clear Piggy Mobile Analytics & Performance Monitoring

A comprehensive mobile analytics and performance monitoring system built specifically for Clear Piggy's mobile application. This system provides real-time tracking of Core Web Vitals, user interactions, financial metrics, A/B testing, error monitoring, and automated performance alerts.

## 🚀 Features

### Core Web Vitals Tracking
- **FCP (First Contentful Paint)** - Measures loading performance
- **LCP (Largest Contentful Paint)** - Measures loading performance  
- **FID (First Input Delay)** - Measures interactivity
- **CLS (Cumulative Layout Shift)** - Measures visual stability
- **TTFB (Time to First Byte)** - Measures server response time
- **INP (Interaction to Next Paint)** - Measures responsiveness

### User Interaction Analytics
- Click and touch tracking with heatmaps
- Scroll depth monitoring
- Form interaction analytics
- Mobile-specific gesture tracking
- User engagement metrics

### Financial Metrics Tracking
- Transaction completion rates
- Budget creation success rates
- Goal achievement tracking
- Subscription event monitoring
- Revenue analytics
- Conversion funnel analysis

### A/B Testing Framework
- Sticky user assignment
- Traffic allocation control
- Goal tracking and conversion measurement
- Real-time statistical analysis

### Error Tracking & Monitoring
- JavaScript error capture
- Network error monitoring
- Resource loading failures
- Console error tracking
- Unhandled promise rejections

### Performance Monitoring
- Resource timing analysis
- Navigation timing metrics
- Memory usage tracking
- FPS monitoring
- Battery usage tracking (where supported)
- Custom performance metrics

### Real User Monitoring (RUM)
- Page load time tracking
- Time to interactive measurement
- Viewport metrics
- Long task detection
- User engagement analytics

### Automated Alerting
- Performance threshold monitoring
- Error rate alerts
- Budget violation notifications
- Multiple notification channels (Slack, email, webhooks)

### Performance Budgets
- Web Vitals budgets
- Resource size limits
- Bundle size monitoring
- Page weight tracking
- Custom metric budgets

## 📦 Installation

```bash
npm install @clear-piggy/mobile-analytics
```

## 🛠️ Quick Start

### Basic Setup

```typescript
import { initializeMobileAnalytics, getClearPiggyConfig } from '@clear-piggy/mobile-analytics';

// Initialize with Clear Piggy configuration
const config = getClearPiggyConfig('production');
const analytics = await initializeMobileAnalytics(config, 'user-123');

// Track a simple event
analytics.trackEvent('app_launched', {
  platform: 'mobile',
  version: '1.0.0'
});
```

### React Integration

```typescript
import { useAnalytics } from '@clear-piggy/mobile-analytics';

function App() {
  const { analytics, isLoading, error } = useAnalytics();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const handleTransaction = (amount: number, category: string) => {
    analytics.trackTransaction(amount, 'expense', category);
  };

  return <TransactionForm onSubmit={handleTransaction} />;
}
```

## 📊 Usage Examples

### Financial Event Tracking

```typescript
const analytics = getMobileAnalytics();

// Track transaction completion
analytics.trackTransaction(25.99, 'expense', 'groceries');

// Track budget creation
analytics.trackBudgetCreation(500, 'dining', 'monthly');

// Track goal completion
analytics.trackGoalCompletion('savings', 1000, 1000);

// Track subscription events
analytics.trackSubscription('upgrade', 'premium-monthly', 9.99);
```

### A/B Testing

```typescript
// Get user's test variation
const variation = analytics.getABTestVariation('budget_creation_flow');

if (variation === 'simplified') {
  // Show simplified UI
  renderSimplifiedBudgetForm();
} else {
  // Show original UI
  renderOriginalBudgetForm();
}

// Track conversion
analytics.trackABTestConversion('budget_creation_flow', 'budget_created');
```

### Conversion Funnel Tracking

```typescript
// Track user journey through transaction creation
analytics.trackConversionFunnel('transaction', 'started', {
  source: 'quick-add-button'
});

analytics.trackConversionFunnel('transaction', 'attempted', {
  amount: 25.99,
  category: 'groceries'
});

analytics.trackConversionFunnel('transaction', 'completed', {
  success: true
});
```

### Performance Monitoring

```typescript
// Monitor API performance
analytics.measureCustomMetric('api_call', () => {
  return fetch('/api/transactions').then(response => response.json());
});

// Track custom performance events
analytics.trackEvent('page_load_performance', {
  loadTime: performance.now(),
  memoryUsage: performance.memory?.usedJSHeapSize || 0
});
```

### Error Tracking

```typescript
try {
  await processTransaction(transactionData);
} catch (error) {
  analytics.trackCustomError(error, {
    operation: 'processTransaction',
    transactionData,
    userId: getCurrentUser().id
  });
}
```

## 🔧 Configuration

### Environment-specific Configuration

```typescript
import { getClearPiggyConfig } from '@clear-piggy/mobile-analytics';

// Development configuration
const devConfig = getClearPiggyConfig('development');

// Production configuration  
const prodConfig = getClearPiggyConfig('production');

// Custom configuration
const customConfig = {
  ...getClearPiggyConfig(),
  webVitals: {
    enabled: true,
    sampleRate: 0.1 // Sample 10% of users
  },
  alerts: {
    enabled: true,
    channels: [
      {
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        }
      }
    ]
  }
};
```

### Performance Budgets

```typescript
const config = {
  performanceBudgets: {
    enabled: true,
    webVitalBudgets: {
      FCP: 1800,  // 1.8 seconds
      LCP: 2500,  // 2.5 seconds
      FID: 100,   // 100ms
      CLS: 0.1    // 0.1 score
    },
    resourceBudgets: {
      image_size: 500000,  // 500KB
      script_size: 200000, // 200KB
      image_time: 2000     // 2 seconds
    }
  }
};
```

## 📈 Dashboard & Reporting

### Built-in Dashboard Component

```typescript
import { MobileAnalyticsDashboard } from '@clear-piggy/mobile-analytics';

function AnalyticsPage() {
  const config = {
    refreshInterval: 30000,
    widgets: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'web-vitals', title: 'Web Vitals', enabled: true },
      { id: 'errors', title: 'Errors', enabled: true },
      { id: 'financial', title: 'Financial Metrics', enabled: true }
    ]
  };

  return (
    <MobileAnalyticsDashboard 
      config={config}
      onRefresh={() => console.log('Dashboard refreshed')}
    />
  );
}
```

### Getting Analytics Data

```typescript
// Get dashboard data
const dashboardData = await analytics.getDashboardData();

// Get performance budget report
const budgetReport = analytics.getPerformanceBudgetReport();

// Get financial summary
const financialSummary = analytics.getFinancialSummary();

// Get funnel analysis
const funnelData = analytics.getFunnelAnalysis('transaction');
```

## 🔔 Alerting & Monitoring

### Alert Configuration

```typescript
const alertConfig = {
  enabled: true,
  thresholds: {
    webVitals: {
      LCP: { warning: 2500, critical: 4000 }
    },
    errors: {
      criticalCount: 20
    }
  },
  channels: [
    {
      type: 'slack',
      config: {
        webhookUrl: 'https://hooks.slack.com/...',
        channel: '#alerts'
      }
    },
    {
      type: 'webhook',
      config: {
        url: 'https://api.example.com/alerts',
        headers: { 'Authorization': 'Bearer token' }
      }
    }
  ]
};
```

### Alert Event Listeners

```typescript
analytics.on('alert', (alert) => {
  console.log('Alert triggered:', alert);
  
  if (alert.severity === 'critical') {
    // Handle critical alerts immediately
    handleCriticalAlert(alert);
  }
});
```

## 🔐 Data Privacy & Security

- **User Data Protection**: All personal data is encrypted and anonymized where possible
- **GDPR Compliant**: Built-in consent management and data deletion capabilities  
- **Secure Transmission**: All data transmitted via HTTPS with TLS 1.3
- **Data Retention**: Configurable data retention policies
- **Local Storage**: Minimal local storage with automatic cleanup

## 🚀 Performance Impact

The analytics SDK is designed to have minimal performance impact:

- **Bundle Size**: ~45KB gzipped
- **Runtime Overhead**: <1% CPU usage
- **Memory Usage**: <10MB typical usage
- **Network**: Batched requests, ~5KB/minute typical traffic
- **Battery Impact**: Negligible on mobile devices

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/clear-piggy/mobile-analytics
cd mobile-analytics
npm install
npm run build
```

### Running Tests

```bash
npm run test
npm run test:integration
npm run test:e2e
```

### Development Server

```bash
npm run dev
```

## 📚 API Reference

### Core SDK Methods

- `trackEvent(eventName, properties)` - Track custom events
- `trackTransaction(amount, type, category)` - Track financial transactions
- `trackBudgetCreation(amount, category, timeframe)` - Track budget creation
- `trackGoalCompletion(type, target, achieved)` - Track goal achievements
- `trackSubscription(event, plan, amount)` - Track subscription events
- `getABTestVariation(testName)` - Get A/B test variation
- `trackConversionFunnel(funnel, step, properties)` - Track funnel steps
- `getDashboardData()` - Get analytics dashboard data
- `destroy()` - Clean up and destroy SDK instance

### Event Types

- **Web Vitals**: `web_vital_captured`, `core_web_vitals_complete`
- **User Interactions**: `click`, `touch`, `scroll`, `form_interaction`
- **Financial Events**: `transaction_completed`, `budget_created`, `goal_achieved`
- **Errors**: `javascript_error`, `network_error`, `custom_error`
- **Performance**: `performance_metric`, `budget_violation`
- **A/B Testing**: `test_assignment`, `test_conversion`

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.clear-piggy.com/analytics](https://docs.clear-piggy.com/analytics)
- **Issues**: [GitHub Issues](https://github.com/clear-piggy/mobile-analytics/issues)
- **Email Support**: analytics@clear-piggy.com
- **Slack Channel**: #analytics in Clear Piggy workspace

## 🗺️ Roadmap

### Q1 2024
- [ ] Machine learning-powered anomaly detection
- [ ] Advanced user segmentation
- [ ] Cross-platform analytics (iOS/Android native)

### Q2 2024  
- [ ] Predictive analytics for financial goals
- [ ] Advanced visualization components
- [ ] Real-time collaboration features

### Q3 2024
- [ ] AI-powered insights and recommendations
- [ ] Advanced privacy controls
- [ ] Custom metric builder UI

---

Built with ❤️ for Clear Piggy users to provide the best mobile financial management experience.