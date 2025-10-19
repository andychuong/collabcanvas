# Security Setup - Environment Variables

## Overview

This document explains how API keys and sensitive configuration are managed in this project to keep them secure.

## What Was Done

### 1. Moved API Keys to Environment Variables

All Firebase configuration keys are now stored in `.env` file (which is gitignored) instead of being hardcoded in the source code.

**Location:** `.env` file in project root

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=your-database-url
```

### 2. Template-Based Build System

**Health Check Files:**
- `public/healthcheck.template.js` - Template with placeholders
- `public/healthcheck.js` - Generated at build time (gitignored)

**Build Process:**
1. During build, `scripts/build-healthcheck.cjs` reads the template
2. Replaces placeholders like `__VITE_FIREBASE_API_KEY__` with actual env vars
3. Outputs the final `healthcheck.js` to the dist folder

### 3. Removed from Git History

Used `git filter-branch` to remove `public/healthcheck.js` from all commits, ensuring the exposed keys are completely removed from the repository history.

## How to Build

### Development
```bash
npm run dev
```
The main app uses Vite's automatic env var injection.

### Production Build
```bash
npm run build
```
This runs:
1. TypeScript compilation
2. Vite build
3. `npm run build-healthcheck` - Injects env vars into healthcheck files

### Deploy
```bash
npm run build
firebase deploy
```

## Files Structure

```
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Template for setting up .env
├── .gitignore                    # Excludes .env and generated files
├── public/
│   ├── healthcheck.html          # Static HTML
│   ├── healthcheck.css           # Static CSS
│   ├── healthcheck.template.js   # Template with placeholders
│   └── healthcheck.js            # Generated (gitignored)
├── scripts/
│   └── build-healthcheck.cjs     # Build script for healthcheck
└── dist/                         # Build output
    ├── healthcheck.html
    ├── healthcheck.css
    └── healthcheck.js            # Contains actual API keys
```

## Security Notes

### Firebase Web API Keys

**Important:** Firebase Web API keys are DESIGNED to be public. They're not secret keys.

From Google's documentation:
> "Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources; that can only be done with Firebase Security Rules."

**What Protects Your Data:**
- ✅ Firebase Security Rules (server-side)
- ✅ Firebase Authentication
- ✅ Group-based access control
- ❌ NOT the API key itself

### Why We Still Use .env

Even though Firebase API keys are safe to expose, we use `.env` for:
1. **Consistency** - All config in one place
2. **Best Practice** - Easier to manage multiple environments
3. **OpenAI API** - Other keys (like OpenAI) ARE sensitive
4. **Professional Standards** - Industry standard approach

## For New Developers

### Initial Setup

1. **Copy the example env file:**
   ```bash
   cp .env.example .env
   ```

2. **Get Firebase config** from Firebase Console:
   - Go to Project Settings
   - Copy the Firebase config object
   - Fill in the `.env` file

3. **Build and run:**
   ```bash
   npm install
   npm run build
   npm run dev
   ```

### If You Get Config Errors

If you see errors about missing Firebase config:
1. Check `.env` file exists
2. Verify all VITE_FIREBASE_* variables are set
3. Restart the dev server (env vars are loaded on startup)

## Deployment Checklist

Before deploying to production:

- [x] `.env` file is in `.gitignore`
- [x] No hardcoded API keys in source code
- [x] Build script generates healthcheck.js successfully
- [x] `dist/healthcheck.js` contains actual keys (not placeholders)
- [x] Removed sensitive files from git history
- [x] Firebase Security Rules are deployed and tested

## Maintenance

### Adding New Environment Variables

1. Add to `.env`:
   ```env
   VITE_NEW_VARIABLE=value
   ```

2. Add to `.env.example` (without the actual value):
   ```env
   VITE_NEW_VARIABLE=your-value-here
   ```

3. Update build script if needed for healthcheck files

4. Update this documentation

### Rotating API Keys

If you need to rotate Firebase API keys:

1. Create new Firebase project or regenerate keys
2. Update `.env` file
3. Rebuild and redeploy
4. Old keys can be disabled in Firebase Console

## Troubleshooting

### Build fails with "Cannot find .env"
- Ensure `.env` exists in project root
- Copy from `.env.example` if needed

### Healthcheck shows "undefined" for config
- Run `npm run build` to regenerate healthcheck.js
- Verify build-healthcheck.cjs is working
- Check that `.env` has all required variables

### Git shows files that should be ignored
```bash
git rm --cached <file>
git add .gitignore
git commit -m "Fix gitignore"
```

## Security Incident Response

If you accidentally commit sensitive data:

1. **Immediately rotate the exposed keys**
2. **Remove from git history** (see Git History Cleanup section)
3. **Force push to all remotes**
4. **Notify team members to re-clone**

### Git History Cleanup

```bash
# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ WARNING: Coordinate with team first!)
git push origin --force --all
```

---

**Last Updated:** October 19, 2025
**Maintained By:** Development Team

