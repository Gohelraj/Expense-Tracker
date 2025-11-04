# Gmail Integration Setup

This document explains how to set up Gmail integration for automatic expense parsing from bank transaction emails.

## Overview

The application supports two modes for Gmail integration:
- **Replit Environment**: Uses Replit's built-in Gmail connector (automatic setup)
- **Local Development**: Uses standard Gmail API with OAuth 2.0

## Option 1: Replit Environment

If you're running this application on Replit:

**Note**: Replit Gmail connector integration requires additional setup through the Replit integrations system. The application will detect the Replit environment and skip polling if Gmail is not configured.

For now, it's recommended to use Option 2 (Local Development) even on Replit by setting the required environment variables in Replit Secrets.

## Option 2: Local Development

For local development, you'll need to create Gmail API credentials:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Note your Project ID

### Step 2: Enable Gmail API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click **Enable**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: External (for personal use)
   - App name: "Expense Tracker"
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `gmail.readonly`
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Expense Tracker Local"
   - Authorized redirect URIs: `http://localhost:5000/auth/gmail/callback`
5. Click **Create**
6. Note your **Client ID** and **Client Secret**

### Step 4: Get Refresh Token

You'll need to generate a refresh token. Here's how:

1. Install the Google OAuth2 CLI tool or use the OAuth 2.0 Playground:
   - Visit [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Click the gear icon (⚙️) in the top right
   - Check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - Close the settings

2. In the left sidebar:
   - Select "Gmail API v1"
   - Check `https://www.googleapis.com/auth/gmail.readonly`
   - Click "Authorize APIs"
   - Sign in with your Google account
   - Click "Allow"

3. Click "Exchange authorization code for tokens"
4. Copy the **Refresh token** value

### Step 5: Set Environment Variables

Create a `.env` file in your project root (or add to your existing environment):

```bash
# Gmail API Credentials
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here
GMAIL_REFRESH_TOKEN=your-refresh-token-here
```

### Step 6: Start the Application

```bash
npm run dev
```

The email polling service will start automatically and check your Gmail inbox every 5 minutes for new bank transaction emails.

## How It Works

1. **Automatic Polling**: Every 5 minutes, the app checks your Gmail inbox
2. **Bank Email Filtering**: Only processes emails from known Indian bank domains:
   - HDFC Bank
   - ICICI Bank
   - State Bank of India (SBI)
   - Axis Bank
   - Yes Bank
   - Kotak Mahindra Bank
   - And more...
3. **Transaction Parsing**: Extracts amount, merchant, date, and payment method
4. **Auto-categorization**: Assigns categories based on merchant keywords
5. **Expense Creation**: Automatically creates expenses in your tracker
6. **Duplicate Prevention**: Tracks processed emails to avoid duplicates

## Viewing Sync Status

Go to **Settings** page to see:
- Connection status
- Last sync time
- Manual sync button
- List of recognized banks

## Troubleshooting

### "Gmail service not initialized"

This means the environment variables are missing or incorrect. Check:
- `GMAIL_CLIENT_ID` is set
- `GMAIL_CLIENT_SECRET` is set
- `GMAIL_REFRESH_TOKEN` is set
- No extra spaces or quotes in the values

### "Failed to fetch emails"

Possible causes:
- Invalid credentials
- Expired refresh token (regenerate using OAuth playground)
- Gmail API not enabled in Google Cloud Console
- Missing Gmail API scopes

### No expenses being created

Check:
- Emails are from recognized bank domains
- Email format matches expected patterns (test in Settings > Test Email Parser)
- Check server logs for parsing errors

## Security Notes

- Never commit `.env` file to version control
- Keep your Gmail credentials secure
- The app only reads emails (read-only access)
- Processed email IDs are stored to prevent duplicates
- No email content is stored permanently
