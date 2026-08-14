import { getObservationsFromFhir } from '@bahmni/form2-controls';
import type { ObservationForm, Form2Observation } from '@bahmni/services';
import {
  getObservationsBundleByEncounterUuid,
  getPatientFormData,
  fetchFormUuidByObservationDate,
} from '@bahmni/services';
import { useActivePractitioner, usePatientUUID } from '@bahmni/widgets';
import type { Bundle, Observation, Reference } from 'fhir/r4';
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

interface ObservationMetadata {
  status?: string;
  basedOn?: Reference;
}

const ObservationFormsPanel: React.FC<ObservationFormsPanelProps> = ({
  encounterSessionStartContext,
}) => {
  const { user } = useActivePractitioner();
  const patientUUID = usePatientUUID();
  const { episodeOfCare } = useClinicalAppData();
  const episodeOfCareUuids = episodeOfCare.map((eoc) => eoc.uuid);

  const formName = encounterSessionStartContext?.formName as string | undefined;
  const directFormMode = encounterSessionStartContext?.directFormMode as
    | boolean
    | undefined;
  const editEncounterUuid = encounterSessionStartContext?.editEncounterUuid;
  const isEditObservationFormsMode =
    encounterSessionStartContext?.editOnly === 'observationForms';
  const isEditMode = isEditObservationFormsMode && !!editEncounterUuid;
  const isTaskDirectMode = !!(formName && directFormMode);

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

  useEffect(() => {
    if (formName && directFormMode && !isAllFormsLoading && !isEditMode) {
      useObservationFormsStore.getState().reset();
      const matchingForm = allForms.find(
        (form) => form.name.toLowerCase() === formName.toLowerCase(),
      );

      if (matchingForm) {
        addForm(matchingForm);
      }
    }
  }, [
    formName,
    directFormMode,
    allForms,
    isAllFormsLoading,
    isEditMode,
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
    if (!isEditObservationFormsMode || !formName || !editEncounterUuid) {
      return;
    }
    const sessionKey = `${editEncounterUuid}:${formName}`;
    if (editSessionKeyRef.current === sessionKey) {
      return;
    }
    editSessionKeyRef.current = sessionKey;
    useObservationFormsStore.getState().reset();
  }, [isEditObservationFormsMode, formName, editEncounterUuid]);

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
      !formName ||
      !editEncounterUuid ||
      isAllFormsLoading
    )
      return;

    const matchingForm = allForms.find(
      (form) => form.name.toLowerCase() === formName.toLowerCase(),
    );
    if (!matchingForm) return;

    const sessionKey = `${editEncounterUuid}:${formName}`;
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
              .startsWith(`${formName.toLowerCase()}.`),
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
              d.formName.toLowerCase() === formName.toLowerCase(),
          );
          // Primary: formUuid from patient forms API (same as old Bahmni Angular).
          // Fallback: version-string or date-based lookup using formVersion and
          // encounterDateTime (stable clinical date, unlike Observation.issued which
          // updates on every re-edit).
          savedFormUuid =
            encounterFormData?.formUuid ??
            (await fetchFormUuidByObservationDate(
              formName,
              encounterFormData?.formVersion,
              encounterFormData?.encounterDateTime,
            ).catch(() => null));
        }

        if (savedFormUuid && savedFormUuid !== matchingForm.uuid) {
          formToOpen = { ...matchingForm, uuid: savedFormUuid };
        }

        if (form2Observations.length > 0) {
          // Snapshot uuid → { status, basedOn } from the raw FHIR bundle so PUT
          // requests can echo back exactly what OpenMRS has stored:
          // - status: OpenMRS rejects PUT if status is missing or differs.
          // - basedOn: OpenMRS strips the ServiceRequest linkage if the PUT payload
          //   omits it, silently losing the task↔obs relationship.
          const metadataByUuid = buildObservationMetadataMap(bundle as Bundle);
          const observationsWithMetadata = enrichObservationsWithMetadata(
            form2Observations as Form2Observation[],
            metadataByUuid,
          );

          // Pre-populate formsData directly — bypasses the selectedForms guard in
          // updateFormData because the form is not yet in selectedForms at this point.
          useObservationFormsStore.setState((state) => ({
            formsData: {
              ...state.formsData,
              [formToOpen.uuid]: {
                formUuid: formToOpen.uuid,
                formName: formToOpen.name,
                observations: observationsWithMetadata,
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
        console.error('[EditMode] FHIR fetch FAILED for', formName, err);
        // Fetch failed — open the form blank so the user can re-enter data.
        addForm(matchingForm);
      });
  }, [
    isEditObservationFormsMode,
    formName,
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

/** Extracts server-echo fields (status, basedOn) from a raw FHIR Observation bundle, keyed by uuid. */
function buildObservationMetadataMap(
  bundle: Bundle,
): Map<string, ObservationMetadata> {
  const map = new Map<string, ObservationMetadata>();
  bundle.entry?.forEach((entry) => {
    const resource = entry.resource;
    if (resource?.resourceType !== 'Observation' || !resource.id) return;
    const obs = resource as Observation;
    const meta: ObservationMetadata = {};
    if (obs.status) meta.status = obs.status;
    if (obs.basedOn?.[0]) meta.basedOn = obs.basedOn[0];
    if (meta.status || meta.basedOn) map.set(resource.id, meta);
  });
  return map;
}

/** Recursively copies status + basedOn onto Form2Observations with a matching uuid.
 *  status → OpenMRS rejects PUT without exact status ("Editing the fields [status] on Obs is not allowed").
 *  basedOn → OpenMRS strips the ServiceRequest linkage if PUT omits it. */
function enrichObservationsWithMetadata(
  observations: Form2Observation[],
  metadataByUuid: Map<string, ObservationMetadata>,
): Form2Observation[] {
  return observations.map((obs) => {
    const enriched: Form2Observation = { ...obs };
    if (obs.uuid) {
      const meta = metadataByUuid.get(obs.uuid);
      if (meta) {
        if (meta.status) enriched.status = meta.status;
        if (meta.basedOn) enriched.basedOn = meta.basedOn;
      }
    }
    if (obs.groupMembers) {
      enriched.groupMembers = enrichObservationsWithMetadata(
        obs.groupMembers,
        metadataByUuid,
      );
    }
    return enriched;
  });
}
