/**
 * Documentation generation script for Pool Game application.
*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Project paths
const ROOT_DIR = path.resolve(__dirname);
const BACKEND_DIR = path.join(ROOT_DIR, '../backend');
const FRONTEND_DIR = path.join(ROOT_DIR, '../frontend');
const SHARED_DIR = path.join(ROOT_DIR, '../shared');
const DOCS_DIR = path.join(ROOT_DIR, 'output');

console.log('Preparing to generate documentation for Pool Game application...');

// Ensure docs directory exists
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { 
    recursive: true 
  });
}

console.log('Generating backend documentation...');
try {
  execSync('npx typedoc', { cwd: BACKEND_DIR, stdio: 'inherit' });
} catch (error) {
  console.error('Error generating backend documentation:', error.message);
  process.exit(1);
}

console.log('Generating frontend documentation...');
try {
  execSync('npx typedoc', { cwd: FRONTEND_DIR, stdio: 'inherit' });
} catch (error) {
  console.error('Error generating frontend documentation:', error.message);
  process.exit(1);
}

console.log('Documentation generation complete!');
