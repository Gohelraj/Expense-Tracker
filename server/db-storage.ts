import { db } from "./db";
import { type User, type InsertUser, type Expense, type InsertExpense, type Budget, type InsertBudget, type ProcessedEmail, type BankPattern, type InsertBankPattern, type Category, type InsertCategory, users, expenses, budgets, processedEmails, bankPatterns, categories } from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async updateUserResetToken(email: string, token: string, expiry: Date): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(users.email, email))
      .returning();
    return result[0];
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
    return result[0];
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ password: hashedPassword, resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async createExpense(insertExpense: InsertExpense, userId: string): Promise<Expense> {
    const result = await db.insert(expenses).values({ ...insertExpense, userId }).returning();
    return result[0];
  }

  async getExpenses(userId: string): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date));
  }

  async getExpenseById(id: string, userId: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .limit(1);
    return result[0];
  }

  async updateExpense(id: string, userId: string, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses)
      .set(updates)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date, userId: string): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ))
      .orderBy(desc(expenses.date));
  }

  async getExpensesByCategory(category: string, userId: string): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.category, category)))
      .orderBy(desc(expenses.date));
  }

  async createBudget(insertBudget: InsertBudget, userId: string): Promise<Budget> {
    const result = await db.insert(budgets).values({ ...insertBudget, userId }).returning();
    return result[0];
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudgetByCategory(category: string, userId: string): Promise<Budget | undefined> {
    const result = await db.select().from(budgets)
      .where(and(eq(budgets.category, category), eq(budgets.userId, userId)))
      .limit(1);
    return result[0];
  }

  async updateBudget(category: string, userId: string, amount: string): Promise<Budget | undefined> {
    const result = await db.update(budgets)
      .set({ amount, updatedAt: new Date() })
      .where(and(eq(budgets.category, category), eq(budgets.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteBudget(category: string, userId: string): Promise<boolean> {
    const result = await db.delete(budgets)
      .where(and(eq(budgets.category, category), eq(budgets.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async isEmailProcessed(emailId: string): Promise<boolean> {
    const result = await db.select().from(processedEmails).where(eq(processedEmails.emailId, emailId)).limit(1);
    return result.length > 0;
  }

  async markEmailAsProcessed(emailId: string): Promise<ProcessedEmail> {
    const result = await db.insert(processedEmails).values({ emailId }).returning();
    return result[0];
  }

  // Bank Pattern methods
  async createBankPattern(insertBankPattern: InsertBankPattern): Promise<BankPattern> {
    const result = await db.insert(bankPatterns).values(insertBankPattern).returning();
    return result[0];
  }

  async getBankPatterns(): Promise<BankPattern[]> {
    return await db.select().from(bankPatterns).orderBy(desc(bankPatterns.createdAt));
  }

  async getBankPatternById(id: string): Promise<BankPattern | undefined> {
    const result = await db.select().from(bankPatterns).where(eq(bankPatterns.id, id)).limit(1);
    return result[0];
  }

  async updateBankPattern(id: string, updates: Partial<InsertBankPattern>): Promise<BankPattern | undefined> {
    const result = await db.update(bankPatterns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bankPatterns.id, id))
      .returning();
    return result[0];
  }

  async deleteBankPattern(id: string): Promise<boolean> {
    const result = await db.delete(bankPatterns).where(eq(bankPatterns.id, id)).returning();
    return result.length > 0;
  }

  // Category methods
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory).returning();
    return result[0];
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
    return result[0];
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
}

export const dbStorage = new DbStorage();
