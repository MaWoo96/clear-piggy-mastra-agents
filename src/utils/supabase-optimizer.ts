import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';
import {
  SupabaseIntegrationConfig,
  SupabaseEdgeFunctionOptimization,
  EdgeFunctionOptimization,
  ResponseOptimization,
  SupabaseRLSUpdate,
  RLSOptimization,
  SUPABASE_MOBILE_OPTIMIZATIONS
} from '../types/integration-agent-types';

export interface SupabaseProject {
  ref: string;
  name: string;
  organization_id: string;
  region: string;
  status: string;
}

export interface EdgeFunction {
  id: string;
  name: string;
  slug: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
  verify_jwt?: boolean;
}

export interface RLSPolicy {
  id: string;
  schema_name: string;
  table_name: string;
  policy_name: string;
  definition: string;
  check?: string;
  roles: string[];
  cmd: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  permissive: 'PERMISSIVE' | 'RESTRICTIVE';
}

export interface DatabaseTable {
  schema: string;
  name: string;
  columns: TableColumn[];
  indexes: TableIndex[];
  policies: RLSPolicy[];
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primary_key: boolean;
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
  method: 'btree' | 'hash' | 'gin' | 'gist';
}

export class SupabaseOptimizer extends EventEmitter {
  private config: SupabaseIntegrationConfig;
  private projectPath: string;
  private functionsPath: string;

  constructor(projectPath: string, config: SupabaseIntegrationConfig) {
    super();
    this.projectPath = projectPath;
    this.config = config;
    this.functionsPath = join(projectPath, config.edgeFunctionsPath);
  }

  async optimizeEdgeFunctions(): Promise<SupabaseEdgeFunctionOptimization[]> {
    const optimizations: SupabaseEdgeFunctionOptimization[] = [];
    
    try {
      // Get all edge functions
      const functions = await this.getEdgeFunctions();
      
      for (const func of functions) {
        const optimization = await this.optimizeEdgeFunction(func);
        if (optimization) {
          optimizations.push(optimization);
        }
      }
      
      this.emit('functions:optimized', optimizations);
      return optimizations;
      
    } catch (error) {
      this.emit('optimization:error', error);
      throw new Error(`Failed to optimize edge functions: ${(error as Error).message}`);
    }
  }

  async optimizeEdgeFunction(functionName: string): Promise<SupabaseEdgeFunctionOptimization | null> {
    try {
      const functionPath = join(this.functionsPath, functionName);
      const indexPath = join(functionPath, 'index.ts');
      
      // Check if function exists
      try {
        await fs.access(indexPath);
      } catch {
        return null;
      }
      
      // Read original function
      const originalCode = await fs.readFile(indexPath, 'utf8');
      
      // Apply mobile optimizations
      const optimizedCode = await this.applyMobileOptimizations(originalCode, functionName);
      
      // Write optimized function
      await fs.writeFile(indexPath, optimizedCode, 'utf8');
      
      // Generate optimization report
      const optimization: SupabaseEdgeFunctionOptimization = {
        functionName,
        functionPath,
        optimizations: await this.getAppliedOptimizations(originalCode, optimizedCode),
        mobileSpecificLogic: this.hasMobileSpecificLogic(optimizedCode),
        compressionEnabled: this.config.responseOptimization.enableCompression,
        cachingHeaders: this.generateCachingHeaders(),
        responseOptimizations: this.getResponseOptimizations()
      };
      
      this.emit('function:optimized', optimization);
      return optimization;
      
    } catch (error) {
      this.emit('function:error', { functionName, error });
      return null;
    }
  }

  private async applyMobileOptimizations(code: string, functionName: string): Promise<string> {
    let optimizedCode = code;
    
    // Add mobile detection utilities
    optimizedCode = this.addMobileDetection(optimizedCode);
    
    // Add response compression
    if (this.config.responseOptimization.enableCompression) {
      optimizedCode = this.addResponseCompression(optimizedCode);
    }
    
    // Add response optimization
    if (this.config.responseOptimization.minifyResponses) {
      optimizedCode = this.addResponseMinification(optimizedCode);
    }
    
    // Add mobile-specific caching
    optimizedCode = this.addMobileCaching(optimizedCode);
    
    // Add mobile-specific error handling
    optimizedCode = this.addMobileErrorHandling(optimizedCode);
    
    // Apply function-specific optimizations
    optimizedCode = await this.applyFunctionSpecificOptimizations(optimizedCode, functionName);
    
    return optimizedCode;
  }

  private addMobileDetection(code: string): string {
    const mobileDetectionCode = `
// Mobile detection utilities
const isMobileRequest = (request: Request): boolean => {
  const userAgent = request.headers.get('user-agent') || '';
  const mobileRegex = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
};

const getMobileDeviceType = (request: Request): 'phone' | 'tablet' | 'desktop' => {
  const userAgent = request.headers.get('user-agent') || '';
  
  if (/iPhone|iPod|Android.*Mobile/i.test(userAgent)) {
    return 'phone';
  } else if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) {
    return 'tablet';
  }
  
  return 'desktop';
};

const getMobileViewportSize = (request: Request): { width: number; height: number } => {
  const deviceType = getMobileDeviceType(request);
  
  switch (deviceType) {
    case 'phone':
      return { width: 375, height: 667 }; // iPhone-like
    case 'tablet':
      return { width: 768, height: 1024 }; // iPad-like
    default:
      return { width: 1920, height: 1080 }; // Desktop
  }
};

`;
    
    // Insert mobile detection at the beginning of the function
    const importEnd = code.lastIndexOf('import');
    const insertPos = importEnd === -1 ? 0 : code.indexOf('\n', importEnd) + 1;
    
    return code.slice(0, insertPos) + mobileDetectionCode + code.slice(insertPos);
  }

  private addResponseCompression(code: string): string {
    const compressionCode = `
// Response compression utilities
const shouldCompressResponse = (data: any, isMobile: boolean): boolean => {
  if (!isMobile) return false;
  
  const dataString = JSON.stringify(data);
  return dataString.length > 1024; // Compress responses > 1KB for mobile
};

const compressResponse = async (data: any): Promise<any> => {
  // Simple compression - remove null/undefined values and whitespace
  const compressed = JSON.parse(JSON.stringify(data, (key, value) => {
    return value === null || value === undefined ? undefined : value;
  }));
  
  return compressed;
};

const addCompressionHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set('Content-Encoding', 'gzip');
  headers.set('Vary', 'Accept-Encoding, User-Agent');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

`;
    
    return this.insertCodeBeforeExport(code, compressionCode);
  }

  private addResponseMinification(code: string): string {
    const minificationCode = `
// Response minification utilities
const minifyResponseData = (data: any, isMobile: boolean): any => {
  if (!isMobile || typeof data !== 'object' || data === null) {
    return data;
  }
  
  // Remove unnecessary fields for mobile
  const mobileOptimized = { ...data };
  
  // Remove verbose fields
  if (Array.isArray(mobileOptimized)) {
    return mobileOptimized.map(item => minifyResponseData(item, isMobile));
  }
  
  // Remove null/undefined values
  Object.keys(mobileOptimized).forEach(key => {
    if (mobileOptimized[key] === null || mobileOptimized[key] === undefined) {
      delete mobileOptimized[key];
    } else if (typeof mobileOptimized[key] === 'object') {
      mobileOptimized[key] = minifyResponseData(mobileOptimized[key], isMobile);
    }
  });
  
  return mobileOptimized;
};

const getMobileFields = (tableName: string): string[] => {
  const fieldMappings = {
    'transactions': ['id', 'amount', 'date', 'description', 'category', 'account_id'],
    'accounts': ['id', 'name', 'type', 'balance', 'currency'],
    'budgets': ['id', 'name', 'amount', 'spent', 'category', 'period'],
    'categories': ['id', 'name', 'color', 'icon']
  };
  
  return fieldMappings[tableName] || [];
};

`;
    
    return this.insertCodeBeforeExport(code, minificationCode);
  }

  private addMobileCaching(code: string): string {
    const cachingCode = `
// Mobile caching utilities
const getMobileCacheHeaders = (isMobile: boolean, cacheStrategy: string = 'moderate'): HeadersInit => {
  if (!isMobile) {
    return {
      'Cache-Control': 'no-cache'
    };
  }
  
  const strategies = {
    'aggressive': {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Vary': 'User-Agent, Accept-Encoding',
      'ETag': \`mobile-\${Date.now()}\`
    },
    'moderate': {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'Vary': 'User-Agent, Accept-Encoding'
    },
    'conservative': {
      'Cache-Control': 'public, max-age=60',
      'Vary': 'User-Agent'
    }
  };
  
  return strategies[cacheStrategy] || strategies.moderate;
};

const shouldCacheForMobile = (request: Request): boolean => {
  const method = request.method.toUpperCase();
  const isMobile = isMobileRequest(request);
  
  return isMobile && method === 'GET';
};

`;
    
    return this.insertCodeBeforeExport(code, cachingCode);
  }

  private addMobileErrorHandling(code: string): string {
    const errorHandlingCode = `
// Mobile-specific error handling
const createMobileErrorResponse = (error: Error, isMobile: boolean): Response => {
  const errorData = {
    error: true,
    message: isMobile ? 'Something went wrong' : error.message,
    ...(isMobile && { 
      mobile: true,
      retry: true,
      timestamp: Date.now()
    })
  };
  
  return new Response(JSON.stringify(errorData), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      ...(isMobile && getMobileCacheHeaders(true, 'conservative'))
    }
  });
};

const handleMobileTimeout = (isMobile: boolean): Response => {
  if (!isMobile) {
    return new Response('Request timeout', { status: 408 });
  }
  
  return new Response(JSON.stringify({
    error: true,
    message: 'Request is taking longer than usual. Please try again.',
    mobile: true,
    retry: true,
    retryAfter: 30
  }), {
    status: 408,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': '30'
    }
  });
};

`;
    
    return this.insertCodeBeforeExport(code, errorHandlingCode);
  }

  private async applyFunctionSpecificOptimizations(
    code: string, 
    functionName: string
  ): Promise<string> {
    if (SUPABASE_MOBILE_OPTIMIZATIONS.edgeFunctions.includes(functionName)) {
      // Apply specific optimizations for known mobile functions
      switch (functionName) {
        case 'mobile-transactions':
          return this.optimizeTransactionFunction(code);
        case 'mobile-accounts':
          return this.optimizeAccountFunction(code);
        case 'mobile-auth':
          return this.optimizeAuthFunction(code);
        case 'mobile-sync':
          return this.optimizeSyncFunction(code);
        default:
          return code;
      }
    }
    
    return code;
  }

  private optimizeTransactionFunction(code: string): string {
    const transactionOptimizations = `
// Transaction-specific mobile optimizations
const optimizeTransactionResponse = (transactions: any[], isMobile: boolean): any[] => {
  if (!isMobile) return transactions;
  
  return transactions.map(transaction => ({
    id: transaction.id,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description?.substring(0, 50) || '',
    category: transaction.category,
    account_id: transaction.account_id,
    // Remove verbose fields for mobile
    ...(transaction.location && { location: transaction.location.name }),
    ...(transaction.merchant && { merchant: transaction.merchant.name })
  }));
};

const getTransactionPageSize = (isMobile: boolean): number => {
  return isMobile ? 20 : 50; // Smaller page size for mobile
};

`;
    
    return this.insertCodeBeforeExport(code, transactionOptimizations);
  }

  private optimizeAccountFunction(code: string): string {
    const accountOptimizations = `
// Account-specific mobile optimizations
const optimizeAccountResponse = (accounts: any[], isMobile: boolean): any[] => {
  if (!isMobile) return accounts;
  
  return accounts.map(account => ({
    id: account.id,
    name: account.name,
    type: account.type,
    subtype: account.subtype,
    balance: account.balance,
    currency: account.currency || 'USD',
    // Simplified for mobile
    status: account.status === 'active' ? 'active' : 'inactive'
  }));
};

const shouldIncludeAccountHistory = (isMobile: boolean): boolean => {
  return !isMobile; // Skip history for mobile to reduce payload
};

`;
    
    return this.insertCodeBeforeExport(code, accountOptimizations);
  }

  private optimizeAuthFunction(code: string): string {
    const authOptimizations = `
// Auth-specific mobile optimizations
const getMobileAuthResponse = (user: any, isMobile: boolean): any => {
  if (!isMobile) return user;
  
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0],
    avatar: user.user_metadata?.avatar_url,
    mobile_verified: user.phone_confirmed_at !== null,
    last_sign_in: user.last_sign_in_at
  };
};

const getMobileSessionDuration = (): number => {
  return 7 * 24 * 60 * 60; // 7 days for mobile sessions
};

`;
    
    return this.insertCodeBeforeExport(code, authOptimizations);
  }

  private optimizeSyncFunction(code: string): string {
    const syncOptimizations = `
// Sync-specific mobile optimizations
const getMobileSyncPayload = (data: any, lastSync: Date, isMobile: boolean): any => {
  if (!isMobile) return data;
  
  // Only sync data changed since last sync
  const syncTimestamp = lastSync.getTime();
  
  return {
    transactions: data.transactions?.filter(t => 
      new Date(t.updated_at).getTime() > syncTimestamp
    ) || [],
    accounts: data.accounts?.filter(a => 
      new Date(a.updated_at).getTime() > syncTimestamp
    ) || [],
    budgets: data.budgets?.filter(b => 
      new Date(b.updated_at).getTime() > syncTimestamp
    ) || [],
    // Include sync metadata
    sync_timestamp: Date.now(),
    full_sync: false,
    mobile_optimized: true
  };
};

const getMobileSyncBatchSize = (): number => {
  return 100; // Smaller batches for mobile sync
};

`;
    
    return this.insertCodeBeforeExport(code, syncOptimizations);
  }

  async updateRLSPolicies(): Promise<SupabaseRLSUpdate[]> {
    const updates: SupabaseRLSUpdate[] = [];
    
    if (!this.config.updateRLSPolicies) {
      return updates;
    }
    
    try {
      // Get current RLS policies
      const tables = SUPABASE_MOBILE_OPTIMIZATIONS.rlsTables;
      
      for (const tableName of tables) {
        const update = await this.updateTableRLSPolicies(tableName);
        if (update) {
          updates.push(update);
        }
      }
      
      this.emit('rls:updated', updates);
      return updates;
      
    } catch (error) {
      this.emit('rls:error', error);
      throw new Error(`Failed to update RLS policies: ${(error as Error).message}`);
    }
  }

  private async updateTableRLSPolicies(tableName: string): Promise<SupabaseRLSUpdate | null> {
    try {
      // Generate mobile-optimized RLS policies
      const mobileOptimizations = this.generateMobileRLSOptimizations(tableName);
      
      if (mobileOptimizations.length === 0) {
        return null;
      }
      
      // Create RLS update
      const update: SupabaseRLSUpdate = {
        tableName,
        policyName: `mobile_optimized_${tableName}_policy`,
        policyType: 'select',
        mobileOptimizations,
        performanceImpact: this.calculateRLSPerformanceImpact(mobileOptimizations),
        securityImplications: this.getRLSSecurityImplications(mobileOptimizations)
      };
      
      return update;
      
    } catch (error) {
      return null;
    }
  }

  private generateMobileRLSOptimizations(tableName: string): RLSOptimization[] {
    const optimizations: RLSOptimization[] = [];
    
    switch (tableName) {
      case 'transactions':
        optimizations.push({
          optimization: 'Index on user_id and date for mobile queries',
          sqlCondition: 'user_id = auth.uid() AND date >= CURRENT_DATE - INTERVAL \'30 days\'',
          mobileSpecific: true,
          indexRequired: true
        });
        break;
        
      case 'accounts':
        optimizations.push({
          optimization: 'Limit to active accounts for mobile',
          sqlCondition: 'user_id = auth.uid() AND status = \'active\'',
          mobileSpecific: true,
          indexRequired: false
        });
        break;
        
      case 'budgets':
        optimizations.push({
          optimization: 'Current month budgets for mobile',
          sqlCondition: 'user_id = auth.uid() AND period_start <= CURRENT_DATE AND period_end >= CURRENT_DATE',
          mobileSpecific: true,
          indexRequired: true
        });
        break;
        
      default:
        optimizations.push({
          optimization: 'Basic user isolation',
          sqlCondition: 'user_id = auth.uid()',
          mobileSpecific: false,
          indexRequired: false
        });
    }
    
    return optimizations;
  }

  async createMobileDatabaseIndexes(): Promise<string[]> {
    const indexes: string[] = [];
    
    try {
      const tables = SUPABASE_MOBILE_OPTIMIZATIONS.rlsTables;
      
      for (const tableName of tables) {
        const tableIndexes = this.generateMobileIndexes(tableName);
        indexes.push(...tableIndexes);
      }
      
      // Write indexes to migration file
      if (indexes.length > 0) {
        await this.createIndexMigration(indexes);
      }
      
      this.emit('indexes:created', indexes);
      return indexes;
      
    } catch (error) {
      this.emit('indexes:error', error);
      throw error;
    }
  }

  private generateMobileIndexes(tableName: string): string[] {
    const indexes: string[] = [];
    
    switch (tableName) {
      case 'transactions':
        indexes.push(
          `CREATE INDEX IF NOT EXISTS idx_transactions_mobile_query 
           ON transactions(user_id, date DESC) 
           WHERE date >= CURRENT_DATE - INTERVAL '90 days';`
        );
        indexes.push(
          `CREATE INDEX IF NOT EXISTS idx_transactions_category_mobile 
           ON transactions(user_id, category, date DESC);`
        );
        break;
        
      case 'accounts':
        indexes.push(
          `CREATE INDEX IF NOT EXISTS idx_accounts_mobile_active 
           ON accounts(user_id, status) 
           WHERE status = 'active';`
        );
        break;
        
      case 'budgets':
        indexes.push(
          `CREATE INDEX IF NOT EXISTS idx_budgets_mobile_current 
           ON budgets(user_id, period_start, period_end) 
           WHERE period_end >= CURRENT_DATE;`
        );
        break;
    }
    
    return indexes;
  }

  private async createIndexMigration(indexes: string[]): Promise<void> {
    const migrationContent = `
-- Mobile optimization indexes migration
-- Generated by Clear Piggy Mobile Integration Agent

${indexes.join('\n\n')}

-- Add comments for mobile optimization context
COMMENT ON INDEX idx_transactions_mobile_query IS 'Optimized for mobile transaction queries - last 90 days';
COMMENT ON INDEX idx_accounts_mobile_active IS 'Optimized for mobile account listing - active accounts only';
COMMENT ON INDEX idx_budgets_mobile_current IS 'Optimized for mobile budget display - current period only';
`;
    
    const migrationsDir = join(this.projectPath, 'supabase', 'migrations');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const migrationFile = join(migrationsDir, `${timestamp}_mobile_optimization_indexes.sql`);
    
    await fs.mkdir(migrationsDir, { recursive: true });
    await fs.writeFile(migrationFile, migrationContent, 'utf8');
  }

  // Helper methods
  private async getEdgeFunctions(): Promise<string[]> {
    try {
      const functions: string[] = [];
      const entries = await fs.readdir(this.functionsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const indexPath = join(this.functionsPath, entry.name, 'index.ts');
          try {
            await fs.access(indexPath);
            functions.push(entry.name);
          } catch {
            // Not a valid edge function
          }
        }
      }
      
      return functions;
    } catch {
      return [];
    }
  }

  private async getAppliedOptimizations(
    originalCode: string, 
    optimizedCode: string
  ): Promise<EdgeFunctionOptimization[]> {
    const optimizations: EdgeFunctionOptimization[] = [];
    
    // Analyze what optimizations were applied
    if (optimizedCode.includes('isMobileRequest')) {
      optimizations.push({
        type: 'mobile-detection',
        description: 'Added mobile device detection',
        implementation: 'User-Agent header analysis',
        performanceImpact: 5,
        mobileSpecific: true
      });
    }
    
    if (optimizedCode.includes('compressResponse')) {
      optimizations.push({
        type: 'response-compression',
        description: 'Added response compression for mobile',
        implementation: 'Conditional compression based on payload size',
        performanceImpact: 25,
        mobileSpecific: true
      });
    }
    
    if (optimizedCode.includes('minifyResponseData')) {
      optimizations.push({
        type: 'payload-reduction',
        description: 'Added response payload optimization',
        implementation: 'Field filtering and null value removal',
        performanceImpact: 20,
        mobileSpecific: true
      });
    }
    
    if (optimizedCode.includes('getMobileCacheHeaders')) {
      optimizations.push({
        type: 'caching',
        description: 'Added mobile-specific caching headers',
        implementation: 'Adaptive cache strategy based on device type',
        performanceImpact: 30,
        mobileSpecific: true
      });
    }
    
    if (optimizedCode.includes('createMobileErrorResponse')) {
      optimizations.push({
        type: 'error-handling',
        description: 'Enhanced error handling for mobile',
        implementation: 'Mobile-friendly error messages and retry logic',
        performanceImpact: 10,
        mobileSpecific: true
      });
    }
    
    return optimizations;
  }

  private hasMobileSpecificLogic(code: string): boolean {
    const mobileIndicators = [
      'isMobileRequest',
      'getMobileDeviceType',
      'mobileOptimized',
      'mobile: true',
      'User-Agent'
    ];
    
    return mobileIndicators.some(indicator => code.includes(indicator));
  }

  private generateCachingHeaders(): { [key: string]: string } {
    return {
      ...SUPABASE_MOBILE_OPTIMIZATIONS.cacheHeaders,
      'X-Mobile-Optimized': 'true',
      'X-Cache-Strategy': this.config.cachingStrategy
    };
  }

  private getResponseOptimizations(): ResponseOptimization[] {
    const optimizations: ResponseOptimization[] = [];
    
    if (this.config.responseOptimization.removeUnnecessaryFields) {
      optimizations.push({
        field: '*',
        action: 'remove',
        condition: 'value === null || value === undefined',
        mobileOnly: true
      });
    }
    
    if (this.config.responseOptimization.enableCompression) {
      optimizations.push({
        field: 'response',
        action: 'compress',
        condition: 'isMobile && responseSize > 1024',
        mobileOnly: true
      });
    }
    
    if (this.config.responseOptimization.minifyResponses) {
      optimizations.push({
        field: 'data',
        action: 'transform',
        condition: 'isMobile',
        mobileOnly: true
      });
    }
    
    return optimizations;
  }

  private calculateRLSPerformanceImpact(optimizations: RLSOptimization[]): number {
    let impact = 0;
    
    for (const opt of optimizations) {
      if (opt.indexRequired) {
        impact += 20; // Index-backed queries are faster
      }
      if (opt.mobileSpecific) {
        impact += 10; // Mobile-specific optimizations
      }
    }
    
    return Math.min(impact, 100);
  }

  private getRLSSecurityImplications(optimizations: RLSOptimization[]): string[] {
    const implications: string[] = [];
    
    for (const opt of optimizations) {
      if (opt.sqlCondition.includes('auth.uid()')) {
        implications.push('Maintains user isolation through auth.uid()');
      }
      if (opt.sqlCondition.includes('status =')) {
        implications.push('Restricts access based on record status');
      }
      if (opt.sqlCondition.includes('date >=') || opt.sqlCondition.includes('INTERVAL')) {
        implications.push('Time-based access restrictions applied');
      }
    }
    
    return implications;
  }

  private insertCodeBeforeExport(code: string, codeToInsert: string): string {
    // Find the export statement
    const exportMatch = code.match(/export\s+default\s+async\s+function|export\s*\{.*\}/);
    
    if (exportMatch && exportMatch.index !== undefined) {
      return code.slice(0, exportMatch.index) + codeToInsert + code.slice(exportMatch.index);
    }
    
    // If no export found, append at the end
    return code + '\n' + codeToInsert;
  }
}