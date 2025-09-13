#!/bin/bash

# Clear Piggy Mastra Agents - GitHub Repository Setup Script
# Creates and configures GitHub repository for cross-platform deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Repository configuration
REPO_NAME="clear-piggy-mastra-agents"
REPO_DESCRIPTION="Mastra AI agents for Clear Piggy mobile optimization"
REPO_TOPICS="mastra-ai,react,typescript,mobile-optimization,financial-saas,clear-piggy,ai-agents"

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking GitHub setup prerequisites..."
    
    # Check for Git
    if ! command -v git &> /dev/null; then
        print_error "Git is required but not installed. Please install Git first."
        exit 1
    fi
    print_success "Git available: $(git --version)"
    
    # Check for GitHub CLI
    if ! command -v gh &> /dev/null; then
        print_status "Installing GitHub CLI..."
        if command -v brew &> /dev/null; then
            brew install gh
        else
            print_error "GitHub CLI (gh) is required. Please install it manually:"
            print_error "https://cli.github.com/manual/installation"
            exit 1
        fi
    fi
    print_success "GitHub CLI available: $(gh --version | head -1)"
    
    # Check GitHub authentication
    if ! gh auth status &> /dev/null; then
        print_status "GitHub authentication required..."
        gh auth login
    fi
    print_success "GitHub authentication verified"
}

# Function to initialize Git repository
initialize_git_repo() {
    print_status "Initializing Git repository..."
    
    # Initialize git if not already initialized
    if [ ! -d ".git" ]; then
        git init
        print_success "Git repository initialized"
    else
        print_warning "Git repository already exists"
    fi
    
    # Configure git settings
    print_status "Configuring Git settings..."
    
    # Set up gitignore if not exists
    if [ ! -f ".gitignore" ]; then
        print_status "Creating comprehensive .gitignore..."
        # .gitignore is already created in previous steps
    fi
    
    # Create .gitattributes for proper line endings and LFS
    cat > .gitattributes << 'EOF'
# Handle line endings automatically for files detected as text
* text=auto

# Force LF line ending for shell scripts
*.sh text eol=lf

# Force LF line ending for config files
*.json text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.md text eol=lf

# Denote all files that are truly binary and should not be modified
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.mov binary
*.mp4 binary
*.mp3 binary
*.flv binary
*.fla binary
*.swf binary
*.gz binary
*.zip binary
*.7z binary
*.ttf binary
*.eot binary
*.woff binary
*.woff2 binary

# Large files that should use Git LFS
*.zip filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text
*.tgz filter=lfs diff=lfs merge=lfs -text
EOF
    
    print_success "Git configuration completed"
}

# Function to organize files for GitHub
organize_files() {
    print_status "Organizing files for GitHub repository..."
    
    # Ensure all directories exist
    mkdir -p docs workflows tools configs scripts
    
    # Create issue templates
    mkdir -p .github/ISSUE_TEMPLATE
    
    # Bug report template
    cat > .github/ISSUE_TEMPLATE/bug_report.yml << 'EOF'
name: Bug Report
description: File a bug report to help us improve
title: "[BUG] "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!
  - type: input
    id: agent
    attributes:
      label: Affected Agent
      description: Which Mastra agent is experiencing the issue?
      placeholder: mobile-ui-analyzer, performance-optimizer, etc.
    validations:
      required: true
  - type: dropdown
    id: platform
    attributes:
      label: Platform
      description: What platform are you running on?
      options:
        - MacBook Pro M4
        - Mac Studio
        - Other Mac
        - Other (please specify)
    validations:
      required: true
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: A clear and concise description of what the bug is.
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      description: What did you expect to happen?
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Run agent with command '...'
        2. Analyze component '...'
        3. See error
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Relevant logs
      description: Please copy and paste any relevant log output
      render: shell
  - type: checkboxes
    id: terms
    attributes:
      label: Code of Conduct
      description: By submitting this issue, you agree to follow our Code of Conduct
      options:
        - label: I agree to follow this project's Code of Conduct
          required: true
EOF
    
    # Feature request template
    cat > .github/ISSUE_TEMPLATE/feature_request.yml << 'EOF'
name: Feature Request
description: Suggest an idea for Clear Piggy Mastra Agents
title: "[FEATURE] "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        We love feature requests! Please help us understand what you'd like to see.
  - type: dropdown
    id: agent
    attributes:
      label: Target Agent
      description: Which agent should this feature be added to?
      options:
        - Mobile UI Analyzer
        - Responsive Generator
        - Performance Optimizer
        - Mobile Tester
        - Workflow Orchestrator
        - Deployment Manager
        - Analytics Monitor
        - Integration Agent
        - New Agent
        - Core Framework
    validations:
      required: true
  - type: textarea
    id: problem
    attributes:
      label: Is your feature request related to a problem?
      description: A clear and concise description of what the problem is.
      placeholder: I'm always frustrated when...
  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear and concise description of what you want to happen.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternative solutions
      description: Any alternative solutions or features you've considered.
  - type: textarea
    id: context
    attributes:
      label: Additional context
      description: Add any other context about the feature request here.
EOF
    
    # Pull request template
    cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of the changes in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Affected Agents
- [ ] Mobile UI Analyzer
- [ ] Responsive Generator  
- [ ] Performance Optimizer
- [ ] Mobile Tester
- [ ] Workflow Orchestrator
- [ ] Deployment Manager
- [ ] Analytics Monitor
- [ ] Integration Agent

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Platform Testing
- [ ] Tested on MacBook Pro M4
- [ ] Tested on Mac Studio
- [ ] Cross-platform compatibility verified

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is properly commented
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Performance impact considered

## Screenshots/Demos
If applicable, add screenshots or demo videos.

## Related Issues
Closes #(issue number)
EOF
    
    # Create contributing guidelines
    cat > CONTRIBUTING.md << 'EOF'
# Contributing to Clear Piggy Mastra Agents

We love your input! We want to make contributing to Clear Piggy Mastra Agents as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Branch Naming

- `feature/description` - for new features
- `fix/description` - for bug fixes  
- `docs/description` - for documentation updates
- `refactor/description` - for code refactoring

### Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat(agent): add new analysis capability`
- `fix(mobile-ui): resolve touch target detection`
- `docs(readme): update installation instructions`
- `perf(optimizer): improve analysis speed`

## Development Setup

### MacBook Pro M4
```bash
git clone https://github.com/[username]/clear-piggy-mastra-agents.git
cd clear-piggy-mastra-agents
chmod +x scripts/setup-macbook-pro.sh
./scripts/setup-macbook-pro.sh
```

### Mac Studio
```bash
git clone https://github.com/[username]/clear-piggy-mastra-agents.git
cd clear-piggy-mastra-agents
chmod +x scripts/setup-mac-studio.sh
./scripts/setup-mac-studio.sh
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific agent tests
npm run test:mobile-ui-analyzer
npm run test:performance-optimizer

# Run integration tests
npm run test:integration
```

### Adding Tests
- Add unit tests for new agent functionality
- Include integration tests for workflows
- Test cross-platform compatibility
- Verify performance benchmarks

## Code Style

### TypeScript Guidelines
- Use strict TypeScript configuration
- Add comprehensive type definitions
- Document public APIs with JSDoc
- Use descriptive variable and function names

### File Organization
```
agents/
├── [agent-name]/
│   ├── index.ts          # Main agent implementation
│   ├── config.ts         # Agent configuration
│   ├── tools.ts          # Agent-specific tools
│   ├── types.ts          # TypeScript interfaces
│   ├── tests/            # Agent tests
│   └── README.md         # Agent documentation
```

## Agent Development

### Creating New Agents
1. Create agent directory structure
2. Implement core agent interface
3. Add comprehensive configuration
4. Create agent-specific tools
5. Write comprehensive tests
6. Document usage and API

### Agent Standards
- Follow Mastra agent patterns
- Include error handling
- Add performance monitoring
- Support cross-platform deployment
- Include comprehensive logging

## Performance Guidelines

### MacBook Pro Optimizations
- Respect battery life considerations
- Implement thermal management
- Use conservative memory limits
- Enable development-friendly features

### Mac Studio Optimizations  
- Leverage high-performance capabilities
- Use parallel processing
- Maximize memory utilization
- Enable production optimizations

## Documentation

### README Updates
- Keep installation instructions current
- Update feature lists
- Include usage examples
- Document configuration options

### API Documentation
- Document all public methods
- Include parameter descriptions
- Provide usage examples  
- Note platform-specific behavior

## Reporting Issues

### Bug Reports
Use the bug report template and include:
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Platform information
- Relevant logs

### Feature Requests
Use the feature request template and include:
- Clear problem description
- Proposed solution
- Alternative solutions considered
- Use case examples

## Code of Conduct

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to reach out if you have questions about contributing!
EOF
    
    # Create code of conduct
    cat > CODE_OF_CONDUCT.md << 'EOF'
# Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- The use of sexualized language or imagery, and sexual attention or advances of any kind
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without their explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of acceptable behavior and will take appropriate and fair corrective action in response to any behavior that they deem inappropriate, threatening, offensive, or harmful.

## Scope

This Code of Conduct applies within all community spaces, and also applies when an individual is officially representing the community in public spaces.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement. All complaints will be reviewed and investigated promptly and fairly.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.0.
EOF
    
    print_success "GitHub repository files organized"
}

# Function to stage and commit files
stage_and_commit() {
    print_status "Staging files for initial commit..."
    
    # Add all files to git
    git add .
    
    # Check if there are any changes to commit
    if git diff --staged --quiet; then
        print_warning "No changes to commit"
        return 0
    fi
    
    # Create initial commit with comprehensive message
    cat > commit_message.tmp << 'EOF'
feat: initial Clear Piggy Mastra Agents repository

🤖 Complete Mastra AI agent system for Clear Piggy mobile optimization

## Features
- 8 specialized agents for mobile optimization
- Cross-platform support (MacBook Pro M4 & Mac Studio)
- Comprehensive mobile UI analysis
- Performance optimization workflows  
- Production deployment automation
- Real-time monitoring and analytics

## Agents Included
- Mobile UI Analyzer: React component mobile optimization analysis
- Responsive Generator: Automated responsive component generation
- Performance Optimizer: Mobile performance analysis and optimization
- Mobile Tester: Cross-device mobile testing automation
- Workflow Orchestrator: Multi-agent workflow coordination
- Deployment Manager: Production deployment with rollback capabilities
- Analytics Monitor: Real User Monitoring and performance tracking
- Integration Agent: Service integration management (Supabase, Plaid, etc.)

## Platform Optimizations
- **MacBook Pro M4**: Development-optimized with battery management
- **Mac Studio**: Production-optimized with high-performance configuration
- Automatic hardware detection and configuration
- Thermal management and power optimization

## Tech Stack
- TypeScript + Node.js 20+
- Mastra AI framework
- React 18+ component analysis
- Tailwind CSS optimization
- Supabase & Plaid integration
- GitHub Actions CI/CD

## Quick Start
```bash
# MacBook Pro
./scripts/setup-macbook-pro.sh

# Mac Studio  
./scripts/setup-mac-studio.sh
```

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
    
    git commit -F commit_message.tmp
    rm commit_message.tmp
    
    print_success "Initial commit created"
}

# Function to create GitHub repository
create_github_repo() {
    print_status "Creating GitHub repository..."
    
    # Check if repository already exists
    if gh repo view $REPO_NAME &> /dev/null; then
        print_warning "Repository '$REPO_NAME' already exists on GitHub"
        read -p "Do you want to add this as a remote? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote add origin https://github.com/$(gh api user --jq .login)/$REPO_NAME.git 2>/dev/null || true
            return 0
        else
            print_error "Repository setup cancelled"
            exit 1
        fi
    fi
    
    # Create the repository
    gh repo create $REPO_NAME \
        --public \
        --description "$REPO_DESCRIPTION" \
        --add-readme=false \
        --clone=false
    
    if [ $? -eq 0 ]; then
        print_success "GitHub repository '$REPO_NAME' created successfully"
        
        # Add remote origin
        git remote add origin https://github.com/$(gh api user --jq .login)/$REPO_NAME.git
        
        # Configure repository settings
        print_status "Configuring repository settings..."
        
        # Add topics
        gh repo edit $REPO_NAME --add-topic "$REPO_TOPICS"
        
        # Enable issues, wiki, and discussions
        gh repo edit $REPO_NAME --enable-issues --enable-wiki
        
        print_success "Repository configured with topics and features"
    else
        print_error "Failed to create GitHub repository"
        exit 1
    fi
}

# Function to push to GitHub
push_to_github() {
    print_status "Pushing to GitHub..."
    
    # Set the default branch to main
    git branch -M main
    
    # Push to GitHub
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        print_success "Successfully pushed to GitHub!"
        
        # Get repository URL
        REPO_URL=$(gh repo view --json url --jq .url)
        print_success "Repository available at: $REPO_URL"
        
        return 0
    else
        print_error "Failed to push to GitHub"
        exit 1
    fi
}

# Function to setup repository secrets (if needed)
setup_repository_secrets() {
    print_status "Setting up repository secrets..."
    
    print_status "Repository secrets should be configured for:"
    echo "  • ANTHROPIC_API_KEY - For Mastra AI agents"
    echo "  • SUPABASE_URL - For database integration"
    echo "  • SUPABASE_ANON_KEY - For Supabase authentication"
    echo "  • PLAID_CLIENT_ID - For Plaid API integration"
    echo "  • PLAID_SECRET - For Plaid API authentication"
    echo "  • SENTRY_DSN - For error monitoring"
    echo "  • DATADOG_API_KEY - For performance monitoring"
    
    print_warning "Note: Set these secrets manually in GitHub repository settings"
    print_status "Go to: Settings > Secrets and variables > Actions"
}

# Function to display completion summary
display_summary() {
    print_success "GitHub repository setup completed successfully! 🎉"
    echo ""
    echo "📁 Repository Summary"
    echo "===================="
    echo ""
    
    # Get repository information
    REPO_URL=$(gh repo view --json url --jq .url 2>/dev/null || echo "https://github.com/[username]/$REPO_NAME")
    USERNAME=$(gh api user --jq .login 2>/dev/null || echo "[username]")
    
    echo "Repository Details:"
    echo "  📍 Name: $REPO_NAME"
    echo "  🌐 URL: $REPO_URL"
    echo "  👤 Owner: $USERNAME"
    echo "  📊 Topics: $REPO_TOPICS"
    echo ""
    echo "Repository Features:"
    echo "  ✅ Public repository created"
    echo "  ✅ Comprehensive README.md"
    echo "  ✅ Issue and PR templates"
    echo "  ✅ Contributing guidelines"
    echo "  ✅ Code of conduct"
    echo "  ✅ GitHub Actions CI/CD"
    echo "  ✅ Cross-platform setup scripts"
    echo ""
    echo "Next Steps:"
    echo "  1. 🔧 Configure repository secrets (API keys)"
    echo "  2. 🧪 Test CI/CD pipeline with first commit"
    echo "  3. 💻 Clone on Mac Studio:"
    echo "     git clone $REPO_URL"
    echo "     cd $REPO_NAME"
    echo "     chmod +x scripts/setup-mac-studio.sh"
    echo "     ./scripts/setup-mac-studio.sh"
    echo ""
    echo "Development Workflow:"
    echo "  • 💻 MacBook Pro: Development and testing"
    echo "  • 🖥️  Mac Studio: High-performance agent execution"
    echo "  • 🔄 GitHub: Central repository and CI/CD"
    echo ""
    print_success "Ready for cross-platform Clear Piggy optimization! 🚀"
}

# Main execution
main() {
    echo ""
    echo "🚀 Clear Piggy Mastra Agents - GitHub Setup"
    echo "=========================================="
    echo ""
    print_status "Setting up GitHub repository for cross-platform deployment..."
    echo ""
    
    check_prerequisites
    echo ""
    
    initialize_git_repo
    echo ""
    
    organize_files
    echo ""
    
    stage_and_commit
    echo ""
    
    create_github_repo
    echo ""
    
    push_to_github
    echo ""
    
    setup_repository_secrets
    echo ""
    
    display_summary
}

# Run main function
main "$@"