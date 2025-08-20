import {
  Grid as CarbonGrid,
  GridProps as CarbonGridProps,
  Row as CarbonRow,
  RowProps as CarbonRowProps,
  Column as CarbonColumn,
  ColumnProps as CarbonColumnProps,
} from '@carbon/react';
import React from 'react';

export type GridProps = CarbonGridProps<'div'> & {
  testId?: string;
};

export const Grid: React.FC<GridProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonGrid {...carbonProps} data-testid={testId}>
      {children}
    </CarbonGrid>
  );
};

export type RowProps = CarbonRowProps<'div'> & {
  testId?: string;
};

export const Row: React.FC<RowProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonRow {...carbonProps} data-testid={testId}>
      {children}
    </CarbonRow>
  );
};

export type ColumnProps = CarbonColumnProps<'div'> & {
  testId?: string;
};

export const Column: React.FC<ColumnProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonColumn {...carbonProps} data-testid={testId}>
      {children}
    </CarbonColumn>
  );
};
