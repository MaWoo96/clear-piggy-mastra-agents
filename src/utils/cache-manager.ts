import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';
import {
  DeploymentConfig,
  SupabaseIntegrationConfig
} from '../types/integration-agent-types';

export interface CacheConfig {
  strategy: 'memory' | 'redis' | 'hybrid' | 'edge';
  ttl: {
    default: number;
    shortTerm: number;
    longTerm: number;
    permanent: number;
  };
  mobile: {
    enabled: boolean;
    adaptiveTTL: boolean;
    compressionEnabled: boolean;
    offlineSupport: boolean;
    backgroundSync: boolean;
  };
  layers: {
    browser: BrowserCacheConfig;
    serviceWorker: ServiceWorkerCacheConfig;
    edge: EdgeCacheConfig;
    api: ApiCacheConfig;
  };
  invalidation: {
    enabled: boolean;
    patterns: string[];
    webhooks: string[];
  };
}

export interface BrowserCacheConfig {
  enabled: boolean;
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
  maxSize: number;
  compression: boolean;
  encryption: boolean;
  syncInterval: number;
}

export interface ServiceWorkerCacheConfig {
  enabled: boolean;
  cacheName: string;
  strategies: {
    [pattern: string]: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  };
  maxAge: number;
  maxEntries: number;
  backgroundSync: boolean;
}

export interface EdgeCacheConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'fastly' | 'aws' | 'custom';
  regions: string[];
  headers: { [key: string]: string };
  purgeWebhooks: string[];
}

export interface ApiCacheConfig {
  enabled: boolean;
  provider: 'redis' | 'memcached' | 'memory';
  keyPrefix: string;
  serialization: 'json' | 'msgpack' | 'pickle';
  compression: boolean;
  clustering: boolean;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
  tags: string[];
  mobile: boolean;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  memoryUsage: number;
  mobileHitRate: number;
  topMissedKeys: string[];
  performanceGain: number;
}

export interface CacheInvalidationRule {
  pattern: string;
  triggers: string[];
  scope: 'all' | 'mobile' | 'desktop';
  cascade: boolean;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  strategy: 'hybrid',
  ttl: {
    default: 300000,     // 5 minutes
    shortTerm: 60000,    // 1 minute
    longTerm: 3600000,   // 1 hour
    permanent: 86400000  // 24 hours
  },
  mobile: {
    enabled: true,
    adaptiveTTL: true,
    compressionEnabled: true,
    offlineSupport: true,
    backgroundSync: true
  },
  layers: {
    browser: {
      enabled: true,
      storage: 'indexedDB',
      maxSize: 50 * 1024 * 1024, // 50MB
      compression: true,
      encryption: false,
      syncInterval: 30000
    },
    serviceWorker: {
      enabled: true,
      cacheName: 'clear-piggy-mobile-v1',
      strategies: {
        '/api/mobile/transactions': 'stale-while-revalidate',
        '/api/mobile/accounts': 'cache-first',
        '/api/mobile/budgets': 'stale-while-revalidate',
        '/api/mobile/categories': 'cache-first',
        '/api/mobile/user': 'network-first',
        '/static/': 'cache-first'
      },
      maxAge: 86400000,
      maxEntries: 1000,
      backgroundSync: true
    },
    edge: {
      enabled: true,
      provider: 'cloudflare',
      regions: ['auto'],
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
        'Vary': 'User-Agent, Accept-Encoding'
      },
      purgeWebhooks: []
    },
    api: {
      enabled: true,
      provider: 'redis',
      keyPrefix: 'clear-piggy:mobile:',
      serialization: 'json',
      compression: true,
      clustering: false
    }
  },
  invalidation: {
    enabled: true,
    patterns: [
      'user:*:transactions',
      'user:*:accounts',
      'user:*:budgets'
    ],
    webhooks: []
  }
};

export const MOBILE_CACHE_PATTERNS = [
  {
    pattern: '/api/mobile/transactions*',
    strategy: 'stale-while-revalidate',
    ttl: 300000, // 5 minutes
    tags: ['transactions', 'mobile', 'financial-data']
  },
  {
    pattern: '/api/mobile/accounts*',
    strategy: 'cache-first',
    ttl: 600000, // 10 minutes
    tags: ['accounts', 'mobile', 'financial-data']
  },
  {
    pattern: '/api/mobile/budgets*',
    strategy: 'stale-while-revalidate',
    ttl: 900000, // 15 minutes
    tags: ['budgets', 'mobile', 'financial-data']
  },
  {
    pattern: '/api/mobile/categories*',
    strategy: 'cache-first',
    ttl: 3600000, // 1 hour
    tags: ['categories', 'mobile', 'static-data']
  },
  {
    pattern: '/api/mobile/user*',
    strategy: 'network-first',
    ttl: 300000, // 5 minutes
    tags: ['user', 'mobile', 'profile-data']
  },
  {
    pattern: '/api/mobile/sync*',
    strategy: 'network-only',
    ttl: 0,
    tags: ['sync', 'mobile', 'realtime-data']
  }
];

export class CacheManager extends EventEmitter {
  private config: CacheConfig;
  private projectPath: string;
  private metrics: CacheMetrics;
  private invalidationRules: CacheInvalidationRule[] = [];
  private cache: Map<string, CacheEntry> = new Map();

  constructor(projectPath: string, config: Partial<CacheConfig> = {}) {
    super();
    this.projectPath = projectPath;
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    this.setupInvalidationRules();
  }

  async setupMobileCaching(): Promise<{
    serviceWorkerScript: string;
    cacheStrategies: string;
    browserCacheConfig: string;
    apiCacheConfig: string;
  }> {
    try {
      this.emit('cache:setup:start');

      // Generate service worker script
      const serviceWorkerScript = await this.generateServiceWorkerScript();
      await this.writeServiceWorkerScript(serviceWorkerScript);

      // Generate cache strategies configuration
      const cacheStrategies = await this.generateCacheStrategiesConfig();
      await this.writeCacheStrategiesConfig(cacheStrategies);

      // Generate browser cache configuration
      const browserCacheConfig = await this.generateBrowserCacheConfig();
      await this.writeBrowserCacheConfig(browserCacheConfig);

      // Generate API cache configuration
      const apiCacheConfig = await this.generateApiCacheConfig();
      await this.writeApiCacheConfig(apiCacheConfig);

      // Setup cache invalidation webhooks
      await this.setupCacheInvalidation();

      // Generate cache monitoring utilities
      await this.generateCacheMonitoring();

      this.emit('cache:setup:complete');

      return {
        serviceWorkerScript,
        cacheStrategies,
        browserCacheConfig,
        apiCacheConfig
      };

    } catch (error) {
      this.emit('cache:setup:error', error);
      throw new Error(`Cache setup failed: ${(error as Error).message}`);
    }
  }

  private async generateServiceWorkerScript(): Promise<string> {
    return `// Clear Piggy Mobile Cache Service Worker
// Generated by Clear Piggy Mobile Cache Manager
// Implements multi-layer caching strategy for mobile optimization

const CACHE_NAME = '${this.config.layers.serviceWorker.cacheName}';
const CACHE_VERSION = 'v1';
const FULL_CACHE_NAME = \`\${CACHE_NAME}-\${CACHE_VERSION}\`;

// Cache strategies configuration
const CACHE_STRATEGIES = {
${Object.entries(this.config.layers.serviceWorker.strategies)
  .map(([pattern, strategy]) => `  '${pattern}': '${strategy}'`)
  .join(',\n')}
};

// Mobile-specific cache patterns
const MOBILE_PATTERNS = [
${MOBILE_CACHE_PATTERNS
  .map(pattern => `  {
    pattern: '${pattern.pattern}',
    strategy: '${pattern.strategy}',
    ttl: ${pattern.ttl},
    tags: [${pattern.tags.map(tag => `'${tag}'`).join(', ')}]
  }`)
  .join(',\n')}
];

// Cache utilities
class CacheManager {
  constructor() {
    this.cache = null;
    this.metrics = {
      hits: 0,
      misses: 0,
      requests: 0
    };
  }

  async init() {
    this.cache = await caches.open(FULL_CACHE_NAME);
  }

  async get(request) {
    const response = await this.cache.match(request);
    if (response) {
      this.metrics.hits++;
      this.updateMetrics();
      return response;
    }
    this.metrics.misses++;
    this.updateMetrics();
    return null;
  }

  async put(request, response, options = {}) {
    const { ttl = ${this.config.ttl.default}, tags = [] } = options;
    
    // Clone response to avoid consumption
    const responseToCache = response.clone();
    
    // Add cache metadata headers
    const headers = new Headers(responseToCache.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());
    headers.set('sw-cache-ttl', ttl.toString());
    headers.set('sw-cache-tags', JSON.stringify(tags));
    
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers
    });
    
    await this.cache.put(request, cachedResponse);
  }

  async delete(request) {
    return await this.cache.delete(request);
  }

  async clear() {
    const keys = await this.cache.keys();
    return Promise.all(keys.map(key => this.cache.delete(key)));
  }

  updateMetrics() {
    this.metrics.requests = this.metrics.hits + this.metrics.misses;
    
    // Send metrics to main thread periodically
    if (this.metrics.requests % 10 === 0) {
      self.postMessage({
        type: 'cache-metrics',
        data: {
          ...this.metrics,
          hitRate: this.metrics.hits / this.metrics.requests,
          timestamp: Date.now()
        }
      });
    }
  }
}

// Initialize cache manager
const cacheManager = new CacheManager();

// Service Worker event handlers
self.addEventListener('install', event => {
  console.log('[SW] Installing Clear Piggy Mobile Cache Service Worker');
  
  event.waitUntil(
    cacheManager.init().then(() => {
      console.log('[SW] Cache initialized');
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating Clear Piggy Mobile Cache Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('${this.config.layers.serviceWorker.cacheName}') && 
              cacheName !== FULL_CACHE_NAME
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      // Take control of clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests and API calls
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api/')) {
    return;
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(request);
  
  if (strategy === 'network-only') {
    // No caching for real-time data
    return;
  }

  event.respondWith(handleRequest(request, strategy));
});

// Background sync for mobile offline support
self.addEventListener('sync', event => {
  if (event.tag === 'mobile-data-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// Handle cache strategy determination
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check mobile patterns first
  for (const pattern of MOBILE_PATTERNS) {
    if (matchesPattern(pathname, pattern.pattern)) {
      return pattern.strategy;
    }
  }
  
  // Check configured strategies
  for (const [pattern, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (matchesPattern(pathname, pattern)) {
      return strategy;
    }
  }
  
  return 'network-first'; // Default strategy
}

function matchesPattern(pathname, pattern) {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\\*/g, '.*')
    .replace(/\\?/g, '.')
    .replace(/\\//g, '\\\\/');
  
  const regex = new RegExp(\`^\${regexPattern}$\`);
  return regex.test(pathname);
}

// Cache strategy implementations
async function handleRequest(request, strategy) {
  const url = new URL(request.url);
  
  switch (strategy) {
    case 'cache-first':
      return handleCacheFirst(request);
    case 'network-first':
      return handleNetworkFirst(request);
    case 'stale-while-revalidate':
      return handleStaleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

async function handleCacheFirst(request) {
  try {
    const cachedResponse = await cacheManager.get(request);
    
    if (cachedResponse && !isCacheExpired(cachedResponse)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheManager.put(request, networkResponse, {
        ttl: getTTLForRequest(request),
        tags: getTagsForRequest(request)
      });
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Cache-first failed, trying cache:', error);
    const cachedResponse = await cacheManager.get(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheManager.put(request, networkResponse, {
        ttl: getTTLForRequest(request),
        tags: getTagsForRequest(request)
      });
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Network-first failed, trying cache:', error);
    const cachedResponse = await cacheManager.get(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function handleStaleWhileRevalidate(request) {
  const cachedResponse = await cacheManager.get(request);
  
  // Always try to revalidate in the background
  const revalidatePromise = fetch(request).then(response => {
    if (response.ok) {
      cacheManager.put(request, response, {
        ttl: getTTLForRequest(request),
        tags: getTagsForRequest(request)
      });
    }
    return response;
  }).catch(error => {
    console.warn('[SW] Revalidation failed:', error);
  });
  
  // Return cached response immediately if available
  if (cachedResponse && !isCacheExpired(cachedResponse)) {
    return cachedResponse;
  }
  
  // Wait for network if no cache available
  return revalidatePromise;
}

// Cache utility functions
function isCacheExpired(response) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  const ttl = response.headers.get('sw-cache-ttl');
  
  if (!timestamp || !ttl) {
    return true;
  }
  
  return Date.now() - parseInt(timestamp) > parseInt(ttl);
}

function getTTLForRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check mobile patterns for specific TTL
  for (const pattern of MOBILE_PATTERNS) {
    if (matchesPattern(pathname, pattern.pattern)) {
      return pattern.ttl;
    }
  }
  
  return ${this.config.ttl.default}; // Default TTL
}

function getTagsForRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check mobile patterns for tags
  for (const pattern of MOBILE_PATTERNS) {
    if (matchesPattern(pathname, pattern.pattern)) {
      return pattern.tags;
    }
  }
  
  return ['mobile', 'general'];
}

async function performBackgroundSync() {
  try {
    console.log('[SW] Performing background sync');
    
    // Sync pending offline actions
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await processAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.warn('[SW] Failed to sync action:', action.id, error);
      }
    }
    
    console.log('[SW] Background sync completed');
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function getPendingActions() {
  // This would retrieve pending actions from IndexedDB
  // For now, return empty array
  return [];
}

async function processAction(action) {
  // This would process the pending action
  // For now, just log
  console.log('[SW] Processing action:', action);
}

async function removePendingAction(actionId) {
  // This would remove the action from IndexedDB
  // For now, just log
  console.log('[SW] Removing action:', actionId);
}

// Handle messages from main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'cache-invalidate':
      handleCacheInvalidation(data);
      break;
    case 'cache-clear':
      cacheManager.clear();
      break;
    case 'cache-metrics':
      event.ports[0].postMessage({
        type: 'cache-metrics-response',
        data: cacheManager.metrics
      });
      break;
  }
});

async function handleCacheInvalidation(data) {
  const { patterns, tags } = data;
  
  if (patterns) {
    for (const pattern of patterns) {
      await invalidateCacheByPattern(pattern);
    }
  }
  
  if (tags) {
    for (const tag of tags) {
      await invalidateCacheByTag(tag);
    }
  }
}

async function invalidateCacheByPattern(pattern) {
  const keys = await cacheManager.cache.keys();
  
  for (const request of keys) {
    const url = new URL(request.url);
    if (matchesPattern(url.pathname, pattern)) {
      await cacheManager.delete(request);
    }
  }
}

async function invalidateCacheByTag(tag) {
  const keys = await cacheManager.cache.keys();
  
  for (const request of keys) {
    const response = await cacheManager.cache.match(request);
    if (response) {
      const tags = response.headers.get('sw-cache-tags');
      if (tags && JSON.parse(tags).includes(tag)) {
        await cacheManager.delete(request);
      }
    }
  }
}

console.log('[SW] Clear Piggy Mobile Cache Service Worker loaded');
`;
  }

  private async generateCacheStrategiesConfig(): Promise<string> {
    return `// Clear Piggy Mobile Cache Strategies Configuration
// Generated by Clear Piggy Mobile Cache Manager

export interface CacheStrategy {
  pattern: string;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  ttl: number;
  tags: string[];
  mobile: boolean;
}

export const MOBILE_CACHE_STRATEGIES: CacheStrategy[] = [
${MOBILE_CACHE_PATTERNS
  .map(pattern => `  {
    pattern: '${pattern.pattern}',
    strategy: '${pattern.strategy}',
    ttl: ${pattern.ttl},
    tags: [${pattern.tags.map(tag => `'${tag}'`).join(', ')}],
    mobile: true
  }`)
  .join(',\n')}
];

export const CACHE_CONFIG = {
  version: '1.0.0',
  defaultTTL: ${this.config.ttl.default},
  maxCacheSize: ${this.config.layers.browser.maxSize},
  compressionEnabled: ${this.config.mobile.compressionEnabled},
  offlineSupport: ${this.config.mobile.offlineSupport},
  adaptiveTTL: ${this.config.mobile.adaptiveTTL}
};

export class MobileCacheStrategy {
  private strategies: Map<string, CacheStrategy>;
  private metrics: Map<string, { hits: number; misses: number; }>;

  constructor() {
    this.strategies = new Map();
    this.metrics = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    MOBILE_CACHE_STRATEGIES.forEach(strategy => {
      this.strategies.set(strategy.pattern, strategy);
      this.metrics.set(strategy.pattern, { hits: 0, misses: 0 });
    });
  }

  getStrategy(url: string): CacheStrategy | null {
    for (const [pattern, strategy] of this.strategies) {
      if (this.matchesPattern(url, pattern)) {
        return strategy;
      }
    }
    return null;
  }

  private matchesPattern(url: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\\*/g, '.*')
      .replace(/\\?/g, '.')
      .replace(/\\//g, '\\\\/');
    
    const regex = new RegExp(\`^\${regexPattern}$\`);
    return regex.test(url);
  }

  recordHit(pattern: string): void {
    const metrics = this.metrics.get(pattern);
    if (metrics) {
      metrics.hits++;
    }
  }

  recordMiss(pattern: string): void {
    const metrics = this.metrics.get(pattern);
    if (metrics) {
      metrics.misses++;
    }
  }

  getMetrics(): { [pattern: string]: { hits: number; misses: number; hitRate: number; } } {
    const result: { [pattern: string]: { hits: number; misses: number; hitRate: number; } } = {};
    
    for (const [pattern, metrics] of this.metrics) {
      const total = metrics.hits + metrics.misses;
      result[pattern] = {
        hits: metrics.hits,
        misses: metrics.misses,
        hitRate: total > 0 ? metrics.hits / total : 0
      };
    }
    
    return result;
  }

  adaptTTL(url: string, baselineResponseTime: number, currentResponseTime: number): number {
    if (!CACHE_CONFIG.adaptiveTTL) {
      return CACHE_CONFIG.defaultTTL;
    }

    const strategy = this.getStrategy(url);
    if (!strategy) {
      return CACHE_CONFIG.defaultTTL;
    }

    // Increase TTL if network is slow
    const performanceRatio = currentResponseTime / baselineResponseTime;
    const adaptedTTL = strategy.ttl * Math.min(performanceRatio, 3); // Max 3x increase

    return Math.min(adaptedTTL, 3600000); // Max 1 hour
  }
}

export const mobileCacheStrategy = new MobileCacheStrategy();
`;
  }

  private async generateBrowserCacheConfig(): Promise<string> {
    return `// Clear Piggy Mobile Browser Cache Configuration
// Generated by Clear Piggy Mobile Cache Manager

export interface BrowserCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  size: number;
  accessCount: number;
}

export class MobileBrowserCache {
  private storage: Storage | IDBDatabase | null = null;
  private storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';
  private maxSize: number;
  private compressionEnabled: boolean;
  private encryptionEnabled: boolean;
  private metrics: {
    hits: number;
    misses: number;
    writes: number;
    deletes: number;
    totalSize: number;
  };

  constructor(config: {
    storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';
    maxSize: number;
    compression: boolean;
    encryption: boolean;
  }) {
    this.storageType = config.storageType;
    this.maxSize = config.maxSize;
    this.compressionEnabled = config.compression;
    this.encryptionEnabled = config.encryption;
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      deletes: 0,
      totalSize: 0
    };
  }

  async init(): Promise<void> {
    try {
      switch (this.storageType) {
        case 'localStorage':
          this.storage = window.localStorage;
          break;
        case 'sessionStorage':
          this.storage = window.sessionStorage;
          break;
        case 'indexedDB':
          this.storage = await this.initIndexedDB();
          break;
      }
      
      // Clean up expired entries on init
      await this.cleanup();
      
    } catch (error) {
      console.warn('[Cache] Failed to initialize browser cache:', error);
      // Fallback to localStorage
      this.storage = window.localStorage;
      this.storageType = 'localStorage';
    }
  }

  private async initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ClearPiggyMobileCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ttl', 'ttl', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    try {
      if (!this.storage) {
        await this.init();
      }

      let entry: BrowserCacheEntry | null = null;

      if (this.storageType === 'indexedDB') {
        entry = await this.getFromIndexedDB(key);
      } else {
        const stored = (this.storage as Storage).getItem(\`cp_cache_\${key}\`);
        if (stored) {
          entry = JSON.parse(stored);
        }
      }

      if (!entry) {
        this.metrics.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        this.metrics.misses++;
        return null;
      }

      // Update access count
      entry.accessCount++;
      await this.updateEntry(key, entry);

      this.metrics.hits++;
      
      // Decompress if needed
      let data = entry.data;
      if (entry.compressed && this.compressionEnabled) {
        data = await this.decompress(data);
      }

      return data;

    } catch (error) {
      console.warn('[Cache] Failed to get cache entry:', key, error);
      this.metrics.misses++;
      return null;
    }
  }

  async set(key: string, data: any, ttl: number = ${this.config.ttl.default}): Promise<void> {
    try {
      if (!this.storage) {
        await this.init();
      }

      // Prepare entry
      let processedData = data;
      let compressed = false;
      
      if (this.compressionEnabled) {
        processedData = await this.compress(data);
        compressed = true;
      }

      const entry: BrowserCacheEntry = {
        key,
        data: processedData,
        timestamp: Date.now(),
        ttl,
        compressed,
        size: this.calculateSize(processedData),
        accessCount: 0
      };

      // Check size limits
      if (entry.size > this.maxSize * 0.1) { // Single entry can't be more than 10% of total
        console.warn('[Cache] Entry too large for cache:', key, entry.size);
        return;
      }

      // Ensure we don't exceed max size
      await this.ensureSpace(entry.size);

      // Store entry
      if (this.storageType === 'indexedDB') {
        await this.setInIndexedDB(entry);
      } else {
        (this.storage as Storage).setItem(\`cp_cache_\${key}\`, JSON.stringify(entry));
      }

      this.metrics.writes++;
      this.metrics.totalSize += entry.size;

    } catch (error) {
      console.warn('[Cache] Failed to set cache entry:', key, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.storage) {
        return;
      }

      if (this.storageType === 'indexedDB') {
        await this.deleteFromIndexedDB(key);
      } else {
        (this.storage as Storage).removeItem(\`cp_cache_\${key}\`);
      }

      this.metrics.deletes++;

    } catch (error) {
      console.warn('[Cache] Failed to delete cache entry:', key, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (!this.storage) {
        return;
      }

      if (this.storageType === 'indexedDB') {
        await this.clearIndexedDB();
      } else {
        const storage = this.storage as Storage;
        const keys = Object.keys(storage).filter(k => k.startsWith('cp_cache_'));
        keys.forEach(key => storage.removeItem(key));
      }

      this.metrics.totalSize = 0;

    } catch (error) {
      console.warn('[Cache] Failed to clear cache:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.storageType === 'indexedDB') {
        await this.cleanupIndexedDB();
      } else {
        await this.cleanupWebStorage();
      }
    } catch (error) {
      console.warn('[Cache] Failed to cleanup cache:', error);
    }
  }

  private async getFromIndexedDB(key: string): Promise<BrowserCacheEntry | null> {
    if (!this.storage || !(this.storage instanceof IDBDatabase)) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = (this.storage as IDBDatabase).transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async setInIndexedDB(entry: BrowserCacheEntry): Promise<void> {
    if (!this.storage || !(this.storage instanceof IDBDatabase)) {
      throw new Error('IndexedDB not available');
    }

    return new Promise((resolve, reject) => {
      const transaction = (this.storage as IDBDatabase).transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.storage || !(this.storage instanceof IDBDatabase)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = (this.storage as IDBDatabase).transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.storage || !(this.storage instanceof IDBDatabase)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = (this.storage as IDBDatabase).transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async cleanupIndexedDB(): Promise<void> {
    if (!this.storage || !(this.storage instanceof IDBDatabase)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = (this.storage as IDBDatabase).transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.openCursor();

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry: BrowserCacheEntry = cursor.value;
          
          // Delete expired entries
          if (Date.now() - entry.timestamp > entry.ttl) {
            cursor.delete();
          }
          
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  private async cleanupWebStorage(): Promise<void> {
    if (!this.storage || this.storage instanceof IDBDatabase) {
      return;
    }

    const storage = this.storage as Storage;
    const keys = Object.keys(storage).filter(k => k.startsWith('cp_cache_'));
    
    for (const key of keys) {
      try {
        const stored = storage.getItem(key);
        if (stored) {
          const entry: BrowserCacheEntry = JSON.parse(stored);
          
          // Delete expired entries
          if (Date.now() - entry.timestamp > entry.ttl) {
            storage.removeItem(key);
          }
        }
      } catch (error) {
        // Invalid entry, remove it
        storage.removeItem(key);
      }
    }
  }

  private async updateEntry(key: string, entry: BrowserCacheEntry): Promise<void> {
    if (this.storageType === 'indexedDB') {
      await this.setInIndexedDB(entry);
    } else {
      (this.storage as Storage).setItem(\`cp_cache_\${key}\`, JSON.stringify(entry));
    }
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    // This is a simplified implementation
    // In a real implementation, you'd implement LRU eviction
    if (this.metrics.totalSize + requiredSize > this.maxSize) {
      await this.clear();
      this.metrics.totalSize = 0;
    }
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Approximate size in bytes
  }

  private async compress(data: any): Promise<string> {
    // Simple compression implementation
    // In a real implementation, you'd use a proper compression library
    return JSON.stringify(data);
  }

  private async decompress(data: string): Promise<any> {
    // Simple decompression implementation
    return JSON.parse(data);
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.hits / total : 0,
      efficiency: this.metrics.totalSize > 0 ? this.metrics.hits / this.metrics.totalSize : 0
    };
  }
}

// Default mobile browser cache instance
export const mobileBrowserCache = new MobileBrowserCache({
  storageType: '${this.config.layers.browser.storage}',
  maxSize: ${this.config.layers.browser.maxSize},
  compression: ${this.config.layers.browser.compression},
  encryption: ${this.config.layers.browser.encryption}
});

// Initialize cache when module loads
mobileBrowserCache.init().catch(console.warn);
`;
  }

  private async generateApiCacheConfig(): Promise<string> {
    return `// Clear Piggy Mobile API Cache Configuration
// Generated by Clear Piggy Mobile Cache Manager

export interface ApiCacheConfig {
  provider: 'redis' | 'memcached' | 'memory';
  keyPrefix: string;
  ttl: {
    default: number;
    short: number;
    long: number;
  };
  compression: boolean;
  serialization: 'json' | 'msgpack';
  clustering: boolean;
  retryPolicy: {
    retries: number;
    delay: number;
    backoff: number;
  };
}

export const API_CACHE_CONFIG: ApiCacheConfig = {
  provider: '${this.config.layers.api.provider}',
  keyPrefix: '${this.config.layers.api.keyPrefix}',
  ttl: {
    default: ${this.config.ttl.default},
    short: ${this.config.ttl.shortTerm},
    long: ${this.config.ttl.longTerm}
  },
  compression: ${this.config.layers.api.compression},
  serialization: '${this.config.layers.api.serialization}',
  clustering: ${this.config.layers.api.clustering},
  retryPolicy: {
    retries: 3,
    delay: 1000,
    backoff: 2
  }
};

export class MobileApiCache {
  private config: ApiCacheConfig;
  private client: any; // Redis/Memcached client
  private memoryCache: Map<string, any> = new Map();
  private metrics: {
    hits: number;
    misses: number;
    errors: number;
    totalRequests: number;
  };

  constructor(config: ApiCacheConfig) {
    this.config = config;
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0
    };
  }

  async init(): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'redis':
          await this.initRedis();
          break;
        case 'memcached':
          await this.initMemcached();
          break;
        case 'memory':
          // Memory cache is already initialized
          break;
      }
    } catch (error) {
      console.warn('[API Cache] Failed to initialize, falling back to memory cache:', error);
      this.config.provider = 'memory';
    }
  }

  private async initRedis(): Promise<void> {
    // This would initialize Redis client
    // For now, we'll simulate it
    console.log('[API Cache] Redis client initialized');
  }

  private async initMemcached(): Promise<void> {
    // This would initialize Memcached client
    // For now, we'll simulate it
    console.log('[API Cache] Memcached client initialized');
  }

  async get(key: string): Promise<any> {
    this.metrics.totalRequests++;
    
    try {
      const fullKey = this.getFullKey(key);
      let value: any = null;

      switch (this.config.provider) {
        case 'redis':
          value = await this.getFromRedis(fullKey);
          break;
        case 'memcached':
          value = await this.getFromMemcached(fullKey);
          break;
        case 'memory':
          value = this.memoryCache.get(fullKey);
          break;
      }

      if (value !== null && value !== undefined) {
        this.metrics.hits++;
        return this.deserialize(value);
      } else {
        this.metrics.misses++;
        return null;
      }

    } catch (error) {
      this.metrics.errors++;
      console.warn('[API Cache] Get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const serializedValue = this.serialize(value);
      const cacheTtl = ttl || this.config.ttl.default;

      switch (this.config.provider) {
        case 'redis':
          await this.setInRedis(fullKey, serializedValue, cacheTtl);
          break;
        case 'memcached':
          await this.setInMemcached(fullKey, serializedValue, cacheTtl);
          break;
        case 'memory':
          this.memoryCache.set(fullKey, serializedValue);
          // Set timeout for memory cache expiration
          setTimeout(() => {
            this.memoryCache.delete(fullKey);
          }, cacheTtl);
          break;
      }

    } catch (error) {
      this.metrics.errors++;
      console.warn('[API Cache] Set failed:', key, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);

      switch (this.config.provider) {
        case 'redis':
          await this.deleteFromRedis(fullKey);
          break;
        case 'memcached':
          await this.deleteFromMemcached(fullKey);
          break;
        case 'memory':
          this.memoryCache.delete(fullKey);
          break;
      }

    } catch (error) {
      this.metrics.errors++;
      console.warn('[API Cache] Delete failed:', key, error);
    }
  }

  async clear(): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'redis':
          await this.clearRedis();
          break;
        case 'memcached':
          await this.clearMemcached();
          break;
        case 'memory':
          this.memoryCache.clear();
          break;
      }

    } catch (error) {
      this.metrics.errors++;
      console.warn('[API Cache] Clear failed:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'redis':
          await this.invalidateRedisPattern(pattern);
          break;
        case 'memcached':
          // Memcached doesn't support pattern deletion
          await this.clear();
          break;
        case 'memory':
          for (const key of this.memoryCache.keys()) {
            if (this.matchesPattern(key, pattern)) {
              this.memoryCache.delete(key);
            }
          }
          break;
      }

    } catch (error) {
      this.metrics.errors++;
      console.warn('[API Cache] Pattern invalidation failed:', pattern, error);
    }
  }

  private getFullKey(key: string): string {
    return \`\${this.config.keyPrefix}\${key}\`;
  }

  private serialize(value: any): string {
    if (this.config.serialization === 'json') {
      return JSON.stringify(value);
    }
    // For msgpack, you'd use a proper msgpack library
    return JSON.stringify(value);
  }

  private deserialize(value: string): any {
    if (this.config.serialization === 'json') {
      return JSON.parse(value);
    }
    // For msgpack, you'd use a proper msgpack library
    return JSON.parse(value);
  }

  private async getFromRedis(key: string): Promise<any> {
    // Simulate Redis get
    return null;
  }

  private async setInRedis(key: string, value: string, ttl: number): Promise<void> {
    // Simulate Redis set
  }

  private async deleteFromRedis(key: string): Promise<void> {
    // Simulate Redis delete
  }

  private async clearRedis(): Promise<void> {
    // Simulate Redis clear
  }

  private async invalidateRedisPattern(pattern: string): Promise<void> {
    // Simulate Redis pattern deletion
  }

  private async getFromMemcached(key: string): Promise<any> {
    // Simulate Memcached get
    return null;
  }

  private async setInMemcached(key: string, value: string, ttl: number): Promise<void> {
    // Simulate Memcached set
  }

  private async deleteFromMemcached(key: string): Promise<void> {
    // Simulate Memcached delete
  }

  private async clearMemcached(): Promise<void> {
    // Simulate Memcached clear
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\\*/g, '.*')
      .replace(/\\?/g, '.');
    
    const regex = new RegExp(\`^\${regexPattern}$\`);
    return regex.test(key);
  }

  getMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? this.metrics.hits / this.metrics.totalRequests 
      : 0;
    
    return {
      ...this.metrics,
      hitRate,
      errorRate: this.metrics.totalRequests > 0 
        ? this.metrics.errors / this.metrics.totalRequests 
        : 0
    };
  }
}

// Default mobile API cache instance
export const mobileApiCache = new MobileApiCache(API_CACHE_CONFIG);

// Initialize cache when module loads
mobileApiCache.init().catch(console.warn);

// Cache middleware for API requests
export function createCacheMiddleware(options: {
  defaultTTL?: number;
  skipPatterns?: string[];
  keyGenerator?: (req: any) => string;
} = {}) {
  const { 
    defaultTTL = API_CACHE_CONFIG.ttl.default,
    skipPatterns = [],
    keyGenerator = (req) => \`\${req.method}:\${req.url}\`
  } = options;

  return async (req: any, res: any, next: any) => {
    // Skip caching for certain patterns
    if (skipPatterns.some(pattern => req.url.includes(pattern))) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    
    try {
      // Try to get from cache
      const cachedResponse = await mobileApiCache.get(cacheKey);
      
      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cachedResponse);
      }

      // Intercept response to cache it
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache the response
        mobileApiCache.set(cacheKey, data, defaultTTL).catch(console.warn);
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return originalJson.call(this, data);
      };

    } catch (error) {
      console.warn('[Cache Middleware] Error:', error);
    }

    next();
  };
}
`;
  }

  private async writeServiceWorkerScript(script: string): Promise<void> {
    const swPath = join(this.projectPath, 'public', 'sw.js');
    await fs.mkdir(dirname(swPath), { recursive: true });
    await fs.writeFile(swPath, script, 'utf8');
  }

  private async writeCacheStrategiesConfig(config: string): Promise<void> {
    const configPath = join(this.projectPath, 'src', 'utils', 'cache-strategies.ts');
    await fs.mkdir(dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, config, 'utf8');
  }

  private async writeBrowserCacheConfig(config: string): Promise<void> {
    const configPath = join(this.projectPath, 'src', 'utils', 'browser-cache.ts');
    await fs.mkdir(dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, config, 'utf8');
  }

  private async writeApiCacheConfig(config: string): Promise<void> {
    const configPath = join(this.projectPath, 'src', 'utils', 'api-cache.ts');
    await fs.mkdir(dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, config, 'utf8');
  }

  private async setupCacheInvalidation(): Promise<void> {
    const invalidationConfig = {
      rules: this.invalidationRules,
      webhooks: this.config.invalidation.webhooks,
      patterns: this.config.invalidation.patterns
    };

    const configPath = join(this.projectPath, 'src', 'utils', 'cache-invalidation.json');
    await fs.mkdir(dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(invalidationConfig, null, 2), 'utf8');
  }

  private async generateCacheMonitoring(): Promise<void> {
    const monitoringScript = `// Clear Piggy Mobile Cache Monitoring
// Generated by Clear Piggy Mobile Cache Manager

export class CacheMonitor {
  private metrics: Map<string, any> = new Map();
  private alertThresholds = {
    hitRate: 0.7,
    errorRate: 0.05,
    responseTime: 1000
  };

  recordMetric(type: string, value: any): void {
    const timestamp = Date.now();
    
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    this.metrics.get(type).push({
      value,
      timestamp
    });
    
    // Keep only last 1000 entries
    const entries = this.metrics.get(type);
    if (entries.length > 1000) {
      entries.splice(0, entries.length - 1000);
    }
  }

  getMetrics(type: string, duration: number = 3600000): any[] {
    const cutoff = Date.now() - duration;
    const entries = this.metrics.get(type) || [];
    
    return entries.filter(entry => entry.timestamp > cutoff);
  }

  checkAlerts(): string[] {
    const alerts: string[] = [];
    
    // Check hit rate
    const recentHits = this.getMetrics('hits', 300000); // 5 minutes
    const recentMisses = this.getMetrics('misses', 300000);
    
    if (recentHits.length + recentMisses.length > 0) {
      const hitRate = recentHits.length / (recentHits.length + recentMisses.length);
      
      if (hitRate < this.alertThresholds.hitRate) {
        alerts.push(\`Low cache hit rate: \${(hitRate * 100).toFixed(1)}%\`);
      }
    }
    
    return alerts;
  }
}

export const cacheMonitor = new CacheMonitor();
`;

    const monitoringPath = join(this.projectPath, 'src', 'utils', 'cache-monitoring.ts');
    await fs.mkdir(dirname(monitoringPath), { recursive: true });
    await fs.writeFile(monitoringPath, monitoringScript, 'utf8');
  }

  private initializeMetrics(): CacheMetrics {
    return {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      mobileHitRate: 0,
      topMissedKeys: [],
      performanceGain: 0
    };
  }

  private setupInvalidationRules(): void {
    this.invalidationRules = [
      {
        pattern: 'user:*:transactions',
        triggers: ['transaction.created', 'transaction.updated', 'transaction.deleted'],
        scope: 'all',
        cascade: true
      },
      {
        pattern: 'user:*:accounts',
        triggers: ['account.updated', 'account.balance_changed'],
        scope: 'all',
        cascade: true
      },
      {
        pattern: 'user:*:budgets',
        triggers: ['budget.created', 'budget.updated', 'budget.deleted'],
        scope: 'mobile',
        cascade: false
      }
    ];
  }

  // Public API methods
  async invalidateCache(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      this.emit('cache:invalidate', { pattern });
    }
  }

  async getMetrics(): Promise<CacheMetrics> {
    return this.metrics;
  }

  async optimizeCache(): Promise<{
    recommendedChanges: string[];
    expectedImprovement: number;
  }> {
    const recommendations: string[] = [];
    let expectedImprovement = 0;

    // Analyze current performance
    if (this.metrics.hitRate < 0.8) {
      recommendations.push('Increase TTL for frequently accessed data');
      expectedImprovement += 15;
    }

    if (this.metrics.mobileHitRate < this.metrics.hitRate) {
      recommendations.push('Optimize mobile-specific caching strategies');
      expectedImprovement += 20;
    }

    return {
      recommendedChanges: recommendations,
      expectedImprovement
    };
  }
}