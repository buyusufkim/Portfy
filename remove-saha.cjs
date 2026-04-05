const fs = require('fs');
const path = './src/App.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');
lines.splice(2708, 155); // 2863 - 2709 + 1 = 155
fs.writeFileSync(path, lines.join('\n'));
console.log('Removed renderSaha');
