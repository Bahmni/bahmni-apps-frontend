import { Filter as FilterIcon } from '@carbon/icons-react';
import { IconButton } from '@carbon/react';

interface DataTableFilterToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  onClearAll: () => void;
  activeFilterCount: number;
  dataTestId: string;
}

export const DataTableFilterToggle = ({
  isOpen,
  onToggle,
  onClearAll,
  activeFilterCount,
  dataTestId,
}: DataTableFilterToggleProps) => {
  const hasActiveFilters = activeFilterCount > 0;
  const inactiveLabel = isOpen ? 'Hide filters' : 'Filters';
  const label = hasActiveFilters
    ? `Clear filters (${activeFilterCount})`
    : inactiveLabel;

  return (
    <IconButton
      label={label}
      kind="ghost"
      onClick={hasActiveFilters ? onClearAll : onToggle}
      data-testid={`${dataTestId}-filter-toggle`}
      aria-pressed={isOpen}
    >
      <FilterIcon />
    </IconButton>
  );
};
