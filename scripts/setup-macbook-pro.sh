#!/bin/bash

# Clear Piggy Mastra Agents - MacBook Pro Setup Script
# Optimized for MacBook Pro M4 with balanced performance and battery life

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

# Function to detect MacBook Pro
detect_macbook_pro() {
    print_status "Detecting hardware configuration..."
    
    # Get system information
    local model=$(system_profiler SPHardwareDataType | grep "Model Name" | awk -F: '{print $2}' | xargs)
    local chip=$(system_profiler SPHardwareDataType | grep "Chip" | awk -F: '{print $2}' | xargs)
    local memory=$(system_profiler SPHardwareDataType | grep "Memory" | awk -F: '{print $2}' | xargs)
    local cores=$(sysctl -n hw.ncpu)
    
    echo "  Model: $model"
    echo "  Chip: $chip"
    echo "  Memory: $memory"
    echo "  CPU Cores: $cores"
    
    # MacBook Pro detection
    if [[ $model == *"MacBook Pro"* ]] || [[ $chip == *"M4"* ]] || [[ $chip == *"M3"* ]] || [[ $chip == *"M2"* ]]; then
        print_success "MacBook Pro detected! Applying development-optimized configuration."
        return 0
    else
        print_warning "MacBook Pro not detected. This script is optimized for MacBook Pro."
        print_warning "Detected: $model with $chip"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            return 0
        else
            print_error "Setup cancelled."
            exit 1
        fi
    fi
}

# Function to check battery status and power management
check_power_status() {
    print_status "Checking power status..."
    
    local power_source=$(pmset -g ps | head -1)
    local battery_level=$(pmset -g ps | grep -o '[0-9]*%' | head -1 | sed 's/%//')
    
    echo "  Power source: $power_source"
    echo "  Battery level: $battery_level%"
    
    if [[ $power_source == *"Battery Power"* ]] && [[ $battery_level -lt 20 ]]; then
        print_warning "Low battery detected. Performance will be optimized for power saving."
        export POWER_SAVING_MODE=true
    else
        export POWER_SAVING_MODE=false
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check for macOS version
    local macos_version=$(sw_vers -productVersion)
    local macos_major=$(echo $macos_version | cut -d. -f1)
    local macos_minor=$(echo $macos_version | cut -d. -f2)
    
    if [[ $macos_major -lt 13 ]] || ([[ $macos_major -eq 13 ]] && [[ $macos_minor -lt 0 ]]); then
        print_error "macOS 13.0 (Ventura) or later required. Current version: $macos_version"
        exit 1
    fi
    print_success "macOS version: $macos_version"
    
    # Check for Xcode Command Line Tools
    if ! xcode-select -p &> /dev/null; then
        print_status "Installing Xcode Command Line Tools..."
        xcode-select --install
        print_status "Please complete the Xcode Command Line Tools installation and re-run this script."
        exit 0
    fi
    print_success "Xcode Command Line Tools available"
    
    # Check for Homebrew
    if ! command -v brew &> /dev/null; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ $(uname -m) == "arm64" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    fi
    print_success "Homebrew available"
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        print_status "Installing Node.js..."
        brew install node@20
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local node_major=$(echo $node_version | cut -d. -f1)
    
    if [[ $node_major -lt 18 ]]; then
        print_warning "Node.js 18+ recommended. Current version: v$node_version"
        print_status "Installing Node.js 20..."
        brew install node@20
        brew unlink node
        brew link node@20
    fi
    print_success "Node.js version: $(node --version)"
    
    # Check for Git
    if ! command -v git &> /dev/null; then
        print_status "Installing Git..."
        brew install git
    fi
    print_success "Git available: $(git --version)"
}

# Function to optimize Node.js for MacBook Pro
optimize_nodejs() {
    print_status "Optimizing Node.js for MacBook Pro..."
    
    # Create or update .nvmrc
    echo "20" > .nvmrc
    
    # Create Node.js optimization script for MacBook Pro
    cat > scripts/node-optimize-mbp.sh << 'EOF'
#!/bin/bash
# Node.js optimization for MacBook Pro

# Check power status
POWER_SOURCE=$(pmset -g ps | head -1)
BATTERY_LEVEL=$(pmset -g ps | grep -o '[0-9]*%' | head -1 | sed 's/%//')

if [[ $POWER_SOURCE == *"Battery Power"* ]] && [[ ${BATTERY_LEVEL:-100} -lt 20 ]]; then
    echo "⚡ Low battery detected - enabling power saving mode"
    # Conservative settings for battery life
    export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128"
    export UV_THREADPOOL_SIZE=8
    export MAX_CONCURRENT_AGENTS=4
else
    # Performance settings when plugged in
    export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=256"
    export UV_THREADPOOL_SIZE=16
    export MAX_CONCURRENT_AGENTS=8
fi

# Enable V8 optimizations for Apple Silicon
export V8_FLAGS="--enable-maglev --turbo-fast-api-calls"

# Optimize garbage collection for development
export NODE_GC_FLAGS="--gc-interval=10000"

# Development environment
export NODE_ENV_PERFORMANCE=true
export ENABLE_SOURCE_MAPS=true

echo "Node.js optimized for MacBook Pro (Battery: ${BATTERY_LEVEL:-?}%)"
EOF
    
    chmod +x scripts/node-optimize-mbp.sh
    print_success "Node.js optimization script created"
}

# Function to install dependencies optimized for MacBook Pro
install_dependencies() {
    print_status "Installing dependencies with MacBook Pro optimizations..."
    
    # Source Node.js optimizations
    source scripts/node-optimize-mbp.sh
    
    # Install dependencies with conservative npm settings
    npm config set fetch-retries 3
    npm config set fetch-retry-mintimeout 30000
    npm config set fetch-retry-maxtimeout 60000
    npm config set maxsockets 10
    
    # Install with moderate parallel processing
    npm install --no-audit --no-fund --maxsockets=10
    
    print_success "Dependencies installed"
}

# Function to configure MacBook Pro specific settings
configure_macbook_pro() {
    print_status "Configuring MacBook Pro specific optimizations..."
    
    # Create MacBook Pro environment file
    cat > .env.macbook-pro << 'EOF'
# MacBook Pro Specific Configuration
HARDWARE_TYPE=macbook-pro
ARCHITECTURE=apple-silicon

# Performance Settings (Development Optimized)
MAX_CONCURRENT_AGENTS=8
MEMORY_PER_AGENT=4GB
MAX_OLD_SPACE_SIZE=8192
UV_THREADPOOL_SIZE=16

# MacBook Pro Optimizations
THERMAL_MANAGEMENT=true
BATTERY_OPTIMIZATION=true
THERMAL_THRESHOLD=80
BATTERY_THRESHOLD=20

# Development Settings
NODE_ENV=development
ENABLE_CLUSTERING=false
WORKERS=1
HOT_RELOAD=true
DEBUG_MODE=true

# Cache Settings
CACHE_STRATEGY=balanced
MEMORY_CACHE_SIZE=4GB
DISK_CACHE_SIZE=10GB

# Monitoring (Lightweight for development)
PERFORMANCE_MONITORING=true
TRACK_MEMORY=true
TRACK_CPU=true
TRACK_NETWORK=false
EOF
    
    # Copy to main environment if not exists
    if [ ! -f .env ]; then
        cp .env.macbook-pro .env
        print_success "Environment configuration created"
    else
        print_warning "Existing .env file found. MacBook Pro optimizations available in .env.macbook-pro"
    fi
    
    # Create MacBook Pro specific configuration
    cat > mastra.macbook-pro.config.ts << 'EOF'
import { getPowerAwareConfig } from './configs/macbook-pro.config';

export default {
  ...getPowerAwareConfig(),
  environment: 'macbook-pro',
  optimizations: {
    appleSiliconOptimized: true,
    batteryOptimized: true,
    thermalManaged: true,
    developmentMode: true
  }
};
EOF
    
    print_success "MacBook Pro configuration created"
}

# Function to setup development tools
setup_development_tools() {
    print_status "Setting up development tools..."
    
    # Install development dependencies if not present
    if command -v brew &> /dev/null; then
        # Install useful development tools
        print_status "Installing development utilities..."
        brew install --quiet git-lfs jq tree || true
    fi
    
    # Create VS Code settings for the project
    mkdir -p .vscode
    cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.cache": true,
    "**/agent-logs": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.cache": true
  },
  "mastra.enableInlineHints": true,
  "mastra.enableAutoAnalysis": true
}
EOF
    
    # Create launch configuration for debugging
    cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Mastra Agent",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/index.js",
      "preLaunchTask": "npm: build",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
EOF
    
    print_success "Development tools configured"
}

# Function to create MacBook Pro utilities
create_utilities() {
    print_status "Creating MacBook Pro utilities..."
    
    # Create battery-aware runner script
    cat > scripts/run-agents-mbp.sh << 'EOF'
#!/bin/bash
# Run Clear Piggy Mastra Agents with MacBook Pro optimizations

echo "💻 Starting Clear Piggy Mastra Agents (MacBook Pro)..."

# Source optimizations
source scripts/node-optimize-mbp.sh

# Check system resources and battery
BATTERY_LEVEL=$(pmset -g ps | grep -o '[0-9]*%' | head -1 | sed 's/%//')
POWER_SOURCE=$(pmset -g ps | head -1)

echo "System Status:"
echo "  Model: $(system_profiler SPHardwareDataType | grep "Model Name" | awk -F: '{print $2}' | xargs)"
echo "  Battery: ${BATTERY_LEVEL:-?}%"
echo "  Power: $POWER_SOURCE"
echo "  Concurrent Agents: $MAX_CONCURRENT_AGENTS"

# Run agents with optimal configuration
npm run agents:start || echo "Agents not configured yet"
EOF
    chmod +x scripts/run-agents-mbp.sh
    
    # Create thermal monitoring script
    cat > scripts/thermal-monitor.sh << 'EOF'
#!/bin/bash
# Thermal monitoring for MacBook Pro

echo "🌡️  MacBook Pro Thermal Monitor"
echo "=============================="

while true; do
    # Get CPU temperature if possible
    if command -v powermetrics &> /dev/null; then
        TEMP=$(sudo powermetrics -n 1 -i 1000 --samplers cpu_power | grep "CPU die temperature" | awk '{print $4}' | head -1)
        if [ ! -z "$TEMP" ]; then
            echo "$(date): CPU Temperature: ${TEMP}°C"
            
            # Alert if temperature is high
            TEMP_NUM=$(echo $TEMP | cut -d'.' -f1)
            if [ "$TEMP_NUM" -gt 80 ]; then
                echo "⚠️  HIGH TEMPERATURE DETECTED! Consider reducing workload."
            fi
        fi
    fi
    
    # Check CPU usage
    CPU_USAGE=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    echo "$(date): CPU Usage: ${CPU_USAGE}%"
    
    sleep 30
done
EOF
    chmod +x scripts/thermal-monitor.sh
    
    # Create development server script
    cat > scripts/dev-server.sh << 'EOF'
#!/bin/bash
# Development server with MacBook Pro optimizations

echo "🚀 Starting Development Server (MacBook Pro Optimized)..."

# Source optimizations
source scripts/node-optimize-mbp.sh

# Enable development features
export NODE_ENV=development
export ENABLE_HOT_RELOAD=true
export ENABLE_DEBUG_MODE=true

# Start development server
npm run dev || echo "Development server not configured"
EOF
    chmod +x scripts/dev-server.sh
    
    print_success "MacBook Pro utilities created"
}

# Function to run validation tests
run_validation() {
    print_status "Running MacBook Pro validation tests..."
    
    # Test Node.js configuration
    print_status "Testing Node.js optimization..."
    source scripts/node-optimize-mbp.sh
    node -e "
        console.log('Node.js version:', process.version);
        console.log('Max heap size:', Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024 / 1024), 'GB');
        console.log('UV thread pool size:', process.env.UV_THREADPOOL_SIZE);
        console.log('Max concurrent agents:', process.env.MAX_CONCURRENT_AGENTS);
    "
    
    # Test battery detection
    print_status "Testing battery detection..."
    BATTERY_LEVEL=$(pmset -g ps | grep -o '[0-9]*%' | head -1 | sed 's/%//')
    POWER_SOURCE=$(pmset -g ps | head -1)
    echo "Battery level: ${BATTERY_LEVEL:-Unknown}"
    echo "Power source: $POWER_SOURCE"
    
    # Test hardware detection
    print_status "Testing hardware detection..."
    node -e "
        const os = require('os');
        console.log('Platform:', os.platform());
        console.log('Architecture:', os.arch());
        console.log('CPU cores:', os.cpus().length);
        console.log('Total memory:', Math.round(os.totalmem() / 1024 / 1024 / 1024), 'GB');
    "
    
    print_success "Validation tests completed"
}

# Function to display setup summary
display_summary() {
    print_success "MacBook Pro setup completed successfully!"
    echo ""
    echo "💻 MacBook Pro Configuration Summary"
    echo "==================================="
    echo ""
    echo "Development Optimizations:"
    echo "  ✅ Node.js optimized for Apple Silicon"
    echo "  ✅ Battery-aware performance scaling"
    echo "  ✅ Thermal management enabled"
    echo "  ✅ Concurrent agents: 8 (4 on battery)"
    echo "  ✅ Memory per agent: 4GB"
    echo "  ✅ Hot reload and debug mode enabled"
    echo ""
    echo "Configuration Files Created:"
    echo "  ✅ .env.macbook-pro (MacBook Pro optimizations)"
    echo "  ✅ mastra.macbook-pro.config.ts (Agent configuration)"
    echo "  ✅ scripts/node-optimize-mbp.sh (Node.js optimizations)"
    echo "  ✅ .vscode/ (VS Code development settings)"
    echo ""
    echo "Development Tools:"
    echo "  • Run agents:             ./scripts/run-agents-mbp.sh"
    echo "  • Development server:     ./scripts/dev-server.sh"
    echo "  • Thermal monitoring:     ./scripts/thermal-monitor.sh"
    echo "  • Debug mode:            npm run dev"
    echo ""
    
    # Show current battery status
    BATTERY_LEVEL=$(pmset -g ps | grep -o '[0-9]*%' | head -1 | sed 's/%//')
    POWER_SOURCE=$(pmset -g ps | head -1)
    echo "Current Status:"
    echo "  🔋 Battery: ${BATTERY_LEVEL:-Unknown}"
    echo "  ⚡ Power: $POWER_SOURCE"
    
    echo ""
    echo "Next Steps:"
    echo "  1. Copy your API keys to .env file"
    echo "  2. Test agent connectivity: npm run test:connectivity"
    echo "  3. Start development: ./scripts/dev-server.sh"
    echo ""
    print_success "Ready for development on MacBook Pro! 💻"
}

# Main execution
main() {
    echo ""
    echo "💻 Clear Piggy Mastra Agents - MacBook Pro Setup"
    echo "=============================================="
    echo ""
    print_status "Setting up Clear Piggy Mastra Agents for MacBook Pro..."
    echo ""
    
    detect_macbook_pro
    echo ""
    
    check_power_status
    echo ""
    
    check_prerequisites
    echo ""
    
    optimize_nodejs
    echo ""
    
    install_dependencies
    echo ""
    
    configure_macbook_pro
    echo ""
    
    setup_development_tools
    echo ""
    
    create_utilities
    echo ""
    
    run_validation
    echo ""
    
    display_summary
}

# Run main function
main "$@"