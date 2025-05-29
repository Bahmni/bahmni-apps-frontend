import { useDiagnosisStore } from '../diagnosisStore';
import { CERTAINITY_CONCEPTS } from '@/constants/concepts';

// Mock data
const mockDiagnosis = {
  conceptName: 'Hypertension',
  conceptUuid: '123-456',
  matchedName: 'Hypertension',
};

const mockDiagnosis2 = {
  conceptName: 'Diabetes',
  conceptUuid: '789-012',
  matchedName: 'Diabetes',
};

describe('diagnosisStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useDiagnosisStore.getState().reset();
  });

  describe('addDiagnosis', () => {
    it('should add a diagnosis to the store', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);

      const state = store.getState();
      expect(state.selectedDiagnoses).toHaveLength(1);
      expect(state.selectedDiagnoses[0].conceptUuid).toBe(
        mockDiagnosis.conceptUuid,
      );
      expect(state.selectedDiagnoses[0].title).toBe(mockDiagnosis.conceptName);
      expect(state.selectedDiagnoses[0].selectedCertainty).toBeNull();
      expect(state.selectedDiagnoses[0].errors).toEqual({});
      expect(state.selectedDiagnoses[0].hasBeenValidated).toBe(false);
      expect(state.selectedDiagnoses[0].id).toBeDefined(); // Should have a unique ID
    });

    it('should add multiple different diagnoses', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);
      store.getState().addDiagnosis(mockDiagnosis2);

      expect(store.getState().selectedDiagnoses).toHaveLength(2);
      expect(store.getState().selectedDiagnoses[0].conceptUuid).toBe(
        mockDiagnosis.conceptUuid,
      );
      expect(store.getState().selectedDiagnoses[1].conceptUuid).toBe(
        mockDiagnosis2.conceptUuid,
      );
    });
  });

  describe('removeDiagnosis', () => {
    it('should remove a diagnosis by ID', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);
      store.getState().addDiagnosis(mockDiagnosis2);

      expect(store.getState().selectedDiagnoses).toHaveLength(2);

      // Get the ID of the first diagnosis
      const firstDiagnosisId = store.getState().selectedDiagnoses[0].id;

      store.getState().removeDiagnosis(firstDiagnosisId);

      expect(store.getState().selectedDiagnoses).toHaveLength(1);
      expect(store.getState().selectedDiagnoses[0].conceptUuid).toBe(
        mockDiagnosis2.conceptUuid,
      );
    });
  });

  describe('updateCertainty', () => {
    it('should update the certainty of a diagnosis', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);

      // Get the generated ID from the store
      const diagnosisId = store.getState().selectedDiagnoses[0].id;

      const certainty = CERTAINITY_CONCEPTS[0]; // 'confirmed'

      store.getState().updateCertainty(diagnosisId, certainty);

      expect(store.getState().selectedDiagnoses[0].selectedCertainty).toBe(
        certainty,
      );
    });

    it('should clear certainty error when certainty is updated after validation', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);

      // Get the generated ID from the store
      const diagnosisId = store.getState().selectedDiagnoses[0].id;

      // Validate to trigger error
      store.getState().validateAllDiagnoses();

      expect(
        store.getState().selectedDiagnoses[0].errors.certainty,
      ).toBeDefined();

      // Update certainty
      const certainty = CERTAINITY_CONCEPTS[0];
      store.getState().updateCertainty(diagnosisId, certainty);

      expect(
        store.getState().selectedDiagnoses[0].errors.certainty,
      ).toBeUndefined();
    });
  });

  describe('validateAllDiagnoses', () => {
    it('should return true when all diagnoses are valid', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);

      // Get the generated ID from the store
      const diagnosisId = store.getState().selectedDiagnoses[0].id;

      store.getState().updateCertainty(diagnosisId, CERTAINITY_CONCEPTS[0]);

      const isValid = store.getState().validateAllDiagnoses();

      expect(isValid).toBe(true);
      expect(store.getState().selectedDiagnoses[0].hasBeenValidated).toBe(true);
      expect(
        store.getState().selectedDiagnoses[0].errors.certainty,
      ).toBeUndefined();
    });

    it('should return false when any diagnosis is invalid', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);
      // Not setting certainty, so it should be invalid

      const isValid = store.getState().validateAllDiagnoses();

      expect(isValid).toBe(false);
      expect(store.getState().selectedDiagnoses[0].hasBeenValidated).toBe(true);
      expect(
        store.getState().selectedDiagnoses[0].errors.certainty,
      ).toBeDefined();
    });

    it('should validate multiple diagnoses correctly', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);
      store.getState().addDiagnosis(mockDiagnosis2);

      // Get the generated IDs from the store
      const diagnoses = store.getState().selectedDiagnoses;
      const firstDiagnosisId = diagnoses.find(
        (d) => d.conceptUuid === mockDiagnosis.conceptUuid,
      )?.id;

      // Set certainty for only the first diagnosis
      store
        .getState()
        .updateCertainty(firstDiagnosisId!, CERTAINITY_CONCEPTS[0]);

      const isValid = store.getState().validateAllDiagnoses();

      expect(isValid).toBe(false);
      expect(
        store.getState().selectedDiagnoses[0].errors.certainty,
      ).toBeUndefined();
      expect(
        store.getState().selectedDiagnoses[1].errors.certainty,
      ).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset the store to its initial state', () => {
      const store = useDiagnosisStore;

      store.getState().addDiagnosis(mockDiagnosis);
      store.getState().addDiagnosis(mockDiagnosis2);

      expect(store.getState().selectedDiagnoses).toHaveLength(2);

      store.getState().reset();

      expect(store.getState().selectedDiagnoses).toHaveLength(0);
    });
  });
});
