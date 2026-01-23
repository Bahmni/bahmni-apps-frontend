import { Bundle, Medication } from 'fhir/r4';
import {
  FHIR_MEDICATION_EXTENSION_URL,
  FHIR_MEDICATION_NAME_EXTENSION_URL,
} from '../../constants/fhir';
import {
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
});
