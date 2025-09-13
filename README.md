# Clear Piggy Mastra Agents

A comprehensive collection of specialized Mastra AI agents designed for mobile optimization of Clear Piggy's financial SaaS platform. These agents provide intelligent automation for UI analysis, responsive design generation, performance optimization, testing, and deployment workflows.

## Overview

This tool analyzes your Clear Piggy React components and provides detailed mobile optimization recommendations, focusing on:

- **Touch Target Compliance** - Ensures 44px minimum touch targets
- **Responsive Design** - Identifies Tailwind CSS mobile-first gaps
- **Layout Complexity** - Flags complex layouts needing mobile redesign
- **Navigation Patterns** - Validates mobile navigation best practices
- **Financial UX** - Specialized patterns for financial app components

## Features

- 🤖 **AI-Powered Analysis** using Claude Sonnet 4
- 📱 **Mobile-First Focus** with financial SaaS expertise
- 🎯 **Component-Level Insights** with detailed scoring
- 📊 **Comprehensive Reports** in JSON and HTML formats
- 🔧 **Actionable Recommendations** with implementation guidance
- 💰 **Financial UX Patterns** for transactions, budgets, and dashboards

## Quick Start

### 1. Environment Setup

Copy the environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:

```env
# Required: Your Anthropic API key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Path to your Clear Piggy project
CLEAR_PIGGY_PROJECT_PATH=/path/to/your/clear-piggy/project
CLEAR_PIGGY_COMPONENTS_PATH=src/components

# Analysis configuration
ANALYSIS_OUTPUT_DIR=./analysis-reports
MIN_TOUCH_TARGET_SIZE=44
MOBILE_BREAKPOINT=768
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Analysis

**Full Analysis** (recommended first run):
```bash
npm run analyze
```

**Quick Assessment** (fast critical issues check):
```bash
npm run quick
```

**Financial Components Only**:
```bash
npm run financial
```

**Pattern-Based Analysis**:
```bash
npm start pattern Button    # Analyze all Button components
npm start pattern transaction # Analyze transaction-related components
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run analyze` | Complete mobile optimization analysis |
| `npm run quick` | Quick assessment of critical issues |
| `npm run financial` | Focus on financial components only |
| `npm start pattern <name>` | Analyze components matching pattern |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Analysis Output

### Console Output
Real-time analysis progress with:
- Overall mobile optimization score (0-100)
- Critical and high-priority issue counts
- Component-level scores and priorities
- Immediate action recommendations

### Generated Reports
- **JSON Report**: `./analysis-reports/clear-piggy-mobile-report-YYYY-MM-DD.json`
- **HTML Report**: `./analysis-reports/clear-piggy-mobile-report-YYYY-MM-DD.html`

### Example Output
```bash
🔍 Starting Clear Piggy mobile optimization analysis...
📁 Found 47 React components
📊 Analyzing component 1/47: TransactionList

📊 Analysis Results:
Overall Mobile Score: 73/100
Critical Issues: 3
High Priority Issues: 8
Components Needing Work: 12/47

🎯 Top Issue Categories:
• Touch Target Issues
• Responsive Design Gaps  
• Navigation Issues

🚨 Immediate Actions Required:
• Fix 3 components with critical mobile issues
• Address touch target size violations (minimum 44px)
• Fix navigation accessibility issues
```

## What Gets Analyzed

### Component Detection
- All `.tsx`, `.ts`, `.jsx`, `.js` files in your components directory
- Automatic React component identification
- Financial component pattern recognition

### Analysis Categories

#### 1. Touch Target Analysis
- Identifies interactive elements smaller than 44px
- Checks buttons, links, form controls
- Provides size recommendations

#### 2. Tailwind Responsive Analysis
- Scans for missing responsive breakpoints
- Identifies mobile-first design violations
- Suggests responsive class improvements

#### 3. Layout Complexity
- Measures component nesting depth
- Analyzes Flexbox and Grid complexity
- Scores mobile compatibility

#### 4. Navigation Patterns
- Validates mobile navigation best practices
- Checks for hamburger menus and accessibility
- Identifies responsive navigation issues

#### 5. Financial UX Patterns
- **Transaction Lists**: Virtualization, swipe actions, loading states
- **Budget Charts**: Touch interactions, mobile sizing, responsive design
- **Dashboard Cards**: Stacking patterns, progressive disclosure
- **Forms**: Input types, validation, mobile keyboards

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *required* | Your Anthropic API key |
| `CLEAR_PIGGY_PROJECT_PATH` | `./clear-piggy-project` | Path to your React project |
| `CLEAR_PIGGY_COMPONENTS_PATH` | `src/components` | Components directory |
| `ANALYSIS_OUTPUT_DIR` | `./analysis-reports` | Report output directory |
| `MIN_TOUCH_TARGET_SIZE` | `44` | Minimum touch target size in pixels |
| `MOBILE_BREAKPOINT` | `768` | Mobile breakpoint in pixels |
| `TABLET_BREAKPOINT` | `1024` | Tablet breakpoint in pixels |

### Project Structure

Your Clear Piggy project should follow this structure:
```
clear-piggy/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── charts/
│   │   └── navigation/
│   ├── pages/
│   └── types/
├── package.json
└── tailwind.config.js
```

## Financial Component Patterns

### Transaction Lists
- ✅ Virtualization for performance
- ✅ Swipe actions for quick operations  
- ✅ Pull-to-refresh functionality
- ✅ Loading and skeleton states

### Budget Charts
- ✅ Touch-interactive elements
- ✅ Responsive sizing
- ✅ Mobile-friendly tooltips
- ✅ Accessible color schemes

### Dashboard Cards
- ✅ Vertical stacking on mobile
- ✅ Tap-to-expand functionality
- ✅ Progressive disclosure
- ✅ Quick action buttons

### Forms and Inputs
- ✅ Appropriate input types
- ✅ Real-time formatting
- ✅ Mobile keyboard optimization
- ✅ Touch-friendly validation

## Scoring System

Each component receives scores (0-100) for:

- **Touch Target Score**: Interactive element compliance
- **Responsive Score**: Mobile-first design implementation  
- **Layout Score**: Component complexity and mobile compatibility
- **Navigation Score**: Mobile navigation patterns
- **Financial UX Score**: Financial app-specific patterns
- **Overall Score**: Weighted average of all categories

### Priority Levels
- **Critical**: Touch target violations, navigation failures
- **High**: Poor overall score (<50), missing responsive patterns
- **Medium**: Layout complexity, minor UX issues
- **Low**: Good score with minor improvements possible

## Integration with Clear Piggy

### Stack Compatibility
- ✅ React 18 + TypeScript
- ✅ Tailwind CSS + Framer Motion
- ✅ Supabase integration analysis
- ✅ Plaid API pattern detection

### CI/CD Integration
Add to your GitHub Actions workflow:

```yaml
- name: Mobile Optimization Analysis
  run: |
    npm install -g clear-piggy-mobile-optimizer
    clear-piggy-mobile analyze
    # Upload reports as artifacts
```

## Troubleshooting

### Common Issues

**"No components found"**
- Check `CLEAR_PIGGY_PROJECT_PATH` points to correct directory
- Ensure components directory exists with `.tsx` files

**"ANTHROPIC_API_KEY required"**  
- Set your API key in `.env` file
- Get API key from [Anthropic Console](https://console.anthropic.com/)

**"Failed to analyze component"**
- Component may have syntax errors
- Check for unsupported React patterns

### Debug Mode
Enable detailed logging:
```bash
ENABLE_DETAILED_LOGGING=true npm run analyze
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-analysis`
3. Make changes and test thoroughly
4. Submit pull request with clear description

### Adding New Analysis Rules

1. Add rule to `src/analyzers/mobile-optimizer.ts`
2. Update TypeScript interfaces in `src/types/analysis.ts`
3. Add tests for new functionality
4. Update documentation

## License

MIT License - see LICENSE file for details.

## Support

- 📧 Email: support@clearpiggy.com
- 💬 Discord: [Clear Piggy Developers](https://discord.gg/clearpiggy)
- 🐛 Issues: [GitHub Issues](https://github.com/clearpiggy/mobile-optimizer/issues)

---

Built with ❤️ for the Clear Piggy financial SaaS platform