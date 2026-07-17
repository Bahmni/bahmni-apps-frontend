import { type CDSCard, generateUUID } from '@bahmni/services';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import {
  ImmunizationDrug,
  ImmunizationHistoryState,
  ImmunizationInputEntry,
  ImmunizationLocation,
  ImmunizationStatusReason,
  ImmunizationStoreKey,
  WaiverReasonConfig,
} from './models';
import { findAttr } from './utils';

type ImmunizationHistoryStoreApi = ReturnType<
  typeof createImmunizationHistoryStore
>;

const storeRegistry = new Map<
  ImmunizationStoreKey,
  ImmunizationHistoryStoreApi
>();

function applyAdministeredOnUpdate(
  entry: ImmunizationInputEntry,
  value: Date | null,
): ImmunizationInputEntry {
  const updated = { ...entry, administeredOn: value };
  if (entry.hasBeenValidated) {
    updated.errors = { ...entry.errors };
    if (value) delete updated.errors.administeredOn;
    if (entry.expiryDate) {
      if (value && entry.expiryDate < value) {
        updated.errors.expiryDate =
          'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
      } else {
        delete updated.errors.expiryDate;
      }
    }
  }
  return updated;
}

function applyVaccineDrugUpdate(
  entry: ImmunizationInputEntry,
  drug: ImmunizationDrug | null,
): ImmunizationInputEntry {
  const updated = { ...entry, drug };
  if (entry.hasBeenValidated && drug?.display.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.drug;
  }
  return updated;
}

function applyAdministeredLocationUpdate(
  entry: ImmunizationInputEntry,
  value: ImmunizationLocation | null,
): ImmunizationInputEntry {
  const updated = { ...entry, administeredLocation: value };
  if (entry.hasBeenValidated && value?.display.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.administeredLocation;
  }
  return updated;
}

function applyRouteUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, route: value };
  if (entry.hasBeenValidated && value) {
    updated.errors = { ...entry.errors };
    delete updated.errors.route;
  }
  return updated;
}

function applySiteUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, site: value };
  if (entry.hasBeenValidated && value) {
    updated.errors = { ...entry.errors };
    delete updated.errors.site;
  }
  return updated;
}

function applyExpiryDateUpdate(
  entry: ImmunizationInputEntry,
  value: Date | null,
): ImmunizationInputEntry {
  const updated = { ...entry, expiryDate: value };
  if (entry.hasBeenValidated) {
    updated.errors = { ...entry.errors };
    if (!value) {
      if (
        updated.errors.expiryDate ===
        'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON'
      ) {
        delete updated.errors.expiryDate;
      }
    } else if (entry.administeredOn && value < entry.administeredOn) {
      updated.errors.expiryDate =
        'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
    } else {
      delete updated.errors.expiryDate;
    }
  }
  return updated;
}

function applyManufacturerUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, manufacturer: value };
  if (entry.hasBeenValidated && value.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.manufacturer;
  }
  return updated;
}

function applyBatchNumberUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, batchNumber: value };
  if (entry.hasBeenValidated && value.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.batchNumber;
  }
  return updated;
}

function applyStatusReasonUpdate(
  entry: ImmunizationInputEntry,
  value: ImmunizationStatusReason | null,
): ImmunizationInputEntry {
  const updated = { ...entry, statusReason: value };
  if (entry.hasBeenValidated) {
    updated.errors = { ...entry.errors };
    if (value) delete updated.errors.statusReason;
  }
  return updated;
}

function applyStockLocationUpdate(
  entry: ImmunizationInputEntry,
  value: string | null,
): ImmunizationInputEntry {
  return { ...entry, stockLocation: value };
}

function applyNoteUpdate(
  entry: ImmunizationInputEntry,
  value: string,
): ImmunizationInputEntry {
  const updated = { ...entry, note: value };
  if (entry.hasBeenValidated && value.trim()) {
    updated.errors = { ...entry.errors };
    delete updated.errors.note;
  }
  return updated;
}

function applyDoseSequenceUpdate(
  entry: ImmunizationInputEntry,
  sanitized: number | null,
): ImmunizationInputEntry {
  const updated = { ...entry, doseSequence: sanitized };
  if (entry.hasBeenValidated && sanitized !== null && sanitized >= 1) {
    updated.errors = { ...entry.errors };
    delete updated.errors.doseSequence;
  }
  return updated;
}

type FieldValidationConfig = {
  attr: string;
  key: keyof ImmunizationInputEntry['errors'];
  errorMsg: string;
  hasValue: (entry: ImmunizationInputEntry) => boolean;
};

const FIELD_VALIDATIONS: FieldValidationConfig[] = [
  {
    attr: 'drug',
    key: 'drug',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_DRUG_CODE_REQUIRED',
    hasValue: (e) => Boolean(e.drug),
  },
  {
    attr: 'administeredOn',
    key: 'administeredOn',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_ON_REQUIRED',
    hasValue: (e) => Boolean(e.administeredOn),
  },
  {
    attr: 'administeredLocation',
    key: 'administeredLocation',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_LOCATION_REQUIRED',
    hasValue: (e) => Boolean(e.administeredLocation?.display.trim()),
  },
  {
    attr: 'route',
    key: 'route',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_ROUTE_REQUIRED',
    hasValue: (e) => Boolean(e.route?.trim()),
  },
  {
    attr: 'site',
    key: 'site',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_SITE_REQUIRED',
    hasValue: (e) => Boolean(e.site?.trim()),
  },
  {
    attr: 'expiryDate',
    key: 'expiryDate',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_REQUIRED',
    hasValue: (e) => Boolean(e.expiryDate),
  },
  {
    attr: 'manufacturer',
    key: 'manufacturer',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_MANUFACTURER_REQUIRED',
    hasValue: (e) => Boolean(e.manufacturer?.trim()),
  },
  {
    attr: 'batchNumber',
    key: 'batchNumber',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_BATCH_NUMBER_REQUIRED',
    hasValue: (e) => Boolean(e.batchNumber?.trim()),
  },
  {
    attr: 'doseSequence',
    key: 'doseSequence',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_DOSE_SEQUENCE_REQUIRED',
    hasValue: (e) => e.doseSequence !== null && e.doseSequence >= 1,
  },
  {
    attr: 'note',
    key: 'note',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_NOTE_REQUIRED',
    hasValue: (e) => Boolean(e.note?.trim()),
  },
  {
    attr: 'statusReason',
    key: 'statusReason',
    errorMsg: 'IMMUNIZATION_INPUT_CONTROL_STATUS_REASON_REQUIRED',
    hasValue: (e) => Boolean(e.statusReason),
  },
];

function validateEntry(
  entry: ImmunizationInputEntry,
  attributes: InputControlAttributes[] | undefined,
  waiverReasonConfig: WaiverReasonConfig | undefined,
): { entry: ImmunizationInputEntry; valid: boolean } {
  const errors = { ...entry.errors };
  let valid = true;

  for (const field of FIELD_VALIDATIONS) {
    if (findAttr(field.attr, attributes)?.required) {
      if (field.hasValue(entry)) delete errors[field.key];
      else {
        errors[field.key] = field.errorMsg;
        valid = false;
      }
    }
  }

  if (
    entry.expiryDate &&
    entry.administeredOn &&
    entry.expiryDate < entry.administeredOn
  ) {
    errors.expiryDate =
      'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
    valid = false;
  }

  const isOtherReason =
    !!entry.statusReason &&
    entry.statusReason.code === waiverReasonConfig?.otherReasonConceptUuid;
  if (isOtherReason && !entry.note?.trim()) {
    errors.note = 'IMMUNIZATION_INPUT_CONTROL_NOTE_REQUIRED';
    valid = false;
  } else if (!findAttr('note', attributes)?.required) {
    delete errors.note;
  }

  return { entry: { ...entry, errors, hasBeenValidated: true }, valid };
}

function createImmunizationHistoryStore() {
  return createStore<ImmunizationHistoryState>((set, get) => ({
    selectedImmunizations: [],
    attributes: undefined,
    waiverReasonConfig: undefined,

    setWaiverReasonConfig: (config) => {
      set({ waiverReasonConfig: config });
    },

    addImmunization: (
      vaccineCode: { code: string; display: string },
      defaults?: {
        basedOnReference?: string | null;
        drug?: ImmunizationDrug | null;
        administeredOn?: Date | null;
        administeredLocation?: ImmunizationLocation | null;
      },
    ) => {
      const newEntry: ImmunizationInputEntry = {
        id: generateUUID(),
        drug: defaults?.drug ?? null,
        vaccineCode,
        administeredOn: defaults?.administeredOn ?? null,
        administeredLocation: defaults?.administeredLocation ?? null,
        route: null,
        site: null,
        expiryDate: null,
        manufacturer: null,
        batchNumber: null,
        stockLocation: null,
        doseSequence: null,
        statusReason: null,
        ...(defaults?.basedOnReference !== undefined && {
          basedOnReference: defaults.basedOnReference,
        }),
        errors: {},
        hasBeenValidated: false,
      };
      set((state) => ({
        selectedImmunizations: [newEntry, ...state.selectedImmunizations],
      }));
      return newEntry.id;
    },

    removeImmunization: (id: string) => {
      const notRemoved = (e: ImmunizationInputEntry) => e.id !== id;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.filter(notRemoved),
      }));
    },

    setAttributes: (attrs: InputControlAttributes[]) => {
      set({ attributes: attrs });
    },

    updateAdministeredOn: (id: string, value: Date | null) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyAdministeredOnUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateVaccineDrug: (id: string, drug: ImmunizationDrug | null) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyVaccineDrugUpdate(entry, drug) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateAdministeredLocation: (
      id: string,
      value: ImmunizationLocation | null,
    ) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyAdministeredLocationUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateRoute: (id: string, value: string) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyRouteUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateSite: (id: string, value: string) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applySiteUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateExpiryDate: (id: string, value: Date | null) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyExpiryDateUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateManufacturer: (id: string, value: string) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyManufacturerUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateBatchNumber: (id: string, value: string) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyBatchNumberUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateStockLocation: (id: string, value: string | null) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyStockLocationUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateDoseSequence: (id: string, value: number | null) => {
      const sanitized = value === null ? null : Math.max(0, Math.floor(value));
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyDoseSequenceUpdate(entry, sanitized) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateNote: (id: string, value: string) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyNoteUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    updateStatusReason: (
      id: string,
      value: ImmunizationStatusReason | null,
    ) => {
      const applyUpdate = (entry: ImmunizationInputEntry) =>
        entry.id === id ? applyStatusReasonUpdate(entry, value) : entry;
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyUpdate),
      }));
    },

    validateAll: () => {
      const { attributes, waiverReasonConfig } = get();
      let isValid = true;
      const applyValidation = (entry: ImmunizationInputEntry) => {
        const result = validateEntry(entry, attributes, waiverReasonConfig);
        if (!result.valid) isValid = false;
        return result.entry;
      };
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(applyValidation),
      }));
      return isValid;
    },

    updateItemCDSCards: (itemId: string, cards: CDSCard[]) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map(
          (immunization) =>
            immunization.id === itemId
              ? { ...immunization, cdsCards: cards }
              : immunization,
        ),
      }));
    },

    hasCriticalCDSCards: () => {
      const { selectedImmunizations } = get();
      return selectedImmunizations.some((immunization) =>
        immunization.cdsCards?.some((card) => card.indicator === 'critical'),
      );
    },

    reset: () => {
      set({ selectedImmunizations: [] });
    },

    getState: () => get(),
  }));
}

export function getImmunizationStore(
  key: ImmunizationStoreKey,
): ImmunizationHistoryStoreApi {
  if (!storeRegistry.has(key)) {
    storeRegistry.set(key, createImmunizationHistoryStore());
  }
  return storeRegistry.get(key)!;
}

export function useImmunizationHistoryStore(
  key: ImmunizationStoreKey,
): ImmunizationHistoryState {
  return useStore(getImmunizationStore(key));
}
