// Simple syntax verification script
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'SkinReportGenerator.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// Check for basic syntax issues
const errors = [];

// Check for unmatched braces
const openBraces = (content.match(/{/g) || []).length;
const closeBraces = (content.match(/}/g) || []).length;
if (openBraces !== closeBraces) {
  errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
}

// Check for unmatched parentheses
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
if (openParens !== closeParens) {
  errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
}

// Check for unmatched angle brackets in JSX
const openAngles = (content.match(/<(?!\/)/g) || []).length;
const closeAngles = (content.match(/\/>/g) || []).length;
const selfClosing = closeAngles;
const regularCloses = (content.match(/<\//g) || []).length;
if (openAngles !== (selfClosing + regularCloses)) {
  // This is a rough check - JSX can be complex
  console.log(`Note: JSX balance check: ${openAngles} opens, ${selfClosing} self-closing, ${regularCloses} regular closes`);
}

if (errors.length > 0) {
  console.error('❌ Syntax Errors Found:');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ No obvious syntax errors found in SkinReportGenerator.jsx');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);
  process.exit(0);
}
