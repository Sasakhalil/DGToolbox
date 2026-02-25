const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const cssDir = path.join(rootDir, 'css');
const jsDir = path.join(rootDir, 'js');
const assetsDir = path.join(rootDir, 'assets');
const swFile = path.join(rootDir, 'sw.js');

// Function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        // Skip node_modules or dot files
        if (file.startsWith('.') || file === 'node_modules') return;

        const fullPath = path.join(dirPath, file);

        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            // Only care about web files
            const ext = path.extname(file).toLowerCase();
            if (['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.json', '.ico', '.woff', '.woff2', '.ttf'].includes(ext)) {

                // Get relative path from root and replace slashes
                let relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

                // Exclude the sw.js itself and these scripts
                if (!['sw.js', 'seo_update.js', 'extract_css.js', 'extract_js.js', 'organize.js', 'update_sw.js', 'package.json', 'package-lock.json'].includes(relPath)) {
                    // Ensure it starts with ./ just to be safe with standard SW practices
                    arrayOfFiles.push('./' + relPath);
                }
            }
        }
    });

    return arrayOfFiles;
}

function updateServiceWorker() {
    console.log('Generating dynamic asset list...');

    // Add root explicitly
    let allAssets = ['./'];

    // Get all valid files
    allAssets = getAllFiles(rootDir, allAssets);

    // Add external CDNs used globally
    const externalDeps = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@500;700&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
        'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.1.0/diff.min.js'
    ];

    allAssets = allAssets.concat(externalDeps);

    console.log(`Found ${allAssets.length} assets to cache.`);

    // Read the current SW
    let swContent = fs.readFileSync(swFile, 'utf8');

    // Generate new JS Array string
    const assetsArrayString = JSON.stringify(allAssets, null, 4).replace(/"/g, "'");

    // Regex to find and replace the ASSETS array block
    // It captures `const ASSETS = [` until the closing `];`
    const regex = /const ASSETS = \[\s*[\s\S]*?\s*\];/;

    if (regex.test(swContent)) {
        swContent = swContent.replace(regex, `const ASSETS = ${assetsArrayString};`);

        // Let's also bump the version automatically
        const oldVersionMatch = swContent.match(/const CACHE_NAME = 'dg-toolbox-v(\d+)';/);
        let newVersion = 27; // fallback
        if (oldVersionMatch && oldVersionMatch[1]) {
            console.log(`Old version: ${oldVersionMatch[1]}`);
            newVersion = parseInt(oldVersionMatch[1]) + 1;
            swContent = swContent.replace(oldVersionMatch[0], `const CACHE_NAME = 'dg-toolbox-v${newVersion}';`);
        }

        fs.writeFileSync(swFile, swContent);
        console.log(`Service Worker updated successfully! Bumped to v${newVersion}.`);
    } else {
        console.error("Could not find the ASSETS array in sw.js using regex.");
    }
}

updateServiceWorker();
