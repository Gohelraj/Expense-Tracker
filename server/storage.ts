import { type User, type InsertUser, type Expense, type InsertExpense, type Budget, type InsertBudget, type ProcessedEmail, type InsertProcessedEmail, type BankPattern, type InsertBankPattern, type Category, type InsertCategory } from "@shared/schema";
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

// Export database storage instance
export const storage = dbStorage;
