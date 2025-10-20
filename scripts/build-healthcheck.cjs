#!/usr/bin/env node

/**
 * Build script for healthcheck files
 * Replaces placeholder strings with actual environment variables
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Ensure output directories exist
const distDir = path.join(__dirname, '../dist');
const healthcheckDir = path.join(__dirname, '../dist/healthcheck');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(healthcheckDir)) {
  fs.mkdirSync(healthcheckDir, { recursive: true });
}

// Function to replace placeholders with environment variables
function replacePlaceholders(content) {
  return content
    .replace(/"VITE_FIREBASE_API_KEY"/g, `"${process.env.VITE_FIREBASE_API_KEY || ''}"`)
    .replace(/"VITE_FIREBASE_AUTH_DOMAIN"/g, `"${process.env.VITE_FIREBASE_AUTH_DOMAIN || ''}"`)
    .replace(/"VITE_FIREBASE_PROJECT_ID"/g, `"${process.env.VITE_FIREBASE_PROJECT_ID || ''}"`)
    .replace(/"VITE_FIREBASE_STORAGE_BUCKET"/g, `"${process.env.VITE_FIREBASE_STORAGE_BUCKET || ''}"`)
    .replace(/"VITE_FIREBASE_MESSAGING_SENDER_ID"/g, `"${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}"`)
    .replace(/"VITE_FIREBASE_APP_ID"/g, `"${process.env.VITE_FIREBASE_APP_ID || ''}"`)
    .replace(/"VITE_FIREBASE_DATABASE_URL"/g, `"${process.env.VITE_FIREBASE_DATABASE_URL || ''}"`);
}

// Process healthcheck.js
const jsSourcePath = path.join(__dirname, '../public/healthcheck.js');
const jsOutputPath = path.join(__dirname, '../dist/healthcheck.js');
const jsOutputPath2 = path.join(__dirname, '../dist/healthcheck/healthcheck.js');

let jsContent = fs.readFileSync(jsSourcePath, 'utf8');
jsContent = replacePlaceholders(jsContent);

fs.writeFileSync(jsOutputPath, jsContent);
fs.writeFileSync(jsOutputPath2, jsContent);

// Process healthcheck-config.js
const configSourcePath = path.join(__dirname, '../public/healthcheck-config.js');
const configOutputPath = path.join(__dirname, '../dist/healthcheck-config.js');
const configOutputPath2 = path.join(__dirname, '../dist/healthcheck/healthcheck-config.js');

let configContent = fs.readFileSync(configSourcePath, 'utf8');
configContent = replacePlaceholders(configContent);

fs.writeFileSync(configOutputPath, configContent);
fs.writeFileSync(configOutputPath2, configContent);

// Copy other healthcheck files
const filesToCopy = [
  { src: 'healthcheck.html', dests: ['healthcheck.html', 'healthcheck/index.html'] },
  { src: 'healthcheck.css', dests: ['healthcheck.css', 'healthcheck/healthcheck.css'] },
  { src: 'healthcheck-services.js', dests: ['healthcheck-services.js', 'healthcheck/healthcheck-services.js'] },
  { src: 'healthcheck-ui.js', dests: ['healthcheck-ui.js', 'healthcheck/healthcheck-ui.js'] },
  { src: 'healthcheck-tests.js', dests: ['healthcheck-tests.js', 'healthcheck/healthcheck-tests.js'] }
];

filesToCopy.forEach(({ src, dests }) => {
  const srcPath = path.join(__dirname, '../public', src);
  if (fs.existsSync(srcPath)) {
    dests.forEach(dest => {
      const destPath = path.join(distDir, dest);
      fs.copyFileSync(srcPath, destPath);
    });
  }
});

console.log('✅ Healthcheck files built successfully with environment variables');

