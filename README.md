# Bahmni Clinical Frontend (NX Workspace)

A React TypeScript monorepo for the Bahmni Clinical module, built with NX workspace, Webpack and Carbon Design System. This NX workspace contains multiple applications and shared packages for clinical workflows.

## Features

- **NX Workspace** - Modern monorepo tooling for scalable development
- **Multiple Applications** - Modular apps for different clinical workflows
- **Shared Packages** - Reusable design system, services, and widgets
- **TypeScript** - Type-safe JavaScript
- **React** - UI library for building user interfaces
- **Carbon Design System** - IBM's open-source design system
- **Webpack** - Module bundler for modern JavaScript applications
- **PWA Support** - Progressive Web App capabilities for offline use
- **React Router** - Declarative routing for React applications
- **i18n Support** - Internationalization for multiple languages
- **Jest & Testing Library** - Comprehensive testing framework
- **Display Controls** - Reusable clinical data visualization components

## Prerequisites

- Node.js (v18.x or later recommended)
- Yarn (v1.22.x or later recommended)

## Getting Started

### Installation

```bash
# Install dependencies
yarn install
```

### Detailed Setup Guide

For a comprehensive setup guide including development environments, Docker configuration, authentication setup, and troubleshooting, please refer to our [Setup Guide](docs/setup-guide.md).

### Additional Documentation

- [Frontend Architecture](docs/architecture.md) - A comprehensive overview of the Bahmni Clinical Frontend architecture
- [Project Structure](docs/project-structure.md) - A high-level overview of the project structure
- [i18n Guide](docs/i18n-guide.md) - Internationalization implementation details
- [Sortable Data Table Guide](docs/sortable-data-table-guide.md) - Usage of the sortable data table component
- [Global Notification Guide](docs/global-notification-guide.md) - Using the notification system
- [Header with Side Nav Guide](docs/header-with-side-nav-guide.md) - Navigation component usage
- [Bahmni Icon Guide](docs/bahmni-icon-guide.md) - Icon system documentation

### Development

```bash
# Start the development server
yarn nx serve distro
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
# Build the application
yarn nx build distro
```

The build artifacts will be stored in the `dist/` directory.

### Linting

```bash
# Run ESLint to check for code quality issues
yarn nx run-many --target=lint

# Fix ESLint issues automatically
yarn nx run-many --target=lint --fix

# Fix ESLint issues for particular app/specific package
yarn nx lint clinical --fix
yarn nx lint registration --fix
yarn nx lint bahmni-design-system --fix
yarn nx lint bahmni-services --fix
```

## Project Structure

This is an NX workspace with multiple applications and shared packages:

```text
bahmni-clinical-frontend/
├── apps/                           # Applications
│   ├── clinical/                   # Clinical management application
│   │   ├── src/                    # Source code
│   │   │   ├── components/         # Reusable UI components
│   │   │   ├── constants/          # Application constants
│   │   │   ├── contexts/           # React contexts
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── models/             # Data models
│   │   │   ├── pages/              # Page components
│   │   │   ├── providers/          # Context providers
│   │   │   ├── services/           # API services
│   │   │   ├── stores/             # State management
│   │   │   ├── utils/              # Utility functions
│   │   │   ├── __mocks__/          # Test mocks
│   │   │   ├── assets/             # Static assets
│   │   │   ├── App.tsx             # Main App component
│   │   │   ├── index.ts            # Application entry point
│   │   │   ├── index.html          # HTML template
│   │   │   ├── styles.scss         # Global styles
│   │   │   └── favicon.ico         # Favicon
│   │   ├── public/                 # Static assets
│   │   │   └── locales/            # Translation files
│   │   ├── package.json            # App-specific dependencies
│   │   ├── vite.config.ts          # Vite configuration
│   │   └── tsconfig.json           # TypeScript configuration
│   ├── registration/               # Patient registration application
│       ├── src/                    # Source code
│       │   ├── lib/                # Library functions
│       │   ├── pages/              # Page components
│       │   │   └── patientSearch/  # Patient search functionality
│       │   │       └── __tests__/  # Test files
│       │   ├── App.tsx             # Main App component
│       │   ├── index.ts            # Application entry point
│       │   └── RegistrationRoutes.tsx # Routing configuration
│       ├── public/                 # Static assets
│       │   └── locales/            # Translation files
│       ├── package.json            # App-specific dependencies
│       ├── vite.config.ts          # Vite configuration
│       └── tsconfig.json           # TypeScript configuration
├── packages/                       # Shared packages
│   ├── bahmni-design-system/       # Design system components
│   │   ├── src/                    # Component library source
│   │   ├── package.json            # Package dependencies
│   │   └── vite.config.ts          # Build configuration
│   ├── bahmni-services/            # Shared API services
│   │   ├── src/                    # Services source code
│   │   ├── package.json            # Package dependencies
│   │   └── vite.config.ts          # Build configuration
│   └── bahmni-widgets/             # Reusable UI widgets
│       ├── src/                    # Widgets source code
│       ├── package.json            # Package dependencies
│       └── vite.config.ts          # Build configuration
├── distro/                         # Main distribution application
│   ├── src/                        # Distribution app source
│   │   ├── app/                    # App components
│   │   │   ├── app.tsx             # Main App component
│   │   │   ├── IndexPage.tsx       # Home page
│   │   │   └── NotFoundPage.tsx    # 404 page
│   │   ├── assets/                 # Static assets
│   │   │   ├── locales/            # Translation files
│   │   │   └── favicon.ico         # Favicon
│   │   ├── index.html              # HTML template
│   │   ├── main.tsx                # Application entry point
│   │   └── styles.scss             # Global styles
│   ├── package.json                # Distribution dependencies
│   ├── webpack.config.js           # Webpack configuration
│   └── tsconfig.json               # TypeScript configuration
├── docs/                           # Project documentation
│   ├── architecture.md             # Architecture overview
│   ├── project-structure.md        # Project structure details
│   ├── setup-guide.md              # Setup instructions
│   ├── i18n-guide.md               # Internationalization guide
│   ├── sortable-data-table-guide.md # Data table component guide
│   ├── global-notification-guide.md # Notification system guide
│   ├── header-with-side-nav-guide.md # Navigation guide
│   └── bahmni-icon-guide.md        # Icon system guide
├── docker/                         # Docker configuration
│   ├── Dockerfile                  # Docker build file
│   └── httpd_directory.conf        # Apache configuration
├── nx.json                         # NX workspace configuration
├── package.json                    # Root workspace dependencies
├── tsconfig.base.json              # Base TypeScript configuration
├── eslint.config.ts                # ESLint configuration
├── jest.config.ts                  # Jest configuration
├── .prettierrc.json                # Prettier configuration
└── yarn.lock                       # Dependency lock file
```

For a more detailed explanation of the project architecture, see [Architecture Documentation](docs/architecture.md).

## Scripts

- `yarn nx serve distro` - Start the development server
- `yarn nx build distro` - Build the application for production
- `yarn nx run-many --target=test` - Run all tests
- `yarn nx test clinical` - Run tests for the clinical application, similarly you can run for other apps/packages
- `yarn nx test registration --testPathPattern=PatientSearch.test.tsx` - Run tests for specific file.Similarly for a particular file you need to update the app name and file name.
- `yarn nx run-many --target=test --all --watch` - Run tests in watch mode
- `yarn nx test clinical --watch` - Run tests in watch mode for the clinical application, similarly you can run for other apps/packages
- `yarn nx run-many --target=test --coverage` - Run tests with coverage report
- `yarn nx run-many --target=lint` - Run ESLint to check for code quality issues
- `yarn nx run-many --target=lint --fix` - Fix ESLint issues automatically
- `yarn nx format:write` - Format code with Prettier

## Technologies

- [NX](https://nx.dev/) - Modern monorepo tooling and workspace management
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Carbon Design System](https://carbondesignsystem.com/) - IBM's design system
- [Webpack](https://webpack.js.org/) - Module bundler
- [React Router](https://reactrouter.com/) - Routing library
- [Jest](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React testing utilities
- [ESLint](https://eslint.org/) - Code quality tool
- [Prettier](https://prettier.io/) - Code formatter
- [Workbox](https://developers.google.com/web/tools/workbox) - PWA tooling

## License

[Add license information here]
