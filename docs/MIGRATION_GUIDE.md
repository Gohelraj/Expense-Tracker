# Migration Guide: Dynamic Bank Patterns

## Overview

The expense tracker now supports managing bank patterns and categories from the UI. However, the email parser (`server/email-parser.ts`) still uses hardcoded patterns. This guide explains how to migrate to using database-driven patterns.

## Current State

- ✅ Database tables created for `bank_patterns` and `categories`
- ✅ API endpoints for CRUD operations
- ✅ UI components for management
- ✅ Default data seeded
- ⚠️ Email parser still uses hardcoded patterns

## Future Enhancement: Dynamic Email Parser

To make the email parser use database patterns instead of hardcoded ones, you'll need to:

### 1. Update EmailParser Class

Modify `server/email-parser.ts` to load patterns from the database:

```typescript
export class EmailParser {
  private bankPatterns: Map<string, BankPattern> = new Map();
  private categories: Map<string, Category> = new Map();

  async initialize() {
    // Load bank patterns from database
    const banks = await storage.getBankPatterns();
    banks.forEach(bank => {
      if (bank.isActive === 'true') {
        this.bankPatterns.set(bank.domain, bank);
      }
    });

    // Load categories from database
    const cats = await storage.getCategories();
    cats.forEach(cat => {
      if (cat.isActive === 'true') {
        this.categories.set(cat.name, cat);
      }
    });
  }

  async parseEmail(subject: string, body: string, sender: string, emailDate?: Date) {
    // Use this.bankPatterns instead of hardcoded patterns
    // Convert JSON strings to RegExp objects
  }
}
```

### 2. Initialize Parser on Startup

In `server/index.ts` or where the email parser is used:

```typescript
import { emailParser } from "./email-parser";

// Initialize parser with database patterns
await emailParser.initialize();

// Optionally, refresh patterns periodically
setInterval(async () => {
  await emailParser.initialize();
}, 5 * 60 * 1000); // Refresh every 5 minutes
```

### 3. Convert JSON Patterns to RegExp

When loading patterns from the database:

```typescript
private parseRegexPattern(pattern: string): RegExp | null {
  try {
    // Pattern format: /regex/flags
    const match = pattern.match(/^\/(.+)\/([gimuy]*)$/);
    if (match) {
      return new RegExp(match[1], match[2]);
    }
    return null;
  } catch (error) {
    console.error('Invalid regex pattern:', pattern, error);
    return null;
  }
}
```

### 4. Update Category Matching

Use database categories for auto-categorization:

```typescript
private categorizeTransaction(merchant: string, text: string): string {
  const lowerMerchant = merchant.toLowerCase();
  const lowerText = text.toLowerCase();

  for (const [name, category] of this.categories) {
    const keywords = JSON.parse(category.keywords);
    for (const keyword of keywords) {
      if (lowerMerchant.includes(keyword) || lowerText.includes(keyword)) {
        return name;
      }
    }
  }

  return 'Other';
}
```

## Benefits of Migration

1. **No Code Changes**: Update patterns without redeploying
2. **User Control**: Non-technical users can manage patterns
3. **Bank-Specific**: Different patterns for different banks
4. **Easy Testing**: Test patterns via API before activating
5. **Version Control**: Track pattern changes over time

## Backward Compatibility

Keep the hardcoded patterns as fallback:

```typescript
async initialize() {
  try {
    // Try loading from database
    await this.loadFromDatabase();
  } catch (error) {
    console.warn('Failed to load patterns from database, using defaults');
    this.loadHardcodedPatterns();
  }
}
```

## Testing Strategy

1. **Unit Tests**: Test pattern parsing and regex conversion
2. **Integration Tests**: Test with real email samples
3. **Gradual Rollout**: Enable for one bank at a time
4. **Monitoring**: Log parsing success/failure rates
5. **Rollback Plan**: Keep hardcoded patterns as fallback

## Current Workaround

Until the migration is complete, you can:

1. Use the Settings UI to document your bank patterns
2. Manually update `server/email-parser.ts` with patterns from the database
3. Test patterns using the `/api/email/parse` endpoint
4. Keep patterns in sync between UI and code

## Notes

- The current implementation works well with hardcoded patterns
- Migration to dynamic patterns is optional but recommended for production
- Consider caching patterns in memory and refreshing periodically
- Add validation to ensure regex patterns are valid before saving
