import {
  IconButton as CarbonIconButton,
  IconButtonProps as CarbonIconButtonProps,
} from '@carbon/react';
import React, { forwardRef } from 'react';

export type IconButtonProps = CarbonIconButtonProps & {
  testId?: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ testId, ...carbonProps }, ref) => {
    return <CarbonIconButton {...carbonProps} ref={ref} data-testid={testId} />;
  },
);

IconButton.displayName = 'IconButton';
