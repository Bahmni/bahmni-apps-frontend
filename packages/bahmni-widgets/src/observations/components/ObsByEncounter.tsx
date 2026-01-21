import { CollapsibleRowGroup } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { ObservationsByEncounter } from '../models';
import { formatEncounterTitle } from '../utils';
import { renderObservation, renderGroupedObservation } from './renderUtils';

export interface ObsByEncounterProps {
  groupedData: ObservationsByEncounter[];
}

export const ObsByEncounter: React.FC<ObsByEncounterProps> = ({
  groupedData,
}) => {
  const { t } = useTranslation();
  const renderEncounter = (encounter: ObservationsByEncounter) => {
    const encounterTitle = formatEncounterTitle(encounter.encounterDetails, t);

    return (
      <CollapsibleRowGroup
        key={`encounter-${encounter.encounterId}`}
        title={encounterTitle}
        id={`encounter-${encounter.encounterId}`}
      >
        {encounter.observations.map((obs, obsIndex) =>
          renderObservation(obs, obsIndex, t),
        )}
        {encounter.groupedObservations.map((groupedObs) =>
          renderGroupedObservation(groupedObs, t),
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
      {groupedData.map((encounter) => renderEncounter(encounter))}
    </div>
  );
};

export default ObsByEncounter;
