# Bahmni Widgets

Reusable React display controls and components extracted for sharing across Bahmni modules. This package includes common clinical widgets and notification provider to avoid code duplication across different Bahmni applications.

## Installation

```bash
npm install bahmni-widgets
```

## Peer Dependencies

This package requires the following peer dependencies to be installed in your application:

```bash
npm install react@>=18.0.0 react-dom@>=18.0.0
npm install @tanstack/react-query@^5.85.5
npm install bahmni-design-system@^0.0.1
npm install bahmni-services@^0.0.1
```

**Note:** Peer dependencies are **not automatically installed**. You must install them manually in your consuming application.

## Available Components

### Clinical Widgets

Clinical data display components for patient information and medical records:

### System Components

Notification system for application-wide messaging:


### Utilities

Hooks for common Bahmni functionality:



## License

This project is licensed under the Mozilla Public License v2.0 (MPLv2).

## Repository

This package is part of the [Bahmni Apps Frontend](https://github.com/Bahmni/bahmni-apps-frontend) monorepo.