# Contributing to WatchThis!

Thanks for your interest in contributing! Here's everything you need to know.

## Getting Started

1. Fork the repository and clone your fork
2. Follow the [self-hosting guide](./pocketbase/README.md) to set up a local PocketBase instance
3. Copy `.env.example` to `.env` and point `VITE_POCKETBASE_URL` at your local instance
4. Run `npm install` and `npm run dev`

## Development Guidelines

### Code Style

- **TypeScript strict mode** — no `any`, use proper types from `types/index.ts`
- **Async/await** for all async operations, never raw `.then()` chains
- **Error handling** — wrap errors in `try/catch` and return `{ success, error }` objects
- **Imports** — use relative paths with file extensions for local modules

### Security

- **Never use `innerHTML`** with user-controlled data. Always use `createElement()` + `textContent`.
- **Never commit secrets** — PocketBase URL goes in `.env`, never in source code

### Content Scripts

- Prefix all CSS classes with `watchthis-*`
- Clean up injected elements on YouTube SPA navigation to prevent duplicates
- Use `createElement()` + `textContent` for all DOM manipulation (XSS prevention)

## Submitting a Pull Request

1. Create a branch: `git checkout -b feature/your-feature-name`
2. Make your changes and run `npm run compile` to check for TypeScript errors
3. Test in both Chrome (`npm run dev`) and Firefox (`npm run dev:firefox`)
4. Open a Pull Request with a clear description of what changes you made and why

## Reporting Issues

Please open a GitHub Issue with:

- Steps to reproduce
- Expected vs. actual behaviour
- Browser and extension version
