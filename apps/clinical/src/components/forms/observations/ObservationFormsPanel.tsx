import { getObservationsFromFhir } from '@bahmni/form2-controls';
import type { ObservationForm, Form2Observation } from '@bahmni/services';
import {
  getObservationsBundleByEncounterUuid,
  getPatientFormData,
  fetchFormUuidByObservationDate,
} from '@bahmni/services';
import { useActivePractitioner, usePatientUUID } from '@bahmni/widgets';
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
  const patientUUID = usePatientUUID();
  const { episodeOfCare } = useClinicalAppData();
  const episodeOfCareUuids = episodeOfCare.map((eoc) => eoc.uuid);

  const taskFormName = encounterSessionStartContext?.taskFormName as
    | string
    | undefined;
  const directFormMode = encounterSessionStartContext?.directFormMode as
    | boolean
    | undefined;
  const isTaskDirectMode = !!(taskFormName && directFormMode);

  const {
    forms: allForms,
    isLoading: isAllFormsLoading,
    error: observationFormsError,
  } = useObservationFormsSearch(
    '',
    isTaskDirectMode ? undefined : episodeOfCareUuids,
  );

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

  const editFormName = encounterSessionStartContext?.editFormName;
  const editEncounterUuid = encounterSessionStartContext?.editEncounterUuid;
  const isEditObservationFormsMode =
    encounterSessionStartContext?.editOnly === 'observationForms';

  useEffect(() => {
    if (taskFormName && directFormMode && !isAllFormsLoading && !editFormName) {
      useObservationFormsStore.getState().reset();
      const matchingForm = allForms.find(
        (form) => form.name.toLowerCase() === taskFormName.toLowerCase(),
      );

      if (matchingForm) {
        addForm(matchingForm);
      }
    }
  }, [
    taskFormName,
    directFormMode,
    allForms,
    isAllFormsLoading,
    editFormName,
    addForm,
  ]);

  // useObservationFormsStore is a session-wide singleton, not scoped to a single
  // edit session. Without this, `selectedForms` from a previous edit (or from the
  // regular add-form flow) can already contain the next form's uuid, causing the
  // guard below to skip fetching/populating observations for it entirely — the
  // form opens but never prepopulates. Reset once per distinct (encounter, form)
  // pair so each edit session starts from a clean store.
  const editSessionKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isEditObservationFormsMode || !editFormName || !editEncounterUuid) {
      return;
    }
    const sessionKey = `${editEncounterUuid}:${editFormName}`;
    if (editSessionKeyRef.current === sessionKey) {
      return;
    }
    editSessionKeyRef.current = sessionKey;
    useObservationFormsStore.getState().reset();
  }, [isEditObservationFormsMode, editFormName, editEncounterUuid]);

  // Latches once the fetch for a given (encounter, form) session actually
  // starts. Guarding on `selectedForms` instead (as before) breaks as soon as
  // `savedFormUuid` differs from `matchingForm.uuid` (editing an encounter
  // saved under an older form version): the form gets added to the store
  // keyed by `savedFormUuid`, but the guard kept checking `matchingForm.uuid`,
  // so it never matched and the entire fetch chain fired a second time on the
  // next `selectedForms`-triggered re-render. Keying on the session itself
  // (not on what ends up in the store) avoids that race entirely.
  const editFetchSessionRef = useRef<string | null>(null);
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

    const sessionKey = `${editEncounterUuid}:${editFormName}`;
    if (editFetchSessionRef.current === sessionKey) return;
    editFetchSessionRef.current = sessionKey;

    getObservationsBundleByEncounterUuid(editEncounterUuid)
      .then(async (bundle) => {
        // getObservationsBundleByEncounterUuid fetches the WHOLE encounter's
        // observations — an encounter can carry multiple form submissions
        // (e.g. Vitals + History and Examination), all mixed together in one
        // bundle. Keep only this form's own top-level observations (its
        // formFieldPath is "<formName>.<version>/..."), otherwise a stray
        // observation from a different form can end up first in the array and
        // silently corrupt this form's version/prepopulation matching.
        const form2Observations = getObservationsFromFhir(bundle).filter(
          (obs) =>
            obs.formFieldPath
              ?.toLowerCase()
              .startsWith(`${editFormName.toLowerCase()}.`),
        );

        // Primary: read formUuid directly from the patient forms API —
        // same approach as the old Bahmni Angular frontend (observationForm.formUuid).
        // The backend stores the exact UUID of the form version used when the
        // encounter was saved, so this is the authoritative identifier.
        //
        // Fallback: if formUuid is absent (older backend), use the observation's
        // server-assigned `issued` timestamp to find the most recently published
        // form version that predates the save time.
        let formToOpen = matchingForm;
        let savedFormUuid: string | null = null;

        if (patientUUID) {
          const patientForms = await getPatientFormData(patientUUID).catch(
            () => [],
          );
          // An encounter can carry multiple form submissions (e.g. Vitals +
          // History and Examination saved to the same encounter) — must also
          // match on formName, or this always resolves to whichever form
          // submission happens to be first for the encounter.
          const encounterFormData = patientForms.find(
            (d) =>
              d.encounterUuid === editEncounterUuid &&
              d.formName.toLowerCase() === editFormName.toLowerCase(),
          );
          // Primary: formUuid from patient forms API (same as old Bahmni Angular).
          // Fallback: version-string or date-based lookup using formVersion and
          // encounterDateTime (stable clinical date, unlike Observation.issued which
          // updates on every re-edit).
          savedFormUuid =
            encounterFormData?.formUuid ??
            (await fetchFormUuidByObservationDate(
              editFormName,
              encounterFormData?.formVersion,
              encounterFormData?.encounterDateTime,
            ).catch(() => null));
        }

        if (savedFormUuid && savedFormUuid !== matchingForm.uuid) {
          formToOpen = { ...matchingForm, uuid: savedFormUuid };
        }

        if (form2Observations.length > 0) {
          // Build uuid → status map from the raw FHIR bundle so PUT requests can
          // echo back the same status value (OpenMRS rejects status changes and
          // also errors when status is absent on PUT).
          const statusByUuid = buildStatusMap(bundle as Bundle);
          const observationsWithStatus = enrichObservationsWithStatus(
            form2Observations as Form2Observation[],
            statusByUuid,
          );

          // Pre-populate formsData directly — bypasses the selectedForms guard in
          // updateFormData because the form is not yet in selectedForms at this point.
          useObservationFormsStore.setState((state) => ({
            formsData: {
              ...state.formsData,
              [formToOpen.uuid]: {
                formUuid: formToOpen.uuid,
                formName: formToOpen.name,
                observations: observationsWithStatus,
                timestamp: Date.now(),
              },
            },
          }));
        }

        // Open the form AFTER data is stored — ObservationFormsContainer mounts
        // with existingObservations already populated.
        addForm(formToOpen);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[EditMode] FHIR fetch FAILED for', editFormName, err);
        // Fetch failed — open the form blank so the user can re-enter data.
        addForm(matchingForm);
      });
  }, [
    isEditObservationFormsMode,
    editFormName,
    editEncounterUuid,
    isAllFormsLoading,
    allForms,
    addForm,
    patientUUID,
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
