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

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(insertExpense).returning();
    return result[0];
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return result[0];
  }

  async updateExpense(id: string, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(and(
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ))
      .orderBy(desc(expenses.date));
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(eq(expenses.category, category))
      .orderBy(desc(expenses.date));
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const result = await db.insert(budgets).values(insertBudget).returning();
    return result[0];
  }

  async getBudgets(): Promise<Budget[]> {
    return await db.select().from(budgets);
  }

  async getBudgetByCategory(category: string): Promise<Budget | undefined> {
    const result = await db.select().from(budgets).where(eq(budgets.category, category)).limit(1);
    return result[0];
  }

  async updateBudget(category: string, amount: string): Promise<Budget | undefined> {
    const result = await db.update(budgets)
      .set({ amount, updatedAt: new Date() })
      .where(eq(budgets.category, category))
      .returning();
    return result[0];
  }

  async deleteBudget(category: string): Promise<boolean> {
    const result = await db.delete(budgets).where(eq(budgets.category, category)).returning();
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
