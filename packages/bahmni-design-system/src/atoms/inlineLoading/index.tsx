import {
  InlineLoading as CarbonInlineLoading,
  type InlineLoadingProps as CarbonInlineLoadingProps,
} from '@carbon/react';
import React from 'react';

export type InlineLoadingProps = CarbonInlineLoadingProps & {
  testId?: string;
};

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonInlineLoading {...carbonProps} data-testid={testId} />;
};
