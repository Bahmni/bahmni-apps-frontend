import { generateUUID } from '@bahmni/services';
import { create } from 'zustand';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import {
  ImmunizationDrug,
  ImmunizationHistoryState,
  ImmunizationInputEntry,
  ImmunizationLocation,
} from './models';
import { findAttr } from './utils';

export const useImmunizationHistoryStore = create<ImmunizationHistoryState>(
  (set, get) => ({
    selectedImmunizations: [],
    attributes: undefined,

    addImmunization: (vaccineCode: { code: string; display: string }) => {
      const newEntry: ImmunizationInputEntry = {
        id: generateUUID(),
        drug: null,
        vaccineCode,
        administeredOn: null,
        administeredLocation: null,
        route: null,
        site: null,
        expiryDate: null,
        manufacturer: null,
        batchNumber: null,
        doseSequence: null,
        errors: {},
        hasBeenValidated: false,
      };
      set((state) => ({
        selectedImmunizations: [newEntry, ...state.selectedImmunizations],
      }));
    },

    removeImmunization: (id: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.filter(
          (entry) => entry.id !== id,
        ),
      }));
    },

    setAttributes: (attrs: InputControlAttributes[]) => {
      set({ attributes: attrs });
    },

    updateAdministeredOn: (id: string, value: Date | null) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, administeredOn: value };
          if (entry.hasBeenValidated) {
            updated.errors = { ...entry.errors };
            if (value) delete updated.errors.administeredOn;
            if (entry.expiryDate) {
              if (value && entry.expiryDate < value) {
                updated.errors.expiryDate =
                  'IMMUNIZATION_HISTORY_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
              } else {
                delete updated.errors.expiryDate;
              }
            }
          }
          return updated;
        }),
      }));
    },

    updateVaccineDrug: (id: string, drug: ImmunizationDrug | null) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, drug };
          if (entry.hasBeenValidated && drug?.display.trim()) {
            updated.errors = { ...entry.errors };
            delete updated.errors.drug;
          }
          return updated;
        }),
      }));
    },

    updateAdministeredLocation: (
      id: string,
      value: ImmunizationLocation | null,
    ) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, administeredLocation: value };
          if (entry.hasBeenValidated && value?.display.trim()) {
            updated.errors = { ...entry.errors };
            delete updated.errors.administeredLocation;
          }
          return updated;
        }),
      }));
    },

    updateRoute: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, route: value };
          if (entry.hasBeenValidated && value) {
            updated.errors = { ...entry.errors };
            delete updated.errors.route;
          }
          return updated;
        }),
      }));
    },

    updateSite: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, site: value };
          if (entry.hasBeenValidated && value) {
            updated.errors = { ...entry.errors };
            delete updated.errors.site;
          }
          return updated;
        }),
      }));
    },

    updateExpiryDate: (id: string, value: Date | null) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, expiryDate: value };
          if (entry.hasBeenValidated && value) {
            updated.errors = { ...entry.errors };
            if (entry.administeredOn && value < entry.administeredOn) {
              updated.errors.expiryDate =
                'IMMUNIZATION_HISTORY_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
            } else {
              delete updated.errors.expiryDate;
            }
          }
          return updated;
        }),
      }));
    },

    updateManufacturer: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, manufacturer: value };
          if (entry.hasBeenValidated && value.trim()) {
            updated.errors = { ...entry.errors };
            delete updated.errors.manufacturer;
          }
          return updated;
        }),
      }));
    },

    updateBatchNumber: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, batchNumber: value };
          if (entry.hasBeenValidated && value.trim()) {
            updated.errors = { ...entry.errors };
            delete updated.errors.batchNumber;
          }
          return updated;
        }),
      }));
    },

    updateDoseSequence: (id: string, value: number | null) => {
      const sanitized = value === null ? null : Math.max(0, Math.floor(value));
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, doseSequence: sanitized };
          if (entry.hasBeenValidated && sanitized !== null && sanitized >= 1) {
            updated.errors = { ...entry.errors };
            delete updated.errors.doseSequence;
          }
          return updated;
        }),
      }));
    },

    updateNote: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) =>
          entry.id === id ? { ...entry, note: value } : entry,
        ),
      }));
    },

    validateAll: () => {
      let isValid = true;
      const { attributes } = get();

      const checkField = (
        errors: ImmunizationInputEntry['errors'],
        key: keyof ImmunizationInputEntry['errors'],
        isEmpty: boolean,
        errorKey: string,
      ) => {
        if (isEmpty) {
          errors[key] = errorKey;
          isValid = false;
        } else {
          delete errors[key];
        }
      };

      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          const errors = { ...entry.errors };

          if (findAttr('drug', attributes)?.required)
            checkField(
              errors,
              'drug',
              !entry.drug,
              'IMMUNIZATION_HISTORY_DRUG_CODE_REQUIRED',
            );

          if (findAttr('administeredOn', attributes)?.required)
            checkField(
              errors,
              'administeredOn',
              !entry.administeredOn,
              'IMMUNIZATION_HISTORY_ADMINISTERED_ON_REQUIRED',
            );
          if (findAttr('administeredLocation', attributes)?.required)
            checkField(
              errors,
              'administeredLocation',
              !entry.administeredLocation?.display.trim(),
              'IMMUNIZATION_HISTORY_ADMINISTERED_LOCATION_REQUIRED',
            );
          if (findAttr('route', attributes)?.required)
            checkField(
              errors,
              'route',
              !entry.route?.trim(),
              'IMMUNIZATION_HISTORY_ROUTE_REQUIRED',
            );
          if (findAttr('site', attributes)?.required)
            checkField(
              errors,
              'site',
              !entry.site?.trim(),
              'IMMUNIZATION_HISTORY_SITE_REQUIRED',
            );
          if (findAttr('expiryDate', attributes)?.required)
            checkField(
              errors,
              'expiryDate',
              !entry.expiryDate,
              'IMMUNIZATION_HISTORY_EXPIRY_DATE_REQUIRED',
            );
          if (findAttr('manufacturer', attributes)?.required)
            checkField(
              errors,
              'manufacturer',
              !entry.manufacturer?.trim(),
              'IMMUNIZATION_HISTORY_MANUFACTURER_REQUIRED',
            );
          if (findAttr('batchNumber', attributes)?.required)
            checkField(
              errors,
              'batchNumber',
              !entry.batchNumber?.trim(),
              'IMMUNIZATION_HISTORY_BATCH_NUMBER_REQUIRED',
            );

          if (findAttr('doseSequence', attributes)?.required)
            checkField(
              errors,
              'doseSequence',
              entry.doseSequence === null || entry.doseSequence < 1,
              'IMMUNIZATION_HISTORY_DOSE_SEQUENCE_REQUIRED',
            );

          if (
            entry.expiryDate &&
            entry.administeredOn &&
            entry.expiryDate < entry.administeredOn
          ) {
            errors.expiryDate =
              'IMMUNIZATION_HISTORY_EXPIRY_DATE_BEFORE_ADMINISTERED_ON';
            isValid = false;
          }

          return { ...entry, errors, hasBeenValidated: true };
        }),
      }));
      return isValid;
    },

    reset: () => {
      set({ selectedImmunizations: [] });
    },

    getState: () => get(),
  }),
);
