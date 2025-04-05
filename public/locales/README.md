# Internationalization (i18n) in Bahmni Clinical Frontend

This directory contains translation files for the Bahmni Clinical Frontend application. The application uses [react-i18next](https://react.i18next.com/) for internationalization.

## Directory Structure

```
locales/
├── en/                 # English translations
│   └── translation.json
├── fr/                 # French translations
│   └── translation.json
└── [language-code]/    # Other languages
    └── translation.json
```

## Adding a New Language

To add a new language:

1. Create a new directory with the language code (e.g., `hi` for Hindi)
2. Copy the `translation.json` file from the `en` directory to the new directory
3. Translate the strings in the new `translation.json` file

## Using Translations in React Components

To use translations in your React components, import the `useTranslation` hook from `react-i18next`:

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome')}</p>
    </div>
  );
};
```

## Changing the Language

To change the language programmatically:

```tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('hi')}>Hindi</button>
    </div>
  );
};
```

## Dynamic Content

For translations with dynamic content, use the following syntax:

```tsx
// In your translation file
{
  "greeting": "Hello, {{name}}!"
}

// In your component
const { t } = useTranslation();
return <p>{t('greeting', { name: 'John' })}</p>;
```

## Pluralization

For pluralization, use the following syntax:

```tsx
// In your translation file
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// In your component
const { t } = useTranslation();
return <p>{t('items', { count: 5 })}</p>; // Outputs: "5 items"
```

## Configuration

The i18n configuration is defined in `src/i18n.ts`. If you need to modify the configuration, update this file.
