# Bahmni Apps Frontend

A React TypeScript monorepo for the Bahmni frontend applications, built with Nx, Webpack, and the Carbon Design System. It is the frontend for **Bahmni Lite 2.0**.

## About Bahmni

Bahmni is an open-source healthcare information system designed to serve healthcare providers in resource-limited settings. It combines electronic medical records (EMR), hospital information management, and clinical workflows into a unified platform. Bahmni is built on OpenMRS and focuses on making healthcare delivery more efficient and patient-centric. The platform follows FHIR (Fast Healthcare Interoperability Resources) standards to ensure interoperability with other healthcare systems.

## Features

- **React** - UI library for building user interfaces
- **Carbon Design System** - IBM's open-source design system
- **Nx** - Monorepo tooling for task running, caching and affected-project detection
- **Webpack** - Module bundler for modern JavaScript applications
- **React Router** - Declarative routing for React applications
- **TanStack Query** - Server-state fetching and caching
- **Zustand** - Lightweight client-state management
- **i18n Support** - Internationalization for multiple languages
- **Display Controls** - Reusable clinical data visualization components
- **PWA tooling** - The distro build is configured with Workbox and a web app manifest. Offline support is not yet enabled, because the service worker is not currently registered by the application.

## Included applications and packages

### Applications (`apps/`)

| Application | Description |
| --- | --- |
| `admin` | Administration module |
| `appointments` | Appointments module |
| `clinical` | Clinical consultation module |
| `command-palette` | Command palette for quick navigation |
| `home` | Home / landing module |
| `patient-documents` | Patient documents module |
| `registration` | Patient registration module |
| `reports` | Reports module |
| `sample-app-module` | Example of an extensible app |

The `distro` project bundles the applications into a single deployable build.

### Shared packages (`packages/`)

| Package | Description |
| --- | --- |
| `bahmni-design-system` | Reusable UI components built on Carbon |
| `bahmni-services` | API integration and business logic |
| `bahmni-widgets` | Reusable clinical widgets |

## Prerequisites

- Node.js `>=22.22.0` (see the `engines` field in `package.json`)
- Yarn (v1.22.x)

## Getting Started

### Installation

```bash
# Install dependencies
yarn
```

### Development

```bash
# Start the development server
yarn dev
```

`yarn dev` is an alias for `nx serve distro`. The development server runs at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
# Build all applications
yarn build
```

The distro build output is written to `distro/dist/`.

### Linting and Type Checking

```bash
# Run ESLint on all projects
yarn lint

# Fix ESLint issues automatically
yarn lint:fix

# Type-check all projects
yarn typecheck
```

### Testing

```bash
# Run all tests
yarn test

# Run tests only for projects affected by your changes
yarn test:affected
```

### Detailed Setup Guide

For a comprehensive setup guide including development environments, Docker configuration, authentication setup, and troubleshooting, please refer to our [Setup Guide](docs/setup-guide.md).

## Scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Start the development server (`nx serve distro`) |
| `yarn build` | Build all projects for production |
| `yarn build:affected` | Build only projects affected by your changes |
| `yarn test` | Run all tests |
| `yarn test:affected` | Run tests for affected projects |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:coverage` | Run tests with coverage and merge the coverage reports |
| `yarn lint` | Run ESLint on all projects |
| `yarn lint:affected` | Run ESLint on affected projects |
| `yarn lint:fix` | Fix ESLint issues automatically |
| `yarn typecheck` | Run TypeScript type checks on all projects |
| `yarn typecheck:affected` | Run type checks on affected projects |
| `yarn clean` | Reset the Nx cache and remove the `dist` and `coverage` directories |
| `yarn create:app` | Scaffold a new application using `scripts/create-app.js` |

## Documentation

- [Setup Guide](docs/setup-guide.md) - Environment setup, Docker and troubleshooting
- [Frontend Architecture](docs/architecture.md) - A comprehensive overview of the Bahmni Apps Frontend architecture
- [Project Structure](docs/project-structure.md) - A high-level overview of the project structure
- [i18n Guide](docs/i18n-guide.md) - Internationalization implementation details
- [Sortable Data Table Guide](docs/sortable-data-table-guide.md) - Usage of the sortable data table component
- [Data Table Guide](docs/data-table-guide.md) - Usage of the data table component
- [Global Notification Guide](docs/global-notification-guide.md) - Using the notification system
- [Command Palette Guide](docs/command-palette-guide.md) - Command palette usage and extension
- [Consultation Event System](docs/consultation-event-system.md) - Events emitted during a consultation
- [Document Print Button Guide](docs/document-print-button-guide.md) - Using the document print button
- [Header with Side Nav Guide](docs/header-with-side-nav-guide.md) - Using the header with side navigation
- [Bahmni Colour Token System](docs/bahmni-colour-token-system.md) - Colour tokens used across the UI
- [Bahmni Icon Guide](docs/bahmni-icon-guide.md) - Icon usage guidelines
- [CDSS Implementation Guide](docs/CDSS-Implementation-guide.md) - Clinical decision support implementation
- [Architecture Decision Records](docs/adr/) - Recorded architecture decisions

## Technologies

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Nx](https://nx.dev/) - Monorepo build system
- [Carbon Design System](https://carbondesignsystem.com/) - IBM's design system
- [Webpack](https://webpack.js.org/) - Module bundler
- [React Router](https://reactrouter.com/) - Routing library
- [TanStack Query](https://tanstack.com/query/latest) - Data fetching and caching
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [i18next](https://www.i18next.com/) - Internationalization framework
- [Jest](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React testing utilities
- [ESLint](https://eslint.org/) - Code quality tool
- [Prettier](https://prettier.io/) - Code formatter
- [Workbox](https://developers.google.com/web/tools/workbox) - PWA tooling

## License

This project is licensed under the Mozilla Public License 2.0. See the [LICENSE](LICENSE) file for details.
