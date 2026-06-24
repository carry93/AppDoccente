const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchFiles(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('<nav')) {
                console.log(`Found <nav> in ${fullPath}`);
            }
        }
    });
}
searchFiles(path.join(__dirname, 'views'));
