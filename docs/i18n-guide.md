# Internationalization (i18n) Guide

## Overview

This document describes the namespace-based internationalization (i18n) system implemented in the Bahmni Clinical Frontend monorepo. The system allows each application within the monorepo to maintain its own translation resources while sharing a common translation service infrastructure.

## Table of Contents

1. [Architecture](#architecture)
2. [Implementation Guide](#implementation-guide)
3. [Using Translations](#using-translations-in-your-components)
4. [Translation Service Architecture](#translation-service-architecture)
5. [Best Practices](#best-practices)
6. [Configuration Override System](#configuration-override-system)
7. [Language Detection and Storage](#language-detection-and-storage)
8. [Testing Translations](#testing-translations)
9. [Migration Guide](#migration-guide)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Usage](#advanced-usage)

## Architecture

### Key Concepts

1. **Namespace**: A unique identifier for each application's translation scope (e.g., `clinical`, `registration`)
2. **Translation Sources**: Two-tier system with bundled translations and configuration overrides
3. **Locale Fallback**: Automatic fallback to English for missing translations in other languages
4. **Modular Structure**: Each app packages its own translations for distribution

### Core Components

- **i18next**: The core internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Detects the user's preferred language from browser settings

### System Components

``` txt
├── apps/
│   ├── clinical/
│   │   ├── public/
│   │   │   └── locales/
│   │   │       ├── locale_en.json
│   │   │       └── locale_es.json
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── constants/app.ts
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── registration/
│       ├── public/
│       │   └── locales/
│       │       ├── locale_en.json
│       │       └── locale_es.json
│       ├── src/
│       │   ├── App.tsx
│       │   └── constants/app.ts
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   └── bahmni-services/
│       └── src/
│           └── i18n/
│               ├── i18n.ts
│               ├── translationService.ts
│               └── constants.ts
└── distro/
    └── webpack.config.js
```

## Implementation Guide

### 1. Setting Up a New Application

#### Step 1: Define Your Namespace Constant

Create or update `apps/<your-app>/src/constants/app.ts`:

```typescript
export const YOUR_APP_NAMESPACE = 'your-app-name'; // e.g., 'clinical', 'registration'
```

#### Step 2: Create Translation Files

Create translation files in `apps/<your-app>/public/locales/`:

```json
// apps/<your-app>/public/locales/locale_en.json
{
  "WELCOME_MESSAGE": "Welcome to the application",
  "BUTTON_SAVE": "Save",
  "BUTTON_CANCEL": "Cancel"
}
```

```json
// apps/<your-app>/public/locales/locale_es.json
{
  "WELCOME_MESSAGE": "Bienvenido a la aplicación",
  "BUTTON_SAVE": "Guardar",
  "BUTTON_CANCEL": "Cancelar"
}
```

**File Naming Convention**: Translation files follow the pattern `locale_[language-code].json`:

- `locale_en.json` for English
- `locale_es.json` for Spanish
- `locale_fr.json` for French

#### Step 3: Configure Package Exports

Update `apps/<your-app>/package.json` to export locale files:

```json
{
  "name": "@bahmni/clinical-app",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./styles": "./dist/index.css",
    "./locales/*": "./dist/locales/*"
  }
}
```

#### Step 4: Configure Vite Build

Update `apps/<your-app>/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/<your-app>',
  publicDir: 'public', // Enable public directory
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    copyPublicDir: true, // Copy public directory to dist
    lib: {
      entry: 'src/index.ts',
      name: '<YourApp>',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        '@tanstack/react-query',
      ],
    },
  },
}));
```

#### Step 5: Initialize i18n in Your App

Update `apps/<your-app>/src/App.tsx`:

```typescript
import { initAppI18n } from '@bahmni/services';
import React, { useEffect, useState } from 'react';
import { YOUR_APP_NAMESPACE } from './constants/app';

const YourApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(YOUR_APP_NAMESPACE);
        // Other initializations...
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    initializeApp();
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Your app content */}
    </div>
  );
};

export default YourApp;
```

#### Step 6: Configure Distribution Webpack

Update `distro/webpack.config.js` to copy locale files:

```javascript
module.exports = (env, argv) => {
  return {
    // ... other config
    entry: {
      main: './src/main.tsx',
      index: './src/index.html',
      baseHref: publicPath,
      assets: [
        './src/assets',
        {
          input: '../apps/<your-app>/dist/locales',
          glob: '**/*',
          output: '<your-app>/locales'
        },
        // Add for other apps as needed
      ],
      // ... rest of config
    },
  };
};
```

## Using Translations in Your Components

### Using the useTranslation Hook

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('WELCOME_MESSAGE')}</h1>
      <button>{t('BUTTON_SAVE')}</button>
      <button>{t('BUTTON_CANCEL')}</button>
    </div>
  );
};
```

### Using Interpolation

Translation file:

```json
{
  "GREETING_WITH_NAME": "Hello, {{name}}!",
  "ITEMS_COUNT": "You have {{count}} items"
}
```

Component:

```typescript
const MyComponent: React.FC = () => {
  const { t } = useTranslation();
  const userName = "John";
  const itemCount = 5;

  return (
    <div>
      <p>{t('GREETING_WITH_NAME', { name: userName })}</p>
      <p>{t('ITEMS_COUNT', { count: itemCount })}</p>
    </div>
  );
};
```

### Using Pluralization

Translation file:

```json
{
  "CLINICAL_DAYS_TRANSLATION_KEY_one": "day",
  "CLINICAL_DAYS_TRANSLATION_KEY_other": "days"
}
```

Component:

```typescript
const MyComponent: React.FC = () => {
  const { t } = useTranslation();
  const days = 3;

  return (
    <p>{days} {t('CLINICAL_DAYS_TRANSLATION_KEY', { count: days })}</p>
  );
};
```

## Translation Service Architecture

### Translation Loading Flow

``` txt
1. App Initialization
   └─> initAppI18n(namespace)
       └─> getUserPreferredLocale()
       └─> getTranslations(locale, namespace)
           ├─> Load Bundled Translations
           │   └─> GET /<namespace>/locales/locale_<lang>.json
           ├─> Load Config Translations
           │   └─> GET /bahmni_config/openmrs/i18n/<namespace>/locale_<lang>.json
           └─> Merge Translations (Config overrides Bundled)
               └─> Return merged translation object
```

### Translation Source Priority

The system uses a two-tier translation loading strategy:

1. **Bundled Translations** (Base Level)
   - Location: `apps/<app>/public/locales/locale_<lang>.json`
   - Distributed with the application
   - Contains default translations

2. **Config Translations** (Override Level)
   - Location: `/bahmni_config/openmrs/i18n/<namespace>/locale_<lang>.json`
   - Server-side configuration
   - Overrides bundled translations
   - Allows deployment-specific customization

**Merge Strategy**: Config translations take precedence over bundled translations.

### Key Functions

#### `initI18n(namespace: string)`

Initializes the i18n system with namespace-specific translations.

**Location**: `packages/bahmni-services/src/i18n/i18n.ts:14`

This function:
- Detects the user's preferred locale
- Fetches translations for the specified namespace
- Configures i18next with the namespace and translations
- Sets up localStorage-based language detection
- Returns the initialized i18n instance

#### `getTranslations(lang: string, namespace: string)`

Fetches and merges translations from all sources.

**Location**: `packages/bahmni-services/src/i18n/translationService.ts:78`

This function:
- Loads merged translations for the requested language and namespace
- Automatically includes English translations as fallback for non-English languages
- Returns translations organized by language code and namespace

#### `getMergedTranslations(namespace: string, lang: string)`

Merges bundled and config translations with config taking precedence.

**Location**: `packages/bahmni-services/src/i18n/translationService.ts:41`

This function:
- Fetches bundled translations from the application build
- Fetches config translations from the server
- Merges both sources with config translations overriding bundled ones
- Handles failures gracefully (either source can fail independently)

### Configuration Constants

The i18n implementation relies on several constants defined in `packages/bahmni-services/src/i18n/constants.ts`:

#### URL Templates

```typescript
// Bundled translations from application build
export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (
  namespace: string,
  lang: string,
) => BASE_PATH + `${namespace}/locales/locale_${lang}.json`;

// Config translations from server
export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (
  namespace: string,
  lang: string,
) => `/bahmni_config/openmrs/i18n/${namespace}/locale_${lang}.json`;
```

#### Locale Settings

```typescript
export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "NG_TRANSLATE_LANG_KEY";
```

These constants define:

- **DEFAULT_LOCALE**: The fallback locale (English) used when a translation is missing
- **LOCALE_STORAGE_KEY**: The localStorage key used to store the user's preferred locale

### Error Handling and Fallbacks

The implementation includes robust error handling:

- **Locale Fallback**: If a locale is invalid or not found in localStorage, it falls back to the default locale (English)
- **English Fallback**: For non-English locales, English translations are always loaded as fallback
- **Graceful Failure**: If a translation file fails to load, an empty object is returned, allowing the application to continue. If initialization fails completely, the application falls back to displaying translation keys.
- **No User Notifications**: Translation file loading errors are logged to the console but don't trigger user-facing notifications
- **Separate HTTP Client**: A dedicated axios client fetches translation files to avoid circular dependencies with the notification service

## Best Practices

### 1. Translation Key Naming Conventions

Use SCREAMING_SNAKE_CASE with descriptive, hierarchical names:

```json
{
  "FEATURE_SECTION_TITLE": "Title",
  "FEATURE_BUTTON_SAVE": "Save",
  "FEATURE_ERROR_NOT_FOUND": "Not Found",
  "FORM_FIELD_LABEL": "Label",
  "FORM_VALIDATION_REQUIRED": "This field is required"
}
```

**Guidelines:**

- **Be Consistent**: Use consistent naming patterns for similar concepts
- **Be Descriptive**: Keys should be self-explanatory and indicate their purpose
- **Avoid Hardcoding**: Never hardcode text that might need translation
- **Context Comments**: Add comments for translators when context might be unclear

### 2. Organize Keys by Feature and Alphabetically

Group related translations by feature and sort them alphabetically within each group:

```json
{
  "ALLERGY_FORM_TITLE": "Allergies",
  "ALLERGY_SEARCH_PLACEHOLDER": "Search for allergies",
  "ALLERGY_SELECT_REACTIONS": "Select Reactions",
  "ALLERGY_SELECT_SEVERITY": "Select Severity",

  "MEDICATION_DOSAGE_INPUT_LABEL": "Dosage",
  "MEDICATION_FORM_TITLE": "Prescribe medication",
  "MEDICATION_FREQUENCY_INPUT_LABEL": "Frequency"
}
```

### 3. Avoid Hard-coded Text

**Bad:**

```typescript
<button>Save</button>
```

**Good:**

```typescript
<button>{t('BUTTON_SAVE')}</button>
```

### 4. Use Interpolation for Dynamic Content

**Bad:**

```typescript
<p>{"Welcome " + userName}</p>
```

**Good:**

```typescript
<p>{t('WELCOME_MESSAGE', { name: userName })}</p>
```

### 5. Keep Translation Files Synchronized

Ensure all language files have the same keys:

```bash
# Use a tool or script to validate consistency
# Missing translations will fall back to English
```

### 6. Provide Context in Key Names

**Bad:**

```json
{
  "DELETE": "Delete",
  "REMOVE": "Remove"
}
```

**Good:**

```json
{
  "ALLERGY_ACTION_DELETE": "Delete",
  "MEDICATION_ACTION_REMOVE": "Remove"
}
```

### 7. Handle Missing Translations Gracefully

The system automatically falls back to English if a translation is missing in the selected language.

## Configuration Override System

Bahmni allows deployment-specific translation overrides via server-side configuration.

### Directory Structure

``` txt
bahmni_config/
└── openmrs/
    └── i18n/
        ├── clinical/
        │   ├── locale_en.json
        │   └── locale_es.json
        └── registration/
            ├── locale_en.json
            └── locale_es.json
```

### Example Override

**Bundled Translation** (`apps/clinical/public/locales/locale_en.json`):

```json
{
  "WELCOME_MESSAGE": "Welcome to Clinical App"
}
```

**Config Override** (`/bahmni_config/openmrs/i18n/clinical/locale_en.json`):

```json
{
  "WELCOME_MESSAGE": "Welcome to Hospital XYZ Clinical System"
}
```

**Result**: Users will see "Welcome to Hospital XYZ Clinical System"

### Configuring URL Templates

If you need to change the location of translation files:

1. Update the URL templates in `packages/bahmni-services/src/i18n/constants.ts`:

   ```typescript
   export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (
     namespace: string,
     lang: string,
   ) => `/your/custom/path/${namespace}/locale_${lang}.json`;
   ```

2. Ensure the new paths are accessible and contain valid translation files

## Language Detection and Storage

### Detection Order

The system detects user language preference in this order:

1. **localStorage**: Checks for `NG_TRANSLATE_LANG_KEY`
2. **Browser Language**: Falls back to browser language if not in localStorage
3. **Default**: Falls back to English (`en`) if neither is available

### Changing Language Dynamically

```typescript
import { useTranslation } from 'react-i18next';
import { LOCALE_STORAGE_KEY } from '@bahmni/services';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  };

  return (
    <div>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('es')}>Español</button>
      <button onClick={() => changeLanguage('fr')}>Français</button>
    </div>
  );
}
```

**Note**: The storage key `LOCALE_STORAGE_KEY` is defined in `packages/bahmni-services/src/i18n/constants.ts` and defaults to `'NG_TRANSLATE_LANG_KEY'` for compatibility with AngularJS applications.

## Testing Translations

### Unit Testing with Translations

```typescript
import { renderWithTranslations } from '@bahmni/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render translated text', () => {
    const { getByText } = renderWithTranslations(<MyComponent />);
    expect(getByText('Welcome to the application')).toBeInTheDocument();
  });
});
```

### Testing Translation Keys

```typescript
import { useTranslation } from 'react-i18next';
import { render } from '@testing-library/react';

it('should use correct translation key', () => {
  const TestComponent = () => {
    const { t } = useTranslation();
    return <div>{t('WELCOME_MESSAGE')}</div>;
  };

  const { container } = render(<TestComponent />);
  // Verify the key is used correctly
});
```

## Migration Guide

### Migrating from Global to Namespace-Based System

If you have an existing app using global translations:

1. **Identify your namespace**:

   ```typescript
   export const YOUR_APP_NAMESPACE = 'your-app-name';
   ```

2. **Move translation files**:

   ```bash
   # From: src/locales/
   # To: public/locales/
   ```

3. **Update initialization**:

   ```typescript
   // Old
   await initAppI18n();

   // New
   await initAppI18n(YOUR_APP_NAMESPACE);
   ```

4. **Update package.json exports**:

   ```json
   {
     "exports": {
       "./locales/*": "./dist/locales/*"
     }
   }
   ```

5. **Update vite.config.ts**:

   ```typescript
   {
     publicDir: 'public',
     build: {
       copyPublicDir: true
     }
   }
   ```

6. **Update webpack config** in distro to copy your locales

### Setting Up New Locales

To add support for a new locale:

1. Create new translation files:
   - `apps/<your-app>/public/locales/locale_[lang].json` for bundled translations
   - `/bahmni_config/openmrs/i18n/<namespace>/locale_[lang].json` for config translations

2. Ensure the locale code is valid according to [BCP 47](https://tools.ietf.org/html/bcp47)

3. Add translations for all existing keys in the default locale

4. Update any language selection UI to include the new locale

## Troubleshooting

### Translations Not Loading

1. **Check namespace**: Ensure the correct namespace is passed to `initAppI18n()`
2. **Verify file paths**: Check that locale files exist in `public/locales/`
3. **Check build output**: Ensure locales are copied to `dist/locales/`
4. **Verify webpack config**: Ensure distro webpack copies your app's locales
5. **Check console**: Look for error messages in the browser console

### Translations Not Updating

1. **Clear cache**: Clear browser cache and localStorage
2. **Rebuild**: Ensure you rebuild the app after changing translations
3. **Check override**: Verify if config translations are overriding your changes

### Missing Translations

1. **Check fallback**: System falls back to English - check if English translation exists
2. **Verify key**: Ensure the translation key exactly matches (case-sensitive)
3. **Check language file**: Verify the translation exists in the correct language file

### Namespace Conflicts

If two apps try to use the same translation keys:

- Each app's namespace keeps translations isolated
- Keys are scoped to the namespace: `{namespace}.{key}`

## Performance Considerations

1. **Lazy Loading**: Translations are loaded once at app initialization
2. **Caching**: Translation files are cached by the browser
3. **Bundle Size**: Only include necessary languages in production builds
4. **Config Overrides**: Config translations are optional; apps work without them

## Advanced Usage

### Accessing Translation Outside React Components

```typescript
import i18n from 'i18next';

// In utility functions or services
const translatedText = i18n.t('TRANSLATION_KEY');
```

### Dynamic Namespace Loading

```typescript
import { i18n } from 'i18next';

// Load additional namespace at runtime
await i18n.loadNamespaces('new-namespace');
```

### Using Namespaces in Components

```typescript
const { t } = useTranslation();

// Access translation from specific namespace
t('key', { ns: 'yourNamespace' });
```

### Custom Language Detector

```typescript
import { LanguageDetector } from 'i18next-browser-languagedetector';

const customDetector = {
  name: 'customDetector',
  lookup() {
    // Custom logic to detect language
    return 'en';
  },
};

// Add to i18n initialization
i18n.use(LanguageDetector).use(customDetector);
```

### Environment-Specific Configurations

For different environments (development, testing, production):

1. Use environment variables to configure translation paths
2. Consider using different fallback strategies for development vs. production
3. In development, you might want to show missing translation keys
4. In production, ensure all translations are available and fallbacks are in place

## Summary

The namespace-based translation system provides:

1. **Isolation**: Each app maintains its own translation scope
2. **Flexibility**: Support for deployment-specific overrides
3. **Scalability**: Easy to add new apps and languages
4. **Maintainability**: Clear structure and separation of concerns
5. **Fallback Support**: Automatic fallback to English for missing translations

By following this guide, you can successfully implement and maintain translations for any application within the Bahmni Clinical Frontend monorepo.

## References

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)
- [BCP 47 Language Tags](https://tools.ietf.org/html/bcp47)
- Bahmni Configuration Guide: `/bahmni_config/openmrs/i18n/`

## Support

For issues or questions:

1. Check this documentation
2. Review the reference implementation in `apps/clinical/` or `apps/registration/`
3. Consult the team or raise an issue in the repository
