#!/usr/bin/env node

/**
 * Build script for healthcheck files
 * Replaces placeholders with environment variables
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

// Process healthcheck.js template
const jsTemplatePath = path.join(__dirname, '../public/healthcheck.template.js');
const jsOutputPath = path.join(__dirname, '../dist/healthcheck.js');
const jsOutputPath2 = path.join(__dirname, '../dist/healthcheck/healthcheck.js');

let jsTemplate = fs.readFileSync(jsTemplatePath, 'utf8');

// Replace placeholders with environment variables
jsTemplate = jsTemplate
  .replace('__VITE_FIREBASE_API_KEY__', process.env.VITE_FIREBASE_API_KEY || '')
  .replace('__VITE_FIREBASE_AUTH_DOMAIN__', process.env.VITE_FIREBASE_AUTH_DOMAIN || '')
  .replace('__VITE_FIREBASE_PROJECT_ID__', process.env.VITE_FIREBASE_PROJECT_ID || '')
  .replace('__VITE_FIREBASE_STORAGE_BUCKET__', process.env.VITE_FIREBASE_STORAGE_BUCKET || '')
  .replace('__VITE_FIREBASE_MESSAGING_SENDER_ID__', process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')
  .replace('__VITE_FIREBASE_APP_ID__', process.env.VITE_FIREBASE_APP_ID || '')
  .replace('__VITE_FIREBASE_DATABASE_URL__', process.env.VITE_FIREBASE_DATABASE_URL || '');

// Write JS output files
fs.writeFileSync(jsOutputPath, jsTemplate);
fs.writeFileSync(jsOutputPath2, jsTemplate);

// Copy HTML and CSS files
const htmlPath = path.join(__dirname, '../public/healthcheck.html');
const cssPath = path.join(__dirname, '../public/healthcheck.css');

fs.copyFileSync(htmlPath, path.join(distDir, 'healthcheck.html'));
fs.copyFileSync(htmlPath, path.join(healthcheckDir, 'index.html'));
fs.copyFileSync(cssPath, path.join(distDir, 'healthcheck.css'));
fs.copyFileSync(cssPath, path.join(healthcheckDir, 'healthcheck.css'));

console.log('✅ Healthcheck files built successfully with environment variables');

