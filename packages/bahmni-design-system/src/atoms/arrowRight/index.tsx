import {
  ArrowRight as CarbonArrowRight,
  type CarbonIconProps,
} from '@carbon/icons-react';
import React from 'react';

export type ArrowRightProps = CarbonIconProps & {
  testId?: string;
};

export const ArrowRight: React.FC<ArrowRightProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonArrowRight {...carbonProps} data-testid={testId} />;
};
