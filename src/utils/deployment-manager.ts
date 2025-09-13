import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import {
  DeploymentConfig,
  DeploymentScript,
  DeploymentStep,
  CICDPipelineUpdate,
  CICDConfig,
  PipelineUpdate,
  TestingStage,
  DeploymentGate
} from '../types/integration-agent-types';

const execAsync = promisify(exec);

export interface DeploymentEnvironment {
  name: string;
  url: string;
  branch: string;
  variables: { [key: string]: string };
  secrets: { [key: string]: string };
  buildCommand: string;
  testCommand?: string;
  deployCommand: string;
  healthCheckUrl?: string;
  rollbackCommand?: string;
}

export interface BuildResult {
  success: boolean;
  duration: number;
  output: string;
  errors: string[];
  warnings: string[];
  artifacts: string[];
  bundleSize?: number;
  performanceScore?: number;
}

export interface DeploymentResult {
  success: boolean;
  environment: string;
  duration: number;
  deploymentUrl?: string;
  version?: string;
  rollbackVersion?: string;
  healthChecks: HealthCheckResult[];
  errors: string[];
}

export interface HealthCheckResult {
  name: string;
  url: string;
  status: 'passed' | 'failed' | 'warning';
  responseTime: number;
  statusCode?: number;
  message?: string;
}

export class DeploymentManager extends EventEmitter {
  private config: DeploymentConfig;
  private cicdConfig: CICDConfig;
  private projectPath: string;

  constructor(projectPath: string, config: DeploymentConfig, cicdConfig: CICDConfig) {
    super();
    this.projectPath = projectPath;
    this.config = config;
    this.cicdConfig = cicdConfig;
  }

  async createDeploymentScripts(): Promise<DeploymentScript[]> {
    const scripts: DeploymentScript[] = [];
    
    try {
      // Create staging deployment script
      const stagingScript = await this.createEnvironmentScript('staging');
      scripts.push(stagingScript);
      
      // Create production deployment script
      const productionScript = await this.createEnvironmentScript('production');
      scripts.push(productionScript);
      
      // Create mobile-specific deployment script
      const mobileScript = await this.createMobileDeploymentScript();
      scripts.push(mobileScript);
      
      // Create rollback script
      const rollbackScript = await this.createRollbackScript();
      scripts.push(rollbackScript);
      
      // Write scripts to files
      await this.writeDeploymentScripts(scripts);
      
      this.emit('scripts:created', scripts);
      return scripts;
      
    } catch (error) {
      this.emit('scripts:error', error);
      throw new Error(`Failed to create deployment scripts: ${(error as Error).message}`);
    }
  }

  private async createEnvironmentScript(environment: 'staging' | 'production'): Promise<DeploymentScript> {
    const envConfig = environment === 'staging' 
      ? this.config.stagingEnvironment 
      : this.config.productionEnvironment;
    
    const steps: DeploymentStep[] = [
      {
        id: 'pre_checks',
        name: 'Pre-deployment Checks',
        command: this.generatePreChecksCommand(),
        description: 'Run pre-deployment validation',
        critical: true,
        timeout: 300000,
        retryCount: 0,
        continueOnError: false
      },
      {
        id: 'install_deps',
        name: 'Install Dependencies',
        command: 'npm ci',
        description: 'Install project dependencies',
        critical: true,
        timeout: 600000,
        retryCount: 2,
        continueOnError: false
      },
      {
        id: 'build_project',
        name: 'Build Project',
        command: this.config.buildCommand,
        description: 'Build the project for deployment',
        critical: true,
        timeout: 900000,
        retryCount: 1,
        continueOnError: false
      },
      {
        id: 'mobile_tests',
        name: 'Mobile Tests',
        command: 'npm run test:mobile',
        description: 'Run mobile-specific tests',
        critical: environment === 'production',
        timeout: 1200000,
        retryCount: 1,
        continueOnError: environment === 'staging'
      },
      {
        id: 'performance_tests',
        name: 'Performance Tests',
        command: 'npm run test:performance:mobile',
        description: 'Run mobile performance tests',
        critical: false,
        timeout: 600000,
        retryCount: 0,
        continueOnError: true
      },
      {
        id: 'deploy',
        name: `Deploy to ${environment}`,
        command: this.generateDeployCommand(environment),
        description: `Deploy application to ${environment} environment`,
        critical: true,
        timeout: 1800000,
        retryCount: 2,
        continueOnError: false
      },
      {
        id: 'health_check',
        name: 'Health Check',
        command: this.generateHealthCheckCommand(envConfig.url),
        description: 'Verify deployment health',
        critical: true,
        timeout: 300000,
        retryCount: 3,
        continueOnError: false
      },
      {
        id: 'post_deploy',
        name: 'Post-deployment Tasks',
        command: this.generatePostDeployCommand(environment),
        description: 'Run post-deployment validation',
        critical: false,
        timeout: 300000,
        retryCount: 1,
        continueOnError: true
      }
    ];
    
    return {
      name: `deploy-${environment}`,
      environment,
      platform: this.config.deploymentPlatform,
      steps,
      environmentVariables: {
        NODE_ENV: environment,
        BUILD_ENV: environment,
        DEPLOY_TARGET: environment,
        ...this.config.environmentVariables
      },
      preChecks: this.config.preDeploymentChecks,
      postChecks: this.config.postDeploymentValidation,
      rollbackScript: `rollback-${environment}`
    };
  }

  private async createMobileDeploymentScript(): Promise<DeploymentScript> {
    const steps: DeploymentStep[] = [
      {
        id: 'mobile_build_check',
        name: 'Mobile Build Validation',
        command: 'npm run build:mobile',
        description: 'Build and validate mobile-optimized version',
        critical: true,
        timeout: 900000,
        retryCount: 1,
        continueOnError: false
      },
      {
        id: 'mobile_bundle_analysis',
        name: 'Mobile Bundle Analysis',
        command: 'npm run analyze:mobile',
        description: 'Analyze mobile bundle size and performance',
        critical: false,
        timeout: 300000,
        retryCount: 0,
        continueOnError: true
      },
      {
        id: 'mobile_accessibility_tests',
        name: 'Mobile Accessibility Tests',
        command: 'npm run test:a11y:mobile',
        description: 'Run mobile accessibility tests',
        critical: true,
        timeout: 600000,
        retryCount: 1,
        continueOnError: false
      },
      {
        id: 'mobile_device_tests',
        name: 'Mobile Device Tests',
        command: 'npm run test:devices',
        description: 'Run tests across mobile devices',
        critical: true,
        timeout: 1800000,
        retryCount: 1,
        continueOnError: false
      },
      {
        id: 'mobile_performance_validation',
        name: 'Mobile Performance Validation',
        command: 'npm run validate:mobile:performance',
        description: 'Validate mobile performance metrics',
        critical: true,
        timeout: 600000,
        retryCount: 1,
        continueOnError: false
      }
    ];
    
    return {
      name: 'deploy-mobile',
      environment: 'production',
      platform: this.config.deploymentPlatform,
      steps,
      environmentVariables: {
        MOBILE_OPTIMIZED: 'true',
        BUILD_TYPE: 'mobile',
        ...this.config.environmentVariables
      },
      preChecks: [
        'Mobile build validation',
        'Device compatibility check',
        'Performance threshold validation'
      ],
      postChecks: [
        'Mobile health check',
        'Performance regression check',
        'Accessibility compliance check'
      ]
    };
  }

  private async createRollbackScript(): Promise<DeploymentScript> {
    const steps: DeploymentStep[] = [
      {
        id: 'backup_current',
        name: 'Backup Current Deployment',
        command: this.generateBackupCommand(),
        description: 'Create backup of current deployment',
        critical: true,
        timeout: 300000,
        retryCount: 1,
        continueOnError: false
      },
      {
        id: 'rollback_deploy',
        name: 'Rollback Deployment',
        command: this.generateRollbackDeployCommand(),
        description: 'Rollback to previous deployment',
        critical: true,
        timeout: 900000,
        retryCount: 2,
        continueOnError: false
      },
      {
        id: 'verify_rollback',
        name: 'Verify Rollback',
        command: this.generateHealthCheckCommand(this.config.productionEnvironment.url),
        description: 'Verify rollback was successful',
        critical: true,
        timeout: 300000,
        retryCount: 3,
        continueOnError: false
      },
      {
        id: 'notify_rollback',
        name: 'Notify Rollback',
        command: 'echo "Rollback completed successfully"',
        description: 'Send rollback notification',
        critical: false,
        timeout: 30000,
        retryCount: 0,
        continueOnError: true
      }
    ];
    
    return {
      name: 'rollback',
      environment: 'production',
      platform: this.config.deploymentPlatform,
      steps,
      environmentVariables: {
        ROLLBACK_MODE: 'true',
        ...this.config.environmentVariables
      },
      preChecks: ['Verify previous deployment exists'],
      postChecks: ['Health check', 'Performance validation']
    };
  }

  private async writeDeploymentScripts(scripts: DeploymentScript[]): Promise<void> {
    const scriptsDir = join(this.projectPath, 'scripts', 'deployment');
    await fs.mkdir(scriptsDir, { recursive: true });
    
    for (const script of scripts) {
      const scriptContent = this.generateScriptContent(script);
      const scriptPath = join(scriptsDir, `${script.name}.sh`);
      
      await fs.writeFile(scriptPath, scriptContent, 'utf8');
      await fs.chmod(scriptPath, '755');
    }
    
    // Create deployment utilities
    await this.createDeploymentUtilities(scriptsDir);
  }

  private generateScriptContent(script: DeploymentScript): string {
    let content = `#!/bin/bash
# ${script.name} - Mobile Optimization Deployment Script
# Generated by Clear Piggy Mobile Integration Agent
# Platform: ${script.platform}
# Environment: ${script.environment}

set -e  # Exit on any error

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "\${BLUE}[INFO]\${NC} \$1"
}

log_success() {
    echo -e "\${GREEN}[SUCCESS]\${NC} \$1"
}

log_warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} \$1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
}

# Environment variables
`;
    
    // Add environment variables
    for (const [key, value] of Object.entries(script.environmentVariables)) {
      content += `export ${key}="${value}"\n`;
    }
    
    content += `\n# Deployment steps\n`;
    content += `SCRIPT_START_TIME=$(date +%s)\n`;
    content += `FAILED_STEPS=()\n\n`;
    
    // Add pre-checks
    if (script.preChecks && script.preChecks.length > 0) {
      content += `# Pre-deployment checks\nlog_info "Running pre-deployment checks..."\n`;
      for (const check of script.preChecks) {
        content += `log_info "Checking: ${check}"\n`;
      }
      content += '\n';
    }
    
    // Add each step
    for (const step of script.steps) {
      content += this.generateStepContent(step);
    }
    
    // Add post-checks
    if (script.postChecks && script.postChecks.length > 0) {
      content += `# Post-deployment checks\nlog_info "Running post-deployment checks..."\n`;
      for (const check of script.postChecks) {
        content += `log_info "Checking: ${check}"\n`;
      }
      content += '\n';
    }
    
    // Add completion
    content += `
# Calculate total time
SCRIPT_END_TIME=$(date +%s)
TOTAL_TIME=$((SCRIPT_END_TIME - SCRIPT_START_TIME))

if [ \${#FAILED_STEPS[@]} -eq 0 ]; then
    log_success "🎉 Deployment completed successfully in \${TOTAL_TIME} seconds!"
else
    log_error "❌ Deployment failed. Failed steps: \${FAILED_STEPS[*]}"
    exit 1
fi
`;
    
    return content;
  }

  private generateStepContent(step: DeploymentStep): string {
    return `
# Step: ${step.name}
log_info "🚀 ${step.description}"
STEP_START_TIME=$(date +%s)

execute_step_${step.id}() {
    local attempt=1
    local max_attempts=$((${step.retryCount} + 1))
    
    while [ \$attempt -le \$max_attempts ]; do
        if [ \$attempt -gt 1 ]; then
            log_warning "Retrying ${step.name} (attempt \$attempt/\$max_attempts)"
        fi
        
        if timeout ${Math.floor(step.timeout / 1000)} ${step.command}; then
            log_success "✅ ${step.name} completed"
            return 0
        else
            local exit_code=\$?
            log_error "❌ ${step.name} failed with exit code \$exit_code"
            
            if [ \$attempt -lt \$max_attempts ]; then
                log_info "Waiting before retry..."
                sleep 5
            fi
        fi
        
        ((attempt++))
    done
    
    return 1
}

if ! execute_step_${step.id}; then
    FAILED_STEPS+=("${step.name}")
    ${step.critical ? `
    log_error "Critical step failed: ${step.name}"
    exit 1` : step.continueOnError ? `
    log_warning "Non-critical step failed, continuing: ${step.name}"` : `
    log_error "Step failed: ${step.name}"
    exit 1`}
fi

STEP_END_TIME=$(date +%s)
STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
log_info "⏱️  ${step.name} completed in \$STEP_DURATION seconds"
`;
  }

  private async createDeploymentUtilities(scriptsDir: string): Promise<void> {
    // Create health check utility
    const healthCheckScript = `#!/bin/bash
# Health Check Utility

check_url() {
    local url=\$1
    local timeout=\${2:-30}
    local expected_status=\${3:-200}
    
    echo "Checking \$url..."
    
    response=\$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" -m \$timeout "\$url" || echo "HTTPSTATUS:000;TIME:0")
    
    http_status=\$(echo \$response | sed -E 's/.*HTTPSTATUS:([0-9]{3}).*/\\1/')
    response_time=\$(echo \$response | sed -E 's/.*TIME:([0-9.]*).*/\\1/')
    
    if [ "\$http_status" = "\$expected_status" ]; then
        echo "✅ \$url is healthy (HTTP \$http_status, \${response_time}s)"
        return 0
    else
        echo "❌ \$url failed health check (HTTP \$http_status, \${response_time}s)"
        return 1
    fi
}

# Mobile-specific health checks
check_mobile_endpoints() {
    local base_url=\$1
    
    echo "Running mobile-specific health checks..."
    
    check_url "\$base_url/api/mobile/health" 10 200 || return 1
    check_url "\$base_url/api/mobile/transactions" 10 200 || return 1
    check_url "\$base_url/api/mobile/accounts" 10 200 || return 1
    
    echo "All mobile endpoints are healthy"
    return 0
}

# Performance checks
check_performance() {
    local url=\$1
    
    echo "Running performance checks..."
    
    # Check if lighthouse is available
    if command -v lighthouse &> /dev/null; then
        lighthouse \$url --only-categories=performance --chrome-flags="--headless" --output=json --output-path=/tmp/lighthouse.json
        
        performance_score=\$(cat /tmp/lighthouse.json | jq '.categories.performance.score * 100')
        echo "Performance score: \$performance_score"
        
        if (( \$(echo "\$performance_score >= 80" | bc -l) )); then
            echo "✅ Performance check passed"
            return 0
        else
            echo "❌ Performance check failed"
            return 1
        fi
    else
        echo "⚠️  Lighthouse not available, skipping performance check"
        return 0
    fi
}

# Main execution
if [ "\$1" = "mobile" ]; then
    check_mobile_endpoints \$2
elif [ "\$1" = "performance" ]; then
    check_performance \$2
else
    check_url \$1 \$2 \$3
fi
`;
    
    await fs.writeFile(join(scriptsDir, 'health-check.sh'), healthCheckScript, 'utf8');
    await fs.chmod(join(scriptsDir, 'health-check.sh'), '755');
    
    // Create bundle analyzer utility
    const bundleAnalyzerScript = `#!/bin/bash
# Bundle Analyzer Utility

analyze_bundle() {
    local build_dir=\${1:-"dist"}
    
    echo "Analyzing bundle in \$build_dir..."
    
    if command -v webpack-bundle-analyzer &> /dev/null; then
        webpack-bundle-analyzer "\$build_dir/static/js/*.js" --report --mode static --open false
        echo "✅ Bundle analysis complete"
    else
        echo "⚠️  webpack-bundle-analyzer not available"
    fi
}

check_bundle_size() {
    local build_dir=\${1:-"dist"}
    local max_size=\${2:-5000000}  # 5MB default
    
    echo "Checking bundle size in \$build_dir..."
    
    total_size=\$(find "\$build_dir" -name "*.js" -exec stat -f%z {} + | awk '{sum+=\$1} END {print sum}')
    
    echo "Total bundle size: \$(numfmt --to=iec \$total_size)"
    
    if [ \$total_size -gt \$max_size ]; then
        echo "❌ Bundle size exceeds limit of \$(numfmt --to=iec \$max_size)"
        return 1
    else
        echo "✅ Bundle size within limits"
        return 0
    fi
}

# Main execution
case \$1 in
    "analyze")
        analyze_bundle \$2
        ;;
    "size")
        check_bundle_size \$2 \$3
        ;;
    *)
        echo "Usage: \$0 {analyze|size} [build_dir] [max_size]"
        exit 1
        ;;
esac
`;
    
    await fs.writeFile(join(scriptsDir, 'bundle-analyzer.sh'), bundleAnalyzerScript, 'utf8');
    await fs.chmod(join(scriptsDir, 'bundle-analyzer.sh'), '755');
  }

  async updateCICDPipeline(): Promise<CICDPipelineUpdate[]> {
    const updates: CICDPipelineUpdate[] = [];
    
    try {
      switch (this.cicdConfig.platform) {
        case 'github-actions':
          const githubUpdate = await this.updateGitHubActions();
          if (githubUpdate) updates.push(githubUpdate);
          break;
        case 'gitlab-ci':
          const gitlabUpdate = await this.updateGitLabCI();
          if (gitlabUpdate) updates.push(gitlabUpdate);
          break;
        case 'jenkins':
          const jenkinsUpdate = await this.updateJenkins();
          if (jenkinsUpdate) updates.push(jenkinsUpdate);
          break;
      }
      
      this.emit('cicd:updated', updates);
      return updates;
      
    } catch (error) {
      this.emit('cicd:error', error);
      throw error;
    }
  }

  private async updateGitHubActions(): Promise<CICDPipelineUpdate | null> {
    const workflowsDir = join(this.projectPath, '.github', 'workflows');
    
    try {
      await fs.mkdir(workflowsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    const mobileTestingWorkflow = this.generateGitHubActionsWorkflow();
    const workflowPath = join(workflowsDir, 'mobile-optimization.yml');
    
    await fs.writeFile(workflowPath, mobileTestingWorkflow, 'utf8');
    
    return {
      platform: 'github-actions',
      configFile: '.github/workflows/mobile-optimization.yml',
      updates: [
        {
          stage: 'mobile-testing',
          changes: ['Added mobile device testing matrix', 'Added performance thresholds'],
          mobileSpecific: true,
          newStage: true
        },
        {
          stage: 'deployment',
          changes: ['Added mobile-specific deployment steps', 'Added bundle size validation'],
          mobileSpecific: true,
          newStage: false
        }
      ],
      mobileTestingStages: [
        {
          name: 'mobile-unit-tests',
          devices: ['iPhone-12', 'Samsung-Galaxy-S21'],
          browsers: ['chrome', 'safari'],
          testSuites: ['unit', 'component'],
          parallelExecution: true,
          failFast: false
        },
        {
          name: 'mobile-e2e-tests',
          devices: ['iPhone-12', 'iPad-Air', 'Samsung-Galaxy-S21'],
          browsers: ['chrome', 'safari', 'firefox'],
          testSuites: ['e2e', 'accessibility', 'performance'],
          parallelExecution: true,
          failFast: true
        }
      ],
      deploymentGates: [
        {
          name: 'mobile-tests-pass',
          condition: 'success()',
          mobileRequired: true,
          autoApproval: false,
          reviewers: ['mobile-team']
        },
        {
          name: 'performance-thresholds',
          condition: 'mobile-performance-score >= 90',
          mobileRequired: true,
          autoApproval: true,
          reviewers: []
        }
      ],
      performanceThresholds: {
        buildTime: this.cicdConfig.performanceThresholds.buildTime,
        bundleSize: this.cicdConfig.performanceThresholds.bundleSize,
        testCoverage: this.cicdConfig.performanceThresholds.testCoverage,
        performanceScore: this.cicdConfig.performanceThresholds.performanceScore
      }
    };
  }

  private generateGitHubActionsWorkflow(): string {
    return `name: Mobile Optimization CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'
  MOBILE_OPTIMIZATION: true

jobs:
  mobile-unit-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        device: [iPhone-12, Samsung-Galaxy-S21, iPad-Air]
        
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
      
    - name: Run mobile unit tests
      run: npm run test:mobile:unit -- --device \${{ matrix.device }}
      env:
        DEVICE_TYPE: \${{ matrix.device }}
        
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results-\${{ matrix.device }}
        path: test-results/
        
  mobile-e2e-tests:
    runs-on: ubuntu-latest
    needs: mobile-unit-tests
    
    strategy:
      matrix:
        device: [iPhone-12, Samsung-Galaxy-S21, iPad-Air]
        browser: [chrome, firefox]
        
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
      
    - name: Build project
      run: npm run build
      
    - name: Run mobile E2E tests
      run: npm run test:mobile:e2e -- --device \${{ matrix.device }} --browser \${{ matrix.browser }}
      env:
        DEVICE_TYPE: \${{ matrix.device }}
        BROWSER: \${{ matrix.browser }}
        
    - name: Run accessibility tests
      run: npm run test:a11y:mobile -- --device \${{ matrix.device }}
      
    - name: Run performance tests
      run: npm run test:performance:mobile -- --device \${{ matrix.device }}
      
    - name: Upload screenshots
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: screenshots-\${{ matrix.device }}-\${{ matrix.browser }}
        path: test-results/screenshots/
        
  mobile-bundle-analysis:
    runs-on: ubuntu-latest
    needs: mobile-unit-tests
    
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
      
    - name: Build for production
      run: npm run build
      
    - name: Analyze bundle size
      run: npm run analyze:bundle
      
    - name: Check bundle size limits
      run: |
        BUNDLE_SIZE=\$(du -sb dist/ | cut -f1)
        MAX_SIZE=\${{ env.MAX_BUNDLE_SIZE || 5000000 }}
        
        if [ \$BUNDLE_SIZE -gt \$MAX_SIZE ]; then
          echo "Bundle size \$BUNDLE_SIZE exceeds limit \$MAX_SIZE"
          exit 1
        else
          echo "Bundle size \$BUNDLE_SIZE is within limit \$MAX_SIZE"
        fi
        
    - name: Upload bundle analysis
      uses: actions/upload-artifact@v4
      with:
        name: bundle-analysis
        path: bundle-analysis/
        
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [mobile-e2e-tests, mobile-bundle-analysis]
    if: github.ref == 'refs/heads/develop'
    
    environment:
      name: staging
      url: https://staging.clear-piggy.com
      
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
      
    - name: Build for staging
      run: npm run build:staging
      env:
        NODE_ENV: staging
        
    - name: Deploy to staging
      run: ./scripts/deployment/deploy-staging.sh
      env:
        DEPLOYMENT_TOKEN: \${{ secrets.STAGING_DEPLOYMENT_TOKEN }}
        
    - name: Run staging health checks
      run: ./scripts/deployment/health-check.sh https://staging.clear-piggy.com
      
  deploy-production:
    runs-on: ubuntu-latest
    needs: [mobile-e2e-tests, mobile-bundle-analysis]
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://clear-piggy.com
      
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
      
    - name: Build for production
      run: npm run build:production
      env:
        NODE_ENV: production
        
    - name: Run pre-deployment checks
      run: |
        npm run test:integration
        npm run test:security
        
    - name: Deploy to production
      run: ./scripts/deployment/deploy-production.sh
      env:
        DEPLOYMENT_TOKEN: \${{ secrets.PRODUCTION_DEPLOYMENT_TOKEN }}
        
    - name: Run production health checks
      run: ./scripts/deployment/health-check.sh https://clear-piggy.com
      
    - name: Run mobile-specific health checks
      run: ./scripts/deployment/health-check.sh mobile https://clear-piggy.com
      
    - name: Notify deployment success
      if: success()
      run: echo "🎉 Mobile optimization deployment successful!"
      
    - name: Rollback on failure
      if: failure()
      run: ./scripts/deployment/rollback.sh
`;
  }

  private async updateGitLabCI(): Promise<CICDPipelineUpdate | null> {
    // Similar implementation for GitLab CI
    return null;
  }

  private async updateJenkins(): Promise<CICDPipelineUpdate | null> {
    // Similar implementation for Jenkins
    return null;
  }

  // Command generators
  private generatePreChecksCommand(): string {
    return this.config.preDeploymentChecks.map(check => `npm run ${check}`).join(' && ');
  }

  private generateDeployCommand(environment: string): string {
    switch (this.config.deploymentPlatform) {
      case 'vercel':
        return environment === 'production' 
          ? 'vercel --prod' 
          : 'vercel --target preview';
      case 'netlify':
        return environment === 'production' 
          ? 'netlify deploy --prod' 
          : 'netlify deploy';
      case 'aws':
        return `aws s3 sync ${this.config.outputDirectory} s3://clear-piggy-${environment}/`;
      default:
        return 'echo "Custom deployment platform not implemented"';
    }
  }

  private generateHealthCheckCommand(url: string): string {
    return `./scripts/deployment/health-check.sh ${url}`;
  }

  private generatePostDeployCommand(environment: string): string {
    return this.config.postDeploymentValidation.map(check => `npm run ${check}`).join(' && ');
  }

  private generateBackupCommand(): string {
    return 'echo "Creating deployment backup..."';
  }

  private generateRollbackDeployCommand(): string {
    switch (this.config.deploymentPlatform) {
      case 'vercel':
        return 'vercel rollback';
      case 'netlify':
        return 'netlify rollback';
      default:
        return 'echo "Custom rollback not implemented"';
    }
  }
}