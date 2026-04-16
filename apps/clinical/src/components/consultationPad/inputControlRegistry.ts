import type { ConsultationPad } from '../../providers/clinicalConfig/models';
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
  ImmunizationHistoryForm,
  InvestigationsForm,
  MedicationsForm,
  VaccinationForm,
} from '../forms';
import {
  createImmunizationBundleEntries,
  useImmunizationHistoryStore,
} from '../forms/immunizationHistory';
import ObservationFormsPanel from './components/ObservationFormsPanel';
import type { EncounterContext, EncounterInputControl } from './models';

const BASE_REGISTRY: EncounterInputControl[] = [
  {
    key: 'encounterDetails',
    component: EncounterDetails,
    reset: () => useEncounterDetailsStore.getState().reset(),
    validate: () =>
      useEncounterDetailsStore.getState().isEncounterDetailsFormReady,
    hasData: () => false,
    subscribe: (cb) => useEncounterDetailsStore.subscribe(cb),
  },
  {
    key: 'allergies',
    component: AllergiesForm,
    reset: () => useAllergyStore.getState().reset(),
    validate: () => useAllergyStore.getState().validateAllAllergies(),
    hasData: () => useAllergyStore.getState().selectedAllergies.length > 0,
    subscribe: (cb) => useAllergyStore.subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
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
    reset: () => useServiceRequestStore.getState().reset(),
    validate: () => true,
    hasData: () =>
      useServiceRequestStore.getState().selectedServiceRequests.size > 0,
    subscribe: (cb) => useServiceRequestStore.subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
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
    reset: () => useConditionsAndDiagnosesStore.getState().reset(),
    validate: () => useConditionsAndDiagnosesStore.getState().validate(),
    hasData: () => {
      const { selectedDiagnoses, selectedConditions } =
        useConditionsAndDiagnosesStore.getState();
      return selectedDiagnoses.length > 0 || selectedConditions.length > 0;
    },
    subscribe: (cb) => useConditionsAndDiagnosesStore.subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) => {
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
    reset: () => useMedicationStore.getState().reset(),
    validate: () => useMedicationStore.getState().validateAllMedications(),
    hasData: () => useMedicationStore.getState().selectedMedications.length > 0,
    subscribe: (cb) => useMedicationStore.subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
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
    reset: () => useVaccinationStore.getState().reset(),
    validate: () => useVaccinationStore.getState().validateAllVaccinations(),
    hasData: () =>
      useVaccinationStore.getState().selectedVaccinations.length > 0,
    subscribe: (cb) => useVaccinationStore.subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
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
    key: 'immunizationHistory',
    component: ImmunizationHistoryForm,
    encounterTypes: ['Immunization'],
    reset: () => useImmunizationHistoryStore.getState().reset(),
    validate: () => useImmunizationHistoryStore.getState().validateAll(),
    hasData: () =>
      useImmunizationHistoryStore.getState().selectedImmunizations.length > 0,
    subscribe: (cb) => useImmunizationHistoryStore.subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
      createImmunizationBundleEntries({
        selectedImmunizations:
          useImmunizationHistoryStore.getState().selectedImmunizations,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
      }),
  },
  {
    key: 'observationForms',
    component: ObservationFormsPanel,
    reset: () => useObservationFormsStore.getState().reset(),
    validate: () => useObservationFormsStore.getState().validate(),
    hasData: () => useObservationFormsStore.getState().selectedForms.length > 0,
    subscribe: (cb) => useObservationFormsStore.subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
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

export function loadEncounterInputControls(
  config: ConsultationPad | undefined,
): EncounterInputControl[] {
  return BASE_REGISTRY.flatMap((entry) => {
    const configKey = entry.key as keyof ConsultationPad;
    // TODO: remove cast once non-InputControl fields (allergyConceptMap,
    // statDurationInMilliseconds) are extracted out of ConsultationPad
    const formConfig = config?.[configKey] as
      | { encounterTypes?: string[]; privileges?: string[] }
      | undefined;
    if (!formConfig) return [];
    return [
      {
        ...entry,
        encounterTypes:
          entry.key === 'encounterDetails' || !formConfig.encounterTypes?.length
            ? undefined
            : formConfig.encounterTypes,
        privilege: formConfig.privileges?.length
          ? formConfig.privileges
          : undefined,
      },
    ];
  });
}
