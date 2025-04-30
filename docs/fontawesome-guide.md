# FontAwesome Icons Guide

This guide explains how to use FontAwesome icons in the Bahmni Clinical Frontend application.

## Overview

The application uses FontAwesome free solid icons through a custom Icon component. This allows for consistent icon usage throughout the application and supports specifying icons in configuration.

## Usage

### Basic Usage

Import the Icon component and use it in your components:

```tsx
import React from "react";
import Icon from "@components/common/Icon";

const MyComponent: React.FC = () => {
  return (
    <div>
      <h1>
        <Icon name="fa-home" id="home-icon" /> Home
      </h1>
      <button>
        <Icon name="fa-cog" id="settings-icon" /> Settings
      </button>
    </div>
  );
};
```

### Icon Naming Format

The Icon component expects names in the format "fa-iconname" or "fas-iconname":

```tsx
// Solid icon format
<Icon name="fa-home" id="home-icon" />

// Alternative solid icon format
<Icon name="fas-home" id="home-icon-alt" />
```

### Icon Properties

The Icon component accepts the following properties:

| Property  | Type              | Description                                                           |
| --------- | ----------------- | --------------------------------------------------------------------- |
| name      | string            | Icon name in the format "fa-home" or "fas-home"                       |
| id        | string            | Unique identifier for the icon (required)                             |
| size      | ICON_SIZE enum    | Icon size (XXS, XS, SM, LG, XL, XXL, X1-X10)                          |
| color     | string            | Icon color (CSS color value)                                          |
| ariaLabel | string            | Accessibility label (defaults to id)                                  |
| padding   | ICON_PADDING enum | Padding around the icon (NONE, XXSMALL, XSMALL, SMALL, MEDIUM, LARGE) |

Example with all properties:

```tsx
import { ICON_SIZE, ICON_PADDING } from "@constants/icon";

<Icon
  name="fa-user"
  id="user-profile-icon"
  size={ICON_SIZE.X2}
  color="#0f62fe"
  ariaLabel="User profile"
  padding={ICON_PADDING.MEDIUM}
/>;
```

### Size Options

The Icon component supports various sizes through the ICON_SIZE enum:

```tsx
export enum ICON_SIZE {
  XXS = "2xs", // Extra extra small
  XS = "xs", // Extra small
  SM = "sm", // Small
  LG = "lg", // Large
  XL = "xl", // Extra large
  XXL = "2xl", // Extra extra large
  X1 = "1x", // 1x (default)
  X2 = "2x", // 2x
  X3 = "3x", // 3x
  X4 = "4x", // 4x
  X5 = "5x", // 5x
  X6 = "6x", // 6x
  X7 = "7x", // 7x
  X8 = "8x", // 8x
  X9 = "9x", // 9x
  X10 = "10x", // 10x
}
```

### Padding Options

The Icon component supports various padding options through the ICON_PADDING enum:

```tsx
export enum ICON_PADDING {
  NONE = "0", // No padding
  XXSMALL = "0.125rem", // Extra extra small padding (default)
  XSMALL = "0.25rem", // Extra small padding
  SMALL = "0.5rem", // Small padding
  MEDIUM = "1rem", // Medium padding
  LARGE = "1.5rem", // Large padding
}
```

## Using Icons in Configuration

Icons can be specified in configuration using the "fa-home" format. For example, in a dashboard configuration:

```json
{
  "dashboards": [
    {
      "name": "Patient Dashboard",
      "icon": "fa-user",
      "url": "/patient"
    },
    {
      "name": "Appointments",
      "icon": "fa-calendar",
      "url": "/appointments"
    }
  ]
}
```

When rendering components based on this configuration, use the Icon component:

```tsx
import React from "react";
import Icon from "@components/common/Icon";

interface DashboardItemProps {
  dashboard: {
    name: string;
    icon?: string;
    url: string;
  };
}

const DashboardItem: React.FC<DashboardItemProps> = ({ dashboard }) => {
  return (
    <div className="dashboard-item">
      {dashboard.icon && (
        <Icon
          name={dashboard.icon}
          id={`${dashboard.name.toLowerCase()}-icon`}
          size={ICON_SIZE.LG}
        />
      )}
      <span>{dashboard.name}</span>
    </div>
  );
};
```

## Accessibility Best Practices

When using icons, it's important to ensure they are accessible to all users, including those using screen readers:

1. **Always provide an `id` and `ariaLabel`**: The `id` is required and the `ariaLabel` defaults to the `id` if not provided. Use descriptive labels that explain the purpose of the icon.

```tsx
// Good
<Icon name="fa-search" id="search-button-icon" ariaLabel="Search for patients" />

// Not recommended (uses id as ariaLabel)
<Icon name="fa-search" id="search-icon" />
```

2. **For decorative icons**, you can use the same approach but with a more descriptive label:

```tsx
<Icon name="fa-star" id="rating-star-icon" ariaLabel="Rating star" />
```

3. **For icons that are part of a button or interactive element**, ensure the parent element also has appropriate accessibility attributes:

```tsx
<button aria-label="Search for patients">
  <Icon name="fa-search" id="search-icon" ariaLabel="Search icon" />
  Search
</button>
```

4. **For icons without visible text**, make sure the aria-label is descriptive of the action:

```tsx
<button aria-label="Close dialog">
  <Icon name="fa-times" id="close-icon" ariaLabel="Close" />
</button>
```

## Available Icons

For a complete list of available icons, refer to the FontAwesome documentation:

- [Solid Icons](https://fontawesome.com/icons?d=gallery&s=solid&m=free)

## Implementation Details

The FontAwesome integration consists of:

1. FontAwesome packages:

   - @fortawesome/react-fontawesome
   - @fortawesome/fontawesome-svg-core
   - @fortawesome/free-solid-svg-icons

2. Configuration (src/fontawesome.ts):

   - Initializes the FontAwesome library
   - Adds all solid icons

3. Icon Component (src/components/common/Icon/Icon.tsx):

   - Renders FontAwesome icons
   - Supports customization through props

4. Application Initialization (src/index.tsx):
   - Initializes FontAwesome when the application starts

## Storybook Examples

The Icon component includes a comprehensive set of Storybook examples that demonstrate various usage patterns and configurations. To view these examples, run the Storybook development server and navigate to the Icon component section.

Examples include:

- Basic usage
- Size variations
- Color variations
- Padding variations
- Accessibility examples
- Common icon usage patterns
