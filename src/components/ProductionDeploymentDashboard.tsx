import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProductionDeploymentConfig,
  DeploymentResult,
  DeploymentMetrics,
  FeatureFlag
} from '../types/deployment-types';

interface DeploymentDashboardProps {
  config: ProductionDeploymentConfig;
  deploymentAgent: any;
  onRefresh?: () => void;
  className?: string;
}

interface DashboardState {
  deployments: DeploymentInfo[];
  currentMetrics: DeploymentMetrics | null;
  featureFlags: FeatureFlag[];
  alerts: AlertInfo[];
  rollbackHistory: RollbackInfo[];
  loading: boolean;
  error: string | null;
  selectedTab: string;
}

interface DeploymentInfo {
  id: string;
  version: string;
  status: 'active' | 'completed' | 'failed' | 'rolling_back';
  startTime: Date;
  endTime?: Date;
  progress: number;
  metrics: DeploymentMetrics;
  featureFlags: string[];
}

interface AlertInfo {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface RollbackInfo {
  id: string;
  deploymentId: string;
  reason: string;
  status: 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
}

export const ProductionDeploymentDashboard: React.FC<DeploymentDashboardProps> = ({
  config,
  deploymentAgent,
  onRefresh,
  className = ''
}) => {
  const [state, setState] = useState<DashboardState>({
    deployments: [],
    currentMetrics: null,
    featureFlags: [],
    alerts: [],
    rollbackHistory: [],
    loading: true,
    error: null,
    selectedTab: 'overview'
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [deploymentAgent]);

  const loadDashboardData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [deployments, metrics, flags, alerts, rollbacks] = await Promise.all([
        deploymentAgent?.getAllDeployments() || [],
        deploymentAgent?.getCurrentMetrics() || null,
        deploymentAgent?.featureFlagManager?.getAllFlags() || [],
        deploymentAgent?.deploymentMonitor?.getActiveAlerts() || [],
        deploymentAgent?.rollbackManager?.getRollbackHistory() || []
      ]);

      setState(prev => ({
        ...prev,
        deployments: deployments.map(transformDeploymentData),
        currentMetrics: metrics,
        featureFlags: flags,
        alerts: alerts.map(transformAlertData),
        rollbackHistory: rollbacks.map(transformRollbackData),
        loading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
        loading: false
      }));
    }
  };

  const transformDeploymentData = (deployment: any): DeploymentInfo => ({
    id: deployment.deploymentId || deployment.id,
    version: deployment.version,
    status: deployment.status,
    startTime: new Date(deployment.startTime),
    endTime: deployment.endTime ? new Date(deployment.endTime) : undefined,
    progress: calculateDeploymentProgress(deployment),
    metrics: deployment.metrics || generateMockMetrics(),
    featureFlags: deployment.featureFlags || []
  });

  const transformAlertData = (alert: any): AlertInfo => ({
    id: alert.id || `alert_${Date.now()}`,
    type: alert.type || alert.alertType,
    severity: alert.severity,
    message: alert.message,
    timestamp: new Date(alert.timestamp),
    resolved: alert.resolved || false
  });

  const transformRollbackData = (rollback: any): RollbackInfo => ({
    id: rollback.rollbackId || rollback.id,
    deploymentId: rollback.deploymentId,
    reason: rollback.reason,
    status: rollback.status,
    timestamp: new Date(rollback.startTime || rollback.timestamp)
  });

  const calculateDeploymentProgress = (deployment: any): number => {
    if (deployment.status === 'completed') return 100;
    if (deployment.status === 'failed') return 0;
    
    // Calculate based on canary progression
    const currentTraffic = deployment.trafficPercentage || 0;
    return Math.min(currentTraffic, 100);
  };

  const generateMockMetrics = (): DeploymentMetrics => ({
    errorRate: Math.random() * 2,
    responseTime: 200 + Math.random() * 300,
    throughput: 500 + Math.random() * 1000,
    availability: 99 + Math.random() * 1,
    performance: {
      webVitals: {
        fcp: 800 + Math.random() * 1000,
        lcp: 1500 + Math.random() * 1000,
        fid: 50 + Math.random() * 100,
        cls: Math.random() * 0.2,
        ttfb: 200 + Math.random() * 600,
        inp: 100 + Math.random() * 400
      },
      resources: {
        cpu: 30 + Math.random() * 40,
        memory: 256 + Math.random() * 512,
        disk: 40 + Math.random() * 30,
        network: 10 + Math.random() * 90
      },
      mobile: {
        batteryUsage: 5 + Math.random() * 15,
        dataUsage: 1 + Math.random() * 5,
        loadTime: 1000 + Math.random() * 2000,
        crashRate: Math.random() * 1
      }
    },
    business: {
      conversionRate: 0.8 + Math.random() * 0.2,
      revenue: 1000 + Math.random() * 5000,
      userEngagement: 0.6 + Math.random() * 0.4,
      retention: 0.7 + Math.random() * 0.3
    },
    customMetrics: {}
  });

  const activeDeployment = useMemo(() => {
    return state.deployments.find(d => d.status === 'active');
  }, [state.deployments]);

  const criticalAlerts = useMemo(() => {
    return state.alerts.filter(a => a.severity === 'critical' && !a.resolved);
  }, [state.alerts]);

  const handleStartDeployment = async () => {
    try {
      const version = `v${Date.now()}`;
      const features = ['mobile_optimization', 'performance_improvements'];
      
      await deploymentAgent?.startProgressiveRollout(version, features, {
        initialPercentage: 5,
        incrementInterval: 10,
        maxDuration: 60
      });
      
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to start deployment:', error);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    try {
      await deploymentAgent?.triggerRollback(deploymentId, 'manual_rollback');
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to trigger rollback:', error);
    }
  };

  const handlePauseDeployment = async (deploymentId: string) => {
    try {
      await deploymentAgent?.pauseDeployment(deploymentId);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to pause deployment:', error);
    }
  };

  if (state.loading && state.deployments.length === 0) {
    return (
      <div className={`deployment-dashboard loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading deployment dashboard...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`deployment-dashboard error ${className}`}>
        <div className="error-message">
          <h3>Dashboard Error</h3>
          <p>{state.error}</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`deployment-dashboard ${className}`}>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>🚀 Production Deployment Dashboard</h1>
          <p>Clear Piggy Mobile Optimization Deployment Management</p>
        </div>
        
        <div className="dashboard-controls">
          <div className="status-indicators">
            {criticalAlerts.length > 0 && (
              <div className="alert-indicator critical">
                🚨 {criticalAlerts.length} Critical Alerts
              </div>
            )}
            {activeDeployment && (
              <div className="deployment-indicator active">
                ⚡ Active Deployment: {activeDeployment.version}
              </div>
            )}
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={onRefresh || loadDashboardData} 
              className="refresh-button"
              disabled={state.loading}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={handleStartDeployment} 
              className="deploy-button"
              disabled={!!activeDeployment}
            >
              🚀 Start Deployment
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        {['overview', 'deployments', 'feature-flags', 'performance', 'alerts', 'rollbacks'].map(tab => (
          <button
            key={tab}
            className={`tab ${state.selectedTab === tab ? 'active' : ''}`}
            onClick={() => setState(prev => ({ ...prev, selectedTab: tab }))}
          >
            {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {state.selectedTab === 'overview' && (
          <OverviewTab 
            activeDeployment={activeDeployment}
            currentMetrics={state.currentMetrics}
            alerts={state.alerts}
            config={config}
          />
        )}
        
        {state.selectedTab === 'deployments' && (
          <DeploymentsTab 
            deployments={state.deployments}
            onRollback={handleRollback}
            onPause={handlePauseDeployment}
          />
        )}
        
        {state.selectedTab === 'feature-flags' && (
          <FeatureFlagsTab 
            flags={state.featureFlags}
            deploymentAgent={deploymentAgent}
          />
        )}
        
        {state.selectedTab === 'performance' && (
          <PerformanceTab 
            metrics={state.currentMetrics}
            deployments={state.deployments}
          />
        )}
        
        {state.selectedTab === 'alerts' && (
          <AlertsTab 
            alerts={state.alerts}
            deploymentAgent={deploymentAgent}
          />
        )}
        
        {state.selectedTab === 'rollbacks' && (
          <RollbacksTab 
            rollbacks={state.rollbackHistory}
            deploymentAgent={deploymentAgent}
          />
        )}
      </div>

      <style jsx>{`
        .deployment-dashboard {
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
          flex-direction: column;
          gap: 10px;
          align-items: flex-end;
        }

        .status-indicators {
          display: flex;
          gap: 10px;
        }

        .alert-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .alert-indicator.critical {
          background: #fee2e2;
          color: #991b1b;
        }

        .deployment-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          background: #dbeafe;
          color: #1e40af;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .refresh-button, .deploy-button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .refresh-button {
          background: #e5e7eb;
          color: #374151;
        }

        .refresh-button:hover {
          background: #d1d5db;
        }

        .deploy-button {
          background: #10b981;
          color: white;
        }

        .deploy-button:hover:not(:disabled) {
          background: #059669;
        }

        .deploy-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .dashboard-tabs {
          display: flex;
          background: white;
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .tab {
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

        .tab:hover {
          background: #f1f5f9;
        }

        .tab.active {
          background: #3b82f6;
          color: white;
        }

        .dashboard-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          min-height: 600px;
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

// Tab Components
const OverviewTab: React.FC<{
  activeDeployment: DeploymentInfo | undefined;
  currentMetrics: DeploymentMetrics | null;
  alerts: AlertInfo[];
  config: ProductionDeploymentConfig;
}> = ({ activeDeployment, currentMetrics, alerts, config }) => (
  <div className="overview-tab">
    <div className="overview-grid">
      <div className="overview-card">
        <h3>🚀 Active Deployment</h3>
        {activeDeployment ? (
          <div className="deployment-info">
            <div className="deployment-version">{activeDeployment.version}</div>
            <div className="deployment-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${activeDeployment.progress}%` }}
                />
              </div>
              <span>{activeDeployment.progress}% complete</span>
            </div>
            <div className="deployment-status">{activeDeployment.status}</div>
          </div>
        ) : (
          <div className="no-deployment">No active deployment</div>
        )}
      </div>

      <div className="overview-card">
        <h3>📊 Performance Metrics</h3>
        {currentMetrics ? (
          <div className="metrics-summary">
            <div className="metric">
              <span className="metric-label">Error Rate</span>
              <span className={`metric-value ${currentMetrics.errorRate > 2 ? 'warning' : 'good'}`}>
                {currentMetrics.errorRate.toFixed(2)}%
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Response Time</span>
              <span className={`metric-value ${currentMetrics.responseTime > 1000 ? 'warning' : 'good'}`}>
                {currentMetrics.responseTime.toFixed(0)}ms
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Availability</span>
              <span className={`metric-value ${currentMetrics.availability < 99 ? 'warning' : 'good'}`}>
                {currentMetrics.availability.toFixed(2)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="no-metrics">No metrics available</div>
        )}
      </div>

      <div className="overview-card">
        <h3>🚨 Recent Alerts</h3>
        <div className="alerts-summary">
          {alerts.slice(0, 5).map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity}`}>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-time">{alert.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="no-alerts">No recent alerts</div>
          )}
        </div>
      </div>

      <div className="overview-card">
        <h3>⚙️ Configuration</h3>
        <div className="config-summary">
          <div className="config-item">
            <span>Environment:</span>
            <span>{config.environment}</span>
          </div>
          <div className="config-item">
            <span>Strategy:</span>
            <span>{config.deployment.strategy}</span>
          </div>
          <div className="config-item">
            <span>CDN:</span>
            <span>{config.cdn.provider}</span>
          </div>
          <div className="config-item">
            <span>Monitoring:</span>
            <span>{config.monitoring.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .overview-grid {
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

      .deployment-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .deployment-version {
        font-size: 20px;
        font-weight: 600;
        color: #3b82f6;
      }

      .deployment-progress {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .progress-bar {
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #10b981;
        transition: width 0.3s ease;
      }

      .deployment-status {
        text-transform: capitalize;
        font-weight: 500;
        color: #059669;
      }

      .metrics-summary {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .metric-label {
        font-weight: 500;
        color: #64748b;
      }

      .metric-value {
        font-weight: 600;
        font-size: 16px;
      }

      .metric-value.good {
        color: #10b981;
      }

      .metric-value.warning {
        color: #f59e0b;
      }

      .alerts-summary {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .alert-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
      }

      .alert-item.critical {
        background: #fecaca;
        color: #991b1b;
      }

      .alert-item.high {
        background: #fed7aa;
        color: #9a3412;
      }

      .alert-item.medium {
        background: #fef3c7;
        color: #92400e;
      }

      .config-summary {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .config-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .no-deployment, .no-metrics, .no-alerts {
        color: #64748b;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }
    `}</style>
  </div>
);

const DeploymentsTab: React.FC<{
  deployments: DeploymentInfo[];
  onRollback: (deploymentId: string) => void;
  onPause: (deploymentId: string) => void;
}> = ({ deployments, onRollback, onPause }) => (
  <div className="deployments-tab">
    <h2>🚀 Deployment History</h2>
    <div className="deployments-list">
      {deployments.map(deployment => (
        <div key={deployment.id} className="deployment-card">
          <div className="deployment-header">
            <div className="deployment-info">
              <h3>{deployment.version}</h3>
              <span className={`status ${deployment.status}`}>{deployment.status}</span>
            </div>
            <div className="deployment-actions">
              {deployment.status === 'active' && (
                <>
                  <button onClick={() => onPause(deployment.id)}>⏸️ Pause</button>
                  <button onClick={() => onRollback(deployment.id)}>🔄 Rollback</button>
                </>
              )}
            </div>
          </div>
          <div className="deployment-details">
            <div className="detail-item">
              <span>Started:</span>
              <span>{deployment.startTime.toLocaleString()}</span>
            </div>
            {deployment.endTime && (
              <div className="detail-item">
                <span>Completed:</span>
                <span>{deployment.endTime.toLocaleString()}</span>
              </div>
            )}
            <div className="detail-item">
              <span>Progress:</span>
              <span>{deployment.progress}%</span>
            </div>
          </div>
        </div>
      ))}
      {deployments.length === 0 && (
        <div className="no-deployments">No deployments found</div>
      )}
    </div>

    <style jsx>{`
      .deployments-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 20px;
      }

      .deployment-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
      }

      .deployment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .deployment-info h3 {
        margin: 0;
        color: #1a365d;
      }

      .status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status.active {
        background: #dbeafe;
        color: #1e40af;
      }

      .status.completed {
        background: #d1fae5;
        color: #065f46;
      }

      .status.failed {
        background: #fecaca;
        color: #991b1b;
      }

      .deployment-actions {
        display: flex;
        gap: 8px;
      }

      .deployment-actions button {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        background: #e5e7eb;
        color: #374151;
      }

      .deployment-actions button:hover {
        background: #d1d5db;
      }

      .deployment-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }

      .detail-item span:first-child {
        color: #64748b;
        font-weight: 500;
      }

      .no-deployments {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 40px;
      }
    `}</style>
  </div>
);

const FeatureFlagsTab: React.FC<{
  flags: FeatureFlag[];
  deploymentAgent: any;
}> = ({ flags, deploymentAgent }) => (
  <div className="feature-flags-tab">
    <h2>🚩 Feature Flags</h2>
    <div className="flags-grid">
      {flags.map(flag => (
        <div key={flag.key} className="flag-card">
          <div className="flag-header">
            <h3>{flag.name}</h3>
            <span className={`flag-status ${flag.rolloutPercentage > 0 ? 'active' : 'inactive'}`}>
              {flag.rolloutPercentage}%
            </span>
          </div>
          <p className="flag-description">{flag.description}</p>
          <div className="flag-details">
            <div className="detail-item">
              <span>Environment:</span>
              <span>{flag.environment.join(', ')}</span>
            </div>
            <div className="detail-item">
              <span>Updated:</span>
              <span>{flag.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
      {flags.length === 0 && (
        <div className="no-flags">No feature flags configured</div>
      )}
    </div>

    <style jsx>{`
      .flags-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        margin-top: 20px;
      }

      .flag-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
      }

      .flag-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .flag-header h3 {
        margin: 0;
        color: #1a365d;
        font-size: 16px;
      }

      .flag-status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .flag-status.active {
        background: #d1fae5;
        color: #065f46;
      }

      .flag-status.inactive {
        background: #e5e7eb;
        color: #374151;
      }

      .flag-description {
        color: #64748b;
        font-size: 14px;
        margin: 8px 0;
      }

      .flag-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
      }

      .detail-item span:first-child {
        color: #64748b;
        font-weight: 500;
      }

      .no-flags {
        grid-column: 1 / -1;
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 40px;
      }
    `}</style>
  </div>
);

const PerformanceTab: React.FC<{
  metrics: DeploymentMetrics | null;
  deployments: DeploymentInfo[];
}> = ({ metrics, deployments }) => (
  <div className="performance-tab">
    <h2>📊 Performance Metrics</h2>
    {metrics ? (
      <div className="performance-grid">
        <div className="performance-card">
          <h3>Core Web Vitals</h3>
          <div className="metrics-list">
            <div className="metric-row">
              <span>FCP</span>
              <span>{metrics.performance.webVitals.fcp.toFixed(0)}ms</span>
            </div>
            <div className="metric-row">
              <span>LCP</span>
              <span>{metrics.performance.webVitals.lcp.toFixed(0)}ms</span>
            </div>
            <div className="metric-row">
              <span>FID</span>
              <span>{metrics.performance.webVitals.fid.toFixed(0)}ms</span>
            </div>
            <div className="metric-row">
              <span>CLS</span>
              <span>{metrics.performance.webVitals.cls.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div className="performance-card">
          <h3>Mobile Performance</h3>
          <div className="metrics-list">
            <div className="metric-row">
              <span>Load Time</span>
              <span>{metrics.performance.mobile.loadTime.toFixed(0)}ms</span>
            </div>
            <div className="metric-row">
              <span>Crash Rate</span>
              <span>{metrics.performance.mobile.crashRate.toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>Battery Usage</span>
              <span>{metrics.performance.mobile.batteryUsage.toFixed(1)}%/hr</span>
            </div>
            <div className="metric-row">
              <span>Data Usage</span>
              <span>{metrics.performance.mobile.dataUsage.toFixed(1)}MB</span>
            </div>
          </div>
        </div>

        <div className="performance-card">
          <h3>System Resources</h3>
          <div className="metrics-list">
            <div className="metric-row">
              <span>CPU</span>
              <span>{metrics.performance.resources.cpu.toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span>Memory</span>
              <span>{metrics.performance.resources.memory.toFixed(0)}MB</span>
            </div>
            <div className="metric-row">
              <span>Disk</span>
              <span>{metrics.performance.resources.disk.toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span>Network</span>
              <span>{metrics.performance.resources.network.toFixed(0)}MB/s</span>
            </div>
          </div>
        </div>

        <div className="performance-card">
          <h3>Business Metrics</h3>
          <div className="metrics-list">
            <div className="metric-row">
              <span>Conversion Rate</span>
              <span>{(metrics.business.conversionRate * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span>Revenue</span>
              <span>${metrics.business.revenue.toFixed(0)}</span>
            </div>
            <div className="metric-row">
              <span>User Engagement</span>
              <span>{(metrics.business.userEngagement * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span>Retention</span>
              <span>{(metrics.business.retention * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="no-metrics">No performance metrics available</div>
    )}

    <style jsx>{`
      .performance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .performance-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
      }

      .performance-card h3 {
        margin: 0 0 16px 0;
        color: #1a365d;
        font-size: 16px;
      }

      .metrics-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
      }

      .metric-row span:first-child {
        color: #64748b;
        font-weight: 500;
      }

      .metric-row span:last-child {
        font-weight: 600;
        color: #1a365d;
      }

      .no-metrics {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 40px;
      }
    `}</style>
  </div>
);

const AlertsTab: React.FC<{
  alerts: AlertInfo[];
  deploymentAgent: any;
}> = ({ alerts, deploymentAgent }) => (
  <div className="alerts-tab">
    <h2>🚨 Alerts & Notifications</h2>
    <div className="alerts-list">
      {alerts.map(alert => (
        <div key={alert.id} className={`alert-card ${alert.severity} ${alert.resolved ? 'resolved' : ''}`}>
          <div className="alert-header">
            <div className="alert-info">
              <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
              <span className="alert-type">{alert.type}</span>
            </div>
            <span className="alert-time">{alert.timestamp.toLocaleString()}</span>
          </div>
          <div className="alert-message">{alert.message}</div>
          {alert.resolved && (
            <div className="alert-resolved">✅ Resolved</div>
          )}
        </div>
      ))}
      {alerts.length === 0 && (
        <div className="no-alerts">No alerts found</div>
      )}
    </div>

    <style jsx>{`
      .alerts-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 20px;
      }

      .alert-card {
        border-radius: 8px;
        padding: 16px;
        border-left: 4px solid;
      }

      .alert-card.critical {
        background: #fef2f2;
        border-left-color: #dc2626;
      }

      .alert-card.high {
        background: #fffbeb;
        border-left-color: #d97706;
      }

      .alert-card.medium {
        background: #fffbeb;
        border-left-color: #f59e0b;
      }

      .alert-card.low {
        background: #f0fdf4;
        border-left-color: #10b981;
      }

      .alert-card.resolved {
        opacity: 0.6;
      }

      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .alert-info {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .severity-badge {
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        color: white;
      }

      .severity-badge.critical {
        background: #dc2626;
      }

      .severity-badge.high {
        background: #d97706;
      }

      .severity-badge.medium {
        background: #f59e0b;
      }

      .severity-badge.low {
        background: #10b981;
      }

      .alert-type {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
      }

      .alert-time {
        font-size: 12px;
        color: #64748b;
      }

      .alert-message {
        color: #1a365d;
        font-size: 14px;
        line-height: 1.5;
      }

      .alert-resolved {
        margin-top: 8px;
        color: #10b981;
        font-size: 12px;
        font-weight: 600;
      }

      .no-alerts {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 40px;
      }
    `}</style>
  </div>
);

const RollbacksTab: React.FC<{
  rollbacks: RollbackInfo[];
  deploymentAgent: any;
}> = ({ rollbacks, deploymentAgent }) => (
  <div className="rollbacks-tab">
    <h2>🔄 Rollback History</h2>
    <div className="rollbacks-list">
      {rollbacks.map(rollback => (
        <div key={rollback.id} className="rollback-card">
          <div className="rollback-header">
            <div className="rollback-info">
              <h3>Rollback {rollback.id}</h3>
              <span className={`status ${rollback.status}`}>{rollback.status}</span>
            </div>
            <span className="rollback-time">{rollback.timestamp.toLocaleString()}</span>
          </div>
          <div className="rollback-details">
            <div className="detail-item">
              <span>Deployment:</span>
              <span>{rollback.deploymentId}</span>
            </div>
            <div className="detail-item">
              <span>Reason:</span>
              <span>{rollback.reason}</span>
            </div>
          </div>
        </div>
      ))}
      {rollbacks.length === 0 && (
        <div className="no-rollbacks">No rollbacks found</div>
      )}
    </div>

    <style jsx>{`
      .rollbacks-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 20px;
      }

      .rollback-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
      }

      .rollback-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .rollback-info h3 {
        margin: 0;
        color: #1a365d;
        font-size: 16px;
      }

      .status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status.completed {
        background: #d1fae5;
        color: #065f46;
      }

      .status.in_progress {
        background: #dbeafe;
        color: #1e40af;
      }

      .status.failed {
        background: #fecaca;
        color: #991b1b;
      }

      .rollback-time {
        font-size: 12px;
        color: #64748b;
      }

      .rollback-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }

      .detail-item span:first-child {
        color: #64748b;
        font-weight: 500;
      }

      .no-rollbacks {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 40px;
      }
    `}</style>
  </div>
);

export default ProductionDeploymentDashboard;