import { TableToolbar, TableToolbarContent } from '@carbon/react';
import type { Table } from '@tanstack/react-table';
import styles from '../styles/DataTable.module.scss';
import type {
  DataTableActionButton as DataTableActionButtonConfig,
  DataTableColumn,
} from '../types';
import { DataTableActionButton } from './DataTableActionButton';
import { DataTableFilterToggle } from './DataTableFilterToggle';
import { DataTableGlobalSearch } from './DataTableGlobalSearch';
import { DataTableGroupByControl } from './DataTableGroupByControl';

interface DataTableToolbarProps<T extends { id: string }> {
  table: Table<T>;
  id?: string;
  dataTestId: string;
  actionButtons?: DataTableActionButtonConfig[];
  enableGlobalSearch: boolean;
  globalSearchPlaceholder?: string;
  hasFilterableColumns: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
  groupableColumns: DataTableColumn<T>[];
}

export const DataTableToolbar = <T extends { id: string }>({
  table,
  id,
  dataTestId,
  actionButtons,
  enableGlobalSearch,
  globalSearchPlaceholder,
  hasFilterableColumns,
  showFilters,
  onToggleFilters,
  groupableColumns,
}: DataTableToolbarProps<T>) => {
  const hasGrouping = groupableColumns.length > 0;
  const hasAnyControl =
    enableGlobalSearch ||
    hasFilterableColumns ||
    hasGrouping ||
    !!actionButtons?.length;

  if (!hasAnyControl) return null;

  const idPrefix = id ?? 'data-table';
  const activeFilterCount = table.getState().columnFilters.length;

  return (
    <TableToolbar>
      <TableToolbarContent>
        {enableGlobalSearch && (
          <DataTableGlobalSearch
            table={table}
            placeholder={globalSearchPlaceholder}
            dataTestId={dataTestId}
          />
        )}
        {hasFilterableColumns && (
          <DataTableFilterToggle
            isOpen={showFilters}
            onToggle={onToggleFilters}
            onClearAll={() => {
              table.resetColumnFilters();
              if (showFilters) onToggleFilters();
            }}
            activeFilterCount={activeFilterCount}
            dataTestId={dataTestId}
          />
        )}
        {hasGrouping && (
          <DataTableGroupByControl
            table={table}
            groupableColumns={groupableColumns}
            dataTestId={dataTestId}
          />
        )}
        {actionButtons && actionButtons.length > 0 && (
          <div className={styles.actionButtons}>
            {actionButtons.map((btn, i) => (
              <DataTableActionButton
                key={btn.label}
                config={btn}
                idPrefix={`${idPrefix}-${i}`}
              />
            ))}
          </div>
        )}
      </TableToolbarContent>
    </TableToolbar>
  );
};
