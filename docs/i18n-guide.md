# Internationalization (i18n) Guide

This guide provides comprehensive documentation for the internationalization (i18n) implementation in the Bahmni Clinical Frontend application.

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Configuration Constants](#configuration-constants)
3. [Translation Management](#translation-management)
4. [Development Guidelines](#development-guidelines)
5. [Usage Examples](#usage-examples)
6. [Configuration Guide](#configuration-guide)

## Overview & Architecture

The Bahmni Clinical Frontend application uses [i18next](https://www.i18next.com/) with [react-i18next](https://react.i18next.com/) for internationalization. The implementation includes:

### Core Components

- **i18next**: The core internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Detects the user's preferred language from browser settings

### Key Features

- **Asynchronous Loading**: Translations are loaded asynchronously when the application starts
- **Dual Source Strategy**: Translations can come from both bundled files and configuration files
- **Fallback Mechanism**: English is used as a fallback when translations are missing
- **Namespace Support**: Translations are organized by namespaces (e.g., 'clinical')
- **Language Detection**: Automatically detects user's preferred language from localStorage
- **Error Handling**: Comprehensive error handling for missing or invalid translations

### Initialization Flow

1. The `TranslationProvider` component initializes translations after the notification service is ready
2. The `initI18n` function in `src/i18n.ts` is called to set up i18next
3. User's preferred locale is determined from storage key or defaults to English
4. Translations are fetched from both bundled and config sources
5. i18next is initialized with the merged translations

## Configuration Constants

The i18n implementation relies on several constants defined in `src/constants/app.ts`:

### Translation URL Templates

These constants define the URL patterns for fetching translations:

- **CONFIG_TRANSLATIONS_URL_TEMPLATE**: Points to configuration-specific translations that can be customized per deployment
- **BUNDLED_TRANSLATIONS_URL_TEMPLATE**: Points to bundled translations that ship with the application

### Locale Settings

```typescript
export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "NG_TRANSLATE_LANG_KEY";
```

These constants define:

- **DEFAULT_LOCALE**: The fallback locale (English) used when a translation is missing or when the user's preferred locale is invalid
- **LOCALE_STORAGE_KEY**: The name of the cookie used to store the user's preferred locale

### Namespace Configuration

```typescript
export const CLINICAL_NAMESPACE = "clinical";
```

This constant defines the default namespace for translations, which helps organize translations by application section.

## Translation Management

### File Structure and Naming Conventions

Translation files follow a consistent naming pattern:

```text
locale_[language-code].json
```

For example:

- `locale_en.json` for English
- `locale_es.json` for Spanish
- `locale_fr.json` for French

These files are stored in two locations:

- **Bundled translations**: `/public/locales/locale_[lang].json`
- **Config translations**: `<CONFIG_REPO>/openmrs/i18n/clinical/locale_[lang].json`

### Bundled vs Config Translations

The application implements a dual-source strategy for translations:

1. **Bundled Translations**: These are packaged with the application and serve as the base translations.
2. **Config Translations**: These are deployment-specific and can override bundled translations.

When both sources provide a translation for the same key, the config translation takes precedence. This allows for customization without modifying the core application.

### Translation Loading and Merging

The `getTranslations` function in `translationService.ts` handles loading and merging translations:

1. Fetches translations from both bundled and config sources using the `getMergedTranslations` function
2. Merges them with config translations taking precedence over bundled translations
3. For non-English locales, also loads English translations as fallback
4. Organizes translations by language code and namespace following the i18next resource structure

The merging process is handled by the `getMergedTranslations` function:

```typescript
const getMergedTranslations = async (
  lang: string,
): Promise<Record<string, string>> => {
  let bundledTranslations: Record<string, string> = {};
  let configTranslations: Record<string, string> = {};

  bundledTranslations = await get<Record<string, string>>(
    BUNDLED_TRANSLATIONS_URL_TEMPLATE(lang),
  );

  configTranslations = await get<Record<string, string>>(
    CONFIG_TRANSLATIONS_URL_TEMPLATE(lang),
  );

  return { ...bundledTranslations, ...configTranslations };
};
```

This function:

- Fetches translations from both bundled and configuration sources
- Uses the spread operator to merge them, with config translations overriding bundled ones
- Either source can fail independently without affecting the other

### Error Handling and Fallbacks

The implementation includes robust error handling:

- If a locale is invalid or not found in localStorage, it falls back to the default locale (English)
- The `getUserPreferredLocale` function handles this fallback:
  ```typescript
  export const getUserPreferredLocale = (): string => {
    const localeStorageKey = localStorage.getItem(LOCALE_STORAGE_KEY);
    const userLocale = localeStorageKey || DEFAULT_LOCALE;
    return userLocale;
  };
  ```
- For non-English locales, English translations are always loaded as fallback:
  ```typescript
  // Add English fallback for non-English languages
  if (lang !== "en") {
    translations.en = {
      [namespace]: await getMergedTranslations("en"),
    };
  }
  ```
- This ensures that even if a translation is missing in the requested language, the English version will be displayed

#### Translation File Fetching and Error Handling

- Internationalization will only function after i18n is properly initialized. If initialization fails, the application will fall back to using keys instead of translated text.
- A separate axios client is used to fetch translation files (see `getTranslationFile` function) rather than the main API service.
- This separate client is necessary because the main API service has a dependency on the notification service, which would create a circular dependency issue if used for translation files.
- If there's a failure in fetching a particular locale, errors will be logged to the console, but the notification service will not display any errors to the user.
- The implementation gracefully handles missing translation files by returning an empty object, allowing the application to continue functioning with available translations or fallbacks.

## Development Guidelines

### Adding New Translations

To add new translations:

1. Identify the appropriate namespace (usually 'clinical')
2. Add the new key-value pair to the relevant locale files
3. For new features, add translations for all supported languages

### Best Practices for Keys and Namespaces

- **Be Consistent**: Use consistent naming patterns for similar concepts
- **Be Descriptive**: Keys should be self-explanatory and indicate their purpose
- **Avoid Hardcoding**: Never hardcode text that might need translation
- **Context Comments**: Add comments for translators when context might be unclear

### Testing Translations

When adding new translations, consider adding tests to verify:

- The translation key exists in all supported languages
- The translation is correctly loaded and applied
- The fallback mechanism works as expected

### Handling Dynamic Content

For dynamic content:

- Use interpolation with the `{{variable}}` syntax
- For pluralization, use i18next's plural features
- For formatting (dates, numbers, etc.), use appropriate formatting utilities
- Consider context when translating dynamic content

## Usage Examples

### Basic Translation Usage

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t("greeting")}</h1>; // Renders "Hello" in English
}
```

### Handling Plurals and Interpolation

```tsx
import { useTranslation } from "react-i18next";

function ItemCount({ count }: { count: number }) {
  const { t } = useTranslation();

  return (
    <p>
      {t("items.count", { count })}
      {/* Can render "1 item" or "5 items" depending on count */}
    </p>
  );
}
```

### Dynamic Language Switching

```tsx
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { LOCALE_STORAGE_KEY } from "@constants/app";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    Cookies.set(LOCALE_STORAGE_KEY, lang);
  };

  return (
    <div>
      <button onClick={() => changeLanguage("en")}>English</button>
      <button onClick={() => changeLanguage("es")}>Español</button>
      <button onClick={() => changeLanguage("fr")}>Français</button>
    </div>
  );
}
```

## Configuration Guide

### Setting Up New Locales

To add support for a new locale:

1. Create new translation files:

   - `/public/locales/locale_[lang].json` for bundled translations
   - `/<CONFIG_REPO>/openmrs/i18n/clinical/locale_[lang].json` for config translations

2. Ensure the locale code is valid according to [BCP 47](https://tools.ietf.org/html/bcp47)

3. Add translations for all existing keys in the default locale

4. Update any language selection UI to include the new locale

### Configuring URL Templates

If you need to change the location of translation files:

1. Update the URL templates in `src/constants/app.ts`:

   ```typescript
   export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
     `/your/custom/path/locale_${lang}.json`;
   export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
     `/your/custom/bundled/path/locale_${lang}.json`;
   ```

2. Ensure the new paths are accessible and contain valid translation files

### Managing Cookie Settings

The application uses cookies to persist the user's language preference:

1. The cookie name is defined by `LOCALE_STORAGE_KEY` in `src/constants/app.ts`
2. The default value is `'NG_TRANSLATE_LANG_KEY'` for compatibility with AngularJS applications
3. To change the cookie name, update this constant

### Namespace Organization

The application uses namespaces to organize translations:

1. The default namespace is defined by `CLINICAL_NAMESPACE` in `src/constants/app.ts`
2. To add a new namespace:
   - Update the `ns` array in the i18next initialization in `src/i18n.ts`
   - Create translation files for the new namespace
   - Use the namespace when accessing translations: `t('key', { ns: 'yourNamespace' })`

### Environment-Specific Configurations

For different environments (development, testing, production):

1. Use environment variables to configure translation paths
2. Consider using different fallback strategies for development vs. production
3. In development, you might want to show missing translation keys
4. In production, ensure all translations are available and fallbacks are in place

---

## References

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)
- [BCP 47 Language Tags](https://tools.ietf.org/html/bcp47)
