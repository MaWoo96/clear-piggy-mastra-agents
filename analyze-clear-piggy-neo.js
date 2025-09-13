#!/usr/bin/env node

/**
 * Clear Piggy Neo Analysis Script
 * Specialized analysis comparing desktop and mobile implementations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_PATH = '/Users/TREM/Downloads/clear-piggy-neo-main';
const COMPONENTS_PATH = path.join(PROJECT_PATH, 'src/components');
const MOBILE_UI_PATH = path.join(PROJECT_PATH, 'mobile-ui');
const MOBILE_UI_2_PATH = path.join(PROJECT_PATH, 'mobile-ui-2');
const MOBILE_UI_TABBED_PATH = path.join(PROJECT_PATH, 'mobile-ui-tabbed');

console.log('🚀 Clear Piggy Neo Mobile Optimization Analysis');
console.log('==============================================');

// Check if paths exist
const paths = [
  { name: 'Main Components', path: COMPONENTS_PATH },
  { name: 'Mobile UI v1', path: MOBILE_UI_PATH },
  { name: 'Mobile UI v2', path: MOBILE_UI_2_PATH },
  { name: 'Mobile UI Tabbed', path: MOBILE_UI_TABBED_PATH },
];

paths.forEach(({ name, path: dirPath }) => {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    console.log(`✅ ${name}: ${files.length} files found at ${dirPath}`);
  } else {
    console.log(`❌ ${name}: Not found at ${dirPath}`);
  }
});

console.log('\n📊 Starting comprehensive analysis...\n');

// Component comparison analysis
function analyzeComponentComparison() {
  console.log('🔍 Analyzing component implementations...');
  
  // Find components that exist in both desktop and mobile versions
  const mainComponents = fs.existsSync(COMPONENTS_PATH) 
    ? fs.readdirSync(COMPONENTS_PATH).filter(f => f.endsWith('.tsx'))
    : [];
  
  const mobileComponents = fs.existsSync(MOBILE_UI_PATH) 
    ? fs.readdirSync(MOBILE_UI_PATH).filter(f => f.endsWith('.tsx'))
    : [];

  const mobileUIComponents = fs.existsSync(path.join(MOBILE_UI_PATH, 'components'))
    ? fs.readdirSync(path.join(MOBILE_UI_PATH, 'components')).filter(f => f.endsWith('.tsx'))
    : [];

  console.log('\n📋 Component Inventory:');
  console.log(`Main Components: ${mainComponents.length}`);
  console.log(`Mobile UI Components: ${mobileComponents.length}`);
  console.log(`Mobile UI Subcomponents: ${mobileUIComponents.length}`);

  // Find matching components
  const matchingComponents = mainComponents.filter(comp => 
    mobileComponents.includes(comp) || 
    mobileUIComponents.includes(comp) ||
    mobileComponents.includes(`Mobile${comp}`)
  );

  console.log(`\n🔄 Components with mobile variants: ${matchingComponents.length}`);
  
  if (matchingComponents.length > 0) {
    console.log('Components to analyze for mobile optimization:');
    matchingComponents.forEach(comp => console.log(`  • ${comp}`));
  }

  return {
    mainComponents,
    mobileComponents,
    mobileUIComponents,
    matchingComponents
  };
}

// Financial component specific analysis
function analyzeFinancialComponents() {
  console.log('\n💰 Analyzing financial-specific components...');
  
  const financialKeywords = [
    'transaction', 'budget', 'dashboard', 'account', 'balance', 'spending',
    'receipt', 'cash', 'flow', 'insight', 'ai', 'plaid', 'bank'
  ];

  const allFiles = [];
  
  // Collect all component files
  [COMPONENTS_PATH, MOBILE_UI_PATH, path.join(MOBILE_UI_PATH, 'components')].forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.tsx'))
        .map(f => ({ name: f, path: dir }));
      allFiles.push(...files);
    }
  });

  const financialComponents = allFiles.filter(({ name }) =>
    financialKeywords.some(keyword => 
      name.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  console.log(`📈 Found ${financialComponents.length} financial components:`);
  financialComponents.forEach(({ name, path: dirPath }) => {
    const relativePath = dirPath.replace(PROJECT_PATH, '');
    console.log(`  • ${name} (${relativePath})`);
  });

  return financialComponents;
}

// Check project dependencies
function checkProjectDependencies() {
  console.log('\n📦 Checking project dependencies...');
  
  try {
    const packageJsonPath = path.join(PROJECT_PATH, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const relevantDeps = {
      react: deps.react || 'Not found',
      typescript: deps.typescript || 'Not found',
      tailwindcss: deps.tailwindcss || 'Not found',
      'framer-motion': deps['framer-motion'] || 'Not found',
      '@supabase/supabase-js': deps['@supabase/supabase-js'] || 'Not found',
      'react-plaid-link': deps['react-plaid-link'] || 'Not found',
    };

    console.log('Stack analysis:');
    Object.entries(relevantDeps).forEach(([dep, version]) => {
      const status = version !== 'Not found' ? '✅' : '❌';
      console.log(`  ${status} ${dep}: ${version}`);
    });

    return relevantDeps;
  } catch (error) {
    console.log('❌ Could not read package.json');
    return {};
  }
}

// Generate analysis commands
function generateAnalysisCommands(componentAnalysis) {
  console.log('\n🎯 Recommended Analysis Commands:');
  
  const commands = [
    {
      name: 'Full Analysis (All Components)',
      cmd: 'npm run analyze',
      description: 'Complete analysis of all components for mobile optimization'
    },
    {
      name: 'Quick Mobile Assessment',
      cmd: 'npm run quick',
      description: 'Fast check for critical mobile issues'
    },
    {
      name: 'Financial Components Focus',
      cmd: 'npm run financial',
      description: 'Deep dive into financial UX patterns'
    },
    {
      name: 'Dashboard Components',
      cmd: 'npm start pattern Dashboard',
      description: 'Analyze dashboard-specific components'
    },
    {
      name: 'Transaction Components',
      cmd: 'npm start pattern Transaction',
      description: 'Focus on transaction-related components'
    },
    {
      name: 'Mobile Components Comparison',
      cmd: 'npm start pattern Mobile',
      description: 'Compare mobile-specific implementations'
    }
  ];

  commands.forEach(({ name, cmd, description }) => {
    console.log(`\n📋 ${name}:`);
    console.log(`   Command: ${cmd}`);
    console.log(`   Purpose: ${description}`);
  });
}

// Main analysis
function main() {
  try {
    const componentAnalysis = analyzeComponentComparison();
    const financialComponents = analyzeFinancialComponents();
    const dependencies = checkProjectDependencies();
    
    generateAnalysisCommands(componentAnalysis);

    console.log('\n✨ Analysis Setup Complete!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Set your ANTHROPIC_API_KEY in .env file');
    console.log('2. Run: cd /Users/TREM/Development/clear-piggy-mobile-optimizer');
    console.log('3. Choose one of the analysis commands above');
    console.log('4. Review the generated reports in ./analysis-reports/');
    
    console.log('\n💡 Optimization Focus Areas:');
    console.log('• Desktop vs Mobile component comparison');
    console.log('• Financial UX patterns for mobile');
    console.log('• Touch target compliance (44px minimum)');
    console.log('• Responsive Tailwind CSS implementation');
    console.log('• Mobile navigation patterns');
    
    // Save analysis summary
    const summary = {
      timestamp: new Date().toISOString(),
      projectPath: PROJECT_PATH,
      componentAnalysis,
      financialComponents: financialComponents.map(c => c.name),
      dependencies,
      totalComponents: componentAnalysis.mainComponents.length + 
                      componentAnalysis.mobileComponents.length + 
                      componentAnalysis.mobileUIComponents.length
    };
    
    const summaryPath = './clear-piggy-neo-analysis-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📄 Analysis summary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}