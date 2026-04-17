import { CONSULTATION_PAD_PRIVILEGES } from '@bahmni/widgets';
import {
  createAllergiesBundleEntries,
  createConditionsBundleEntries,
  createDiagnosisBundleEntries,
  createMedicationRequestEntries,
  createObservationBundleEntries,
  createServiceRequestBundleEntries,
} from '../../services/consultationBundleService';
import {
  useAllergyStore,
  useConditionsAndDiagnosesStore,
  useEncounterDetailsStore,
  useMedicationStore,
  useServiceRequestStore,
  useVaccinationStore,
} from '../../stores';
import { useObservationFormsStore } from '../../stores/observationFormsStore';
import {
  AllergiesForm,
  ConditionsAndDiagnoses,
  EncounterDetails,
  InvestigationsForm,
  MedicationsForm,
  VaccinationForm,
} from '../forms';
import ObservationFormsPanel from './components/ObservationFormsPanel';
import type { BundleContext, InputControlRegistry } from './models';

export const INPUT_CONTROL_REGISTRY: InputControlRegistry[] = [
  {
    key: 'encounterDetails',
    component: EncounterDetails,
    privilege: CONSULTATION_PAD_PRIVILEGES.ENCOUNTER,
    reset: () => useEncounterDetailsStore.getState().reset(),
    validate: () =>
      useEncounterDetailsStore.getState().isEncounterDetailsFormReady,
    hasData: () => false,
    subscribe: (cb) => useEncounterDetailsStore.subscribe(cb),
  },
  {
    key: 'allergies',
    component: AllergiesForm,
    encounterTypes: ['Consultation'],
    privilege: CONSULTATION_PAD_PRIVILEGES.ALLERGIES,
    reset: () => useAllergyStore.getState().reset(),
    validate: () => useAllergyStore.getState().validateAllAllergies(),
    hasData: () => useAllergyStore.getState().selectedAllergies.length > 0,
    subscribe: (cb) => useAllergyStore.subscribe(cb),
    createBundleEntries: (ctx: BundleContext) =>
      createAllergiesBundleEntries({
        selectedAllergies: useAllergyStore.getState().selectedAllergies,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
      }),
  },
  {
    key: 'investigations',
    component: InvestigationsForm,
    encounterTypes: ['Consultation'],
    privilege: CONSULTATION_PAD_PRIVILEGES.INVESTIGATIONS,
    reset: () => useServiceRequestStore.getState().reset(),
    validate: () => true,
    hasData: () =>
      useServiceRequestStore.getState().selectedServiceRequests.size > 0,
    subscribe: (cb) => useServiceRequestStore.subscribe(cb),
    createBundleEntries: (ctx: BundleContext) =>
      createServiceRequestBundleEntries({
        selectedServiceRequests:
          useServiceRequestStore.getState().selectedServiceRequests,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
      }),
  },
  {
    key: 'conditionsAndDiagnoses',
    component: ConditionsAndDiagnoses,
    encounterTypes: ['Consultation'],
    privilege: CONSULTATION_PAD_PRIVILEGES.CONDITIONS_AND_DIAGNOSES,
    reset: () => useConditionsAndDiagnosesStore.getState().reset(),
    validate: () => useConditionsAndDiagnosesStore.getState().validate(),
    hasData: () => {
      const { selectedDiagnoses, selectedConditions } =
        useConditionsAndDiagnosesStore.getState();
      return selectedDiagnoses.length > 0 || selectedConditions.length > 0;
    },
    subscribe: (cb) => useConditionsAndDiagnosesStore.subscribe(cb),
    createBundleEntries: (ctx: BundleContext) => {
      const { selectedDiagnoses, selectedConditions } =
        useConditionsAndDiagnosesStore.getState();
      return [
        ...createDiagnosisBundleEntries({
          selectedDiagnoses,
          encounterSubject: ctx.encounterSubject,
          encounterReference: ctx.encounterReference,
          practitionerUUID: ctx.practitionerUUID,
          consultationDate: ctx.consultationDate,
        }),
        ...createConditionsBundleEntries({
          selectedConditions,
          encounterSubject: ctx.encounterSubject,
          encounterReference: ctx.encounterReference,
          practitionerUUID: ctx.practitionerUUID,
          consultationDate: ctx.consultationDate,
        }),
      ];
    },
  },
  {
    key: 'medications',
    component: MedicationsForm,
    encounterTypes: ['Consultation'],
    privilege: CONSULTATION_PAD_PRIVILEGES.MEDICATIONS,
    reset: () => useMedicationStore.getState().reset(),
    validate: () => useMedicationStore.getState().validateAllMedications(),
    hasData: () => useMedicationStore.getState().selectedMedications.length > 0,
    subscribe: (cb) => useMedicationStore.subscribe(cb),
    createBundleEntries: (ctx: BundleContext) =>
      createMedicationRequestEntries({
        selectedMedications: useMedicationStore.getState().selectedMedications,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
        statDurationInMilliseconds: ctx.statDurationInMilliseconds,
      }),
  },
  {
    key: 'vaccinations',
    component: VaccinationForm,
    encounterTypes: ['Consultation'],
    privilege: CONSULTATION_PAD_PRIVILEGES.VACCINATIONS,
    reset: () => useVaccinationStore.getState().reset(),
    validate: () => useVaccinationStore.getState().validateAllVaccinations(),
    hasData: () =>
      useVaccinationStore.getState().selectedVaccinations.length > 0,
    subscribe: (cb) => useVaccinationStore.subscribe(cb),
    createBundleEntries: (ctx: BundleContext) =>
      createMedicationRequestEntries({
        selectedMedications:
          useVaccinationStore.getState().selectedVaccinations,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
        statDurationInMilliseconds: ctx.statDurationInMilliseconds,
      }),
  },
  {
    key: 'observationForms',
    component: ObservationFormsPanel,
    encounterTypes: ['Consultation'],
    privilege: CONSULTATION_PAD_PRIVILEGES.OBSERVATIONS,
    reset: () => useObservationFormsStore.getState().reset(),
    validate: () => useObservationFormsStore.getState().validate(),
    hasData: () => useObservationFormsStore.getState().selectedForms.length > 0,
    subscribe: (cb) => useObservationFormsStore.subscribe(cb),
    createBundleEntries: (ctx: BundleContext) =>
      createObservationBundleEntries({
        observationFormsData: useObservationFormsStore
          .getState()
          .getObservationFormsData(),
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
      }),
  },
];
