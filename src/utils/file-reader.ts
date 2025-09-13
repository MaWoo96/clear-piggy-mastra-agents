/**
 * File system utilities for reading React components
 * Optimized for Clear Piggy project structure
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { ComponentFile } from '../types/analysis';

export class ComponentFileReader {
  private projectPath: string;
  private componentsPath: string;
  private supportedExtensions: string[];

  constructor(
    projectPath: string,
    componentsPath: string = 'src/components',
    supportedExtensions: string[] = ['.tsx', '.ts', '.jsx', '.js']
  ) {
    this.projectPath = projectPath;
    this.componentsPath = componentsPath;
    this.supportedExtensions = supportedExtensions;
  }

  /**
   * Read all React components from the project
   */
  async readAllComponents(): Promise<ComponentFile[]> {
    const componentFiles: ComponentFile[] = [];
    const fullComponentsPath = path.join(this.projectPath, this.componentsPath);

    try {
      // Create glob pattern for supported extensions
      const extensions = this.supportedExtensions.map(ext => ext.slice(1)).join('|');
      const pattern = `${fullComponentsPath}/**/*.{${extensions}}`;
      
      const files = await glob(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/*.stories.*',
        ],
      });

      for (const filePath of files) {
        try {
          const componentFile = await this.readComponentFile(filePath);
          if (componentFile) {
            componentFiles.push(componentFile);
          }
        } catch (error) {
          console.warn(`Failed to read component file ${filePath}:`, error);
        }
      }

      return componentFiles;
    } catch (error) {
      console.error('Failed to read components directory:', error);
      return [];
    }
  }

  /**
   * Read a specific component file
   */
  async readComponentFile(filePath: string): Promise<ComponentFile | null> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Validate that this is likely a React component
      if (!this.isReactComponent(content)) {
        return null;
      }

      return {
        path: filePath,
        name: path.basename(filePath, path.extname(filePath)),
        content,
        size: stats.size,
        lastModified: stats.mtime,
      };
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Read components from specific directories (e.g., pages, layouts)
   */
  async readComponentsFromPath(relativePath: string): Promise<ComponentFile[]> {
    const fullPath = path.join(this.projectPath, relativePath);
    const components: ComponentFile[] = [];

    try {
      const extensions = this.supportedExtensions.map(ext => ext.slice(1)).join('|');
      const pattern = `${fullPath}/**/*.{${extensions}}`;
      
      const files = await glob(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*',
        ],
      });

      for (const filePath of files) {
        const component = await this.readComponentFile(filePath);
        if (component) {
          components.push(component);
        }
      }

      return components;
    } catch (error) {
      console.error(`Failed to read components from ${relativePath}:`, error);
      return [];
    }
  }

  /**
   * Find components by pattern (e.g., all Button components)
   */
  async findComponentsByPattern(pattern: string): Promise<ComponentFile[]> {
    const allComponents = await this.readAllComponents();
    const regex = new RegExp(pattern, 'i');
    
    return allComponents.filter(component => 
      regex.test(component.name) || regex.test(component.path)
    );
  }

  /**
   * Get components that likely contain financial UI patterns
   */
  async getFinancialComponents(): Promise<ComponentFile[]> {
    const financialPatterns = [
      'transaction',
      'budget',
      'expense',
      'income',
      'dashboard',
      'chart',
      'graph',
      'balance',
      'account',
      'payment',
      'card',
      'wallet',
      'money',
      'currency',
      'financial',
    ];

    const allComponents = await this.readAllComponents();
    
    return allComponents.filter(component => {
      const fileName = component.name.toLowerCase();
      const filePath = component.path.toLowerCase();
      const content = component.content.toLowerCase();

      return financialPatterns.some(pattern => 
        fileName.includes(pattern) || 
        filePath.includes(pattern) ||
        content.includes(pattern)
      );
    });
  }

  /**
   * Check if file content represents a React component
   */
  private isReactComponent(content: string): boolean {
    const reactPatterns = [
      /import.*react/i,
      /export.*function.*\(/,
      /export.*const.*=.*\(/,
      /export.*default.*function/,
      /export.*default.*\(/,
      /<[A-Z]/,  // JSX elements
      /useState|useEffect|useCallback|useMemo/,
      /React\./,
    ];

    return reactPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<{
    totalComponents: number;
    componentsByType: Record<string, number>;
    totalSize: number;
    averageSize: number;
  }> {
    const components = await this.readAllComponents();
    const totalSize = components.reduce((sum, comp) => sum + comp.size, 0);
    
    const componentsByType: Record<string, number> = {};
    
    components.forEach(component => {
      const ext = path.extname(component.path);
      componentsByType[ext] = (componentsByType[ext] || 0) + 1;
    });

    return {
      totalComponents: components.length,
      componentsByType,
      totalSize,
      averageSize: components.length > 0 ? totalSize / components.length : 0,
    };
  }

  /**
   * Read package.json to understand project dependencies
   */
  async readPackageJson(): Promise<any> {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Could not read package.json:', error);
      return null;
    }
  }

  /**
   * Check if the project uses specific libraries
   */
  async checkProjectDependencies(): Promise<{
    tailwindcss: boolean;
    framerMotion: boolean;
    supabase: boolean;
    plaid: boolean;
    typescript: boolean;
  }> {
    const packageJson = await this.readPackageJson();
    
    if (!packageJson) {
      return {
        tailwindcss: false,
        framerMotion: false,
        supabase: false,
        plaid: false,
        typescript: false,
      };
    }

    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    return {
      tailwindcss: 'tailwindcss' in allDependencies,
      framerMotion: 'framer-motion' in allDependencies,
      supabase: '@supabase/supabase-js' in allDependencies,
      plaid: 'react-plaid-link' in allDependencies || 'plaid' in allDependencies,
      typescript: 'typescript' in allDependencies,
    };
  }
}