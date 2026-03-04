import {
  Bundle,
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';
import {
  FHIR_MEDICATION_EXTENSION_URL,
  FHIR_MEDICATION_NAME_EXTENSION_URL,
} from '../../constants/fhir';
import {
  getActiveMedicationsFromBundle,
  getMedicationDisplay,
  getMedicationsFromBundle,
} from '../medicationService';

describe('MedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedicationDisplay', () => {
    it('should return medication display name with form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        extension: [
          {
            url: FHIR_MEDICATION_EXTENSION_URL,
            extension: [
              {
                url: FHIR_MEDICATION_NAME_EXTENSION_URL,
                valueString: 'Paracetamol',
              },
            ],
          },
        ],
        form: {
          text: 'Tablet',
        },
        code: {
          text: 'Paracetamol Code',
        },
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Paracetamol (Tablet)- Paracetamol Code');
    });

    it('should return medication display name without form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-2',
        extension: [
          {
            url: FHIR_MEDICATION_EXTENSION_URL,
            extension: [
              {
                url: FHIR_MEDICATION_NAME_EXTENSION_URL,
                valueString: 'Aspirin',
              },
            ],
          },
        ],
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Aspirin');
    });

    it('should return "Unknown Medication Name" when no drug name extension is found', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-3',
        form: {
          text: 'Syrup',
        },
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });

    it('should return "Unknown Medication Name" when extension is missing', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-4',
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });

    it('should handle medication with wrong extension URL', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-5',
        extension: [
          {
            url: 'http://wrong.url',
            extension: [
              {
                url: FHIR_MEDICATION_NAME_EXTENSION_URL,
                valueString: 'SomeMed',
              },
            ],
          },
        ],
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });

    it('should handle medication with nested extension but wrong drug name URL', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-6',
        extension: [
          {
            url: FHIR_MEDICATION_EXTENSION_URL,
            extension: [
              {
                url: 'http://wrong.drug.name.url',
                valueString: 'SomeMed',
              },
            ],
          },
        ],
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });
  });

  describe('getMedicationsFromBundle', () => {
    it('should extract medications from bundle with entries', () => {
      const mockMedication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
      };

      const bundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockMedication,
          },
        ],
      };

      const result = getMedicationsFromBundle(bundle);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMedication);
    });

    it('should return empty array when bundle has no entries', () => {
      const bundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
      };

      const result = getMedicationsFromBundle(bundle);

      expect(result).toEqual([]);
    });

    it('should return empty array when bundle entries is empty array', () => {
      const bundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      const result = getMedicationsFromBundle(bundle);

      expect(result).toEqual([]);
    });
  });

  describe('getActiveMedicationsFromBundle', () => {
    it('should return empty results for undefined bundle', () => {
      const result = getActiveMedicationsFromBundle(undefined);

      expect(result).toEqual({ activeMedications: [], medicationMap: {} });
    });

    it('should return empty results for bundle with no entries', () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
      };

      const result = getActiveMedicationsFromBundle(bundle);

      expect(result).toEqual({ activeMedications: [], medicationMap: {} });
    });

    it('should return empty results for bundle with empty entry array', () => {
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      const result = getActiveMedicationsFromBundle(bundle);

      expect(result).toEqual({ activeMedications: [], medicationMap: {} });
    });

    it('should filter only active and on-hold MedicationRequest entries', () => {
      const activeMed: FhirMedicationRequest = {
        resourceType: 'MedicationRequest',
        id: 'req-1',
        status: 'active',
        intent: 'order',
        subject: {},
      };
      const onHoldMed: FhirMedicationRequest = {
        resourceType: 'MedicationRequest',
        id: 'req-2',
        status: 'on-hold',
        intent: 'order',
        subject: {},
      };

      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: activeMed }, { resource: onHoldMed }],
      };

      const result = getActiveMedicationsFromBundle(bundle);

      expect(result.activeMedications).toHaveLength(2);
      expect(result.activeMedications[0].id).toBe('req-1');
      expect(result.activeMedications[1].id).toBe('req-2');
    });

    it('should exclude completed/stopped/cancelled MedicationRequests', () => {
      const completedMed: FhirMedicationRequest = {
        resourceType: 'MedicationRequest',
        id: 'req-1',
        status: 'completed',
        intent: 'order',
        subject: {},
      };
      const stoppedMed: FhirMedicationRequest = {
        resourceType: 'MedicationRequest',
        id: 'req-2',
        status: 'stopped',
        intent: 'order',
        subject: {},
      };
      const cancelledMed: FhirMedicationRequest = {
        resourceType: 'MedicationRequest',
        id: 'req-3',
        status: 'cancelled',
        intent: 'order',
        subject: {},
      };

      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          { resource: completedMed },
          { resource: stoppedMed },
          { resource: cancelledMed },
        ],
      };

      const result = getActiveMedicationsFromBundle(bundle);

      expect(result.activeMedications).toHaveLength(0);
    });

    it('should build medication map from Medication resources with IDs', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        code: { text: 'Paracetamol' },
      };

      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: medication }],
      };

      const result = getActiveMedicationsFromBundle(bundle);

      expect(result.medicationMap).toEqual({ 'med-1': medication });
    });

    it('should skip Medication resources without IDs', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        code: { text: 'NoIdMed' },
      };

      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: medication }],
      };

      const result = getActiveMedicationsFromBundle(bundle);

      expect(result.medicationMap).toEqual({});
    });

    it('should handle bundle with both MedicationRequest and Medication entries', () => {
      const activeMed: FhirMedicationRequest = {
        resourceType: 'MedicationRequest',
        id: 'req-1',
        status: 'active',
        intent: 'order',
        subject: {},
      };
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        code: { text: 'Paracetamol' },
      };

      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: activeMed }, { resource: medication }],
      };

      const result = getActiveMedicationsFromBundle(bundle);

      expect(result.activeMedications).toHaveLength(1);
      expect(result.activeMedications[0].id).toBe('req-1');
      expect(result.medicationMap).toEqual({ 'med-1': medication });
    });
  });
});
