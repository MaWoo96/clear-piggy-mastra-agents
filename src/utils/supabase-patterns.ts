/**
 * Supabase Integration Patterns for Clear Piggy Mobile Components
 * Handles data validation, queries, and real-time subscriptions
 */

// import { Database } from '../types/supabase';
// import { SupabaseClient } from '@supabase/supabase-js';

// Simplified types for basic functionality
type Database = any;
type SupabaseClient = any;

// Type aliases for cleaner code
type Tables = Database['public']['Tables'];
type Transaction = Tables['transactions']['Row'];
type Budget = Tables['budgets']['Row'];
type Account = Tables['accounts']['Row'];
type Category = Tables['categories']['Row'];

export interface SupabaseQueryPattern {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'subscribe';
  columns?: string[];
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
  realtime?: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface ErrorHandlingPattern {
  type: 'network' | 'validation' | 'auth' | 'permission' | 'server';
  message: string;
  userMessage: string;
  retry?: boolean;
  fallback?: any;
}

/**
 * Clear Piggy Supabase Integration Patterns
 */
export class ClearPiggySupabasePatterns {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Transaction Management Patterns
   */
  async getTransactions(
    userId: string,
    accountId?: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      categoryId?: string;
    } = {}
  ): Promise<{ data: Transaction[] | null; error: any }> {
    try {
      let query = this.supabase
        .from('transactions')
        .select(`
          *,
          category:categories(id, name, color),
          account:accounts(id, name, type)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      if (options.startDate) {
        query = query.gte('date', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('date', options.endDate);
      }

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 20)) - 1);
      }

      const result = await query;
      
      if (result.error) {
        return this.handleError('Failed to fetch transactions', result.error);
      }

      return { data: result.data, error: null };

    } catch (error) {
      return this.handleError('Network error while fetching transactions', error);
    }
  }

  /**
   * Budget Management Patterns
   */
  async getBudgets(
    userId: string,
    period: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{ data: (Budget & { categories: Category[]; spent: number })[] | null; error: any }> {
    try {
      const budgetsResult = await this.supabase
        .from('budgets')
        .select(`
          *,
          budget_categories(
            *,
            category:categories(*)
          )
        `)
        .eq('user_id', userId)
        .eq('period', period)
        .order('created_at', { ascending: false });

      if (budgetsResult.error) {
        return this.handleError('Failed to fetch budgets', budgetsResult.error);
      }

      // Calculate spent amounts for each budget
      const budgetsWithSpent = await Promise.all(
        budgetsResult.data.map(async (budget: any) => {
          const spentResult = await this.supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .gte('date', budget.start_date)
            .lte('date', budget.end_date);

          const spent = spentResult.data?.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 0;

          return {
            ...budget,
            categories: budget.budget_categories?.map((bc: any) => bc.category) || [],
            spent
          };
        })
      );

      return { data: budgetsWithSpent, error: null };

    } catch (error) {
      return this.handleError('Network error while fetching budgets', error);
    }
  }

  /**
   * Account Summary Patterns
   */
  async getAccountSummary(
    userId: string
  ): Promise<{ data: { accounts: Account[]; totalBalance: number; netWorth: number } | null; error: any }> {
    try {
      const accountsResult = await this.supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('name');

      if (accountsResult.error) {
        return this.handleError('Failed to fetch accounts', accountsResult.error);
      }

      const accounts = accountsResult.data || [];
      const totalBalance = accounts.reduce((sum: number, account: any) => sum + (account.balance || 0), 0);
      
      // Calculate net worth (assets - liabilities)
      const assets = accounts
        .filter((a: any) => ['checking', 'savings', 'investment'].includes(a.type))
        .reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
      
      const liabilities = accounts
        .filter((a: any) => ['credit', 'loan'].includes(a.type))
        .reduce((sum: number, a: any) => sum + Math.abs(a.balance || 0), 0);
      
      const netWorth = assets - liabilities;

      return {
        data: {
          accounts,
          totalBalance,
          netWorth
        },
        error: null
      };

    } catch (error) {
      return this.handleError('Network error while fetching account summary', error);
    }
  }

  /**
   * Real-time Subscription Patterns
   */
  subscribeToTransactions(
    userId: string,
    callback: (payload: any) => void
  ): () => void {
    const subscription = this.supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      this.supabase.removeChannel(subscription);
    };
  }

  /**
   * Data Validation Patterns
   */
  validateTransaction(transaction: Partial<Transaction>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const rules: ValidationRule[] = [
      {
        field: 'amount',
        type: 'required',
        message: 'Transaction amount is required'
      },
      {
        field: 'amount',
        type: 'custom',
        message: 'Transaction amount must be a valid number',
        customValidator: (value) => typeof value === 'number' && !isNaN(value)
      },
      {
        field: 'description',
        type: 'required',
        message: 'Transaction description is required'
      },
      {
        field: 'description',
        type: 'min',
        value: 3,
        message: 'Description must be at least 3 characters'
      },
      {
        field: 'date',
        type: 'required',
        message: 'Transaction date is required'
      },
      {
        field: 'account_id',
        type: 'required',
        message: 'Account is required'
      }
    ];

    for (const rule of rules) {
      const value = (transaction as any)[rule.field];
      
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push(rule.message);
          }
          break;
        
        case 'min':
          if (typeof value === 'string' && value.length < (rule.value || 0)) {
            errors.push(rule.message);
          } else if (typeof value === 'number' && value < (rule.value || 0)) {
            errors.push(rule.message);
          }
          break;
        
        case 'max':
          if (typeof value === 'string' && value.length > (rule.value || 0)) {
            errors.push(rule.message);
          } else if (typeof value === 'number' && value > (rule.value || 0)) {
            errors.push(rule.message);
          }
          break;
        
        case 'pattern':
          if (typeof value === 'string' && rule.value && !new RegExp(rule.value).test(value)) {
            errors.push(rule.message);
          }
          break;
        
        case 'custom':
          if (rule.customValidator && !rule.customValidator(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Error Handling Patterns
   */
  private handleError(userMessage: string, error: any): { data: null; error: ErrorHandlingPattern } {
    console.error('Supabase error:', error);

    let errorType: ErrorHandlingPattern['type'] = 'server';
    let systemMessage = error.message || 'Unknown error';
    let retry = true;

    // Categorize error types
    if (error.code === 'PGRST116') {
      errorType = 'permission';
      userMessage = 'You do not have permission to access this data';
      retry = false;
    } else if (error.message?.includes('JWT')) {
      errorType = 'auth';
      userMessage = 'Your session has expired. Please sign in again.';
      retry = false;
    } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      errorType = 'network';
      userMessage = 'Network connection failed. Please check your internet connection.';
      retry = true;
    } else if (error.details?.includes('violates')) {
      errorType = 'validation';
      userMessage = 'Invalid data provided. Please check your input.';
      retry = false;
    }

    return {
      data: null,
      error: {
        type: errorType,
        message: systemMessage,
        userMessage,
        retry
      }
    };
  }

  /**
   * Offline Support Patterns
   */
  async syncOfflineData(offlineTransactions: Partial<Transaction>[]): Promise<{ success: boolean; errors: any[] }> {
    const errors: any[] = [];
    
    for (const transaction of offlineTransactions) {
      try {
        const validation = this.validateTransaction(transaction);
        if (!validation.isValid) {
          errors.push({
            transaction,
            error: 'Validation failed',
            details: validation.errors
          });
          continue;
        }

        const result = await this.supabase
          .from('transactions')
          .insert([transaction])
          .select();

        if (result.error) {
          errors.push({
            transaction,
            error: result.error.message,
            details: result.error
          });
        }

      } catch (error) {
        errors.push({
          transaction,
          error: 'Network error during sync',
          details: error
        });
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Performance Optimization Patterns
   */
  async batchInsertTransactions(transactions: Partial<Transaction>[]): Promise<{ data: Transaction[] | null; error: any }> {
    try {
      // Validate all transactions first
      const validationResults = transactions.map(t => this.validateTransaction(t));
      const hasInvalidTransactions = validationResults.some(r => !r.isValid);
      
      if (hasInvalidTransactions) {
        const errors = validationResults
          .filter(r => !r.isValid)
          .flatMap(r => r.errors);
        
        return {
          data: null,
          error: {
            type: 'validation',
            message: 'Some transactions have validation errors',
            userMessage: 'Please fix the following errors: ' + errors.join(', '),
            retry: false
          }
        };
      }

      // Insert in batches of 100 (Supabase limit)
      const batchSize = 100;
      const results: Transaction[] = [];
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        const result = await this.supabase
          .from('transactions')
          .insert(batch)
          .select();

        if (result.error) {
          return this.handleError('Failed to insert transaction batch', result.error);
        }

        if (result.data) {
          results.push(...result.data);
        }
      }

      return { data: results, error: null };

    } catch (error) {
      return this.handleError('Network error during batch insert', error);
    }
  }

  /**
   * Data Formatting Utilities for Mobile
   */
  formatCurrencyForMobile(amount: number, compact: boolean = false): string {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    if (compact && Math.abs(amount) >= 1000) {
      options.notation = 'compact';
      options.maximumFractionDigits = 1;
    }

    return new Intl.NumberFormat('en-US', options).format(amount);
  }

  formatDateForMobile(date: string | Date, format: 'short' | 'medium' | 'long' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Show relative dates for recent transactions
    if (format === 'short' && diffInDays === 0) {
      return 'Today';
    } else if (format === 'short' && diffInDays === 1) {
      return 'Yesterday';
    } else if (format === 'short' && diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    // Format options based on requested format
    let options: Intl.DateTimeFormatOptions = {};
    switch (format) {
      case 'short':
        options = { month: 'short', day: 'numeric' };
        break;
      case 'medium':
        options = { month: 'short', day: 'numeric', year: 'numeric' };
        break;
      case 'long':
        options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        break;
    }

    return dateObj.toLocaleDateString('en-US', options);
  }
}

/**
 * React Query Integration Patterns
 */
export const createSupabaseQueryKeys = {
  transactions: (userId: string, filters?: Record<string, any>) => 
    ['transactions', userId, filters],
  
  budgets: (userId: string, period: string) => 
    ['budgets', userId, period],
  
  accounts: (userId: string) => 
    ['accounts', userId],
  
  categories: (userId: string) => 
    ['categories', userId],
};

/**
 * Mobile-specific Caching Strategies
 */
export const mobileSupabaseCacheConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 30, // 30 minutes
  
  // Optimistic updates for better mobile UX
  optimisticUpdates: {
    addTransaction: (oldData: Transaction[], newTransaction: Partial<Transaction>) => [
      { ...newTransaction, id: 'temp-' + Date.now() } as Transaction,
      ...oldData
    ],
    
    updateTransaction: (oldData: Transaction[], updatedTransaction: Transaction) =>
      oldData.map(t => t.id === updatedTransaction.id ? updatedTransaction : t),
    
    deleteTransaction: (oldData: Transaction[], transactionId: string) =>
      oldData.filter(t => t.id !== transactionId)
  },

  // Background sync intervals
  refetchIntervals: {
    transactions: 1000 * 60 * 2, // 2 minutes
    budgets: 1000 * 60 * 5, // 5 minutes  
    accounts: 1000 * 60 * 1, // 1 minute
  }
};

/**
 * Error Recovery Patterns
 */
export const createSupabaseErrorRecovery = {
  retryCondition: (error: any) => {
    // Don't retry auth or permission errors
    if (error.code === 'PGRST116' || error.message?.includes('JWT')) {
      return false;
    }
    
    // Retry network errors
    if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      return true;
    }
    
    // Retry server errors (5xx)
    if (error.status && error.status >= 500) {
      return true;
    }
    
    return false;
  },

  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  maxRetries: 3,
};