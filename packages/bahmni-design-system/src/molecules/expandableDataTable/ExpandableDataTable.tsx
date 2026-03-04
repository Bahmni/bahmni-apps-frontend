import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandRow,
  TableExpandHeader,
  DataTableHeader,
  DataTableSkeleton,
} from '@carbon/react';
import classnames from 'classnames';
import React, { useState } from 'react';
import styles from './styles/ExpandableDataTable.module.scss';

interface ExpandableDataTableProps<T> {
  headers: DataTableHeader[];
  rows: T[];
  sortable?: { key: string; sortable: boolean }[];
  ariaLabel: string;
  loading?: boolean;
  errorStateMessage?: string | null;
  emptyStateMessage?: string;
  renderCell?: (row: T, cellId: string) => React.ReactNode;
  renderExpandedContent?: (row: T) => React.ReactNode;
  className?: string;
  dataTestId?: string;
  initialExpandedRows?: string[];
}

export const ExpandableDataTable = <T extends { id: string }>({
  headers,
  rows,
  ariaLabel,
  sortable = headers.map((header) => ({ key: header.key, sortable: true })),
  loading = false,
  errorStateMessage = null,
  emptyStateMessage = 'No data available.',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderCell = (row, cellId) => (row as any)[cellId],
  renderExpandedContent,
  className = 'expandable-data-table',
  dataTestId = 'expandable-data-table',
  initialExpandedRows = [],
}: ExpandableDataTableProps<T>) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set(initialExpandedRows),
  );

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  if (errorStateMessage) {
    return (
      <p
        data-testid={`${dataTestId}-error`}
        className={styles.expandableDataTableBodyEmpty}
      >
        {errorStateMessage}
      </p>
    );
  }

  if (loading) {
    return (
      <div data-testid={`${dataTestId}-skeleton`} className={className}>
        <DataTableSkeleton
          columnCount={headers.length + 1}
          rowCount={5}
          showHeader={false}
          showToolbar={false}
          compact
          className={styles.expandableDataTableSkeleton}
        />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <p
        data-testid={`${dataTestId}-empty`}
        className={styles.expandableDataTableBodyEmpty}
      >
        {emptyStateMessage}
      </p>
    );
  }

  const rowMap = new Map(rows.map((row) => [row.id, row]));
  const hasExpandableRows = renderExpandedContent !== undefined;

  return (
    <div
      className={classnames(className, styles.expandableDataTableBody)}
      data-testid={dataTestId}
    >
      <DataTable rows={rows} headers={headers} isSortable size="md">
        {({
          rows: tableRows,
          headers: tableHeaders,
          getHeaderProps,
          getRowProps,
          getTableProps,
        }) => (
          <Table {...getTableProps()} aria-label={ariaLabel} size="md">
            <TableHead>
              <TableRow>
                {hasExpandableRows && <TableExpandHeader />}
                {tableHeaders.map((header) => {
                  const headerProps = getHeaderProps({
                    header,
                    isSortable:
                      sortable.find((s) => s.key === header.key)?.sortable ??
                      false,
                  });
                  return (
                    <TableHeader
                      {...headerProps}
                      key={header.key}
                      data-testid={`table-header-${header.key}`}
                    >
                      {header.header}
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => {
                const originalRow = rowMap.get(row.id)!;
                const isExpanded = expandedRows.has(row.id);
                const isExpandable = renderExpandedContent?.(originalRow);
                const rowPropsWithKey = getRowProps({ row });
                const { key, ...rowProps } = rowPropsWithKey;

                return (
                  <>
                    {isExpandable ? (
                      <>
                        <TableExpandRow
                          {...rowProps}
                          key={key}
                          isExpanded={isExpanded}
                          onExpand={() => toggleRowExpansion(row.id)}
                          data-testid={`table-row-${row.id}`}
                        >
                          {row.cells.map((cell) => (
                            <TableCell
                              key={cell.id}
                              data-testid={`table-cell-${row.id}-${cell.info.header}`}
                            >
                              {renderCell(originalRow, cell.info.header)}
                            </TableCell>
                          ))}
                        </TableExpandRow>
                        {isExpanded && renderExpandedContent?.(originalRow)}
                      </>
                    ) : (
                      <TableRow
                        {...rowProps}
                        key={key}
                        data-testid={`table-row-${row.id}`}
                      >
                        {hasExpandableRows && (
                          <TableCell key={`expand-spacer-${row.id}`} />
                        )}
                        {row.cells.map((cell) => (
                          <TableCell
                            key={cell.id}
                            data-testid={`table-cell-${row.id}-${cell.info.header}`}
                          >
                            {renderCell(originalRow, cell.info.header)}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </div>
  );
};
