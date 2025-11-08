/**
 * Migration script to fix expenses after multi-user support was added.
 *
 * This script:
 * 1. Finds all expenses with NULL userId
 * 2. Assigns them to the first user in the database
 *
 * Run with: npx tsx server/migrate-expenses-to-user.ts
 */

import { config } from "dotenv";
import { db } from "./db";
import { expenses, users } from "@shared/schema";
import { isNull, sql } from "drizzle-orm";

// Load environment variables
config();

async function migrateExpenses() {
  try {
    console.log("🔍 Checking for expenses without userId...\n");

    // Get all users
    const allUsers = await db.select().from(users);

    if (allUsers.length === 0) {
      console.error("❌ No users found in database!");
      console.error("Please create a user first before running this migration.");
      process.exit(1);
    }

    console.log(`Found ${allUsers.length} user(s):`);
    allUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.username} (ID: ${user.id})`);
    });
    console.log();

    // Count expenses with NULL userId
    const nullUserIdExpenses = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(expenses)
      .where(isNull(expenses.userId));

    const count = nullUserIdExpenses[0]?.count || 0;

    if (count === 0) {
      console.log("✅ No expenses with NULL userId found!");
      console.log("All expenses are properly assigned to users.");
      return;
    }

    console.log(`⚠️  Found ${count} expense(s) with NULL userId`);
    console.log(`📝 Will assign them to user: ${allUsers[0].username} (${allUsers[0].id})\n`);

    // Update expenses to assign to first user
    const result = await db
      .update(expenses)
      .set({ userId: allUsers[0].id })
      .where(isNull(expenses.userId))
      .returning();

    console.log(`✅ Successfully updated ${result.length} expense(s)!`);
    console.log("Transactions should now be visible in the app.");

  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrateExpenses();
