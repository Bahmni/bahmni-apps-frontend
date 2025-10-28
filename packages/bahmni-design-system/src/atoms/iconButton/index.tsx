import {
  IconButton as CarbonIconButton,
  IconButtonProps as CarbonIconButtonProps,
} from '@carbon/react';
import React from 'react';

export type IconButtonProps = CarbonIconButtonProps & {
  testId?: string;
};

export const IconButton: React.FC<IconButtonProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonIconButton {...carbonProps} data-testid={testId} />;
};
