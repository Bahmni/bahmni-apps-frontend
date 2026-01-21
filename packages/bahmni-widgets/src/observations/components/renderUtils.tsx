import { CollapsibleRowGroup, RowCell } from '@bahmni/design-system';
import { ExtractedObservation, GroupedObservation } from '../models';
import { transformObservationToRowCell } from '../utils';

export const renderObservation = (
  observation: ExtractedObservation,
  index: number,
  t: (key: string, options?: { provider?: string }) => string,
) => {
  const rowData = transformObservationToRowCell(observation, index);
  const info = t('OBSERVATIONS_RECORDED_BY', {
    provider: rowData.provider,
  });
  return (
    <RowCell
      key={`obs-${observation.id}`}
      header={rowData.header}
      value={rowData.value}
      info={info}
      id={`obs-${observation.id}`}
      testId={`obs-${observation.id}-test-id`}
      ariaLabel={`obs-${observation.id}-aria-label`}
    />
  );
};

export const renderGroupedObservation = (
  groupedObs: GroupedObservation,
  t: (key: string, options?: { provider?: string }) => string,
) => {
  return (
    <CollapsibleRowGroup
      key={`grouped-obs-${groupedObs.id}`}
      title={groupedObs.display}
      id={`grouped-obs-${groupedObs.id}`}
    >
      {groupedObs.children.map((child, childIndex) =>
        renderObservation(child, childIndex, t),
      )}
    </CollapsibleRowGroup>
  );
};
