# Agora Video Call Fix Instructions

## Problem Summary

You're experiencing an "invalid vendor key" error when trying to initialize video calls, even though your App ID appears to have the correct format (32 characters).

## Root Cause

This error typically occurs when Agora's servers don't recognize your App ID, which can happen for several reasons:

1. The Agora project is not properly configured or has been suspended
2. The App ID belongs to a different Agora account
3. The project has billing issues or policy violations

## Immediate Solution

### Step 1: Verify Current Configuration

1. Visit the debug page: http://localhost:3000/agora-debug
2. Run all tests to confirm the issue

### Step 2: Create a New Agora Project (Recommended Fix)

1. Go to [Agora Dashboard](https://console.agora.io/)
2. Sign in with your Agora account
3. In the left sidebar, click "Projects"
4. Click the "Create Project" button
5. Choose "App ID + App Certificate (Recommended)"
6. Give your project a name (e.g., "MediConnect Video Calls")
7. Click "Create"

### Step 3: Update Your Environment Variables

1. Copy the new App ID and App Certificate from your Agora dashboard
2. Update your `.env` file with the new credentials:

```env
NEXT_PUBLIC_AGORA_APP_ID=your_new_32_char_app_id_here
AGORA_APP_CERTIFICATE=your_new_32_char_certificate_here
```

### Step 4: Restart Your Development Server

```bash
npm run dev
# or
yarn dev
```

### Step 5: Test the Video Call

1. Go to your patient dashboard
2. Schedule or join a video call appointment
3. The error should now be resolved

## Alternative Solutions (If the above doesn't work)

### Check Project Settings

1. In Agora Dashboard, select your project
2. Go to "Settings" → "Basic Information"
3. Ensure "Video SDK" is enabled
4. Check that the project status is "Active"

### Verify App ID Ownership

1. Make sure you're logged into the correct Agora account
2. Verify that the App ID belongs to your account and not copied from another source

### Check for Billing Issues

1. Go to "Billing" in the Agora Dashboard
2. Ensure your account is in good standing
3. Check if there are any payment issues

## Debugging Tools

We've added several debugging tools to help you diagnose issues:

1. **Agora Debug Page**: http://localhost:3000/agora-debug

   - Validates project configuration
   - Tests token generation
   - Provides troubleshooting guidance

2. **API Endpoints**:
   - `/api/agora/validate-project` - Validates environment configuration
   - `/api/agora/test-token` - Tests token generation
   - `/api/agora/test-connection` - Tests basic connectivity

## Common Issues and Solutions

### Issue: "invalid vendor key" persists after creating new project

**Solution**: Double-check that you've updated both environment variables and restarted your server.

### Issue: Token generation fails

**Solution**: Verify that both App ID and Certificate are exactly 32 characters long and contain only hexadecimal characters.

### Issue: Video call connects but no video/audio

**Solution**: Check browser permissions for camera and microphone access.

## Support

If you continue to experience issues after following these steps:

1. Run the debug tool at http://localhost:3000/agora-debug
2. Check the browser console for detailed error messages
3. Contact Agora support with your App ID and error details
