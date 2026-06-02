import {
  generateUUID,
  MedicationFrequency as Frequency,
} from '@bahmni/services';
import {
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { Concept } from '../../../models/encounterConcepts';
import {
  DurationUnitOption,
  MedicationInputEntry,
} from '../../../models/medication';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import { extractDoseForm } from '../../../utils/fhir/medicationUtilities';
import { MEDICATIONS_INPUT_CONTROL_KEY } from './constants';
import { MedicationRequestStoreKey } from './models';
import { findAttr } from './utils';

export interface MedicationRequestState {
  selectedMedicationRequests: MedicationInputEntry[];
  attributes: InputControlAttributes[] | undefined;
  originalEditIds: string[];
  originalEditSnapshots: Map<string, MedicationInputEntry>;
  pendingFhirEdits: FhirMedicationRequest[];
  setAttributes: (attrs: InputControlAttributes[]) => void;
  addItem: (medication: Medication, displayName: string) => void;
  removeItem: (id: string) => void;
  updateDosage: (id: string, dosage: number) => void;
  updateDosageUnit: (id: string, unit: Concept) => void;
  updateFrequency: (id: string, frequency: Frequency | null) => void;
  updateRoute: (id: string, route: Concept) => void;
  updateDuration: (id: string, duration: number) => void;
  updateDurationUnit: (id: string, unit: DurationUnitOption | null) => void;
  updateInstruction: (id: string, instruction: Concept) => void;
  updateIsPRN: (id: string, isPRN: boolean) => void;
  updateIsSTAT: (id: string, isSTAT: boolean) => void;
  updateStartDate: (id: string, date: Date) => void;
  updateDispenseQuantity: (id: string, quantity: number) => void;
  updateDispenseUnit: (id: string, unit: Concept) => void;
  updateNote: (id: string, note: string) => void;
  setPendingFhirEdits: (resources: FhirMedicationRequest[]) => void;
  loadMedicationsForEdit: (entries: MedicationInputEntry[]) => void;
  hasEditChanges: () => boolean;
  validateAll: () => boolean;
  reset: () => void;
  getState: () => MedicationRequestState;
}

type MedicationRequestStoreApi = ReturnType<
  typeof createMedicationRequestStore
>;

const storeRegistry = new Map<
  MedicationRequestStoreKey,
  MedicationRequestStoreApi
>();

function applyDosageUpdate(
  item: MedicationInputEntry,
  dosage: number,
): MedicationInputEntry {
  const updated = { ...item, dosage };
  if (item.hasBeenValidated && dosage > 0) {
    updated.errors = { ...item.errors };
    delete updated.errors.dosage;
  }
  return updated;
}

function applyDosageUnitUpdate(
  item: MedicationInputEntry,
  unit: Concept,
): MedicationInputEntry {
  const updated = { ...item, dosageUnit: unit };
  if (item.hasBeenValidated && unit) {
    updated.errors = { ...item.errors };
    delete updated.errors.dosageUnit;
  }
  return updated;
}

function applyFrequencyUpdate(
  item: MedicationInputEntry,
  frequency: Frequency | null,
): MedicationInputEntry {
  const updated = { ...item, frequency };
  if (item.hasBeenValidated && frequency) {
    updated.errors = { ...item.errors };
    delete updated.errors.frequency;
  }
  return updated;
}

function applyRouteUpdate(
  item: MedicationInputEntry,
  route: Concept,
): MedicationInputEntry {
  const updated = { ...item, route };
  if (item.hasBeenValidated && route) {
    updated.errors = { ...item.errors };
    delete updated.errors.route;
  }
  return updated;
}

function applyDurationUpdate(
  item: MedicationInputEntry,
  duration: number,
): MedicationInputEntry {
  const updated = { ...item, duration };
  if (item.hasBeenValidated && duration > 0) {
    updated.errors = { ...item.errors };
    delete updated.errors.duration;
  }
  return updated;
}

function applyDurationUnitUpdate(
  item: MedicationInputEntry,
  unit: DurationUnitOption | null,
): MedicationInputEntry {
  const updated = { ...item, durationUnit: unit };
  if (item.hasBeenValidated) {
    updated.errors = { ...item.errors };
    delete updated.errors.durationUnit;
  }
  return updated;
}

function applyIsSTATUpdate(
  item: MedicationInputEntry,
  isSTAT: boolean,
): MedicationInputEntry {
  const updated = { ...item, isSTAT };
  if (item.hasBeenValidated && isSTAT) {
    updated.errors = { ...item.errors };
    delete updated.errors.stat;
    delete updated.errors.duration;
    delete updated.errors.durationUnit;
  }
  return updated;
}

function applyInstructionUpdate(
  item: MedicationInputEntry,
  instruction: Concept,
): MedicationInputEntry {
  const updated = { ...item, instruction };
  if (item.hasBeenValidated && instruction) {
    updated.errors = { ...item.errors };
    delete updated.errors.instruction;
  }
  return updated;
}

function applyNoteUpdate(
  item: MedicationInputEntry,
  note: string,
): MedicationInputEntry {
  const updated = { ...item, note };
  if (item.hasBeenValidated && note.trim()) {
    updated.errors = { ...item.errors };
    delete updated.errors.note;
  }
  return updated;
}

function applyStartDateUpdate(
  item: MedicationInputEntry,
  date: Date,
): MedicationInputEntry {
  const updated = { ...item, startDate: date };
  if (item.hasBeenValidated && date) {
    updated.errors = { ...item.errors };
    delete updated.errors.startDate;
  }
  return updated;
}

function applyIsPRNUpdate(
  item: MedicationInputEntry,
  isPRN: boolean,
): MedicationInputEntry {
  const updated = { ...item, isPRN };
  if (item.hasBeenValidated) {
    updated.errors = { ...item.errors };
    if (isPRN) delete updated.errors.prn;
  }
  return updated;
}

function applyDispenseQuantityUpdate(
  item: MedicationInputEntry,
  quantity: number,
): MedicationInputEntry {
  const updated = { ...item, dispenseQuantity: quantity };
  if (item.hasBeenValidated && quantity >= 0) {
    updated.errors = { ...item.errors };
    delete updated.errors.dispenseQuantity;
  }
  return updated;
}

function applyDispenseUnitUpdate(
  item: MedicationInputEntry,
  unit: Concept,
): MedicationInputEntry {
  const updated = { ...item, dispenseUnit: unit };
  if (item.hasBeenValidated && unit) {
    updated.errors = { ...item.errors };
    delete updated.errors.dispenseUnit;
  }
  return updated;
}

/**
 * Compares two MedicationInputEntry objects field-by-field to detect changes.
 * Used by hasEditChanges() to determine if an edited entry differs from its
 * original snapshot — enabling the "Done" button to re-disable on revert.
 */
function hasMedicationChanged(
  current: MedicationInputEntry,
  original: MedicationInputEntry,
): boolean {
  if (current.dosage !== original.dosage) return true;
  if (current.dosageUnit?.uuid !== original.dosageUnit?.uuid) return true;
  if (current.frequency?.uuid !== original.frequency?.uuid) return true;
  if (current.route?.uuid !== original.route?.uuid) return true;
  if (current.duration !== original.duration) return true;
  if (current.durationUnit?.code !== original.durationUnit?.code) return true;
  if (current.instruction?.uuid !== original.instruction?.uuid) return true;
  if (current.isSTAT !== original.isSTAT) return true;
  if (current.isPRN !== original.isPRN) return true;
  if (current.dispenseQuantity !== original.dispenseQuantity) return true;
  if (current.dispenseUnit?.uuid !== original.dispenseUnit?.uuid) return true;
  if ((current.note ?? '') !== (original.note ?? '')) return true;
  return false;
}

type FieldValidationConfig = {
  attr: string;
  key: keyof MedicationInputEntry['errors'];
  errorMsg: string;
  hasValue: (entry: MedicationInputEntry) => boolean;
};

const FIELD_VALIDATIONS: FieldValidationConfig[] = [
  {
    attr: 'stat',
    key: 'stat',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_STAT_REQUIRED',
    hasValue: (e) => e.isSTAT,
  },
  {
    attr: 'prn',
    key: 'prn',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_PRN_REQUIRED',
    hasValue: (e) => e.isPRN,
  },
  {
    attr: 'dosage',
    key: 'dosage',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_DOSAGE_REQUIRED',
    hasValue: (e) => e.dosage > 0,
  },
  {
    attr: 'dosageUnit',
    key: 'dosageUnit',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_DOSAGE_UNIT_REQUIRED',
    hasValue: (e) => Boolean(e.dosageUnit),
  },
  {
    attr: 'frequency',
    key: 'frequency',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_FREQUENCY_REQUIRED',
    hasValue: (e) => Boolean(e.frequency),
  },
  {
    attr: 'duration',
    key: 'duration',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_DURATION_REQUIRED',
    hasValue: (e) => e.isSTAT || e.duration > 0,
  },
  {
    attr: 'durationUnit',
    key: 'durationUnit',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_DURATION_UNIT_REQUIRED',
    hasValue: (e) => e.isSTAT || Boolean(e.durationUnit),
  },
  {
    attr: 'instruction',
    key: 'instruction',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_INSTRUCTION_REQUIRED',
    hasValue: (e) => Boolean(e.instruction),
  },
  {
    attr: 'route',
    key: 'route',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_ROUTE_REQUIRED',
    hasValue: (e) => Boolean(e.route),
  },
  {
    attr: 'startDate',
    key: 'startDate',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_START_DATE_REQUIRED',
    hasValue: (e) => Boolean(e.startDate),
  },
  {
    attr: 'note',
    key: 'note',
    errorMsg: 'MEDICATION_REQUEST_INPUT_CONTROL_NOTE_REQUIRED',
    hasValue: (e) => Boolean(e.note?.trim()),
  },
];

function validateEntry(
  item: MedicationInputEntry,
  attributes: InputControlAttributes[] | undefined,
): { entry: MedicationInputEntry; valid: boolean } {
  const errors = { ...item.errors };
  let valid = true;

  for (const field of FIELD_VALIDATIONS) {
    if (findAttr(field.attr, attributes)?.required) {
      if (field.hasValue(item)) delete errors[field.key];
      else {
        errors[field.key] = field.errorMsg;
        valid = false;
      }
    }
  }

  return { entry: { ...item, errors, hasBeenValidated: true }, valid };
}

function createMedicationRequestStore(key: MedicationRequestStoreKey) {
  const isMedicationRequest = key === MEDICATIONS_INPUT_CONTROL_KEY;

  return createStore<MedicationRequestState>((set, get) => ({
    selectedMedicationRequests: [],
    attributes: undefined,
    originalEditIds: [],
    originalEditSnapshots: new Map(),
    pendingFhirEdits: [],

    setAttributes: (attrs: InputControlAttributes[]) => {
      set({ attributes: attrs });
    },

    addItem: (medication: Medication, displayName: string) => {
      const { attributes } = get();
      const doseForm = extractDoseForm(medication, displayName);
      const dosageDefault = findAttr('dosage', attributes)?.default;
      const durationDefault = findAttr('duration', attributes)?.default;
      const statDefault = findAttr('stat', attributes)?.default;
      const prnDefault = findAttr('prn', attributes)?.default;
      const noteDefault = findAttr('note', attributes)?.default;
      const newItem: MedicationInputEntry = {
        id: `${medication.id}-${generateUUID()}`,
        display: displayName,
        medication,
        dosage: dosageDefault ? Number(dosageDefault) : 0,
        dosageUnit: null,
        frequency: null,
        route: null,
        duration: !statDefault && durationDefault ? Number(durationDefault) : 0,
        durationUnit: null,
        isSTAT: statDefault === true,
        isPRN: prnDefault === true,
        startDate: new Date(),
        instruction: null,
        errors: {},
        hasBeenValidated: false,
        dispenseQuantity: 0,
        dispenseUnit: null,
        doseForm,
        note: noteDefault ? String(noteDefault) : '',
      };
      set((state) => ({
        selectedMedicationRequests: [
          newItem,
          ...state.selectedMedicationRequests,
        ],
      }));
    },

    removeItem: (id: string) => {
      const notRemoved = (item: MedicationInputEntry) => item.id !== id;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.filter(notRemoved),
      }));
    },

    updateDosage: (id: string, dosage: number) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyDosageUpdate(item, dosage) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateDosageUnit: (id: string, unit: Concept) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyDosageUnitUpdate(item, unit) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateFrequency: (id: string, frequency: Frequency | null) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyFrequencyUpdate(item, frequency) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateRoute: (id: string, route: Concept) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyRouteUpdate(item, route) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateDuration: (id: string, duration: number) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyDurationUpdate(item, duration) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateDurationUnit: (id: string, unit: DurationUnitOption | null) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyDurationUnitUpdate(item, unit) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateInstruction: (id: string, instruction: Concept) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyInstructionUpdate(item, instruction) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateIsPRN: (id: string, isPRN: boolean) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyIsPRNUpdate(item, isPRN) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateIsSTAT: (id: string, isSTAT: boolean) => {
      set((state) => ({
        selectedMedicationRequests: state.selectedMedicationRequests.map(
          (item) => {
            if (item.id !== id) return item;
            let updated = applyIsSTATUpdate(item, isSTAT);
            if (isSTAT && !isMedicationRequest) {
              updated = { ...updated, duration: 0, durationUnit: null };
            }
            return updated;
          },
        ),
      }));
    },

    updateStartDate: (id: string, date: Date) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyStartDateUpdate(item, date) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateDispenseQuantity: (id: string, quantity: number) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyDispenseQuantityUpdate(item, quantity) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateDispenseUnit: (id: string, unit: Concept) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyDispenseUnitUpdate(item, unit) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    updateNote: (id: string, note: string) => {
      const applyUpdate = (item: MedicationInputEntry) =>
        item.id === id ? applyNoteUpdate(item, note) : item;
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyUpdate),
      }));
    },

    validateAll: () => {
      const { attributes } = get();
      let isValid = true;
      const applyValidation = (item: MedicationInputEntry) => {
        const result = validateEntry(item, attributes);
        if (!result.valid) isValid = false;
        return result.entry;
      };
      set((state) => ({
        selectedMedicationRequests:
          state.selectedMedicationRequests.map(applyValidation),
      }));
      return isValid;
    },

    setPendingFhirEdits: (resources: FhirMedicationRequest[]) => {
      set({ pendingFhirEdits: resources });
    },

    loadMedicationsForEdit: (entries: MedicationInputEntry[]) => {
      const snapshots = new Map<string, MedicationInputEntry>();
      entries.forEach((e) => snapshots.set(e.id, { ...e }));
      set({
        selectedMedicationRequests: entries,
        originalEditIds: entries.map((e) => e.id),
        originalEditSnapshots: snapshots,
        pendingFhirEdits: [],
      });
    },

    hasEditChanges: () => {
      const {
        selectedMedicationRequests,
        originalEditIds,
        originalEditSnapshots,
      } = get();
      // New items added (no fhirResourceId)
      if (selectedMedicationRequests.some((m) => !m.fhirResourceId))
        return true;
      // Any original item removed
      const currentIds = new Set(selectedMedicationRequests.map((m) => m.id));
      if (originalEditIds.some((id) => !currentIds.has(id))) return true;
      // Any edited item differs from its original snapshot
      return selectedMedicationRequests.some((m) => {
        const original = originalEditSnapshots.get(m.id);
        if (!original) return true;
        return hasMedicationChanged(m, original);
      });
    },

    reset: () => {
      set({
        selectedMedicationRequests: [],
        originalEditIds: [],
        originalEditSnapshots: new Map(),
        pendingFhirEdits: [],
      });
    },

    getState: () => get(),
  }));
}

export function getMedicationRequestStore(
  key: MedicationRequestStoreKey,
): MedicationRequestStoreApi {
  if (!storeRegistry.has(key)) {
    storeRegistry.set(key, createMedicationRequestStore(key));
  }
  return storeRegistry.get(key)!;
}

export function useMedicationRequestStore(
  key: MedicationRequestStoreKey,
): MedicationRequestState {
  return useStore(getMedicationRequestStore(key));
}
