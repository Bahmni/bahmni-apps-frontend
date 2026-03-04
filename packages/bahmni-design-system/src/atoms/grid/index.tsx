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
  'data-testid'?: string;
};

export const Grid: React.FC<GridProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonGrid {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonGrid>
  );
};

export type RowProps = CarbonRowProps<'div'> & {
  testId?: string;
  'data-testid'?: string;
};

export const Row: React.FC<RowProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonRow {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonRow>
  );
};

export type ColumnProps = CarbonColumnProps<'div'> & {
  testId?: string;
  'data-testid'?: string;
};

export const Column: React.FC<ColumnProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonColumn {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonColumn>
  );
};
