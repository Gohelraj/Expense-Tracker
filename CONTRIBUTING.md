# Contributing to Expense Tracker

Thank you for your interest in contributing to Expense Tracker! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach (optional)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/expense-tracker.git
   cd expense-tracker
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run check  # Type checking
   npm run dev    # Test locally
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

- `client/` - React frontend
- `server/` - Express backend
- `shared/` - Shared types and schemas
- `docs/` - Documentation

## Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Test your changes thoroughly
- Ensure existing functionality still works
- Add tests for new features when possible

## Documentation

- Update README.md if needed
- Add JSDoc comments for complex functions
- Update relevant documentation in `docs/`

## Questions?

Feel free to open an issue for any questions or clarifications.

Thank you for contributing! 🎉
