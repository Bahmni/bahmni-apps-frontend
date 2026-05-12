import { MenuItemDivider } from '@bahmni/design-system';
import { useHasPrivilege } from '@bahmni/widgets';
import React from 'react';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import type { InputControl } from './models';

interface InputControlRendererProps {
  entry: InputControl;
  encounterType: string;
  encounterSessionStartContext: EncounterSessionStartContext;
}

const InputControlRenderer: React.FC<InputControlRendererProps> = ({
  entry,
  encounterType,
  encounterSessionStartContext,
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
      <Component
        encounterSessionStartContext={encounterSessionStartContext}
        inputControlConfig={entry.inputControlConfig}
      />
      <MenuItemDivider data-testid={`${entry.key}-divider`} />
    </div>
  );
};

export default InputControlRenderer;
