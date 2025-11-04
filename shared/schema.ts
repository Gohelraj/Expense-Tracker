import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  paymentMethod: text("payment_method").notNull(),
  notes: text("notes"),
  source: text("source").notNull().default('manual'),
  emailId: text("email_id"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  updatedAt: true,
});

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export const processedEmails = pgTable("processed_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: text("email_id").notNull().unique(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const insertProcessedEmailSchema = createInsertSchema(processedEmails).omit({
  id: true,
  processedAt: true,
});

export type InsertProcessedEmail = z.infer<typeof insertProcessedEmailSchema>;
export type ProcessedEmail = typeof processedEmails.$inferSelect;

export const bankPatterns = pgTable("bank_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankName: text("bank_name").notNull(),
  domain: text("domain").notNull(),
  amountPatterns: text("amount_patterns").notNull(), // JSON array of regex patterns
  merchantPatterns: text("merchant_patterns").notNull(), // JSON array of regex patterns
  datePatterns: text("date_patterns").notNull(), // JSON array of regex patterns
  paymentMethodPatterns: text("payment_method_patterns").notNull(), // JSON array of regex patterns
  isActive: text("is_active").notNull().default('true'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBankPatternSchema = createInsertSchema(bankPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBankPattern = z.infer<typeof insertBankPatternSchema>;
export type BankPattern = typeof bankPatterns.$inferSelect;

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  keywords: text("keywords").notNull(), // JSON array of keywords
  isActive: text("is_active").notNull().default('true'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
