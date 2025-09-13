import { MastraConfig } from '../types/deployment-types';

export const MacBookProConfig: MastraConfig = {
  // Hardware detection
  platform: 'macbook-pro',
  architecture: 'apple-silicon',
  
  // Performance optimizations for MacBook Pro M4
  performance: {
    maxConcurrentAgents: 8,
    memoryPerAgent: '4GB',
    nodeOptions: {
      maxOldSpaceSize: 8192, // 8GB max heap size
      maxConcurrency: 8,
      gcInterval: 10000,
      enableSourceMaps: true, // Enable for development
    },
    
    // MacBook Pro M4 specifications
    cpuCores: 'auto', // Will detect M4 cores
    memoryLimit: '32GB', // Typical MacBook Pro configuration
    diskCache: '5GB',
    networkConcurrency: 12,
  },
  
  // Agent-specific optimizations for development
  agents: {
    'mobile-ui-analyzer': {
      concurrency: 2,
      memoryLimit: '1.5GB',
      timeout: 120000,
      priority: 'high'
    },
    'responsive-generator': {
      concurrency: 2,
      memoryLimit: '2GB',
      timeout: 180000,
      priority: 'high'
    },
    'performance-optimizer': {
      concurrency: 1,
      memoryLimit: '3GB',
      timeout: 300000,
      priority: 'highest'
    },
    'mobile-tester': {
      concurrency: 2,
      memoryLimit: '2GB',
      timeout: 600000,
      priority: 'medium'
    },
    'workflow-orchestrator': {
      concurrency: 1,
      memoryLimit: '4GB',
      timeout: 1200000, // 20 minutes for development workflows
      priority: 'highest'
    },
    'deployment-manager': {
      concurrency: 1,
      memoryLimit: '2GB',
      timeout: 600000, // 10 minutes for staging deployments
      priority: 'high'
    },
    'analytics-monitor': {
      concurrency: 1,
      memoryLimit: '1.5GB',
      timeout: 300000,
      priority: 'low'
    },
    'integration-agent': {
      concurrency: 1,
      memoryLimit: '1.5GB',
      timeout: 180000,
      priority: 'medium'
    }
  },
  
  // Balanced caching for development
  caching: {
    enabled: true,
    strategy: 'balanced',
    memory: {
      max: '4GB',
      ttl: 1800000, // 30 minutes
    },
    disk: {
      enabled: true,
      path: './cache',
      maxSize: '10GB',
      ttl: 43200000, // 12 hours
    },
    redis: {
      enabled: false, // Use local caching for development
    }
  },
  
  // Development-focused logging
  logging: {
    level: 'debug',
    console: true,
    file: {
      enabled: true,
      path: './logs',
      maxSize: '50MB',
      maxFiles: 5
    },
    performance: {
      enabled: true,
      trackMemory: true,
      trackCPU: true,
      trackNetwork: false // Reduce overhead in development
    }
  },
  
  // Development vs Production settings
  environment: {
    development: {
      hotReload: true,
      debugMode: true,
      verboseLogging: true,
      sourceMapSupport: true,
      watchMode: true,
      autoRestart: true
    },
    production: {
      hotReload: false,
      debugMode: false,
      verboseLogging: false,
      sourceMapSupport: false,
      clustering: {
        enabled: false // Single process for MacBook Pro
      }
    }
  },
  
  // MacBook Pro specific optimizations
  macBookProOptimizations: {
    // Thermal management for sustained performance
    thermalManagement: {
      enabled: true,
      aggressiveCooling: false,
      throttleOnHeat: true,
      temperatureThreshold: 80 // Celsius
    },
    
    // Battery optimization when unplugged
    batteryOptimization: {
      enabled: true,
      reduceConcurrencyOnBattery: true,
      batteryThreshold: 20, // Below 20% battery
      performanceMode: 'balanced'
    },
    
    // Storage optimizations for SSD
    storage: {
      ssdOptimized: true,
      useExternalStorage: false,
      tmpfsSize: '2GB' // Conservative RAM usage for temp files
    },
    
    // Network optimizations for mobile/wifi
    network: {
      adaptiveBandwidth: true,
      connectionPooling: 20,
      keepAlive: true,
      mobileOptimized: true
    }
  },
  
  // Development-specific monitoring
  monitoring: {
    thermalThrottling: {
      enabled: true,
      threshold: 80, // More conservative for laptops
      action: 'reduce_concurrency'
    },
    memoryPressure: {
      enabled: true,
      threshold: 0.85, // 85% memory usage
      action: 'garbage_collect'
    },
    cpuUsage: {
      enabled: true,
      threshold: 0.9, // 90% CPU usage
      action: 'queue_requests'
    },
    batteryLevel: {
      enabled: true,
      threshold: 0.2, // 20% battery
      action: 'enable_power_saving'
    }
  },
  
  // Development tools integration
  development: {
    hotReload: true,
    sourceMapSupport: true,
    debugPort: 9229,
    inspectorPort: 9230,
    
    // VS Code / Cursor integration
    editor: {
      enableLSP: true,
      typeChecking: 'incremental',
      eslintOnSave: true,
      prettierOnSave: true
    },
    
    // Testing configuration
    testing: {
      watchMode: true,
      coverage: true,
      parallel: false, // Sequential for debugging
      timeout: 30000
    }
  }
};

// Hardware detection function for MacBook Pro
export const detectMacBookPro = (): boolean => {
  try {
    const os = require('os');
    const platform = os.platform();
    const arch = os.arch();
    const totalmem = os.totalmem();
    const cpus = os.cpus();
    
    // MacBook Pro detection heuristics
    const isMac = platform === 'darwin';
    const isAppleSilicon = arch === 'arm64';
    const hasStandardMemory = totalmem <= 64 * 1024 * 1024 * 1024; // <= 64GB
    const hasFewerCores = cpus.length <= 16; // MacBook Pro typically has fewer cores than Mac Studio
    
    return isMac && isAppleSilicon && hasStandardMemory && hasFewerCores;
  } catch (error) {
    console.warn('Failed to detect hardware:', error);
    return false;
  }
};

// Power management for MacBook Pro
export const getPowerAwareConfig = (): MastraConfig => {
  const baseConfig = MacBookProConfig;
  
  try {
    // Check if running on battery (simplified detection)
    const powerManagement = require('os').getPowerInfo?.() || {};
    const onBattery = powerManagement.charging === false;
    
    if (onBattery) {
      console.log('🔋 Running on battery - enabling power saving mode');
      return {
        ...baseConfig,
        performance: {
          ...baseConfig.performance,
          maxConcurrentAgents: 4, // Reduce concurrency
          memoryPerAgent: '2GB', // Reduce memory usage
        },
        agents: Object.fromEntries(
          Object.entries(baseConfig.agents).map(([key, config]) => [
            key,
            {
              ...config,
              concurrency: Math.max(1, Math.floor(config.concurrency / 2)),
              timeout: config.timeout * 1.5 // Allow more time with reduced performance
            }
          ])
        )
      };
    }
  } catch (error) {
    console.warn('Failed to detect power status:', error);
  }
  
  return baseConfig;
};