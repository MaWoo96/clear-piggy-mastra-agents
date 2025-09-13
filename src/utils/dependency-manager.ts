import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { DependencyManagementConfig } from '../types/integration-agent-types';

const execAsync = promisify(exec);

export interface PackageInfo {
  name: string;
  version: string;
  currentVersion?: string;
  latestVersion?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  peerDependencies?: { [key: string]: string };
  vulnerabilities?: SecurityVulnerability[];
  compatibility?: CompatibilityInfo;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  fixedIn?: string;
}

export interface CompatibilityInfo {
  compatible: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface DependencyUpdate {
  package: string;
  from: string;
  to: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  breaking: boolean;
  security: boolean;
  reason: string;
}

export interface DependencyAnalysis {
  totalDependencies: number;
  outdatedDependencies: number;
  vulnerabilities: number;
  duplicates: number;
  unusedDependencies: string[];
  missingDependencies: string[];
  peerDependencyIssues: string[];
  recommendations: string[];
}

export class DependencyManager extends EventEmitter {
  private config: DependencyManagementConfig;
  private projectPath: string;
  private packageJsonPath: string;
  private lockFilePath: string;

  constructor(projectPath: string, config: DependencyManagementConfig) {
    super();
    this.projectPath = projectPath;
    this.config = config;
    this.packageJsonPath = join(projectPath, 'package.json');
    this.lockFilePath = join(projectPath, 'package-lock.json');
  }

  async analyzeDependencies(): Promise<DependencyAnalysis> {
    try {
      const packageJson = await this.readPackageJson();
      const outdated = await this.getOutdatedPackages();
      const vulnerabilities = await this.getSecurityVulnerabilities();
      const unused = await this.findUnusedDependencies();
      const missing = await this.findMissingDependencies();
      const peerIssues = await this.checkPeerDependencies();
      
      const analysis: DependencyAnalysis = {
        totalDependencies: Object.keys({
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        }).length,
        outdatedDependencies: outdated.length,
        vulnerabilities: vulnerabilities.length,
        duplicates: 0, // Would need more complex analysis
        unusedDependencies: unused,
        missingDependencies: missing,
        peerDependencyIssues: peerIssues,
        recommendations: []
      };

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);
      
      this.emit('analysis:completed', analysis);
      return analysis;
      
    } catch (error) {
      throw new Error(`Failed to analyze dependencies: ${(error as Error).message}`);
    }
  }

  async addMobileDependencies(dependencies: string[]): Promise<DependencyUpdate[]> {
    const updates: DependencyUpdate[] = [];
    const packageJson = await this.readPackageJson();
    
    for (const dep of dependencies) {
      const packageInfo = await this.getPackageInfo(dep);
      if (!packageInfo) continue;
      
      // Check if dependency already exists
      const currentVersion = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
      
      if (!currentVersion) {
        // Add new dependency
        const latestVersion = await this.getLatestVersion(dep);
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies[dep] = `^${latestVersion}`;
        
        updates.push({
          package: dep,
          from: 'none',
          to: `^${latestVersion}`,
          type: 'dependency',
          breaking: false,
          security: false,
          reason: 'Mobile optimization requirement'
        });
        
        this.emit('dependency:added', { package: dep, version: latestVersion });
      } else {
        // Check if update is needed
        const latestVersion = await this.getLatestVersion(dep);
        if (this.shouldUpdate(currentVersion, latestVersion)) {
          packageJson.dependencies[dep] = `^${latestVersion}`;
          
          updates.push({
            package: dep,
            from: currentVersion,
            to: `^${latestVersion}`,
            type: 'dependency',
            breaking: await this.isBreakingUpdate(dep, currentVersion, latestVersion),
            security: false,
            reason: 'Update to latest version for mobile optimization'
          });
          
          this.emit('dependency:updated', { package: dep, from: currentVersion, to: latestVersion });
        }
      }
    }
    
    // Write updated package.json
    if (updates.length > 0) {
      await this.writePackageJson(packageJson);
    }
    
    return updates;
  }

  async updateOutdatedDependencies(): Promise<DependencyUpdate[]> {
    const updates: DependencyUpdate[] = [];
    const outdated = await this.getOutdatedPackages();
    const packageJson = await this.readPackageJson();
    
    for (const pkg of outdated) {
      const updateStrategy = this.getUpdateStrategy(pkg);
      
      if (updateStrategy === 'skip') continue;
      
      const newVersion = this.getTargetVersion(pkg, updateStrategy);
      const isBreaking = await this.isBreakingUpdate(pkg.name, pkg.currentVersion!, newVersion);
      
      // Apply conservative approach for breaking changes
      if (isBreaking && this.config.updateStrategy === 'conservative') {
        continue;
      }
      
      // Update package.json
      if (packageJson.dependencies?.[pkg.name]) {
        packageJson.dependencies[pkg.name] = newVersion;
      } else if (packageJson.devDependencies?.[pkg.name]) {
        packageJson.devDependencies[pkg.name] = newVersion;
      }
      
      updates.push({
        package: pkg.name,
        from: pkg.currentVersion!,
        to: newVersion,
        type: packageJson.dependencies?.[pkg.name] ? 'dependency' : 'devDependency',
        breaking: isBreaking,
        security: false,
        reason: 'Outdated dependency update'
      });
      
      this.emit('dependency:updated', { 
        package: pkg.name, 
        from: pkg.currentVersion, 
        to: newVersion 
      });
    }
    
    // Write updated package.json
    if (updates.length > 0) {
      await this.writePackageJson(packageJson);
    }
    
    return updates;
  }

  async fixSecurityVulnerabilities(): Promise<DependencyUpdate[]> {
    const updates: DependencyUpdate[] = [];
    
    try {
      // Run npm audit fix
      const { stdout } = await execAsync('npm audit fix --json', { cwd: this.projectPath });
      const auditResult = JSON.parse(stdout);
      
      // Parse audit results and create update records
      if (auditResult.actions) {
        for (const action of auditResult.actions) {
          if (action.action === 'update') {
            for (const dep of action.resolves) {
              updates.push({
                package: dep.id.split('@')[0],
                from: dep.version,
                to: action.target,
                type: 'dependency',
                breaking: false,
                security: true,
                reason: `Security fix: ${dep.title}`
              });
            }
          }
        }
      }
      
      this.emit('security:fixed', updates);
      
    } catch (error) {
      // npm audit fix might fail, try manual fixes
      const vulnerabilities = await this.getSecurityVulnerabilities();
      
      for (const vuln of vulnerabilities) {
        if (vuln.fixedIn) {
          const update = await this.updatePackageVersion(vuln.id, vuln.fixedIn);
          if (update) {
            updates.push({
              ...update,
              security: true,
              reason: `Security fix: ${vuln.title}`
            });
          }
        }
      }
    }
    
    return updates;
  }

  async installDependencies(): Promise<void> {
    try {
      this.emit('install:started');
      
      const { stdout, stderr } = await execAsync('npm install', { cwd: this.projectPath });
      
      if (stderr && !stderr.includes('WARN')) {
        throw new Error(stderr);
      }
      
      this.emit('install:completed', { output: stdout });
      
    } catch (error) {
      this.emit('install:failed', error);
      throw new Error(`Failed to install dependencies: ${(error as Error).message}`);
    }
  }

  async updateLockFile(): Promise<void> {
    if (!this.config.lockFileUpdate) return;
    
    try {
      // Remove lock file and reinstall to get fresh lock
      await fs.unlink(this.lockFilePath).catch(() => {});
      await this.installDependencies();
      
      this.emit('lockfile:updated');
      
    } catch (error) {
      throw new Error(`Failed to update lock file: ${(error as Error).message}`);
    }
  }

  async checkCompatibility(dependencies: string[]): Promise<{ [key: string]: CompatibilityInfo }> {
    const compatibility: { [key: string]: CompatibilityInfo } = {};
    
    for (const dep of dependencies) {
      compatibility[dep] = await this.checkPackageCompatibility(dep);
    }
    
    return compatibility;
  }

  async validatePeerDependencies(): Promise<string[]> {
    const issues: string[] = [];
    
    try {
      const { stdout } = await execAsync('npm ls --json', { cwd: this.projectPath });
      const lsResult = JSON.parse(stdout);
      
      // Check for peer dependency warnings
      if (lsResult.problems) {
        for (const problem of lsResult.problems) {
          if (problem.includes('peer dep missing')) {
            issues.push(problem);
          }
        }
      }
      
    } catch (error) {
      // npm ls might fail with dependency issues
      const errorOutput = (error as any).stdout || '';
      const peerDepRegex = /ENPEERREQ.*peer dep missing: (.+)/g;
      let match;
      
      while ((match = peerDepRegex.exec(errorOutput)) !== null) {
        issues.push(`Missing peer dependency: ${match[1]}`);
      }
    }
    
    return issues;
  }

  async generateCompatibilityReport(): Promise<string> {
    const analysis = await this.analyzeDependencies();
    const mobileDeps = this.config.mobileSpecificDependencies;
    const compatibility = await this.checkCompatibility(mobileDeps);
    
    let report = '# Dependency Compatibility Report\n\n';
    
    report += '## Overview\n';
    report += `- Total Dependencies: ${analysis.totalDependencies}\n`;
    report += `- Outdated: ${analysis.outdatedDependencies}\n`;
    report += `- Vulnerabilities: ${analysis.vulnerabilities}\n`;
    report += `- Unused: ${analysis.unusedDependencies.length}\n\n`;
    
    report += '## Mobile Dependencies\n';
    for (const dep of mobileDeps) {
      const compat = compatibility[dep];
      const status = compat.compatible ? '✅' : '❌';
      report += `${status} **${dep}**: ${compat.compatible ? 'Compatible' : 'Issues found'}\n`;
      
      if (!compat.compatible) {
        compat.issues.forEach(issue => report += `  - ❌ ${issue}\n`);
      }
      
      if (compat.warnings.length > 0) {
        compat.warnings.forEach(warning => report += `  - ⚠️ ${warning}\n`);
      }
    }
    
    if (analysis.recommendations.length > 0) {
      report += '\n## Recommendations\n';
      analysis.recommendations.forEach(rec => report += `- ${rec}\n`);
    }
    
    return report;
  }

  // Private helper methods
  private async readPackageJson(): Promise<any> {
    try {
      const content = await fs.readFile(this.packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read package.json: ${(error as Error).message}`);
    }
  }

  private async writePackageJson(packageJson: any): Promise<void> {
    try {
      await fs.writeFile(this.packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to write package.json: ${(error as Error).message}`);
    }
  }

  private async getOutdatedPackages(): Promise<PackageInfo[]> {
    try {
      const { stdout } = await execAsync('npm outdated --json', { cwd: this.projectPath });
      const outdated = JSON.parse(stdout);
      
      return Object.entries(outdated).map(([name, info]: [string, any]) => ({
        name,
        version: info.wanted,
        currentVersion: info.current,
        latestVersion: info.latest
      }));
      
    } catch (error) {
      // npm outdated returns exit code 1 when outdated packages exist
      const stdout = (error as any).stdout;
      if (stdout) {
        try {
          const outdated = JSON.parse(stdout);
          return Object.entries(outdated).map(([name, info]: [string, any]) => ({
            name,
            version: info.wanted,
            currentVersion: info.current,
            latestVersion: info.latest
          }));
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  private async getSecurityVulnerabilities(): Promise<SecurityVulnerability[]> {
    try {
      const { stdout } = await execAsync('npm audit --json', { cwd: this.projectPath });
      const audit = JSON.parse(stdout);
      
      const vulnerabilities: SecurityVulnerability[] = [];
      
      if (audit.vulnerabilities) {
        for (const [name, vuln] of Object.entries(audit.vulnerabilities) as [string, any][]) {
          vulnerabilities.push({
            id: name,
            severity: vuln.severity,
            title: vuln.title || `Vulnerability in ${name}`,
            description: vuln.overview || '',
            recommendation: vuln.recommendation || '',
            fixedIn: vuln.fixAvailable?.version
          });
        }
      }
      
      return vulnerabilities;
      
    } catch (error) {
      // npm audit might fail or return empty
      return [];
    }
  }

  private async findUnusedDependencies(): Promise<string[]> {
    // This would require static analysis of the codebase
    // For now, return empty array - could be implemented with tools like depcheck
    return [];
  }

  private async findMissingDependencies(): Promise<string[]> {
    // This would require analyzing import statements vs package.json
    // For now, return empty array
    return [];
  }

  private async checkPeerDependencies(): Promise<string[]> {
    return await this.validatePeerDependencies();
  }

  private async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
    try {
      const { stdout } = await execAsync(`npm view ${packageName} --json`);
      const info = JSON.parse(stdout);
      
      return {
        name: packageName,
        version: info.version,
        description: info.description,
        homepage: info.homepage,
        repository: info.repository?.url,
        dependencies: info.dependencies,
        devDependencies: info.devDependencies,
        peerDependencies: info.peerDependencies
      };
      
    } catch {
      return null;
    }
  }

  private async getLatestVersion(packageName: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`npm view ${packageName} version`);
      return stdout.trim();
    } catch {
      return 'latest';
    }
  }

  private shouldUpdate(currentVersion: string, latestVersion: string): boolean {
    // Simple version comparison - in production, use semver
    const current = currentVersion.replace(/[\^~]/, '');
    return current !== latestVersion;
  }

  private async isBreakingUpdate(
    packageName: string, 
    currentVersion: string, 
    newVersion: string
  ): Promise<boolean> {
    try {
      // Get major version numbers
      const currentMajor = parseInt(currentVersion.replace(/[\^~]/, '').split('.')[0]);
      const newMajor = parseInt(newVersion.replace(/[\^~]/, '').split('.')[0]);
      
      return newMajor > currentMajor;
      
    } catch {
      return false;
    }
  }

  private getUpdateStrategy(pkg: PackageInfo): 'skip' | 'patch' | 'minor' | 'major' {
    switch (this.config.updateStrategy) {
      case 'conservative':
        // Only patch updates
        return 'patch';
      case 'moderate':
        // Patch and minor updates
        return 'minor';
      case 'aggressive':
        // All updates including major
        return 'major';
      default:
        return 'minor';
    }
  }

  private getTargetVersion(pkg: PackageInfo, strategy: string): string {
    if (strategy === 'patch') {
      // Update to latest patch version
      const [major, minor] = pkg.currentVersion!.split('.');
      return `^${major}.${minor}.x`;
    } else if (strategy === 'minor') {
      // Update to latest minor version
      const [major] = pkg.currentVersion!.split('.');
      return `^${major}.x.x`;
    } else {
      // Update to latest version
      return `^${pkg.latestVersion}`;
    }
  }

  private async updatePackageVersion(
    packageName: string, 
    version: string
  ): Promise<DependencyUpdate | null> {
    try {
      const packageJson = await this.readPackageJson();
      const currentVersion = packageJson.dependencies?.[packageName] || 
                           packageJson.devDependencies?.[packageName];
      
      if (!currentVersion) return null;
      
      // Update the version
      if (packageJson.dependencies?.[packageName]) {
        packageJson.dependencies[packageName] = version;
      } else if (packageJson.devDependencies?.[packageName]) {
        packageJson.devDependencies[packageName] = version;
      }
      
      await this.writePackageJson(packageJson);
      
      return {
        package: packageName,
        from: currentVersion,
        to: version,
        type: packageJson.dependencies?.[packageName] ? 'dependency' : 'devDependency',
        breaking: await this.isBreakingUpdate(packageName, currentVersion, version),
        security: false,
        reason: 'Manual version update'
      };
      
    } catch {
      return null;
    }
  }

  private async checkPackageCompatibility(packageName: string): Promise<CompatibilityInfo> {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const packageInfo = await this.getPackageInfo(packageName);
      if (!packageInfo) {
        issues.push(`Package ${packageName} not found`);
        return { compatible: false, issues, warnings, recommendations };
      }
      
      // Check peer dependencies
      if (packageInfo.peerDependencies) {
        const packageJson = await this.readPackageJson();
        
        for (const [peer, version] of Object.entries(packageInfo.peerDependencies)) {
          const installedVersion = packageJson.dependencies?.[peer] || 
                                 packageJson.devDependencies?.[peer];
          
          if (!installedVersion) {
            if (this.config.peerDependencyHandling === 'strict') {
              issues.push(`Missing peer dependency: ${peer}@${version}`);
            } else {
              warnings.push(`Missing peer dependency: ${peer}@${version}`);
            }
          }
        }
      }
      
      // Check for known compatibility issues with mobile dependencies
      const mobileConflicts = this.getMobileCompatibilityIssues(packageName);
      if (mobileConflicts.length > 0) {
        warnings.push(...mobileConflicts);
      }
      
      return {
        compatible: issues.length === 0,
        issues,
        warnings,
        recommendations
      };
      
    } catch (error) {
      issues.push(`Failed to check compatibility: ${(error as Error).message}`);
      return { compatible: false, issues, warnings, recommendations };
    }
  }

  private getMobileCompatibilityIssues(packageName: string): string[] {
    const knownIssues: { [key: string]: string[] } = {
      'react-native': ['Not compatible with web-based mobile optimization'],
      'react-dom': ['May need mobile-specific rendering optimizations'],
      'webpack': ['Consider mobile-specific bundle configurations']
    };
    
    return knownIssues[packageName] || [];
  }

  private generateRecommendations(analysis: DependencyAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.outdatedDependencies > 5) {
      recommendations.push('Consider updating outdated dependencies for better security and performance');
    }
    
    if (analysis.vulnerabilities > 0) {
      recommendations.push('Address security vulnerabilities immediately');
    }
    
    if (analysis.unusedDependencies.length > 0) {
      recommendations.push('Remove unused dependencies to reduce bundle size');
    }
    
    if (analysis.peerDependencyIssues.length > 0) {
      recommendations.push('Resolve peer dependency issues for better stability');
    }
    
    // Mobile-specific recommendations
    recommendations.push('Consider adding mobile-specific performance monitoring dependencies');
    recommendations.push('Ensure all dependencies support mobile browsers');
    
    return recommendations;
  }
}