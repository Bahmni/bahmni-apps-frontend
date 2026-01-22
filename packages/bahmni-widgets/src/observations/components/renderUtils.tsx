import {
  CollapsibleRowGroup,
  ImageTile,
  RowCell,
  VideoTile,
} from '@bahmni/design-system';
import { getValueType } from '@bahmni/services';
import { ExtractedObservation, GroupedObservation } from '../models';
import { transformObservationToRowCell } from '../utils';

export const renderObservation = (
  observation: ExtractedObservation,
  index: number,
  t: (key: string, options?: { provider?: string }) => string,
) => {
  const rowData = transformObservationToRowCell(observation, index);

  const value = rowData.value;
  const valueType = getValueType(value);
  let valueToDisplay: React.ReactNode = value;

  if (valueType === 'Image')
    valueToDisplay = (
      <ImageTile imageSrc={value} alt={value} id={`${value}-img`} />
    );

  if (valueType == 'Video')
    valueToDisplay = <VideoTile id={`${value}-video`} videoSrc={value} />;

  const info = t('OBSERVATIONS_RECORDED_BY', {
    provider: rowData.provider,
  });
  return (
    <RowCell
      key={`obs-${observation.id}`}
      header={rowData.header}
      value={valueToDisplay}
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
