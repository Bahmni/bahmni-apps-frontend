import type { ObservationForm } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import React, { useEffect, useRef } from 'react';
import type { EncounterSessionStartContext } from '../../../events/startConsultation';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../hooks/usePinnedObservationForms';
import { useObservationFormsStore } from '../../../stores/observationFormsStore';
import ObservationForms from './ObservationForms';

interface ObservationFormsPanelProps {
  encounterSessionStartContext?: EncounterSessionStartContext;
}

const ObservationFormsPanel: React.FC<ObservationFormsPanelProps> = ({
  encounterSessionStartContext,
}) => {
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
    refetch: refetchPinnedForms,
  } = usePinnedObservationForms(allForms, {
    userUuid: user?.uuid,
    isFormsLoading: isAllFormsLoading,
  });

  const { selectedForms, addForm, removeForm, viewingForm } =
    useObservationFormsStore();

  const prevViewingFormRef = useRef(viewingForm);
  useEffect(() => {
    if (prevViewingFormRef.current && !viewingForm) {
      refetchPinnedForms();
    }
    prevViewingFormRef.current = viewingForm;
  }, [viewingForm, refetchPinnedForms]);

  const taskFormName = encounterSessionStartContext?.taskFormName as
    string | undefined;
  const directFormMode = encounterSessionStartContext?.directFormMode as
    boolean | undefined;

  useEffect(() => {
    if (taskFormName && directFormMode && !isAllFormsLoading) {
      const matchingForm = allForms.find(
        (form) => form.name.toLowerCase() === taskFormName.toLowerCase(),
      );

      if (
        matchingForm &&
        !selectedForms.some((f) => f.uuid === matchingForm.uuid)
      ) {
        addForm(matchingForm);
      }
    }
  }, [
    taskFormName,
    directFormMode,
    allForms,
    isAllFormsLoading,
    selectedForms,
    addForm,
  ]);

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
