import { type User, type InsertUser, type Expense, type InsertExpense, type Budget, type InsertBudget, type ProcessedEmail, type InsertProcessedEmail, type BankPattern, type InsertBankPattern, type Category, type InsertCategory } from "@shared/schema";
import { randomUUID } from "crypto";
import { dbStorage } from "./db-storage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserResetToken(email: string, token: string, expiry: Date): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;

  // Expense methods
  createExpense(expense: InsertExpense, userId: string): Promise<Expense>;
  getExpenses(userId: string): Promise<Expense[]>;
  getExpenseById(id: string, userId: string): Promise<Expense | undefined>;
  updateExpense(id: string, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string, userId: string): Promise<boolean>;
  getExpensesByDateRange(startDate: Date, endDate: Date, userId: string): Promise<Expense[]>;
  getExpensesByCategory(category: string, userId: string): Promise<Expense[]>;

  // Budget methods
  createBudget(budget: InsertBudget, userId: string): Promise<Budget>;
  getBudgets(userId: string): Promise<Budget[]>;
  getBudgetByCategory(category: string, userId: string): Promise<Budget | undefined>;
  updateBudget(category: string, userId: string, amount: string): Promise<Budget | undefined>;
  deleteBudget(category: string, userId: string): Promise<boolean>;

  // Processed Email methods
  isEmailProcessed(emailId: string): Promise<boolean>;
  markEmailAsProcessed(emailId: string): Promise<ProcessedEmail>;

  // Bank Pattern methods
  createBankPattern(bankPattern: InsertBankPattern): Promise<BankPattern>;
  getBankPatterns(): Promise<BankPattern[]>;
  getBankPatternById(id: string): Promise<BankPattern | undefined>;
  updateBankPattern(id: string, updates: Partial<InsertBankPattern>): Promise<BankPattern | undefined>;
  deleteBankPattern(id: string): Promise<boolean>;

  // Category methods
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private expenses: Map<string, Expense>;
  private budgets: Map<string, Budget>;

  constructor() {
    this.users = new Map();
    this.expenses = new Map();
    this.budgets = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email || null,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async updateUserResetToken(email: string, token: string, expiry: Date): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;

    const updated: User = { ...user, resetToken: token, resetTokenExpiry: expiry };
    this.users.set(user.id, updated);
    return updated;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token,
    );
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated: User = {
      ...user,
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, updated);
    return updated;
  }

  async createExpense(insertExpense: InsertExpense, userId: string): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      userId,
      date: insertExpense.date || new Date(),
      source: insertExpense.source || 'manual',
      emailId: insertExpense.emailId || null,
      notes: insertExpense.notes || null,
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async getExpenses(userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpenseById(id: string, userId: string): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    return expense && expense.userId === userId ? expense : undefined;
  }

  async updateExpense(id: string, userId: string, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense || expense.userId !== userId) return undefined;

    const updated: Expense = { ...expense, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    const expense = this.expenses.get(id);
    if (!expense || expense.userId !== userId) return false;
    return this.expenses.delete(id);
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date, userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expense.userId === userId && expenseDate >= startDate && expenseDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpensesByCategory(category: string, userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId && expense.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createBudget(insertBudget: InsertBudget, userId: string): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = {
      ...insertBudget,
      id,
      userId,
      updatedAt: new Date(),
    };
    const key = `${userId}-${insertBudget.category}`;
    this.budgets.set(key, budget);
    return budget;
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return Array.from(this.budgets.values())
      .filter(budget => budget.userId === userId);
  }

  async getBudgetByCategory(category: string, userId: string): Promise<Budget | undefined> {
    const key = `${userId}-${category}`;
    return this.budgets.get(key);
  }

  async updateBudget(category: string, userId: string, amount: string): Promise<Budget | undefined> {
    const key = `${userId}-${category}`;
    const budget = this.budgets.get(key);
    if (!budget) return undefined;

    const updated: Budget = { ...budget, amount, updatedAt: new Date() };
    this.budgets.set(key, updated);
    return updated;
  }

  async deleteBudget(category: string, userId: string): Promise<boolean> {
    const key = `${userId}-${category}`;
    return this.budgets.delete(key);
  }

  async isEmailProcessed(emailId: string): Promise<boolean> {
    // Stub implementation for in-memory storage
    return false;
  }

  async markEmailAsProcessed(emailId: string): Promise<ProcessedEmail> {
    // Stub implementation for in-memory storage
    const id = randomUUID();
    return {
      id,
      emailId,
      processedAt: new Date(),
    };
  }

  async createBankPattern(bankPattern: InsertBankPattern): Promise<BankPattern> {
    const id = randomUUID();
    return {
      ...bankPattern,
      id,
      isActive: bankPattern.isActive || 'true',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getBankPatterns(): Promise<BankPattern[]> {
    return [];
  }

  async getBankPatternById(id: string): Promise<BankPattern | undefined> {
    return undefined;
  }

  async updateBankPattern(id: string, updates: Partial<InsertBankPattern>): Promise<BankPattern | undefined> {
    return undefined;
  }

  async deleteBankPattern(id: string): Promise<boolean> {
    return false;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    return {
      ...category,
      id,
      isActive: category.isActive || 'true',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getCategories(): Promise<Category[]> {
    return [];
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return undefined;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return undefined;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    return undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return false;
  }
}

// Use database storage for persistence
export const storage = dbStorage;
