# Bahmni Design System

A reusable React component library built on [Carbon Design System](https://carbondesignsystem.com/), designed for building modern healthcare and enterprise web applications.

## Installation

```bash
npm install bahmni-design-system
# or 
yarn add bahmni-design-system
```

## Quick Start

```tsx
import { Button } from 'bahmni-design-system';

function App() {
  return (
    <div>
      <Button>Submit</Button>
    </div>
  );
}
```

## Components

### Atoms (Basic Building Blocks)

Simple, single-purpose UI elements like buttons, inputs, and dropdowns. These are the smallest building blocks you'll use in your application.

### Molecules (Composite Components)

Combinations of atoms working together, such as data tables, form sections, and icon buttons. These solve common UI patterns.

### Organisms (Complex Components)

Large, functional sections like navigation headers and sidebars. These are complete features ready to use in your application.

### Templates (Page Layouts)

Pre-built page structures that provide consistent layouts and spacing across your application.


## Styling

The library includes Carbon Design System styles. Import them in your application:

```tsx
import 'bahmni-design-system/styles';
```

## TypeScript Support

All components are fully typed with TypeScript. 

## Peer Dependencies

- `react`: >=18.0.0
- `react-dom`: >=18.0.0

## Development

### Running Tests

```bash
nx test bahmni-design-system
```

### Building

```bash
nx build bahmni-design-system
```

## License

MPLv2 - See [LICENSE](./LICENSE) file for details.

## Links


- [Bahmni Project](https://www.bahmni.org/)
- [GitHub Repository](https://github.com/Bahmni/bahmni-apps-frontend)
- [Carbon Design System Documentation](https://carbondesignsystem.com/)
