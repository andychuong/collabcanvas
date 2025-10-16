# AI Chat - Environment Variable Update

## Summary of Changes

The AI Chat feature has been updated to use environment variables for the OpenAI API key instead of user input through the UI. This provides better security and centralized configuration management.

## What Changed

### Before
- Users entered their OpenAI API key through a settings panel in the UI
- API key was stored in browser's localStorage
- Settings icon and panel in chat interface

### After
- OpenAI API key configured via environment variable (`VITE_OPENAI_API_KEY`)
- API key stored in `.env` file (excluded from Git)
- Simplified UI without settings panel
- Automatic welcome message on chat open

## Files Modified

### Code Changes

**1. `src/components/AIChat.tsx`**
- Removed settings panel UI
- Removed API key state management
- Removed localStorage operations
- Simplified chat interface
- Updated constructor call to CanvasAIAgent

**2. `src/services/aiAgent.ts`**
- Updated constructor to read from environment variable
- Removed `apiKey` parameter
- Added validation and error message for missing API key
- Uses `import.meta.env.VITE_OPENAI_API_KEY`

### Documentation Updates

**3. `ENV_SETUP.md`** (New)
- Complete guide for environment variable setup
- Instructions for both Firebase and OpenAI configuration
- Security best practices
- Troubleshooting section

**4. `QUICKSTART_AI_CHAT.md`**
- Updated setup steps to use environment variables
- Removed UI-based configuration instructions
- Updated troubleshooting for environment variable issues

**5. `AI_CHAT_GUIDE.md`**
- Updated setup section
- Updated troubleshooting section
- Updated privacy & security section
- Added environment variable loading issues

**6. `README.md`**
- Added `VITE_OPENAI_API_KEY` to environment variables section
- Updated AI Chat usage instructions
- Added reference to ENV_SETUP.md

## Setup Instructions

### New Users

1. Create `.env` file in project root:
   ```env
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```

2. Get API key from [OpenAI](https://platform.openai.com/api-keys)

3. Restart dev server:
   ```bash
   npm run dev
   ```

### Existing Users Migrating

If you were using the old localStorage approach:

1. Your API key is currently in browser localStorage
2. Copy it from localStorage (browser DevTools → Application → Local Storage → `openai_api_key`)
3. Add it to `.env` file as shown above
4. Restart your dev server
5. The localStorage key is no longer used (but can remain)

## Benefits of This Change

### Security
✅ API key not exposed in browser
✅ Centralized configuration management
✅ Environment-specific keys (dev/staging/prod)
✅ No risk of localStorage leaks

### User Experience
✅ Simpler UI without settings panel
✅ One-time setup (not per-browser)
✅ No need to re-enter key
✅ Immediate welcome message

### Development
✅ Standard environment variable pattern
✅ Easier deployment configuration
✅ Better secret management
✅ Consistent with Firebase config

## Migration Guide

### Local Development

No action needed if you're setting up fresh. If migrating:

1. Create `.env` file with your API key
2. Restart dev server
3. Old localStorage key ignored but harmless

### Production/Deployment

For Firebase Hosting or other platforms:

1. **Option A**: Use deployment platform's environment variable feature
2. **Option B**: Set variables in CI/CD pipeline
3. **Option C**: Use `.env.production` file (not committed to Git)

Example for Firebase Hosting:
```bash
# Set in Firebase Function configuration
firebase functions:config:set openai.key="sk-..."
```

## Environment Variable Format

```env
# Required format
VITE_OPENAI_API_KEY=sk-proj-...

# Must start with VITE_ (Vite requirement)
# Must be exact: VITE_OPENAI_API_KEY
# Case-sensitive
```

## Troubleshooting

### "OpenAI API key not configured"
→ Check `.env` file exists and has `VITE_OPENAI_API_KEY`
→ Restart dev server

### Variable not loading
→ Ensure it starts with `VITE_`
→ Check .env file is in project root
→ No quotes around value in .env file

### Still seeing settings panel
→ Clear browser cache and reload
→ Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Security Best Practices

1. ✅ Never commit `.env` file (already in `.gitignore`)
2. ✅ Use different keys for dev/prod
3. ✅ Rotate keys regularly
4. ✅ Set spending limits in OpenAI dashboard
5. ✅ Monitor usage for unusual activity

## Testing

After updating:

1. ✅ Verify `.env` file has correct variable
2. ✅ Restart dev server
3. ✅ Open AI Chat (no settings panel visible)
4. ✅ Welcome message appears automatically
5. ✅ Test a command: "Create a red circle at 300, 200"
6. ✅ Check browser console for errors

## Build Verification

```bash
npm run build
```

Should complete without errors. The environment variable is bundled into the build at compile time.

## Additional Resources

- [ENV_SETUP.md](./ENV_SETUP.md) - Detailed setup guide
- [QUICKSTART_AI_CHAT.md](./QUICKSTART_AI_CHAT.md) - Quick start guide
- [AI_CHAT_GUIDE.md](./AI_CHAT_GUIDE.md) - Complete feature documentation

## Questions?

See [ENV_SETUP.md](./ENV_SETUP.md) for comprehensive configuration instructions.

---

**Update Date**: October 16, 2025  
**Reason**: Improved security and centralized configuration management  
**Breaking Change**: Requires environment variable setup (previously optional UI configuration)

