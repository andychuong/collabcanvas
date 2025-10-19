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

// Read healthcheck.js from public/
const jsSourcePath = path.join(__dirname, '../public/healthcheck.js');
const jsOutputPath = path.join(__dirname, '../dist/healthcheck.js');
const jsOutputPath2 = path.join(__dirname, '../dist/healthcheck/healthcheck.js');

let jsContent = fs.readFileSync(jsSourcePath, 'utf8');

// Replace placeholder strings with environment variables
jsContent = jsContent
  .replace(/"VITE_FIREBASE_API_KEY"/g, `"${process.env.VITE_FIREBASE_API_KEY || ''}"`)
  .replace(/"VITE_FIREBASE_AUTH_DOMAIN"/g, `"${process.env.VITE_FIREBASE_AUTH_DOMAIN || ''}"`)
  .replace(/"VITE_FIREBASE_PROJECT_ID"/g, `"${process.env.VITE_FIREBASE_PROJECT_ID || ''}"`)
  .replace(/"VITE_FIREBASE_STORAGE_BUCKET"/g, `"${process.env.VITE_FIREBASE_STORAGE_BUCKET || ''}"`)
  .replace(/"VITE_FIREBASE_MESSAGING_SENDER_ID"/g, `"${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}"`)
  .replace(/"VITE_FIREBASE_APP_ID"/g, `"${process.env.VITE_FIREBASE_APP_ID || ''}"`)
  .replace(/"VITE_FIREBASE_DATABASE_URL"/g, `"${process.env.VITE_FIREBASE_DATABASE_URL || ''}"`);

// Write JS output files
fs.writeFileSync(jsOutputPath, jsContent);
fs.writeFileSync(jsOutputPath2, jsContent);

// Copy HTML and CSS files
const htmlPath = path.join(__dirname, '../public/healthcheck.html');
const cssPath = path.join(__dirname, '../public/healthcheck.css');

fs.copyFileSync(htmlPath, path.join(distDir, 'healthcheck.html'));
fs.copyFileSync(htmlPath, path.join(healthcheckDir, 'index.html'));
fs.copyFileSync(cssPath, path.join(distDir, 'healthcheck.css'));
fs.copyFileSync(cssPath, path.join(healthcheckDir, 'healthcheck.css'));

console.log('✅ Healthcheck files built successfully with environment variables');

