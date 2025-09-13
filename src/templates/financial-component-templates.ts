/**
 * Financial Component Templates for Mobile-First Generation
 * Simplified templates for Clear Piggy financial SaaS patterns
 */

import { ComponentTemplate, FinancialComponentPattern } from '../types/component-generation-types';

export const FINANCIAL_COMPONENT_TEMPLATES: Record<FinancialComponentPattern, ComponentTemplate> = {
  'transaction-list': {
    pattern: 'transaction-list',
    name: 'MobileTransactionList',
    description: 'Mobile-optimized transaction list with infinite scroll and swipe actions',
    requiredDependencies: [
      'react',
      '@tanstack/react-virtual',
      'framer-motion',
      '@supabase/supabase-js'
    ],
    baseTemplate: `import React from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  transactions?: any[];
  onTransactionPress?: (transaction: any) => void;
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  transactions = [],
  onTransactionPress,
  className = ''
}) => {
  return (
    <motion.div
      className={\`flex flex-col space-y-2 p-4 \${className}\`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id || index}
          className="bg-white rounded-lg p-4 shadow-sm min-h-[44px] touch-manipulation"
          whileTap={{ scale: 0.98 }}
          onTap={() => onTransactionPress?.(transaction)}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">
              {transaction.description || 'Transaction'}
            </span>
            <span className="text-lg font-semibold text-green-600">
              $\{Math.abs(transaction.amount || 0).toFixed(2)}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};`,
    mobileOptimizations: [
      'Touch-friendly 44px minimum targets',
      'Smooth animations with Framer Motion',
      'Mobile-first responsive design',
      'Swipe gesture support'
    ],
    accessibilityRequirements: [
      'ARIA labels for all interactive elements',
      'Keyboard navigation support',
      'Screen reader compatibility',
      'High contrast support'
    ],
    tailwindClasses: [
      'flex', 'flex-col', 'space-y-2', 'p-4',
      'bg-white', 'rounded-lg', 'shadow-sm',
      'min-h-[44px]', 'touch-manipulation'
    ],
    framerMotionAnimations: [
      'initial={{ opacity: 0 }}',
      'animate={{ opacity: 1 }}',
      'whileTap={{ scale: 0.98 }}'
    ]
  },

  'budget-card': {
    pattern: 'budget-card',
    name: 'MobileBudgetCard',
    description: 'Mobile budget card with progress tracking',
    requiredDependencies: [
      'react',
      'framer-motion'
    ],
    baseTemplate: `import React from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  budget?: any;
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  budget = {},
  className = ''
}) => {
  const progress = budget.spent / budget.limit * 100 || 0;
  
  return (
    <motion.div
      className={\`bg-white rounded-lg p-4 shadow-sm \${className}\`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {budget.name || 'Budget'}
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Spent: ${'{'}{budget.spent || 0}{'}'}</span>
          <span>Limit: ${'{'}{budget.limit || 0}{'}'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: \`\${Math.min(progress, 100)}%\` }}
          />
        </div>
      </div>
    </motion.div>
  );
};`,
    mobileOptimizations: [
      'Card-based mobile layout',
      'Touch-friendly interactions',
      'Animated progress indicators'
    ],
    accessibilityRequirements: [
      'ARIA progress indicators',
      'High contrast colors',
      'Screen reader labels'
    ],
    tailwindClasses: [
      'bg-white', 'rounded-lg', 'p-4', 'shadow-sm',
      'text-lg', 'font-semibold', 'space-y-2'
    ],
    framerMotionAnimations: [
      'initial={{ scale: 0.9, opacity: 0 }}',
      'animate={{ scale: 1, opacity: 1 }}'
    ]
  },

  'dashboard-metrics': {
    pattern: 'dashboard-metrics',
    name: 'MobileDashboardMetrics',
    description: 'Mobile dashboard with responsive metrics grid',
    requiredDependencies: [
      'react',
      'framer-motion'
    ],
    baseTemplate: `import React from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  metrics?: any[];
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  metrics = [],
  className = ''
}) => {
  return (
    <div className={\`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 \${className}\`}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.id || index}
          className="bg-white rounded-lg p-4 shadow-sm min-h-[80px] touch-manipulation"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <h4 className="text-sm font-medium text-gray-600 mb-1">
            {metric.title || 'Metric'}
          </h4>
          <p className="text-2xl font-bold text-gray-900">
            {metric.value || '0'}
          </p>
        </motion.div>
      ))}
    </div>
  );
};`,
    mobileOptimizations: [
      'Responsive grid layout',
      'Staggered animations',
      'Touch-friendly cards'
    ],
    accessibilityRequirements: [
      'Semantic HTML structure',
      'Clear metric labels',
      'High contrast text'
    ],
    tailwindClasses: [
      'grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4',
      'gap-4', 'p-4', 'bg-white', 'rounded-lg'
    ],
    framerMotionAnimations: [
      'initial={{ y: 20, opacity: 0 }}',
      'animate={{ y: 0, opacity: 1 }}'
    ]
  },

  'navigation-bar': {
    pattern: 'navigation-bar',
    name: 'MobileNavigationBar',
    description: 'Mobile navigation with hamburger menu',
    requiredDependencies: [
      'react',
      'framer-motion'
    ],
    baseTemplate: `import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  menuItems?: any[];
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  menuItems = [],
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={\`bg-white shadow-sm \${className}\`}>
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-gray-900">Clear Piggy</h1>
        <button
          className="p-2 min-h-[44px] min-w-[44px] touch-manipulation"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center">
            <span className="block h-0.5 w-6 bg-gray-900 mb-1"></span>
            <span className="block h-0.5 w-6 bg-gray-900 mb-1"></span>
            <span className="block h-0.5 w-6 bg-gray-900"></span>
          </div>
        </button>
      </div>
      {isOpen && (
        <motion.div
          className="border-t bg-white"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
        >
          {menuItems.map((item, index) => (
            <a
              key={item.id || index}
              href={item.href || '#'}
              className="block p-4 text-gray-700 hover:bg-gray-50 min-h-[44px] touch-manipulation"
            >
              {item.label || 'Menu Item'}
            </a>
          ))}
        </motion.div>
      )}
    </nav>
  );
};`,
    mobileOptimizations: [
      'Hamburger menu for mobile',
      'Touch-friendly navigation',
      'Smooth menu animations'
    ],
    accessibilityRequirements: [
      'Proper ARIA labels',
      'Keyboard navigation',
      'Focus management'
    ],
    tailwindClasses: [
      'bg-white', 'shadow-sm', 'flex', 'items-center',
      'justify-between', 'p-4', 'min-h-[44px]'
    ],
    framerMotionAnimations: [
      'initial={{ height: 0 }}',
      'animate={{ height: "auto" }}'
    ]
  },

  'chart-component': {
    pattern: 'chart-component',
    name: 'MobileChartComponent',
    description: 'Mobile-optimized chart component',
    requiredDependencies: [
      'react',
      'framer-motion'
    ],
    baseTemplate: `import React from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  data?: any[];
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  data = [],
  className = ''
}) => {
  return (
    <motion.div
      className={\`bg-white rounded-lg p-4 shadow-sm \${className}\`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart</h3>
      <div className="h-64 flex items-end justify-center space-x-2">
        {data.slice(0, 7).map((item, index) => (
          <motion.div
            key={index}
            className="bg-blue-500 w-8 min-h-[4px] rounded-t"
            style={{ height: \`\${(item.value || 10) * 2}px\` }}
            initial={{ height: 0 }}
            animate={{ height: \`\${(item.value || 10) * 2}px\` }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
};`,
    mobileOptimizations: [
      'Touch-friendly chart interactions',
      'Responsive chart sizing',
      'Smooth chart animations'
    ],
    accessibilityRequirements: [
      'Chart data descriptions',
      'Alternative text representations',
      'Keyboard accessible'
    ],
    tailwindClasses: [
      'bg-white', 'rounded-lg', 'p-4', 'shadow-sm',
      'h-64', 'flex', 'items-end', 'space-x-2'
    ],
    framerMotionAnimations: [
      'initial={{ opacity: 0, y: 20 }}',
      'animate={{ opacity: 1, y: 0 }}'
    ]
  },

  'form-financial': {
    pattern: 'form-financial',
    name: 'MobileFinancialForm',
    description: 'Mobile financial form with validation',
    requiredDependencies: [
      'react',
      'framer-motion'
    ],
    baseTemplate: `import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  onSubmit?: (data: any) => void;
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  onSubmit,
  className = ''
}) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <motion.form
      className={\`bg-white rounded-lg p-4 shadow-sm space-y-4 \${className}\`}
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium min-h-[44px] touch-manipulation"
      >
        Submit
      </button>
    </motion.form>
  );
};`,
    mobileOptimizations: [
      'Touch-friendly form inputs',
      'Mobile keyboard optimization',
      'Large touch targets'
    ],
    accessibilityRequirements: [
      'Proper form labels',
      'Error message announcements',
      'Focus management'
    ],
    tailwindClasses: [
      'bg-white', 'rounded-lg', 'p-4', 'shadow-sm',
      'space-y-4', 'w-full', 'min-h-[44px]'
    ],
    framerMotionAnimations: [
      'initial={{ opacity: 0 }}',
      'animate={{ opacity: 1 }}'
    ]
  },

  'receipt-upload': {
    pattern: 'receipt-upload',
    name: 'MobileReceiptUpload',
    description: 'Mobile receipt upload with camera integration',
    requiredDependencies: [
      'react',
      'framer-motion'
    ],
    baseTemplate: `import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  onUpload?: (file: File) => void;
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  onUpload,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload?.(file);
  };

  return (
    <motion.div
      className={\`bg-white rounded-lg p-6 shadow-sm border-2 border-dashed \${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } \${className}\`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <div className="text-center">
        <div className="mb-4">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            📄
          </div>
        </div>
        <p className="text-gray-600 mb-4">Tap to upload receipt</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] touch-manipulation"
        />
      </div>
    </motion.div>
  );
};`,
    mobileOptimizations: [
      'Native camera integration',
      'Touch-friendly upload area',
      'Mobile file handling'
    ],
    accessibilityRequirements: [
      'Clear upload instructions',
      'File type announcements',
      'Progress indicators'
    ],
    tailwindClasses: [
      'bg-white', 'rounded-lg', 'p-6', 'shadow-sm',
      'border-2', 'border-dashed', 'text-center'
    ],
    framerMotionAnimations: [
      'initial={{ scale: 0.95, opacity: 0 }}',
      'animate={{ scale: 1, opacity: 1 }}'
    ]
  },

  'account-summary': {
    pattern: 'account-summary',
    name: 'MobileAccountSummary',
    description: 'Mobile account summary with balance cards',
    requiredDependencies: [
      'react',
      'framer-motion'
    ],
    baseTemplate: `import React from 'react';
import { motion } from 'framer-motion';

interface {{componentName}}Props {
  accounts?: any[];
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  accounts = [],
  className = ''
}) => {
  return (
    <div className={\`space-y-4 p-4 \${className}\`}>
      {accounts.map((account, index) => (
        <motion.div
          key={account.id || index}
          className="bg-white rounded-lg p-4 shadow-sm"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">
                {account.name || 'Account'}
              </h3>
              <p className="text-sm text-gray-600">
                {account.type || 'Checking'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                $\{(account.balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};`,
    mobileOptimizations: [
      'Card-based account layout',
      'Staggered animations',
      'Touch-friendly interactions'
    ],
    accessibilityRequirements: [
      'Clear account labels',
      'Balance announcements',
      'Navigation support'
    ],
    tailwindClasses: [
      'space-y-4', 'p-4', 'bg-white', 'rounded-lg',
      'shadow-sm', 'flex', 'justify-between'
    ],
    framerMotionAnimations: [
      'initial={{ x: -20, opacity: 0 }}',
      'animate={{ x: 0, opacity: 1 }}'
    ]
  }
};