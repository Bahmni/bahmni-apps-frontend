# Adding a New App/Module to the Distro

This comprehensive guide explains how to create a new application or module within the Bahmni Frontend monorepo and integrate it into the distro.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Generate a New App Module](#step-1-generate-a-new-app-module)
- [Step 2: Configure the App Structure](#step-2-configure-the-app-structure)
- [Step 3: Configure Package Exports](#step-3-configure-package-exports)
- [Step 4: Configure Build Settings](#step-4-configure-build-settings)
- [Step 5: Add Styles](#step-5-add-styles)
- [Step 6: Wire the App into the Distro](#step-6-wire-the-app-into-the-distro)
- [Step 7: Build and Serve](#step-7-build-and-serve)
- [Best Practices](#best-practices)
- [NX Commands Reference](#nx-commands-reference)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

The Bahmni Frontend uses a monorepo structure powered by NX. Each app/module is a separate package that can be developed independently and bundled together in the distro (distribution) package. Apps are built as library modules using Vite and consumed by the distro via React Router's lazy loading.

### Architecture

```txt
bahmni-frontend/
├── apps/                      # Individual app modules
│   ├── clinical/              # Clinical app
│   ├── registration/          # Registration app
│   └── your-new-app/          # Your new app
├── distro/                    # Distribution package
│   ├── src/
│   │   ├── app/
│   │   │   └── app.tsx        # Main routing configuration
│   │   ├── main.tsx           # Application entry point
│   │   └── styles.scss        # Global styles import
│   └── webpack.config.js      # Webpack configuration
└── packages/                  # Shared packages
```

## Prerequisites

Before creating a new app, ensure you have:

1. Node.js (version specified in package.json)
2. Yarn package manager
3. NX CLI understanding
4. Familiarity with React, TypeScript, and React Router

## Step 1: Generate a New App Module

Use the NX React library generator to create a new app module:

```bash
# Generate a new React library with Vite as the bundler
yarn nx generate @nx/react:library your-app-name \
  --directory=apps/your-app-name \
  --bundler=vite \
  --unitTestRunner=jest \
  --style=scss \
  --linter=eslint \
  --component=false
```

This command will:

- Create a new library in `apps/your-app-name`
- Configure Vite as the build tool
- Set up Jest for unit testing
- Configure SCSS support
- Set up ESLint

### Alternative: Manual Creation

If you prefer manual setup or need more control, follow the structure of `apps/sample-app-module`:

```bash
mkdir -p apps/your-app-name/src
cd apps/your-app-name
```

Create the following files:

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.lib.json`
- `tsconfig.spec.json`
- `jest.config.ts`
- `eslint.config.ts`

## Step 2: Configure the App Structure

### Create App Component

Create your main App component at `apps/your-app-name/src/App.tsx`:

```tsx
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

const YourAppName: React.FC = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      {/* Add more routes as needed */}
    </Routes>
  );
};

export { YourAppName };
```

### Create Entry Point

Create the main entry point at `apps/your-app-name/src/index.ts`:

```typescript
import { YourAppName } from './App';

// Import any shared styles from packages
// import '@bahmni-frontend/bahmni-widgets/styles';

export { YourAppName };
```

### Directory Structure

Organize your app following this structure:

```txt
apps/your-app-name/
├── src/
│   ├── App.tsx                 # Main app component with routing
│   ├── index.ts                # Entry point (exports the app)
│   ├── pages/                  # Page components
│   │   └── HomePage.tsx
│   ├── components/             # App-specific components
│   ├── hooks/                  # Custom hooks
│   ├── services/               # API services
│   ├── types/                  # TypeScript types
│   ├── config/                 # Configuration files
│   └── styles/                 # Component styles
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── jest.config.ts
└── eslint.config.ts
```

## Step 3: Configure Package Exports

Update `apps/your-app-name/package.json`:

```json
{
  "name": "@bahmni-frontend/your-app-name",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./styles": "./dist/index.css"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

**Key Points:**

- The `exports` field defines how your module can be imported
- The `development` export points to source for faster dev builds
- The `styles` export allows importing CSS separately
- `peerDependencies` ensure React is provided by the consuming app

## Step 4: Configure Build Settings

### Vite Configuration

Create or update `apps/your-app-name/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/your-app-name',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: '@bahmni-frontend/your-app-name',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      // External packages that should not be bundled
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        '@tanstack/react-query',
      ],
    },
  },
}));
```

**Important Considerations:**

- Mark shared dependencies as `external` to prevent bundling
- Use library mode for building
- Generate TypeScript declarations with `vite-plugin-dts`

### TypeScript Configuration

Update `apps/your-app-name/tsconfig.lib.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": ["node", "vite/client"]
  },
  "exclude": [
    "jest.config.ts",
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.tsx",
    "src/**/*.test.tsx",
    "src/**/*.spec.js",
    "src/**/*.test.js",
    "src/**/*.spec.jsx",
    "src/**/*.test.jsx"
  ],
  "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"]
}
```

## Step 5: Add Styles

### Approach 1: Component-Level Styles (Recommended)

Use CSS modules for component-specific styles:

```tsx
// Component file
import styles from './MyComponent.module.scss';

export const MyComponent = () => {
  return <div className={styles.container}>Content</div>;
};
```

Create `MyComponent.module.scss`:

```scss
.container {
  padding: 1rem;
  background-color: #f5f5f5;
}
```

### Approach 2: App-Level Styles

If your app needs global styles, import them in the entry point:

```typescript
// apps/your-app-name/src/index.ts
import { YourAppName } from './App';
import './styles/global.scss';

export { YourAppName };
```

### Approach 3: Shared Package Styles

Import styles from shared packages:

```typescript
// apps/your-app-name/src/index.ts
import { YourAppName } from './App';
import '@bahmni-frontend/bahmni-widgets/styles';

export { YourAppName };
```

### Wire Styles into Distro

Update `distro/src/styles.scss` to import your app's styles:

```scss
@use "@bahmni-frontend/clinical/styles" as clinicalStyles;
@use "@bahmni-frontend/registration/styles" as registrationStyles;
@use "@bahmni-frontend/your-app-name/styles" as yourAppStyles;
```

**Note:** This is only necessary if your app exports a global stylesheet. Most apps use component-level styles and don't need this step.

## Step 6: Wire the App into the Distro

### Import the App in Distro Router

Update `distro/src/app/app.tsx`:

```tsx
import { Loading } from '@bahmni-frontend/bahmni-design-system';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const IndexPage = lazy(() =>
  import('./IndexPage').then((module) => ({ default: module.IndexPage }))
);
const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
);
const ClinicalApp = lazy(() =>
  import('@bahmni-frontend/clinical').then((module) => ({
    default: module.ClinicalApp,
  }))
);
const RegistrationApp = lazy(() =>
  import('@bahmni-frontend/registration').then((module) => ({
    default: module.RegistrationApp,
  }))
);
// Add your new app
const YourAppName = lazy(() =>
  import('@bahmni-frontend/your-app-name').then((module) => ({
    default: module.YourAppName,
  }))
);

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<IndexPage />} />
        <Route path="/clinical/*" element={<ClinicalApp />} />
        <Route path="/registration/*" element={<RegistrationApp />} />
        <Route path="/your-app-path/*" element={<YourAppName />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
```

**Key Points:**

- Use React Router's `lazy()` for code splitting
- The `/*` wildcard allows nested routing within your app
- The path `/your-app-path` becomes the base URL for your app

## Step 7: Build and Serve

### Development Workflow

1. **Start Development Server:**

   ```bash
   # Serve the distro with all apps
   yarn nx serve distro
   ```

   The dev server will run at `http://localhost:3000`

2. **Build Your App:**

   ```bash
   # Build only your app
   yarn nx build your-app-name
   ```

3. **Build All Apps:**

   ```bash
   # Build all apps that the distro depends on
   yarn nx build distro
   ```

4. **Run Tests:**

   ```bash
   # Test your app
   yarn nx test your-app-name

   # Test with coverage
   yarn nx test your-app-name --coverage
   ```

5. **Lint Your App:**

   ```bash
   yarn nx lint your-app-name
   ```

## Best Practices

### 1. Keep Apps Independent

- Each app should be self-contained and independently testable
- Minimize cross-app dependencies
- Share common functionality through packages, not app-to-app imports

### 2. Use Lazy Loading

- Always use React Router's `lazy()` for code splitting
- This keeps the initial bundle size small
- Each app loads only when accessed

### 3. External Dependencies

Mark these dependencies as external in `vite.config.ts`:

- `react`, `react-dom`, `react/jsx-runtime`
- `react-router-dom`
- `@tanstack/react-query`
- Any other shared dependencies from packages

### 4. Style Organization

Follow this hierarchy:

1. Component-level styles (CSS modules) - Most granular
2. App-level styles - App-specific global styles
3. Shared package styles - Common design system styles
4. Distro global styles - Top-level overrides

### 5. TypeScript Types

- Define types in `src/types/`
- Export public types from your entry point if needed by other apps
- Use strict TypeScript configuration

### 6. Testing

- Write unit tests for components and hooks
- Use Jest and React Testing Library
- Aim for high coverage on critical paths
- Mock external dependencies

### 7. State Management

Consider this hierarchy:

1. Local component state (useState)
2. URL state (React Router)
3. React Query for server state
4. Context API for app-wide state
5. Zustand for complex cross-component state

### 8. Package Naming

Follow the convention: `@bahmni-frontend/app-name`

- Use kebab-case for app names
- Keep names descriptive and concise
- Prefix with `@bahmni-frontend/` for scoping

### 9. Initialization

For apps that need initialization (i18n, services, etc.), follow this pattern:

```tsx
const YourApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n();
        initFontAwesome();
        initializeAuditListener();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Your routes */}
    </Routes>
  );
};
```

### 10. Error Boundaries

Wrap your app with error boundaries for graceful error handling:

```tsx
import { ErrorBoundary } from '@bahmni-frontend/bahmni-widgets';

const YourApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Your routes */}
      </Routes>
    </ErrorBoundary>
  );
};
```

## NX Commands Reference

### Building

```bash
# Build a specific app
yarn nx build your-app-name

# Build all affected apps
yarn nx affected:build

# Build with production optimization
NODE_ENV=production yarn nx build your-app-name

# Build and watch for changes
yarn nx build your-app-name --watch
```

### Serving

```bash
# Serve the distro (includes all apps)
yarn nx serve distro

# Serve on a different port
yarn nx serve distro --port=4000

# Serve with production mode
yarn nx serve distro --configuration=production
```

### Testing

```bash
# Run tests for your app
yarn nx test your-app-name

# Run tests in watch mode
yarn nx test your-app-name --watch

# Run tests with coverage
yarn nx test your-app-name --coverage

# Run all tests
yarn nx run-many --target=test --all
```

### Linting

```bash
# Lint your app
yarn nx lint your-app-name

# Lint and fix
yarn nx lint your-app-name --fix

# Lint all apps
yarn nx run-many --target=lint --all
```

### Type Checking

```bash
# Type check your app
yarn nx typecheck your-app-name

# Type check all apps
yarn nx run-many --target=typecheck --all
```

### Other Useful Commands

```bash
# Show dependency graph
yarn nx graph

# Show affected projects
yarn nx affected:apps

# Clear NX cache
yarn nx reset

# Generate a component within your app
yarn nx generate @nx/react:component ComponentName \
  --project=your-app-name \
  --directory=src/components
```

## Troubleshooting

### Build Errors

**Problem:** `Module not found` errors during build

**Solution:**

1. Ensure dependencies are installed: `yarn install`
2. Check external dependencies in `vite.config.ts`
3. Verify package.json exports configuration
4. Clear NX cache: `yarn nx reset`

### Style Issues

**Problem:** Styles not loading in distro

**Solution:**

1. Verify styles are exported in package.json under `"./styles"`
2. Check if styles are imported in `distro/src/styles.scss`
3. Ensure SCSS files are included in build output

### Routing Issues

**Problem:** App not accessible at expected path

**Solution:**

1. Verify route path in `distro/src/app/app.tsx`
2. Ensure the app component exports a default export
3. Check that nested routes use the `/*` wildcard
4. Verify lazy import path matches package name

### TypeScript Errors

**Problem:** Type errors in imports

**Solution:**

1. Check tsconfig paths configuration
2. Verify types are exported from app entry point
3. Rebuild the app to generate type definitions: `yarn nx build your-app-name`
4. Check that `vite-plugin-dts` is configured correctly

### Development Server Issues

**Problem:** Changes not reflecting in dev server

**Solution:**

1. Hard refresh the browser (Cmd/Ctrl + Shift + R)
2. Clear browser cache
3. Restart dev server
4. Check for build errors in terminal
5. Clear NX cache: `yarn nx reset`

## Additional Resources

- [NX Documentation](https://nx.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Project Architecture](./architecture.md)
- [Project Structure](./project-structure.md)
