import {
  DataTable as CarbonDataTable,
  DataTableProps as CarbonDataTableProps,
  DataTableSkeleton,
  DataTableSkeletonProps,
  Table,
  TableHead,
  TableHeadProps,
  TableRow,
  TableRowProps,
  TableHeader,
  TableHeaderProps,
  TableBody,
  TableBodyProps,
  TableCell,
  TableCellProps,
  TableContainer,
  TableContainerProps,
  DataTableHeader,
} from '@carbon/react';
import React from 'react';

// Base DataTable wrapper
export type DataTableProps<
  RowType = Record<string, unknown>,
  ColTypes extends unknown[] = unknown[],
> = CarbonDataTableProps<RowType, ColTypes> & {
  testId?: string;
};

export const DataTable = <
  RowType = Record<string, unknown>,
  ColTypes extends unknown[] = unknown[],
>({
  testId,
  children,
  ...carbonProps
}: DataTableProps<RowType, ColTypes>) => {
  return (
    <CarbonDataTable {...carbonProps} data-testid={testId}>
      {children}
    </CarbonDataTable>
  );
};

// DataTableSkeleton wrapper
export type DataTableSkeletonWrapperProps = DataTableSkeletonProps & {
  testId?: string;
};

export const DataTableSkeletonWrapper: React.FC<
  DataTableSkeletonWrapperProps
> = ({ testId, ...carbonProps }) => {
  return <DataTableSkeleton {...carbonProps} data-testid={testId} />;
};

// Table wrapper
export type TableWrapperProps = React.ComponentProps<typeof Table> & {
  testId?: string;
  children?: React.ReactNode;
};

export const TableWrapper: React.FC<TableWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <Table {...carbonProps} data-testid={testId}>
      {children}
    </Table>
  );
};

// TableHead wrapper
export type TableHeadWrapperProps = TableHeadProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TableHeadWrapper: React.FC<TableHeadWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TableHead {...carbonProps} data-testid={testId}>
      {children}
    </TableHead>
  );
};

// TableRow wrapper
export type TableRowWrapperProps = TableRowProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TableRowWrapper: React.FC<TableRowWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TableRow {...carbonProps} data-testid={testId}>
      {children}
    </TableRow>
  );
};

// TableHeader wrapper
export type TableHeaderWrapperProps = TableHeaderProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TableHeaderWrapper: React.FC<TableHeaderWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TableHeader {...carbonProps} data-testid={testId}>
      {children}
    </TableHeader>
  );
};

// TableBody wrapper
export type TableBodyWrapperProps = TableBodyProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TableBodyWrapper: React.FC<TableBodyWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TableBody {...carbonProps} data-testid={testId}>
      {children}
    </TableBody>
  );
};

// TableCell wrapper
export type TableCellWrapperProps = TableCellProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TableCellWrapper: React.FC<TableCellWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TableCell {...carbonProps} data-testid={testId}>
      {children}
    </TableCell>
  );
};

// TableContainer wrapper
export type TableContainerWrapperProps = TableContainerProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TableContainerWrapper: React.FC<TableContainerWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TableContainer {...carbonProps} data-testid={testId}>
      {children}
    </TableContainer>
  );
};

// Re-export DataTableHeader type as-is (it's just a type, not a component)
export { type DataTableHeader };
