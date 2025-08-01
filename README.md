# Bahmni Clinical Frontend

A React TypeScript application for the Bahmni Clinical module, built with Webpack and Carbon Design System. This application includes PWA support for offline capabilities.

## Features

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
yarn
```

### Detailed Setup Guide

For a comprehensive setup guide including development environments, Docker configuration, authentication setup, and troubleshooting, please refer to our [Setup Guide](docs/setup-guide.md).

### Additional Documentation

- [Frontend Architecture](docs/architecture.md) - A comprehensive overview of the Bahmni Clinical Frontend architecture
- [Project Structure](docs/project-structure.md) - A high-level overview of the project structure
- [i18n Guide](docs/i18n-guide.md) - Internationalization implementation details
- [Sortable Data Table Guide](docs/sortable-data-table-guide.md) - Usage of the sortable data table component
- [Global Notification Guide](docs/global-notification-guide.md) - Using the notification system

### Development

```bash
# Start the development server
yarn start
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
# Build the application
yarn build
```

The build artifacts will be stored in the `dist/` directory.

### Linting

```bash
# Run ESLint to check for code quality issues
yarn lint

# Fix ESLint issues automatically
yarn lint:fix
```

## Project Structure

```text
bahmni-clinical-frontend/
├── docs/                    # Project documentation
│   ├── sortable-data-table-guide.md
│   ├── global-notification-guide.md
│   ├── i18n-guide.md
│   └── setup-guide.md
├── public/                  # Static assets
│   ├── favicon.ico          # Favicon
│   ├── logo192.png          # Logo for PWA (192x192)
│   ├── logo512.png          # Logo for PWA (512x512)
│   ├── manifest.json        # PWA manifest
│   ├── robots.txt           # Robots file
│   ├── index.html           # HTML template
│   └── locales/             # Translation files
│       ├── locale_en.json   # English translations
│       └── locale_es.json   # Spanish translations
├── src/
│   ├── components/          # Reusable UI components
│   │   └── common/          # Shared components
│   │       ├── sortableDataTable/  # Composite data table component
│   │       └── notification/         # Notification components
│   ├── constants/           # Application constants
│   ├── contexts/            # React contexts
│   ├── displayControls/     # Clinical data display components
│   │   ├── allergies/       # Allergies display
│   │   ├── conditions/      # Conditions display
│   │   └── patient/         # Patient details display
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Layout components
│   │   └── clinical/        # Clinical layout
│   ├── pages/               # Page components
│   ├── providers/           # Context providers
│   ├── schemas/             # JSON schemas
│   ├── services/            # API services
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── __mocks__/           # Test mocks
│   ├── __tests__/           # Test files
│   ├── App.tsx              # Main App component
│   ├── i18n.ts              # i18n configuration
│   └── index.tsx            # Application entry point
├── .babelrc                 # Babel configuration
├── .editorconfig            # Editor configuration
├── .gitignore               # Git ignore file
├── .prettierrc.json         # Prettier configuration
├── eslint.config.ts         # ESLint configuration
├── jest.config.ts           # Jest configuration
├── package.json             # Project dependencies and scripts
├── README.md                # Project documentation
├── tsconfig.json            # TypeScript configuration
└── webpack.config.js        # Webpack configuration
```

For a more detailed explanation of the project architecture, see [Architecture Documentation](docs/architecture.md).

## Scripts

- `yarn start` - Start the development server
- `yarn build` - Build the application for production
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn lint` - Run ESLint to check for code quality issues
- `yarn lint:fix` - Fix ESLint issues automatically
- `yarn format` - Format code with Prettier

## Technologies

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Carbon Design System](https://carbondesignsystem.com/) - IBM's design system
- [Webpack](https://webpack.js.org/) - Module bundler
- [React Router](https://reactrouter.com/) - Routing library
- [i18next](https://www.i18next.com/) - Internationalization framework
- [Jest](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React testing utilities
- [ESLint](https://eslint.org/) - Code quality tool
- [Prettier](https://prettier.io/) - Code formatter
- [Workbox](https://developers.google.com/web/tools/workbox) - PWA tooling

## License

[Add license information here]
