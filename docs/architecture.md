# Bahmni Clinical Frontend Architecture

This document provides a comprehensive overview of the Bahmni Clinical Frontend architecture, explaining the project structure, key concepts, and design patterns used throughout the application.

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Core Concepts](#core-concepts)
- [State Management](#state-management)
- [Component Organization](#component-organization)
- [Service Layer](#service-layer)
- [Testing Strategy](#testing-strategy)
- [Internationalization](#internationalization)
- [Development Guidelines](#development-guidelines)

## Overview

The Bahmni Clinical Frontend is a React TypeScript application built to provide a modern, responsive user interface for the Bahmni Clinical module. The application follows a component-based architecture with clear separation of concerns between UI components, business logic, and data access.

### Key Design Patterns

- **Component-Based Architecture**: UI is composed of reusable, composable components
- **Context API for State Management**: Global state is managed using React Context
- **Custom Hooks**: Business logic is encapsulated in custom hooks
- **Service Layer**: API communication is abstracted in service modules
- **Display Controls**: Clinical data visualization is handled by specialized components
- **Provider Pattern**: Context providers wrap the application to provide global state

### Technology Stack

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Carbon Design System**: UI component library
- **Webpack**: Module bundler
- **Jest & Testing Library**: Testing framework
- **i18next**: Internationalization framework

## Directory Structure

### `/docs`

Contains project documentation, including setup guides and component usage documentation.

### `/public`

Contains static assets that are copied to the build directory during the build process.

- `locales/`: Translation files for different languages
- `index.html`: HTML template for the application

### `/src`

Contains the application source code.

#### `/components`

Reusable UI components that are not specific to any particular feature or domain.

- `/common`: Shared components used throughout the application

#### `/constants`

Application-wide constants, including error messages, date formats, and other configuration values.

#### `/contexts`

React contexts for global state management.

#### `/displayControls`

Components for displaying clinical data in a structured format.

#### `/hooks`

Custom React hooks that encapsulate business logic and data fetching.

#### `/layouts`

Components that define the overall layout of the application.

#### `/pages`

Top-level page components that are rendered by the router.

#### `/providers`

Context providers that wrap the application to provide global state.

#### `/schemas`

JSON schemas for validating data structures.

- `clinicalConfig.schema.json`: Schema for clinical configuration

#### `/services`

Modules that handle API communication and other external services.

#### `/styles`

Global styles for the application.

#### `/types`

TypeScript type definitions for the application.

#### `/utils`

Utility functions used throughout the application.

#### `/\_\_mocks\_\_`

Mock data and functions for testing.

#### `/\_\_tests\_\_`

Test files for components and utilities.

## Core Concepts

### Component Organization

Components are organized into several categories:

1. **Common Components**: Reusable UI components that are not specific to any particular feature
2. **Display Controls**: Components for displaying clinical data in a structured format
3. **Layout Components**: Components that define the overall layout of the application
4. **Page Components**: Top-level components that are rendered by the router

### State Management

The application uses React Context API for global state management. Each context is responsible for a specific domain of the application state.

Each context is implemented with a corresponding provider component that wraps the application and provides the context values to all child components.

Custom hooks are used to access and update the context values, providing a clean API for components to interact with the global state.

## Service Layer

The service layer abstracts API communication and other external services. Each service module is responsible for a specific domain of the application.

The service layer follows a consistent pattern:

1. Each service exports functions that handle specific API requests
2. Services use the base `api.ts` module for making HTTP requests
3. Services handle error cases and data transformation

## Testing Strategy

The application follows a comprehensive testing strategy:

1. **Unit Tests**: Test individual components and functions in isolation
2. **Integration Tests**: Test the interaction between components
3. **Snapshot Tests**: Ensure UI components render consistently

Tests are organized alongside the code they test, with test files in `__tests__` directories.

## Internationalization

The application uses i18next for internationalization. Translation files are stored in the `public/locales` directory, with one file per language.

The `i18n.ts` file configures i18next and loads the translation files. The `translationService.ts` provides utility functions for working with translations.

## Development Guidelines

### Code Organization

1. **Component Structure**: Each component should be in its own directory with associated test files
2. **Custom Hooks**: Business logic should be encapsulated in custom hooks
3. **Service Layer**: API communication should be abstracted in service modules
4. **Type Definitions**: All data structures should have TypeScript type definitions

### Testing Requirements

1. **Unit Tests**: All components and functions should have unit tests
2. **Integration Tests**: Key user flows should have integration tests
3. **Test Coverage**: Aim for high test coverage, especially for critical paths

### Error Handling

1. **Service Layer**: Services should handle API errors and provide meaningful error messages
2. **UI Components**: Components should handle error states gracefully
3. **Notifications**: Use the notification system to display errors to users
