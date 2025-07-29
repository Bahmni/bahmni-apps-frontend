import React from 'react';
import { Button } from '@bahmni-frontend/bahmni-design-system';

export const TestButton: React.FC = () => {
  return (
    <div>
      <h2>Testing Bahmni Design System Button</h2>
      <Button kind="primary" testId="test-primary">
        Primary Button
      </Button>
      <Button kind="secondary" testId="test-secondary">
        Secondary Button
      </Button>
      <Button kind="tertiary" testId="test-tertiary" disabled>
        Disabled Button
      </Button>
    </div>
  );
};
