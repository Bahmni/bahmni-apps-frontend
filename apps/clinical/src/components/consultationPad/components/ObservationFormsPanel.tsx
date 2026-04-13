import type { ObservationForm } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import React from 'react';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../hooks/usePinnedObservationForms';
import { useObservationFormsStore } from '../../../stores/observationFormsStore';
import ObservationForms from '../../forms/observations/ObservationForms';

const ObservationFormsPanel: React.FC = () => {
  const { user } = useActivePractitioner();
  const { episodeOfCare } = useClinicalAppData();
  const episodeOfCareUuids = episodeOfCare.map((eoc) => eoc.uuid);

  const {
    forms: allForms,
    isLoading: isAllFormsLoading,
    error: observationFormsError,
  } = useObservationFormsSearch('', episodeOfCareUuids);

  const {
    pinnedForms,
    updatePinnedForms,
    isLoading: isPinnedFormsLoading,
  } = usePinnedObservationForms(allForms, {
    userUuid: user?.uuid,
    isFormsLoading: isAllFormsLoading,
  });

  const { selectedForms, addForm, removeForm } = useObservationFormsStore();

  const handleFormSelect = (form: ObservationForm) => {
    addForm(form);
  };

  return (
    <ObservationForms
      onFormSelect={handleFormSelect}
      selectedForms={selectedForms}
      onRemoveForm={removeForm}
      pinnedForms={pinnedForms}
      updatePinnedForms={updatePinnedForms}
      isPinnedFormsLoading={isPinnedFormsLoading}
      allForms={allForms}
      isAllFormsLoading={isAllFormsLoading}
      observationFormsError={observationFormsError}
    />
  );
};

export default ObservationFormsPanel;
