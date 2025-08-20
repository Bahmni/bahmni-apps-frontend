import {
  Stack as CarbonStack,
  StackProps as CarbonStackProps,
} from '@carbon/react';
import React from 'react';

export type StackProps = CarbonStackProps & {
  testId?: string;
};

export const Stack: React.FC<StackProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonStack {...carbonProps} data-testid={testId}>
      {children}
    </CarbonStack>
  );
};
