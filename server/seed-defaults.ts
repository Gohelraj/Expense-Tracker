import "dotenv/config";
import { db } from "./db";
import { categories, bankPatterns } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultCategories = [
    {
        name: "Food & Dining",
        icon: "🍔",
        color: "#ef4444",
        keywords: JSON.stringify(["swiggy", "zomato", "restaurant", "cafe", "food", "dining", "burger", "pizza", "dominos", "mcdonald", "kfc", "subway"]),
        isActive: "true",
    },
    {
        name: "Transport",
        icon: "🚗",
        color: "#f59e0b",
        keywords: JSON.stringify(["uber", "ola", "rapido", "metro", "fuel", "petrol", "diesel", "parking", "taxi", "cab"]),
        isActive: "true",
    },
    {
        name: "Shopping",
        icon: "🛍️",
        color: "#8b5cf6",
        keywords: JSON.stringify(["amazon", "flipkart", "myntra", "ajio", "shopping", "mall", "store", "retail"]),
        isActive: "true",
    },
    {
        name: "Bills & Utilities",
        icon: "💡",
        color: "#06b6d4",
        keywords: JSON.stringify(["electricity", "water", "gas", "broadband", "mobile", "recharge", "bill payment", "utility"]),
        isActive: "true",
    },
    {
        name: "Entertainment",
        icon: "🎬",
        color: "#ec4899",
        keywords: JSON.stringify(["netflix", "prime", "hotstar", "spotify", "movie", "pvr", "inox", "cinema", "theatre"]),
        isActive: "true",
    },
    {
        name: "Healthcare",
        icon: "🏥",
        color: "#10b981",
        keywords: JSON.stringify(["pharmacy", "hospital", "doctor", "medical", "medicine", "clinic", "apollo", "medplus"]),
        isActive: "true",
    },
    {
        name: "Groceries",
        icon: "🛒",
        color: "#22c55e",
        keywords: JSON.stringify(["bigbasket", "grofers", "blinkit", "grocery", "supermarket", "dmart", "zepto", "instamart"]),
        isActive: "true",
    },
    {
        name: "Other",
        icon: "📦",
        color: "#6b7280",
        keywords: JSON.stringify(["other", "miscellaneous", "general"]),
        isActive: "true",
    },
];

const defaultBankPatterns = [
    {
        bankName: "HDFC Bank",
        domain: "hdfcbank",
        amountPatterns: JSON.stringify([
            "/(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
            "/(?:debited|spent|payment|transaction)\\s+(?:of\\s+)?(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
            "/amount:\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
        ]),
        merchantPatterns: JSON.stringify([
            "/Merchant\\s+Name[:\\s]*([A-Za-z][A-Za-z0-9\\s&'.-]{2,30})(?:\\s|$)/i",
            "/spent.*?(?:at|on).*?(?:card|ending).*?(?:at|with)\\s+([A-Z][A-Z0-9\\s&'._-]{2,30})(?:\\s+on|\\s+at|$)/i",
            "/has\\s+been\\s+spent.*?at\\s+([A-Z][A-Z0-9\\s&'._-]{2,30})(?:\\s+on|\\s+at|$)/i",
            "/(?:merchant|payee)[:\\s]+([A-Za-z][A-Za-z0-9\\s&'.-]{2,30})(?:\\s+(?:payment|mode|on|dated)|\\.|\\n|$)/i",
        ]),
        datePatterns: JSON.stringify([
            "/(?:on|dated?|transaction date)\\s+(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})/i",
            "/(?:on|dated?|transaction date)\\s+(\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{4})/i",
            "/(\\d{1,2}[-/]\\d{1,2}[-/]\\d{4})\\s+(?:at|\\d{1,2}:)/i",
        ]),
        paymentMethodPatterns: JSON.stringify([
            "/(?:using|via|through|card)\\s+(credit card|debit card|upi|net banking|wallet)/i",
            "/(?:Card\\s+ending|Card\\s+\\*+)(\\d{4})/i",
        ]),
        isActive: "true",
    },
    {
        bankName: "ICICI Bank",
        domain: "icicibank",
        amountPatterns: JSON.stringify([
            "/(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
            "/(?:debited|spent|payment)\\s+(?:of\\s+)?(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
            "/amount:\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
        ]),
        merchantPatterns: JSON.stringify([
            "/Merchant\\s+Name[:\\s]*([A-Za-z][A-Za-z0-9\\s&'.-]{2,30})(?:\\s|$)/i",
            "/(?:merchant|payee)[:\\s]+([A-Za-z][A-Za-z0-9\\s&'.-]{2,30})(?:\\s|$)/i",
            "/at\\s+([A-Z][A-Z0-9\\s&'._-]{2,30})(?:\\s+on|\\s+dated|$)/i",
        ]),
        datePatterns: JSON.stringify([
            "/(?:on|dated?|transaction date)\\s+(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})/i",
            "/(\\d{1,2}[-/]\\d{1,2}[-/]\\d{4})\\s+(?:at|\\d{1,2}:)/i",
        ]),
        paymentMethodPatterns: JSON.stringify([
            "/(?:using|via|through|card)\\s+(credit card|debit card|upi|net banking|wallet)/i",
        ]),
        isActive: "true",
    },
    {
        bankName: "State Bank of India",
        domain: "sbi",
        amountPatterns: JSON.stringify([
            "/(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
            "/(?:debited|spent)\\s+(?:of\\s+)?(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
        ]),
        merchantPatterns: JSON.stringify([
            "/(?:merchant|payee)[:\\s]+([A-Za-z][A-Za-z0-9\\s&'.-]{2,30})(?:\\s|$)/i",
            "/at\\s+([A-Z][A-Z0-9\\s&'._-]{2,30})(?:\\s|$)/i",
        ]),
        datePatterns: JSON.stringify([
            "/(?:on|dated?)\\s+(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})/i",
        ]),
        paymentMethodPatterns: JSON.stringify([
            "/(?:card|upi|net banking)/i",
        ]),
        isActive: "true",
    },
    {
        bankName: "Axis Bank",
        domain: "axisbank",
        amountPatterns: JSON.stringify([
            "/(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
            "/amount:\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
        ]),
        merchantPatterns: JSON.stringify([
            "/Merchant[:\\s]+([A-Za-z][A-Za-z0-9\\s&'.-]{2,30})(?:\\s|$)/i",
            "/at\\s+([A-Z][A-Z0-9\\s&'._-]{2,30})(?:\\s|$)/i",
        ]),
        datePatterns: JSON.stringify([
            "/(?:on|dated?)\\s+(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})/i",
        ]),
        paymentMethodPatterns: JSON.stringify([
            "/(?:card|upi)/i",
        ]),
        isActive: "true",
    },
    {
        bankName: "Kotak Mahindra Bank",
        domain: "kotak",
        amountPatterns: JSON.stringify([
            "/(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
            "/(?:debited|spent)\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{2})?)/i",
        ]),
        merchantPatterns: JSON.stringify([
            "/(?:merchant|payee)[:\\s]+([A-Za-z][A-Za-z0-9\\s&'.-]{2,30})(?:\\s|$)/i",
        ]),
        datePatterns: JSON.stringify([
            "/(?:on|dated?)\\s+(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})/i",
        ]),
        paymentMethodPatterns: JSON.stringify([
            "/(?:card|upi)/i",
        ]),
        isActive: "true",
    },
];

export async function seedDefaults() {
    console.log("Seeding default categories...");

    for (const category of defaultCategories) {
        const existing = await db.select().from(categories).where(eq(categories.name, category.name)).limit(1);

        if (existing.length === 0) {
            await db.insert(categories).values(category);
            console.log(`✓ Created category: ${category.name}`);
        } else {
            console.log(`- Category already exists: ${category.name}`);
        }
    }

    console.log("\nSeeding default bank patterns...");

    for (const bank of defaultBankPatterns) {
        const existing = await db.select().from(bankPatterns).where(eq(bankPatterns.bankName, bank.bankName)).limit(1);

        if (existing.length === 0) {
            await db.insert(bankPatterns).values(bank);
            console.log(`✓ Created bank pattern: ${bank.bankName}`);
        } else {
            console.log(`- Bank pattern already exists: ${bank.bankName}`);
        }
    }

    console.log("\n✓ Seeding completed!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedDefaults()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Error seeding defaults:", error);
            process.exit(1);
        });
}
