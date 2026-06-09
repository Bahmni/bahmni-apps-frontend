import {
  UI_STATUS_TO_FHIR_TASK_STATUS,
  FHIR_TASK_STATUS_TO_UI_STATUS,
} from '../orderStatusMappings';

describe('orderStatusMappings', () => {
  describe('UI_STATUS_TO_FHIR_TASK_STATUS', () => {
    it('maps Ready for Pickup to FHIR ready status', () => {
      expect(UI_STATUS_TO_FHIR_TASK_STATUS['Ready for Pickup']).toBe('ready');
    });

    it('preserves existing status mappings', () => {
      expect(UI_STATUS_TO_FHIR_TASK_STATUS['Acknowledged']).toBe('requested');
      expect(UI_STATUS_TO_FHIR_TASK_STATUS['In Progress']).toBe('accepted');
      expect(UI_STATUS_TO_FHIR_TASK_STATUS['Completed']).toBe('completed');
    });
  });

  describe('FHIR_TASK_STATUS_TO_UI_STATUS', () => {
    it('maps ready FHIR task status to Ready for Pickup UI status', () => {
      expect(FHIR_TASK_STATUS_TO_UI_STATUS['ready']).toBe('Ready for Pickup');
    });

    it('maps lowercase FHIR task statuses to UI statuses', () => {
      expect(FHIR_TASK_STATUS_TO_UI_STATUS['requested']).toBe('Acknowledged');
      expect(FHIR_TASK_STATUS_TO_UI_STATUS['accepted']).toBe('In Progress');
      expect(FHIR_TASK_STATUS_TO_UI_STATUS['completed']).toBe('Completed');
      expect(FHIR_TASK_STATUS_TO_UI_STATUS['rejected']).toBe('New');
    });
  });
});
