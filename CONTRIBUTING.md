# Contributing to Ecommerce Backend

Thank you for considering contributing to our NestJS ecommerce backend! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/abdulbasit0-UI/nestjs-ecommerce-backend.git`
3. Install dependencies: `npm install`
4. Copy environment variables: `cp .env.example .env`
5. Configure your database connection in `.env`
7. Start development server: `npm run start:dev`

## Code Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper typing for all functions and variables
- Follow NestJS decorators and dependency injection patterns

### Code Style
- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Write self-documenting code with clear comments when necessary

### Naming Conventions
- Use PascalCase for classes, interfaces, and types
- Use camelCase for variables, functions, and methods
- Use kebab-case for file names
- Use UPPER_SNAKE_CASE for constants and environment variables



## Making Changes

### Branch Naming
- Feature branches: `feature/description-of-feature`
- Bug fixes: `fix/description-of-bug`
- Hotfixes: `hotfix/description-of-hotfix`

### Commit Messages
Follow conventional commit format:
- `feat: add product search functionality`
- `fix: resolve order calculation bug`
- `docs: update API documentation`
- `test: add unit tests for auth service`

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all tests pass: `npm run test`
4. Run linting: `npm run lint`
5. Update documentation if needed
6. Create a pull request with:
   - Clear description of changes
   - Screenshots if UI-related
   - Reference to related issues






Please be respectful and professional in all interactions. We're committed to providing a welcoming environment for all contributors.

---

Thank you for contributing to our ecommerce platform! 🚀
