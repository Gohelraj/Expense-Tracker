import type { InsertExpense, BankPattern, Category } from "@shared/schema";
import type { IStorage } from "./storage";

interface ParsedTransaction {
  amount: string;
  merchant: string;
  date: Date;
  category?: string;
  paymentMethod?: string;
}

export class EmailParser {
  private storage: IStorage;

  // Fallback patterns in case database is empty
  private fallbackBankPatterns = {
    amount: [
      /(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /(?:debited|spent|payment|transaction)\s+(?:of\s+)?(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /amount:\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    ],
    merchant: [
      // Card transaction patterns (most specific first - based on real emails)
      /Merchant\s+Name[:\s]*([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i, // "Merchant Name: AMAZON BD"
      /spent.*?(?:at|on).*?(?:card|ending).*?(?:at|with)\s+([A-Z][A-Z0-9\s&'._-]{2,30})(?:\s+on|\s+at|$)/i, // "spent on card at MERCHANT"
      /has\s+been\s+spent.*?at\s+([A-Z][A-Z0-9\s&'._-]{2,30})(?:\s+on|\s+at|$)/i, // "has been spent at UPI_ZEPTONOW"
      /spent\s+on.*?card.*?at\s+([A-Z][A-Z0-9\s&'._-]{2,30})(?:\s|$)/i, // "spent on credit card at MERCHANT"

      // UPI Transaction Info patterns
      /UPI\/P2M\/\d+\/([A-Z\s&'.-]+?)(?:\s|$)/i,  // UPI/P2M/number/MERCHANT_NAME
      /UPI\/P2P\/\d+\/([A-Z\s&'.-]+?)(?:\s|$)/i,  // UPI/P2P/number/MERCHANT_NAME
      /UPI.*?\/([A-Z][A-Z\s&'.-]{2,30})(?:\s|$)/i, // Generic UPI pattern

      // Transaction Info field patterns
      /Transaction\s+Info[:\s]*([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i,

      // Merchant/Payee field patterns
      /(?:merchant|payee)[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s+(?:payment|mode|on|dated)|\.|\n|$)/i,

      // Payment patterns
      /(?:payment|paid|debited)\s+(?:at|to)\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s+(?:on|dated|for)|\.|\n|$)/i,

      // Generic card patterns
      /(?:card|used)\s+at\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s+(?:on|dated)|\.|\n|$)/i,

      // Beneficiary patterns
      /beneficiary[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i,
    ],
    date: [
      // DD-MM-YYYY or DD/MM/YYYY formats
      /(?:on|dated?|transaction date)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      // DD Mon YYYY format
      /(?:on|dated?|transaction date)\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
      // YYYY-MM-DD format
      /(?:on|dated?|transaction date)\s+(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
      // Just date patterns without keywords
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})\s+(?:at|\d{1,2}:)/i,
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s+(?:at|\d{1,2}:)/i,
    ],
    paymentMethod: [
      /(?:using|via|through|card)\s+(credit card|debit card|upi|net banking|wallet)/i,
      /(?:Card\s+ending|Card\s+\*+)(\d{4})/i,
    ],
  };

  // Fallback category keywords in case database is empty
  private fallbackCategoryKeywords = {
    'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining', 'burger', 'pizza', 'dominos'],
    'Transport': ['uber', 'ola', 'rapido', 'metro', 'fuel', 'petrol', 'diesel', 'parking'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'mall', 'store'],
    'Bills & Utilities': ['electricity', 'water', 'gas', 'broadband', 'mobile', 'recharge', 'bill payment'],
    'Entertainment': ['netflix', 'prime', 'hotstar', 'spotify', 'movie', 'pvr', 'inox'],
    'Healthcare': ['pharmacy', 'hospital', 'doctor', 'medical', 'medicine', 'clinic'],
    'Groceries': ['bigbasket', 'grofers', 'blinkit', 'grocery', 'supermarket', 'dmart'],
  };

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async parseEmail(subject: string, body: string, sender: string, emailDate?: Date): Promise<ParsedTransaction | null> {
    if (!(await this.isBankEmail(sender))) {
      return null;
    }

    const text = `${subject} ${body}`;

    // Skip credit transactions - only process debits (expenses)
    if (this.isCreditTransaction(text)) {
      return null;
    }

    // Get bank patterns and categories from database
    const bankPatterns = await this.storage.getBankPatterns();
    const categories = await this.storage.getCategories();

    const amount = await this.extractAmount(text, bankPatterns);
    const merchant = await this.extractMerchant(text, bankPatterns);
    const transactionDate = await this.extractDate(text, bankPatterns);

    if (!amount || !merchant) {
      return null;
    }

    const category = await this.categorizeTransaction(merchant, text, categories);
    const paymentMethod = await this.extractPaymentMethod(text, bankPatterns);

    // Use transaction date from email content, fallback to email date, then current date
    const finalDate = transactionDate || emailDate || new Date();

    return {
      amount,
      merchant,
      date: finalDate,
      category,
      paymentMethod,
    };
  }

  async isBankEmail(sender: string, bankPatterns?: BankPattern[]): Promise<boolean> {
    // If bank patterns provided or available, use them
    if (!bankPatterns) {
      bankPatterns = await this.storage.getBankPatterns();
    }

    // Check against database patterns first (active patterns only)
    const activePatterns = bankPatterns.filter(p => p.isActive === 'true');
    if (activePatterns.length > 0) {
      return activePatterns.some(pattern =>
        sender.toLowerCase().includes(pattern.domain.toLowerCase())
      );
    }

    // Fallback to hardcoded domains if database is empty
    const fallbackDomains = [
      'hdfcbank',
      'icicibank',
      'sbi',
      'axisbank',
      'yesbank',
      'kotak',
      'indusind',
      'pnb',
      'bob',
      'paytm',
      'phonepe',
      'gpay',
      'alerts',
      'notification',
    ];

    return fallbackDomains.some(domain => sender.toLowerCase().includes(domain));
  }

  private async extractAmount(text: string, bankPatterns: BankPattern[]): Promise<string | null> {
    // Try database patterns first (active patterns only)
    const activePatterns = bankPatterns.filter(p => p.isActive === 'true');
    for (const bankPattern of activePatterns) {
      try {
        const patterns = JSON.parse(bankPattern.amountPatterns) as string[];
        for (const patternStr of patterns) {
          const pattern = new RegExp(patternStr, 'i');
          const match = text.match(pattern);
          if (match && match[1]) {
            const amount = match[1].replace(/,/g, '');
            return parseFloat(amount).toFixed(2);
          }
        }
      } catch (error) {
        console.error(`Error parsing amount patterns for ${bankPattern.bankName}:`, error);
      }
    }

    // Fallback to hardcoded patterns
    for (const pattern of this.fallbackBankPatterns.amount) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = match[1].replace(/,/g, '');
        return parseFloat(amount).toFixed(2);
      }
    }
    return null;
  }

  private async extractMerchant(text: string, bankPatterns: BankPattern[]): Promise<string | null> {
    // Clean the text first - remove extra whitespace and newlines
    const cleanText = text.replace(/\s+/g, ' ').trim();

    // Try database patterns first (active patterns only)
    const activePatterns = bankPatterns.filter(p => p.isActive === 'true');
    for (const bankPattern of activePatterns) {
      try {
        const patterns = JSON.parse(bankPattern.merchantPatterns) as string[];
        for (const patternStr of patterns) {
          const pattern = new RegExp(patternStr, 'i');
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            let merchant = match[1].trim();
            merchant = this.cleanMerchantName(merchant);
            if (this.isValidMerchantName(merchant)) {
              return merchant;
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing merchant patterns for ${bankPattern.bankName}:`, error);
      }
    }

    // Fallback to hardcoded patterns
    for (const pattern of this.fallbackBankPatterns.merchant) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        let merchant = match[1].trim();

        // Clean up the merchant name
        merchant = this.cleanMerchantName(merchant);

        // Skip if it's invalid
        if (!this.isValidMerchantName(merchant)) {
          continue;
        }

        return merchant;
      }
    }

    // Fallback patterns for other formats
    const fallbackPatterns = [
      /payee[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i,
      /beneficiary[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i,
      /merchant\s+name[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i,
      /to[:\s]+([A-Z][A-Z\s&'.-]{2,30})(?:\s+on|\s+dated|$)/i,
    ];

    for (const pattern of fallbackPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        let merchant = this.cleanMerchantName(match[1].trim());

        if (this.isValidMerchantName(merchant)) {
          return merchant;
        }
      }
    }

    return 'Unknown Merchant';
  }

  private cleanMerchantName(merchant: string): string {
    // Handle UPI-style merchant names (e.g., "UPI_ZEPTONOW" -> "Zeptonow")
    if (merchant.startsWith('UPI_')) {
      merchant = merchant.replace(/^UPI_/, '');
    }

    // Common merchant name mappings
    const merchantMappings: { [key: string]: string } = {
      'AMAZON BD': 'Amazon',
      'FLIPKART PAYMENTS': 'Flipkart',
      'ZEPTONOW': 'Zepto',
      'SWIGGY': 'Swiggy',
      'ZOMATO': 'Zomato',
      'PAYTM': 'Paytm',
      'PHONEPE': 'PhonePe',
      'GPAY': 'Google Pay',
    };

    // Check for exact matches first
    const upperMerchant = merchant.toUpperCase();
    if (merchantMappings[upperMerchant]) {
      return merchantMappings[upperMerchant];
    }

    // Remove common suffixes and prefixes
    merchant = merchant.replace(/\s*(PAYMENTS?|PVT\s*LTD|LIMITED|LTD|INDIA|SERVICES?|BD)\s*$/i, '');

    // Replace underscores with spaces
    merchant = merchant.replace(/_/g, ' ');

    // Remove special characters except common ones
    merchant = merchant.replace(/[^\w\s&'.-]/g, '');

    // Normalize whitespace
    merchant = merchant.replace(/\s+/g, ' ').trim();

    // Convert to title case for better readability
    merchant = merchant.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

    return merchant;
  }

  private isValidMerchantName(merchant: string): boolean {
    // Must be at least 2 characters
    if (merchant.length < 2) return false;

    // Must not be all numbers
    if (/^\d+$/.test(merchant)) return false;

    // Must not be common false positives
    const invalidNames = [
      'TRANSACTION', 'PAYMENT', 'DEBIT', 'CREDIT', 'ACCOUNT', 'BANK',
      'UPI', 'NEFT', 'RTGS', 'IMPS', 'INFO', 'DETAILS', 'SUMMARY',
      'DATE', 'TIME', 'AMOUNT', 'BALANCE', 'AVAILABLE', 'TOTAL'
    ];

    if (invalidNames.includes(merchant.toUpperCase())) return false;

    // Must start with a letter
    if (!/^[A-Za-z]/.test(merchant)) return false;

    return true;
  }

  private async extractDate(text: string, bankPatterns: BankPattern[]): Promise<Date | null> {
    // Try database patterns first (active patterns only)
    const activePatterns = bankPatterns.filter(p => p.isActive === 'true');
    for (const bankPattern of activePatterns) {
      try {
        const patterns = JSON.parse(bankPattern.datePatterns) as string[];
        for (const patternStr of patterns) {
          const pattern = new RegExp(patternStr, 'i');
          const match = text.match(pattern);
          if (match && match[1]) {
            const parsed = this.parseDate(match[1].trim());
            if (parsed) return parsed;
          }
        }
      } catch (error) {
        console.error(`Error parsing date patterns for ${bankPattern.bankName}:`, error);
      }
    }

    // Fallback to hardcoded patterns
    for (const pattern of this.fallbackBankPatterns.date) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const parsed = this.parseDate(match[1].trim());
        if (parsed) return parsed;
      }
    }
    return null;
  }

  private parseDate(dateStr: string): Date | null {
    // Handle DD-MM-YYYY or DD/MM/YYYY format (Indian format)
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(dateStr)) {
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
          return parsed;
        }
      }
    }

    // Try standard Date parsing for other formats
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
      return parsed;
    }

    return null;
  }

  private async extractPaymentMethod(text: string, bankPatterns: BankPattern[]): Promise<string> {
    // Try database patterns first (active patterns only)
    const activePatterns = bankPatterns.filter(p => p.isActive === 'true');
    for (const bankPattern of activePatterns) {
      try {
        const patterns = JSON.parse(bankPattern.paymentMethodPatterns) as string[];
        for (const patternStr of patterns) {
          const pattern = new RegExp(patternStr, 'i');
          const match = text.match(pattern);
          if (match && match[1]) {
            const method = match[1].toLowerCase();
            if (method.includes('credit')) return 'Credit Card';
            if (method.includes('debit')) return 'Debit Card';
            if (method.includes('upi')) return 'UPI';
            if (method.includes('net banking')) return 'Net Banking';
            if (method.includes('wallet')) return 'Wallet';
          }
        }
      } catch (error) {
        console.error(`Error parsing payment method patterns for ${bankPattern.bankName}:`, error);
      }
    }

    // Fallback to hardcoded patterns
    for (const pattern of this.fallbackBankPatterns.paymentMethod) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const method = match[1].toLowerCase();
        if (method.includes('credit')) return 'Credit Card';
        if (method.includes('debit')) return 'Debit Card';
        if (method.includes('upi')) return 'UPI';
        if (method.includes('net banking')) return 'Net Banking';
        if (method.includes('wallet')) return 'Wallet';
      }
    }

    if (text.toLowerCase().includes('upi')) return 'UPI';
    if (text.toLowerCase().includes('card')) return 'Card';

    return 'Other';
  }

  private isCreditTransaction(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Skip credit transactions - we only want expenses (debits)
    const creditPatterns = [
      /credited|received|deposited|refund|cashback|reward|salary|transfer.*received/i,
      /amount.*credited/i,
      /received.*from/i,
    ];

    return creditPatterns.some(pattern => pattern.test(lowerText));
  }

  private async categorizeTransaction(merchant: string, text: string, categories: Category[]): Promise<string> {
    const lowerMerchant = merchant.toLowerCase();
    const lowerText = text.toLowerCase();

    // Try database categories first (active categories only)
    const activeCategories = categories.filter(c => c.isActive === 'true');
    for (const category of activeCategories) {
      try {
        const keywords = JSON.parse(category.keywords) as string[];
        for (const keyword of keywords) {
          if (lowerMerchant.includes(keyword.toLowerCase()) || lowerText.includes(keyword.toLowerCase())) {
            return category.name;
          }
        }
      } catch (error) {
        console.error(`Error parsing keywords for category ${category.name}:`, error);
      }
    }

    // Fallback to hardcoded keywords
    for (const [category, keywords] of Object.entries(this.fallbackCategoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerMerchant.includes(keyword) || lowerText.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  toExpense(parsed: ParsedTransaction): Omit<InsertExpense, 'source' | 'emailId'> {
    return {
      amount: parsed.amount,
      merchant: parsed.merchant,
      category: parsed.category || 'Other',
      date: parsed.date,
      paymentMethod: parsed.paymentMethod || 'Other',
      notes: null,
    };
  }
}

// Export factory function instead of singleton to allow dependency injection
export function createEmailParser(storage: IStorage): EmailParser {
  return new EmailParser(storage);
}
