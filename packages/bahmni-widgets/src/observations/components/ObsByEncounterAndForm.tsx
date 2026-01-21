import { CollapsibleRowGroup } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { ObservationsByEncounterAndForm } from '../models';
import { formatEncounterTitle } from '../utils';
import { renderObservation, renderGroupedObservation } from './renderUtils';

export interface ObsByEncounterAndFormProps {
  groupedData: ObservationsByEncounterAndForm[];
}

export const ObsByEncounterAndForm: React.FC<ObsByEncounterAndFormProps> = ({
  groupedData,
}) => {
  const { t } = useTranslation();
  const renderFormGroup = (
    formGroup: ObservationsByEncounterAndForm['formGroups'][0],
    encounterIndex: number,
    formIndex: number,
  ) => {
    return (
      <CollapsibleRowGroup
        key={`form-${encounterIndex}-${formIndex}`}
        title={formGroup.formName}
        id={`form-${encounterIndex}-${formIndex}`}
      >
        {formGroup.observations.map((obs, obsIndex) =>
          renderObservation(obs, obsIndex, t),
        )}
        {formGroup.groupedObservations.map((groupedObs) =>
          renderGroupedObservation(groupedObs, t),
        )}
      </CollapsibleRowGroup>
    );
  };

  const renderEncounter = (
    encounter: ObservationsByEncounterAndForm,
    index: number,
  ) => {
    const encounterTitle = formatEncounterTitle(encounter.encounterDetails, t);

    return (
      <CollapsibleRowGroup
        key={`encounter-${encounter.encounterId}`}
        title={encounterTitle}
        id={`encounter-${encounter.encounterId}`}
      >
        {encounter.formGroups.map((formGroup, formIndex) =>
          renderFormGroup(formGroup, index, formIndex),
        )}
      </CollapsibleRowGroup>
    );
  };

  return (
    <div>
      {groupedData.map((encounter, index) => renderEncounter(encounter, index))}
    </div>
  );
};

export default ObsByEncounterAndForm;
