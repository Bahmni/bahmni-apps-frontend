import {
  extractMedicationCodes,
  medicationsMatchByCode,
  extractDoseForm,
} from '../medicationUtilities';

describe('Medication Utilities', () => {
  describe('extractMedicationCodes', () => {
    test('extracts codes from Medication.code field', () => {
      const medication = {
        id: 'med-1',
        code: {
          text: 'Paracetamol 500mg',
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
              display: 'Paracetamol 500 mg',
            },
          ],
        },
      };

      const codes = extractMedicationCodes(medication);

      expect(codes).toHaveLength(1);
      expect(codes[0]).toEqual({
        code: 'paracetamol-500',
        system: 'http://snomed.info/sct',
      });
    });

    test('extracts codes from MedicationRequest.medicationCodeableConcept', () => {
      const medicationRequest = {
        id: 'mr-1',
        medicationCodeableConcept: {
          coding: [
            {
              code: 'aspirin-100',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const codes = extractMedicationCodes(medicationRequest);

      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe('aspirin-100');
    });

    test('matches medications with complex names using FHIR codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          text: 'Sulphadoxine - Pyrimethamine (250 mg + 12.5 mg)',
          coding: [
            {
              code: '398770008',
              system: 'http://snomed.info/sct',
              display: 'Sulfamethoxazole-trimethoprim',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          text: 'Trimethoprim-Sulfamethoxazole 250/50mg',
          coding: [
            {
              code: '398770008',
              system: 'http://snomed.info/sct',
              display: 'Sulfamethoxazole-trimethoprim',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(true);
    });

    test('returns empty array when medication is undefined', () => {
      const codes = extractMedicationCodes(undefined);

      expect(codes).toEqual([]);
    });
  });

  describe('medicationsMatchByCode', () => {
    test('matches medications with identical SNOMED codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(true);
    });

    test('does not match medications with different codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: 'paracetamol-500',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [
            {
              code: 'ibuprofen-400',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(false);
    });

    test('matches OpenMRS concepts by code value alone', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: '5000',
            },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [
            {
              code: '5000',
            },
          ],
        },
      };

      const matches = medicationsMatchByCode(med1, med2);

      expect(matches).toBe(true);
    });
  });

  describe('extractDoseForm', () => {
    test('extracts from form.text', () => {
      const medication = { form: { text: 'Tablet' } };
      expect(extractDoseForm(medication, 'Paracetamol')).toBe('Tablet');
    });

    test('extracts from form.coding[0].display', () => {
      const medication = { form: { coding: [{ display: 'Capsule' }] } };
      expect(extractDoseForm(medication, 'Aspirin')).toBe('Capsule');
    });

    test('extracts from display name as fallback', () => {
      expect(extractDoseForm({}, 'Paracetamol (Tablet) - 500mg')).toBe(
        'Tablet',
      );
    });

    test('does not extract numeric values', () => {
      expect(extractDoseForm({}, 'Medication (500mg)')).toBeUndefined();
    });

    test('prefers form property over display name', () => {
      const medication = { form: { text: 'Capsule' } };
      expect(extractDoseForm(medication, 'Paracetamol (Tablet) - 500mg')).toBe(
        'Capsule',
      );
    });
  });
});
