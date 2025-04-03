import React from 'react';
import {
  DataTable,
  DataTableSkeleton,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  DataTableHeader,
  Accordion,
  AccordionItem,
} from '@carbon/react';
import { generateId, getFormattedError } from '@utils/common';
import './ExpandableDataTable.scss';

interface ExpandableDataTableProps<T> {
  tableTitle: string;
  rows: T[];
  headers: DataTableHeader[];
  renderCell: (row: T, cellId: string) => React.ReactNode;
  renderExpandedContent: (row: T) => React.ReactNode;
  loading?: boolean;
  error?: unknown;
  ariaLabel?: string;
  emptyStateMessage?: string;
  className?: string;
  rowClassNames?: string[];
}

export const ExpandableDataTable = <T extends { id?: string }>({
  tableTitle,
  rows,
  headers,
  renderCell,
  renderExpandedContent,
  loading = false,
  error = null,
  ariaLabel = tableTitle,
  emptyStateMessage = 'No data available',
  className = 'expandable-data-table-item',
  rowClassNames = [],
}: ExpandableDataTableProps<T>) => {
  if (error) {
    const formattedError = getFormattedError(error);
    return (
      <div data-testid="expandable-table-error" className={className}>
        <Accordion>
          <AccordionItem title={tableTitle}>
            <p style={{ padding: '0.5rem' }}>
              {formattedError.title}: {formattedError.message}
            </p>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  // Loading state rendering
  if (loading) {
    return (
      <div data-testid="expandable-table-skeleton" className={className}>
        <Accordion>
          <AccordionItem title={tableTitle}>
            <DataTableSkeleton
              columnCount={headers.length + 1}
              rowCount={5}
              showHeader={false}
              showToolbar={false}
              compact
            />
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  // Empty state rendering
  if (!rows || rows.length === 0) {
    return (
      <div data-testid="expandable-data-table-empty" className={className}>
        <Accordion>
          <AccordionItem title={tableTitle}>
            <p style={{ padding: '0.5rem' }}>{emptyStateMessage}</p>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  // Prepare rows with proper IDs
  const dataTableRows = rows.map((row) => ({
    ...row,
    id: row.id ?? generateId(),
  }));

  return (
    <div className={className} data-testid="expandable-data-table">
      <Accordion>
        <AccordionItem title={tableTitle}>
          <DataTable rows={dataTableRows} headers={headers} isSortable>
            {({
              rows: tableRows,
              headers: tableHeaders,
              getHeaderProps,
              getRowProps,
              getTableProps,
              getTableContainerProps,
            }) => (
              <TableContainer {...getTableContainerProps()}>
                <Table
                  {...getTableProps()}
                  key={generateId()}
                  aria-label={ariaLabel}
                >
                  <TableHead>
                    <TableRow>
                      <TableExpandHeader />
                      {tableHeaders.map((header) => (
                        <TableHeader
                          {...getHeaderProps({ header })}
                          key={generateId()}
                        >
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row, index) => {
                      const originalRow = dataTableRows.find(
                        (r) => r.id === row.id,
                      ) as T;

                      return (
                        <React.Fragment key={row.id}>
                          {!renderExpandedContent(originalRow) ? (
                            <TableRow
                              {...getRowProps({ row })}
                              key={generateId()}
                              style={{ width: '100%' }}
                            >
                              <TableCell />
                              {tableHeaders.map((header) => (
                                <TableCell
                                  key={`cell-${generateId()}`}
                                  className={
                                    rowClassNames[index]
                                      ? rowClassNames[index]
                                      : undefined
                                  }
                                >
                                  {renderCell(originalRow, header.key)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ) : (
                            <>
                              <TableExpandRow
                                {...getRowProps({ row })}
                                key={generateId()}
                              >
                                {tableHeaders.map((header) => (
                                  <TableCell
                                    key={`cell-${generateId()}`}
                                    className={
                                      rowClassNames[index]
                                        ? rowClassNames[index]
                                        : undefined
                                    }
                                  >
                                    {renderCell(originalRow, header.key)}
                                  </TableCell>
                                ))}
                              </TableExpandRow>
                              <TableExpandedRow
                                colSpan={tableHeaders.length + 1}
                              >
                                {renderExpandedContent(originalRow)}
                              </TableExpandedRow>
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
