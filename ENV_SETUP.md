# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_DATABASE_URL=your_firebase_database_url

# OpenAI Configuration (Required for AI Chat Assistant)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click on the gear icon → Project settings
4. Scroll down to "Your apps" section
5. Copy the configuration values to your `.env` file

### 2. OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Give it a name (e.g., "CollabCanvas")
5. Copy the key (starts with `sk-`)
6. Add it to your `.env` file as `VITE_OPENAI_API_KEY`

**Important**: 
- Keep your API key secure and never commit it to version control
- The `.env` file is already in `.gitignore` for safety
- You'll need credits in your OpenAI account for the AI Chat feature to work

### 3. Cost Considerations

The AI Chat feature uses OpenAI's GPT-4 Turbo model:
- Approximate cost per command: $0.01 - $0.05 USD
- You only pay for what you use
- Monitor usage at: [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set spending limits in your OpenAI account settings

## Development vs Production

### Local Development
Use a `.env` file in your project root (not committed to Git).

### Production (Firebase Hosting)
Set environment variables in your deployment pipeline or use Firebase Hosting environment configuration:

1. Use a `.env.production` file (not committed)
2. Or set variables in your CI/CD pipeline
3. For Firebase Hosting, consider using Firebase Functions config

## Troubleshooting

### "OpenAI API key not configured" Error
- Check that `VITE_OPENAI_API_KEY` is set in your `.env` file
- Ensure the variable name is exactly `VITE_OPENAI_API_KEY` (case-sensitive)
- Restart your development server after adding the variable
- Check that the key starts with `sk-`

### Firebase Connection Issues
- Verify all Firebase variables are correctly copied
- Check that your Firebase project is active
- Ensure Authentication and Firestore are enabled in Firebase Console

### Variables Not Loading
- Restart your dev server (`npm run dev`)
- Check that your `.env` file is in the project root
- Ensure variable names start with `VITE_` (Vite requirement)
- Check for typos in variable names

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different keys for development and production**
3. **Rotate API keys regularly**
4. **Set spending limits** in your OpenAI account
5. **Monitor usage** to detect unusual activity
6. **Use environment-specific variables** for different deployments

## Example `.env` File

```env
# Firebase
VITE_FIREBASE_API_KEY=AIzaSyA1234567890abcdefghijklmnopqrstu
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project-12345
VITE_FIREBASE_STORAGE_BUCKET=my-project-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
VITE_FIREBASE_DATABASE_URL=https://my-project-12345-default-rtdb.firebaseio.com

# OpenAI
VITE_OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP
```

## Deployment Notes

For production deployment:

1. **Never** hardcode API keys in your source code
2. Use environment variables or secrets management
3. Consider using different OpenAI projects for dev/staging/prod
4. Set up billing alerts in OpenAI dashboard
5. Review Firebase security rules before deployment

## Getting Help

If you encounter issues:
1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review [OpenAI API Documentation](https://platform.openai.com/docs)
3. Ensure all environment variables are set correctly
4. Check the browser console for error messages

