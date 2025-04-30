# FontAwesome Icons Guide

This guide explains how to use FontAwesome icons in the Bahmni Clinical Frontend application.

## Overview

The application uses FontAwesome free icons (solid and regular styles) through a custom Icon component. This allows for consistent icon usage throughout the application and supports specifying icons in configuration.

## Usage

### Basic Usage

Import the Icon component and use it in your components:

```tsx
import React from 'react';
import Icon from '@components/common/Icon';

const MyComponent: React.FC = () => {
  return (
    <div>
      <h1>
        <Icon name="fa-home" /> Home
      </h1>
      <button>
        <Icon name="fa-cog" /> Settings
      </button>
    </div>
  );
};
```

### Icon Styles

The Icon component supports both solid (default) and regular (outline) styles:

```tsx
// Solid icon (default)
<Icon name="fa-home" />

// Regular icon (option 1)
<Icon name="fa-regular-user" />

// Regular icon (option 2)
<Icon name="far-user" />
```

### Icon Properties

The Icon component accepts the following properties:

| Property  | Type                                                                                | Description                                |
|-----------|-------------------------------------------------------------------------------------|--------------------------------------------|
| name      | string                                                                              | Icon name in the format "fa-home"          |
| className | string                                                                              | Additional CSS classes                     |
| size      | 'xs' \| 'sm' \| 'lg' \| '1x' \| '2x' \| '3x' \| '4x' \| '5x' \| '6x' \| '7x' \| '8x' \| '9x' \| '10x' | Icon size                                  |
| color     | string                                                                              | Icon color (CSS color value)               |

Example with properties:

```tsx
<Icon 
  name="fa-user" 
  size="2x" 
  color="#0f62fe" 
  className="user-icon" 
/>
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
      "icon": "fa-regular-calendar",
      "url": "/appointments"
    }
  ]
}
```

When rendering components based on this configuration, use the Icon component:

```tsx
import React from 'react';
import Icon from '@components/common/Icon';

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
      {dashboard.icon && <Icon name={dashboard.icon} size="lg" />}
      <span>{dashboard.name}</span>
    </div>
  );
};
```

## Available Icons

For a complete list of available icons, refer to the FontAwesome documentation:

- [Solid Icons](https://fontawesome.com/icons?d=gallery&s=solid&m=free)
- [Regular Icons](https://fontawesome.com/icons?d=gallery&s=regular&m=free)

## Implementation Details

The FontAwesome integration consists of:

1. FontAwesome packages:
   - @fortawesome/react-fontawesome
   - @fortawesome/fontawesome-svg-core
   - @fortawesome/free-solid-svg-icons
   - @fortawesome/free-regular-svg-icons

2. Configuration (src/config/fontawesome.ts):
   - Initializes the FontAwesome library
   - Adds all solid and regular icons

3. Icon Component (src/components/common/Icon.tsx):
   - Renders FontAwesome icons
   - Handles different icon styles
   - Supports customization through props

4. Application Initialization (src/index.tsx):
   - Initializes FontAwesome when the application starts