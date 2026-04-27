const fs = require('fs');
const path = 'src/components/RegionMap.tsx';
let data = fs.readFileSync(path, 'utf8');
data = data.replace(/\\\\{1,2}\`/g, '\`');
data = data.replace(/\\\\{1,2}\\$/g, '\$');
data = data.replace(/\\\`/g, '\`');
data = data.replace(/\\\$/g, '\$');
fs.writeFileSync(path, data, 'utf8');
console.log("Fixed templates.");
