import type { InsertExpense } from "@shared/schema";

interface ParsedTransaction {
  amount: string;
  merchant: string;
  date: Date;
  category?: string;
  paymentMethod?: string;
}

export class EmailParser {
  private indianBankPatterns = {
    amount: [
      /(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /(?:debited|spent|payment|transaction|charged|withdrawn|purchase)\s+(?:of\s+)?(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /amount[:\s]*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /(?:txn|transaction)\s+(?:amt|amount)[:\s]*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /(?:purchase|sale)\s+(?:of\s+)?(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    ],
    merchant: [
      // Card transaction patterns (most specific first - based on real emails)
      /Merchant\s+Name[:\s]*([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i, // "Merchant Name: AMAZON BD"
      /spent.*?(?:at|on).*?(?:card|ending).*?(?:at|with)\s+([A-Z][A-Z0-9\s&'._-]{2,30})(?:\s+on|\s+at|$)/i, // "spent on card at MERCHANT"
      /has\s+been\s+(?:spent|debited|charged).*?(?:at|on)\s+([A-Z][A-Z0-9\s&'._-]{2,30})(?:\s+on|\s+at|$)/i, // "has been spent at MERCHANT"
      /spent\s+on.*?card.*?at\s+([A-Z][A-Z0-9\s&'._-]{2,30})(?:\s|$)/i, // "spent on credit card at MERCHANT"

      // Credit card specific patterns
      /(?:purchase|transaction)\s+at\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s+on|\s+for|\.|\n|$)/i,
      /(?:charged|debited)\s+(?:from|on)\s+.*?card.*?(?:at|for)\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|\.|\n|$)/i,
      /card\s+ending\s+\d{4}.*?(?:at|for)\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|\.|\n|$)/i,

      // Third-party payment services (PayPal, Stripe, Razorpay, etc.)
      /(?:via|through|using)\s+(paypal|stripe|razorpay|paytm|phonepe|gpay|amazon\s+pay).*?(?:for|to)\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|\.|\n|$)/i,
      /payment\s+to\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})\s+(?:via|through|using)\s+(?:paypal|stripe|razorpay)/i,

      // UPI Transaction Info patterns
      /UPI\/P2M\/\d+\/([A-Z\s&'.-]+?)(?:\s|$)/i,  // UPI/P2M/number/MERCHANT_NAME
      /UPI\/P2P\/\d+\/([A-Z\s&'.-]+?)(?:\s|$)/i,  // UPI/P2P/number/MERCHANT_NAME
      /UPI.*?\/([A-Z][A-Z\s&'.-]{2,30})(?:\s|$)/i, // Generic UPI pattern

      // Transaction Info field patterns
      /Transaction\s+(?:Info|Details)[:\s]*([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|$)/i,
      /(?:Txn|Transaction)\s+(?:at|with)[:\s]*([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|$)/i,

      // Merchant/Payee field patterns
      /(?:merchant|payee|vendor)[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s+(?:payment|mode|on|dated)|\.|\n|$)/i,

      // Payment patterns
      /(?:payment|paid|debited|withdrawn)\s+(?:at|to|from)\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s+(?:on|dated|for)|\.|\n|$)/i,

      // Generic card patterns
      /(?:card|used)\s+at\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s+(?:on|dated)|\.|\n|$)/i,

      // POS and online transaction patterns
      /(?:POS|online)\s+(?:transaction|purchase)\s+at\s+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|\.|\n|$)/i,

      // Beneficiary patterns
      /beneficiary[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|$)/i,
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
      /(?:using|via|through|on|from)\s+(credit card|debit card|upi|net banking|wallet|paypal|stripe|razorpay)/i,
      /(?:Card\s+ending|Card\s+\*+|card\s+no\.)(\d{4})/i,
      /(credit|debit)\s+card\s+ending/i,
      /(?:POS|online|contactless)\s+transaction/i,
    ],
  };

  private categoryKeywords = {
    'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining', 'burger', 'pizza', 'dominos'],
    'Transport': ['uber', 'ola', 'rapido', 'metro', 'fuel', 'petrol', 'diesel', 'parking'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'mall', 'store'],
    'Bills & Utilities': ['electricity', 'water', 'gas', 'broadband', 'mobile', 'recharge', 'bill payment'],
    'Entertainment': ['netflix', 'prime', 'hotstar', 'spotify', 'movie', 'pvr', 'inox'],
    'Healthcare': ['pharmacy', 'hospital', 'doctor', 'medical', 'medicine', 'clinic'],
    'Groceries': ['bigbasket', 'grofers', 'blinkit', 'grocery', 'supermarket', 'dmart'],
  };

  parseEmail(subject: string, body: string, sender: string, emailDate?: Date): ParsedTransaction | null {
    if (!this.isBankEmail(sender)) {
      return null;
    }

    const text = `${subject} ${body}`;

    // Skip credit transactions - only process debits (expenses)
    if (this.isCreditTransaction(text)) {
      return null;
    }

    // Check if this is a debit transaction
    const isDebitTransaction = this.isDebitTransaction(text);

    const amount = this.extractAmount(text);
    const merchant = this.extractMerchant(text);
    const transactionDate = this.extractDate(text);

    // If we have an amount and it's clearly a debit, proceed even without merchant
    if (!amount) {
      return null;
    }

    // If no merchant found but we have amount and debit indicators, use fallback
    const finalMerchant = merchant || (isDebitTransaction ? 'Debit Transaction' : null);

    if (!finalMerchant) {
      return null;
    }

    const category = this.categorizeTransaction(finalMerchant, text);
    const paymentMethod = this.extractPaymentMethod(text);

    // Use transaction date from email content, fallback to email date, then current date
    const finalDate = transactionDate || emailDate || new Date();

    return {
      amount,
      merchant: finalMerchant,
      date: finalDate,
      category,
      paymentMethod,
    };
  }

  private isBankEmail(sender: string): boolean {
    const bankDomains = [
      // Indian Banks
      'hdfcbank',
      'icicibank',
      'sbi',
      'axisbank',
      'yesbank',
      'kotak',
      'indusind',
      'pnb',
      'bob',
      'idbi',
      'unionbank',
      'canarabank',
      'bankofbaroda',
      // Payment Services
      'paytm',
      'phonepe',
      'gpay',
      'googlepay',
      'amazonpay',
      'mobikwik',
      'freecharge',
      // Third-party Payment Processors
      'paypal',
      'stripe',
      'razorpay',
      'instamojo',
      'cashfree',
      'payu',
      // Credit Card Companies
      'visa',
      'mastercard',
      'amex',
      'americanexpress',
      'rupay',
      // Generic patterns
      'alerts',
      'notification',
      'transaction',
      'banking',
    ];

    return bankDomains.some(domain => sender.toLowerCase().includes(domain));
  }

  private extractAmount(text: string): string | null {
    for (const pattern of this.indianBankPatterns.amount) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = match[1].replace(/,/g, '');
        return parseFloat(amount).toFixed(2);
      }
    }
    return null;
  }

  private extractMerchant(text: string): string | null {
    // Clean the text first - remove extra whitespace and newlines
    const cleanText = text.replace(/\s+/g, ' ').trim();

    for (const pattern of this.indianBankPatterns.merchant) {
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
      /payee[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|$)/i,
      /beneficiary[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|$)/i,
      /merchant\s+name[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|$)/i,
      /to[:\s]+([A-Z][A-Z\s&'.-]{2,40})(?:\s+on|\s+dated|$)/i,
      /(?:paid|payment)\s+to[:\s]+([A-Za-z][A-Za-z0-9\s&'.-]{2,40})(?:\s|$)/i,
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

    // Return null instead of 'Unknown Merchant' - let the caller decide
    return null;
  }

  private cleanMerchantName(merchant: string): string {
    // Handle UPI-style merchant names (e.g., "UPI_ZEPTONOW" -> "Zeptonow")
    if (merchant.startsWith('UPI_')) {
      merchant = merchant.replace(/^UPI_/, '');
    }

    // Common merchant name mappings
    const merchantMappings: { [key: string]: string } = {
      'AMAZON BD': 'Amazon',
      'AMAZON': 'Amazon',
      'FLIPKART PAYMENTS': 'Flipkart',
      'FLIPKART': 'Flipkart',
      'ZEPTONOW': 'Zepto',
      'SWIGGY': 'Swiggy',
      'ZOMATO': 'Zomato',
      'PAYTM': 'Paytm',
      'PHONEPE': 'PhonePe',
      'GPAY': 'Google Pay',
      'GOOGLE PAY': 'Google Pay',
      'NETFLIX': 'Netflix',
      'SPOTIFY': 'Spotify',
      'UBER': 'Uber',
      'OLA': 'Ola',
      'BIGBASKET': 'BigBasket',
      'BLINKIT': 'Blinkit',
      'MYNTRA': 'Myntra',
    };

    // Check for exact matches first
    const upperMerchant = merchant.toUpperCase();
    if (merchantMappings[upperMerchant]) {
      return merchantMappings[upperMerchant];
    }

    // Remove common suffixes and prefixes
    merchant = merchant.replace(/\s*(PAYMENTS?|PVT\s*LTD|LIMITED|LTD|INDIA|SERVICES?|BD|INC|CORP|LLC)\s*$/i, '');

    // Replace underscores and hyphens with spaces
    merchant = merchant.replace(/[_-]/g, ' ');

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

  private extractDate(text: string): Date | null {
    for (const pattern of this.indianBankPatterns.date) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let dateStr = match[1].trim();

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
      }
    }
    return null;
  }

  private extractPaymentMethod(text: string): string {
    const lowerText = text.toLowerCase();

    for (const pattern of this.indianBankPatterns.paymentMethod) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const method = match[1].toLowerCase();
        if (method.includes('credit')) return 'Credit Card';
        if (method.includes('debit')) return 'Debit Card';
        if (method.includes('upi')) return 'UPI';
        if (method.includes('net banking')) return 'Net Banking';
        if (method.includes('wallet')) return 'Wallet';
        if (method.includes('paypal')) return 'PayPal';
        if (method.includes('stripe')) return 'Stripe';
        if (method.includes('razorpay')) return 'Razorpay';
      }
    }

    // Enhanced detection for various payment methods
    if (lowerText.includes('credit card') || lowerText.includes('cc ending')) return 'Credit Card';
    if (lowerText.includes('debit card') || lowerText.includes('dc ending')) return 'Debit Card';
    if (lowerText.includes('upi')) return 'UPI';
    if (lowerText.includes('net banking') || lowerText.includes('netbanking')) return 'Net Banking';
    if (lowerText.includes('wallet')) return 'Wallet';
    if (lowerText.includes('paypal')) return 'PayPal';
    if (lowerText.includes('stripe')) return 'Stripe';
    if (lowerText.includes('razorpay')) return 'Razorpay';
    if (lowerText.includes('pos transaction') || lowerText.includes('pos purchase')) return 'Card';
    if (lowerText.includes('online transaction') || lowerText.includes('online purchase')) return 'Online';
    if (lowerText.includes('contactless')) return 'Contactless Card';
    if (lowerText.includes('card')) return 'Card';

    return 'Other';
  }

  private isDebitTransaction(text: string): boolean {
    const lowerText = text.toLowerCase();

    const debitIndicators = [
      /debited|spent|charged|withdrawn|purchase|payment.*made/i,
      /debit.*from.*account/i,
      /transaction.*at/i,
      /amount.*debited/i,
      /has.*been.*debited/i,
      /your.*account.*debited/i,
      /card.*charged/i,
      /payment.*of.*(?:inr|rs|₹)/i,
    ];

    return debitIndicators.some(pattern => pattern.test(lowerText));
  }

  private isCreditTransaction(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Skip credit transactions - we only want expenses (debits)
    const creditPatterns = [
      /credited|received|deposited|refund|cashback|reward|salary|transfer.*received/i,
      /amount.*credited/i,
      /received.*from/i,
      /credit.*to.*account/i,
      /money.*received/i,
    ];

    // Don't skip if it's clearly a debit/expense even if "credit card" is mentioned
    if (this.isDebitTransaction(text)) {
      return false;
    }

    return creditPatterns.some(pattern => pattern.test(lowerText));
  }

  private categorizeTransaction(merchant: string, text: string): string {
    const lowerMerchant = merchant.toLowerCase();
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
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

export const emailParser = new EmailParser();
