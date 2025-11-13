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
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(userId: string): Promise<Expense[]>;
  getExpenseById(id: string, userId: string): Promise<Expense | undefined>;
  updateExpense(id: string, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string, userId: string): Promise<boolean>;
  getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByCategory(userId: string, category: string): Promise<Expense[]>;

  // Budget methods
  createBudget(budget: InsertBudget): Promise<Budget>;
  getBudgets(userId: string): Promise<Budget[]>;
  getBudgetByCategory(userId: string, category: string): Promise<Budget | undefined>;
  updateBudget(userId: string, category: string, amount: string): Promise<Budget | undefined>;
  deleteBudget(userId: string, category: string): Promise<boolean>;

  // Processed Email methods
  isEmailProcessed(userId: string, emailId: string): Promise<boolean>;
  markEmailAsProcessed(userId: string, emailId: string): Promise<ProcessedEmail>;

  // Bank Pattern methods
  createBankPattern(bankPattern: InsertBankPattern): Promise<BankPattern>;
  getBankPatterns(userId: string): Promise<BankPattern[]>;
  getBankPatternById(id: string, userId: string): Promise<BankPattern | undefined>;
  updateBankPattern(id: string, userId: string, updates: Partial<InsertBankPattern>): Promise<BankPattern | undefined>;
  deleteBankPattern(id: string, userId: string): Promise<boolean>;

  // Category methods
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(userId: string): Promise<Category[]>;
  getCategoryById(id: string, userId: string): Promise<Category | undefined>;
  getCategoryByName(userId: string, name: string): Promise<Category | undefined>;
  updateCategory(id: string, userId: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;
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

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      date: insertExpense.date || new Date(),
      source: insertExpense.source || 'manual',
      emailId: insertExpense.emailId || null,
      notes: insertExpense.notes || null,
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async updateExpense(id: string, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;

    const updated: Expense = { ...expense, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = {
      ...insertBudget,
      id,
      updatedAt: new Date(),
    };
    this.budgets.set(budget.category, budget);
    return budget;
  }

  async getBudgets(): Promise<Budget[]> {
    return Array.from(this.budgets.values());
  }

  async getBudgetByCategory(category: string): Promise<Budget | undefined> {
    return this.budgets.get(category);
  }

  async updateBudget(category: string, amount: string): Promise<Budget | undefined> {
    const budget = this.budgets.get(category);
    if (!budget) return undefined;

    const updated: Budget = { ...budget, amount, updatedAt: new Date() };
    this.budgets.set(category, updated);
    return updated;
  }

  async deleteBudget(category: string): Promise<boolean> {
    return this.budgets.delete(category);
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
