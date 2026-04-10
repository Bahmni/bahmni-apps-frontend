import { MenuItemDivider } from '@bahmni/design-system';
import { useHasPrivilege } from '@bahmni/widgets';
import React from 'react';
import type { FormRegistry } from '../models';

interface FormRendererProps {
  entry: FormRegistry;
  encounterType: string;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  entry,
  encounterType,
}) => {
  const hasPrivilege = useHasPrivilege(entry.privilege);

  if (
    (entry.encounterTypes && !entry.encounterTypes.includes(encounterType)) ||
    !hasPrivilege
  )
    return null;

  const Component = entry.component;
  return (
    <div>
      <Component />
      <MenuItemDivider data-testid={`${entry.key}-divider`} />
    </div>
  );
};

export default FormRenderer;
