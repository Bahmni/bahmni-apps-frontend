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
  DataTableHeader,
  Accordion,
  AccordionItem,
} from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { generateId, getFormattedError } from '@utils/common';
import './styles/ExpandableDataTable.scss';

interface ExpandableDataTableProps<T> {
  tableTitle: string;
  rows: T[];
  headers: DataTableHeader[];
  sortable?: { key: string; sortable: boolean }[];
  renderCell: (row: T, cellId: string) => React.ReactNode;
  loading?: boolean;
  error?: unknown;
  ariaLabel?: string;
  emptyStateMessage?: string;
  className?: string;
  rowClassNames?: Record<string, string>;
  isOpen?: boolean;
}

export const ExpandableDataTable = <T extends { id?: string }>({
  tableTitle,
  rows,
  headers,
  sortable = headers.map((header) => ({ key: header.key, sortable: true })),
  renderCell,
  loading = false,
  error = null,
  ariaLabel = tableTitle,
  emptyStateMessage,
  className = 'expandable-data-table-item',
  rowClassNames = {},
  isOpen = false,
}: ExpandableDataTableProps<T>) => {
  const { t } = useTranslation();
  emptyStateMessage =
    emptyStateMessage ?? t('EXPANDABLE_TABLE_EMPTY_STATE_MESSAGE');
  if (error) {
    const formattedError = getFormattedError(error);
    return (
      <div data-testid="expandable-table-error" className={className}>
        <Accordion align="start">
          <AccordionItem title={tableTitle} open={isOpen}>
            <p className={'emptyState'}>
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
        <Accordion align="start">
          <AccordionItem title={tableTitle} open={isOpen}>
            <DataTableSkeleton
              columnCount={headers.length}
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
        <Accordion align="start">
          <AccordionItem title={tableTitle} open={isOpen}>
            <p className={'emptyState'}>{emptyStateMessage}</p>
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
      <Accordion align="start">
        <AccordionItem title={tableTitle} open={isOpen}>
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
                          <TableRow
                            {...getRowProps({ row })}
                            key={generateId()}
                            style={{ width: '100%' }}
                          >
                            {tableHeaders.map((header) => (
                              <TableCell
                                key={`cell-${generateId()}`}
                                className={rowClassNames[row.id]}
                              >
                                {renderCell(originalRow, header.key)}
                              </TableCell>
                            ))}
                          </TableRow>
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
