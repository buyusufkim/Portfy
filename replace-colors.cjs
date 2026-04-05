const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/blue-/g, 'orange-');
fs.writeFileSync(path, content);
console.log('Replaced blue- with orange- in App.tsx');
