# Password Reset Feature

This document describes the forgot password and reset password functionality implemented in the Expense Tracker application.

## Overview

Users can now reset their password if they forget it by requesting a password reset link via email. The system sends a secure, time-limited token that allows users to set a new password.

## Features

- **Forgot Password**: Users can request a password reset link by entering their email address
- **Email Notification**: Reset link is sent via email with a secure token
- **Token Expiration**: Reset tokens expire after 1 hour for security
- **Secure Reset**: Users can set a new password using the token
- **Email Enumeration Protection**: System doesn't reveal whether an email exists in the database

## User Flow

1. User clicks "Forgot password?" on the login page
2. User enters their email address
3. System sends a password reset email (if account exists)
4. User clicks the reset link in the email
5. User enters and confirms their new password
6. System validates the token and updates the password
7. User is redirected to login with their new password

## Technical Implementation

### Database Schema

Added the following fields to the `users` table:
- `email` (text, unique): User's email address
- `resetToken` (text): Secure token for password reset
- `resetTokenExpiry` (timestamp): Expiration time for the reset token

### API Endpoints

#### POST /api/auth/forgot-password
Request a password reset link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### POST /api/auth/reset-password
Reset password using a valid token.

**Request Body:**
```json
{
  "token": "secure-reset-token",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

#### GET /api/auth/verify-reset-token/:token
Verify if a reset token is valid and not expired.

**Response:**
```json
{
  "valid": true
}
```

### Email Service

The email service uses Gmail API to send password reset emails. It requires the following environment variables:

- `GMAIL_CLIENT_ID`: OAuth2 client ID
- `GMAIL_CLIENT_SECRET`: OAuth2 client secret
- `GMAIL_REFRESH_TOKEN`: OAuth2 refresh token
- `APP_URL`: Base URL of the application (defaults to http://localhost:5000)

### UI Pages

#### /forgot-password
- Email input form
- Success message after submission
- Link back to login page

#### /reset-password
- Token verification on page load
- New password and confirm password fields
- Success message with auto-redirect to login
- Error handling for invalid/expired tokens

## Security Features

1. **Token Generation**: Uses cryptographically secure random tokens (32 bytes)
2. **Token Expiration**: Tokens expire after 1 hour
3. **One-Time Use**: Tokens are cleared after successful password reset
4. **Email Enumeration Protection**: Same response whether email exists or not
5. **Password Hashing**: Passwords are hashed using bcrypt before storage
6. **HTTPS Recommended**: Use HTTPS in production for secure token transmission

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Gmail API credentials (for sending reset emails)
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token

# Application URL (for reset links)
APP_URL=http://localhost:5000
```

### Email Template

The password reset email includes:
- Professional HTML template with branding
- Clear call-to-action button
- Plain text fallback
- Expiration notice
- Security notice for unsolicited requests

## Testing

### Manual Testing

1. **Forgot Password Flow:**
   - Navigate to `/login`
   - Click "Forgot password?"
   - Enter a registered email
   - Check email inbox for reset link
   - Click the link or copy URL

2. **Reset Password Flow:**
   - Open reset link from email
   - Verify token validation works
   - Enter new password (min 6 characters)
   - Confirm password matches
   - Submit and verify redirect to login
   - Login with new password

3. **Error Cases:**
   - Try expired token (wait 1 hour)
   - Try invalid token
   - Try mismatched passwords
   - Try weak password (< 6 characters)

## Troubleshooting

### Email Not Sending

1. Verify Gmail API credentials are set correctly
2. Check that email service initialized successfully (check server logs)
3. Ensure Gmail API is enabled in Google Cloud Console
4. Verify refresh token is still valid

### Token Validation Fails

1. Check database for `resetToken` and `resetTokenExpiry` fields
2. Verify token hasn't expired (1 hour limit)
3. Ensure token wasn't already used
4. Check server logs for errors

### Database Issues

If you encounter database errors:
```bash
npm run db:push
```

This will sync the schema changes to your database.

## Future Enhancements

- Rate limiting for forgot password requests
- Email verification for new accounts
- Two-factor authentication
- Password strength meter
- Password history (prevent reuse)
- Account lockout after failed attempts
- SMS-based password reset option
