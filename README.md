# Bahmni Apps Frontend

[![Build & Publish](https://github.com/Bahmni/bahmni-apps-frontend/actions/workflows/build-and-publish.yml/badge.svg)](https://github.com/Bahmni/bahmni-apps-frontend/actions/workflows/build-and-publish.yml)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/Bahmni/bahmni-apps-frontend/blob/main/.appversion)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.x-brightgreen)](https://nodejs.org/)

A React TypeScript monorepo application for Bahmni, built with [Nx](https://nx.dev/), Webpack, and the [Carbon Design System](https://carbondesignsystem.com/). Includes PWA support for offline capabilities.

> **Current version:** 1.1.0 (Bahmni Lite 2.0 release) — version is tracked in `.appversion`; `package.json` intentionally retains the initial monorepo version `0.1.0`.

## About Bahmni

[Bahmni](https://bahmni.org/) is an open-source healthcare information system designed to serve healthcare providers in resource-limited settings. It combines electronic medical records (EMR), hospital information management, and clinical workflows into a unified platform. Bahmni is built on [OpenMRS](https://openmrs.org/) and follows [FHIR](https://www.hl7.org/fhir/) (Fast Healthcare Interoperability Resources) standards to ensure interoperability with other healthcare systems.

This repository hosts the **React frontend monorepo** for Bahmni Lite, containing all clinical, administrative, and registration applications under one Nx workspace.

## Bahmni Lite 2.0 Highlights

Version 1.1.0 marks the **Bahmni Lite 2.0** milestone — a focused iteration that brings:

- **Command Palette** — keyboard-driven global navigation for faster clinical workflows
- **Consultation Event System** — structured event hooks for real-time consultation data exchange between modules
- **CDSS Integration** — Clinical Decision Support System implementation guide for embedding decision-support rules
- **Colour Token System** — a unified design token layer for consistent theming across all Bahmni applications
- **Icon Guide** — standardized Bahmni icon library with usage patterns
- **Header & Side-Nav Improvements** — updated navigation shell with configurable side-nav
- **Document Print Button** — standardized print action component for clinical documents
- **PWA / Offline Support** — continued investment in service-worker-based offline capabilities via Workbox

For documentation on each feature, see the [Additional Documentation](#additional-documentation) section below.

## Features

- **React 19** — latest React with concurrent features
- **Carbon Design System** — IBM's open-source design system for healthcare UIs
- **Nx Monorepo Tooling** — incremental builds, affected-only testing/lint, and a rich project-graph for fast CI
- **Webpack** — primary module bundler; Vite is used for library builds
- **React Router v7** — file-based and code-based declarative routing
- **i18n Support** — Internationalization for multiple languages via i18next
- **Storybook** — isolated component development and visual catalogue (`.storybook/` config present)
- **PWA / Offline Support** — Workbox-powered service worker for offline capability
- **Accessibility Testing** — jest-axe a11y assertions integrated into unit tests
- **State Management** — Zustand (client state) + TanStack Query v5 (server state / caching)
- **Display Controls** — Reusable clinical data visualization components

## Prerequisites

- **Node.js v22.x or later** (LTS recommended — CI pins `NODE_VERSION: "22"` in `.github/workflows/build-and-publish.yml`)
- **Yarn v1.22.x or later**

## Getting Started

### Installation

```bash
# Install dependencies
yarn

# For CI environments — use the immutable install to prevent lockfile drift
yarn install --frozen-lockfile
```

### Detailed Setup Guide

For a comprehensive setup guide including development environments, Docker configuration, authentication setup, and troubleshooting, see [Setup Guide](docs/setup-guide.md).

### Building for Production

```bash
# Build all applications
yarn build

# Build only affected applications (faster for feature branches)
yarn build:affected
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
# Run ESLint on all projects
yarn lint

# Fix ESLint issues automatically
yarn lint:fix

# Run lint only on affected projects (recommended for PRs)
yarn lint:affected
```

## Storybook

A Storybook configuration (`.storybook/`) is present for isolated component development and visual exploration. Stories live under each package's `src/**/*.stories.tsx` files.

> **Note:** The Storybook runtime (`@nx/storybook` / `storybook`) is not yet listed as a project dependency and no Nx `storybook` target is currently wired up. The `.storybook/` configuration and story files are in place; installing `@nx/storybook` and adding a project target are the follow-up steps required before Storybook can be run locally.

## Nx Workspace Commands

This project uses [Nx](https://nx.dev/) for monorepo tooling. The repository ships dedicated `package.json` scripts that already encode the correct flags (test scripts use `--parallel=1`; lint scripts do not); **prefer those where available** (see the [Scripts](#scripts) section below):

```bash
# Run tests for affected projects only (recommended for PRs)
yarn test:affected

# Run lint for affected projects only
yarn lint:affected

# Run type-check for affected projects only
yarn typecheck:affected

# Build only affected applications
yarn build:affected

# List all projects in the workspace
yarn nx show projects

# View the project dependency graph
yarn nx graph

# Build a single app
# Use `yarn nx show projects` to list exact project names (e.g. clinical-app, not clinical)
yarn nx build clinical-app

# Run all tests (serial execution required by this repo's Jest suites)
yarn nx run-many --all --target=test --parallel=1

# Run affected lint and test against a specific base branch
yarn nx affected --target=lint --base=origin/main
yarn nx affected --target=test --base=origin/main

# Reset Nx cache and clean build artifacts
yarn clean
```

For a more detailed explanation of the project structure and architecture, see [Architecture Documentation](docs/architecture.md) and [Project Structure Documentation](docs/project-structure.md).

## Scripts

All scripts in `package.json`:

| Script | Description |
|---|---|
| `yarn dev` | Start the development server (`nx serve distro`) |
| `yarn build` | Build all applications for production |
| `yarn build:affected` | Build only affected applications |
| `yarn test` | Run all tests (serial execution with `--parallel=1`) |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:coverage` | Run tests with coverage report and merge results |
| `yarn test:affected` | Run tests for affected projects only (uses `--parallel=1`) |
| `yarn lint` | Run ESLint across all projects |
| `yarn lint:fix` | Fix ESLint issues automatically across all projects |
| `yarn lint:affected` | Run lint for affected projects only |
| `yarn typecheck` | Run TypeScript type-check across all projects |
| `yarn typecheck:affected` | Run type-check for affected projects only |
| `yarn clean` | Reset Nx cache and remove `dist/` and `coverage/` directories |
| `yarn create:app` | Scaffold a new Bahmni application in the monorepo |
| `yarn prepare` | Install Husky git hooks (runs automatically after `yarn install`) |

## Technologies

| Technology | Version | Role |
|---|---|---|
| [React](https://react.dev/) | ^19.0.0 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | ~5.9.x | Type-safe JavaScript |
| [Carbon Design System](https://carbondesignsystem.com/) | latest | IBM's healthcare design system |
| [Nx](https://nx.dev/) | 22.x | Monorepo build system & task orchestration |
| [Webpack](https://webpack.js.org/) | 5.x | Primary module bundler for apps |
| [Vite](https://vite.dev/) | ^7.0.0 | Module bundler for library builds (`@nx/vite`) |
| [React Router](https://reactrouter.com/) | ^7.x | Routing library (react-router-dom) |
| [TanStack Query](https://tanstack.com/query/v5) | ^5.x | Server state management and data fetching |
| [Zustand](https://zustand.docs.pmnd.rs/) | ^5.x | Lightweight client-side state stores |
| [i18next](https://www.i18next.com/) | latest | Internationalization framework |
| [Jest](https://jestjs.io/) | latest | Testing framework |
| [Vitest](https://vitest.dev/) | ^3.0.0 | Fast unit testing for Vite-based libs |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | latest | React component testing utilities |
| [jest-axe](https://github.com/nickcolley/jest-axe) | ^10.0.0 | Automated accessibility (a11y) assertions |
| [ESLint](https://eslint.org/) | latest | Code quality and style enforcement |
| [Prettier](https://prettier.io/) | latest | Code formatter |
| [Sass](https://sass-lang.com/) | 1.77.x | SCSS stylesheets |
| [Storybook](https://storybook.js.org/) | config present | Component explorer and visual catalogue |
| [Husky](https://typicode.github.io/husky/) | ^9.x | Git pre-commit hooks |
| [lint-staged](https://github.com/lint-staged/lint-staged) | ^15.x | Run linters on staged files only |
| [Workbox](https://developers.google.com/web/tools/workbox) | latest | PWA / service-worker tooling |

## State Management

This project uses a layered approach to state:

- **React Context API** — global app-level state (user session, theme, locale)
- **Zustand v5** — lightweight client-side state stores for UI state that needs to be shared across component trees without prop drilling
- **TanStack Query v5** — server-state management: data fetching, background refetching, caching, and synchronisation with the backend

## Code Quality & Pre-commit Hooks

| Tool | Purpose |
|---|---|
| **Husky** | Manages Git lifecycle hooks (pre-commit, commit-msg) |
| **lint-staged** | Runs ESLint + Prettier automatically on staged `.ts`/`.tsx` files before every commit |
| **SonarQube** | Static analysis and code quality gate; configuration in `sonar-project.properties` |
| **EditorConfig** | Consistent editor settings (indentation, line endings) via `.editorconfig` |
| **TruffleHog** | Secret scanning on every push (`.github/workflows/trufflehog.yml`) |
| **Semgrep** | Lightweight static analysis for security patterns (`.github/workflows/semgrep.yml`) |

To set up the hooks locally after cloning, run `yarn` (or `yarn install`). The `prepare` script runs `husky` automatically.

## Accessibility

Accessibility is a first-class concern in Bahmni Apps Frontend:

- **[jest-axe](https://github.com/nickcolley/jest-axe)** (`^10.0.0`) is included as a dev dependency and integrated into the unit test suite.
- Component tests should include axe assertions to catch WCAG violations automatically:
  ```typescript
  import { axe, toHaveNoViolations } from 'jest-axe';
  expect.extend(toHaveNoViolations);

  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    expect(await axe(container)).toHaveNoViolations();
  });
  ```
- Carbon Design System components used throughout the app are built with accessibility in mind, but custom components must be tested independently.

## Docker & Deployment

A `Dockerfile` and supporting configuration are located in the `docker/` directory:

```
docker/
├── Dockerfile              # Multi-stage production image
└── httpd_directory.conf    # Apache HTTPD virtual-host configuration
```

The CI/CD pipeline (`.github/workflows/build-and-publish.yml`) automatically builds and publishes the Docker image to `bahmni/bahmni-apps-frontend` on Docker Hub for pushes to `main`, `release-*` branches, and semver tags.

For local Docker builds and the full deployment setup (environment variables, compose stack), refer to the [Setup Guide](docs/setup-guide.md).

## Helm / Kubernetes

Kubernetes deployment is managed via Helm charts located in the `helm/` directory:

```
helm/
├── Chart.yaml        # Chart metadata and version
├── values.yaml       # Default Helm values
└── templates/        # Kubernetes manifest templates
```

The CI/CD pipeline commits updated Helm chart values on every versioned release. Consult `helm/values.yaml` for configurable parameters (image tag, replica count, ingress, etc.).

## Architecture Decision Records

Significant architectural decisions for the project are documented as ADRs in `docs/adr/`:

- [CDSS ADR](docs/adr/CDSS-ADR.md) — Architecture decision record for Clinical Decision Support System integration

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
- [Prescription Category Print Plan](docs/BAH-4881-prescription-category-print-plan.md) — Implementation notes for prescription category print functionality

## Security

Please **do not** report security vulnerabilities through public GitHub issues or pull requests.

Report them privately to **security@bahmni.org**.

The full security reporting, discussion, and disclosure process is documented in [SECURITY.md](SECURITY.md) and on the [Bahmni Security wiki](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/884277257/Security+-+Reporting+and+Discussion).

## Contributing

We welcome contributions from the community! Here is how to get involved:

1. **Browse open issues** — check the [Bahmni Jira board](https://bahmni.atlassian.net/jira/software/c/projects/BAH/boards/131) for issues tagged `frontend` or `bahmni-apps-frontend`.
2. **Fork & branch** — fork this repository and create a feature branch named after the Jira issue (e.g. `BAH-1234`).
3. **Follow coding standards** — run `yarn lint:fix` and `yarn test` before pushing.
4. **Open a Pull Request** — target the `main` branch; fill in the PR template and link the Jira card.
5. **Review process** — all PRs require at least one approval from a Bahmni core team member.

For questions or discussions, open a [GitHub Issue](https://github.com/Bahmni/bahmni-apps-frontend/issues), join the conversation on [GitHub Discussions](https://github.com/Bahmni/bahmni-apps-frontend/discussions), or connect with the wider community via the [Bahmni Community](https://bahmni.org/community).

## Notice & Legal

This project is Copyright © 2025 Thoughtworks, Inc. and contributors. Third-party dependency attributions are listed in [NOTICE](NOTICE). For a full list of transitive dependency licences, refer to the `package.json` files within each application module.

## License

This project is licensed under the **Mozilla Public License, Version 2.0**.
See the [LICENSE](LICENSE) file for the full license text.
