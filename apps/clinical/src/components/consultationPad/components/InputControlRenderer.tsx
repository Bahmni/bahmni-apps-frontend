import { MenuItemDivider } from '@bahmni/design-system';
import { useHasPrivilege } from '@bahmni/widgets';
import React from 'react';
import type { EncounterInputControl } from '../models';

interface InputControlRendererProps {
  entry: EncounterInputControl;
  encounterType: string;
}

const InputControlRenderer: React.FC<InputControlRendererProps> = ({
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

export default InputControlRenderer;
