import { MastraConfig } from '../types/deployment-types';

export const MacStudioConfig: MastraConfig = {
  // Hardware detection
  platform: 'mac-studio',
  architecture: 'apple-silicon',
  
  // Performance optimizations for Mac Studio
  performance: {
    maxConcurrentAgents: 12,
    memoryPerAgent: '8GB',
    nodeOptions: {
      maxOldSpaceSize: 16384, // 16GB max heap size
      maxConcurrency: 16,
      gcInterval: 5000,
      enableSourceMaps: false, // Disable in production for performance
    },
    
    // Take advantage of Mac Studio's superior specs
    cpuCores: 'auto', // Will detect M2 Ultra cores
    memoryLimit: '64GB', // Mac Studio can handle much more
    diskCache: '10GB',
    networkConcurrency: 20,
  },
  
  // Agent-specific optimizations
  agents: {
    'mobile-ui-analyzer': {
      concurrency: 4,
      memoryLimit: '2GB',
      timeout: 120000,
      priority: 'high'
    },
    'responsive-generator': {
      concurrency: 3,
      memoryLimit: '4GB',
      timeout: 180000,
      priority: 'high'
    },
    'performance-optimizer': {
      concurrency: 2,
      memoryLimit: '6GB',
      timeout: 300000,
      priority: 'highest'
    },
    'mobile-tester': {
      concurrency: 3,
      memoryLimit: '4GB',
      timeout: 600000,
      priority: 'medium'
    },
    'workflow-orchestrator': {
      concurrency: 1,
      memoryLimit: '8GB',
      timeout: 1800000, // 30 minutes for complex workflows
      priority: 'highest'
    },
    'deployment-manager': {
      concurrency: 2,
      memoryLimit: '4GB',
      timeout: 900000, // 15 minutes for deployments
      priority: 'high'
    },
    'analytics-monitor': {
      concurrency: 2,
      memoryLimit: '3GB',
      timeout: 300000,
      priority: 'medium'
    },
    'integration-agent': {
      concurrency: 2,
      memoryLimit: '3GB',
      timeout: 180000,
      priority: 'medium'
    }
  },
  
  // Caching optimizations for Mac Studio
  caching: {
    enabled: true,
    strategy: 'aggressive',
    memory: {
      max: '8GB',
      ttl: 3600000, // 1 hour
    },
    disk: {
      enabled: true,
      path: './cache',
      maxSize: '20GB',
      ttl: 86400000, // 24 hours
    },
    redis: {
      enabled: false, // Use local caching for better performance
    }
  },
  
  // Logging and monitoring
  logging: {
    level: 'info',
    console: true,
    file: {
      enabled: true,
      path: './logs',
      maxSize: '100MB',
      maxFiles: 10
    },
    performance: {
      enabled: true,
      trackMemory: true,
      trackCPU: true,
      trackNetwork: true
    }
  },
  
  // Development vs Production settings
  environment: {
    development: {
      hotReload: true,
      debugMode: true,
      verboseLogging: true,
      sourceMapSupport: true
    },
    production: {
      hotReload: false,
      debugMode: false,
      verboseLogging: false,
      sourceMapSupport: false,
      clustering: {
        enabled: true,
        workers: 'auto' // Will use all available cores
      }
    }
  },
  
  // Mac Studio specific optimizations
  macStudioOptimizations: {
    // Leverage unified memory architecture
    unifiedMemory: {
      enabled: true,
      crossProcessSharing: true,
      memoryPoolSize: '32GB'
    },
    
    // GPU acceleration where possible
    metalAcceleration: {
      enabled: true,
      modelInference: true,
      imageProcessing: true
    },
    
    // Storage optimizations
    storage: {
      ssdOptimized: true,
      useExternalThunderbolt: false, // Set to true if using external Thunderbolt storage
      tmpfsSize: '8GB' // Use RAM for temporary files
    },
    
    // Network optimizations
    network: {
      bandwidth: 'unlimited', // Mac Studio typically has excellent network
      connectionPooling: 50,
      keepAlive: true
    }
  },
  
  // Monitoring and alerts specific to Mac Studio
  monitoring: {
    thermalThrottling: {
      enabled: true,
      threshold: 85, // Celsius
      action: 'reduce_concurrency'
    },
    memoryPressure: {
      enabled: true,
      threshold: 0.9, // 90% memory usage
      action: 'garbage_collect'
    },
    cpuUsage: {
      enabled: true,
      threshold: 0.95, // 95% CPU usage
      action: 'queue_requests'
    }
  }
};

// Hardware detection function
export const detectMacStudio = (): boolean => {
  try {
    const os = require('os');
    const platform = os.platform();
    const arch = os.arch();
    const totalmem = os.totalmem();
    const cpus = os.cpus();
    
    // Mac Studio detection heuristics
    const isMac = platform === 'darwin';
    const isAppleSilicon = arch === 'arm64';
    const hasHighMemory = totalmem > 32 * 1024 * 1024 * 1024; // > 32GB
    const hasManyCores = cpus.length >= 16; // Mac Studio typically has many cores
    
    return isMac && isAppleSilicon && (hasHighMemory || hasManyCores);
  } catch (error) {
    console.warn('Failed to detect hardware:', error);
    return false;
  }
};

// Auto-configure based on detected hardware
export const getOptimalConfig = (): MastraConfig => {
  if (detectMacStudio()) {
    console.log('🖥️ Mac Studio detected - applying high-performance configuration');
    return MacStudioConfig;
  }
  
  // Fallback to MacBook Pro config
  console.log('💻 Using standard MacBook Pro configuration');
  return {
    ...MacStudioConfig,
    performance: {
      ...MacStudioConfig.performance,
      maxConcurrentAgents: 8,
      memoryPerAgent: '4GB',
      nodeOptions: {
        ...MacStudioConfig.performance.nodeOptions,
        maxOldSpaceSize: 8192, // 8GB for MacBook Pro
        maxConcurrency: 8
      }
    }
  };
};