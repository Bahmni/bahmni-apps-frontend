import { FilterableMultiSelect } from '@carbon/react';
import type { Column } from '@tanstack/react-table';
import styles from '../styles/DataTable.module.scss';
import type { DataTableFilterOption } from '../types';
import { deriveFacetedOptions } from '../utils';

interface DataTableSelectFilterProps<T> {
  column: Column<T>;
  header: string;
  explicitOptions?: DataTableFilterOption[];
  dataTestId: string;
}

export const DataTableSelectFilter = <T,>({
  column,
  header,
  explicitOptions,
  dataTestId,
}: DataTableSelectFilterProps<T>) => {
  const options =
    explicitOptions ?? deriveFacetedOptions(column.getFacetedUniqueValues());
  const selectedValues = (column.getFilterValue() as string[]) ?? [];
  const selectedItems = options.filter((option) =>
    selectedValues.includes(option.value),
  );

  return (
    <FilterableMultiSelect
      id={`${dataTestId}-filter-${column.id}`}
      data-testid={`${dataTestId}-filter-${column.id}`}
      className={styles.selectFilter}
      titleText={`Filter ${header}`}
      hideLabel
      placeholder={`Filter ${header}`}
      useTitleInItem
      items={options}
      itemToString={(item) => (item ? item.label : '')}
      initialSelectedItems={selectedItems}
      selectedItems={selectedItems}
      onChange={({ selectedItems: next }) => {
        if (!next || next.length === 0) {
          column.setFilterValue(undefined);
        } else {
          column.setFilterValue(next.map((i) => i.value));
        }
      }}
      size="sm"
    />
  );
};
