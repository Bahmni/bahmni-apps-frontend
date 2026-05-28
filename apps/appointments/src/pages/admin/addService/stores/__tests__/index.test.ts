import { generateId } from '@bahmni/services';
import { DAYS_OF_WEEK } from '../../constants';
import { useAddServiceStore } from '../index';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  generateId: jest.fn(),
}));

const getStore = () => useAddServiceStore.getState();

const INITIAL_ROW_ID = 'row-1';

describe('useAddServiceStore', () => {
  let idCounter = 0;

  beforeEach(() => {
    idCounter = 0;
    (generateId as jest.Mock).mockImplementation(() => `row-${++idCounter}`);
    getStore().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state with one row with all days selected', () => {
      const state = getStore();

      expect(state.name).toBe('');
      expect(state.nameError).toBeNull();
      expect(state.description).toBe('');
      expect(state.durationMins).toBeNull();
      expect(state.specialityUuid).toBeNull();
      expect(state.locationUuid).toBeNull();
      expect(state.availabilityRows).toHaveLength(1);
      expect(state.availabilityRows[0].daysOfWeek).toEqual([...DAYS_OF_WEEK]);
    });
  });

  describe('field setters', () => {
    it.each([
      { action: 'setName', field: 'name', value: 'General Consultation' },
      {
        action: 'setDescription',
        field: 'description',
        value: 'A consultation',
      },
      {
        action: 'setSpecialityUuid',
        field: 'specialityUuid',
        value: 'spec-uuid-1',
      },
      { action: 'setLocationUuid', field: 'locationUuid', value: 'loc-uuid-1' },
      { action: 'setDurationMins', field: 'durationMins', value: 30 },
    ])('$action should update $field', ({ action, field, value }) => {
      (getStore() as unknown as Record<string, (v: unknown) => void>)[action](
        value,
      );

      expect((getStore() as unknown as Record<string, unknown>)[field]).toBe(
        value,
      );
    });

    it('setName should clear nameError', () => {
      getStore().validate();
      expect(getStore().nameError).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_REQUIRED',
      );

      getStore().setName('Test Service');

      expect(getStore().nameError).toBeNull();
    });

    it('setNameError should set nameError in state', () => {
      getStore().setNameError(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_DUPLICATE',
      );

      expect(getStore().nameError).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_DUPLICATE',
      );
    });
  });

  describe('addAvailabilityRow', () => {
    it('should add a new row with no days selected', () => {
      getStore().addAvailabilityRow();

      const rows = getStore().availabilityRows;
      expect(rows).toHaveLength(2);
      expect(rows[1].daysOfWeek).toEqual([]);
    });
  });

  describe('removeAvailabilityRow', () => {
    it('should remove row by id', () => {
      getStore().removeAvailabilityRow(INITIAL_ROW_ID);

      expect(getStore().availabilityRows).toHaveLength(0);
    });
  });

  describe('updateAvailabilityRow', () => {
    it('should update the field on the matching row', () => {
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'startTime', '9:00');

      expect(getStore().availabilityRows[0].startTime).toBe('9:00');
    });
  });

  describe('toggleDayOfWeek', () => {
    it('should toggle a day on the matching row', () => {
      getStore().toggleDayOfWeek(INITIAL_ROW_ID, 'MONDAY');

      expect(getStore().availabilityRows[0].daysOfWeek).not.toContain('MONDAY');
    });
  });

  describe('validate', () => {
    it('should return false and set nameError when name is empty', () => {
      const isValid = getStore().validate();

      expect(isValid).toBe(false);
      expect(getStore().nameError).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_REQUIRED',
      );
    });

    it('should return false and preserve existing nameError when name is non-empty', () => {
      getStore().setName('Existing Service');
      getStore().setNameError(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_DUPLICATE',
      );
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'startTime', '9:00');
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'endTime', '10:00');

      const isValid = getStore().validate();

      expect(isValid).toBe(false);
      expect(getStore().nameError).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_DUPLICATE',
      );
    });

    it('should return false and apply row validation errors to state', () => {
      getStore().setName('Test Service');

      const isValid = getStore().validate();

      expect(isValid).toBe(false);
      expect(getStore().availabilityRows[0].errors.startTime).toBeDefined();
    });

    it('should return true and clear all errors when all fields are valid', () => {
      getStore().setName('Test Service');
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'startTime', '9:00');
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'endTime', '10:00');

      const isValid = getStore().validate();

      expect(isValid).toBe(true);
      expect(getStore().nameError).toBeNull();
      expect(getStore().availabilityRows[0].errors).toEqual({});
    });

    it('should return false and set overlap error on both rows when they overlap', () => {
      getStore().setName('Test Service');
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'startTime', '9:00');
      getStore().updateAvailabilityRow(INITIAL_ROW_ID, 'endTime', '11:00');

      getStore().addAvailabilityRow();
      const secondRowId = getStore().availabilityRows[1].id;
      getStore().updateAvailabilityRow(secondRowId, 'startTime', '10:00');
      getStore().updateAvailabilityRow(secondRowId, 'endTime', '11:30');
      getStore().toggleDayOfWeek(secondRowId, 'MONDAY');

      const isValid = getStore().validate();

      expect(isValid).toBe(false);
      expect(getStore().availabilityRows[0].errors.overlap).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP',
      );
      expect(getStore().availabilityRows[1].errors.overlap).toBe(
        'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP',
      );
    });
  });

  describe('reset', () => {
    it('should restore all state to initial values', () => {
      getStore().setName('Test');
      getStore().setDescription('Desc');
      getStore().setDurationMins(30);
      getStore().addAvailabilityRow();

      getStore().reset();

      const state = getStore();
      expect(state.name).toBe('');
      expect(state.description).toBe('');
      expect(state.durationMins).toBeNull();
      expect(state.availabilityRows).toHaveLength(1);
      expect(state.availabilityRows[0].daysOfWeek).toEqual([...DAYS_OF_WEEK]);
    });
  });
});
