# Bahmni Apps Frontend

A React TypeScript monorepo application for Bahmni applications, built with Nx, Webpack, and Carbon Design System. This application includes PWA support for offline capabilities.

> **Current version:** 1.1.0 (Bahmni Lite 2.0 release)

## About Bahmni

Bahmni is an open-source healthcare information system designed to serve healthcare providers in resource-limited settings. It combines electronic medical records (EMR), hospital information management, and clinical workflows into a unified platform. Bahmni is built on OpenMRS and focuses on making healthcare delivery more efficient and patient-centric. The platform follows FHIR (Fast Healthcare Interoperability Resources) standards to ensure interoperability with other healthcare systems.

## Bahmni Lite 2.0 Highlights

Version 1.1.0 marks the **Bahmni Lite 2.0** milestone — a focused iteration that brings:

- **Command Palette** — keyboard-driven global navigation for faster clinical workflows
- **Consultation Event System** — structured event hooks for real-time consultation data exchange between modules
- **CDSS Integration** — Clinical Decision Support System implementation guide for embedding decision-support rules
- **Enhanced Display Controls** — improved reusable clinical data-visualization components
- **Colour Token System** — a unified design token layer for consistent theming across all Bahmni applications
- **Icon Guide** — standardized Bahmni icon library with usage patterns
- **Header & Side-Nav Improvements** — updated navigation shell with configurable side-nav
- **Document Print Button** — standardized print action component for clinical documents
- **PWA / Offline Support** — continued investment in service-worker-based offline capabilities via Workbox

For detailed notes on each feature see the [Additional Documentation](#additional-documentation) section below.

## Features

- **React** — UI library for building user interfaces
- **Carbon Design System** — IBM's open-source design system
- **Webpack** — Module bundler for modern JavaScript applications
- **React Router** — Declarative routing for React applications
- **i18n Support** — Internationalization for multiple languages
- **Display Controls** — Reusable clinical data visualization components

## Prerequisites

- Node.js (v18.x or later recommended)
- Yarn (v1.22.x or later recommended)

## Getting Started

### Installation

```bash
# Install dependencies
yarn
```

### Detailed Setup Guide

For a comprehensive setup guide including development environments, Docker configuration, authentication setup, and troubleshooting, please refer to our [Setup Guide](docs/setup-guide.md).

### Building for Production

```bash
# Build all applications
yarn build
```

The build artifacts will be stored in the `dist/` directory.

### Development

```bash
# Start the development server
yarn nx serve distro
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Linting

```bash
# Run ESLint to check for code quality issues
yarn lint

# Fix ESLint issues automatically
yarn lint:fix
```

### Nx Workspace Commands

This project uses [Nx](https://nx.dev/) for monorepo tooling. Common Nx commands:

```bash
# Run tests for affected projects only (recommended for PRs)
yarn nx affected --target=test --base=origin/main

# Run lint for affected projects only
yarn nx affected --target=lint --base=origin/main

# Build a specific app
yarn nx build <app-name>

# Run all tests
yarn nx run-many --all --target=test

# View the project dependency graph
yarn nx graph
```

For a more detailed explanation of the project structure and architecture, see [Architecture Documentation](docs/architecture.md) and [Project Structure Documentation](docs/project-structure.md).

## Scripts

- `yarn dev` — Start the development server
- `yarn build` — Build the application for production
- `yarn test` — Run tests
- `yarn test:watch` — Run tests in watch mode
- `yarn test:coverage` — Run tests with coverage report
- `yarn lint` — Run ESLint to check for code quality issues
- `yarn lint:fix` — Fix ESLint issues automatically
- `yarn format` — Format code with Prettier

## Technologies

- [React](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript
- [Carbon Design System](https://carbondesignsystem.com/) — IBM's design system
- [Webpack](https://webpack.js.org/) — Module bundler
- [React Router](https://reactrouter.com/) — Routing library
- [i18next](https://www.i18next.com/) — Internationalization framework
- [Jest](https://jestjs.io/) — Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — React testing utilities
- [ESLint](https://eslint.org/) — Code quality tool
- [Prettier](https://prettier.io/) — Code formatter
- [Workbox](https://developers.google.com/web/tools/workbox) — PWA tooling
- [Nx](https://nx.dev/) — Monorepo build system

## Additional Documentation

### Architecture & Structure

- [Frontend Architecture](docs/architecture.md) — Comprehensive overview of the Bahmni Apps Frontend architecture
- [Project Structure](docs/project-structure.md) — High-level overview of the monorepo project structure
- [Setup Guide](docs/setup-guide.md) — Step-by-step development environment setup

### Internationalization

- [i18n Guide](docs/i18n-guide.md) — Internationalization implementation details and contributor guidelines

### UI Components & Design

- [Sortable Data Table Guide](docs/sortable-data-table-guide.md) — Usage of the sortable data table component
- [Data Table Guide](docs/data-table-guide.md) — Comprehensive data table component usage and API
- [Global Notification Guide](docs/global-notification-guide.md) — Using the global notification system
- [Command Palette Guide](docs/command-palette-guide.md) — Keyboard-driven navigation component guide
- [Header with Side-Nav Guide](docs/header-with-side-nav-guide.md) — Navigation shell configuration and extension
- [Document Print Button Guide](docs/document-print-button-guide.md) — Standardized print action component usage
- [Bahmni Colour Token System](docs/bahmni-colour-token-system.md) — Design token reference for consistent theming
- [Bahmni Icon Guide](docs/bahmni-icon-guide.md) — Icon library usage patterns and catalogue

### Clinical Systems

- [Consultation Event System](docs/consultation-event-system.md) — Event-driven data exchange between consultation modules
- [CDSS Implementation Guide](docs/CDSS-Implementation-guide.md) — Clinical Decision Support System integration guide

## Contributing

We welcome contributions from the community! Here is how to get involved:

1. **Browse open issues** — check the [Bahmni Jira board](https://bahmni.atlassian.net/jira/software/c/projects/BAH/boards/131) for issues tagged `frontend` or `bahmni-apps-frontend`.
2. **Fork & branch** — fork this repository and create a feature branch named after the Jira issue (e.g. `BAH-1234`).
3. **Follow coding standards** — run `yarn lint:fix` and `yarn test` before pushing.
4. **Open a Pull Request** — target the `main` branch; fill in the PR template and link the Jira card.
5. **Review process** — all PRs require at least one approval from a Bahmni core team member.

For questions or discussions, please open a [GitHub Issue](https://github.com/Bahmni/bahmni-apps-frontend/issues) or join the [Bahmni Community](https://bahmni.org/community).

## License

This project is licensed under the **Mozilla Public License, Version 2.0**.
See the [LICENSE](LICENSE) file for the full license text.
