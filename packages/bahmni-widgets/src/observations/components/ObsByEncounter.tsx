import {
  CollapsibleRowGroup,
  ImageTile,
  RowCell,
  VideoTile,
  FileTile,
} from '@bahmni/design-system';
import { getValueType, useTranslation, formatDateTime } from '@bahmni/services';
import React from 'react';
import { ExtractedObservation, ObservationsByEncounter } from '../models';
import styles from '../styles/Observations.module.scss';
import { formatEncounterTitle, transformObservationToRowCell } from '../utils';

export interface ObsByEncounterProps {
  groupedData: ObservationsByEncounter[];
  title?: string;
  hideThumbnail?: boolean;
}

const renderObservation = (
  observation: ExtractedObservation,
  index: number,
  encounterIndex: number,
  title: string,
  t: (key: string, options?: unknown) => string,
  hideThumbnail?: boolean,
) => {
  const rowData = transformObservationToRowCell(observation, index, t);

  const value = rowData.value;
  const valueType = getValueType(value);
  let valueToDisplay: React.ReactNode = value;

  if (valueType === 'Image')
    valueToDisplay = (
      <ImageTile
        imageSrc={value}
        alt={value}
        id={`${value}-img`}
        hideThumbnail={hideThumbnail}
      />
    );

  if (valueType === 'Video')
    valueToDisplay = (
      <VideoTile
        id={`${value}-video`}
        videoSrc={value}
        hideThumbnail={hideThumbnail}
      />
    );

  if (valueType === 'PDF')
    valueToDisplay = <FileTile id={`${value}-pdf`} src={value} />;

  const header = (
    <div className={styles.wrapper}>
      <span>{rowData.header.display}</span>
      {rowData.header.referenceRange && (
        <span className={styles.secondary}>
          {rowData.header.referenceRange}
        </span>
      )}
    </div>
  );

  const primaryInfo = t('OBSERVATIONS_RECORDED_BY', {
    provider: rowData.provider,
  });
  const secondaryInfo = observation.effectiveDateTime
    ? formatDateTime(observation.effectiveDateTime, t, true).formattedResult
    : undefined;

  const info = (
    <div className={styles.wrapper}>
      <span>{primaryInfo}</span>
      {secondaryInfo && (
        <span className={styles.secondary}>{secondaryInfo}</span>
      )}
    </div>
  );

  const obsName = observation.display;
  const isAbnormal = observation.observationValue?.isAbnormal;
  const testIdPrefix = isAbnormal ? 'abnormal-obs' : 'obs';
  const testIdBase = title
    ? `${title}-${testIdPrefix}-${obsName}-${encounterIndex}-${index}`
    : `${testIdPrefix}-${obsName}-${encounterIndex}-${index}`;

  return (
    <RowCell
      key={`obs-${observation.id}`}
      header={header}
      value={valueToDisplay}
      info={info}
      id={testIdBase}
      testId={testIdBase}
      ariaLabel={testIdBase}
    />
  );
};

const renderGroupedObservation = (
  groupedObs: ExtractedObservation,
  t: (key: string, options?: unknown) => string,
  isLatestEncounter: boolean,
  groupIndex: number,
  encounterIndex: number,
  title: string,
  hideThumbnail?: boolean,
) => {
  return (
    <CollapsibleRowGroup
      key={`grouped-obs-${groupedObs.id}`}
      title={groupedObs.display}
      id={`grouped-obs-${groupedObs.display}-${groupIndex}`}
      open={isLatestEncounter}
    >
      {groupedObs.members?.map((child, childIndex) =>
        renderObservation(
          child,
          childIndex,
          encounterIndex,
          title,
          t,
          hideThumbnail,
        ),
      )}
    </CollapsibleRowGroup>
  );
};

export const ObsByEncounter: React.FC<ObsByEncounterProps> = ({
  groupedData,
  title = '',
  hideThumbnail,
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
          renderObservation(
            obs,
            obsIndex,
            encounterIndex,
            title,
            t,
            hideThumbnail,
          ),
        )}
        {encounter.groupedObservations.map((groupedObs, groupIndex) =>
          renderGroupedObservation(
            groupedObs,
            t,
            isLatestEncounter,
            groupIndex,
            encounterIndex,
            title,
            hideThumbnail,
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
