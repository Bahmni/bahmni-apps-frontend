import { Dropdown } from '@carbon/react';
import type { Table } from '@tanstack/react-table';
import styles from '../styles/DataTable.module.scss';
import type { DataTableColumn } from '../types';

const NO_GROUPING = '__none__';

interface GroupByOption {
  id: string;
  label: string;
}

interface DataTableGroupByControlProps<T extends { id: string }> {
  table: Table<T>;
  groupableColumns: DataTableColumn<T>[];
  dataTestId: string;
}

export const DataTableGroupByControl = <T extends { id: string }>({
  table,
  groupableColumns,
  dataTestId,
}: DataTableGroupByControlProps<T>) => {
  const items: GroupByOption[] = [
    { id: NO_GROUPING, label: 'None' },
    ...groupableColumns.map((c) => ({ id: c.key, label: c.header })),
  ];

  const currentGroupingId = table.getState().grouping[0] ?? NO_GROUPING;
  const selectedItem =
    items.find((item) => item.id === currentGroupingId) ?? items[0];

  return (
    <Dropdown
      id={`${dataTestId}-group-by`}
      data-testid={`${dataTestId}-group-by`}
      className={styles.groupByDropdown}
      titleText="Group by"
      hideLabel
      label="Group by"
      items={items}
      type="inline"
      itemToString={(item) => (item ? item.label : '')}
      renderSelectedItem={(item: GroupByOption) =>
        item.id === NO_GROUPING ? 'Group by' : `Group: ${item.label}`
      }
      selectedItem={selectedItem}
      onChange={({ selectedItem: next }) => {
        if (!next || next.id === NO_GROUPING) {
          table.setGrouping([]);
        } else {
          table.setGrouping([next.id]);
        }
      }}
      size="sm"
    />
  );
};
