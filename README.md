# 💰 Expense Tracker

A modern, full-featured expense tracking application with email integration, budget alerts, and intelligent categorization. Built with React, TypeScript, and PostgreSQL.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Node](https://img.shields.io/badge/Node-20+-green)

## Features

### Core Features
- ✅ **Manual Expense Entry** - Add expenses with detailed information
- ✅ **Email Integration** - Automatic expense parsing from bank emails (Gmail)
- ✅ **Budget Management** - Set budgets per category with real-time alerts
- ✅ **Transaction Management** - View, edit, and delete expenses
- ✅ **Smart Categorization** - Automatic categorization of expenses
- ✅ **Dashboard Analytics** - Visual spending insights and trends

### New Features
- ✅ **CSV Export** - Export transactions with date range filtering
- ✅ **Bulk Delete** - Select and delete multiple transactions at once
- ✅ **Date Range Filters** - Filter by today, week, month, or custom range
- ✅ **Advanced Search** - Search by merchant name or notes
- ✅ **Budget Alerts** - Real-time notifications when approaching budget limits
- ✅ **User Authentication** - Login and registration system
- ✅ **Keyboard Shortcuts** - Fast navigation with keyboard commands
- ✅ **Transaction Details** - Detailed view with edit capabilities
- ✅ **Bank Pattern Management** - Configure email patterns for Indian banks
- ✅ **Category Management** - Create and manage expense categories with keywords

## Keyboard Shortcuts

- `Ctrl + N` - Add new expense
- `Ctrl + K` - Focus search
- `Ctrl + A` - Select all transactions
- `Ctrl + Shift + E` - Export to CSV
- `Delete` - Delete selected transactions
- `Escape` - Clear selection / Close modal
- `Shift + ?` - Show keyboard shortcuts help

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- PostgreSQL database
- (Optional) Gmail API credentials for email integration

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/expense-tracker.git
   cd expense-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your database URL and optional Gmail credentials.

4. **Set up the database:**
   ```bash
   npm run db:push
   ```

5. **Seed default data (categories and bank patterns):**
   ```bash
   npm run db:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to `http://localhost:5173`

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |
| `npm run db:seed` | Seed default categories and bank patterns |

## 🔧 Configuration

### Database Setup

This project uses PostgreSQL. You can use:
- [Neon](https://neon.tech) - Serverless PostgreSQL (recommended)
- Local PostgreSQL installation
- Any PostgreSQL hosting service

Update your `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgres://username:password@host:5432/database
```

### Gmail Integration (Optional)

To enable automatic expense parsing from bank emails:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add credentials to `.env`

See [GMAIL_SETUP.md](./docs/GMAIL_SETUP.md) for detailed instructions.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `PATCH /api/expenses/:id` - Partial update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/bulk-delete` - Delete multiple expenses
- `GET /api/expenses/export/csv` - Export expenses as CSV
- `GET /api/expenses/stats/summary` - Get expense statistics

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create or update budget
- `GET /api/budgets/:category` - Get budget by category
- `DELETE /api/budgets/:category` - Delete budget
- `GET /api/budgets/alerts/status` - Get budget alert status

### Email Integration
- `GET /api/gmail/status` - Get Gmail connection status
- `POST /api/gmail/sync` - Trigger manual email sync
- `POST /api/email/parse` - Test email parsing
- `POST /api/email/parse-and-create` - Parse email and create expense

### Bank Patterns
- `GET /api/bank-patterns` - Get all bank patterns
- `POST /api/bank-patterns` - Create bank pattern
- `GET /api/bank-patterns/:id` - Get bank pattern by ID
- `PATCH /api/bank-patterns/:id` - Update bank pattern
- `DELETE /api/bank-patterns/:id` - Delete bank pattern

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category by ID
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (Neon), Drizzle ORM
- **State Management:** TanStack Query
- **Email:** Gmail API
- **Authentication:** bcryptjs

## 📁 Project Structure

```
expense-tracker/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui base components
│   │   │   ├── BankPatternsManager.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   └── ...
│   │   ├── pages/           # Route-level page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utility functions
│   └── public/              # Static assets
├── server/                   # Express.js backend API
│   ├── routes.ts            # API route definitions
│   ├── db.ts                # Database connection
│   ├── db-storage.ts        # Database operations
│   ├── email-parser.ts      # Email parsing logic
│   ├── gmail-service.ts     # Gmail API integration
│   ├── seed-defaults.ts     # Default data seeding
│   └── ...
├── shared/                   # Shared TypeScript types
│   └── schema.ts            # Database schemas & Zod validation
├── docs/                     # Documentation
│   ├── SETTINGS_GUIDE.md    # User guide for settings
│   ├── MIGRATION_GUIDE.md   # Technical migration guide
│   └── NEW_FEATURES.md      # Feature documentation
├── .env.example             # Environment variables template
└── package.json             # Dependencies and scripts
```

## 📚 Documentation

- [Settings Guide](./docs/SETTINGS_GUIDE.md) - How to manage categories and bank patterns
- [Gmail Setup](./docs/GMAIL_SETUP.md) - Configure Gmail integration
- [New Features](./docs/NEW_FEATURES.md) - Latest feature documentation
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Technical implementation details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [TanStack Query](https://tanstack.com/query) - Data fetching and caching
- [Recharts](https://recharts.org/) - Chart library

## 📧 Support

For support, please open an issue in the GitHub repository.

---

Made with ❤️ using React, TypeScript, and PostgreSQL