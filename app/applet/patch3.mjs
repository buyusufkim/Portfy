import fs from 'fs';
import path from 'path';

const replacements = [
  [/rounded-\[14px\]/g, 'rounded-xl'],
  [/rounded-\[16px\]/g, 'rounded-2xl'],
  [/rounded-\[20px\]/g, 'rounded-2xl'],
  [/rounded-\[24px\]/g, 'rounded-3xl'],
  [/rounded-\[28px\]/g, 'rounded-3xl'],
  [/rounded-\[32px\]/g, 'rounded-3xl'],
  [/rounded-\[40px\]/g, 'rounded-3xl'],
  [/rounded-t-\[32px\]/g, 'rounded-t-3xl'],
  [/rounded-t-\[40px\]/g, 'rounded-t-3xl'],
  [/rounded-b-\[32px\]/g, 'rounded-b-3xl'],
  [/rounded-b-\[40px\]/g, 'rounded-b-3xl']
];

function processDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
console.log("Done");
