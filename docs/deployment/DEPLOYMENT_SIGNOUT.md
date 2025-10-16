# Deployment with Automatic User Sign-Out

## How It Works

The app now includes a version check system that **automatically signs out all users** when you deploy a new version. This ensures users get the latest code and clears any cached state.

## How to Use

### Before Each Deployment:

1. **Update the version number** in `src/config/appVersion.ts`:
   ```typescript
   export const APP_VERSION = '1.0.1'; // Increment this
   ```

2. **Build and deploy** as normal:
   ```bash
   npm run build
   firebase deploy
   ```

### What Happens:

1. When users load the app after deployment, the version check runs
2. If their stored version doesn't match the new version:
   - User is automatically signed out
   - `localStorage` is cleared
   - They're redirected to the login page
3. The new version number is stored

### Version Numbering:

Use semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Example Workflow:

```bash
# 1. Edit the version
nano src/config/appVersion.ts
# Change: export const APP_VERSION = '1.0.1';

# 2. Commit your changes
git add .
git commit -m "v1.0.1: Fixed cursor sync during drag"

# 3. Deploy
npm run build
firebase deploy

# 4. All active users will be signed out on next page load ✅
```

## Benefits

- ✅ Ensures all users get fresh code
- ✅ Clears any stale cached data
- ✅ Prevents version conflicts
- ✅ Simple to use (just update one number)

## Optional: Don't Sign Out Users

If you want to deploy **without** signing users out, just **keep the same version number**. The version check will pass and users stay logged in.

