import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
  DataTableHeader,
  DataTableSkeleton,
} from '@carbon/react';
import classnames from 'classnames';
import React, { useState } from 'react';
import styles from './styles/ExpandableSortableDataTable.module.scss';

interface ExpandableSortableDataTableProps<
  T extends { id: string; isExpandable?: boolean },
> {
  headers: DataTableHeader[];
  rows: T[];
  sortable?: { key: string; sortable: boolean }[];
  ariaLabel: string;
  loading?: boolean;
  errorStateMessage?: string | null;
  emptyStateMessage?: string;
  renderCell: (row: T, cellId: string) => React.ReactNode;
  renderExpandedContent: (row: T) => React.ReactNode;
  expandedRowClassName?: string;
  className?: string;
}

export const ExpandableSortableDataTable = <
  T extends { id: string; isExpandable?: boolean },
>({
  headers,
  rows,
  ariaLabel,
  sortable = headers.map((header) => ({
    key: header.key,
    sortable:
      (header as DataTableHeader & { isSortable?: boolean }).isSortable ===
      true,
  })),
  loading = false,
  errorStateMessage = null,
  emptyStateMessage = 'No data available.',
  renderCell,
  renderExpandedContent,
  expandedRowClassName = '',
  className = 'expandable-sortable-data-table',
}: ExpandableSortableDataTableProps<T>) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (rowId: string) => {
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
        data-testid="expandable-table-error"
        className={styles.expandableDataTableBodyEmpty}
      >
        {errorStateMessage}
      </p>
    );
  }

  if (loading) {
    return (
      <div data-testid="expandable-table-skeleton" className={className}>
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
        data-testid="expandable-table-empty"
        className={styles.expandableDataTableBodyEmpty}
      >
        {emptyStateMessage}
      </p>
    );
  }

  const rowMap = new Map(rows.map((row) => [row.id, row]));

  return (
    <div
      className={classnames(className, styles.expandableDataTableBody)}
      data-testid="expandable-sortable-data-table"
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
                <TableExpandHeader aria-label="Expand row" />
                {tableHeaders.map((header) => {
                  const isSortable =
                    sortable.find((s) => s.key === header.key)?.sortable ??
                    false;
                  // Always render as sortable for consistent spacing, control behavior with CSS
                  const headerProps = getHeaderProps({
                    header,
                    isSortable: true,
                  });
                  return (
                    <TableHeader
                      {...headerProps}
                      key={header.key}
                      className={classnames(
                        headerProps.className,
                        !isSortable ? styles.nonSortableHeader : '',
                      )}
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
                const isRowExpandable = originalRow.isExpandable !== false;
                const { key: _key, ...rowProps } = getRowProps({ row });

                return (
                  <React.Fragment key={row.id}>
                    <TableExpandRow
                      {...rowProps}
                      key={row.id}
                      isExpanded={isExpanded}
                      onExpand={() => isRowExpandable && toggleExpand(row.id)}
                      aria-label={`Expand row ${row.id}`}
                      className={classnames({
                        [styles.hideExpandButton]: !isRowExpandable,
                      })}
                    >
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>
                          {renderCell(originalRow, cell.info.header)}
                        </TableCell>
                      ))}
                    </TableExpandRow>
                    {isExpanded && isRowExpandable && (
                      <TableExpandedRow
                        colSpan={headers.length + 1}
                        className={classnames(
                          styles.expandedRowContent,
                          expandedRowClassName,
                        )}
                      >
                        {renderExpandedContent(originalRow)}
                      </TableExpandedRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </div>
  );
};
