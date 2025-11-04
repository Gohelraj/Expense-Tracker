import { type User, type InsertUser, type Expense, type InsertExpense, type Budget, type InsertBudget, type ProcessedEmail, type InsertProcessedEmail, type BankPattern, type InsertBankPattern, type Category, type InsertCategory } from "@shared/schema";
import { randomUUID } from "crypto";
import { dbStorage } from "./db-storage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Expense methods
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;

  // Budget methods
  createBudget(budget: InsertBudget): Promise<Budget>;
  getBudgets(): Promise<Budget[]>;
  getBudgetByCategory(category: string): Promise<Budget | undefined>;
  updateBudget(category: string, amount: string): Promise<Budget | undefined>;
  deleteBudget(category: string): Promise<boolean>;

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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

// Use database storage for persistence
export const storage = dbStorage;
