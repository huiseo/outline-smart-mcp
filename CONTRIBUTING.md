# Contributing

Thank you for your interest in contributing to the Outline Wiki MCP Server!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/outline-wiki-mcp.git
   cd outline-wiki-mcp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building

```bash
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Checking

```bash
npm run typecheck
```

## Code Style

- Use TypeScript for all source code
- Follow existing code patterns and conventions
- Add appropriate type annotations
- Write meaningful commit messages

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add a clear description of your changes
4. Link any related issues

## Project Structure

```
src/
├── index.ts              # Entry point
└── lib/
    ├── config.ts         # Configuration
    ├── context.ts        # Application context
    ├── errors.ts         # Error classes
    ├── api-client.ts     # HTTP client
    ├── schemas.ts        # Zod schemas
    ├── tools.ts          # Tool definitions
    ├── response.ts       # Response formatters
    ├── access-control.ts # Access control
    ├── messages.ts       # Messages
    ├── types/            # Type definitions
    ├── formatters/       # Data formatters
    └── handlers/         # Tool handlers
```

## Adding a New Tool

1. Add the Zod schema in `src/lib/schemas.ts`
2. Add the tool definition in `src/lib/tools.ts`
3. Add the handler in the appropriate file under `src/lib/handlers/`
4. Register the handler in `src/lib/handlers/index.ts`
5. Add tests for the new functionality
6. Update documentation

## Reporting Issues

- Use the GitHub issue tracker
- Provide clear reproduction steps
- Include relevant error messages and logs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
