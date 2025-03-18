# Bahmni Clinical Frontend

This is the frontend application for the Bahmni Clinical module, built with React, TypeScript, and Vite.

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
yarn dev
```

This will start the development server at [http://localhost:5173](http://localhost:5173).

### Building for Production

```bash
# Build the application
yarn build
```

The build artifacts will be stored in the `dist/` directory.

### Preview Production Build

```bash
# Preview the production build
yarn preview
```

## Scripts

- `yarn dev` - Start the development server
- `yarn build` - Build the application for production
- `yarn lint` - Run ESLint to check for code quality issues
- `yarn preview` - Preview the production build locally

## Project Structure

```text
bahmni-clinical-frontend/
├── public/              # Static assets
├── src/                 # Source code
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Application entry point
├── .gitignore           # Git ignore file
├── eslint.config.js     # ESLint configuration
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Technologies

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vite.dev/) - Build tool and development server
- [ESLint](https://eslint.org/) - Code quality tool

## License

[Add license information here]
