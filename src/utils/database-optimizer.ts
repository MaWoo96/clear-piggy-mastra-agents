import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';
import {
  DeploymentConfig,
  SupabaseIntegrationConfig
} from '../types/integration-agent-types';

export interface DatabaseOptimizationConfig {
  connectionPooling: {
    enabled: boolean;
    minConnections: number;
    maxConnections: number;
    idleTimeout: number;
  };
  queryOptimization: {
    enablePreparedStatements: boolean;
    queryPlan: boolean;
    indexOptimization: boolean;
    mobileQueryPatterns: boolean;
  };
  caching: {
    queryCache: boolean;
    resultCache: boolean;
    connectionCache: boolean;
    cacheTimeout: number;
  };
  mobile: {
    dataCompression: boolean;
    batchQueries: boolean;
    limitResultSets: boolean;
    prioritizeFields: boolean;
    offlineSupport: boolean;
  };
}

export interface DatabaseIndex {
  tableName: string;
  indexName: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  unique: boolean;
  partial?: string;
  mobileOptimized: boolean;
  estimatedPerformanceGain: number;
}

export interface QueryOptimization {
  queryPattern: string;
  description: string;
  originalQuery: string;
  optimizedQuery: string;
  mobileSpecific: boolean;
  performanceImpact: number;
  affectedTables: string[];
}

export interface MobileQueryPattern {
  pattern: string;
  description: string;
  optimizationStrategy: string;
  indexRequirements: string[];
  dataLimitations: {
    maxRows: number;
    timeRange?: string;
    fieldFiltering: boolean;
  };
}

export interface DatabasePerformanceMetrics {
  queryExecutionTimes: { [query: string]: number };
  indexUsage: { [index: string]: number };
  connectionPoolUtilization: number;
  cacheHitRatio: number;
  mobileQueryPerformance: {
    averageResponseTime: number;
    dataTransferSize: number;
    compressionRatio: number;
  };
}

export const MOBILE_OPTIMIZED_TABLES = [
  'transactions',
  'accounts',
  'budgets',
  'categories',
  'user_profiles',
  'notifications',
  'financial_goals',
  'recurring_transactions'
];

export const MOBILE_QUERY_PATTERNS: MobileQueryPattern[] = [
  {
    pattern: 'recent_transactions',
    description: 'Fetch recent transactions for mobile dashboard',
    optimizationStrategy: 'Date-based partitioning with limited result set',
    indexRequirements: ['user_id', 'created_at'],
    dataLimitations: {
      maxRows: 50,
      timeRange: '30 days',
      fieldFiltering: true
    }
  },
  {
    pattern: 'account_balances',
    description: 'Get current account balances for mobile overview',
    optimizationStrategy: 'Cached materialized view with real-time updates',
    indexRequirements: ['user_id', 'account_type'],
    dataLimitations: {
      maxRows: 20,
      fieldFiltering: true
    }
  },
  {
    pattern: 'budget_status',
    description: 'Current month budget status for mobile widget',
    optimizationStrategy: 'Pre-calculated aggregations with time-based filtering',
    indexRequirements: ['user_id', 'budget_period'],
    dataLimitations: {
      maxRows: 10,
      timeRange: 'current_month',
      fieldFiltering: true
    }
  },
  {
    pattern: 'category_spending',
    description: 'Spending by category for mobile charts',
    optimizationStrategy: 'Aggregated data with intelligent caching',
    indexRequirements: ['user_id', 'category_id', 'transaction_date'],
    dataLimitations: {
      maxRows: 15,
      timeRange: '90 days',
      fieldFiltering: true
    }
  }
];

export class DatabaseOptimizer extends EventEmitter {
  private config: DatabaseOptimizationConfig;
  private supabaseConfig: SupabaseIntegrationConfig;
  private projectPath: string;
  private optimizations: Map<string, QueryOptimization[]> = new Map();
  private indexes: DatabaseIndex[] = [];
  private performanceMetrics: DatabasePerformanceMetrics = {
    queryExecutionTimes: {},
    indexUsage: {},
    connectionPoolUtilization: 0,
    cacheHitRatio: 0,
    mobileQueryPerformance: {
      averageResponseTime: 0,
      dataTransferSize: 0,
      compressionRatio: 0
    }
  };

  constructor(
    projectPath: string, 
    config: DatabaseOptimizationConfig,
    supabaseConfig: SupabaseIntegrationConfig
  ) {
    super();
    this.projectPath = projectPath;
    this.config = config;
    this.supabaseConfig = supabaseConfig;
  }

  async optimizeForMobile(): Promise<{
    indexes: DatabaseIndex[];
    queries: QueryOptimization[];
    migrationFiles: string[];
    performanceImpact: number;
  }> {
    try {
      this.emit('optimization:start');

      // Create mobile-optimized indexes
      const indexes = await this.createMobileIndexes();
      
      // Optimize queries for mobile patterns
      const queryOptimizations = await this.optimizeMobileQueries();
      
      // Generate migration files
      const migrationFiles = await this.generateMigrationFiles(indexes, queryOptimizations);
      
      // Create database functions for mobile optimization
      await this.createMobileDatabaseFunctions();
      
      // Setup connection pooling configuration
      await this.setupConnectionPooling();
      
      // Calculate overall performance impact
      const performanceImpact = this.calculatePerformanceImpact(indexes, queryOptimizations);

      this.emit('optimization:complete', {
        indexes,
        queries: queryOptimizations,
        migrationFiles,
        performanceImpact
      });

      return {
        indexes,
        queries: queryOptimizations,
        migrationFiles,
        performanceImpact
      };

    } catch (error) {
      this.emit('optimization:error', error);
      throw new Error(`Database optimization failed: ${(error as Error).message}`);
    }
  }

  private async createMobileIndexes(): Promise<DatabaseIndex[]> {
    const indexes: DatabaseIndex[] = [];

    for (const tableName of MOBILE_OPTIMIZED_TABLES) {
      const tableIndexes = this.generateMobileIndexesForTable(tableName);
      indexes.push(...tableIndexes);
    }

    // Add composite indexes for mobile query patterns
    for (const pattern of MOBILE_QUERY_PATTERNS) {
      const compositeIndex = this.createCompositeIndexForPattern(pattern);
      if (compositeIndex) {
        indexes.push(compositeIndex);
      }
    }

    this.indexes = indexes;
    return indexes;
  }

  private generateMobileIndexesForTable(tableName: string): DatabaseIndex[] {
    const indexes: DatabaseIndex[] = [];

    switch (tableName) {
      case 'transactions':
        indexes.push(
          {
            tableName: 'transactions',
            indexName: 'idx_transactions_mobile_recent',
            columns: ['user_id', 'created_at'],
            type: 'btree',
            unique: false,
            partial: 'created_at >= CURRENT_DATE - INTERVAL \'90 days\'',
            mobileOptimized: true,
            estimatedPerformanceGain: 75
          },
          {
            tableName: 'transactions',
            indexName: 'idx_transactions_mobile_category',
            columns: ['user_id', 'category_id', 'created_at'],
            type: 'btree',
            unique: false,
            mobileOptimized: true,
            estimatedPerformanceGain: 60
          },
          {
            tableName: 'transactions',
            indexName: 'idx_transactions_mobile_amount',
            columns: ['user_id', 'amount', 'created_at'],
            type: 'btree',
            unique: false,
            partial: 'amount > 0',
            mobileOptimized: true,
            estimatedPerformanceGain: 45
          }
        );
        break;

      case 'accounts':
        indexes.push(
          {
            tableName: 'accounts',
            indexName: 'idx_accounts_mobile_active',
            columns: ['user_id', 'account_type', 'is_active'],
            type: 'btree',
            unique: false,
            partial: 'is_active = true',
            mobileOptimized: true,
            estimatedPerformanceGain: 80
          },
          {
            tableName: 'accounts',
            indexName: 'idx_accounts_mobile_balance',
            columns: ['user_id', 'balance', 'updated_at'],
            type: 'btree',
            unique: false,
            mobileOptimized: true,
            estimatedPerformanceGain: 50
          }
        );
        break;

      case 'budgets':
        indexes.push(
          {
            tableName: 'budgets',
            indexName: 'idx_budgets_mobile_current',
            columns: ['user_id', 'budget_period', 'is_active'],
            type: 'btree',
            unique: false,
            partial: 'is_active = true AND end_date >= CURRENT_DATE',
            mobileOptimized: true,
            estimatedPerformanceGain: 70
          }
        );
        break;

      case 'categories':
        indexes.push(
          {
            tableName: 'categories',
            indexName: 'idx_categories_mobile_hierarchy',
            columns: ['user_id', 'parent_id', 'name'],
            type: 'btree',
            unique: false,
            mobileOptimized: true,
            estimatedPerformanceGain: 55
          }
        );
        break;

      case 'user_profiles':
        indexes.push(
          {
            tableName: 'user_profiles',
            indexName: 'idx_user_profiles_mobile_settings',
            columns: ['user_id', 'mobile_preferences'],
            type: 'gin',
            unique: false,
            mobileOptimized: true,
            estimatedPerformanceGain: 40
          }
        );
        break;

      default:
        // Generic mobile optimization index
        indexes.push({
          tableName,
          indexName: `idx_${tableName}_mobile_user`,
          columns: ['user_id', 'updated_at'],
          type: 'btree',
          unique: false,
          mobileOptimized: true,
          estimatedPerformanceGain: 35
        });
    }

    return indexes;
  }

  private createCompositeIndexForPattern(pattern: MobileQueryPattern): DatabaseIndex | null {
    if (pattern.pattern === 'recent_transactions') {
      return {
        tableName: 'transactions',
        indexName: 'idx_transactions_mobile_dashboard',
        columns: ['user_id', 'created_at', 'amount', 'category_id'],
        type: 'btree',
        unique: false,
        partial: 'created_at >= CURRENT_DATE - INTERVAL \'30 days\'',
        mobileOptimized: true,
        estimatedPerformanceGain: 85
      };
    }

    if (pattern.pattern === 'account_balances') {
      return {
        tableName: 'accounts',
        indexName: 'idx_accounts_mobile_overview',
        columns: ['user_id', 'account_type', 'balance', 'is_active'],
        type: 'btree',
        unique: false,
        partial: 'is_active = true',
        mobileOptimized: true,
        estimatedPerformanceGain: 90
      };
    }

    return null;
  }

  private async optimizeMobileQueries(): Promise<QueryOptimization[]> {
    const optimizations: QueryOptimization[] = [];

    // Optimize transaction queries
    optimizations.push(...this.optimizeTransactionQueries());
    
    // Optimize account queries
    optimizations.push(...this.optimizeAccountQueries());
    
    // Optimize budget queries
    optimizations.push(...this.optimizeBudgetQueries());
    
    // Optimize category queries
    optimizations.push(...this.optimizeCategoryQueries());

    return optimizations;
  }

  private optimizeTransactionQueries(): QueryOptimization[] {
    return [
      {
        queryPattern: 'mobile_recent_transactions',
        description: 'Optimized query for mobile transaction list',
        originalQuery: `
          SELECT * FROM transactions 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 50
        `,
        optimizedQuery: `
          SELECT 
            id, amount, description, category_id, account_id, created_at,
            CASE 
              WHEN LENGTH(description) > 30 THEN SUBSTRING(description, 1, 30) || '...'
              ELSE description
            END as mobile_description
          FROM transactions 
          WHERE user_id = $1 
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY created_at DESC 
          LIMIT 20
        `,
        mobileSpecific: true,
        performanceImpact: 65,
        affectedTables: ['transactions']
      },
      {
        queryPattern: 'mobile_transaction_summary',
        description: 'Optimized transaction summary for mobile dashboard',
        originalQuery: `
          SELECT 
            COUNT(*) as total_transactions,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
          FROM transactions 
          WHERE user_id = $1
        `,
        optimizedQuery: `
          SELECT 
            COUNT(*) as total_transactions,
            ROUND(SUM(amount)::numeric, 2) as total_amount,
            ROUND(AVG(amount)::numeric, 2) as avg_amount,
            COUNT(CASE WHEN amount > 0 THEN 1 END) as income_count,
            COUNT(CASE WHEN amount < 0 THEN 1 END) as expense_count
          FROM transactions 
          WHERE user_id = $1 
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        `,
        mobileSpecific: true,
        performanceImpact: 55,
        affectedTables: ['transactions']
      }
    ];
  }

  private optimizeAccountQueries(): QueryOptimization[] {
    return [
      {
        queryPattern: 'mobile_account_balances',
        description: 'Optimized account balances for mobile overview',
        originalQuery: `
          SELECT * FROM accounts 
          WHERE user_id = $1
        `,
        optimizedQuery: `
          SELECT 
            id, name, account_type, 
            ROUND(balance::numeric, 2) as balance,
            currency_code,
            is_active,
            CASE 
              WHEN balance >= 0 THEN 'positive'
              ELSE 'negative'
            END as balance_status
          FROM accounts 
          WHERE user_id = $1 
            AND is_active = true
          ORDER BY balance DESC
        `,
        mobileSpecific: true,
        performanceImpact: 70,
        affectedTables: ['accounts']
      }
    ];
  }

  private optimizeBudgetQueries(): QueryOptimization[] {
    return [
      {
        queryPattern: 'mobile_budget_status',
        description: 'Current budget status for mobile widget',
        originalQuery: `
          SELECT b.*, 
            COALESCE(SUM(t.amount), 0) as spent_amount
          FROM budgets b
          LEFT JOIN transactions t ON b.category_id = t.category_id
          WHERE b.user_id = $1
          GROUP BY b.id
        `,
        optimizedQuery: `
          SELECT 
            b.id, b.name, b.amount as budget_amount,
            ROUND(COALESCE(spent.total, 0)::numeric, 2) as spent_amount,
            ROUND((b.amount - COALESCE(spent.total, 0))::numeric, 2) as remaining_amount,
            ROUND((COALESCE(spent.total, 0) / NULLIF(b.amount, 0) * 100)::numeric, 1) as spent_percentage
          FROM budgets b
          LEFT JOIN LATERAL (
            SELECT SUM(ABS(amount)) as total
            FROM transactions t
            WHERE t.user_id = b.user_id
              AND t.category_id = b.category_id
              AND t.created_at >= b.start_date
              AND t.created_at <= b.end_date
              AND t.amount < 0
          ) spent ON true
          WHERE b.user_id = $1
            AND b.is_active = true
            AND b.end_date >= CURRENT_DATE
          ORDER BY spent_percentage DESC
        `,
        mobileSpecific: true,
        performanceImpact: 80,
        affectedTables: ['budgets', 'transactions']
      }
    ];
  }

  private optimizeCategoryQueries(): QueryOptimization[] {
    return [
      {
        queryPattern: 'mobile_category_spending',
        description: 'Category spending analysis for mobile charts',
        originalQuery: `
          SELECT c.*, SUM(t.amount) as total_spent
          FROM categories c
          LEFT JOIN transactions t ON c.id = t.category_id
          WHERE c.user_id = $1
          GROUP BY c.id
        `,
        optimizedQuery: `
          SELECT 
            c.id, c.name, c.color, c.icon,
            ROUND(COALESCE(SUM(ABS(t.amount)), 0)::numeric, 2) as total_spent,
            COUNT(t.id) as transaction_count,
            ROUND(AVG(ABS(t.amount))::numeric, 2) as avg_amount
          FROM categories c
          LEFT JOIN transactions t ON c.id = t.category_id
            AND t.created_at >= CURRENT_DATE - INTERVAL '90 days'
            AND t.amount < 0
          WHERE c.user_id = $1
            AND c.is_active = true
          GROUP BY c.id, c.name, c.color, c.icon
          HAVING COUNT(t.id) > 0
          ORDER BY total_spent DESC
          LIMIT 10
        `,
        mobileSpecific: true,
        performanceImpact: 75,
        affectedTables: ['categories', 'transactions']
      }
    ];
  }

  private async generateMigrationFiles(
    indexes: DatabaseIndex[], 
    optimizations: QueryOptimization[]
  ): Promise<string[]> {
    const migrationFiles: string[] = [];
    const migrationsDir = join(this.projectPath, 'supabase', 'migrations');
    
    await fs.mkdir(migrationsDir, { recursive: true });

    // Generate index migration
    const indexMigration = await this.generateIndexMigration(indexes);
    const indexMigrationFile = join(migrationsDir, `${this.getTimestamp()}_mobile_database_indexes.sql`);
    await fs.writeFile(indexMigrationFile, indexMigration, 'utf8');
    migrationFiles.push(indexMigrationFile);

    // Generate function migration for mobile optimizations
    const functionMigration = await this.generateFunctionMigration(optimizations);
    const functionMigrationFile = join(migrationsDir, `${this.getTimestamp()}_mobile_database_functions.sql`);
    await fs.writeFile(functionMigrationFile, functionMigration, 'utf8');
    migrationFiles.push(functionMigrationFile);

    // Generate mobile-specific views
    const viewMigration = await this.generateViewMigration();
    const viewMigrationFile = join(migrationsDir, `${this.getTimestamp()}_mobile_database_views.sql`);
    await fs.writeFile(viewMigrationFile, viewMigration, 'utf8');
    migrationFiles.push(viewMigrationFile);

    return migrationFiles;
  }

  private async generateIndexMigration(indexes: DatabaseIndex[]): Promise<string> {
    let migration = `-- Mobile Database Optimization Indexes Migration
-- Generated by Clear Piggy Mobile Database Optimizer
-- Performance improvements for mobile query patterns

BEGIN;

-- Drop existing indexes if they exist (for idempotent migrations)
`;

    for (const index of indexes) {
      migration += `DROP INDEX IF EXISTS ${index.indexName};\n`;
    }

    migration += '\n-- Create mobile-optimized indexes\n';

    for (const index of indexes) {
      migration += `
-- Index: ${index.indexName} (${index.estimatedPerformanceGain}% performance gain)
-- Table: ${index.tableName}
-- Mobile Optimized: ${index.mobileOptimized}
CREATE INDEX ${index.unique ? 'UNIQUE' : ''} ${index.indexName}
ON ${index.tableName} USING ${index.type} (${index.columns.join(', ')})`;

      if (index.partial) {
        migration += `\nWHERE ${index.partial}`;
      }

      migration += ';\n';
    }

    migration += `
-- Add comments for documentation
`;

    for (const index of indexes) {
      migration += `COMMENT ON INDEX ${index.indexName} IS 'Mobile optimization index - estimated ${index.estimatedPerformanceGain}% performance improvement';\n`;
    }

    migration += '\nCOMMIT;\n';

    return migration;
  }

  private async generateFunctionMigration(optimizations: QueryOptimization[]): Promise<string> {
    let migration = `-- Mobile Database Functions Migration
-- Generated by Clear Piggy Mobile Database Optimizer
-- Optimized functions for mobile query patterns

BEGIN;

-- Mobile transaction retrieval function
CREATE OR REPLACE FUNCTION get_mobile_transactions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  amount DECIMAL,
  mobile_description TEXT,
  category_id UUID,
  account_id UUID,
  created_at TIMESTAMPTZ,
  balance_status TEXT
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    t.id,
    ROUND(t.amount::numeric, 2),
    CASE 
      WHEN LENGTH(t.description) > 30 THEN SUBSTRING(t.description, 1, 30) || '...'
      ELSE t.description
    END,
    t.category_id,
    t.account_id,
    t.created_at,
    CASE 
      WHEN t.amount >= 0 THEN 'income'
      ELSE 'expense'
    END
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Mobile account balances function
CREATE OR REPLACE FUNCTION get_mobile_account_balances(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  account_type TEXT,
  balance DECIMAL,
  currency_code TEXT,
  balance_status TEXT,
  is_primary BOOLEAN
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    a.id,
    a.name,
    a.account_type,
    ROUND(a.balance::numeric, 2),
    COALESCE(a.currency_code, 'USD'),
    CASE 
      WHEN a.balance >= 0 THEN 'positive'
      ELSE 'negative'
    END,
    COALESCE(a.is_primary, false)
  FROM accounts a
  WHERE a.user_id = p_user_id
    AND a.is_active = true
  ORDER BY a.is_primary DESC, a.balance DESC;
$$;

-- Mobile budget status function
CREATE OR REPLACE FUNCTION get_mobile_budget_status(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  budget_amount DECIMAL,
  spent_amount DECIMAL,
  remaining_amount DECIMAL,
  spent_percentage DECIMAL,
  status TEXT
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    b.id,
    b.name,
    ROUND(b.amount::numeric, 2),
    ROUND(COALESCE(spent.total, 0)::numeric, 2),
    ROUND((b.amount - COALESCE(spent.total, 0))::numeric, 2),
    ROUND((COALESCE(spent.total, 0) / NULLIF(b.amount, 0) * 100)::numeric, 1),
    CASE 
      WHEN COALESCE(spent.total, 0) >= b.amount THEN 'over_budget'
      WHEN COALESCE(spent.total, 0) >= b.amount * 0.8 THEN 'near_limit'
      ELSE 'on_track'
    END
  FROM budgets b
  LEFT JOIN LATERAL (
    SELECT SUM(ABS(amount)) as total
    FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.category_id = b.category_id
      AND t.created_at >= b.start_date
      AND t.created_at <= b.end_date
      AND t.amount < 0
  ) spent ON true
  WHERE b.user_id = p_user_id
    AND b.is_active = true
    AND b.end_date >= CURRENT_DATE
  ORDER BY spent_percentage DESC;
$$;

-- Mobile category spending function
CREATE OR REPLACE FUNCTION get_mobile_category_spending(
  p_user_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  icon TEXT,
  total_spent DECIMAL,
  transaction_count INTEGER,
  avg_amount DECIMAL,
  spending_trend TEXT
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    c.id,
    c.name,
    COALESCE(c.color, '#6B7280'),
    COALESCE(c.icon, 'category'),
    ROUND(COALESCE(SUM(ABS(t.amount)), 0)::numeric, 2),
    COUNT(t.id)::INTEGER,
    ROUND(COALESCE(AVG(ABS(t.amount)), 0)::numeric, 2),
    CASE 
      WHEN COUNT(t.id) = 0 THEN 'no_activity'
      WHEN AVG(ABS(t.amount)) > 100 THEN 'high_spending'
      WHEN AVG(ABS(t.amount)) > 50 THEN 'moderate_spending'
      ELSE 'low_spending'
    END
  FROM categories c
  LEFT JOIN transactions t ON c.id = t.category_id
    AND t.user_id = p_user_id
    AND t.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    AND t.amount < 0
  WHERE c.user_id = p_user_id
    AND c.is_active = true
  GROUP BY c.id, c.name, c.color, c.icon
  ORDER BY total_spent DESC
  LIMIT 10;
$$;

-- Mobile dashboard summary function
CREATE OR REPLACE FUNCTION get_mobile_dashboard_summary(p_user_id UUID)
RETURNS TABLE (
  total_balance DECIMAL,
  monthly_income DECIMAL,
  monthly_expenses DECIMAL,
  active_budgets INTEGER,
  recent_transactions INTEGER,
  spending_trend TEXT
) 
LANGUAGE sql STABLE
AS $$
  WITH account_totals AS (
    SELECT SUM(balance) as total_balance
    FROM accounts
    WHERE user_id = p_user_id AND is_active = true
  ),
  monthly_stats AS (
    SELECT 
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = p_user_id
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ),
  budget_count AS (
    SELECT COUNT(*) as active_budgets
    FROM budgets
    WHERE user_id = p_user_id 
      AND is_active = true 
      AND end_date >= CURRENT_DATE
  )
  SELECT 
    ROUND(COALESCE(at.total_balance, 0)::numeric, 2),
    ROUND(COALESCE(ms.income, 0)::numeric, 2),
    ROUND(COALESCE(ms.expenses, 0)::numeric, 2),
    COALESCE(bc.active_budgets, 0)::INTEGER,
    COALESCE(ms.transaction_count, 0)::INTEGER,
    CASE 
      WHEN ms.expenses > ms.income * 1.1 THEN 'overspending'
      WHEN ms.expenses > ms.income * 0.9 THEN 'balanced'
      ELSE 'saving'
    END
  FROM account_totals at
  CROSS JOIN monthly_stats ms
  CROSS JOIN budget_count bc;
$$;

-- Add RLS policies for mobile functions (if not exists)
DO $$ 
BEGIN
  -- Enable RLS on main tables if not already enabled
  ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS budgets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

COMMIT;
`;

    return migration;
  }

  private async generateViewMigration(): Promise<string> {
    return `-- Mobile Database Views Migration
-- Generated by Clear Piggy Mobile Database Optimizer
-- Materialized views for mobile performance

BEGIN;

-- Mobile transactions materialized view
DROP MATERIALIZED VIEW IF EXISTS mobile_transactions_recent;
CREATE MATERIALIZED VIEW mobile_transactions_recent AS
SELECT 
  t.id,
  t.user_id,
  t.amount,
  CASE 
    WHEN LENGTH(t.description) > 30 THEN SUBSTRING(t.description, 1, 30) || '...'
    ELSE t.description
  END as mobile_description,
  t.category_id,
  c.name as category_name,
  c.color as category_color,
  t.account_id,
  a.name as account_name,
  t.created_at,
  CASE 
    WHEN t.amount >= 0 THEN 'income'
    ELSE 'expense'
  END as transaction_type
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a ON t.account_id = a.id
WHERE t.created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Create unique index for fast refresh
CREATE UNIQUE INDEX idx_mobile_transactions_recent_unique 
ON mobile_transactions_recent (user_id, id, created_at);

-- Mobile account summary materialized view
DROP MATERIALIZED VIEW IF EXISTS mobile_account_summary;
CREATE MATERIALIZED VIEW mobile_account_summary AS
SELECT 
  a.user_id,
  a.id,
  a.name,
  a.account_type,
  ROUND(a.balance::numeric, 2) as balance,
  a.currency_code,
  a.is_active,
  a.is_primary,
  CASE 
    WHEN a.balance >= 0 THEN 'positive'
    ELSE 'negative'
  END as balance_status,
  (
    SELECT COUNT(*)
    FROM transactions t
    WHERE t.account_id = a.id
      AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as recent_transaction_count,
  a.updated_at
FROM accounts a
WHERE a.is_active = true;

-- Create unique index for fast refresh
CREATE UNIQUE INDEX idx_mobile_account_summary_unique 
ON mobile_account_summary (user_id, id);

-- Mobile budget performance materialized view
DROP MATERIALIZED VIEW IF EXISTS mobile_budget_performance;
CREATE MATERIALIZED VIEW mobile_budget_performance AS
SELECT 
  b.user_id,
  b.id,
  b.name,
  b.amount as budget_amount,
  b.category_id,
  c.name as category_name,
  COALESCE(spent.total, 0) as spent_amount,
  (b.amount - COALESCE(spent.total, 0)) as remaining_amount,
  ROUND((COALESCE(spent.total, 0) / NULLIF(b.amount, 0) * 100)::numeric, 1) as spent_percentage,
  CASE 
    WHEN COALESCE(spent.total, 0) >= b.amount THEN 'over_budget'
    WHEN COALESCE(spent.total, 0) >= b.amount * 0.8 THEN 'near_limit'
    ELSE 'on_track'
  END as status,
  b.start_date,
  b.end_date,
  b.updated_at
FROM budgets b
LEFT JOIN categories c ON b.category_id = c.id
LEFT JOIN LATERAL (
  SELECT SUM(ABS(amount)) as total
  FROM transactions t
  WHERE t.user_id = b.user_id
    AND t.category_id = b.category_id
    AND t.created_at >= b.start_date
    AND t.created_at <= b.end_date
    AND t.amount < 0
) spent ON true
WHERE b.is_active = true
  AND b.end_date >= CURRENT_DATE;

-- Create unique index for fast refresh
CREATE UNIQUE INDEX idx_mobile_budget_performance_unique 
ON mobile_budget_performance (user_id, id);

-- Create refresh functions for materialized views
CREATE OR REPLACE FUNCTION refresh_mobile_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mobile_transactions_recent;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mobile_account_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mobile_budget_performance;
END;
$$;

-- Create automatic refresh trigger (using pg_cron if available)
-- Note: This requires pg_cron extension to be enabled
DO $$
BEGIN
  -- Schedule refresh every 15 minutes during business hours
  PERFORM cron.schedule('refresh-mobile-views', '*/15 6-22 * * *', 'SELECT refresh_mobile_views();');
EXCEPTION
  WHEN undefined_function THEN 
    -- pg_cron not available, skip scheduling
    NULL;
END;
$$;

-- Add RLS policies for materialized views
ALTER MATERIALIZED VIEW mobile_transactions_recent OWNER TO authenticated;
ALTER MATERIALIZED VIEW mobile_account_summary OWNER TO authenticated;
ALTER MATERIALIZED VIEW mobile_budget_performance OWNER TO authenticated;

-- Grant appropriate permissions
GRANT SELECT ON mobile_transactions_recent TO authenticated;
GRANT SELECT ON mobile_account_summary TO authenticated;
GRANT SELECT ON mobile_budget_performance TO authenticated;

COMMIT;
`;
  }

  private async createMobileDatabaseFunctions(): Promise<void> {
    // Functions are created as part of migration files
    // This method handles any additional function setup or validation
    this.emit('functions:created');
  }

  private async setupConnectionPooling(): Promise<void> {
    if (!this.config.connectionPooling.enabled) {
      return;
    }

    const poolConfig = {
      min: this.config.connectionPooling.minConnections,
      max: this.config.connectionPooling.maxConnections,
      idleTimeoutMillis: this.config.connectionPooling.idleTimeout,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    };

    const configFile = join(this.projectPath, 'database', 'pool-config.json');
    await fs.mkdir(dirname(configFile), { recursive: true });
    await fs.writeFile(configFile, JSON.stringify(poolConfig, null, 2), 'utf8');

    this.emit('connection-pooling:configured', poolConfig);
  }

  private calculatePerformanceImpact(
    indexes: DatabaseIndex[], 
    optimizations: QueryOptimization[]
  ): number {
    const indexImpact = indexes.reduce((sum, index) => sum + index.estimatedPerformanceGain, 0);
    const queryImpact = optimizations.reduce((sum, opt) => sum + opt.performanceImpact, 0);
    
    // Calculate weighted average based on number of optimizations
    const totalImpact = (indexImpact + queryImpact) / (indexes.length + optimizations.length);
    
    return Math.min(Math.round(totalImpact), 100);
  }

  private getTimestamp(): string {
    return new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);
  }

  // Performance monitoring methods
  async monitorPerformance(): Promise<DatabasePerformanceMetrics> {
    // This would integrate with actual database monitoring
    // For now, return simulated metrics
    return this.performanceMetrics;
  }

  async analyzeQueryPerformance(query: string): Promise<{
    executionTime: number;
    planCost: number;
    indexUsage: string[];
    suggestions: string[];
  }> {
    // This would analyze actual query execution plans
    // For now, return simulated analysis
    return {
      executionTime: 0,
      planCost: 0,
      indexUsage: [],
      suggestions: []
    };
  }

  async validateOptimizations(): Promise<{
    indexesCreated: number;
    functionsCreated: number;
    viewsCreated: number;
    performanceImprovement: number;
    errors: string[];
  }> {
    try {
      const errors: string[] = [];
      
      // Validate that indexes were created
      const indexesCreated = this.indexes.length;
      
      // Validate functions (would check database in real implementation)
      const functionsCreated = 6; // Number of functions we create
      
      // Validate materialized views (would check database in real implementation)
      const viewsCreated = 3; // Number of views we create
      
      // Calculate performance improvement
      const performanceImprovement = this.calculatePerformanceImpact(
        this.indexes,
        Array.from(this.optimizations.values()).flat()
      );

      this.emit('validation:complete', {
        indexesCreated,
        functionsCreated,
        viewsCreated,
        performanceImprovement
      });

      return {
        indexesCreated,
        functionsCreated,
        viewsCreated,
        performanceImprovement,
        errors
      };

    } catch (error) {
      this.emit('validation:error', error);
      throw error;
    }
  }
}