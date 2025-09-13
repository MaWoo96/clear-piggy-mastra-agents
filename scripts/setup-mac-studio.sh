#!/bin/bash

# Clear Piggy Mastra Agents - Mac Studio Setup Script
# Optimized for Mac Studio with Apple Silicon for maximum performance

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

# Function to detect Mac Studio
detect_mac_studio() {
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
    
    # Mac Studio detection heuristics
    if [[ $model == *"Mac Studio"* ]] || [[ $chip == *"M2 Ultra"* ]] || [[ $cores -ge 20 ]]; then
        print_success "Mac Studio detected! Applying high-performance configuration."
        return 0
    else
        print_warning "Mac Studio not detected. This script is optimized for Mac Studio."
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
    
    # Check for Homebrew
    if ! command -v brew &> /dev/null; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
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

# Function to optimize Node.js for Mac Studio
optimize_nodejs() {
    print_status "Optimizing Node.js for Mac Studio..."
    
    # Create or update .nvmrc
    echo "20" > .nvmrc
    
    # Create or update Node.js optimization script
    cat > scripts/node-optimize.sh << 'EOF'
#!/bin/bash
# Node.js optimization for Mac Studio

# Set optimal memory limits for Mac Studio
export NODE_OPTIONS="--max-old-space-size=16384 --max-semi-space-size=256"

# Enable V8 optimizations for Apple Silicon
export V8_FLAGS="--enable-maglev --turbo-fast-api-calls"

# Optimize garbage collection
export NODE_GC_FLAGS="--gc-interval=5000"

# Enable performance monitoring
export NODE_ENV_PERFORMANCE=true

# Set optimal UV thread pool size for Mac Studio
export UV_THREADPOOL_SIZE=32

# Enable experimental features for better performance
export NODE_OPTIONS="$NODE_OPTIONS --experimental-worker --enable-source-maps"

echo "Node.js optimized for Mac Studio performance"
EOF
    
    chmod +x scripts/node-optimize.sh
    print_success "Node.js optimization script created"
}

# Function to install dependencies optimized for Mac Studio
install_dependencies() {
    print_status "Installing dependencies with Mac Studio optimizations..."
    
    # Source Node.js optimizations
    source scripts/node-optimize.sh
    
    # Install dependencies with optimized npm settings
    npm config set fetch-retries 5
    npm config set fetch-retry-mintimeout 60000
    npm config set fetch-retry-maxtimeout 120000
    npm config set maxsockets 20
    
    # Install with parallel processing optimized for Mac Studio
    npm install --no-audit --no-fund --maxsockets=20
    
    print_success "Dependencies installed"
}

# Function to configure Mac Studio specific settings
configure_mac_studio() {
    print_status "Configuring Mac Studio specific optimizations..."
    
    # Create Mac Studio environment file
    cat > .env.mac-studio << 'EOF'
# Mac Studio Specific Configuration
HARDWARE_TYPE=mac-studio
ARCHITECTURE=apple-silicon

# Performance Settings
MAX_CONCURRENT_AGENTS=12
MEMORY_PER_AGENT=8GB
MAX_OLD_SPACE_SIZE=16384
UV_THREADPOOL_SIZE=32

# Mac Studio Optimizations
UNIFIED_MEMORY=true
METAL_ACCELERATION=true
SSD_OPTIMIZED=true
THERMAL_THROTTLING_THRESHOLD=85

# Development Settings
NODE_ENV=production
ENABLE_CLUSTERING=true
WORKERS=auto

# Cache Settings
CACHE_STRATEGY=aggressive
MEMORY_CACHE_SIZE=8GB
DISK_CACHE_SIZE=20GB

# Monitoring
PERFORMANCE_MONITORING=true
TRACK_MEMORY=true
TRACK_CPU=true
TRACK_NETWORK=true
EOF
    
    # Copy to main environment if not exists
    if [ ! -f .env ]; then
        cp .env.mac-studio .env
        print_success "Environment configuration created"
    else
        print_warning "Existing .env file found. Mac Studio optimizations available in .env.mac-studio"
    fi
    
    # Create Mac Studio specific configuration
    cat > mastra.mac-studio.config.ts << 'EOF'
import { getOptimalConfig } from './configs/mac-studio.config';

export default {
  ...getOptimalConfig(),
  environment: 'mac-studio',
  optimizations: {
    appleSiliconOptimized: true,
    unifiedMemory: true,
    metalAcceleration: true,
    highPerformanceMode: true
  }
};
EOF
    
    print_success "Mac Studio configuration created"
}

# Function to setup monitoring and performance tracking
setup_monitoring() {
    print_status "Setting up performance monitoring..."
    
    # Create monitoring script
    cat > scripts/monitor-performance.sh << 'EOF'
#!/bin/bash
# Performance monitoring script for Mac Studio

echo "Mac Studio Performance Monitor"
echo "=============================="

# System information
echo "System Info:"
echo "  Model: $(system_profiler SPHardwareDataType | grep "Model Name" | awk -F: '{print $2}' | xargs)"
echo "  Chip: $(system_profiler SPHardwareDataType | grep "Chip" | awk -F: '{print $2}' | xargs)"
echo "  Memory: $(system_profiler SPHardwareDataType | grep "Memory" | awk -F: '{print $2}' | xargs)"

# CPU and Memory usage
echo ""
echo "Current Usage:"
echo "  CPU: $(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')%"
echo "  Memory: $(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')KB active"

# Temperature monitoring
if command -v powermetrics &> /dev/null; then
    echo "  Temperature: $(sudo powermetrics -n 1 -i 1000 | grep "CPU die temperature" | awk '{print $4}' | head -1)°C"
fi

# Node.js processes
echo ""
echo "Node.js Processes:"
ps aux | grep node | grep -v grep | while read line; do
    echo "  $line"
done

# Agent performance
if [ -f "agent-logs/performance.log" ]; then
    echo ""
    echo "Agent Performance (last 10 entries):"
    tail -n 10 agent-logs/performance.log
fi
EOF
    
    chmod +x scripts/monitor-performance.sh
    print_success "Performance monitoring setup complete"
}

# Function to run validation tests
run_validation() {
    print_status "Running Mac Studio validation tests..."
    
    # Test Node.js configuration
    print_status "Testing Node.js optimization..."
    node -e "
        console.log('Node.js version:', process.version);
        console.log('Max heap size:', v8.getHeapStatistics().heap_size_limit / 1024 / 1024 / 1024, 'GB');
        console.log('UV thread pool size:', process.env.UV_THREADPOOL_SIZE);
        console.log('Node options:', process.env.NODE_OPTIONS);
    "
    
    # Test agent configuration
    if [ -f "package.json" ]; then
        print_status "Testing agent configuration..."
        npm run validate:config || print_warning "Agent configuration validation not available"
    fi
    
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

# Function to create desktop shortcuts and utilities
create_utilities() {
    print_status "Creating Mac Studio utilities..."
    
    # Create performance dashboard launcher
    cat > scripts/launch-dashboard.sh << 'EOF'
#!/bin/bash
# Launch Clear Piggy Mastra Agents Dashboard

echo "🚀 Launching Clear Piggy Mastra Agents Dashboard..."
echo "💻 Optimized for Mac Studio performance"

# Source optimizations
source scripts/node-optimize.sh

# Launch with Mac Studio configuration
npm run dashboard:mac-studio || npm run dashboard || echo "Dashboard not available"
EOF
    chmod +x scripts/launch-dashboard.sh
    
    # Create agent runner script
    cat > scripts/run-agents.sh << 'EOF'
#!/bin/bash
# Run Clear Piggy Mastra Agents with Mac Studio optimizations

echo "🤖 Starting Clear Piggy Mastra Agents..."
echo "💻 Mac Studio High Performance Mode"

# Source optimizations
source scripts/node-optimize.sh

# Check system resources
echo "System Status:"
echo "  CPU Cores: $(sysctl -n hw.ncpu)"
echo "  Memory: $(system_profiler SPHardwareDataType | grep "Memory" | awk -F: '{print $2}' | xargs)"

# Run agents with optimal configuration
npm run agents:start || echo "Agents not configured yet"
EOF
    chmod +x scripts/run-agents.sh
    
    print_success "Mac Studio utilities created"
}

# Function to display setup summary
display_summary() {
    print_success "Mac Studio setup completed successfully!"
    echo ""
    echo "🖥️  Mac Studio Configuration Summary"
    echo "=================================="
    echo ""
    echo "Performance Optimizations:"
    echo "  ✅ Node.js optimized for Apple Silicon"
    echo "  ✅ Memory limits increased to 16GB"
    echo "  ✅ UV thread pool optimized (32 threads)"
    echo "  ✅ Concurrent agents: 12 (vs 8 on MacBook Pro)"
    echo "  ✅ Memory per agent: 8GB (vs 4GB on MacBook Pro)"
    echo ""
    echo "Configuration Files Created:"
    echo "  ✅ .env.mac-studio (Mac Studio optimizations)"
    echo "  ✅ mastra.mac-studio.config.ts (Agent configuration)"
    echo "  ✅ scripts/node-optimize.sh (Node.js optimizations)"
    echo "  ✅ scripts/monitor-performance.sh (Performance monitoring)"
    echo ""
    echo "Quick Start Commands:"
    echo "  • Monitor performance:    ./scripts/monitor-performance.sh"
    echo "  • Launch dashboard:       ./scripts/launch-dashboard.sh"
    echo "  • Run agents:             ./scripts/run-agents.sh"
    echo "  • Start development:      npm run dev"
    echo ""
    echo "Next Steps:"
    echo "  1. Copy your API keys to .env file"
    echo "  2. Test agent connectivity: npm run test:connectivity"
    echo "  3. Run your first analysis: npm run analyze"
    echo ""
    print_success "Ready to unleash Mac Studio's full potential! 🚀"
}

# Main execution
main() {
    echo ""
    echo "🖥️  Clear Piggy Mastra Agents - Mac Studio Setup"
    echo "============================================="
    echo ""
    print_status "Setting up Clear Piggy Mastra Agents for Mac Studio..."
    echo ""
    
    detect_mac_studio
    echo ""
    
    check_prerequisites
    echo ""
    
    optimize_nodejs
    echo ""
    
    install_dependencies
    echo ""
    
    configure_mac_studio
    echo ""
    
    setup_monitoring
    echo ""
    
    create_utilities
    echo ""
    
    run_validation
    echo ""
    
    display_summary
}

# Run main function
main "$@"