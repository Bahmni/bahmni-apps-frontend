import {
  ProgressBar as CarbonProgressBar,
  type ProgressBarProps as CarbonProgressBarProps,
} from '@carbon/react';
import React from 'react';

export type ProgressBarProps = CarbonProgressBarProps & {
  testId?: string;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonProgressBar {...carbonProps} data-testid={testId} />;
};
