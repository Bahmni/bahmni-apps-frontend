import {
  CollapsibleRowGroup,
  ImageTile,
  RowCell,
  VideoTile,
} from '@bahmni/design-system';
import { getValueType, useTranslation } from '@bahmni/services';
import React from 'react';
import {
  ExtractedObservation,
  GroupedObservation,
  ObservationsByEncounter,
} from '../models';
import { formatEncounterTitle, transformObservationToRowCell } from '../utils';

export interface ObsByEncounterProps {
  groupedData: ObservationsByEncounter[];
  title?: string;
}

const renderObservation = (
  observation: ExtractedObservation,
  index: number,
  encounterIndex: number,
  title: string,
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

  if (valueType === 'Video')
    valueToDisplay = <VideoTile id={`${value}-video`} videoSrc={value} />;

  const info = t('OBSERVATIONS_RECORDED_BY', {
    provider: rowData.provider,
  });

  const obsName = observation.display;
  const isAbnormal = observation.observationValue?.isAbnormal;
  const testIdPrefix = isAbnormal ? 'abnormal-obs' : 'obs';
  const testIdBase = title
    ? `${title}-${testIdPrefix}-${obsName}-${encounterIndex}-${index}`
    : `${testIdPrefix}-${obsName}-${encounterIndex}-${index}`;

  return (
    <RowCell
      key={`obs-${observation.id}`}
      header={rowData.header}
      value={valueToDisplay}
      info={info}
      id={testIdBase}
      testId={testIdBase}
      ariaLabel={testIdBase}
    />
  );
};

const renderGroupedObservation = (
  groupedObs: GroupedObservation,
  t: (key: string, options?: { provider?: string }) => string,
  isLatestEncounter: boolean,
  groupIndex: number,
  encounterIndex: number,
  title: string,
) => {
  return (
    <CollapsibleRowGroup
      key={`grouped-obs-${groupedObs.id}`}
      title={groupedObs.display}
      id={`grouped-obs-${groupedObs.display}-${groupIndex}`}
      open={isLatestEncounter}
    >
      {groupedObs.children.map((child, childIndex) =>
        renderObservation(child, childIndex, encounterIndex, title, t),
      )}
    </CollapsibleRowGroup>
  );
};

export const ObsByEncounter: React.FC<ObsByEncounterProps> = ({
  groupedData,
  title = '',
}) => {
  const { t } = useTranslation();
  const renderEncounter = (
    encounter: ObservationsByEncounter,
    isLatestEncounter: boolean,
    encounterIndex: number,
  ) => {
    const encounterTitle = formatEncounterTitle(encounter.encounterDetails, t);

    return (
      <CollapsibleRowGroup
        key={`encounter-${encounter.encounterId}`}
        title={encounterTitle}
        id={`encounter-${encounter.encounterId}`}
        open={isLatestEncounter}
      >
        {encounter.observations.map((obs, obsIndex) =>
          renderObservation(obs, obsIndex, encounterIndex, title, t),
        )}
        {encounter.groupedObservations.map((groupedObs, groupIndex) =>
          renderGroupedObservation(
            groupedObs,
            t,
            isLatestEncounter,
            groupIndex,
            encounterIndex,
            title,
          ),
        )}
      </CollapsibleRowGroup>
    );
  };

  return (
    <div
      id={`obs-by-encounter`}
      data-testid={`obs-by-encounter-test-id`}
      aria-label={`obs-by-encounter-aria-label`}
    >
      {groupedData.map((encounter, index) =>
        renderEncounter(encounter, index === 0, index),
      )}
    </div>
  );
};

export default ObsByEncounter;
