import { generateUUID } from '@bahmni/services';
import { create } from 'zustand';
import { ImmunizationConfig } from '../../../providers/clinicalConfig/models';
import { ImmunizationHistoryState, ImmunizationInputEntry } from './models';

export const useImmunizationHistoryStore = create<ImmunizationHistoryState>(
  (set, get) => ({
    selectedImmunizations: [],
    formFields: undefined,

    addImmunization: (vaccineCode: { code: string; display: string }) => {
      const newEntry: ImmunizationInputEntry = {
        id: generateUUID(),
        drugCode: '',
        vaccineCode,
        administeredOn: null,
        administeredLocation: null,
        route: null,
        site: null,
        expiryDate: null,
        manufacturer: null,
        batchNumber: null,
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

    setFormFields: (fields: ImmunizationConfig['formFields']) => {
      set({ formFields: fields });
    },

    updateAdministeredOn: (id: string, value: Date | null) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, administeredOn: value };
          if (entry.hasBeenValidated && value) {
            updated.errors = { ...entry.errors };
            delete updated.errors.administeredOn;
          }
          return updated;
        }),
      }));
    },

    updateVaccineDrug: (id: string, drugCode: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, drugCode };
          if (entry.hasBeenValidated && drugCode) {
            updated.errors = { ...entry.errors };
            delete updated.errors.drugCode;
          }
          return updated;
        }),
      }));
    },

    updateAdministeredLocation: (id: string, value: string) => {
      set((state) => ({
        selectedImmunizations: state.selectedImmunizations.map((entry) => {
          if (entry.id !== id) return entry;
          const updated = { ...entry, administeredLocation: value };
          if (entry.hasBeenValidated && value.trim()) {
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
            delete updated.errors.expiryDate;
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

    validateAll: () => {
      let isValid = true;
      const { formFields } = get();

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

          checkField(
            errors,
            'drugCode',
            !entry.drugCode,
            'IMMUNIZATION_HISTORY_DRUG_CODE_REQUIRED',
          );

          if (formFields?.administeredOn?.required)
            checkField(
              errors,
              'administeredOn',
              !entry.administeredOn,
              'IMMUNIZATION_HISTORY_ADMINISTERED_ON_REQUIRED',
            );
          if (formFields?.administeredLocation?.required)
            checkField(
              errors,
              'administeredLocation',
              !entry.administeredLocation?.trim(),
              'IMMUNIZATION_HISTORY_ADMINISTERED_LOCATION_REQUIRED',
            );
          if (formFields?.route?.required)
            checkField(
              errors,
              'route',
              !entry.route?.trim(),
              'IMMUNIZATION_HISTORY_ROUTE_REQUIRED',
            );
          if (formFields?.site?.required)
            checkField(
              errors,
              'site',
              !entry.site?.trim(),
              'IMMUNIZATION_HISTORY_SITE_REQUIRED',
            );
          if (formFields?.expiryDate?.required)
            checkField(
              errors,
              'expiryDate',
              !entry.expiryDate,
              'IMMUNIZATION_HISTORY_EXPIRY_DATE_REQUIRED',
            );
          if (formFields?.manufacturer?.required)
            checkField(
              errors,
              'manufacturer',
              !entry.manufacturer?.trim(),
              'IMMUNIZATION_HISTORY_MANUFACTURER_REQUIRED',
            );
          if (formFields?.batchNumber?.required)
            checkField(
              errors,
              'batchNumber',
              !entry.batchNumber?.trim(),
              'IMMUNIZATION_HISTORY_BATCH_NUMBER_REQUIRED',
            );

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
