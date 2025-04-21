import React from 'react';
import { useTranslation } from 'react-i18next';
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
  sortable?: { key: string; sortable: boolean }[];
  renderCell: (row: T, cellId: string) => React.ReactNode;
  renderExpandedContent: (row: T) => React.ReactNode;
  loading?: boolean;
  error?: unknown;
  ariaLabel?: string;
  emptyStateMessage?: string;
  className?: string;
  rowClassNames?: Record<string, string>;
}

export const ExpandableDataTable = <T extends { id?: string }>({
  tableTitle,
  rows,
  headers,
  sortable = headers.map((header) => ({ key: header.key, sortable: true })),
  renderCell,
  renderExpandedContent,
  loading = false,
  error = null,
  ariaLabel = tableTitle,
  emptyStateMessage,
  className = 'expandable-data-table-item',
  rowClassNames = {},
}: ExpandableDataTableProps<T>) => {
  const { t } = useTranslation();
  emptyStateMessage =
    emptyStateMessage || t('EXPANDABLE_TABLE_EMPTY_STATE_MESSAGE');
  if (error) {
    const formattedError = getFormattedError(error);
    return (
      <div data-testid="expandable-table-error" className={className}>
        <Accordion>
          <AccordionItem title={tableTitle}>
            <p style={{ padding: '0.5rem' }}>
              {t('EXPANDABLE_TABLE_ERROR_MESSAGE', {
                title: formattedError.title,
                message: formattedError.message,
              })}
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
          <DataTable rows={dataTableRows} headers={headers}>
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
                          {...getHeaderProps({
                            header,
                            isSortable:
                              sortable.find((s) => s.key === header.key)
                                ?.sortable ?? false,
                          })}
                          key={generateId()}
                        >
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row) => {
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
                                  className={rowClassNames[row.id]}
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
                                    className={rowClassNames[row.id]}
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
