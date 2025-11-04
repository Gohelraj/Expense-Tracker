# Settings Guide

This guide explains how to use the Settings page to manage categories and bank patterns for your expense tracker.

## Category Management

Categories help organize your expenses and enable automatic categorization based on merchant names and keywords.

### Creating a Category

1. Navigate to **Settings** from the sidebar
2. Click on the **Categories** tab
3. Click **Add Category** button
4. Fill in the form:
   - **Category Name**: The display name (e.g., "Food & Dining")
   - **Icon**: An emoji to represent the category (e.g., 🍔)
   - **Color**: A hex color code for visual identification
   - **Keywords**: Comma-separated keywords for auto-categorization (e.g., "swiggy, zomato, restaurant")
5. Click **Create**

### Editing a Category

1. Find the category card you want to edit
2. Click the pencil icon
3. Update the fields as needed
4. Click **Update**

### Deleting a Category

1. Find the category card you want to delete
2. Click the trash icon
3. Confirm the deletion

### How Keywords Work

When an expense is created (manually or from email), the system checks the merchant name and transaction details against all category keywords. The first matching category is automatically assigned.

**Example:**
- Category: "Food & Dining"
- Keywords: "swiggy, zomato, restaurant, cafe"
- Merchant: "SWIGGY BANGALORE"
- Result: Automatically categorized as "Food & Dining"

## Bank Pattern Management

Bank patterns define regex patterns used to extract transaction information from bank notification emails.

### Understanding Bank Patterns

Each bank has different email formats. Bank patterns help the system identify:
- **Amount**: The transaction amount
- **Merchant**: Where the money was spent
- **Date**: When the transaction occurred
- **Payment Method**: How the payment was made (UPI, Card, etc.)

### Creating a Bank Pattern

1. Navigate to **Settings** from the sidebar
2. Click on the **Bank Patterns** tab
3. Click **Add Bank** button
4. Fill in the form:
   - **Bank Name**: Display name (e.g., "HDFC Bank")
   - **Email Domain**: Domain identifier in sender email (e.g., "hdfcbank")
   - **Amount Patterns**: Regex patterns to extract amount (one per line)
   - **Merchant Patterns**: Regex patterns to extract merchant name (one per line)
   - **Date Patterns**: Regex patterns to extract transaction date (one per line)
   - **Payment Method Patterns**: Regex patterns to extract payment method (one per line)
5. Click **Create**

### Regex Pattern Format

Patterns should be written as JavaScript regex strings:

```
/pattern/flags
```

**Example Amount Pattern:**
```
/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{2})?)/i
```

This pattern matches:
- INR 1,234.56
- Rs. 1234.56
- ₹1234.56

**Example Merchant Pattern:**
```
/Merchant\s+Name[:\s]*([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i
```

This pattern extracts the merchant name from text like:
- "Merchant Name: AMAZON"
- "Merchant Name SWIGGY"

### Editing a Bank Pattern

1. Find the bank in the list
2. Click to expand the accordion
3. Click the pencil icon
4. Update the patterns as needed
5. Click **Update**

### Deleting a Bank Pattern

1. Find the bank in the list
2. Click to expand the accordion
3. Click the trash icon
4. Confirm the deletion

### Testing Bank Patterns

After creating or updating bank patterns, you can test them using the Email Parse API:

```bash
POST /api/email/parse
{
  "subject": "Transaction alert",
  "body": "Rs. 500 spent at SWIGGY on 01-01-2024",
  "sender": "alerts@hdfcbank.com"
}
```

## Default Data

The system comes pre-configured with:

### Default Categories
- Food & Dining 🍔
- Transport 🚗
- Shopping 🛍️
- Bills & Utilities 💡
- Entertainment 🎬
- Healthcare 🏥
- Groceries 🛒
- Other 📦

### Default Bank Patterns
- HDFC Bank
- ICICI Bank
- State Bank of India
- Axis Bank
- Kotak Mahindra Bank

You can modify or delete these defaults and add your own as needed.

## Best Practices

### For Categories
1. Keep category names clear and descriptive
2. Use relevant emojis for quick visual identification
3. Add comprehensive keywords including common merchant names
4. Use lowercase keywords for better matching
5. Include variations and abbreviations (e.g., "restaurant, resto, dining")

### For Bank Patterns
1. Test patterns with real email samples before deploying
2. Order patterns from most specific to most general
3. Use case-insensitive flags (`/i`) for better matching
4. Include multiple pattern variations to handle different email formats
5. Regularly update patterns when banks change their email formats

## Troubleshooting

### Expenses Not Auto-Categorizing
- Check if keywords match the merchant name
- Keywords are case-insensitive but must be exact substring matches
- Add more keyword variations to improve matching

### Email Parsing Not Working
- Verify the bank domain matches the sender email
- Test patterns using the parse API endpoint
- Check if patterns have proper regex syntax
- Ensure patterns capture the correct groups (use parentheses)

### Pattern Syntax Errors
- Escape special regex characters: `\` `(` `)` `[` `]` `{` `}` `+` `*` `?` `^` `$` `|` `.`
- Use double backslashes in JSON: `\\d` instead of `\d`
- Test patterns in a regex tester before adding them
