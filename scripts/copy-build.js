/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const srcStatic = path.join('.next', 'static');
const destStatic = path.join('.next', 'standalone', '.next', 'static');
const srcPublic = path.join('public');
const destPublic = path.join('.next', 'standalone', 'public');

function copyDirSync(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Copy all files and directories
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

try {
  console.log(`Copying ${srcStatic} to ${destStatic}...`);
  copyDirSync(srcStatic, destStatic);
  console.log('✓ Static files copied');

  console.log(`Copying ${srcPublic} to ${destPublic}...`);
  copyDirSync(srcPublic, destPublic);
  console.log('✓ Public files copied');

  console.log('Build complete!');
} catch (err) {
  console.error('Error during copy:', err);
  process.exit(1);
}
