# Bahmni Apps Frontend

A React TypeScript monorepo application for Bahmni applications, built with Nx, Webpack, and Carbon Design System. This application includes PWA support for offline capabilities.

## About Bahmni

Bahmni is an open-source healthcare information system designed to serve healthcare providers in resource-limited settings. It combines electronic medical records (EMR), hospital information management, and clinical workflows into a unified platform. Bahmni is built on OpenMRS and focuses on making healthcare delivery more efficient and patient-centric. The platform follows FHIR (Fast Healthcare Interoperability Resources) standards to ensure interoperability with other healthcare systems.

## Bahmni Lite 2.0

**Bahmni Lite 2.0** is the latest release of the modern, React-based Bahmni frontend — a complete rewrite of the legacy AngularJS frontend. This repository (`bahmni-apps-frontend`) is the home of all Bahmni Lite 2.0 UI modules.

### What's New in Bahmni Lite 2.0

- **React 19** — Upgraded from React 16 to React 19 across all modules for improved performance and concurrent rendering
- **Carbon Design System** — Full integration of IBM Carbon Design System for a consistent, accessible UI
- **FHIR R4 API layer** — Frontend now communicates with FHIR R4-compliant REST APIs
- **Progressive Web App (PWA)** — Offline capabilities via Workbox service worker
- **Nx Monorepo** — All Bahmni frontend apps and packages managed in a single Nx workspace for better code sharing and build performance
- **New modules included**: Clinical, Registration, Appointments, IPD (In-Patient Department), and extensible custom apps

### Upgrading from Bahmni Lite 1.x

If you are upgrading from Bahmni Lite 1.x, refer to the [Setup Guide](docs/setup-guide.md) for environment and Docker configuration changes. Node.js v22.x or later is recommended (previously v18.x).

---

## Features

- **React 19** — Latest React with concurrent rendering and improved hooks
- **Carbon Design System** — IBM's open-source design system for consistent UI
- **Nx Monorepo** — Scalable monorepo tooling for shared packages and apps
- **Webpack** — Module bundler for modern JavaScript applications
- **React Router v7** — Declarative routing for React applications
- **i18n Support** — Internationalization for multiple languages
- **Display Controls** — Reusable clinical data visualization components
- **PWA Support** — Offline-ready Progressive Web App via Workbox
- **FHIR R4** — Healthcare interoperability standards for API communication

## Applications

This monorepo contains the following application modules:

| Module | Description |
|--------|-------------|
| `admin` | Administration and system configuration module |
| `appointments` | Appointment scheduling and calendar management |
| `clinical` | Clinical encounter documentation and patient consultation |
| `command-palette` | Quick-access command palette for keyboard-driven navigation across modules |
| `home` | Application home screen and module launcher |
| `patient-documents` | Patient document upload, viewing, and management |
| `registration` | Patient registration and demographic data management |
| `reports` | Reporting, analytics, and data export module |

## Prerequisites

- Node.js (v22.x or later recommended)
- Yarn (v1.22.x or later recommended)

## Getting Started

### Installation

```bash
# Install dependencies
yarn
```

### Detailed Setup Guide

For a comprehensive setup guide including development environments, Docker configuration, authentication setup, and troubleshooting, please refer to our [Setup Guide](docs/setup-guide.md).

### Additional Documentation

- [Frontend Architecture](docs/architecture.md) - A comprehensive overview of the Bahmni Apps Frontend architecture
- [Project Structure](docs/project-structure.md) - A high-level overview of the project structure
- [i18n Guide](docs/i18n-guide.md) - Internationalization implementation details
- [Sortable Data Table Guide](docs/sortable-data-table-guide.md) - Usage of the sortable data table component
- [Data Table Guide](docs/data-table-guide.md) - Usage and customization of the data table component
- [Global Notification Guide](docs/global-notification-guide.md) - Using the notification system
- [Command Palette Guide](docs/command-palette-guide.md) - Implementing and extending the command palette
- [Header with Side Nav Guide](docs/header-with-side-nav-guide.md) - Configuring the header and side navigation
- [Consultation Event System](docs/consultation-event-system.md) - Inter-module event communication during consultations
- [CDSS Implementation Guide](docs/CDSS-Implementation-guide.md) - Clinical Decision Support System integration
- [Bahmni Colour Token System](docs/bahmni-colour-token-system.md) - Design tokens and theming guide
- [Bahmni Icon Guide](docs/bahmni-icon-guide.md) - Using and contributing icons

### Building for Production

```bash
# Build all apps in the workspace
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
# Run ESLint across all packages
yarn nx run-many --target=lint --all

# Fix ESLint issues automatically
yarn nx run-many --target=lint --all -- --fix
```

For a more detailed explanation of the project structure and architecture, see [Architecture Documentation](docs/architecture.md) and [Project Structure Documentation](docs/project-structure.md).

## Scripts

- `yarn dev` - Start the development server
- `yarn build` - Build all apps for production
- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn lint` - Run ESLint across all packages
- `yarn lint:fix` - Fix ESLint issues automatically
- `yarn format` - Format code with Prettier
- `yarn typecheck` - Run TypeScript type checking across all packages

## Technologies

- [React](https://react.dev/) (v19) — UI library with concurrent rendering
- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript
- [Carbon Design System](https://carbondesignsystem.com/) — IBM's design system
- [Nx](https://nx.dev/) — Monorepo build system and tooling
- [Webpack](https://webpack.js.org/) — Module bundler
- [Vite](https://vitejs.dev/) — Fast build tool used for library packages
- [React Router](https://reactrouter.com/) (v7) — Routing library
- [Zustand](https://zustand-demo.pmnd.rs/) — Lightweight client-side state management
- [TanStack Query](https://tanstack.com/query) (v5) — Server state management and data fetching
- [i18next](https://www.i18next.com/) — Internationalization framework
- [Jest](https://jestjs.io/) — Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — React testing utilities
- [Storybook](https://storybook.js.org/) — Isolated component development and visual testing
- [ESLint](https://eslint.org/) — Code quality tool
- [Prettier](https://prettier.io/) — Code formatter
- [Workbox](https://developers.google.com/web/tools/workbox) — PWA tooling

## License

This project is licensed under the [Mozilla Public License 2.0 (MPL-2.0)](LICENSE). See the `LICENSE` file for full terms.
