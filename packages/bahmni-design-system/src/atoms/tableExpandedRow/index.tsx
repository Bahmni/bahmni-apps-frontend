import {
  TableExpandedRow as CarbonTableExpandedRow,
  TableExpandedRowProps as CarbonTableExpandedRowProps,
} from '@carbon/react';
import React from 'react';

export type TableExpandedRowProps = CarbonTableExpandedRowProps & {
  testId?: string;
};

export const TableExpandedRow: React.FC<TableExpandedRowProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonTableExpandedRow {...carbonProps} data-testid={testId} />;
};
