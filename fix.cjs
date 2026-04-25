const fs = require('fs');

const path = 'src/components/DashboardView.tsx';
let data = fs.readFileSync(path, 'utf8');

// The file was accidentally joined with literal "\n". Let's split by that string and join by real newline
if (data.includes('\\n')) {
    data = data.split('\\n').join('\n');
    fs.writeFileSync(path, data, 'utf8');
    console.log("Restored newlines.");
} else {
    console.log("No backslash n found.");
}
