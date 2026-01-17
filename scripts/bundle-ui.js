// Simple script to copy ui.html to dist
// Since our UI uses inline script, we just need to copy it

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/ui.html');
const distPath = path.join(__dirname, '../dist/ui.html');

// Ensure dist directory exists
const distDir = path.dirname(distPath);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the file
fs.copyFileSync(srcPath, distPath);
console.log('UI bundled to dist/ui.html');
