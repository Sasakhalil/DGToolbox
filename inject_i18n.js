const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

const files = fs.readdirSync(rootDir);

files.forEach(file => {
    if (file.endsWith('.html')) {
        let content = fs.readFileSync(path.join(rootDir, file), 'utf8');

        // Add i18n script before app.js if it doesn't exist
        if (content.includes('js/app.js') && !content.includes('js/i18n.js')) {
            content = content.replace('<script src="js/app.js', '<script src="js/i18n.js"></script>\n    <script src="js/app.js');
            fs.writeFileSync(path.join(rootDir, file), content);
            console.log(`Updated ${file}`);
        }
    }
});
console.log('All HTML files updated with i18n.js');
