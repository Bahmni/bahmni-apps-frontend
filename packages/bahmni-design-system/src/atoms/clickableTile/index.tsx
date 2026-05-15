import {
  ClickableTile as CarbonClickableTile,
  ClickableTileProps as CarbonClickableTileProps,
} from '@carbon/react';
import React from 'react';

export type ClickableTileProps = CarbonClickableTileProps & {
  testId?: string;
};

export const ClickableTile: React.FC<ClickableTileProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonClickableTile {...carbonProps} data-testid={testId}>
      {children}
    </CarbonClickableTile>
  );
};
