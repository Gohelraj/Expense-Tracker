# Migration Guide: Fixing Transactions After Multi-User Support

## Issue

After commit `11c01195c4a0b55e10900ec9baaa741078c2b0ce`, transactions are not showing properly in the application.

## Root Cause

Commit 11c01195 added multi-user support with the following changes:
1. Added a required `userId` field to the `expenses` table
2. All API queries now filter expenses by the logged-in user's ID
3. Existing transactions in the database don't have a `userId` set (NULL values)

When users log in and try to view transactions, the API query filters for `WHERE userId = <current-user-id>`, but existing transactions have `NULL` userId, so they don't appear.

## Solution

Run the migration script to assign existing transactions to a user:

```bash
npx tsx server/migrate-expenses-to-user.ts
```

This script will:
1. Find all expenses with `NULL` userId
2. Assign them to the first user in the database
3. Display a summary of the changes

## Prerequisites

1. Ensure your `.env` file has a valid `DATABASE_URL` configured
2. Ensure at least one user exists in the database (create one by registering through the app)

## Manual Fix (Alternative)

If you prefer to assign expenses to a specific user, you can run this SQL query directly:

```sql
-- First, find your user ID
SELECT id, username FROM users;

-- Then update expenses (replace <USER_ID> with the actual user ID)
UPDATE expenses
SET user_id = '<USER_ID>'
WHERE user_id IS NULL;
```

## Verification

After running the migration:
1. Log in to the application
2. Navigate to the Transactions page
3. Your existing transactions should now be visible

## Future Migrations

For production deployments, consider:
1. Creating proper migration files using Drizzle Kit
2. Backing up your database before running migrations
3. Testing migrations in a staging environment first
