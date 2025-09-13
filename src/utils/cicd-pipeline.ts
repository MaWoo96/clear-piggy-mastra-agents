import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';
import {
  CICDConfig,
  DeploymentConfig
} from '../types/integration-agent-types';

export interface PipelineConfig {
  platform: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops' | 'circleci';
  version: string;
  branches: {
    main: string;
    develop: string;
    feature: string;
  };
  environments: {
    development: PipelineEnvironment;
    staging: PipelineEnvironment;
    production: PipelineEnvironment;
  };
  stages: PipelineStage[];
  mobileOptimizations: MobilePipelineConfig;
  notifications: NotificationConfig[];
  security: SecurityConfig;
}

export interface PipelineEnvironment {
  name: string;
  url?: string;
  variables: { [key: string]: string };
  secrets: string[];
  approvals: {
    required: boolean;
    reviewers: string[];
    timeout: number;
  };
  gates: DeploymentGate[];
}

export interface PipelineStage {
  name: string;
  dependsOn: string[];
  condition: string;
  jobs: PipelineJob[];
  parallel: boolean;
  continueOnError: boolean;
  timeout: number;
}

export interface PipelineJob {
  name: string;
  runs_on: string;
  steps: PipelineStep[];
  strategy?: {
    matrix?: { [key: string]: string[] };
    failFast?: boolean;
    maxParallel?: number;
  };
  environment?: string;
  timeout: number;
}

export interface PipelineStep {
  name: string;
  uses?: string;
  run?: string;
  with?: { [key: string]: any };
  env?: { [key: string]: string };
  condition?: string;
  continueOnError?: boolean;
  timeout?: number;
}

export interface MobilePipelineConfig {
  deviceTesting: {
    enabled: boolean;
    devices: MobileDevice[];
    browsers: string[];
    viewports: ViewportConfig[];
  };
  performanceTesting: {
    enabled: boolean;
    budgets: PerformanceBudget[];
    tools: string[];
    thresholds: PerformanceThreshold[];
  };
  accessibilityTesting: {
    enabled: boolean;
    standards: string[];
    tools: string[];
    minimumScore: number;
  };
  bundleAnalysis: {
    enabled: boolean;
    maxSize: number;
    compressionEnabled: boolean;
    treeshaking: boolean;
  };
}

export interface MobileDevice {
  name: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor: number;
  };
  platform: 'ios' | 'android' | 'desktop';
}

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
}

export interface PerformanceBudget {
  metric: string;
  budget: number;
  threshold: 'error' | 'warn';
}

export interface PerformanceThreshold {
  name: string;
  metric: string;
  value: number;
  comparison: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
}

export interface NotificationConfig {
  type: 'slack' | 'teams' | 'email' | 'webhook';
  target: string;
  events: string[];
  template?: string;
}

export interface SecurityConfig {
  secretScanning: boolean;
  dependencyScanning: boolean;
  codeScanning: boolean;
  containerScanning: boolean;
  licenseScanning: boolean;
  securityThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeploymentGate {
  name: string;
  type: 'manual' | 'automatic';
  condition: string;
  timeout: number;
  retries: number;
}

export const DEFAULT_MOBILE_DEVICES: MobileDevice[] = [
  {
    name: 'iPhone 12',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3 },
    platform: 'ios'
  },
  {
    name: 'iPhone 12 Pro Max',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    viewport: { width: 428, height: 926, deviceScaleFactor: 3 },
    platform: 'ios'
  },
  {
    name: 'Samsung Galaxy S21',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
    viewport: { width: 384, height: 854, deviceScaleFactor: 2.75 },
    platform: 'android'
  },
  {
    name: 'iPad Air',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    viewport: { width: 820, height: 1180, deviceScaleFactor: 2 },
    platform: 'ios'
  }
];

export const DEFAULT_PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { metric: 'bundle-size', budget: 5000000, threshold: 'error' }, // 5MB
  { metric: 'first-contentful-paint', budget: 2000, threshold: 'warn' }, // 2s
  { metric: 'largest-contentful-paint', budget: 4000, threshold: 'error' }, // 4s
  { metric: 'cumulative-layout-shift', budget: 0.1, threshold: 'warn' },
  { metric: 'first-input-delay', budget: 300, threshold: 'error' } // 300ms
];

export class CICDPipelineManager extends EventEmitter {
  private config: PipelineConfig;
  private projectPath: string;

  constructor(projectPath: string, cicdConfig: CICDConfig, deploymentConfig: DeploymentConfig) {
    super();
    this.projectPath = projectPath;
    this.config = this.generatePipelineConfig(cicdConfig, deploymentConfig);
  }

  private generatePipelineConfig(cicdConfig: CICDConfig, deploymentConfig: DeploymentConfig): PipelineConfig {
    return {
      platform: cicdConfig.platform,
      version: '1.0.0',
      branches: {
        main: 'main',
        develop: 'develop',
        feature: 'feature/*'
      },
      environments: {
        development: {
          name: 'development',
          variables: { NODE_ENV: 'development', ...deploymentConfig.environmentVariables },
          secrets: ['DEV_API_KEY', 'DEV_DATABASE_URL'],
          approvals: { required: false, reviewers: [], timeout: 0 },
          gates: []
        },
        staging: {
          name: 'staging',
          url: deploymentConfig.stagingEnvironment.url,
          variables: { NODE_ENV: 'staging', ...deploymentConfig.environmentVariables },
          secrets: ['STAGING_API_KEY', 'STAGING_DATABASE_URL'],
          approvals: { required: false, reviewers: [], timeout: 0 },
          gates: [
            {
              name: 'mobile-tests-passed',
              type: 'automatic',
              condition: 'success()',
              timeout: 1800000, // 30 minutes
              retries: 2
            }
          ]
        },
        production: {
          name: 'production',
          url: deploymentConfig.productionEnvironment.url,
          variables: { NODE_ENV: 'production', ...deploymentConfig.environmentVariables },
          secrets: ['PROD_API_KEY', 'PROD_DATABASE_URL'],
          approvals: { 
            required: deploymentConfig.productionEnvironment.requireApproval, 
            reviewers: ['mobile-team', 'tech-lead'],
            timeout: 3600000 // 1 hour
          },
          gates: [
            {
              name: 'all-tests-passed',
              type: 'automatic',
              condition: 'success()',
              timeout: 2700000, // 45 minutes
              retries: 1
            },
            {
              name: 'performance-thresholds-met',
              type: 'automatic',
              condition: 'mobile-performance-score >= 90',
              timeout: 600000, // 10 minutes
              retries: 0
            }
          ]
        }
      },
      stages: this.generatePipelineStages(cicdConfig),
      mobileOptimizations: this.generateMobileOptimizations(cicdConfig),
      notifications: this.generateNotificationConfig(cicdConfig),
      security: this.generateSecurityConfig()
    };
  }

  private generatePipelineStages(cicdConfig: CICDConfig): PipelineStage[] {
    return [
      {
        name: 'validate',
        dependsOn: [],
        condition: 'always()',
        parallel: true,
        continueOnError: false,
        timeout: 600000, // 10 minutes
        jobs: [
          {
            name: 'lint-and-typecheck',
            runs_on: 'ubuntu-latest',
            timeout: 300000, // 5 minutes
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { name: 'Run linting', run: 'npm run lint' },
              { name: 'Run type checking', run: 'npm run type-check' }
            ]
          },
          {
            name: 'security-scan',
            runs_on: 'ubuntu-latest',
            timeout: 600000, // 10 minutes
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { name: 'Run security audit', run: 'npm audit --audit-level=moderate' },
              { name: 'Run dependency check', run: 'npm run security:dependencies' }
            ]
          }
        ]
      },
      {
        name: 'test',
        dependsOn: ['validate'],
        condition: 'success()',
        parallel: true,
        continueOnError: false,
        timeout: 1800000, // 30 minutes
        jobs: [
          {
            name: 'unit-tests',
            runs_on: 'ubuntu-latest',
            timeout: 900000, // 15 minutes
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { name: 'Run unit tests', run: 'npm run test:unit -- --coverage' },
              { name: 'Upload coverage', uses: 'codecov/codecov-action@v3' }
            ]
          },
          {
            name: 'mobile-unit-tests',
            runs_on: 'ubuntu-latest',
            timeout: 1200000, // 20 minutes
            strategy: {
              matrix: {
                device: DEFAULT_MOBILE_DEVICES.map(d => d.name)
              },
              failFast: false,
              maxParallel: 3
            },
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { 
                name: 'Run mobile unit tests', 
                run: 'npm run test:mobile:unit',
                env: { DEVICE_TYPE: '${{ matrix.device }}' }
              },
              {
                name: 'Upload test results',
                uses: 'actions/upload-artifact@v4',
                condition: 'always()',
                with: {
                  name: 'mobile-unit-test-results-${{ matrix.device }}',
                  path: 'test-results/mobile-unit/'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'build',
        dependsOn: ['test'],
        condition: 'success()',
        parallel: false,
        continueOnError: false,
        timeout: 1200000, // 20 minutes
        jobs: [
          {
            name: 'build-application',
            runs_on: 'ubuntu-latest',
            timeout: 1200000, // 20 minutes
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { name: 'Build application', run: 'npm run build' },
              { name: 'Analyze bundle', run: 'npm run analyze:bundle' },
              { 
                name: 'Check bundle size',
                run: `
                  BUNDLE_SIZE=$(du -sb dist/ | cut -f1)
                  echo "Bundle size: $BUNDLE_SIZE bytes"
                  if [ $BUNDLE_SIZE -gt ${DEFAULT_PERFORMANCE_BUDGETS[0].budget} ]; then
                    echo "Bundle size exceeds limit of ${DEFAULT_PERFORMANCE_BUDGETS[0].budget} bytes"
                    exit 1
                  fi
                `
              },
              {
                name: 'Upload build artifacts',
                uses: 'actions/upload-artifact@v4',
                with: {
                  name: 'build-artifacts',
                  path: 'dist/',
                  retention: 30
                }
              },
              {
                name: 'Upload bundle analysis',
                uses: 'actions/upload-artifact@v4',
                with: {
                  name: 'bundle-analysis',
                  path: 'bundle-analysis/'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'mobile-e2e-tests',
        dependsOn: ['build'],
        condition: 'success()',
        parallel: true,
        continueOnError: false,
        timeout: 3600000, // 60 minutes
        jobs: [
          {
            name: 'mobile-e2e',
            runs_on: 'ubuntu-latest',
            timeout: 2700000, // 45 minutes
            strategy: {
              matrix: {
                device: DEFAULT_MOBILE_DEVICES.slice(0, 3).map(d => d.name), // Limit to 3 devices for E2E
                browser: ['chrome', 'firefox']
              },
              failFast: false,
              maxParallel: 6
            },
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Download build artifacts', uses: 'actions/download-artifact@v4', with: { name: 'build-artifacts', path: 'dist/' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { name: 'Install Playwright browsers', run: 'npx playwright install' },
              { 
                name: 'Run mobile E2E tests',
                run: 'npm run test:mobile:e2e',
                env: {
                  DEVICE_TYPE: '${{ matrix.device }}',
                  BROWSER: '${{ matrix.browser }}'
                }
              },
              {
                name: 'Upload E2E test results',
                uses: 'actions/upload-artifact@v4',
                condition: 'always()',
                with: {
                  name: 'e2e-results-${{ matrix.device }}-${{ matrix.browser }}',
                  path: 'test-results/e2e/'
                }
              },
              {
                name: 'Upload screenshots on failure',
                uses: 'actions/upload-artifact@v4',
                condition: 'failure()',
                with: {
                  name: 'e2e-screenshots-${{ matrix.device }}-${{ matrix.browser }}',
                  path: 'test-results/screenshots/'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'performance-tests',
        dependsOn: ['build'],
        condition: 'success()',
        parallel: true,
        continueOnError: true, // Performance tests are warning-level
        timeout: 1800000, // 30 minutes
        jobs: [
          {
            name: 'lighthouse-mobile',
            runs_on: 'ubuntu-latest',
            timeout: 1200000, // 20 minutes
            strategy: {
              matrix: {
                device: DEFAULT_MOBILE_DEVICES.slice(0, 2).map(d => d.name) // iPhone 12, Samsung Galaxy S21
              }
            },
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Download build artifacts', uses: 'actions/download-artifact@v4', with: { name: 'build-artifacts', path: 'dist/' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { name: 'Start application', run: 'npm run start:test &' },
              { name: 'Wait for application', run: 'npx wait-on http://localhost:3000' },
              {
                name: 'Run Lighthouse mobile audit',
                run: `
                  npx lighthouse http://localhost:3000 \\
                    --chrome-flags="--headless --no-sandbox" \\
                    --emulated-form-factor=mobile \\
                    --throttling-method=simulate \\
                    --output=json \\
                    --output-path=lighthouse-${{ matrix.device }}.json
                `,
                env: { DEVICE_TYPE: '${{ matrix.device }}' }
              },
              {
                name: 'Check performance thresholds',
                run: `
                  PERFORMANCE_SCORE=$(cat lighthouse-${{ matrix.device }}.json | jq '.categories.performance.score * 100')
                  echo "Performance score: $PERFORMANCE_SCORE"
                  if (( $(echo "$PERFORMANCE_SCORE < 90" | bc -l) )); then
                    echo "Performance score below threshold (90)"
                    exit 1
                  fi
                `
              },
              {
                name: 'Upload Lighthouse results',
                uses: 'actions/upload-artifact@v4',
                with: {
                  name: 'lighthouse-results-${{ matrix.device }}',
                  path: 'lighthouse-*.json'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'accessibility-tests',
        dependsOn: ['build'],
        condition: 'success()',
        parallel: true,
        continueOnError: false,
        timeout: 1200000, // 20 minutes
        jobs: [
          {
            name: 'a11y-mobile',
            runs_on: 'ubuntu-latest',
            timeout: 900000, // 15 minutes
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '18', cache: 'npm' } },
              { name: 'Download build artifacts', uses: 'actions/download-artifact@v4', with: { name: 'build-artifacts', path: 'dist/' } },
              { name: 'Install dependencies', run: 'npm ci' },
              { name: 'Run accessibility tests', run: 'npm run test:a11y:mobile' },
              {
                name: 'Upload accessibility results',
                uses: 'actions/upload-artifact@v4',
                condition: 'always()',
                with: {
                  name: 'accessibility-results',
                  path: 'test-results/accessibility/'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'deploy',
        dependsOn: ['mobile-e2e-tests', 'performance-tests', 'accessibility-tests'],
        condition: 'success()',
        parallel: false,
        continueOnError: false,
        timeout: 1800000, // 30 minutes
        jobs: [
          {
            name: 'deploy-staging',
            runs_on: 'ubuntu-latest',
            environment: 'staging',
            timeout: 1200000, // 20 minutes
            condition: "github.ref == 'refs/heads/develop'",
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Download build artifacts', uses: 'actions/download-artifact@v4', with: { name: 'build-artifacts', path: 'dist/' } },
              { name: 'Deploy to staging', run: 'npm run deploy:staging', env: { STAGING_TOKEN: '${{ secrets.STAGING_TOKEN }}' } },
              { name: 'Run health checks', run: 'npm run health-check:staging' },
              { name: 'Run mobile health checks', run: 'npm run health-check:mobile:staging' }
            ]
          },
          {
            name: 'deploy-production',
            runs_on: 'ubuntu-latest',
            environment: 'production',
            timeout: 1800000, // 30 minutes
            condition: "github.ref == 'refs/heads/main'",
            steps: [
              { name: 'Checkout code', uses: 'actions/checkout@v4' },
              { name: 'Download build artifacts', uses: 'actions/download-artifact@v4', with: { name: 'build-artifacts', path: 'dist/' } },
              { name: 'Deploy to production', run: 'npm run deploy:production', env: { PRODUCTION_TOKEN: '${{ secrets.PRODUCTION_TOKEN }}' } },
              { name: 'Run health checks', run: 'npm run health-check:production' },
              { name: 'Run mobile health checks', run: 'npm run health-check:mobile:production' },
              { name: 'Notify deployment success', run: 'npm run notify:deployment:success', condition: 'success()' },
              { name: 'Rollback on failure', run: 'npm run deploy:rollback', condition: 'failure()' }
            ]
          }
        ]
      }
    ];
  }

  private generateMobileOptimizations(cicdConfig: CICDConfig): MobilePipelineConfig {
    return {
      deviceTesting: {
        enabled: cicdConfig.mobileTestingPipeline,
        devices: DEFAULT_MOBILE_DEVICES,
        browsers: ['chrome', 'firefox', 'safari'],
        viewports: [
          { name: 'mobile-small', width: 320, height: 568, deviceScaleFactor: 2 },
          { name: 'mobile-medium', width: 375, height: 667, deviceScaleFactor: 2 },
          { name: 'mobile-large', width: 414, height: 896, deviceScaleFactor: 3 },
          { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2 }
        ]
      },
      performanceTesting: {
        enabled: true,
        budgets: DEFAULT_PERFORMANCE_BUDGETS,
        tools: ['lighthouse', 'webpagetest', 'bundlesize'],
        thresholds: [
          { name: 'Performance Score', metric: 'lighthouse-performance', value: 90, comparison: 'gte' },
          { name: 'First Contentful Paint', metric: 'first-contentful-paint', value: 2000, comparison: 'lt' },
          { name: 'Largest Contentful Paint', metric: 'largest-contentful-paint', value: 4000, comparison: 'lt' },
          { name: 'Cumulative Layout Shift', metric: 'cumulative-layout-shift', value: 0.1, comparison: 'lt' },
          { name: 'First Input Delay', metric: 'first-input-delay', value: 300, comparison: 'lt' }
        ]
      },
      accessibilityTesting: {
        enabled: true,
        standards: ['WCAG2.1', 'WCAG2.2', 'Section508'],
        tools: ['axe-core', 'lighthouse-a11y', 'pa11y'],
        minimumScore: 95
      },
      bundleAnalysis: {
        enabled: true,
        maxSize: 5000000, // 5MB
        compressionEnabled: true,
        treeshaking: true
      }
    };
  }

  private generateNotificationConfig(cicdConfig: CICDConfig): NotificationConfig[] {
    return [
      {
        type: 'slack',
        target: '#mobile-team',
        events: ['deployment.success', 'deployment.failure', 'performance.threshold.exceeded'],
        template: 'mobile-deployment'
      },
      {
        type: 'email',
        target: 'mobile-team@clear-piggy.com',
        events: ['deployment.failure', 'security.vulnerability.found'],
        template: 'security-alert'
      }
    ];
  }

  private generateSecurityConfig(): SecurityConfig {
    return {
      secretScanning: true,
      dependencyScanning: true,
      codeScanning: true,
      containerScanning: false,
      licenseScanning: true,
      securityThreshold: 'medium'
    };
  }

  async generatePipelineFiles(): Promise<{
    workflows: { [filename: string]: string };
    scripts: { [filename: string]: string };
    configs: { [filename: string]: string };
  }> {
    try {
      this.emit('pipeline:generation:start');

      const workflows: { [filename: string]: string } = {};
      const scripts: { [filename: string]: string } = {};
      const configs: { [filename: string]: string } = {};

      // Generate platform-specific workflow files
      switch (this.config.platform) {
        case 'github-actions':
          workflows['mobile-ci-cd.yml'] = this.generateGitHubActionsWorkflow();
          workflows['mobile-performance.yml'] = this.generateGitHubPerformanceWorkflow();
          workflows['mobile-security.yml'] = this.generateGitHubSecurityWorkflow();
          break;
        case 'gitlab-ci':
          workflows['.gitlab-ci.yml'] = this.generateGitLabCIConfig();
          break;
        case 'jenkins':
          workflows['Jenkinsfile'] = this.generateJenkinsfile();
          break;
        case 'azure-devops':
          workflows['azure-pipelines.yml'] = this.generateAzureDevOpsConfig();
          break;
        case 'circleci':
          workflows['.circleci/config.yml'] = this.generateCircleCIConfig();
          break;
      }

      // Generate supporting scripts
      scripts['mobile-test.sh'] = this.generateMobileTestScript();
      scripts['performance-check.sh'] = this.generatePerformanceCheckScript();
      scripts['accessibility-check.sh'] = this.generateAccessibilityCheckScript();
      scripts['bundle-check.sh'] = this.generateBundleCheckScript();
      scripts['health-check.sh'] = this.generateHealthCheckScript();

      // Generate configuration files
      configs['jest.mobile.config.js'] = this.generateJestMobileConfig();
      configs['playwright.mobile.config.js'] = this.generatePlaywrightMobileConfig();
      configs['lighthouse.mobile.config.js'] = this.generateLighthouseMobileConfig();
      configs['bundlesize.config.json'] = this.generateBundlesizeConfig();

      // Write all files
      await this.writeWorkflowFiles(workflows);
      await this.writeScriptFiles(scripts);
      await this.writeConfigFiles(configs);

      this.emit('pipeline:generation:complete', { workflows, scripts, configs });

      return { workflows, scripts, configs };

    } catch (error) {
      this.emit('pipeline:generation:error', error);
      throw new Error(`Pipeline generation failed: ${(error as Error).message}`);
    }
  }

  private generateGitHubActionsWorkflow(): string {
    return `name: Clear Piggy Mobile CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  CACHE_KEY_PREFIX: clear-piggy-mobile-v1

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
${this.config.stages.map(stage => this.generateGitHubStage(stage)).join('\n\n')}

  # Cleanup job
  cleanup:
    runs-on: ubuntu-latest
    needs: [${this.config.stages.map(s => s.name).join(', ')}]
    if: always()
    
    steps:
    - name: Clean up artifacts
      uses: actions/github-script@v7
      with:
        script: |
          const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
            owner: context.repo.owner,
            repo: context.repo.repo,
            run_id: context.runId,
          });
          
          // Keep only the most recent artifacts
          const oldArtifacts = artifacts.data.artifacts
            .filter(artifact => 
              new Date() - new Date(artifact.created_at) > 7 * 24 * 60 * 60 * 1000 // 7 days
            );
          
          for (const artifact of oldArtifacts) {
            await github.rest.actions.deleteArtifact({
              owner: context.repo.owner,
              repo: context.repo.repo,
              artifact_id: artifact.id,
            });
          }
`;
  }

  private generateGitHubPerformanceWorkflow(): string {
    return `name: Mobile Performance Monitoring

on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch:

env:
  NODE_VERSION: '18'

jobs:
  performance-monitoring:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        environment: [staging, production]
        device: [${DEFAULT_MOBILE_DEVICES.slice(0, 2).map(d => `'${d.name}'`).join(', ')}]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run performance audit
      run: |
        ENVIRONMENT=\${{ matrix.environment }}
        DEVICE=\${{ matrix.device }}
        
        case "\$ENVIRONMENT" in
          staging) URL="\${{ vars.STAGING_URL }}" ;;
          production) URL="\${{ vars.PRODUCTION_URL }}" ;;
        esac
        
        npx lighthouse "\$URL" \\
          --chrome-flags="--headless --no-sandbox" \\
          --emulated-form-factor=mobile \\
          --throttling-method=simulate \\
          --output=json \\
          --output-path="performance-\$ENVIRONMENT-\$DEVICE.json"
    
    - name: Check performance regression
      run: |
        CURRENT_SCORE=\$(cat performance-\${{ matrix.environment }}-\${{ matrix.device }}.json | jq '.categories.performance.score * 100')
        echo "Current performance score: \$CURRENT_SCORE"
        
        # Compare with previous results if available
        if [ -f "baseline-performance-\${{ matrix.environment }}-\${{ matrix.device }}.json" ]; then
          BASELINE_SCORE=\$(cat baseline-performance-\${{ matrix.environment }}-\${{ matrix.device }}.json | jq '.categories.performance.score * 100')
          REGRESSION=\$(echo "\$BASELINE_SCORE - \$CURRENT_SCORE" | bc)
          
          if (( \$(echo "\$REGRESSION > 5" | bc -l) )); then
            echo "Performance regression detected: \$REGRESSION points"
            exit 1
          fi
        fi
    
    - name: Upload performance results
      uses: actions/upload-artifact@v4
      with:
        name: performance-results-\${{ matrix.environment }}-\${{ matrix.device }}
        path: performance-*.json
    
    - name: Update performance baseline
      if: matrix.environment == 'production' && success()
      run: |
        cp performance-\${{ matrix.environment }}-\${{ matrix.device }}.json baseline-performance-\${{ matrix.environment }}-\${{ matrix.device }}.json
    
    - name: Send performance alert
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        channel: '#mobile-alerts'
        text: 'Performance regression detected in \${{ matrix.environment }} for \${{ matrix.device }}'
      env:
        SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
`;
  }

  private generateGitHubSecurityWorkflow(): string {
    return `name: Mobile Security Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

env:
  NODE_VERSION: '18'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run npm audit
      run: |
        npm audit --audit-level=moderate --format=json > npm-audit.json || true
        
        VULNERABILITIES=\$(cat npm-audit.json | jq '.metadata.vulnerabilities | to_entries | map(select(.value > 0)) | length')
        
        if [ "\$VULNERABILITIES" -gt 0 ]; then
          echo "Found \$VULNERABILITIES vulnerability types"
          cat npm-audit.json | jq '.vulnerabilities'
          
          # Check severity
          HIGH_VULNS=\$(cat npm-audit.json | jq '.metadata.vulnerabilities.high // 0')
          CRITICAL_VULNS=\$(cat npm-audit.json | jq '.metadata.vulnerabilities.critical // 0')
          
          if [ "\$CRITICAL_VULNS" -gt 0 ] || [ "\$HIGH_VULNS" -gt 5 ]; then
            echo "Critical vulnerabilities found or too many high severity issues"
            exit 1
          fi
        fi
    
    - name: Run Semgrep security scan
      uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/secrets
          p/javascript
          p/typescript
          p/react
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/init@v3
      with:
        languages: javascript
        queries: security-and-quality
    
    - name: Build for CodeQL
      run: npm run build
    
    - name: Perform CodeQL analysis
      uses: github/codeql-action/analyze@v3
    
    - name: Check for secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
    
    - name: License compliance check
      run: |
        npx license-checker --onlyAllow 'MIT;BSD;ISC;Apache-2.0;BSD-2-Clause;BSD-3-Clause' --summary
    
    - name: Upload security results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: security-scan-results
        path: |
          npm-audit.json
          semgrep-results.json
    
    - name: Send security alert
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        channel: '#security-alerts'
        text: 'Security vulnerabilities found in mobile application'
      env:
        SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
`;
  }

  private generateGitHubStage(stage: PipelineStage): string {
    return stage.jobs.map(job => `  ${job.name.replace(/-/g, '_')}:
    runs-on: ${job.runs_on}
    ${stage.dependsOn.length > 0 ? `needs: [${stage.dependsOn.join(', ')}]` : ''}
    ${job.environment ? `environment: ${job.environment}` : ''}
    timeout-minutes: ${Math.floor(job.timeout / 60000)}
    ${job.strategy ? this.generateGitHubStrategy(job.strategy) : ''}
    
    steps:
${job.steps.map(step => this.generateGitHubStep(step)).join('\n')}`).join('\n\n');
  }

  private generateGitHubStrategy(strategy: any): string {
    let result = '    strategy:\n';
    if (strategy.matrix) {
      result += '      matrix:\n';
      Object.entries(strategy.matrix).forEach(([key, values]) => {
        result += `        ${key}: [${(values as string[]).map(v => `'${v}'`).join(', ')}]\n`;
      });
    }
    if (strategy.failFast !== undefined) {
      result += `      fail-fast: ${strategy.failFast}\n`;
    }
    if (strategy.maxParallel) {
      result += `      max-parallel: ${strategy.maxParallel}\n`;
    }
    return result;
  }

  private generateGitHubStep(step: PipelineStep): string {
    let result = `    - name: ${step.name}\n`;
    
    if (step.uses) {
      result += `      uses: ${step.uses}\n`;
      if (step.with) {
        result += '      with:\n';
        Object.entries(step.with).forEach(([key, value]) => {
          result += `        ${key}: ${typeof value === 'string' ? `'${value}'` : value}\n`;
        });
      }
    }
    
    if (step.run) {
      result += `      run: ${step.run}\n`;
    }
    
    if (step.env) {
      result += '      env:\n';
      Object.entries(step.env).forEach(([key, value]) => {
        result += `        ${key}: ${value}\n`;
      });
    }
    
    if (step.condition) {
      result += `      if: ${step.condition}\n`;
    }
    
    if (step.continueOnError) {
      result += `      continue-on-error: true\n`;
    }
    
    return result;
  }

  private generateGitLabCIConfig(): string {
    return `# Clear Piggy Mobile CI/CD Pipeline
# Generated by Clear Piggy Mobile CICD Pipeline Manager

stages:
  - validate
  - test
  - build
  - mobile-tests
  - performance
  - accessibility
  - security
  - deploy

variables:
  NODE_VERSION: "18"
  CACHE_KEY: "clear-piggy-mobile-v1"
  MOBILE_OPTIMIZATION: "true"

# Cache configuration
cache:
  key: \${CACHE_KEY}-\${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

# Default image and before script
default:
  image: node:\${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline

# Validation stage
lint-and-typecheck:
  stage: validate
  script:
    - npm run lint
    - npm run type-check
  rules:
    - if: \$CI_PIPELINE_SOURCE == "merge_request_event"
    - if: \$CI_COMMIT_BRANCH == "main"
    - if: \$CI_COMMIT_BRANCH == "develop"

security-scan:
  stage: validate
  script:
    - npm audit --audit-level=moderate
    - npx semgrep --config=p/security-audit .
  artifacts:
    reports:
      junit: security-results.xml
    expire_in: 1 week
  allow_failure: true

# Test stage
unit-tests:
  stage: test
  script:
    - npm run test:unit -- --coverage --reporters=default --reporters=jest-junit
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    expire_in: 1 week
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/'

mobile-unit-tests:
  stage: test
  parallel:
    matrix:
      - DEVICE_TYPE: ["iPhone 12", "Samsung Galaxy S21", "iPad Air"]
  script:
    - npm run test:mobile:unit
  artifacts:
    reports:
      junit: test-results/mobile-unit/junit-\${DEVICE_TYPE}.xml
    expire_in: 1 week

# Build stage
build-application:
  stage: build
  script:
    - npm run build
    - npm run analyze:bundle
    - |
      BUNDLE_SIZE=\$(du -sb dist/ | cut -f1)
      echo "Bundle size: \$BUNDLE_SIZE bytes"
      if [ \$BUNDLE_SIZE -gt 5000000 ]; then
        echo "Bundle size exceeds 5MB limit"
        exit 1
      fi
  artifacts:
    paths:
      - dist/
      - bundle-analysis/
    expire_in: 1 day

# Mobile E2E tests
mobile-e2e-tests:
  stage: mobile-tests
  parallel:
    matrix:
      - DEVICE_TYPE: ["iPhone 12", "Samsung Galaxy S21"]
        BROWSER: ["chrome", "firefox"]
  needs:
    - build-application
  script:
    - npx playwright install
    - npm run test:mobile:e2e
  artifacts:
    when: always
    paths:
      - test-results/e2e/
      - test-results/screenshots/
    reports:
      junit: test-results/e2e/junit-\${DEVICE_TYPE}-\${BROWSER}.xml
    expire_in: 1 week

# Performance tests
lighthouse-mobile:
  stage: performance
  parallel:
    matrix:
      - DEVICE_TYPE: ["iPhone 12", "Samsung Galaxy S21"]
  needs:
    - build-application
  script:
    - npm start &
    - npx wait-on http://localhost:3000
    - |
      npx lighthouse http://localhost:3000 \\
        --chrome-flags="--headless --no-sandbox" \\
        --emulated-form-factor=mobile \\
        --output=json \\
        --output-path=lighthouse-\${DEVICE_TYPE}.json
    - |
      PERFORMANCE_SCORE=\$(cat lighthouse-\${DEVICE_TYPE}.json | jq '.categories.performance.score * 100')
      echo "Performance score: \$PERFORMANCE_SCORE"
      if (( \$(echo "\$PERFORMANCE_SCORE < 90" | bc -l) )); then
        echo "Performance score below 90 threshold"
        exit 1
      fi
  artifacts:
    paths:
      - lighthouse-*.json
    reports:
      performance: lighthouse-*.json
    expire_in: 1 week
  allow_failure: true

# Accessibility tests
accessibility-mobile:
  stage: accessibility
  needs:
    - build-application
  script:
    - npm run test:a11y:mobile
  artifacts:
    reports:
      accessibility: test-results/accessibility/report.json
    expire_in: 1 week

# Deployment jobs
deploy-staging:
  stage: deploy
  environment:
    name: staging
    url: \$STAGING_URL
  needs:
    - mobile-e2e-tests
    - lighthouse-mobile
    - accessibility-mobile
  script:
    - npm run deploy:staging
    - npm run health-check:staging
    - npm run health-check:mobile:staging
  rules:
    - if: \$CI_COMMIT_BRANCH == "develop"

deploy-production:
  stage: deploy
  environment:
    name: production
    url: \$PRODUCTION_URL
  needs:
    - mobile-e2e-tests
    - lighthouse-mobile
    - accessibility-mobile
  script:
    - npm run deploy:production
    - npm run health-check:production
    - npm run health-check:mobile:production
  rules:
    - if: \$CI_COMMIT_BRANCH == "main"
      when: manual
  after_script:
    - if [ "\$CI_JOB_STATUS" == "failed" ]; then npm run deploy:rollback; fi
`;
  }

  private generateJenkinsfile(): string {
    return `// Clear Piggy Mobile CI/CD Pipeline
// Generated by Clear Piggy Mobile CICD Pipeline Manager

pipeline {
    agent any
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
        skipDefaultCheckout()
    }
    
    environment {
        NODE_VERSION = '18'
        MOBILE_OPTIMIZATION = 'true'
        CI = 'true'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Setup') {
            steps {
                sh '''
                    curl -fsSL https://deb.nodesource.com/setup_\${NODE_VERSION}.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                    npm ci
                '''
            }
        }
        
        stage('Validate') {
            parallel {
                stage('Lint & Type Check') {
                    steps {
                        sh 'npm run lint'
                        sh 'npm run type-check'
                    }
                }
                stage('Security Scan') {
                    steps {
                        sh 'npm audit --audit-level=moderate'
                        sh 'npx semgrep --config=p/security-audit .'
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'security-results',
                                reportFiles: 'index.html',
                                reportName: 'Security Scan Results'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit -- --coverage'
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/unit/junit.xml'
                            publishCoverage adapters: [cobertura('coverage/cobertura-coverage.xml')]
                        }
                    }
                }
                stage('Mobile Unit Tests') {
                    matrix {
                        axes {
                            axis {
                                name 'DEVICE_TYPE'
                                values 'iPhone 12', 'Samsung Galaxy S21', 'iPad Air'
                            }
                        }
                        stages {
                            stage('Mobile Test') {
                                steps {
                                    sh 'npm run test:mobile:unit'
                                }
                                post {
                                    always {
                                        publishTestResults testResultsPattern: "test-results/mobile-unit/junit-\${DEVICE_TYPE}.xml"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
                sh 'npm run analyze:bundle'
                script {
                    def bundleSize = sh(
                        script: "du -sb dist/ | cut -f1",
                        returnStdout: true
                    ).trim() as Integer
                    
                    if (bundleSize > 5000000) {
                        error("Bundle size \${bundleSize} exceeds 5MB limit")
                    }
                    
                    echo "Bundle size: \${bundleSize} bytes"
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                    archiveArtifacts artifacts: 'bundle-analysis/**/*'
                }
            }
        }
        
        stage('Mobile E2E Tests') {
            matrix {
                axes {
                    axis {
                        name 'DEVICE_TYPE'
                        values 'iPhone 12', 'Samsung Galaxy S21'
                    }
                    axis {
                        name 'BROWSER'
                        values 'chrome', 'firefox'
                    }
                }
                stages {
                    stage('E2E Test') {
                        steps {
                            sh 'npx playwright install'
                            sh 'npm run test:mobile:e2e'
                        }
                        post {
                            always {
                                publishTestResults testResultsPattern: "test-results/e2e/junit-\${DEVICE_TYPE}-\${BROWSER}.xml"
                                archiveArtifacts artifacts: 'test-results/screenshots/**/*', allowEmptyArchive: true
                            }
                        }
                    }
                }
            }
        }
        
        stage('Performance & Accessibility') {
            parallel {
                stage('Lighthouse Mobile') {
                    matrix {
                        axes {
                            axis {
                                name 'DEVICE_TYPE'
                                values 'iPhone 12', 'Samsung Galaxy S21'
                            }
                        }
                        stages {
                            stage('Performance Test') {
                                steps {
                                    sh 'npm start &'
                                    sh 'npx wait-on http://localhost:3000'
                                    sh '''
                                        npx lighthouse http://localhost:3000 \\
                                            --chrome-flags="--headless --no-sandbox" \\
                                            --emulated-form-factor=mobile \\
                                            --output=json \\
                                            --output-path=lighthouse-\${DEVICE_TYPE}.json
                                    '''
                                    script {
                                        def performanceScore = sh(
                                            script: "cat lighthouse-\${DEVICE_TYPE}.json | jq '.categories.performance.score * 100'",
                                            returnStdout: true
                                        ).trim() as Double
                                        
                                        if (performanceScore < 90) {
                                            unstable("Performance score \${performanceScore} below 90 threshold")
                                        }
                                        
                                        echo "Performance score: \${performanceScore}"
                                    }
                                }
                                post {
                                    always {
                                        archiveArtifacts artifacts: "lighthouse-\${DEVICE_TYPE}.json"
                                    }
                                }
                            }
                        }
                    }
                }
                stage('Accessibility Mobile') {
                    steps {
                        sh 'npm run test:a11y:mobile'
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'test-results/accessibility',
                                reportFiles: 'index.html',
                                reportName: 'Accessibility Test Results'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            parallel {
                stage('Deploy Staging') {
                    when {
                        branch 'develop'
                    }
                    environment {
                        DEPLOYMENT_ENV = 'staging'
                    }
                    steps {
                        sh 'npm run deploy:staging'
                        sh 'npm run health-check:staging'
                        sh 'npm run health-check:mobile:staging'
                    }
                }
                stage('Deploy Production') {
                    when {
                        branch 'main'
                    }
                    environment {
                        DEPLOYMENT_ENV = 'production'
                    }
                    input {
                        message "Deploy to production?"
                        ok "Deploy"
                        submitterParameter "DEPLOYER"
                    }
                    steps {
                        sh 'npm run deploy:production'
                        sh 'npm run health-check:production'
                        sh 'npm run health-check:mobile:production'
                    }
                    post {
                        failure {
                            sh 'npm run deploy:rollback'
                        }
                        success {
                            slackSend(
                                channel: '#mobile-team',
                                color: 'good',
                                message: "🎉 Mobile app deployed to production by \${DEPLOYER}"
                            )
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            slackSend(
                channel: '#mobile-team',
                color: 'danger',
                message: "❌ Mobile pipeline failed: \${env.BUILD_URL}"
            )
        }
    }
}
`;
  }

  private generateAzureDevOpsConfig(): string {
    return `# Clear Piggy Mobile CI/CD Pipeline
# Generated by Clear Piggy Mobile CICD Pipeline Manager

trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - src/*
      - package.json
      - package-lock.json

pr:
  branches:
    include:
      - main
      - develop

variables:
  nodeVersion: '18'
  mobileOptimization: true
  vmImage: 'ubuntu-latest'

pool:
  vmImage: \$(vmImage)

stages:
- stage: Validate
  displayName: 'Validation Stage'
  jobs:
  - job: LintAndTypeCheck
    displayName: 'Lint and Type Check'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - task: Cache@2
      inputs:
        key: 'npm | "\$(Agent.OS)" | package-lock.json'
        restoreKeys: |
          npm | "\$(Agent.OS)"
        path: ~/.npm
      displayName: 'Cache npm'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run lint
      displayName: 'Run linting'
    
    - script: npm run type-check
      displayName: 'Run type checking'

  - job: SecurityScan
    displayName: 'Security Scan'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm audit --audit-level=moderate
      displayName: 'Run npm audit'
      continueOnError: true
    
    - script: npx semgrep --config=p/security-audit .
      displayName: 'Run Semgrep security scan'
      continueOnError: true

- stage: Test
  displayName: 'Testing Stage'
  dependsOn: Validate
  jobs:
  - job: UnitTests
    displayName: 'Unit Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run test:unit -- --coverage --reporters=default --reporters=jest-junit
      displayName: 'Run unit tests'
    
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'junit.xml'
        mergeTestResults: true
      displayName: 'Publish test results'
    
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: 'coverage/cobertura-coverage.xml'
      displayName: 'Publish coverage results'

  - job: MobileUnitTests
    displayName: 'Mobile Unit Tests'
    strategy:
      matrix:
        iPhone12:
          deviceType: 'iPhone 12'
        GalaxyS21:
          deviceType: 'Samsung Galaxy S21'
        iPadAir:
          deviceType: 'iPad Air'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run test:mobile:unit
      displayName: 'Run mobile unit tests'
      env:
        DEVICE_TYPE: \$(deviceType)
    
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'test-results/mobile-unit/junit-\$(deviceType).xml'
      displayName: 'Publish mobile test results'

- stage: Build
  displayName: 'Build Stage'
  dependsOn: Test
  jobs:
  - job: BuildApplication
    displayName: 'Build Application'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run build
      displayName: 'Build application'
    
    - script: npm run analyze:bundle
      displayName: 'Analyze bundle'
    
    - script: |
        BUNDLE_SIZE=\$(du -sb dist/ | cut -f1)
        echo "Bundle size: \$BUNDLE_SIZE bytes"
        if [ \$BUNDLE_SIZE -gt 5000000 ]; then
          echo "Bundle size exceeds 5MB limit"
          exit 1
        fi
      displayName: 'Check bundle size'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'dist'
        artifactName: 'build-artifacts'
      displayName: 'Publish build artifacts'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'bundle-analysis'
        artifactName: 'bundle-analysis'
      displayName: 'Publish bundle analysis'

- stage: MobileTests
  displayName: 'Mobile Testing Stage'
  dependsOn: Build
  jobs:
  - job: MobileE2ETests
    displayName: 'Mobile E2E Tests'
    strategy:
      matrix:
        iPhone12Chrome:
          deviceType: 'iPhone 12'
          browser: 'chrome'
        GalaxyS21Chrome:
          deviceType: 'Samsung Galaxy S21'
          browser: 'chrome'
        iPhone12Firefox:
          deviceType: 'iPhone 12'
          browser: 'firefox'
        GalaxyS21Firefox:
          deviceType: 'Samsung Galaxy S21'
          browser: 'firefox'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - task: DownloadBuildArtifacts@0
      inputs:
        artifactName: 'build-artifacts'
        downloadPath: 'dist'
      displayName: 'Download build artifacts'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npx playwright install
      displayName: 'Install Playwright browsers'
    
    - script: npm run test:mobile:e2e
      displayName: 'Run mobile E2E tests'
      env:
        DEVICE_TYPE: \$(deviceType)
        BROWSER: \$(browser)
    
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'test-results/e2e/junit-\$(deviceType)-\$(browser).xml'
      displayName: 'Publish E2E test results'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'test-results/screenshots'
        artifactName: 'e2e-screenshots-\$(deviceType)-\$(browser)'
      condition: failed()
      displayName: 'Publish screenshots on failure'

- stage: PerformanceAndAccessibility
  displayName: 'Performance and Accessibility Stage'
  dependsOn: Build
  jobs:
  - job: LighthouseMobile
    displayName: 'Lighthouse Mobile Tests'
    strategy:
      matrix:
        iPhone12:
          deviceType: 'iPhone 12'
        GalaxyS21:
          deviceType: 'Samsung Galaxy S21'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - task: DownloadBuildArtifacts@0
      inputs:
        artifactName: 'build-artifacts'
        downloadPath: 'dist'
      displayName: 'Download build artifacts'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm start &
      displayName: 'Start application'
    
    - script: npx wait-on http://localhost:3000
      displayName: 'Wait for application'
    
    - script: |
        npx lighthouse http://localhost:3000 \\
          --chrome-flags="--headless --no-sandbox" \\
          --emulated-form-factor=mobile \\
          --output=json \\
          --output-path=lighthouse-\$(deviceType).json
      displayName: 'Run Lighthouse audit'
    
    - script: |
        PERFORMANCE_SCORE=\$(cat lighthouse-\$(deviceType).json | jq '.categories.performance.score * 100')
        echo "Performance score: \$PERFORMANCE_SCORE"
        if (( \$(echo "\$PERFORMANCE_SCORE < 90" | bc -l) )); then
          echo "Performance score below 90 threshold"
          exit 1
        fi
      displayName: 'Check performance thresholds'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'lighthouse-\$(deviceType).json'
        artifactName: 'lighthouse-results-\$(deviceType)'
      displayName: 'Publish Lighthouse results'

  - job: AccessibilityMobile
    displayName: 'Accessibility Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '\$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - task: DownloadBuildArtifacts@0
      inputs:
        artifactName: 'build-artifacts'
        downloadPath: 'dist'
      displayName: 'Download build artifacts'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run test:a11y:mobile
      displayName: 'Run accessibility tests'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'test-results/accessibility'
        artifactName: 'accessibility-results'
      displayName: 'Publish accessibility results'

- stage: Deploy
  displayName: 'Deployment Stage'
  dependsOn: 
    - MobileTests
    - PerformanceAndAccessibility
  jobs:
  - deployment: DeployStaging
    displayName: 'Deploy to Staging'
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
    environment: 'staging'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: DownloadBuildArtifacts@0
            inputs:
              artifactName: 'build-artifacts'
              downloadPath: 'dist'
            displayName: 'Download build artifacts'
          
          - script: npm run deploy:staging
            displayName: 'Deploy to staging'
            env:
              STAGING_TOKEN: \$(stagingToken)
          
          - script: npm run health-check:staging
            displayName: 'Run health checks'
          
          - script: npm run health-check:mobile:staging
            displayName: 'Run mobile health checks'

  - deployment: DeployProduction
    displayName: 'Deploy to Production'
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: DownloadBuildArtifacts@0
            inputs:
              artifactName: 'build-artifacts'
              downloadPath: 'dist'
            displayName: 'Download build artifacts'
          
          - script: npm run deploy:production
            displayName: 'Deploy to production'
            env:
              PRODUCTION_TOKEN: \$(productionToken)
          
          - script: npm run health-check:production
            displayName: 'Run health checks'
          
          - script: npm run health-check:mobile:production
            displayName: 'Run mobile health checks'
          
          - script: npm run notify:deployment:success
            displayName: 'Notify deployment success'
            condition: succeeded()
          
          - script: npm run deploy:rollback
            displayName: 'Rollback on failure'
            condition: failed()
`;
  }

  private generateCircleCIConfig(): string {
    return `# Clear Piggy Mobile CI/CD Pipeline
# Generated by Clear Piggy Mobile CICD Pipeline Manager

version: 2.1

orbs:
  node: circleci/node@5.0.0
  browser-tools: circleci/browser-tools@1.4.0

executors:
  node-executor:
    docker:
      - image: cimg/node:18.16-browsers
    working_directory: ~/project
    environment:
      NODE_ENV: test
      CI: true

commands:
  install-dependencies:
    description: "Install project dependencies with caching"
    steps:
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}

  mobile-test-setup:
    description: "Setup for mobile testing"
    parameters:
      device_type:
        type: string
        default: "iPhone 12"
    steps:
      - run:
          name: Set mobile environment
          command: |
            echo 'export DEVICE_TYPE="<< parameters.device_type >>"' >> \$BASH_ENV

jobs:
  lint-and-typecheck:
    executor: node-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Run linting
          command: npm run lint
      - run:
          name: Run type checking
          command: npm run type-check

  security-scan:
    executor: node-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Run npm audit
          command: npm audit --audit-level=moderate
      - run:
          name: Run Semgrep security scan
          command: npx semgrep --config=p/security-audit .
      - store_artifacts:
          path: security-results
          destination: security-results

  unit-tests:
    executor: node-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Run unit tests
          command: npm run test:unit -- --coverage --reporters=default --reporters=jest-junit
          environment:
            JEST_JUNIT_OUTPUT_DIR: test-results/unit
      - store_test_results:
          path: test-results/unit
      - store_artifacts:
          path: coverage
          destination: coverage

  mobile-unit-tests:
    executor: node-executor
    parallelism: 3
    parameters:
      device_type:
        type: string
    steps:
      - checkout
      - install-dependencies
      - mobile-test-setup:
          device_type: << parameters.device_type >>
      - run:
          name: Run mobile unit tests
          command: npm run test:mobile:unit
      - store_test_results:
          path: test-results/mobile-unit
      - store_artifacts:
          path: test-results/mobile-unit
          destination: mobile-unit-tests-<< parameters.device_type >>

  build-application:
    executor: node-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Build application
          command: npm run build
      - run:
          name: Analyze bundle
          command: npm run analyze:bundle
      - run:
          name: Check bundle size
          command: |
            BUNDLE_SIZE=\$(du -sb dist/ | cut -f1)
            echo "Bundle size: \$BUNDLE_SIZE bytes"
            if [ \$BUNDLE_SIZE -gt 5000000 ]; then
              echo "Bundle size exceeds 5MB limit"
              exit 1
            fi
      - persist_to_workspace:
          root: .
          paths:
            - dist
            - bundle-analysis
      - store_artifacts:
          path: dist
          destination: build-artifacts
      - store_artifacts:
          path: bundle-analysis
          destination: bundle-analysis

  mobile-e2e-tests:
    executor: node-executor
    parallelism: 4
    parameters:
      device_type:
        type: string
      browser:
        type: string
    steps:
      - checkout
      - attach_workspace:
          at: .
      - install-dependencies
      - browser-tools/install-chrome
      - browser-tools/install-firefox
      - run:
          name: Install Playwright
          command: npx playwright install
      - mobile-test-setup:
          device_type: << parameters.device_type >>
      - run:
          name: Run mobile E2E tests
          command: npm run test:mobile:e2e
          environment:
            BROWSER: << parameters.browser >>
      - store_test_results:
          path: test-results/e2e
      - store_artifacts:
          path: test-results/e2e
          destination: e2e-results-<< parameters.device_type >>-<< parameters.browser >>
      - store_artifacts:
          path: test-results/screenshots
          destination: e2e-screenshots-<< parameters.device_type >>-<< parameters.browser >>

  lighthouse-mobile:
    executor: node-executor
    parallelism: 2
    parameters:
      device_type:
        type: string
    steps:
      - checkout
      - attach_workspace:
          at: .
      - install-dependencies
      - browser-tools/install-chrome
      - run:
          name: Start application
          command: npm start
          background: true
      - run:
          name: Wait for application
          command: npx wait-on http://localhost:3000
      - mobile-test-setup:
          device_type: << parameters.device_type >>
      - run:
          name: Run Lighthouse audit
          command: |
            npx lighthouse http://localhost:3000 \\
              --chrome-flags="--headless --no-sandbox" \\
              --emulated-form-factor=mobile \\
              --output=json \\
              --output-path=lighthouse-<< parameters.device_type >>.json
      - run:
          name: Check performance thresholds
          command: |
            PERFORMANCE_SCORE=\$(cat lighthouse-<< parameters.device_type >>.json | jq '.categories.performance.score * 100')
            echo "Performance score: \$PERFORMANCE_SCORE"
            if (( \$(echo "\$PERFORMANCE_SCORE < 90" | bc -l) )); then
              echo "Performance score below 90 threshold"
              exit 1
            fi
      - store_artifacts:
          path: lighthouse-<< parameters.device_type >>.json
          destination: lighthouse-results

  accessibility-mobile:
    executor: node-executor
    steps:
      - checkout
      - attach_workspace:
          at: .
      - install-dependencies
      - run:
          name: Run accessibility tests
          command: npm run test:a11y:mobile
      - store_test_results:
          path: test-results/accessibility
      - store_artifacts:
          path: test-results/accessibility
          destination: accessibility-results

  deploy-staging:
    executor: node-executor
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run:
          name: Deploy to staging
          command: npm run deploy:staging
      - run:
          name: Run health checks
          command: npm run health-check:staging
      - run:
          name: Run mobile health checks
          command: npm run health-check:mobile:staging

  deploy-production:
    executor: node-executor
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run:
          name: Deploy to production
          command: npm run deploy:production
      - run:
          name: Run health checks
          command: npm run health-check:production
      - run:
          name: Run mobile health checks
          command: npm run health-check:mobile:production
      - run:
          name: Notify deployment success
          command: npm run notify:deployment:success
          when: on_success
      - run:
          name: Rollback on failure
          command: npm run deploy:rollback
          when: on_fail

workflows:
  version: 2
  mobile-ci-cd:
    jobs:
      # Validation stage
      - lint-and-typecheck
      - security-scan

      # Test stage
      - unit-tests:
          requires:
            - lint-and-typecheck
      - mobile-unit-tests:
          matrix:
            parameters:
              device_type: ["iPhone 12", "Samsung Galaxy S21", "iPad Air"]
          requires:
            - lint-and-typecheck

      # Build stage
      - build-application:
          requires:
            - unit-tests
            - mobile-unit-tests

      # Mobile testing stage
      - mobile-e2e-tests:
          matrix:
            parameters:
              device_type: ["iPhone 12", "Samsung Galaxy S21"]
              browser: ["chrome", "firefox"]
          requires:
            - build-application

      # Performance and accessibility stage
      - lighthouse-mobile:
          matrix:
            parameters:
              device_type: ["iPhone 12", "Samsung Galaxy S21"]
          requires:
            - build-application
      - accessibility-mobile:
          requires:
            - build-application

      # Deployment stage
      - deploy-staging:
          requires:
            - mobile-e2e-tests
            - lighthouse-mobile
            - accessibility-mobile
          filters:
            branches:
              only: develop

      - deploy-production:
          requires:
            - mobile-e2e-tests
            - lighthouse-mobile
            - accessibility-mobile
          filters:
            branches:
              only: main
`;
  }

  // Generate supporting scripts
  private generateMobileTestScript(): string {
    return `#!/bin/bash
# Mobile Testing Script
# Generated by Clear Piggy Mobile CICD Pipeline Manager

set -e

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

# Logging functions
log_info() { echo -e "\${BLUE}[INFO]\${NC} \$1"; }
log_success() { echo -e "\${GREEN}[SUCCESS]\${NC} \$1"; }
log_warning() { echo -e "\${YELLOW}[WARNING]\${NC} \$1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} \$1"; }

# Configuration
DEVICE_TYPE=\${DEVICE_TYPE:-"iPhone 12"}
BROWSER=\${BROWSER:-"chrome"}
TEST_TYPE=\${1:-"all"}
RESULTS_DIR="test-results"

# Device configurations
declare -A DEVICE_CONFIGS
DEVICE_CONFIGS[${DEFAULT_MOBILE_DEVICES.map(d => `"${d.name}"]="${d.viewport.width}x${d.viewport.height}@${d.viewport.deviceScaleFactor}"`).join('\nDEVICE_CONFIGS[')}

# Create results directory
mkdir -p \$RESULTS_DIR

log_info "Starting mobile tests for device: \$DEVICE_TYPE, browser: \$BROWSER"

# Get device configuration
VIEWPORT=\${DEVICE_CONFIGS[\$DEVICE_TYPE]}
if [ -z "\$VIEWPORT" ]; then
    log_error "Unknown device type: \$DEVICE_TYPE"
    exit 1
fi

# Extract viewport dimensions
IFS='x@' read -r WIDTH HEIGHT SCALE <<< "\$VIEWPORT"

log_info "Device viewport: \${WIDTH}x\${HEIGHT} @ \${SCALE}x"

# Export environment variables for tests
export MOBILE_DEVICE="\$DEVICE_TYPE"
export MOBILE_WIDTH="\$WIDTH"
export MOBILE_HEIGHT="\$HEIGHT"
export MOBILE_SCALE="\$SCALE"
export MOBILE_BROWSER="\$BROWSER"

# Run specific test type
case \$TEST_TYPE in
    "unit")
        log_info "Running mobile unit tests..."
        npm run test:mobile:unit -- --device="\$DEVICE_TYPE"
        ;;
    "e2e")
        log_info "Running mobile E2E tests..."
        npm run test:mobile:e2e -- --device="\$DEVICE_TYPE" --browser="\$BROWSER"
        ;;
    "performance")
        log_info "Running mobile performance tests..."
        npm run test:performance:mobile -- --device="\$DEVICE_TYPE"
        ;;
    "accessibility")
        log_info "Running mobile accessibility tests..."
        npm run test:a11y:mobile -- --device="\$DEVICE_TYPE"
        ;;
    "all")
        log_info "Running all mobile tests..."
        npm run test:mobile:unit -- --device="\$DEVICE_TYPE"
        npm run test:mobile:e2e -- --device="\$DEVICE_TYPE" --browser="\$BROWSER"
        npm run test:performance:mobile -- --device="\$DEVICE_TYPE"
        npm run test:a11y:mobile -- --device="\$DEVICE_TYPE"
        ;;
    *)
        log_error "Unknown test type: \$TEST_TYPE"
        log_info "Available types: unit, e2e, performance, accessibility, all"
        exit 1
        ;;
esac

log_success "Mobile tests completed for \$DEVICE_TYPE"
`;
  }

  private generatePerformanceCheckScript(): string {
    return `#!/bin/bash
# Performance Check Script
# Generated by Clear Piggy Mobile CICD Pipeline Manager

set -e

URL=\${1:-"http://localhost:3000"}
DEVICE_TYPE=\${DEVICE_TYPE:-"iPhone 12"}
OUTPUT_DIR=\${2:-"lighthouse-results"}

mkdir -p \$OUTPUT_DIR

echo "Running Lighthouse performance audit..."
echo "URL: \$URL"
echo "Device: \$DEVICE_TYPE"

# Run Lighthouse audit
npx lighthouse "\$URL" \\
  --chrome-flags="--headless --no-sandbox --disable-gpu" \\
  --emulated-form-factor=mobile \\
  --throttling-method=simulate \\
  --output=json \\
  --output=html \\
  --output-path="\$OUTPUT_DIR/lighthouse-\$DEVICE_TYPE"

# Extract scores
PERFORMANCE_SCORE=\$(cat "\$OUTPUT_DIR/lighthouse-\$DEVICE_TYPE.report.json" | jq '.categories.performance.score * 100')
ACCESSIBILITY_SCORE=\$(cat "\$OUTPUT_DIR/lighthouse-\$DEVICE_TYPE.report.json" | jq '.categories.accessibility.score * 100')
BEST_PRACTICES_SCORE=\$(cat "\$OUTPUT_DIR/lighthouse-\$DEVICE_TYPE.report.json" | jq '.categories["best-practices"].score * 100')
SEO_SCORE=\$(cat "\$OUTPUT_DIR/lighthouse-\$DEVICE_TYPE.report.json" | jq '.categories.seo.score * 100')

echo "Lighthouse Scores:"
echo "Performance: \$PERFORMANCE_SCORE"
echo "Accessibility: \$ACCESSIBILITY_SCORE"
echo "Best Practices: \$BEST_PRACTICES_SCORE"
echo "SEO: \$SEO_SCORE"

# Check performance thresholds
PERFORMANCE_THRESHOLD=${this.config.mobileOptimizations.performanceTesting.thresholds.find(t => t.name === 'Performance Score')?.value || 90}

if (( \$(echo "\$PERFORMANCE_SCORE < \$PERFORMANCE_THRESHOLD" | bc -l) )); then
    echo "❌ Performance score \$PERFORMANCE_SCORE is below threshold \$PERFORMANCE_THRESHOLD"
    exit 1
fi

echo "✅ Performance check passed"
`;
  }

  private generateAccessibilityCheckScript(): string {
    return `#!/bin/bash
# Accessibility Check Script
# Generated by Clear Piggy Mobile CICD Pipeline Manager

set -e

URL=\${1:-"http://localhost:3000"}
DEVICE_TYPE=\${DEVICE_TYPE:-"iPhone 12"}
OUTPUT_DIR=\${2:-"accessibility-results"}

mkdir -p \$OUTPUT_DIR

echo "Running mobile accessibility tests..."
echo "URL: \$URL"
echo "Device: \$DEVICE_TYPE"

# Run axe-core accessibility tests
npx @axe-core/cli "\$URL" \\
  --chrome-options="--headless --no-sandbox --disable-gpu" \\
  --viewport-width=375 \\
  --viewport-height=667 \\
  --save="\$OUTPUT_DIR/axe-results.json"

# Run pa11y accessibility tests
npx pa11y "\$URL" \\
  --reporter json \\
  --viewport-width 375 \\
  --viewport-height 667 > "\$OUTPUT_DIR/pa11y-results.json"

# Check results
AXE_VIOLATIONS=\$(cat "\$OUTPUT_DIR/axe-results.json" | jq '.violations | length')
PA11Y_ISSUES=\$(cat "\$OUTPUT_DIR/pa11y-results.json" | jq '. | length')

echo "Accessibility Results:"
echo "Axe violations: \$AXE_VIOLATIONS"
echo "Pa11y issues: \$PA11Y_ISSUES"

# Check thresholds
ACCESSIBILITY_THRESHOLD=${this.config.mobileOptimizations.accessibilityTesting.minimumScore}

if [ "\$AXE_VIOLATIONS" -gt 0 ] || [ "\$PA11Y_ISSUES" -gt 5 ]; then
    echo "❌ Accessibility issues found"
    exit 1
fi

echo "✅ Accessibility check passed"
`;
  }

  private generateBundleCheckScript(): string {
    return `#!/bin/bash
# Bundle Size Check Script
# Generated by Clear Piggy Mobile CICD Pipeline Manager

set -e

BUILD_DIR=\${1:-"dist"}
MAX_SIZE=\${2:-${this.config.mobileOptimizations.bundleAnalysis.maxSize}}

echo "Checking bundle size in \$BUILD_DIR..."
echo "Maximum allowed size: \$MAX_SIZE bytes"

if [ ! -d "\$BUILD_DIR" ]; then
    echo "❌ Build directory \$BUILD_DIR does not exist"
    exit 1
fi

# Calculate total size
TOTAL_SIZE=\$(find "\$BUILD_DIR" -name "*.js" -exec stat -f%z {} + 2>/dev/null | awk '{sum+=\$1} END {print sum}' || find "\$BUILD_DIR" -name "*.js" -exec stat -c%s {} + | awk '{sum+=\$1} END {print sum}')

# Calculate individual bundle sizes
echo "Bundle breakdown:"
find "\$BUILD_DIR" -name "*.js" | while read file; do
    SIZE=\$(stat -f%z "\$file" 2>/dev/null || stat -c%s "\$file")
    echo "  \$(basename "\$file"): \$(numfmt --to=iec \$SIZE 2>/dev/null || echo "\$SIZE bytes")"
done

echo "Total bundle size: \$(numfmt --to=iec \$TOTAL_SIZE 2>/dev/null || echo "\$TOTAL_SIZE bytes")"

# Check against threshold
if [ "\$TOTAL_SIZE" -gt "\$MAX_SIZE" ]; then
    echo "❌ Bundle size \$TOTAL_SIZE exceeds maximum \$MAX_SIZE"
    echo "Consider:"
    echo "  - Code splitting"
    echo "  - Tree shaking"
    echo "  - Removing unused dependencies"
    echo "  - Compressing assets"
    exit 1
fi

echo "✅ Bundle size check passed"
`;
  }

  private generateHealthCheckScript(): string {
    return `#!/bin/bash
# Health Check Script
# Generated by Clear Piggy Mobile CICD Pipeline Manager

set -e

BASE_URL=\$1
ENVIRONMENT=\${2:-"staging"}
MAX_RETRIES=\${3:-5}
RETRY_DELAY=\${4:-10}

if [ -z "\$BASE_URL" ]; then
    echo "Usage: \$0 <base_url> [environment] [max_retries] [retry_delay]"
    exit 1
fi

echo "Running health checks for \$BASE_URL (\$ENVIRONMENT)..."

# Health check endpoints
ENDPOINTS=(
    "/api/health"
    "/api/mobile/health"
    "/api/mobile/transactions"
    "/api/mobile/accounts"
)

# Mobile-specific checks
MOBILE_ENDPOINTS=(
    "/api/mobile/sync"
    "/api/mobile/categories"
    "/api/mobile/budgets"
)

check_endpoint() {
    local url=\$1
    local expected_status=\${2:-200}
    local timeout=\${3:-30}
    
    echo "Checking \$url..."
    
    for i in \$(seq 1 \$MAX_RETRIES); do
        if response=\$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" -m \$timeout "\$url" 2>/dev/null); then
            http_status=\$(echo \$response | sed -E 's/.*HTTPSTATUS:([0-9]{3}).*/\\1/')
            response_time=\$(echo \$response | sed -E 's/.*TIME:([0-9.]*).*/\\1/')
            
            if [ "\$http_status" = "\$expected_status" ]; then
                echo "✅ \$url is healthy (HTTP \$http_status, \${response_time}s)"
                return 0
            else
                echo "❌ \$url returned HTTP \$http_status (expected \$expected_status)"
            fi
        else
            echo "❌ \$url is unreachable"
        fi
        
        if [ \$i -lt \$MAX_RETRIES ]; then
            echo "Retrying in \${RETRY_DELAY}s... (attempt \$((i+1))/\$MAX_RETRIES)"
            sleep \$RETRY_DELAY
        fi
    done
    
    return 1
}

# Check basic endpoints
echo "Checking basic endpoints..."
for endpoint in "\${ENDPOINTS[@]}"; do
    if ! check_endpoint "\$BASE_URL\$endpoint"; then
        echo "❌ Basic health check failed for \$endpoint"
        exit 1
    fi
done

# Check mobile-specific endpoints
echo "Checking mobile-specific endpoints..."
for endpoint in "\${MOBILE_ENDPOINTS[@]}"; do
    if ! check_endpoint "\$BASE_URL\$endpoint"; then
        echo "⚠️ Mobile endpoint \$endpoint failed (non-critical)"
    fi
done

# Performance check
echo "Checking response times..."
RESPONSE_TIME=\$(curl -s -w "%{time_total}" -o /dev/null "\$BASE_URL/api/mobile/health")
RESPONSE_MS=\$(echo "\$RESPONSE_TIME * 1000" | bc)

echo "Response time: \${RESPONSE_MS}ms"

if (( \$(echo "\$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "⚠️ Slow response time: \${RESPONSE_TIME}s"
else
    echo "✅ Response time acceptable"
fi

echo "✅ All health checks passed"
`;
  }

  // Generate configuration files
  private generateJestMobileConfig(): string {
    return `// Jest Mobile Configuration
// Generated by Clear Piggy Mobile CICD Pipeline Manager

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'Mobile Tests',
  testMatch: [
    '<rootDir>/src/**/*.mobile.test.{js,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.mobile.{js,ts,tsx}',
    '<rootDir>/tests/mobile/**/*.test.{js,ts,tsx}'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/tests/mobile/setup.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,ts,tsx}',
    '!src/**/*.test.{js,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results/mobile-unit',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ],
  testTimeout: 30000
};
`;
  }

  private generatePlaywrightMobileConfig(): string {
    return `// Playwright Mobile Configuration
// Generated by Clear Piggy Mobile CICD Pipeline Manager

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/mobile',
  outputDir: 'test-results/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results/e2e/html' }],
    ['junit', { outputFile: 'test-results/e2e/junit.xml' }],
    ['json', { outputFile: 'test-results/e2e/results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
${DEFAULT_MOBILE_DEVICES.map(device => `    {
      name: '${device.name}',
      use: {
        ...devices['${device.name}'] || {
          viewport: { width: ${device.viewport.width}, height: ${device.viewport.height} },
          userAgent: '${device.userAgent}',
          deviceScaleFactor: ${device.viewport.deviceScaleFactor},
          isMobile: ${device.platform !== 'desktop'},
          hasTouch: ${device.platform !== 'desktop'}
        }
      }
    }`).join(',\n')}
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run start:test',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
`;
  }

  private generateLighthouseMobileConfig(): string {
    return `// Lighthouse Mobile Configuration
// Generated by Clear Piggy Mobile CICD Pipeline Manager

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/transactions',
        'http://localhost:3000/accounts',
        'http://localhost:3000/budgets'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-gpu',
        emulatedFormFactor: 'mobile',
        throttlingMethod: 'simulate',
        onlyAudits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'cumulative-layout-shift',
          'first-input-delay',
          'interactive',
          'speed-index',
          'total-blocking-time'
        ]
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: ${this.config.mobileOptimizations.performanceTesting.thresholds.find(t => t.name === 'Performance Score')?.value || 90} }],
        'categories:accessibility': ['warn', { minScore: 95 }],
        'categories:best-practices': ['warn', { minScore: 90 }],
        'categories:seo': ['warn', { minScore: 80 }],
        'first-contentful-paint': ['error', { maxNumericValue: ${this.config.mobileOptimizations.performanceTesting.thresholds.find(t => t.name === 'First Contentful Paint')?.value || 2000} }],
        'largest-contentful-paint': ['error', { maxNumericValue: ${this.config.mobileOptimizations.performanceTesting.thresholds.find(t => t.name === 'Largest Contentful Paint')?.value || 4000} }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: ${this.config.mobileOptimizations.performanceTesting.thresholds.find(t => t.name === 'Cumulative Layout Shift')?.value || 0.1} }],
        'first-input-delay': ['warn', { maxNumericValue: ${this.config.mobileOptimizations.performanceTesting.thresholds.find(t => t.name === 'First Input Delay')?.value || 300} }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results'
    }
  }
};
`;
  }

  private generateBundlesizeConfig(): string {
    return `{
  "files": [
    {
      "path": "dist/static/js/main.*.js",
      "maxSize": "${Math.floor(this.config.mobileOptimizations.bundleAnalysis.maxSize * 0.6 / 1024)}KB"
    },
    {
      "path": "dist/static/js/*.chunk.js",
      "maxSize": "${Math.floor(this.config.mobileOptimizations.bundleAnalysis.maxSize * 0.3 / 1024)}KB"
    },
    {
      "path": "dist/static/css/main.*.css",
      "maxSize": "${Math.floor(this.config.mobileOptimizations.bundleAnalysis.maxSize * 0.1 / 1024)}KB"
    }
  ],
  "ci": {
    "trackBranches": ["main", "develop"],
    "repoBranchBase": "main"
  }
}
`;
  }

  // File writing methods
  private async writeWorkflowFiles(workflows: { [filename: string]: string }): Promise<void> {
    const workflowsDir = this.getWorkflowsDirectory();
    await fs.mkdir(workflowsDir, { recursive: true });

    for (const [filename, content] of Object.entries(workflows)) {
      const filePath = join(workflowsDir, filename);
      await fs.mkdir(dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  private async writeScriptFiles(scripts: { [filename: string]: string }): Promise<void> {
    const scriptsDir = join(this.projectPath, 'scripts', 'mobile');
    await fs.mkdir(scriptsDir, { recursive: true });

    for (const [filename, content] of Object.entries(scripts)) {
      const filePath = join(scriptsDir, filename);
      await fs.writeFile(filePath, content, 'utf8');
      await fs.chmod(filePath, '755'); // Make executable
    }
  }

  private async writeConfigFiles(configs: { [filename: string]: string }): Promise<void> {
    const configsDir = join(this.projectPath, 'config', 'mobile');
    await fs.mkdir(configsDir, { recursive: true });

    for (const [filename, content] of Object.entries(configs)) {
      const filePath = join(configsDir, filename);
      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  private getWorkflowsDirectory(): string {
    switch (this.config.platform) {
      case 'github-actions':
        return join(this.projectPath, '.github', 'workflows');
      case 'gitlab-ci':
        return this.projectPath;
      case 'jenkins':
        return this.projectPath;
      case 'azure-devops':
        return this.projectPath;
      case 'circleci':
        return join(this.projectPath, '.circleci');
      default:
        return join(this.projectPath, 'pipelines');
    }
  }

  // Public API
  async validatePipeline(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate stages
    for (const stage of this.config.stages) {
      if (stage.jobs.length === 0) {
        errors.push(`Stage '${stage.name}' has no jobs`);
      }

      for (const job of stage.jobs) {
        if (job.steps.length === 0) {
          errors.push(`Job '${job.name}' in stage '${stage.name}' has no steps`);
        }

        if (job.timeout > 3600000) { // 1 hour
          warnings.push(`Job '${job.name}' has a long timeout (${job.timeout}ms)`);
        }
      }
    }

    // Check mobile optimizations
    if (!this.config.mobileOptimizations.deviceTesting.enabled) {
      warnings.push('Mobile device testing is disabled');
    }

    if (!this.config.mobileOptimizations.performanceTesting.enabled) {
      warnings.push('Mobile performance testing is disabled');
    }

    // Suggestions
    if (this.config.mobileOptimizations.deviceTesting.devices.length < 3) {
      suggestions.push('Consider testing on more mobile devices for better coverage');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  getConfiguration(): PipelineConfig {
    return this.config;
  }
}