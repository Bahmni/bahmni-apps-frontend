# Bahmni Clinical Frontend

A React TypeScript application for the Bahmni Clinical module, built with Webpack and Carbon Design System. This application includes PWA support for offline capabilities.

## Features

- **TypeScript** - Type-safe JavaScript
- **React** - UI library for building user interfaces
- **Carbon Design System** - IBM's open-source design system
- **Webpack** - Module bundler for modern JavaScript applications
- **PWA Support** - Progressive Web App capabilities for offline use
- **React Router** - Declarative routing for React applications

## Prerequisites

- Node.js (v18.x or later recommended)
- Yarn (v1.22.x or later recommended)

## Getting Started

### Installation

```bash
# Install dependencies
yarn
```

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
├── public/                  # Static assets
│   ├── favicon.ico          # Favicon
│   ├── logo192.png          # Logo for PWA (192x192)
│   ├── logo512.png          # Logo for PWA (512x512)
│   ├── manifest.json        # PWA manifest
│   ├── robots.txt           # Robots file
│   └── index.html           # HTML template
├── src/
│   ├── assets/              # Images, fonts, etc.
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── routes/              # Routing configuration
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main App component
│   ├── index.tsx            # Application entry point
│   └── service-worker.ts    # PWA service worker
├── .babelrc                 # Babel configuration
├── .eslintrc.js             # ESLint configuration
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── README.md                # Project documentation
├── tsconfig.json            # TypeScript configuration
└── webpack.config.js        # Webpack configuration
```

## Scripts

- `yarn start` - Start the development server
- `yarn build` - Build the application for production
- `yarn lint` - Run ESLint to check for code quality issues
- `yarn lint:fix` - Fix ESLint issues automatically

## Technologies

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Carbon Design System](https://carbondesignsystem.com/) - IBM's design system
- [Webpack](https://webpack.js.org/) - Module bundler
- [React Router](https://reactrouter.com/) - Routing library
- [ESLint](https://eslint.org/) - Code quality tool
- [Workbox](https://developers.google.com/web/tools/workbox) - PWA tooling

## License

[Add license information here]
