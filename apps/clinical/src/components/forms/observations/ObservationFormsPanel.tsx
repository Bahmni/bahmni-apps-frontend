import { getObservationsFromFhir } from '@bahmni/form2-controls';
import type { ObservationForm, Form2Observation } from '@bahmni/services';
import { getObservationsBundleByEncounterUuid } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import type { Bundle } from 'fhir/r4';
import React, { useEffect, useRef } from 'react';
import type { EncounterSessionStartContext } from '../../../events/startConsultation';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../hooks/usePinnedObservationForms';
import { useSubmittedEncounterForms } from '../../../hooks/useSubmittedEncounterForms';
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

  const submittedFormUuids = useSubmittedEncounterForms(allForms);

  const prevViewingFormRef = useRef(viewingForm);
  useEffect(() => {
    if (prevViewingFormRef.current && !viewingForm) {
      refetchPinnedForms();
    }
    prevViewingFormRef.current = viewingForm;
  }, [viewingForm, refetchPinnedForms]);

  const taskFormName = encounterSessionStartContext?.taskFormName as
    | string
    | undefined;
  const directFormMode = encounterSessionStartContext?.directFormMode as
    | boolean
    | undefined;

  useEffect(() => {
    if (taskFormName && directFormMode && !isAllFormsLoading) {
      useObservationFormsStore.getState().reset();
      const matchingForm = allForms.find(
        (form) => form.name.toLowerCase() === taskFormName.toLowerCase(),
      );

      if (matchingForm) {
        addForm(matchingForm);
      }
    }
  }, [taskFormName, directFormMode, allForms, isAllFormsLoading, addForm]);

  const editFormName = encounterSessionStartContext?.editFormName;
  const editEncounterUuid = encounterSessionStartContext?.editEncounterUuid;
  const isEditObservationFormsMode =
    encounterSessionStartContext?.editOnly === 'observationForms';

  useEffect(() => {
    if (
      !isEditObservationFormsMode ||
      !editFormName ||
      !editEncounterUuid ||
      isAllFormsLoading
    )
      return;

    const matchingForm = allForms.find(
      (form) => form.name.toLowerCase() === editFormName.toLowerCase(),
    );
    if (!matchingForm) return;
    if (selectedForms.some((f) => f.uuid === matchingForm.uuid)) return;

    // Fetch observations BEFORE opening the form so CarbonContainer mounts
    // with data already in the store (it does not re-initialize on prop change).
    getObservationsBundleByEncounterUuid(editEncounterUuid)
      .then((bundle) => {
        const form2Observations = getObservationsFromFhir(bundle);

        if (form2Observations.length > 0) {
          // Build uuid → status map from the raw FHIR bundle so PUT requests can
          // echo back the same status value (OpenMRS rejects status changes and
          // also errors when status is absent on PUT).
          const statusByUuid = buildStatusMap(bundle as Bundle);
          const enrichedObservations = enrichObservationsWithStatus(
            form2Observations as Form2Observation[],
            statusByUuid,
          );

          // Pre-populate formsData directly — bypasses the selectedForms guard in
          // updateFormData because the form is not yet in selectedForms at this point.
          useObservationFormsStore.setState((state) => ({
            formsData: {
              ...state.formsData,
              [matchingForm.uuid]: {
                formUuid: matchingForm.uuid,
                formName: matchingForm.name,
                observations: enrichedObservations,
                timestamp: Date.now(),
              },
            },
          }));
        }

        // Open the form AFTER data is stored — ObservationFormsContainer mounts
        // with existingObservations already populated.
        addForm(matchingForm);
      })
      .catch(() => {
        // Fetch failed — open the form blank so the user can re-enter data.
        addForm(matchingForm);
      });
  }, [
    isEditObservationFormsMode,
    editFormName,
    editEncounterUuid,
    isAllFormsLoading,
    allForms,
    selectedForms,
    addForm,
  ]);

  // In edit mode the add-form search panel must never appear.
  // Return null while the FHIR fetch is in flight; once addForm() fires,
  // ConsultationPad switches to ObservationFormsContainer directly.
  if (isEditObservationFormsMode) return null;

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
      submittedFormUuids={submittedFormUuids}
    />
  );
};

export default ObservationFormsPanel;

/** Build a map of observation uuid → FHIR status from a raw FHIR bundle. */
function buildStatusMap(bundle: Bundle): Map<string, string> {
  const map = new Map<string, string>();
  bundle.entry?.forEach((entry) => {
    const resource = entry.resource;
    if (
      resource?.resourceType === 'Observation' &&
      resource.id &&
      (resource as { status?: string }).status
    ) {
      map.set(resource.id, (resource as { status: string }).status);
    }
  });
  return map;
}

/**
 * Recursively copies the FHIR status from the status map into each
 * Form2Observation that has a matching uuid.  This lets PUT requests
 * echo back exactly what OpenMRS currently has stored, avoiding the
 * "Editing the fields [status] on Obs is not allowed" error.
 */
function enrichObservationsWithStatus(
  observations: Form2Observation[],
  statusByUuid: Map<string, string>,
): Form2Observation[] {
  return observations.map((obs) => {
    const enriched: Form2Observation = { ...obs };
    if (obs.uuid && statusByUuid.has(obs.uuid)) {
      enriched.status = statusByUuid.get(obs.uuid);
    }
    if (obs.groupMembers) {
      enriched.groupMembers = enrichObservationsWithStatus(
        obs.groupMembers,
        statusByUuid,
      );
    }
    return enriched;
  });
}
