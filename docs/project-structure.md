# Bahmni Clinical Frontend Project Structure

This document provides a high-level overview of the project structure, explaining the purpose of each main directory.

## Directory Structure Overview

``` text
bahmni-clinical-frontend/
├── docs/                    # Project documentation
├── public/                  # Static assets
│   └── locales/             # Translation files
├── src/                     # Source code
│   ├── components/          # Reusable UI components
│   ├── constants/           # Application constants
│   ├── contexts/            # React contexts
│   ├── displayControls/     # Clinical data display components
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Layout components
│   ├── pages/               # Page components
│   ├── providers/           # Context providers
│   ├── schemas/             # JSON schemas
│   ├── services/            # API services
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── __mocks__/           # Test mocks
│   └── __tests__/           # Test files
└── configuration files      # Various config files at root level
```

## Main Directories

### `/docs`

Contains project documentation, including setup guides and component usage documentation. These documents help developers understand how to use and contribute to the project.

### `/public`

Contains static assets that are copied to the build directory during the build process. This includes the HTML template, favicon, logos, and translation files.

### `/src`

Contains the application source code, organized into several subdirectories:

#### `/components`

Reusable UI components that are not specific to any particular feature or domain. These components form the building blocks of the application's user interface.

#### `/constants`

Application-wide constants, including error messages, date formats, and other configuration values. Centralizing constants makes them easier to maintain and update.

#### `/contexts`

React contexts for global state management. These contexts provide a way to share state between components without having to pass props down through multiple levels.

#### `/displayControls`

Components for displaying clinical data in a structured format. These specialized components are designed to present medical information in a user-friendly way.

#### `/hooks`

Custom React hooks that encapsulate business logic and data fetching. These hooks provide a clean way to reuse stateful logic across components.

#### `/layouts`

Components that define the overall layout of the application. These components provide the structure for pages and ensure consistent layout across the application.

#### `/pages`

Top-level page components that are rendered by the router. Each page component represents a distinct view in the application.

#### `/providers`

Context providers that wrap the application to provide global state. These providers make context values available to all components in the application.

#### `/schemas`

JSON schemas for validating data structures. These schemas ensure that data conforms to expected formats.

#### `/services`

Modules that handle API communication and other external services. These services abstract the details of interacting with external systems.

#### `/styles`

Global styles for the application. These styles define the overall look and feel of the application.

#### `/types`

TypeScript type definitions for the application. These types ensure type safety throughout the codebase.

#### `/utils`

Utility functions used throughout the application. These functions provide common functionality that can be reused across components.

#### `/\_\_mocks\_\_`

Mock data and functions for testing. These mocks allow tests to run without depending on external systems.

#### `/\_\_tests\_\_`

Test files for components and utilities. These tests ensure that the application works as expected.

### Root Configuration Files

The root directory contains various configuration files for tools used in the project:

- Babel configuration
- Docker configuration
- Editor configuration
- Git configuration
- Prettier configuration
- ESLint configuration
- Jest configuration
- TypeScript configuration
- Webpack configuration
- Package management files

## Conclusion

This high-level overview of the project structure provides a foundation for understanding how the application is organized. For more detailed information about specific aspects of the project, refer to the other documentation files in the `/docs` directory.
