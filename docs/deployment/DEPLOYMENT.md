# Deployment Guide

This guide covers deploying CollabCanvas to production using Firebase Hosting or Vercel.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Firebase Hosting Deployment](#firebase-hosting-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Completed local setup and testing
- [ ] Firebase project created with all services enabled
- [ ] `.env` file configured with production Firebase credentials
- [ ] Security rules deployed to Firebase
- [ ] Tested locally with multiple users
- [ ] Built the project successfully (`npm run build`)
- [ ] Reviewed security rules in production mode

## Firebase Hosting Deployment

Firebase Hosting is the recommended deployment method as it integrates seamlessly with Firebase backend services.

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase (if not done already)

```bash
firebase init
```

Select:
- ✅ Firestore
- ✅ Realtime Database
- ✅ Hosting

Configuration:
- Use existing project: Select your Firebase project
- Firestore rules file: `firestore.rules` (default)
- Firestore indexes file: `firestore.indexes.json` (default)
- Database rules file: `database.rules.json` (default)
- Public directory: `dist`
- Configure as single-page app: **Yes**
- Set up automatic builds with GitHub: **No** (optional)
- Overwrite existing files: **No**

This creates:
- `.firebaserc` - Project configuration
- `firebase.json` - Hosting and rules configuration

### Step 4: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

### Step 5: Deploy Everything

```bash
firebase deploy
```

This deploys:
- Frontend to Firebase Hosting
- Firestore security rules
- Realtime Database security rules

**Note:** First deployment may take 2-5 minutes.

### Step 6: Get Your Deployment URL

After deployment, Firebase CLI will display:

```
✔  Deploy complete!

Hosting URL: https://your-project-id.web.app
```

### Deploy Only Specific Services

```bash
# Deploy only hosting (frontend)
firebase deploy --only hosting

# Deploy only database rules
firebase deploy --only firestore:rules,database

# Deploy specific target
firebase deploy --only hosting:production
```

### Firebase Hosting Features

- **Global CDN**: Automatic worldwide distribution
- **SSL Certificate**: Free HTTPS included
- **Custom Domains**: Add your own domain
- **Rollback**: Easy version rollback
- **Preview Channels**: Test before production

### Add Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (up to 24 hours)

## Vercel Deployment

Vercel is an alternative deployment platform with excellent React support.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

From your project directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy?: **Yes**
- Which scope?: Select your account
- Link to existing project?: **No**
- Project name: `collab-canvas` (or your choice)
- Directory: `./` (current directory)
- Override settings?: **No**

### Step 4: Add Environment Variables

You need to add Firebase credentials to Vercel:

```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_DATABASE_URL
```

Or add them via the Vercel Dashboard:
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add each variable for Production, Preview, and Development

### Step 5: Deploy to Production

```bash
vercel --prod
```

### Step 6: Get Your Deployment URL

Vercel will display:

```
✅  Production: https://collab-canvas.vercel.app
```

### Vercel Features

- **Automatic Deployments**: Git push triggers deploy
- **Preview Deployments**: Every PR gets a preview URL
- **Analytics**: Built-in performance analytics
- **Edge Network**: Fast global delivery

### GitHub Integration (Optional)

1. Push your code to GitHub
2. Go to vercel.com → Import Project
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy

Now every `git push` automatically deploys!

## Post-Deployment Verification

After deploying, verify everything works:

### 1. Test Authentication

- [ ] Visit deployed URL
- [ ] Register a new account
- [ ] Logout and login
- [ ] Verify session persists across refreshes

### 2. Test Canvas Functionality

- [ ] Create rectangle, circle, and text shapes
- [ ] Move shapes around
- [ ] Pan the canvas
- [ ] Zoom in and out
- [ ] Delete shapes
- [ ] Refresh page - shapes persist

### 3. Test Multiplayer Features

- [ ] Open app in two different browsers
- [ ] Login with different accounts
- [ ] Create shape in Browser 1 → appears in Browser 2
- [ ] Move cursor in Browser 1 → cursor visible in Browser 2
- [ ] Check online users list shows both users
- [ ] Close Browser 1 → user removed from Browser 2 list

### 4. Test Performance

- [ ] Create 50+ shapes
- [ ] Verify smooth 60 FPS rendering
- [ ] Test pan and zoom with many shapes
- [ ] Verify sync latency < 100ms
- [ ] Check cursor sync latency < 50ms

### 5. Test Mobile (Optional for MVP)

- [ ] Open on mobile browser
- [ ] Test touch pan and pinch zoom
- [ ] Verify shapes render correctly
- [ ] Test shape creation

## Environment Variables

### Production Environment Variables

Ensure these are set in your deployment environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | `my-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID | `1:123:web:abc` |
| `VITE_FIREBASE_DATABASE_URL` | RTDB URL | `https://project-default-rtdb.firebaseio.com` |

**Important Notes:**

- Vite requires `VITE_` prefix for environment variables
- These values are embedded in the build (they become public)
- Firebase security is handled by security rules, not hidden keys
- Never commit `.env` file to git

### Security Best Practices

1. **Firebase Security Rules**: Your primary security layer
2. **Authentication Required**: All operations require login
3. **Rate Limiting**: Firebase provides automatic rate limiting
4. **CORS**: Firebase handles CORS automatically
5. **HTTPS**: Automatic with Firebase Hosting and Vercel

## Troubleshooting

### Issue: "Build failed"

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Issue: "Firebase project not found"

**Solution:**
```bash
# Check .firebaserc
cat .firebaserc

# Re-initialize if needed
firebase use your-project-id
```

### Issue: "Environment variables not working"

**Vercel:**
```bash
# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

**Firebase:** Environment variables are in your `.env` file and must be present during build.

### Issue: "Permission denied" errors in production

**Solution:**
1. Check Firebase Console → Firestore → Rules
2. Verify rules are deployed: `firebase deploy --only firestore:rules,database`
3. Check browser console for specific permission errors
4. Ensure user is authenticated

### Issue: "Shapes not syncing in production"

**Solution:**
1. Open browser console on both clients
2. Check for Firebase connection errors
3. Verify Firebase config in deployed app
4. Check Network tab for failed requests
5. Verify Firestore and Realtime Database are enabled in Firebase Console

### Issue: "White screen in production"

**Solution:**
```bash
# Check for build errors
npm run build

# Test production build locally
npm run preview

# Check browser console for errors
# Verify all environment variables are set
```

### Issue: "Deployment succeeded but app doesn't load"

**Solution:**
1. Check Firebase Console → Hosting → Deployment history
2. Verify the correct files are deployed
3. Check that `dist` folder contains `index.html` and assets
4. Clear browser cache and try again
5. Check for JavaScript console errors

## Monitoring and Maintenance

### Firebase Console Monitoring

Monitor your app's health:

1. **Authentication**: Track user signups and logins
2. **Firestore**: Monitor read/write operations
3. **Realtime Database**: Track concurrent connections
4. **Hosting**: View traffic and bandwidth usage

### Setting Up Alerts

1. Go to Firebase Console → Your Project
2. Click the gear icon → Project settings
3. Navigate to Integrations
4. Set up Slack/Email notifications for:
   - High error rates
   - Unusual traffic
   - Quota warnings

### Cost Monitoring

Firebase Free Tier includes:
- Authentication: Unlimited
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Realtime Database: 100 simultaneous connections, 10GB bandwidth
- Hosting: 10GB storage, 360MB/day bandwidth

Monitor usage:
1. Firebase Console → Usage and billing
2. Set budget alerts
3. Upgrade to Blaze (pay-as-you-go) if needed

## Rollback Procedure

### Firebase Hosting Rollback

```bash
# List previous versions
firebase hosting:channel:list

# Rollback to previous version via Console
# 1. Firebase Console → Hosting
# 2. Find previous version
# 3. Click "..." → "Rollback"
```

### Vercel Rollback

1. Go to vercel.com → Your project
2. Click "Deployments"
3. Find previous successful deployment
4. Click "..." → "Promote to Production"

## CI/CD Setup (Optional)

### GitHub Actions for Firebase

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

### Automatic Vercel Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview
- Pull requests → Preview with comment

## Support and Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

## Quick Command Reference

```bash
# Build
npm run build

# Test production build locally
npm run preview

# Deploy to Firebase
firebase deploy

# Deploy to Vercel
vercel --prod

# Deploy only rules
firebase deploy --only firestore:rules,database

# View Firebase logs
firebase functions:log

# View Vercel logs
vercel logs
```

---

**Deployment Complete!** 🎉

Your CollabCanvas app is now live and ready for users to collaborate in real-time!

