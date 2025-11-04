import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, insertBudgetSchema, insertUserSchema, insertBankPatternSchema, insertCategorySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { emailParser } from "./email-parser";
import { gmailService } from "./gmail-service";
import { emailPollingService } from "./email-polling-service";
import { budgetAlertsService } from "./budget-alerts";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromZodError(result.error).message
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(result.data.password, 10);

      const user = await storage.createUser({
        username: result.data.username,
        password: hashedPassword,
      });

      // Don't send password back
      const { password, ...userWithoutPassword } = user;

      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    res.json({ success: true });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    // For now, return a mock user since we don't have session management yet
    res.json({
      id: "demo-user",
      username: "demo"
    });
  });

  // Expense routes

  // Create expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const result = insertExpenseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromZodError(result.error).message
        });
      }

      const expense = await storage.createExpense(result.data);
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get expense by ID
  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update expense
  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      // Validate the update data (partial schema validation)
      const updateData = {
        ...req.body,
        // Ensure date is properly formatted if provided
        date: req.body.date ? new Date(req.body.date) : undefined,
      };

      const expense = await storage.updateExpense(req.params.id, updateData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update expense (PUT method for full update)
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      // Validate the update data (partial schema validation)
      const updateData = {
        ...req.body,
        // Ensure date is properly formatted
        date: req.body.date ? new Date(req.body.date) : undefined,
      };

      const expense = await storage.updateExpense(req.params.id, updateData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk delete expenses
  app.post("/api/expenses/bulk-delete", async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid or empty ids array" });
      }

      const results = await Promise.all(
        ids.map(id => storage.deleteExpense(id))
      );

      const deletedCount = results.filter(Boolean).length;

      res.json({
        success: true,
        deletedCount,
        total: ids.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get expenses by category
  app.get("/api/expenses/category/:category", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByCategory(req.params.category);
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export expenses as CSV
  app.get("/api/expenses/export/csv", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let expenses;
      if (startDate && endDate) {
        expenses = await storage.getExpensesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        expenses = await storage.getExpenses();
      }

      // Generate CSV
      const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Payment Method', 'Notes', 'Source'];
      const csvRows = [headers.join(',')];

      expenses.forEach(expense => {
        const row = [
          new Date(expense.date).toISOString(),
          `"${expense.merchant.replace(/"/g, '""')}"`,
          expense.amount,
          `"${expense.category}"`,
          `"${expense.paymentMethod}"`,
          `"${(expense.notes || '').replace(/"/g, '""')}"`,
          expense.source
        ];
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get statistics
  app.get("/api/expenses/stats/summary", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();

      // Calculate statistics
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= thisMonthStart);
      const lastMonthExpenses = expenses.filter(e =>
        new Date(e.date) >= lastMonthStart && new Date(e.date) <= lastMonthEnd
      );

      const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      // Calculate by category
      const categoryTotals: Record<string, number> = {};
      thisMonthExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
      });

      res.json({
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        average: expenses.length > 0 ? expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) / expenses.length : 0,
        byCategory: categoryTotals,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Budget routes

  // Create or update budget
  app.post("/api/budgets", async (req, res) => {
    try {
      const result = insertBudgetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromZodError(result.error).message
        });
      }

      const existing = await storage.getBudgetByCategory(result.data.category);

      if (existing) {
        const updated = await storage.updateBudget(result.data.category, result.data.amount);
        return res.json(updated);
      }

      const budget = await storage.createBudget(result.data);
      res.status(201).json(budget);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all budgets
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgets();
      res.json(budgets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get budget by category
  app.get("/api/budgets/:category", async (req, res) => {
    try {
      const budget = await storage.getBudgetByCategory(req.params.category);
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      res.json(budget);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete budget
  app.delete("/api/budgets/:category", async (req, res) => {
    try {
      const deleted = await storage.deleteBudget(req.params.category);
      if (!deleted) {
        return res.status(404).json({ error: "Budget not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get budget alerts
  app.get("/api/budgets/alerts/status", async (req, res) => {
    try {
      const status = await budgetAlertsService.getBudgetStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Email integration routes

  // Test email parsing
  app.post("/api/email/parse", async (req, res) => {
    try {
      const { subject, body, sender } = req.body;

      if (!subject || !body || !sender) {
        return res.status(400).json({
          error: "Missing required fields: subject, body, sender"
        });
      }

      const parsed = emailParser.parseEmail(subject, body, sender);

      if (!parsed) {
        return res.json({
          success: false,
          message: "Could not parse transaction from email"
        });
      }

      res.json({
        success: true,
        transaction: parsed
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Parse email and create expense
  app.post("/api/email/parse-and-create", async (req, res) => {
    try {
      const { subject, body, sender, emailId } = req.body;

      if (!subject || !body || !sender) {
        return res.status(400).json({
          error: "Missing required fields: subject, body, sender"
        });
      }

      const parsed = emailParser.parseEmail(subject, body, sender);

      if (!parsed) {
        return res.json({
          success: false,
          message: "Could not parse transaction from email"
        });
      }

      const expenseData = {
        ...emailParser.toExpense(parsed),
        source: "email" as const,
        emailId: emailId || null,
      };

      const result = insertExpenseSchema.safeParse(expenseData);
      if (!result.success) {
        return res.status(400).json({
          error: fromZodError(result.error).message
        });
      }

      const expense = await storage.createExpense(result.data);

      res.json({
        success: true,
        expense,
        transaction: parsed
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gmail integration routes

  // Get Gmail connection status
  app.get("/api/gmail/status", async (req, res) => {
    try {
      const isInitialized = gmailService.isInitialized();
      const pollingStatus = emailPollingService.getStatus();

      res.json({
        connected: isInitialized,
        polling: pollingStatus.isPolling,
        lastSync: pollingStatus.lastSyncTime,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger manual sync
  app.post("/api/gmail/sync", async (req, res) => {
    try {
      // Check if Gmail is initialized
      if (!gmailService.isInitialized()) {
        return res.status(400).json({
          success: false,
          error: "Gmail not configured. Please set up Gmail credentials."
        });
      }

      // Stop and restart the polling service to trigger immediate sync
      emailPollingService.stop();
      await emailPollingService.start(5);

      res.json({ success: true, message: "Manual sync triggered" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bank Pattern routes

  // Create bank pattern
  app.post("/api/bank-patterns", async (req, res) => {
    try {
      const result = insertBankPatternSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromZodError(result.error).message
        });
      }

      const bankPattern = await storage.createBankPattern(result.data);
      res.status(201).json(bankPattern);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all bank patterns
  app.get("/api/bank-patterns", async (req, res) => {
    try {
      const bankPatterns = await storage.getBankPatterns();
      res.json(bankPatterns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get bank pattern by ID
  app.get("/api/bank-patterns/:id", async (req, res) => {
    try {
      const bankPattern = await storage.getBankPatternById(req.params.id);
      if (!bankPattern) {
        return res.status(404).json({ error: "Bank pattern not found" });
      }
      res.json(bankPattern);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update bank pattern
  app.patch("/api/bank-patterns/:id", async (req, res) => {
    try {
      const bankPattern = await storage.updateBankPattern(req.params.id, req.body);
      if (!bankPattern) {
        return res.status(404).json({ error: "Bank pattern not found" });
      }
      res.json(bankPattern);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete bank pattern
  app.delete("/api/bank-patterns/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBankPattern(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Bank pattern not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Category routes

  // Create category
  app.post("/api/categories", async (req, res) => {
    try {
      const result = insertCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromZodError(result.error).message
        });
      }

      // Check if category already exists
      const existing = await storage.getCategoryByName(result.data.name);
      if (existing) {
        return res.status(400).json({ error: "Category already exists" });
      }

      const category = await storage.createCategory(result.data);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get category by ID
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update category
  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
