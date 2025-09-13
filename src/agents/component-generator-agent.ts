/**
 * Clear Piggy Mobile Component Generator Agent
 * Mastra AI agent that generates mobile-optimized React components from desktop versions
 */

// Simplified component generator without Mastra Agent dependency
import { ComponentFileReader } from '../utils/file-reader';
import { 
  ComponentGenerationConfig,
  DesktopComponentInput,
  MobileComponentOutput,
  GenerationResult,
  FinancialComponentPattern,
  ComponentTemplate
} from '../types/component-generation-types';
import { FINANCIAL_COMPONENT_TEMPLATES } from '../templates/financial-component-templates';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ClearPiggyComponentGeneratorAgent {
  private config: ComponentGenerationConfig;
  private fileReader: ComponentFileReader;

  constructor(config: ComponentGenerationConfig, agentConfig?: any) {

    this.config = config;
    this.fileReader = new ComponentFileReader(
      config.projectPath,
      config.componentsPath
    );
  }

  /**
   * Generate mobile components from desktop versions
   */
  async generateMobileComponents(componentNames?: string[]): Promise<GenerationResult> {
    console.log('🚀 Starting mobile component generation...');
    
    try {
      // Read desktop components
      const desktopComponents = await this.discoverDesktopComponents(componentNames);
      console.log(`📁 Found ${desktopComponents.length} desktop components to convert`);

      // Process each component
      const results: MobileComponentOutput[] = [];
      const errors: GenerationResult['errors'] = [];
      
      for (const desktop of desktopComponents) {
        try {
          console.log(`🔄 Processing: ${desktop.componentName}`);
          const mobileComponent = await this.generateSingleComponent(desktop);
          results.push(mobileComponent);
          console.log(`✅ Generated: ${mobileComponent.componentName}`);
        } catch (error) {
          console.error(`❌ Failed to generate ${desktop.componentName}:`, error);
          errors.push({
            componentName: desktop.componentName,
            error: error instanceof Error ? error.message : 'Unknown error',
            suggestion: 'Check component structure and dependencies',
            severity: 'high'
          });
        }
      }

      // Save generated components
      if (results.length > 0) {
        await this.saveGeneratedComponents(results);
      }

      const summary = {
        totalComponents: desktopComponents.length,
        successfulGenerations: results.length,
        failedGenerations: errors.length,
        optimizationsApplied: results.reduce((sum, r) => sum + r.mobileOptimizations.length, 0),
        accessibilityFeatures: results.reduce((sum, r) => sum + r.accessibilityFeatures.length, 0),
      };

      console.log('\n📊 Generation Summary:');
      console.log(`✅ Successful: ${summary.successfulGenerations}`);
      console.log(`❌ Failed: ${summary.failedGenerations}`);
      console.log(`📱 Mobile optimizations: ${summary.optimizationsApplied}`);
      console.log(`♿ Accessibility features: ${summary.accessibilityFeatures}`);

      return {
        success: results.length > 0,
        componentsGenerated: results,
        errors,
        warnings: [],
        summary
      };

    } catch (error) {
      console.error('💥 Component generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate AI-enhanced component code
   */
  async generateWithAI(desktopComponent: DesktopComponentInput): Promise<string> {
    const template = FINANCIAL_COMPONENT_TEMPLATES[desktopComponent.detectedPattern];
    
    const prompt = this.buildGenerationPrompt(desktopComponent, template);
    
    try {
      // For now, return a template-based response
      // In a full implementation, this would use AI generation
      const response = {
        text: this.generateFromTemplate(desktopComponent, template)
      };

      return this.extractCodeFromResponse(response.text);
    } catch (error) {
      console.warn('⚠️ AI generation failed, using template fallback:', error);
      return this.generateFromTemplate(desktopComponent, template);
    }
  }

  /**
   * Generate component interfaces and types
   */
  async generateComponentInterfaces(component: MobileComponentOutput, template: ComponentTemplate): Promise<string> {
    const prompt = `
    Generate comprehensive TypeScript interfaces for this Clear Piggy mobile component:

    Component: ${component.componentName}
    Pattern: Financial SaaS component

    Requirements:
    1. Main component props interface with detailed JSDoc comments
    2. Data interfaces for Supabase integration
    3. Event handler interfaces
    4. Styling and variant interfaces
    5. Accessibility props
    6. Mobile-specific props (touch handlers, gestures)

    Include proper validation types and optional/required field annotations.
    Make interfaces extensible and reusable across the Clear Piggy app.

    Component code for reference:
    \`\`\`typescript
    ${component.componentCode.substring(0, 2000)}...
    \`\`\`

    Generate complete TypeScript interfaces:
    `;

    try {
      // Use template-based TypeScript interface generation
      return this.generateFallbackTypeScriptInterface(component, template);
    } catch (error) {
      console.warn('⚠️ Interface generation failed, using fallback');
      return this.generateFallbackInterfaces(component);
    }
  }

  /**
   * Generate Storybook stories
   */
  async generateStorybookStory(component: MobileComponentOutput, template: ComponentTemplate): Promise<string> {
    if (!this.config.enableStorybook) return '';

    const prompt = `
    Generate comprehensive Storybook stories for this Clear Piggy mobile component:

    Component: ${component.componentName}
    Type: Financial SaaS mobile component

    Create stories that showcase:
    1. Default state with sample financial data
    2. Loading state
    3. Error state
    4. Mobile-specific interactions (touch, swipe)
    5. Different variants and sizes
    6. Accessibility features
    7. Dark mode support
    8. Various financial data scenarios (high/low balances, over budget, etc.)

    Include:
    - CSF 3.0 format
    - Controls for all props
    - Mobile viewport configurations
    - Mock Supabase data
    - Accessibility testing setup
    - Touch interaction examples

    Component reference:
    \`\`\`typescript
    ${component.componentCode.substring(0, 1500)}...
    \`\`\`

    Generate complete Storybook story file:
    `;

    try {
      // Use template-based Storybook generation
      return this.generateFallbackStorybookStory(component, template);
    } catch (error) {
      console.warn('⚠️ Storybook generation failed, using fallback');
      return this.generateFallbackStorybook(component);
    }
  }

  // Private helper methods

  private async discoverDesktopComponents(componentNames?: string[]): Promise<DesktopComponentInput[]> {
    const allComponents = await this.fileReader.readAllComponents();
    
    let targetComponents = allComponents;
    if (componentNames && componentNames.length > 0) {
      targetComponents = allComponents.filter(comp => 
        componentNames.some(name => 
          comp.name.toLowerCase().includes(name.toLowerCase())
        )
      );
    }

    const desktopComponents: DesktopComponentInput[] = [];
    
    for (const component of targetComponents) {
      const pattern = this.detectFinancialPattern(component);
      const props = await this.extractComponentProps(component);
      const supabaseIntegrations = await this.detectSupabaseIntegrations(component);
      const dependencies = await this.extractDependencies(component);

      desktopComponents.push({
        filePath: component.path,
        componentName: component.name,
        content: component.content,
        detectedPattern: pattern,
        dependencies,
        props,
        supabaseIntegrations
      });
    }

    return desktopComponents;
  }

  private async generateSingleComponent(desktop: DesktopComponentInput): Promise<MobileComponentOutput> {
    const template = FINANCIAL_COMPONENT_TEMPLATES[desktop.detectedPattern];
    
    // Generate component code
    const componentCode = await this.generateWithAI(desktop);
    
    // Generate interfaces
    const interfaceCode = this.config.enableTypescriptInterfaces 
      ? await this.generateComponentInterfaces({
          componentName: desktop.componentName,
          filePath: '',
          componentCode,
          interfaceCode: '',
          documentation: '',
          mobileOptimizations: [],
          accessibilityFeatures: []
        }, template)
      : '';

    // Generate Storybook story
    const storybookCode = this.config.enableStorybook 
      ? await this.generateStorybookStory({
          componentName: desktop.componentName,
          filePath: '',
          componentCode,
          interfaceCode,
          documentation: '',
          mobileOptimizations: [],
          accessibilityFeatures: []
        }, template)
      : '';

    // Generate documentation
    const documentation = await this.generateDocumentation(desktop, template);

    // Extract optimizations and accessibility features from template
    const mobileOptimizations = template.mobileOptimizations.map(opt => ({
      type: this.categorizeMobileOptimization(opt),
      description: opt,
      implementation: this.extractImplementationFromCode(componentCode, opt),
      benefit: this.describeBenefit(opt)
    }));

    const accessibilityFeatures = template.accessibilityRequirements.map(req => ({
      feature: req,
      wcagCriterion: 'WCAG 2.1 AA',
      implementation: req,
      testing: 'Manual testing required'
    }));

    // Generate file paths
    const mobileComponentName = desktop.componentName.startsWith('Mobile') 
      ? desktop.componentName 
      : `Mobile${desktop.componentName}`;
    
    const componentPath = path.join(this.config.outputPath, 'components', `${mobileComponentName}.tsx`);
    const interfacePath = path.join(this.config.outputPath, 'types', `${mobileComponentName}Types.ts`);
    const storybookPath = this.config.enableStorybook 
      ? path.join(this.config.outputPath, 'stories', `${mobileComponentName}.stories.tsx`)
      : '';

    return {
      componentName: mobileComponentName,
      filePath: componentPath,
      componentCode,
      interfaceCode,
      storybookCode,
      documentation,
      mobileOptimizations,
      accessibilityFeatures
    };
  }

  private async saveGeneratedComponents(components: MobileComponentOutput[]): Promise<void> {
    console.log('💾 Saving generated components...');

    for (const component of components) {
      try {
        // Create directories
        await fs.mkdir(path.dirname(component.filePath), { recursive: true });
        
        // Save component file
        await fs.writeFile(component.filePath, component.componentCode);
        console.log(`📄 Saved: ${component.filePath}`);

        // Save interface file
        if (component.interfaceCode) {
          const interfacePath = component.filePath.replace('.tsx', 'Types.ts').replace('/components/', '/types/');
          await fs.mkdir(path.dirname(interfacePath), { recursive: true });
          await fs.writeFile(interfacePath, component.interfaceCode);
          console.log(`📄 Saved: ${interfacePath}`);
        }

        // Save Storybook story
        if (component.storybookCode) {
          const storybookPath = component.filePath.replace('.tsx', '.stories.tsx').replace('/components/', '/stories/');
          await fs.mkdir(path.dirname(storybookPath), { recursive: true });
          await fs.writeFile(storybookPath, component.storybookCode);
          console.log(`📄 Saved: ${storybookPath}`);
        }

        // Save documentation
        const docPath = component.filePath.replace('.tsx', '.md').replace('/components/', '/docs/');
        await fs.mkdir(path.dirname(docPath), { recursive: true });
        await fs.writeFile(docPath, component.documentation);
        console.log(`📄 Saved: ${docPath}`);

      } catch (error) {
        console.error(`❌ Failed to save ${component.componentName}:`, error);
      }
    }
  }

  private detectFinancialPattern(component: any): FinancialComponentPattern {
    const content = component.content.toLowerCase();
    const name = component.name.toLowerCase();

    // Pattern matching logic
    if (name.includes('transaction') || content.includes('transaction')) return 'transaction-list';
    if (name.includes('budget') || content.includes('budget')) return 'budget-card';
    if (name.includes('dashboard') || content.includes('dashboard')) return 'dashboard-metrics';
    if (name.includes('nav') || content.includes('navigation')) return 'navigation-bar';
    if (name.includes('chart') || content.includes('chart') || content.includes('recharts')) return 'chart-component';
    if (name.includes('form') || content.includes('form')) return 'form-financial';
    if (name.includes('receipt') || content.includes('receipt')) return 'receipt-upload';
    if (name.includes('account') || content.includes('account')) return 'account-summary';

    return 'dashboard-metrics'; // Default fallback
  }

  private async extractComponentProps(component: any): Promise<any[]> {
    // Extract props from TypeScript interfaces and component definitions
    const propMatches = component.content.match(/interface\s+\w+Props\s*{([^}]+)}/s);
    if (!propMatches) return [];

    // Parse prop definitions (simplified)
    const propsText = propMatches[1];
    const propLines = propsText.split('\n').filter((line: string) => line.trim() && !line.trim().startsWith('//'));
    
    return propLines.map((line: string) => {
      const [name, type] = line.split(':').map((s: string) => s.trim());
      return {
        name: name?.replace('?', ''),
        type: type?.replace(';', ''),
        required: !name?.includes('?'),
        description: '',
        defaultValue: ''
      };
    }).filter((prop: any) => prop.name);
  }

  private async detectSupabaseIntegrations(component: any): Promise<any[]> {
    const supabaseMatches = component.content.match(/supabase\s*\.\s*from\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
    if (!supabaseMatches) return [];

    return supabaseMatches.map((match: string) => {
      const tableMatch = match.match(/['"`]([^'"`]+)['"`]/);
      return {
        table: tableMatch ? tableMatch[1] : 'unknown',
        operation: 'select',
        columns: ['*'],
        filters: {},
        realtime: false
      };
    });
  }

  private async extractDependencies(component: any): Promise<string[]> {
    const importMatches = component.content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g);
    if (!importMatches) return [];

    return importMatches
      .map((match: string) => {
        const moduleMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
        return moduleMatch ? moduleMatch[1] : null;
      })
      .filter(Boolean) as string[];
  }

  private buildGenerationPrompt(desktop: DesktopComponentInput, template: ComponentTemplate): string {
    return `
    Transform this Clear Piggy desktop component into a mobile-optimized version:

    Original Component: ${desktop.componentName}
    Detected Pattern: ${desktop.detectedPattern}
    File Path: ${desktop.filePath}

    Desktop Component Code:
    \`\`\`typescript
    ${desktop.content}
    \`\`\`

    Target Template Pattern: ${template.name}
    Required Dependencies: ${template.requiredDependencies.join(', ')}

    Mobile Optimization Requirements:
    ${template.mobileOptimizations.map(opt => `- ${opt}`).join('\n')}

    Accessibility Requirements:
    ${template.accessibilityRequirements.map(req => `- ${req}`).join('\n')}

    Tailwind Patterns to Apply:
    ${template.tailwindClasses.map(tc => `- ${tc}`).join('\n')}

    Framer Motion Animations:
    ${template.framerMotionAnimations.map(anim => `- ${anim}`).join('\n')}

    Generate a complete mobile-optimized React component that:
    1. Uses mobile-first responsive design with Tailwind CSS
    2. Implements proper touch targets (44px minimum)
    3. Includes Framer Motion animations for better UX
    4. Follows WCAG 2.1 AA accessibility standards
    5. Integrates with Supabase data patterns
    6. Uses proper TypeScript typing
    7. Includes error handling and loading states
    8. Optimizes for financial SaaS workflows

    Component name should be: Mobile${desktop.componentName}

    Return only the complete React component code with imports:
    `;
  }

  private extractCodeFromResponse(response: string): string {
    // Extract code block from AI response
    const codeBlockMatch = response.match(/```(?:typescript|tsx?)\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // Fallback: look for component definition
    const componentMatch = response.match(/(import[\s\S]*?export\s+(?:const|default)[\s\S]*?;)/);
    if (componentMatch) {
      return componentMatch[1];
    }

    return response; // Return as-is if no code block found
  }


  private async generateDocumentation(desktop: DesktopComponentInput, template: ComponentTemplate): Promise<string> {
    return `
# Mobile${desktop.componentName}

Mobile-optimized version of ${desktop.componentName} for Clear Piggy financial SaaS.

## Overview

${template.description}

## Features

### Mobile Optimizations
${template.mobileOptimizations.map(opt => `- ${opt}`).join('\n')}

### Accessibility Features
${template.accessibilityRequirements.map(req => `- **${req}**: Implementation details in component code`).join('\n')}

## Usage

\`\`\`tsx
import { Mobile${desktop.componentName} } from './Mobile${desktop.componentName}';

function App() {
  return (
    <Mobile${desktop.componentName}
      // Add props here
    />
  );
}
\`\`\`

## Props

See \`Mobile${desktop.componentName}Types.ts\` for complete TypeScript interface definitions.

## Dependencies

${template.requiredDependencies.map(dep => `- ${dep}`).join('\n')}

## Testing

- [ ] Touch target compliance (minimum 44px)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility  
- [ ] Mobile device testing
- [ ] Performance on low-end devices

## Related Components

- Original: ${desktop.componentName}
- Pattern: ${desktop.detectedPattern}
`;
  }

  private extractInterfacesFromResponse(response: string): string {
    const interfaceMatch = response.match(/```typescript\n([\s\S]*?)\n```/);
    return interfaceMatch ? interfaceMatch[1] : this.generateBasicInterface();
  }

  private extractStorybookFromResponse(response: string): string {
    const storyMatch = response.match(/```(?:typescript|tsx)\n([\s\S]*?)\n```/);
    return storyMatch ? storyMatch[1] : this.generateBasicStorybook();
  }

  private generateFallbackInterfaces(component: MobileComponentOutput): string {
    return `
// Generated TypeScript interfaces for ${component.componentName}

export interface ${component.componentName}Props {
  className?: string;
  'aria-label'?: string;
  // Add component-specific props here
}

export interface ${component.componentName}Data {
  id: string;
  // Add data structure here
}
`;
  }

  private generateFallbackStorybook(component: MobileComponentOutput): string {
    return `
// Generated Storybook story for ${component.componentName}

import type { Meta, StoryObj } from '@storybook/react';
import { ${component.componentName} } from './${component.componentName}';

const meta: Meta<typeof ${component.componentName}> = {
  title: 'Mobile Components/${component.componentName}',
  component: ${component.componentName},
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Add default props
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load data',
  },
};
`;
  }

  private generateBasicInterface(): string {
    return `
export interface ComponentProps {
  className?: string;
  'aria-label'?: string;
}
`;
  }

  private generateBasicStorybook(): string {
    return `
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Generated Component',
  parameters: {
    viewport: { defaultViewport: 'mobile1' }
  }
};

export default meta;
`;
  }

  private categorizeMobileOptimization(optimization: string): any {
    if (optimization.includes('touch') || optimization.includes('target')) return 'touch-targets';
    if (optimization.includes('responsive') || optimization.includes('layout')) return 'responsive-layout';
    if (optimization.includes('performance') || optimization.includes('virtual')) return 'performance';
    if (optimization.includes('swipe') || optimization.includes('gesture')) return 'gestures';
    if (optimization.includes('loading') || optimization.includes('state')) return 'loading-states';
    return 'touch-targets';
  }

  private extractImplementationFromCode(code: string, optimization: string): string {
    // Extract relevant code snippets that implement the optimization
    if (optimization.includes('touch target')) {
      const touchMatch = code.match(/min-h-\[44px\]|min-w-\[44px\]|touch-manipulation/);
      return touchMatch ? touchMatch[0] : 'min-h-[44px] min-w-[44px] touch-manipulation';
    }
    return 'Implementation details in component code';
  }

  private describeBenefit(optimization: string): string {
    const benefits = {
      'touch': 'Improves mobile usability and accessibility compliance',
      'responsive': 'Ensures proper display across all screen sizes',
      'performance': 'Reduces battery drain and improves user experience',
      'gesture': 'Provides intuitive mobile interaction patterns',
      'loading': 'Improves perceived performance and user feedback'
    };

    for (const [key, benefit] of Object.entries(benefits)) {
      if (optimization.toLowerCase().includes(key)) {
        return benefit;
      }
    }

    return 'Enhances mobile user experience';
  }

  private generateFromTemplate(desktopComponent: DesktopComponentInput, template: ComponentTemplate): string {
    // Template-based component generation
    return template.baseTemplate
      .replace(/{{componentName}}/g, `Mobile${desktopComponent.componentName}`)
      .replace(/{{originalComponentName}}/g, desktopComponent.componentName)
      .replace(/{{componentCode}}/g, desktopComponent.content.substring(0, 500) + '...');
  }

  private generateFallbackTypeScriptInterface(component: MobileComponentOutput, template: ComponentTemplate): string {
    return `// TypeScript interfaces for ${component.componentName}
export interface ${component.componentName}Props {
  // Props based on template pattern: ${template.pattern}
  className?: string;
  onPress?: () => void;
}

export interface ${component.componentName}Data {
  // Data interfaces for financial patterns
  id: string;
  // Add more fields based on component type
}`;
  }

  private generateFallbackStorybookStory(component: MobileComponentOutput, template: ComponentTemplate): string {
    return `// Storybook story for ${component.componentName}
import type { Meta, StoryObj } from '@storybook/react';
import { ${component.componentName} } from './${component.componentName}';

const meta: Meta<typeof ${component.componentName}> = {
  title: 'Mobile Components/${component.componentName}',
  component: ${component.componentName},
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};`;
  }
}