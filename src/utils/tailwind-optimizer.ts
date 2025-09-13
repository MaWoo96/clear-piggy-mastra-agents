import { promises as fs } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import {
  TailwindIntegrationConfig,
  MOBILE_BREAKPOINTS
} from '../types/integration-agent-types';

export interface TailwindConfig {
  content: string[];
  theme: {
    screens?: { [key: string]: string };
    extend?: {
      [key: string]: any;
    };
  };
  plugins: any[];
  darkMode?: 'media' | 'class' | string[];
  corePlugins?: { [key: string]: boolean };
  variants?: { [key: string]: string[] };
}

export interface TailwindOptimization {
  type: 'breakpoint' | 'utility' | 'component' | 'plugin' | 'purge';
  description: string;
  before?: string;
  after?: string;
  impact: 'low' | 'medium' | 'high';
  mobileSpecific: boolean;
}

export interface ResponsiveUtility {
  className: string;
  property: string;
  values: { [breakpoint: string]: string };
  description: string;
  touchOptimized: boolean;
}

export class TailwindOptimizer extends EventEmitter {
  private config: TailwindIntegrationConfig;
  private projectPath: string;
  private configPath: string;

  constructor(projectPath: string, config: TailwindIntegrationConfig) {
    super();
    this.projectPath = projectPath;
    this.config = config;
    this.configPath = join(projectPath, config.configPath);
  }

  async optimizeForMobile(): Promise<TailwindOptimization[]> {
    const optimizations: TailwindOptimization[] = [];
    
    try {
      // Read current Tailwind config
      const currentConfig = await this.readTailwindConfig();
      
      // Apply mobile optimizations
      const optimizedConfig = await this.applyMobileOptimizations(currentConfig);
      
      // Generate optimization report
      const configOptimizations = this.compareConfigs(currentConfig, optimizedConfig);
      optimizations.push(...configOptimizations);
      
      // Write optimized config
      await this.writeTailwindConfig(optimizedConfig);
      
      // Generate mobile-specific utilities
      if (this.config.generateUtilities) {
        const utilityOptimizations = await this.generateMobileUtilities();
        optimizations.push(...utilityOptimizations);
      }
      
      // Optimize CSS purging for mobile
      if (this.config.purgeUnusedStyles) {
        const purgeOptimizations = await this.optimizePurging();
        optimizations.push(...purgeOptimizations);
      }
      
      this.emit('optimization:completed', optimizations);
      return optimizations;
      
    } catch (error) {
      this.emit('optimization:error', error);
      throw new Error(`Failed to optimize Tailwind for mobile: ${(error as Error).message}`);
    }
  }

  private async readTailwindConfig(): Promise<TailwindConfig> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      
      // Parse JavaScript/TypeScript config file
      // This is a simplified parser - in production, you'd want more robust parsing
      const configMatch = configContent.match(/module\.exports\s*=\s*({[\s\S]*})|export\s+default\s+({[\s\S]*})/);
      
      if (!configMatch) {
        throw new Error('Unable to parse Tailwind config');
      }
      
      const configString = configMatch[1] || configMatch[2];
      
      // Simple evaluation - in production, use proper AST parsing
      const config = eval(`(${configString})`);
      
      return config as TailwindConfig;
      
    } catch (error) {
      // Return default config if file doesn't exist or can't be parsed
      return this.getDefaultTailwindConfig();
    }
  }

  private async writeTailwindConfig(config: TailwindConfig): Promise<void> {
    const configContent = this.generateTailwindConfigContent(config);
    await fs.writeFile(this.configPath, configContent, 'utf8');
  }

  private async applyMobileOptimizations(config: TailwindConfig): Promise<TailwindConfig> {
    const optimizedConfig = JSON.parse(JSON.stringify(config));
    
    // Add mobile breakpoints
    if (this.config.enableMobileBreakpoints) {
      optimizedConfig.theme.screens = {
        ...this.config.customBreakpoints,
        ...MOBILE_BREAKPOINTS
      };
    }
    
    // Add mobile-specific extensions
    if (!optimizedConfig.theme.extend) {
      optimizedConfig.theme.extend = {};
    }
    
    // Add touch-optimized spacing
    if (this.config.optimizeForTouch) {
      optimizedConfig.theme.extend.spacing = {
        ...optimizedConfig.theme.extend.spacing,
        'touch': '44px', // Minimum touch target size
        'touch-lg': '48px', // Large touch target
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)'
      };
      
      optimizedConfig.theme.extend.minHeight = {
        ...optimizedConfig.theme.extend.minHeight,
        'touch': '44px',
        'touch-lg': '48px'
      };
      
      optimizedConfig.theme.extend.minWidth = {
        ...optimizedConfig.theme.extend.minWidth,
        'touch': '44px',
        'touch-lg': '48px'
      };
    }
    
    // Add mobile-friendly font sizes
    optimizedConfig.theme.extend.fontSize = {
      ...optimizedConfig.theme.extend.fontSize,
      'mobile-xs': ['12px', '16px'],
      'mobile-sm': ['14px', '20px'],
      'mobile-base': ['16px', '24px'],
      'mobile-lg': ['18px', '28px'],
      'mobile-xl': ['20px', '32px']
    };
    
    // Add mobile-specific colors for better contrast
    optimizedConfig.theme.extend.colors = {
      ...optimizedConfig.theme.extend.colors,
      'mobile-primary': {
        50: '#f0f9ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        900: '#1e3a8a'
      },
      'mobile-gray': {
        100: '#f3f4f6',
        200: '#e5e7eb',
        400: '#9ca3af',
        600: '#4b5563',
        800: '#1f2937',
        900: '#111827'
      }
    };
    
    // Add mobile-specific animations
    optimizedConfig.theme.extend.animation = {
      ...optimizedConfig.theme.extend.animation,
      'bounce-gentle': 'bounce-gentle 1s infinite',
      'slide-up': 'slide-up 0.3s ease-out',
      'slide-down': 'slide-down 0.3s ease-out',
      'fade-in': 'fade-in 0.2s ease-in',
      'touch-feedback': 'touch-feedback 0.1s ease-out'
    };
    
    optimizedConfig.theme.extend.keyframes = {
      ...optimizedConfig.theme.extend.keyframes,
      'bounce-gentle': {
        '0%, 100%': { transform: 'translateY(-5px)' },
        '50%': { transform: 'translateY(0)' }
      },
      'slide-up': {
        '0%': { transform: 'translateY(100%)' },
        '100%': { transform: 'translateY(0)' }
      },
      'slide-down': {
        '0%': { transform: 'translateY(-100%)' },
        '100%': { transform: 'translateY(0)' }
      },
      'fade-in': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' }
      },
      'touch-feedback': {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(0.95)' },
        '100%': { transform: 'scale(1)' }
      }
    };
    
    // Configure dark mode for mobile
    if (this.config.darkModeSupport) {
      optimizedConfig.darkMode = 'class';
    }
    
    // Add mobile-specific plugins
    if (!Array.isArray(optimizedConfig.plugins)) {
      optimizedConfig.plugins = [];
    }
    
    // Add custom mobile utilities plugin
    optimizedConfig.plugins.push(this.createMobileUtilitiesPlugin());
    
    return optimizedConfig;
  }

  private createMobileUtilitiesPlugin(): any {
    return {
      handler: ({ addUtilities, theme, variants }: any) => {
        const mobileUtilities = {
          // Touch target utilities
          '.touch-target': {
            minWidth: theme('spacing.touch'),
            minHeight: theme('spacing.touch'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          '.touch-target-lg': {
            minWidth: theme('spacing.touch-lg'),
            minHeight: theme('spacing.touch-lg'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          
          // Safe area utilities
          '.safe-area-inset': {
            paddingTop: theme('spacing.safe-top'),
            paddingBottom: theme('spacing.safe-bottom'),
            paddingLeft: theme('spacing.safe-left'),
            paddingRight: theme('spacing.safe-right')
          },
          '.safe-area-top': {
            paddingTop: theme('spacing.safe-top')
          },
          '.safe-area-bottom': {
            paddingBottom: theme('spacing.safe-bottom')
          },
          
          // Mobile scroll utilities
          '.scroll-touch': {
            '-webkit-overflow-scrolling': 'touch',
            overscrollBehavior: 'contain'
          },
          '.scroll-smooth-mobile': {
            scrollBehavior: 'smooth',
            '-webkit-overflow-scrolling': 'touch'
          },
          
          // Mobile focus utilities
          '.focus-mobile': {
            '&:focus': {
              outline: '2px solid #3b82f6',
              outlineOffset: '2px',
              borderRadius: '4px'
            }
          },
          
          // Touch feedback
          '.touch-feedback': {
            transition: 'transform 0.1s ease-out',
            '&:active': {
              transform: 'scale(0.95)'
            }
          },
          
          // Mobile-optimized text
          '.text-mobile-optimized': {
            fontSize: theme('fontSize.mobile-base'),
            lineHeight: theme('fontSize.mobile-base[1]'),
            '-webkit-text-size-adjust': '100%',
            textRendering: 'optimizeLegibility'
          },
          
          // Mobile button styles
          '.btn-mobile': {
            minHeight: theme('spacing.touch'),
            padding: '12px 24px',
            fontSize: theme('fontSize.mobile-base'),
            fontWeight: '600',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            '&:active': {
              transform: 'scale(0.95)'
            }
          },
          
          // Mobile input styles
          '.input-mobile': {
            minHeight: theme('spacing.touch'),
            fontSize: theme('fontSize.mobile-base'),
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            '&:focus': {
              outline: 'none',
              borderColor: '#3b82f6',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }
          },
          
          // Mobile modal/overlay
          '.overlay-mobile': {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          },
          
          // Mobile card
          '.card-mobile': {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
            maxWidth: '100%',
            width: '100%'
          }
        };
        
        addUtilities(mobileUtilities, ['responsive', 'hover']);
      }
    };
  }

  private compareConfigs(before: TailwindConfig, after: TailwindConfig): TailwindOptimization[] {
    const optimizations: TailwindOptimization[] = [];
    
    // Check breakpoint changes
    if (JSON.stringify(before.theme.screens) !== JSON.stringify(after.theme.screens)) {
      optimizations.push({
        type: 'breakpoint',
        description: 'Updated breakpoints for mobile optimization',
        before: JSON.stringify(before.theme.screens, null, 2),
        after: JSON.stringify(after.theme.screens, null, 2),
        impact: 'high',
        mobileSpecific: true
      });
    }
    
    // Check for new utilities
    if (after.plugins.length > before.plugins.length) {
      optimizations.push({
        type: 'utility',
        description: 'Added mobile-specific utility classes',
        impact: 'medium',
        mobileSpecific: true
      });
    }
    
    // Check theme extensions
    const beforeExtend = JSON.stringify(before.theme.extend || {});
    const afterExtend = JSON.stringify(after.theme.extend || {});
    
    if (beforeExtend !== afterExtend) {
      optimizations.push({
        type: 'component',
        description: 'Extended theme with mobile-optimized values',
        before: beforeExtend,
        after: afterExtend,
        impact: 'medium',
        mobileSpecific: true
      });
    }
    
    return optimizations;
  }

  private async generateMobileUtilities(): Promise<TailwindOptimization[]> {
    const optimizations: TailwindOptimization[] = [];
    
    // Generate responsive utilities CSS
    const utilitiesContent = await this.generateResponsiveUtilitiesCSS();
    
    // Write utilities file
    const utilitiesPath = join(this.projectPath, 'src', 'styles', 'mobile-utilities.css');
    await fs.mkdir(join(this.projectPath, 'src', 'styles'), { recursive: true });
    await fs.writeFile(utilitiesPath, utilitiesContent, 'utf8');
    
    optimizations.push({
      type: 'utility',
      description: 'Generated mobile-specific utility classes',
      after: utilitiesPath,
      impact: 'medium',
      mobileSpecific: true
    });
    
    return optimizations;
  }

  private async generateResponsiveUtilitiesCSS(): Promise<string> {
    const utilities: ResponsiveUtility[] = [
      {
        className: 'text-mobile',
        property: 'font-size',
        values: {
          'xs': '12px',
          'sm': '14px',
          'md': '16px',
          'lg': '18px',
          'xl': '20px'
        },
        description: 'Mobile-optimized font sizes',
        touchOptimized: false
      },
      {
        className: 'touch-target',
        property: 'min-width min-height',
        values: {
          'xs': '40px 40px',
          'sm': '44px 44px',
          'md': '48px 48px',
          'lg': '52px 52px',
          'xl': '56px 56px'
        },
        description: 'Touch-friendly target sizes',
        touchOptimized: true
      },
      {
        className: 'safe-padding',
        property: 'padding',
        values: {
          'top': 'env(safe-area-inset-top) 0 0 0',
          'bottom': '0 0 env(safe-area-inset-bottom) 0',
          'left': '0 0 0 env(safe-area-inset-left)',
          'right': '0 env(safe-area-inset-right) 0 0',
          'all': 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'
        },
        description: 'Safe area insets for mobile devices',
        touchOptimized: true
      }
    ];
    
    let css = `/* Mobile Utilities - Generated by Clear Piggy Mobile Integration */\n\n`;
    
    for (const utility of utilities) {
      css += `/* ${utility.description} */\n`;
      
      for (const [variant, value] of Object.entries(utility.values)) {
        const className = variant === 'md' ? utility.className : `${utility.className}-${variant}`;
        css += `.${className} {\n`;
        
        if (utility.property.includes(' ')) {
          const properties = utility.property.split(' ');
          const values = value.split(' ');
          properties.forEach((prop, index) => {
            css += `  ${prop}: ${values[index] || values[0]};\n`;
          });
        } else {
          css += `  ${utility.property}: ${value};\n`;
        }
        
        if (utility.touchOptimized) {
          css += `  cursor: pointer;\n`;
          css += `  user-select: none;\n`;
        }
        
        css += `}\n\n`;
      }
    }
    
    // Add responsive variations
    css += `/* Responsive Variations */\n`;
    
    for (const [breakpoint, size] of Object.entries(MOBILE_BREAKPOINTS)) {
      css += `@media (min-width: ${size}) {\n`;
      
      for (const utility of utilities) {
        for (const [variant, value] of Object.entries(utility.values)) {
          const className = variant === 'md' ? utility.className : `${utility.className}-${variant}`;
          css += `  .${breakpoint}\\:${className} {\n`;
          
          if (utility.property.includes(' ')) {
            const properties = utility.property.split(' ');
            const values = value.split(' ');
            properties.forEach((prop, index) => {
              css += `    ${prop}: ${values[index] || values[0]};\n`;
            });
          } else {
            css += `    ${utility.property}: ${value};\n`;
          }
          
          css += `  }\n`;
        }
      }
      
      css += `}\n\n`;
    }
    
    return css;
  }

  private async optimizePurging(): Promise<TailwindOptimization[]> {
    const optimizations: TailwindOptimization[] = [];
    
    // Update config to include mobile-specific purge patterns
    const config = await this.readTailwindConfig();
    
    if (!config.content) {
      config.content = [];
    }
    
    // Add mobile-specific patterns
    const mobilePatterns = [
      './src/**/*.{js,jsx,ts,tsx}',
      './src/components/mobile/**/*.{js,jsx,ts,tsx}',
      './src/pages/mobile/**/*.{js,jsx,ts,tsx}',
      './public/index.html'
    ];
    
    const newPatterns = mobilePatterns.filter(pattern => !config.content.includes(pattern));
    
    if (newPatterns.length > 0) {
      config.content.push(...newPatterns);
      await this.writeTailwindConfig(config);
      
      optimizations.push({
        type: 'purge',
        description: 'Updated content patterns for better CSS purging',
        after: newPatterns.join(', '),
        impact: 'medium',
        mobileSpecific: true
      });
    }
    
    return optimizations;
  }

  private getDefaultTailwindConfig(): TailwindConfig {
    return {
      content: ['./src/**/*.{js,jsx,ts,tsx}'],
      theme: {
        extend: {}
      },
      plugins: []
    };
  }

  private generateTailwindConfigContent(config: TailwindConfig): string {
    const configString = JSON.stringify(config, null, 2)
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
      .replace(/"/g, "'"); // Use single quotes
    
    return `/** @type {import('tailwindcss').Config} */
module.exports = ${configString.replace(/'handler':\s*({[^}]*})/g, (match, handler) => {
  // Convert handler back to function for plugins
  return match.replace(/'/g, '"');
})};
`;
  }

  async generateMobileComponentClasses(): Promise<string> {
    const componentClasses = `
/* Mobile Component Classes - Generated by Clear Piggy Mobile Integration */

/* Mobile Navigation */
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom;
  @apply flex items-center justify-around px-4 py-2;
  z-index: 50;
}

.mobile-nav-item {
  @apply touch-target flex flex-col items-center justify-center;
  @apply text-xs font-medium text-gray-600 transition-colors duration-200;
}

.mobile-nav-item.active {
  @apply text-blue-600;
}

/* Mobile Header */
.mobile-header {
  @apply fixed top-0 left-0 right-0 bg-white border-b border-gray-200 safe-area-top;
  @apply flex items-center justify-between px-4 py-3;
  z-index: 40;
}

.mobile-header-title {
  @apply text-lg font-semibold text-gray-900;
}

.mobile-header-action {
  @apply touch-target p-2 rounded-lg transition-colors duration-200;
  @apply hover:bg-gray-100 focus-mobile;
}

/* Mobile Cards */
.mobile-card {
  @apply card-mobile border border-gray-200;
}

.mobile-card-header {
  @apply flex items-center justify-between pb-4 border-b border-gray-100;
}

.mobile-card-title {
  @apply text-mobile-lg font-semibold text-gray-900;
}

.mobile-card-content {
  @apply pt-4;
}

/* Mobile Forms */
.mobile-form {
  @apply space-y-4 p-4;
}

.mobile-form-group {
  @apply space-y-2;
}

.mobile-form-label {
  @apply block text-mobile-sm font-medium text-gray-700;
}

.mobile-form-input {
  @apply input-mobile w-full;
}

.mobile-form-button {
  @apply btn-mobile w-full bg-blue-600 text-white;
  @apply hover:bg-blue-700 focus:bg-blue-700;
}

/* Mobile Lists */
.mobile-list {
  @apply divide-y divide-gray-200;
}

.mobile-list-item {
  @apply touch-feedback px-4 py-3 flex items-center justify-between;
  @apply hover:bg-gray-50 transition-colors duration-200;
}

.mobile-list-item-content {
  @apply flex-1 min-w-0;
}

.mobile-list-item-title {
  @apply text-mobile-base font-medium text-gray-900 truncate;
}

.mobile-list-item-subtitle {
  @apply text-mobile-sm text-gray-500 truncate;
}

.mobile-list-item-action {
  @apply touch-target ml-4 text-gray-400;
}

/* Mobile Modals */
.mobile-modal {
  @apply overlay-mobile;
}

.mobile-modal-content {
  @apply card-mobile mx-4 max-w-sm;
  @apply animate-slide-up;
}

.mobile-modal-header {
  @apply flex items-center justify-between pb-4 border-b border-gray-200;
}

.mobile-modal-title {
  @apply text-mobile-lg font-semibold text-gray-900;
}

.mobile-modal-close {
  @apply touch-target p-2 rounded-lg text-gray-400;
  @apply hover:text-gray-600 hover:bg-gray-100;
}

.mobile-modal-body {
  @apply py-4;
}

.mobile-modal-footer {
  @apply pt-4 border-t border-gray-200 flex space-x-3;
}

/* Mobile Tabs */
.mobile-tabs {
  @apply flex border-b border-gray-200 overflow-x-auto;
  @apply scroll-touch;
}

.mobile-tab {
  @apply touch-target flex-shrink-0 px-4 py-2 text-mobile-sm font-medium;
  @apply text-gray-600 border-b-2 border-transparent;
  @apply hover:text-gray-900 transition-colors duration-200;
}

.mobile-tab.active {
  @apply text-blue-600 border-blue-600;
}

/* Mobile Loading States */
.mobile-skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

.mobile-spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
}

/* Mobile Feedback */
.mobile-toast {
  @apply fixed top-4 left-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg;
  @apply animate-slide-down shadow-lg z-50;
}

.mobile-toast.success {
  @apply bg-green-600;
}

.mobile-toast.error {
  @apply bg-red-600;
}

.mobile-toast.warning {
  @apply bg-yellow-600;
}

/* Mobile Utilities */
.mobile-scroll-container {
  @apply scroll-touch overscroll-contain;
}

.mobile-hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mobile-hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Dark mode variations */
@media (prefers-color-scheme: dark) {
  .mobile-nav {
    @apply bg-gray-900 border-gray-700;
  }
  
  .mobile-header {
    @apply bg-gray-900 border-gray-700;
  }
  
  .mobile-card {
    @apply bg-gray-800 border-gray-700;
  }
  
  .mobile-form-input {
    @apply bg-gray-800 border-gray-600 text-white;
  }
}
`;
    
    return componentClasses;
  }

  async createMobileStylesIndex(): Promise<void> {
    const stylesDir = join(this.projectPath, 'src', 'styles');
    await fs.mkdir(stylesDir, { recursive: true });
    
    const indexContent = `/* Mobile Styles Index - Generated by Clear Piggy Mobile Integration */

/* Import Tailwind base, components, and utilities */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import mobile-specific utilities */
@import './mobile-utilities.css';
@import './mobile-components.css';

/* Mobile base styles */
@layer base {
  html {
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  
  body {
    @apply text-mobile-optimized;
  }
  
  /* Ensure touch targets are accessible */
  button, 
  [role="button"],
  input[type="submit"],
  input[type="button"] {
    @apply touch-target;
  }
  
  /* Improve touch scrolling */
  .overflow-y-auto,
  .overflow-y-scroll {
    @apply scroll-touch;
  }
}

/* Mobile component layer */
@layer components {
  /* Components will be imported from mobile-components.css */
}

/* Mobile utility layer */
@layer utilities {
  /* Custom utilities will be imported from mobile-utilities.css */
}
`;
    
    await fs.writeFile(join(stylesDir, 'index.css'), indexContent, 'utf8');
    
    // Create mobile components file
    const componentsContent = await this.generateMobileComponentClasses();
    await fs.writeFile(join(stylesDir, 'mobile-components.css'), componentsContent, 'utf8');
  }
}