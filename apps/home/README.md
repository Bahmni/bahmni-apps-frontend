# @bahmni/home-app

Home page module for Bahmni, built with React and Bahmni Design System. Part of the `bahmni-apps-frontend` monorepo.

## Description

Provides the Bahmni home page - the landing screen after login. Displays the app tile grid for navigating to clinical, registration, and appointments modules, along with the header, location selector, and user profile menu.

## Development

```bash
# Run unit tests
yarn nx test @bahmni/home-app

# Build
yarn nx build @bahmni/home-app
```

## Tech Stack

- React 19, React Router 7
- TanStack Query for data fetching
- i18n via `@bahmni/services`
- Design system via `@bahmni/design-system`

## Package Exports

| Export | Description |
|--------|-------------|
| `@bahmni/home-app` | `HomeApp` component |
| `@bahmni/home-app/styles` | Compiled CSS (widgets + app styles) |
| `@bahmni/home-app/locales/*` | i18n locale files |
