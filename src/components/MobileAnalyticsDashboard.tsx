import React, { useState, useEffect, useMemo } from 'react';
import { 
  DashboardConfig, 
  WebVitalEntry, 
  ErrorEntry, 
  PerformanceEntry, 
  UserInteractionEntry,
  AlertEntry 
} from '../types/analytics-types';

interface DashboardProps {
  config: DashboardConfig;
  onRefresh?: () => void;
  className?: string;
}

interface DashboardData {
  webVitals: WebVitalEntry[];
  errors: ErrorEntry[];
  performance: PerformanceEntry[];
  interactions: UserInteractionEntry[];
  alerts: AlertEntry[];
  sessions: any[];
  timestamp: Date;
}

export const MobileAnalyticsDashboard: React.FC<DashboardProps> = ({
  config,
  onRefresh,
  className = ''
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, config.refreshInterval || 30000);
    return () => clearInterval(interval);
  }, [config, selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardData(selectedTimeRange);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (timeRange: string): Promise<DashboardData> => {
    const mockData: DashboardData = {
      webVitals: generateMockWebVitals(),
      errors: generateMockErrors(),
      performance: generateMockPerformance(),
      interactions: generateMockInteractions(),
      alerts: generateMockAlerts(),
      sessions: generateMockSessions(),
      timestamp: new Date()
    };
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockData;
  };

  const webVitalsStats = useMemo(() => {
    if (!dashboardData?.webVitals) return null;

    const stats = dashboardData.webVitals.reduce((acc, vital) => {
      if (!acc[vital.metric_name]) {
        acc[vital.metric_name] = { good: 0, needsImprovement: 0, poor: 0, total: 0 };
      }
      acc[vital.metric_name][vital.rating === 'good' ? 'good' : 
                            vital.rating === 'needs-improvement' ? 'needsImprovement' : 'poor']++;
      acc[vital.metric_name].total++;
      return acc;
    }, {} as any);

    return stats;
  }, [dashboardData?.webVitals]);

  const errorStats = useMemo(() => {
    if (!dashboardData?.errors) return null;

    return {
      total: dashboardData.errors.length,
      critical: dashboardData.errors.filter(e => e.severity === 'critical').length,
      high: dashboardData.errors.filter(e => e.severity === 'high').length,
      medium: dashboardData.errors.filter(e => e.severity === 'medium').length,
      byType: dashboardData.errors.reduce((acc, error) => {
        acc[error.error_type] = (acc[error.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [dashboardData?.errors]);

  if (loading && !dashboardData) {
    return (
      <div className={`mobile-analytics-dashboard loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mobile-analytics-dashboard error ${className}`}>
        <div className="error-message">
          <h3>Dashboard Error</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-analytics-dashboard ${className}`}>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>📱 Mobile Analytics Dashboard</h1>
          <p>Real-time monitoring for Clear Piggy mobile performance</p>
        </div>
        
        <div className="dashboard-controls">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button onClick={onRefresh || loadDashboardData} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="dashboard-metrics">
        <div className="metric-tabs">
          {config.widgets?.map(widget => (
            <button
              key={widget.id}
              className={`metric-tab ${selectedMetric === widget.id ? 'active' : ''}`}
              onClick={() => setSelectedMetric(widget.id)}
            >
              {widget.title}
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {selectedMetric === 'overview' && (
            <OverviewWidget 
              webVitalsStats={webVitalsStats} 
              errorStats={errorStats}
              dashboardData={dashboardData}
            />
          )}
          
          {selectedMetric === 'web-vitals' && (
            <WebVitalsWidget 
              webVitals={dashboardData?.webVitals || []}
              stats={webVitalsStats}
            />
          )}
          
          {selectedMetric === 'errors' && (
            <ErrorsWidget 
              errors={dashboardData?.errors || []}
              stats={errorStats}
            />
          )}
          
          {selectedMetric === 'performance' && (
            <PerformanceWidget 
              performance={dashboardData?.performance || []}
            />
          )}
          
          {selectedMetric === 'interactions' && (
            <InteractionsWidget 
              interactions={dashboardData?.interactions || []}
            />
          )}
          
          {selectedMetric === 'alerts' && (
            <AlertsWidget 
              alerts={dashboardData?.alerts || []}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .mobile-analytics-dashboard {
          background: #f8fafc;
          min-height: 100vh;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .dashboard-title h1 {
          margin: 0;
          color: #1a365d;
          font-size: 28px;
        }

        .dashboard-title p {
          margin: 5px 0 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .dashboard-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .time-range-selector {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }

        .refresh-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .refresh-button:hover {
          background: #2563eb;
        }

        .metric-tabs {
          display: flex;
          background: white;
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .metric-tab {
          flex: 1;
          padding: 12px 20px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .metric-tab:hover {
          background: #f1f5f9;
        }

        .metric-tab.active {
          background: #3b82f6;
          color: white;
        }

        .dashboard-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          padding: 40px;
        }

        .error-message h3 {
          color: #dc2626;
          margin-bottom: 8px;
        }

        .error-message button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};

const OverviewWidget: React.FC<any> = ({ webVitalsStats, errorStats, dashboardData }) => (
  <div className="overview-widget">
    <div className="overview-cards">
      <div className="overview-card">
        <h3>📊 Web Vitals</h3>
        <div className="metric-summary">
          {webVitalsStats && Object.entries(webVitalsStats).map(([metric, stats]: [string, any]) => (
            <div key={metric} className="metric-row">
              <span className="metric-name">{metric}</span>
              <div className="metric-bars">
                <div className="bar good" style={{ width: `${(stats.good / stats.total) * 100}%` }} />
                <div className="bar needs-improvement" style={{ width: `${(stats.needsImprovement / stats.total) * 100}%` }} />
                <div className="bar poor" style={{ width: `${(stats.poor / stats.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overview-card">
        <h3>🚨 Errors</h3>
        <div className="error-summary">
          <div className="error-count critical">{errorStats?.critical || 0} Critical</div>
          <div className="error-count high">{errorStats?.high || 0} High</div>
          <div className="error-count medium">{errorStats?.medium || 0} Medium</div>
          <div className="total-errors">Total: {errorStats?.total || 0}</div>
        </div>
      </div>

      <div className="overview-card">
        <h3>👥 Sessions</h3>
        <div className="session-summary">
          <div className="session-stat">
            <span className="stat-value">{dashboardData?.sessions?.length || 0}</span>
            <span className="stat-label">Active Sessions</span>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .overview-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .overview-card {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .overview-card h3 {
        margin: 0 0 16px 0;
        color: #1a365d;
        font-size: 18px;
      }

      .metric-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .metric-name {
        font-weight: 500;
        min-width: 80px;
      }

      .metric-bars {
        flex: 1;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        margin-left: 12px;
      }

      .bar {
        height: 100%;
      }

      .bar.good { background: #10b981; }
      .bar.needs-improvement { background: #f59e0b; }
      .bar.poor { background: #ef4444; }

      .error-count {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        margin: 2px 0;
        font-weight: 500;
      }

      .error-count.critical { background: #fecaca; color: #991b1b; }
      .error-count.high { background: #fed7aa; color: #9a3412; }
      .error-count.medium { background: #fef3c7; color: #92400e; }

      .total-errors {
        margin-top: 8px;
        font-weight: 600;
        color: #374151;
      }

      .session-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #3b82f6;
      }

      .stat-label {
        font-size: 14px;
        color: #64748b;
      }
    `}</style>
  </div>
);

const WebVitalsWidget: React.FC<{ webVitals: WebVitalEntry[]; stats: any }> = ({ webVitals, stats }) => (
  <div className="web-vitals-widget">
    <h2>📊 Core Web Vitals</h2>
    <div className="vitals-grid">
      {stats && Object.entries(stats).map(([metric, data]: [string, any]) => (
        <div key={metric} className="vital-card">
          <h3>{metric}</h3>
          <div className="vital-score">
            <div className={`score-circle ${data.good > data.poor ? 'good' : 'poor'}`}>
              {Math.round((data.good / data.total) * 100)}%
            </div>
          </div>
          <div className="vital-breakdown">
            <span className="good">Good: {data.good}</span>
            <span className="needs-improvement">Needs Improvement: {data.needsImprovement}</span>
            <span className="poor">Poor: {data.poor}</span>
          </div>
        </div>
      ))}
    </div>

    <style jsx>{`
      .vitals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .vital-card {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        text-align: center;
      }

      .vital-score {
        margin: 16px 0;
      }

      .score-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        font-size: 18px;
        font-weight: 700;
        color: white;
      }

      .score-circle.good { background: #10b981; }
      .score-circle.poor { background: #ef4444; }

      .vital-breakdown {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
      }

      .vital-breakdown .good { color: #10b981; }
      .vital-breakdown .needs-improvement { color: #f59e0b; }
      .vital-breakdown .poor { color: #ef4444; }
    `}</style>
  </div>
);

const ErrorsWidget: React.FC<{ errors: ErrorEntry[]; stats: any }> = ({ errors, stats }) => (
  <div className="errors-widget">
    <h2>🚨 Error Monitoring</h2>
    <div className="error-overview">
      <div className="error-stats">
        <div className="stat-item critical">
          <span className="count">{stats?.critical || 0}</span>
          <span className="label">Critical</span>
        </div>
        <div className="stat-item high">
          <span className="count">{stats?.high || 0}</span>
          <span className="label">High</span>
        </div>
        <div className="stat-item medium">
          <span className="count">{stats?.medium || 0}</span>
          <span className="label">Medium</span>
        </div>
      </div>
    </div>
    
    <div className="recent-errors">
      <h3>Recent Errors</h3>
      {errors.slice(0, 5).map(error => (
        <div key={error.id} className="error-item">
          <div className="error-header">
            <span className={`error-severity ${error.severity}`}>{error.severity}</span>
            <span className="error-type">{error.error_type}</span>
            <span className="error-time">{new Date(error.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="error-message">{error.message}</div>
        </div>
      ))}
    </div>

    <style jsx>{`
      .error-stats {
        display: flex;
        gap: 20px;
        margin: 20px 0;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        border-radius: 8px;
        min-width: 100px;
      }

      .stat-item.critical { background: #fecaca; }
      .stat-item.high { background: #fed7aa; }
      .stat-item.medium { background: #fef3c7; }

      .stat-item .count {
        font-size: 24px;
        font-weight: 700;
      }

      .stat-item .label {
        font-size: 12px;
        text-transform: uppercase;
        margin-top: 4px;
      }

      .recent-errors {
        margin-top: 30px;
      }

      .error-item {
        background: #f8fafc;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid #ef4444;
        margin-bottom: 8px;
      }

      .error-header {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 4px;
      }

      .error-severity {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 600;
      }

      .error-severity.critical { background: #dc2626; color: white; }
      .error-severity.high { background: #ea580c; color: white; }
      .error-severity.medium { background: #d97706; color: white; }

      .error-type {
        background: #e5e7eb;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
      }

      .error-time {
        font-size: 11px;
        color: #6b7280;
        margin-left: auto;
      }

      .error-message {
        font-size: 13px;
        color: #374151;
        font-family: monospace;
      }
    `}</style>
  </div>
);

const PerformanceWidget: React.FC<{ performance: PerformanceEntry[] }> = ({ performance }) => (
  <div className="performance-widget">
    <h2>⚡ Performance Metrics</h2>
    <p>Performance monitoring data will be displayed here.</p>
  </div>
);

const InteractionsWidget: React.FC<{ interactions: UserInteractionEntry[] }> = ({ interactions }) => (
  <div className="interactions-widget">
    <h2>🖱️ User Interactions</h2>
    <p>User interaction analytics will be displayed here.</p>
  </div>
);

const AlertsWidget: React.FC<{ alerts: AlertEntry[] }> = ({ alerts }) => (
  <div className="alerts-widget">
    <h2>🔔 Active Alerts</h2>
    <p>Alert management interface will be displayed here.</p>
  </div>
);

// Mock data generators
const generateMockWebVitals = (): WebVitalEntry[] => {
  const metrics = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP'] as const;
  const ratings = ['good', 'needs-improvement', 'poor'] as const;
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `vital_${i}`,
    session_id: `session_${Math.floor(i / 10)}`,
    user_id: `user_${Math.floor(i / 5)}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000),
    page_url: 'https://clear-piggy.com',
    metric_name: metrics[Math.floor(Math.random() * metrics.length)],
    value: Math.random() * 3000,
    rating: ratings[Math.floor(Math.random() * ratings.length)],
    device_info: {} as any,
    network_info: {} as any
  }));
};

const generateMockErrors = (): ErrorEntry[] => {
  const errorTypes = ['javascript', 'network', 'resource', 'console'];
  const severities = ['low', 'medium', 'high', 'critical'] as const;
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `error_${i}`,
    session_id: `session_${Math.floor(i / 4)}`,
    user_id: `user_${Math.floor(i / 2)}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000),
    page_url: 'https://clear-piggy.com',
    user_agent: 'Mock User Agent',
    error_type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
    message: `Mock error message ${i}`,
    source: 'mock',
    device_info: {} as any,
    severity: severities[Math.floor(Math.random() * severities.length)],
    fingerprint: `error_${i % 5}`,
    properties: {}
  }));
};

const generateMockPerformance = (): PerformanceEntry[] => {
  return [];
};

const generateMockInteractions = (): UserInteractionEntry[] => {
  return [];
};

const generateMockAlerts = (): AlertEntry[] => {
  return [];
};

const generateMockSessions = (): any[] => {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `session_${i}`,
    startTime: new Date(Date.now() - Math.random() * 86400000)
  }));
};

export default MobileAnalyticsDashboard;