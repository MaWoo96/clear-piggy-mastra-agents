import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import {
  GitOperationConfig,
  GitRepositoryInfo,
  BranchingStrategy,
  CommitStrategy
} from '../types/integration-agent-types';

const execAsync = promisify(exec);

export class GitOperations extends EventEmitter {
  private config: GitOperationConfig;
  private repositoryPath: string;

  constructor(repositoryPath: string, config?: Partial<GitOperationConfig>) {
    super();
    this.repositoryPath = repositoryPath;
    this.config = {
      repository: {
        url: '',
        defaultBranch: 'main',
        currentBranch: '',
        isClean: false,
        hasUncommittedChanges: false,
        remotes: {}
      },
      branching: {
        featureBranchNaming: 'feature/mobile-optimization-{timestamp}',
        baseBranch: 'main',
        deleteFeatureBranchAfterMerge: true,
        pushToRemote: true,
        trackUpstream: true
      },
      commits: {
        messageTemplate: 'feat(mobile): {description}\n\n{details}',
        includeTicketNumber: false,
        includeChangeScope: true,
        conventionalCommits: true,
        signCommits: false
      },
      mergeStrategy: 'squash',
      protectedBranches: ['main', 'master', 'develop'],
      requiresPullRequest: true,
      reviewRequirements: {
        minReviewers: 1,
        requireCodeOwnerReview: true,
        requireStatusChecks: true
      },
      ...config
    };
  }

  async initialize(): Promise<GitRepositoryInfo> {
    try {
      // Check if we're in a git repository
      await this.execGit('status');
      
      // Get repository information
      const repoInfo = await this.getRepositoryInfo();
      this.config.repository = repoInfo;
      
      this.emit('git:initialized', repoInfo);
      return repoInfo;
      
    } catch (error) {
      throw new Error(`Failed to initialize git operations: ${(error as Error).message}`);
    }
  }

  async createFeatureBranch(description?: string): Promise<string> {
    const branchName = this.generateBranchName(description);
    
    try {
      // Ensure we're on the base branch and it's up to date
      await this.switchToBranch(this.config.branching.baseBranch);
      await this.pullLatest();
      
      // Check if branch already exists
      const branchExists = await this.branchExists(branchName);
      if (branchExists) {
        throw new Error(`Branch ${branchName} already exists`);
      }
      
      // Create and checkout new branch
      await this.execGit(`checkout -b ${branchName}`);
      
      // Push to remote and set upstream if configured
      if (this.config.branching.pushToRemote) {
        await this.pushBranch(branchName, this.config.branching.trackUpstream);
      }
      
      this.emit('branch:created', { branch: branchName });
      return branchName;
      
    } catch (error) {
      throw new Error(`Failed to create feature branch: ${(error as Error).message}`);
    }
  }

  async switchToBranch(branchName: string): Promise<void> {
    try {
      await this.execGit(`checkout ${branchName}`);
      this.emit('branch:switched', { branch: branchName });
    } catch (error) {
      throw new Error(`Failed to switch to branch ${branchName}: ${(error as Error).message}`);
    }
  }

  async commitChanges(
    description: string,
    details?: string,
    files?: string[]
  ): Promise<string> {
    try {
      // Stage files
      if (files && files.length > 0) {
        for (const file of files) {
          await this.execGit(`add "${file}"`);
        }
      } else {
        await this.execGit('add -A');
      }
      
      // Check if there are changes to commit
      const hasChanges = await this.hasUncommittedChanges();
      if (!hasChanges) {
        throw new Error('No changes to commit');
      }
      
      // Generate commit message
      const commitMessage = this.generateCommitMessage(description, details);
      
      // Create commit
      const commitArgs = [
        'commit',
        '-m', `"${commitMessage}"`
      ];
      
      if (this.config.commits.signCommits) {
        commitArgs.push('--gpg-sign');
      }
      
      await this.execGit(commitArgs.join(' '));
      
      // Get commit hash
      const commitHash = await this.getLatestCommitHash();
      
      this.emit('commit:created', { hash: commitHash, message: commitMessage });
      return commitHash;
      
    } catch (error) {
      throw new Error(`Failed to commit changes: ${(error as Error).message}`);
    }
  }

  async pushBranch(branchName: string, setUpstream: boolean = false): Promise<void> {
    try {
      const pushArgs = ['push'];
      
      if (setUpstream) {
        pushArgs.push('--set-upstream', 'origin', branchName);
      } else {
        pushArgs.push('origin', branchName);
      }
      
      await this.execGit(pushArgs.join(' '));
      this.emit('branch:pushed', { branch: branchName });
      
    } catch (error) {
      throw new Error(`Failed to push branch ${branchName}: ${(error as Error).message}`);
    }
  }

  async createPullRequest(
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    options: {
      draft?: boolean;
      assignees?: string[];
      reviewers?: string[];
      labels?: string[];
    } = {}
  ): Promise<string> {
    try {
      // Check if GitHub CLI is available
      await execAsync('gh --version');
      
      const prArgs = [
        'pr', 'create',
        '--base', targetBranch,
        '--head', sourceBranch,
        '--title', `"${title}"`,
        '--body', `"${description}"`
      ];
      
      if (options.draft) {
        prArgs.push('--draft');
      }
      
      if (options.assignees && options.assignees.length > 0) {
        prArgs.push('--assignee', options.assignees.join(','));
      }
      
      if (options.reviewers && options.reviewers.length > 0) {
        prArgs.push('--reviewer', options.reviewers.join(','));
      }
      
      if (options.labels && options.labels.length > 0) {
        prArgs.push('--label', options.labels.join(','));
      }
      
      const { stdout } = await execAsync(prArgs.join(' '), { cwd: this.repositoryPath });
      const prUrl = stdout.trim();
      
      this.emit('pr:created', { url: prUrl, source: sourceBranch, target: targetBranch });
      return prUrl;
      
    } catch (error) {
      throw new Error(`Failed to create pull request: ${(error as Error).message}`);
    }
  }

  async mergeBranch(
    sourceBranch: string,
    targetBranch: string,
    strategy: 'merge' | 'squash' | 'rebase' = 'squash'
  ): Promise<void> {
    try {
      // Switch to target branch
      await this.switchToBranch(targetBranch);
      
      // Pull latest changes
      await this.pullLatest();
      
      // Merge based on strategy
      switch (strategy) {
        case 'merge':
          await this.execGit(`merge ${sourceBranch}`);
          break;
        case 'squash':
          await this.execGit(`merge --squash ${sourceBranch}`);
          // Need to commit after squash merge
          const commitMessage = await this.getSquashCommitMessage(sourceBranch);
          await this.execGit(`commit -m "${commitMessage}"`);
          break;
        case 'rebase':
          await this.execGit(`rebase ${sourceBranch}`);
          break;
      }
      
      // Push merged changes
      await this.execGit(`push origin ${targetBranch}`);
      
      // Delete feature branch if configured
      if (this.config.branching.deleteFeatureBranchAfterMerge) {
        await this.deleteBranch(sourceBranch, true);
      }
      
      this.emit('branch:merged', { source: sourceBranch, target: targetBranch, strategy });
      
    } catch (error) {
      throw new Error(`Failed to merge branch: ${(error as Error).message}`);
    }
  }

  async deleteBranch(branchName: string, force: boolean = false): Promise<void> {
    try {
      // Delete local branch
      const deleteFlag = force ? '-D' : '-d';
      await this.execGit(`branch ${deleteFlag} ${branchName}`);
      
      // Delete remote branch if it exists
      try {
        await this.execGit(`push origin --delete ${branchName}`);
      } catch {
        // Remote branch might not exist or already deleted
      }
      
      this.emit('branch:deleted', { branch: branchName });
      
    } catch (error) {
      throw new Error(`Failed to delete branch ${branchName}: ${(error as Error).message}`);
    }
  }

  async stashChanges(message?: string): Promise<string> {
    try {
      const stashMessage = message || `Mobile integration stash ${new Date().toISOString()}`;
      const { stdout } = await this.execGit(`stash push -m "${stashMessage}"`);
      
      // Extract stash ID from output
      const stashMatch = stdout.match(/stash@{(\d+)}/);
      const stashId = stashMatch ? stashMatch[0] : 'stash@{0}';
      
      this.emit('stash:created', { id: stashId, message: stashMessage });
      return stashId;
      
    } catch (error) {
      throw new Error(`Failed to stash changes: ${(error as Error).message}`);
    }
  }

  async popStash(stashId?: string): Promise<void> {
    try {
      const popArgs = ['stash', 'pop'];
      if (stashId) {
        popArgs.push(stashId);
      }
      
      await this.execGit(popArgs.join(' '));
      this.emit('stash:popped', { id: stashId });
      
    } catch (error) {
      throw new Error(`Failed to pop stash: ${(error as Error).message}`);
    }
  }

  async resetToCommit(commitHash: string, type: 'soft' | 'mixed' | 'hard' = 'mixed'): Promise<void> {
    try {
      await this.execGit(`reset --${type} ${commitHash}`);
      this.emit('reset:completed', { commit: commitHash, type });
      
    } catch (error) {
      throw new Error(`Failed to reset to commit: ${(error as Error).message}`);
    }
  }

  async getCommitHistory(maxCount: number = 10): Promise<Array<{
    hash: string;
    author: string;
    date: Date;
    message: string;
  }>> {
    try {
      const { stdout } = await this.execGit(
        `log --pretty=format:"%H|%an|%ad|%s" --date=iso -n ${maxCount}`
      );
      
      return stdout.split('\n').map(line => {
        const [hash, author, date, message] = line.split('|');
        return {
          hash,
          author,
          date: new Date(date),
          message
        };
      });
      
    } catch (error) {
      throw new Error(`Failed to get commit history: ${(error as Error).message}`);
    }
  }

  async getDiff(
    from?: string,
    to?: string,
    options: {
      nameOnly?: boolean;
      staged?: boolean;
      unified?: number;
    } = {}
  ): Promise<string> {
    try {
      const diffArgs = ['diff'];
      
      if (options.staged) {
        diffArgs.push('--staged');
      }
      
      if (options.nameOnly) {
        diffArgs.push('--name-only');
      }
      
      if (options.unified) {
        diffArgs.push(`--unified=${options.unified}`);
      }
      
      if (from) {
        diffArgs.push(from);
        if (to) {
          diffArgs.push(to);
        }
      }
      
      const { stdout } = await this.execGit(diffArgs.join(' '));
      return stdout;
      
    } catch (error) {
      throw new Error(`Failed to get diff: ${(error as Error).message}`);
    }
  }

  async getModifiedFiles(): Promise<string[]> {
    try {
      const { stdout } = await this.execGit('diff --name-only HEAD');
      return stdout.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      return [];
    }
  }

  async getStagedFiles(): Promise<string[]> {
    try {
      const { stdout } = await this.execGit('diff --name-only --staged');
      return stdout.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      return [];
    }
  }

  async getUntrackedFiles(): Promise<string[]> {
    try {
      const { stdout } = await this.execGit('ls-files --others --exclude-standard');
      return stdout.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      return [];
    }
  }

  async validateRepository(): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Check if in git repository
      await this.execGit('status');
    } catch {
      issues.push('Not in a git repository');
    }
    
    // Check for uncommitted changes
    if (await this.hasUncommittedChanges()) {
      warnings.push('Repository has uncommitted changes');
    }
    
    // Check for untracked files
    const untrackedFiles = await this.getUntrackedFiles();
    if (untrackedFiles.length > 0) {
      warnings.push(`Repository has ${untrackedFiles.length} untracked files`);
    }
    
    // Check if on protected branch
    const currentBranch = await this.getCurrentBranch();
    if (this.config.protectedBranches.includes(currentBranch)) {
      warnings.push(`Currently on protected branch: ${currentBranch}`);
    }
    
    // Check if remote is configured
    try {
      await this.execGit('remote get-url origin');
    } catch {
      warnings.push('No remote origin configured');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  // Private helper methods
  private async execGit(command: string): Promise<{ stdout: string; stderr: string }> {
    return await execAsync(`git ${command}`, { cwd: this.repositoryPath });
  }

  private async getRepositoryInfo(): Promise<GitRepositoryInfo> {
    try {
      const [currentBranch, remoteUrl, isClean] = await Promise.all([
        this.getCurrentBranch(),
        this.getRemoteUrl(),
        this.isRepositoryClean()
      ]);
      
      const hasUncommittedChanges = await this.hasUncommittedChanges();
      const remotes = await this.getRemotes();
      
      return {
        url: remoteUrl,
        defaultBranch: await this.getDefaultBranch(),
        currentBranch,
        isClean,
        hasUncommittedChanges,
        remotes
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${(error as Error).message}`);
    }
  }

  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await this.execGit('branch --show-current');
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${(error as Error).message}`);
    }
  }

  private async getRemoteUrl(): Promise<string> {
    try {
      const { stdout } = await this.execGit('remote get-url origin');
      return stdout.trim();
    } catch {
      return '';
    }
  }

  private async getDefaultBranch(): Promise<string> {
    try {
      const { stdout } = await this.execGit('symbolic-ref refs/remotes/origin/HEAD');
      return stdout.replace('refs/remotes/origin/', '').trim();
    } catch {
      // Fallback to common default branches
      const branches = ['main', 'master', 'develop'];
      for (const branch of branches) {
        try {
          await this.execGit(`show-ref --verify refs/remotes/origin/${branch}`);
          return branch;
        } catch {
          continue;
        }
      }
      return 'main';
    }
  }

  private async isRepositoryClean(): Promise<boolean> {
    try {
      const { stdout } = await this.execGit('status --porcelain');
      return stdout.trim().length === 0;
    } catch {
      return false;
    }
  }

  private async hasUncommittedChanges(): Promise<boolean> {
    return !(await this.isRepositoryClean());
  }

  private async getRemotes(): Promise<{ [name: string]: string }> {
    try {
      const { stdout } = await this.execGit('remote -v');
      const remotes: { [name: string]: string } = {};
      
      stdout.split('\n').forEach(line => {
        const match = line.match(/^(\w+)\s+(.+?)\s+\(fetch\)$/);
        if (match) {
          remotes[match[1]] = match[2];
        }
      });
      
      return remotes;
    } catch {
      return {};
    }
  }

  private async branchExists(branchName: string): Promise<boolean> {
    try {
      await this.execGit(`show-ref --verify refs/heads/${branchName}`);
      return true;
    } catch {
      return false;
    }
  }

  private async pullLatest(): Promise<void> {
    try {
      await this.execGit('pull');
    } catch (error) {
      // Might not have upstream or changes to pull
    }
  }

  private async getLatestCommitHash(): Promise<string> {
    try {
      const { stdout } = await this.execGit('rev-parse HEAD');
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get latest commit hash: ${(error as Error).message}`);
    }
  }

  private async getSquashCommitMessage(sourceBranch: string): Promise<string> {
    try {
      // Get commits from source branch that are not in current branch
      const { stdout } = await this.execGit(
        `log --pretty=format:"%s" ${this.config.branching.baseBranch}..${sourceBranch}`
      );
      
      const commits = stdout.split('\n').filter(line => line.trim());
      
      if (commits.length === 1) {
        return commits[0];
      }
      
      return `Squash merge from ${sourceBranch}\n\nCommits:\n${commits.map(c => `- ${c}`).join('\n')}`;
    } catch {
      return `Squash merge from ${sourceBranch}`;
    }
  }

  private generateBranchName(description?: string): string {
    const template = this.config.branching.featureBranchNaming;
    const timestamp = Date.now();
    
    return template
      .replace('{timestamp}', timestamp.toString())
      .replace('{description}', description ? `-${description.toLowerCase().replace(/\s+/g, '-')}` : '');
  }

  private generateCommitMessage(description: string, details?: string): string {
    const template = this.config.commits.messageTemplate;
    
    let message = template.replace('{description}', description);
    
    if (details) {
      message = message.replace('{details}', details);
    } else {
      // Remove the details placeholder if no details provided
      message = message.replace('\n\n{details}', '');
    }
    
    return message;
  }
}