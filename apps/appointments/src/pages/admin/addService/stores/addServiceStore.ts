import { create } from 'zustand';
import { AvailabilityRow, DayOfWeek, UpdateField } from './models';
import {
  createRow,
  findOverlappingRowIds,
  toggleRowDay,
  updateRowField,
  validateRow,
} from './utils';

interface AddServiceState {
  name: string;
  nameError: string | null;
  description: string;
  durationMins: number | null;
  specialityUuid: string | null;
  locationUuid: string | null;
  availabilityRows: AvailabilityRow[];

  setName: (name: string) => void;
  setNameError: (error: string | null) => void;
  setDescription: (description: string) => void;
  setDurationMins: (durationMins: number | null) => void;
  setSpecialityUuid: (uuid: string | null) => void;
  setLocationUuid: (uuid: string | null) => void;
  addAvailabilityRow: () => void;
  removeAvailabilityRow: (id: string) => void;
  updateAvailabilityRow: (
    id: string,
    field: UpdateField,
    value: string | number | null,
  ) => void;
  toggleDayOfWeek: (rowId: string, day: DayOfWeek) => void;
  validate: () => boolean;
  reset: () => void;
}

export const useAddServiceStore = create<AddServiceState>((set, get) => ({
  name: '',
  nameError: null,
  description: '',
  durationMins: null,
  specialityUuid: null,
  locationUuid: null,
  availabilityRows: [createRow(true)],

  setName: (name) => set({ name, nameError: null }),
  setNameError: (error) => set({ nameError: error }),
  setDescription: (description) => set({ description }),
  setDurationMins: (durationMins) => set({ durationMins }),
  setSpecialityUuid: (specialityUuid) => set({ specialityUuid }),
  setLocationUuid: (locationUuid) => set({ locationUuid }),
  addAvailabilityRow: () =>
    set((state) => ({
      availabilityRows: [...state.availabilityRows, createRow()],
    })),
  removeAvailabilityRow: (id) =>
    set((state) => ({
      availabilityRows: state.availabilityRows.filter((row) => row.id !== id),
    })),
  updateAvailabilityRow: (id, field, value) =>
    set((state) => ({
      availabilityRows: state.availabilityRows.map((row) =>
        updateRowField(row, id, field, value, state.durationMins),
      ),
    })),
  toggleDayOfWeek: (rowId, day) =>
    set((state) => ({
      availabilityRows: state.availabilityRows.map((row) =>
        toggleRowDay(row, rowId, day),
      ),
    })),
  validate: () => {
    const state = get();
    let isValid = true;

    const nameError = state.name.trim()
      ? state.nameError
      : 'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_REQUIRED';

    if (nameError) isValid = false;

    const validatedRows: AvailabilityRow[] = [];
    const rowValidityMap = new Map<string, boolean>();

    state.availabilityRows.forEach((row) => {
      const { row: validatedRow, rowIsValid } = validateRow(row);
      validatedRows.push(validatedRow);
      rowValidityMap.set(validatedRow.id, rowIsValid);
      if (!rowIsValid) isValid = false;
    });

    const validRows = validatedRows.filter((row) => rowValidityMap.get(row.id));
    const overlappingIds = findOverlappingRowIds(validRows);
    if (overlappingIds.size > 0) isValid = false;

    const updatedRows = validatedRows.map((row) =>
      overlappingIds.has(row.id)
        ? {
            ...row,
            errors: {
              ...row.errors,
              overlap: 'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP',
            },
          }
        : row,
    );

    set({ nameError, availabilityRows: updatedRows });
    return isValid;
  },

  reset: () =>
    set({
      name: '',
      nameError: null,
      description: '',
      durationMins: null,
      specialityUuid: null,
      locationUuid: null,
      availabilityRows: [createRow(true)],
    }),
}));
