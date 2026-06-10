import { Button } from '../../../atoms/button';
import type { DataTableActionButton as DataTableActionButtonConfig } from '../types';

interface DataTableActionButtonProps {
  config: DataTableActionButtonConfig;
  idPrefix: string;
}

export const DataTableActionButton = ({
  config,
  idPrefix,
}: DataTableActionButtonProps) => (
  <Button
    {...config.props}
    id={`${idPrefix}-action-button`}
    data-testid={`${idPrefix}-action-button-test-id`}
    onClick={config.onClick}
    disabled={config.disabled}
  >
    {config.label}
  </Button>
);
