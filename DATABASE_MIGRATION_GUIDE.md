# Database Migration Guide - Groups Integration

## Quick Answer: Do You Need to Migrate?

Run this command to check:

```bash
npm install
npm run check-db
```

This will tell you if you need to migrate your database.

---

## Scenarios

### **Scenario 1: Fresh Installation (No Existing Users)** ✅

**You DON'T need to change anything manually!**

✅ Just deploy the code and security rules:
```bash
# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only database

# Deploy application
npm run build
firebase deploy --only hosting
```

Users can register with group names and start using the app immediately.

---

### **Scenario 2: Existing Users BUT No Data** ⚠️

**You have two options:**

#### **Option A: Fresh Start (Recommended)**
1. Delete existing user accounts from Firebase Console
2. Deploy the new code
3. Have users re-register with group names

#### **Option B: Migrate Existing Users**
1. Run the migration script (see below)
2. Existing users will be assigned to "default" group
3. They'll need to use "default" as their group name when logging in

---

### **Scenario 3: Existing Users AND Existing Canvas Data** ⚠️⚠️

**You MUST migrate the database!**

Follow the migration steps below.

---

## How to Check Your Database State

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Ensure Environment Variables are Set
Your `.env` file should have all Firebase config variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
```

### Step 3: Check Database State
```bash
npm run check-db
```

**Output will tell you:**
- How many users exist
- Which users have/don't have groupId field
- If there's canvas data in the old location
- Whether migration is needed

---

## Migration Process

### Before You Start

⚠️ **IMPORTANT: Create a Backup!**

1. Go to Firebase Console
2. Firestore Database → Export/Import
3. Export your database
4. Realtime Database → Download as JSON

### Step 1: Run Migration Script

```bash
npm run migrate
```

This will:
1. Add `groupId: "default"` to all existing users
2. Create a "default" group
3. Copy canvas shapes from `/canvases/main-canvas/` to `/groups/default/canvases/main-canvas/`

**The script will ask for confirmation before making changes.**

### Step 2: Verify Migration

Check in Firebase Console:

**Firestore:**
- `/users/{userId}` - All users should have `groupId: "default"`
- `/groups/default` - Should exist with memberCount
- `/groups/default/canvases/main-canvas/shapes/` - Should contain all shapes

**Realtime Database:**
- Old data at `/cursors`, `/presence`, `/selections` (will be unused)
- New data will go to `/groups/default/cursors`, etc.

### Step 3: Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database
```

### Step 4: Deploy Application

```bash
npm run build
firebase deploy --only hosting
```

### Step 5: Test

1. Login with an existing user account
2. **Important:** Use "default" as the group name (or "Default Group" - case doesn't matter)
3. Verify you can see the existing canvas
4. Create/edit shapes to ensure it works

### Step 6: Clean Up (Optional)

After verifying everything works, you can manually delete old data:

**In Firestore:**
- Delete `/canvases/main-canvas/` collection

**In Realtime Database:**
- Delete `/cursors` node
- Delete `/presence` node
- Delete `/selections` node

---

## Migration Script Details

### What the Script Does

```javascript
// For each user without groupId:
await updateDoc(userRef, {
  groupId: 'default'
});

// Create default group:
await setDoc(doc(db, 'groups', 'default'), {
  id: 'default',
  name: 'Default Group',
  createdAt: Date.now(),
  memberCount: userCount
});

// For each shape in old location:
const oldShape = await getDoc(doc(db, 'canvases', 'main-canvas', 'shapes', shapeId));
await setDoc(doc(db, 'groups', 'default', 'canvases', 'main-canvas', 'shapes', shapeId), oldShape.data());
```

### What Happens to Old Data

- **Users:** Get `groupId` field added (existing data preserved)
- **Canvas Shapes:** Copied to new location (old shapes remain)
- **RTDB Data:** Left in place (will naturally expire as users reconnect)

### Rollback Plan

If something goes wrong:

1. **Restore from backup** (Firebase Console → Import)
2. **Revert code changes** (git checkout previous version)
3. **Redeploy old version**

---

## After Migration: User Instructions

**For Existing Users:**

When logging in with the new system:
1. Enter your email and password as usual
2. **Group Name:** Enter `default` (or "Default Group")
3. You'll see your existing canvas

**For New Users:**

1. Register with a new group name (e.g., "Marketing Team")
2. They'll get their own private canvas
3. They won't see the "default" group's data

---

## Troubleshooting

### "No migration needed" but users can't login

**Problem:** Users exist but authentication is failing

**Solution:**
1. Check if users have `groupId` field in Firestore
2. If not, run `npm run migrate`
3. Ensure they're using "default" as group name

### Migration script fails with "Permission denied"

**Problem:** Security rules are blocking the script

**Solution:**
1. The script uses Firebase Admin SDK client-side (has same permissions as authenticated user)
2. Temporarily modify Firestore rules to allow writes:
```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```
3. Run migration
4. Deploy secure rules after migration

### "Cannot find module 'dotenv'"

**Problem:** Dependencies not installed

**Solution:**
```bash
npm install
```

### Users see empty canvas after migration

**Problem:** Shapes weren't migrated or users are in wrong group

**Solution:**
1. Check `/groups/default/canvases/main-canvas/shapes/` in Firestore
2. Ensure user is using "default" as group name
3. Re-run migration script if shapes are missing

---

## Manual Migration (Alternative)

If the script doesn't work, you can migrate manually:

### In Firebase Console:

1. **Add groupId to Users:**
   - Go to Firestore → users collection
   - For each user document, add field:
     - Field: `groupId`
     - Type: `string`
     - Value: `default`

2. **Create Default Group:**
   - Go to Firestore → Create Collection → "groups"
   - Document ID: `default`
   - Fields:
     ```
     id: "default" (string)
     name: "Default Group" (string)
     createdAt: <timestamp> (number)
     memberCount: <number of users> (number)
     ```

3. **Copy Canvas Shapes:**
   - Export old shapes: `/canvases/main-canvas/shapes/`
   - Import to new location: `/groups/default/canvases/main-canvas/shapes/`

---

## Summary

**No existing data?** 
→ Deploy and go! No migration needed.

**Existing users but no canvas data?**
→ Either have users re-register OR run migration script.

**Existing users AND canvas data?**
→ Run migration script, test thoroughly, then deploy.

**Questions?**
→ Run `npm run check-db` to see your specific situation.

---

## Support Commands

```bash
# Check if migration is needed
npm run check-db

# Run migration
npm run migrate

# Deploy security rules only
firebase deploy --only firestore:rules
firebase deploy --only database

# Deploy everything
firebase deploy
```

---

Good luck with your migration! 🚀

