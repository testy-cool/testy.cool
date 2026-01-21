# Agent Guidelines

This repository is a monorepo using **TurboRepo**, **PNPM**, and **Next.js** (App Router).
It follows a strict structure separating the web application (`apps/web`) from shared packages (`packages/`).

## Project Structure

- `apps/web/`: Main Next.js application.
  - `app/`: App Router pages, layouts, and API routes.
  - `components/`: Application-specific UI components.
  - `content/`: MDX content (blog posts).
  - `lib/`: Helper functions and configuration.
- `packages/`: Shared workspace packages.
  - `ui/`: Shared UI components.
  - `shadverse/`: Shared utilities, Shadcn configuration, and component library.
  - `fumadocs-blog/`: Blog-specific logic.
  - `eslint-config/`, `typescript-config/`: Shared configs.

## Build, Lint, & Test Commands

Run these commands from the project root.

| Command            | Description                                                |
| :----------------- | :--------------------------------------------------------- |
| `pnpm install`     | Install dependencies across the workspace.                 |
| `pnpm dev`         | Start development servers (Turbo).                         |
| `pnpm web:dev`     | Start only the web app dev server (http://localhost:3000). |
| `pnpm build`       | Build all apps and packages.                               |
| `pnpm web:build`   | Build only the web app (Static Export).                    |
| `pnpm lint`        | Run ESLint across the workspace.                           |
| `pnpm check-types` | Run TypeScript type checking (`tsc --noEmit`).             |
| `pnpm format`      | Format code with Prettier.                                 |

### Testing Protocol

- **No automated test runner** (Jest/Vitest) is currently configured.
- **Do NOT** run `npm test` or `pnpm test`.
- Verify changes by running:
  1. `pnpm lint`
  2. `pnpm check-types`
  3. `pnpm web:build` (to ensure the static export succeeds).

## Code Style & Conventions

### 1. General Formatting

- **Indentation:** 2 spaces.
- **Quotes:** Double quotes (enforced by Prettier).
- **Semicolons:** Always use semicolons.
- **File Naming:**
  - Use `kebab-case.tsx` for components and utilities (e.g., `code-display.tsx`).
  - Next.js special files use default naming (`page.tsx`, `layout.tsx`).

### 2. Imports

- **Grouping:** Group imports in this order:
  1. External libraries (React, Next.js, etc.)
  2. Internal/Workspace packages (`@repo/ui`, `@repo/shadverse`)
  3. Local absolute imports (`@/lib/...`, `@/components/...`)
  4. Relative imports (`./styles.css`)
- **Type Imports:** Use `import type { ... }` for type-only imports.
- **Aliases:** Always use aliases (`@/` or `@repo/`) instead of long relative paths (`../../`).

### 3. React Components

- **Definition:**
  - Use `export const ComponentName = (...) =>` for reusable/shared components.
  - Use `export default function Page(...)` for App Router pages and layouts.
- **Props:**

  - Define props using `interface` or `type`.
  - Always destructure props in the function signature.
  - Support an optional `className` prop and merge it using `cn`.

  ```tsx
  import { cn } from "@repo/shadverse/lib/utils";

  interface MyProps {
    className?: string;
    children: React.ReactNode;
  }

  export const MyComponent = ({ className, children }: MyProps) => (
    <div className={cn("default-classes", className)}>{children}</div>
  );
  ```

### 4. TypeScript

- **Strict Mode:** TypeScript is strictly configured. Avoid `any`.
- **Children:** Use `React.ReactNode` for children props.
- **Async:** Server Components should be `async function`.

### 5. Styling (Tailwind CSS)

- Use Tailwind utility classes.
- Use the `cn()` utility from `@repo/shadverse/lib/utils` for conditional class merging.
- Avoid inline styles; use Tailwind classes or CSS modules (if necessary).

### 6. MDX Content

- Blog posts are located in `apps/web/content/blog/`.
- Filenames must be `kebab-case` and serve as the URL slug.
- Organize posts into category folders if applicable.

## Workflow Guidelines

- **Commits:** Use imperative mood, present tense (e.g., "Add feature", "Fix bug").
- **Verification:** Always run `pnpm check-types` and `pnpm lint` before considering a task complete.
- **Clean Code:** Remove unused imports and variables. Ensure no console logs remain in production code.
