# Widget Implementation Guide

This guide provides comprehensive instructions for implementing widgets in the Bahmni apps frontend, including how to register built-in widgets, pass configuration, and use the config validator.

## Table of Contents

1. [Overview](#overview)
2. [Widget Architecture](#widget-architecture)
3. [Creating a New Widget](#creating-a-new-widget)
4. [Registering a Built-in Widget](#registering-a-built-in-widget)
5. [Configuration Management](#configuration-management)
6. [Config Validation](#config-validation)
7. [Complete Example](#complete-example)
8. [Best Practices](#best-practices)

---

## Overview

Widgets in Bahmni are reusable, configurable React components that can be dynamically loaded and rendered based on configuration. The widget system provides:

- **Dynamic Registration**: Register widgets at runtime
- **Lazy Loading**: Components are loaded only when needed
- **Configuration Support**: Pass configuration to widgets via props
- **Schema Validation**: Validate widget configuration using JSON Schema
- **Type Safety**: Full TypeScript support

---

## Widget Architecture

### Core Components

The widget system consists of several key components:

1. **Widget Registry** (`packages/bahmni-widgets/src/registry/`)
   - Manages widget registration and retrieval
   - Singleton pattern for global access
   - Built-in widget auto-registration

2. **Config Validator** (`packages/bahmni-widgets/src/ConfigValidator/`)
   - Validates widget configuration against JSON Schema
   - Provides loading and error states
   - Uses Ajv for schema validation

3. **Widget Props Interface**
   ```typescript
   interface WidgetProps {
     config?: unknown;
   }
   ```

4. **Widget Config Interface**
   ```typescript
   interface WidgetConfig {
     type: string;
     component: LazyExoticComponent<ComponentType<WidgetProps>>;
   }
   ```

---

## Creating a New Widget

### Step 1: Create the Widget Component

Create your widget component with proper TypeScript types:

```typescript
// packages/bahmni-widgets/src/myWidget/MyWidget.tsx
import React from 'react';
import { WidgetProps } from '../registry';
import { ConfigValidator } from '../configValidator';
import myWidgetConfigSchema from './myWidgetConfig.schema.json';

// Define your widget's configuration interface
interface MyWidgetConfig {
  title: string;
  maxItems: number;
  showDetails?: boolean;
}

// Internal component that receives validated config
const MyWidgetContent: React.FC<WidgetProps> = ({ config }) => {
  // Safe type assertion after ConfigValidator validation
  const { title, maxItems, showDetails } = config as MyWidgetConfig;

  return (
    <div>
      <h2>{title}</h2>
      <p>Max Items: {maxItems}</p>
      {showDetails && <p>Details are shown</p>}
    </div>
  );
};

// Main widget component with config validation
const MyWidget: React.FC<WidgetProps> = (props) => {
  return (
    <ConfigValidator
      config={props.config}
      schema={myWidgetConfigSchema as Record<string, unknown>}
    >
      <MyWidgetContent {...props} />
    </ConfigValidator>
  );
};

export default MyWidget;
```

### Step 2: Create JSON Schema for Configuration

Create a JSON Schema file to validate your widget's configuration:

```json
// packages/bahmni-widgets/src/myWidget/myWidgetConfig.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "My Widget Configuration Schema",
  "description": "Schema for my widget configuration",
  "type": "object",
  "required": ["title", "maxItems"],
  "additionalProperties": false,
  "properties": {
    "title": {
      "type": "string",
      "description": "Widget title to display"
    },
    "maxItems": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "Maximum number of items to display"
    },
    "showDetails": {
      "type": "boolean",
      "description": "Whether to show detailed information",
      "default": false
    }
  }
}
```

### Step 3: Export Your Widget

Add your widget to the package exports:

```typescript
// packages/bahmni-widgets/src/index.ts
export { MyWidget } from './myWidget';
```

---

## Registering a Built-in Widget

Built-in widgets are automatically registered when the application starts. To add a new built-in widget:

### Step 1: Add to Widget Map

Edit the widget map file to include your new widget:

```typescript
// packages/bahmni-widgets/src/registry/widgetMap.ts
import { lazy } from 'react';
import { WidgetConfig } from './model';

export const builtInWidgets: WidgetConfig[] = [
  {
    type: 'allergies',
    component: lazy(() => import('../allergies/AllergiesTable')),
  },
  {
    type: 'conditions',
    component: lazy(() => import('../conditions/ConditionsTable')),
  },
  // ... other widgets ...
  {
    type: 'myWidget',  // Unique identifier for your widget
    component: lazy(() => import('../myWidget/MyWidget')),
  },
];
```

**Key Points:**
- `type`: Unique string identifier used in configuration files
- `component`: Lazy-loaded React component using `React.lazy()`
- Widgets are automatically registered on application startup
- The registry uses a singleton pattern for global access

### Step 2: Widget Registration Flow

The registration happens automatically:

```typescript
// Internal flow (you don't need to call this)
class WidgetRegistryManager {
  private constructor() {
    this.registry = new Map();
    this.registerBuiltInWidgets(); // Auto-registers all built-in widgets
  }

  private registerBuiltInWidgets(): void {
    builtInWidgets.forEach((widget) => {
      this.registry.set(widget.type, widget);
    });
  }
}
```

---

## Configuration Management

### How Configuration is Passed Down

Configuration flows from the dashboard config to the widget component:

```
Dashboard Config (JSON)
    ↓
getDashboardConfig() - Fetches and validates
    ↓
Dashboard Component - Renders sections
    ↓
Widget Component - Receives config via props
    ↓
ConfigValidator - Validates against schema
    ↓
Widget Content - Uses validated config
```

### Dashboard Configuration Example

```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "Patient Overview",
      "controls": [
        {
          "type": "myWidget",
          "config": {
            "title": "Recent Activities",
            "maxItems": 10,
            "showDetails": true
          }
        }
      ]
    }
  ]
}
```

### Accessing Configuration in Widget

```typescript
const MyWidgetContent: React.FC<WidgetProps> = ({ config }) => {
  // After ConfigValidator, config is guaranteed to match schema
  const { title, maxItems, showDetails } = config as MyWidgetConfig;
  
  // Use configuration values
  return (
    <div>
      <h2>{title}</h2>
      {/* Widget implementation */}
    </div>
  );
};
```

---

## Config Validation

### Using the ConfigValidator Component

The [`ConfigValidator`](packages/bahmni-widgets/src/ConfigValidator/ConfigValidator.tsx:34) component provides automatic validation with loading and error states:

```typescript
import { ConfigValidator } from '@bahmni/widgets';
import myWidgetConfigSchema from './myWidgetConfig.schema.json';

const MyWidget: React.FC<WidgetProps> = (props) => {
  return (
    <ConfigValidator
      config={props.config}
      schema={myWidgetConfigSchema as Record<string, unknown>}
      loadingComponent={<CustomLoadingSpinner />}  // Optional
      errorComponent={<CustomErrorMessage />}      // Optional
    >
      <MyWidgetContent {...props} />
    </ConfigValidator>
  );
};
```

**Props:**
- `config`: The configuration object to validate
- `schema`: JSON Schema object for validation
- `loadingComponent`: (Optional) Custom loading component
- `errorComponent`: (Optional) Custom error component
- `children`: Component to render when validation succeeds

### Using the useConfigValidation Hook

For more control, use the [`useConfigValidation`](packages/bahmni-widgets/src/hooks/useConfigValidation.ts:15) hook directly:

```typescript
import { useConfigValidation } from '@bahmni/widgets';

const MyWidget: React.FC<WidgetProps> = ({ config }) => {
  const { isValidating, isValid, error } = useConfigValidation({
    config,
    schema: myWidgetConfigSchema,
  });

  if (isValidating) {
    return <LoadingSpinner />;
  }

  if (!isValid) {
    return <ErrorMessage error={error} />;
  }

  // Render widget with validated config
  const validatedConfig = config as MyWidgetConfig;
  return <div>{/* Widget implementation */}</div>;
};
```

**Return Values:**
- `isValidating`: Boolean indicating validation in progress
- `isValid`: Boolean indicating if config is valid
- `error`: Error message if validation failed

### Validation Process

The validation uses [Ajv](https://ajv.js.org/) (Another JSON Schema Validator):

```typescript
// Internal validation function
export const validateConfig = async (
  config: unknown,
  configSchema: Record<string, unknown>,
): Promise<boolean> => {
  const ajv = new Ajv();
  const validate = ajv.compile(configSchema);
  return validate(config);
};
```

**Validation Features:**
- Asynchronous validation
- JSON Schema Draft-07 support
- Type checking
- Required field validation
- Custom validation rules
- Enum validation
- Range validation (min/max)

---

## Complete Example

Here's a complete example implementing a "Recent Visits" widget:

### 1. Widget Component

```typescript
// packages/bahmni-widgets/src/recentVisits/RecentVisits.tsx
import React from 'react';
import { useTranslation } from '@bahmni/services';
import { WidgetProps } from '../registry';
import { ConfigValidator } from '../configValidator';
import recentVisitsConfigSchema from './recentVisitsConfig.schema.json';
import { useRecentVisits } from './useRecentVisits';
import styles from './styles/RecentVisits.module.scss';

interface RecentVisitsConfig {
  maxVisits: number;
  showDiagnosis: boolean;
  visitTypes?: string[];
}

const RecentVisitsContent: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const { maxVisits, showDiagnosis, visitTypes } = config as RecentVisitsConfig;
  
  const { data, loading, error } = useRecentVisits({
    maxVisits,
    visitTypes,
  });

  if (loading) {
    return <div className={styles.loading}>{t('LOADING')}</div>;
  }

  if (error) {
    return <div className={styles.error}>{error.message}</div>;
  }

  return (
    <div className={styles.recentVisits}>
      <h3>{t('RECENT_VISITS')}</h3>
      <ul>
        {data?.visits.map((visit) => (
          <li key={visit.id}>
            <span>{visit.date}</span>
            <span>{visit.type}</span>
            {showDiagnosis && visit.diagnosis && (
              <span>{visit.diagnosis}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const RecentVisits: React.FC<WidgetProps> = (props) => {
  return (
    <ConfigValidator
      config={props.config}
      schema={recentVisitsConfigSchema as Record<string, unknown>}
    >
      <RecentVisitsContent {...props} />
    </ConfigValidator>
  );
};

export default RecentVisits;
```

### 2. JSON Schema

```json
// packages/bahmni-widgets/src/recentVisits/recentVisitsConfig.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Recent Visits Configuration Schema",
  "description": "Schema for recent visits widget configuration",
  "type": "object",
  "required": ["maxVisits", "showDiagnosis"],
  "additionalProperties": false,
  "properties": {
    "maxVisits": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "description": "Maximum number of visits to display"
    },
    "showDiagnosis": {
      "type": "boolean",
      "description": "Whether to show diagnosis information"
    },
    "visitTypes": {
      "type": "array",
      "description": "Filter visits by type",
      "items": {
        "type": "string"
      },
      "minItems": 1
    }
  }
}
```

### 3. Register as Built-in Widget

```typescript
// packages/bahmni-widgets/src/registry/widgetMap.ts
export const builtInWidgets: WidgetConfig[] = [
  // ... existing widgets ...
  {
    type: 'recentVisits',
    component: lazy(() => import('../recentVisits/RecentVisits')),
  },
];
```

### 4. Dashboard Configuration

```json
{
  "sections": [
    {
      "id": "patient-summary",
      "title": "Patient Summary",
      "controls": [
        {
          "type": "recentVisits",
          "config": {
            "maxVisits": 10,
            "showDiagnosis": true,
            "visitTypes": ["OPD", "IPD"]
          }
        }
      ]
    }
  ]
}
```

### 5. Export Widget

```typescript
// packages/bahmni-widgets/src/index.ts
export { RecentVisits } from './recentVisits';
```

---

## Best Practices

### 1. Always Use ConfigValidator

Wrap your widget content with [`ConfigValidator`](packages/bahmni-widgets/src/ConfigValidator/ConfigValidator.tsx:34) to ensure type safety:

```typescript
const MyWidget: React.FC<WidgetProps> = (props) => {
  return (
    <ConfigValidator config={props.config} schema={myWidgetConfigSchema}>
      <MyWidgetContent {...props} />
    </ConfigValidator>
  );
};
```

### 2. Define Clear Configuration Interfaces

Always define TypeScript interfaces for your widget configuration:

```typescript
interface MyWidgetConfig {
  requiredField: string;
  optionalField?: number;
}
```

### 3. Create Comprehensive JSON Schemas

Include all validation rules in your JSON Schema:

```json
{
  "type": "object",
  "required": ["requiredField"],
  "additionalProperties": false,
  "properties": {
    "requiredField": {
      "type": "string",
      "minLength": 1,
      "description": "Clear description of the field"
    }
  }
}
```

### 4. Use Lazy Loading

Always use `React.lazy()` for widget components to enable code splitting:

```typescript
{
  type: 'myWidget',
  component: lazy(() => import('../myWidget/MyWidget')),
}
```

### 5. Separate Content from Validation

Keep validation logic separate from widget content:

```typescript
// Validation wrapper
const MyWidget: React.FC<WidgetProps> = (props) => (
  <ConfigValidator config={props.config} schema={schema}>
    <MyWidgetContent {...props} />
  </ConfigValidator>
);

// Content component
const MyWidgetContent: React.FC<WidgetProps> = ({ config }) => {
  // Implementation
};
```

### 6. Handle Loading and Error States

Always handle loading and error states in your widget:

```typescript
const MyWidgetContent: React.FC<WidgetProps> = ({ config }) => {
  const { data, loading, error } = useMyData(config);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* Widget content */}</div>;
};
```

### 7. Use Translation Keys

Always use translation keys for user-facing text:

```typescript
const { t } = useTranslation();
return <h2>{t('MY_WIDGET_TITLE')}</h2>;
```

### 8. Type Assertion After Validation

Only perform type assertion after [`ConfigValidator`](packages/bahmni-widgets/src/ConfigValidator/ConfigValidator.tsx:34) has validated the config:

```typescript
const MyWidgetContent: React.FC<WidgetProps> = ({ config }) => {
  // Safe after ConfigValidator validation
  const { field1, field2 } = config as MyWidgetConfig;
};
```

### 9. Document Configuration Options

Add clear descriptions in your JSON Schema:

```json
{
  "properties": {
    "maxItems": {
      "type": "integer",
      "description": "Maximum number of items to display (1-100)",
      "minimum": 1,
      "maximum": 100
    }
  }
}
```

### 10. Test Configuration Validation

Write tests for configuration validation:

```typescript
describe('MyWidget Config Validation', () => {
  it('should accept valid configuration', async () => {
    const validConfig = { title: 'Test', maxItems: 10 };
    const isValid = await validateConfig(validConfig, schema);
    expect(isValid).toBe(true);
  });

  it('should reject invalid configuration', async () => {
    const invalidConfig = { maxItems: 10 }; // missing required 'title'
    const isValid = await validateConfig(invalidConfig, schema);
    expect(isValid).toBe(false);
  });
});
```

---

## Additional Resources

- [JSON Schema Documentation](https://json-schema.org/)
- [Ajv Validator](https://ajv.js.org/)
- [React.lazy Documentation](https://react.dev/reference/react/lazy)
- [VitalFlowSheet Example](packages/bahmni-widgets/src/vitalFlowSheet/VitalFlowSheet.tsx)

---

## Summary

Implementing a widget in Bahmni involves:

1. **Create** widget component with TypeScript types
2. **Define** JSON Schema for configuration validation
3. **Wrap** content with [`ConfigValidator`](packages/bahmni-widgets/src/ConfigValidator/ConfigValidator.tsx:34)
4. **Register** in [`widgetMap.ts`](packages/bahmni-widgets/src/registry/widgetMap.ts:4) for built-in widgets
5. **Configure** in dashboard JSON
6. **Test** configuration validation

The widget system provides a robust, type-safe way to create reusable components with validated configuration, ensuring reliability and maintainability across the Bahmni platform.