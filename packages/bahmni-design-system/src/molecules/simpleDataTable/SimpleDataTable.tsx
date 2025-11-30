import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  DataTableHeader,
} from '@carbon/react';
import React from 'react';
import styles from './styles/SimpleDataTable.module.scss';

export interface SimpleDataTableProps<T> {
  headers: DataTableHeader[];
  rows: T[];
  ariaLabel: string;
  className?: string;
}

export const SimpleDataTable = <T extends { id: string }>({
  headers,
  rows,
  ariaLabel,
  className = '',
}: SimpleDataTableProps<T>) => {
  return (
    <div className={`${styles.simpleDataTableBody} ${className}`}>
      <DataTable rows={rows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()} aria-label={ariaLabel}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })} key={header.key}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })} key={row.id}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </div>
  );
};
