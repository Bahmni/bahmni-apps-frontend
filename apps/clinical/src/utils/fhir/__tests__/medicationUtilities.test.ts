import {
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';

import { MedicationInputEntry } from '../../../models/medication';
import {
  checkMedicationsOverlap,
  extractMedicationCodes,
  isDuplicateMedication,
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

  describe('checkMedicationsOverlap', () => {
    const makeMedication = (
      code: string,
      system = 'http://snomed.info/sct',
    ): Medication => ({
      resourceType: 'Medication',
      id: `med-${code}`,
      code: {
        coding: [{ code, system }],
      },
    });

    const makeEntry = (
      overrides: Partial<MedicationInputEntry> & { medication: Medication },
    ): MedicationInputEntry => ({
      id: `entry-${Math.random().toString(36).slice(2)}`,
      display: 'Test Medication',
      dosage: 1,
      dosageUnit: null,
      frequency: null,
      instruction: null,
      route: null,
      duration: 7,
      durationUnit: { code: 'd', display: 'Day(s)', daysMultiplier: 1 },
      isSTAT: false,
      isPRN: false,
      startDate: new Date('2025-01-01'),
      dispenseQuantity: 10,
      dispenseUnit: null,
      errors: {},
      hasBeenValidated: false,
      ...overrides,
    });

    const makeActiveMed = (
      overrides: Partial<FhirMedicationRequest> = {},
    ): FhirMedicationRequest => ({
      resourceType: 'MedicationRequest',
      id: `mr-${Math.random().toString(36).slice(2)}`,
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/test-patient' },
      medicationReference: { reference: 'Medication/med-abc' },
      authoredOn: '2025-01-01',
      dosageInstruction: [
        {
          timing: {
            event: ['2025-01-01'],
            repeat: { duration: 7, durationUnit: 'd' },
          },
        },
      ],
      ...overrides,
    });

    test('returns false for empty selected medications', () => {
      const result = checkMedicationsOverlap([], [], {});

      expect(result).toBe(false);
    });

    test('returns true when two selected medications with same FHIR code have overlapping dates', () => {
      const med = makeMedication('paracetamol-500');
      const entry1 = makeEntry({
        medication: med,
        startDate: new Date('2025-01-01'),
        duration: 7,
      });
      const entry2 = makeEntry({
        medication: med,
        startDate: new Date('2025-01-05'),
        duration: 7,
      });

      const result = checkMedicationsOverlap([entry1, entry2], [], {});

      expect(result).toBe(true);
    });

    test('returns false when a STAT medication is paired with another selected medication with same code', () => {
      const med = makeMedication('paracetamol-500');
      const entry1 = makeEntry({ medication: med, isSTAT: true });
      const entry2 = makeEntry({ medication: med });

      const result = checkMedicationsOverlap([entry1, entry2], [], {});

      expect(result).toBe(false);
    });

    test('returns false when selected STAT medication matches an active backend medication with same code', () => {
      const medResource = makeMedication('paracetamol-500');
      const statEntry = makeEntry({
        medication: medResource,
        isSTAT: true,
        startDate: new Date('2025-01-03'),
        duration: 7,
      });
      const activeMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        dosageInstruction: [
          {
            timing: {
              event: ['2025-01-01'],
              repeat: { duration: 7, durationUnit: 'd' },
            },
          },
        ],
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': medResource,
      };

      const result = checkMedicationsOverlap(
        [statEntry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('returns false when active backend medication is STAT and selected medication has same code', () => {
      const medResource = makeMedication('paracetamol-500');
      const regularEntry = makeEntry({
        medication: medResource,
        startDate: new Date('2025-01-03'),
        duration: 7,
      });
      const statActiveMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        priority: 'stat',
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': medResource,
      };

      const result = checkMedicationsOverlap(
        [regularEntry],
        [statActiveMed],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('returns false when PRN medications have same code', () => {
      const med = makeMedication('paracetamol-500');
      const entry1 = makeEntry({
        medication: med,
        isPRN: true,
        startDate: new Date('2025-01-01'),
        duration: 7,
      });
      const entry2 = makeEntry({
        medication: med,
        isPRN: true,
        startDate: new Date('2025-01-05'),
        duration: 7,
      });

      const result = checkMedicationsOverlap([entry1, entry2], [], {});

      expect(result).toBe(false);
    });

    test('returns true when selected medication overlaps with existing backend medication', () => {
      const medResource = makeMedication('paracetamol-500');
      const entry = makeEntry({
        medication: medResource,
        startDate: new Date('2025-01-03'),
        duration: 7,
      });
      const activeMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        dosageInstruction: [
          {
            timing: {
              event: ['2025-01-01'],
              repeat: { duration: 7, durationUnit: 'd' },
            },
          },
        ],
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': medResource,
      };

      const result = checkMedicationsOverlap(
        [entry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('returns false when selected and existing medications have same code but non-overlapping dates', () => {
      const medResource = makeMedication('paracetamol-500');
      const entry = makeEntry({
        medication: medResource,
        startDate: new Date('2025-02-01'),
        duration: 7,
      });
      const activeMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        dosageInstruction: [
          {
            timing: {
              event: ['2025-01-01'],
              repeat: { duration: 7, durationUnit: 'd' },
            },
          },
        ],
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': medResource,
      };

      const result = checkMedicationsOverlap(
        [entry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('returns false when medications have different codes', () => {
      const med1 = makeMedication('paracetamol-500');
      const med2 = makeMedication('ibuprofen-400');
      const entry1 = makeEntry({
        medication: med1,
        startDate: new Date('2025-01-01'),
        duration: 7,
      });
      const entry2 = makeEntry({
        medication: med2,
        startDate: new Date('2025-01-01'),
        duration: 7,
      });

      const result = checkMedicationsOverlap([entry1, entry2], [], {});

      expect(result).toBe(false);
    });

    test('handles duration=0 by defaulting to 1', () => {
      const med = makeMedication('paracetamol-500');
      const entry1 = makeEntry({
        medication: med,
        startDate: new Date('2025-01-01'),
        duration: 0,
      });
      const entry2 = makeEntry({
        medication: med,
        startDate: new Date('2025-01-01'),
        duration: 0,
      });

      const result = checkMedicationsOverlap([entry1, entry2], [], {});

      expect(result).toBe(true);
    });
  });

  describe('isDuplicateMedication', () => {
    const makeMedication = (
      code: string,
      system = 'http://snomed.info/sct',
    ): Medication => ({
      resourceType: 'Medication',
      id: `med-${code}`,
      code: {
        coding: [{ code, system }],
      },
    });

    const makeEntry = (
      overrides: Partial<MedicationInputEntry> & { medication: Medication },
    ): MedicationInputEntry => ({
      id: `entry-${Math.random().toString(36).slice(2)}`,
      display: 'Test Medication',
      dosage: 1,
      dosageUnit: null,
      frequency: null,
      instruction: null,
      route: null,
      duration: 7,
      durationUnit: { code: 'd', display: 'Day(s)', daysMultiplier: 1 },
      isSTAT: false,
      isPRN: false,
      startDate: new Date('2025-01-01'),
      dispenseQuantity: 10,
      dispenseUnit: null,
      errors: {},
      hasBeenValidated: false,
      ...overrides,
    });

    const makeActiveMed = (
      overrides: Partial<FhirMedicationRequest> = {},
    ): FhirMedicationRequest => ({
      resourceType: 'MedicationRequest',
      id: `mr-${Math.random().toString(36).slice(2)}`,
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/test-patient' },
      medicationReference: { reference: 'Medication/active-1' },
      authoredOn: '2025-01-01',
      dosageInstruction: [
        {
          timing: {
            event: ['2025-01-01'],
            repeat: { duration: 7, durationUnit: 'd' },
          },
        },
      ],
      ...overrides,
    });

    test('returns false when no matching medications exist', () => {
      const newMed = makeMedication('paracetamol-500');

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-01-01'),
        7,
        'd',
        [],
        [],
        {},
      );

      expect(result).toBe(false);
    });

    test('returns true when new medication matches existing active medication by code with overlapping dates', () => {
      const newMed = makeMedication('paracetamol-500');
      const existingMedResource = makeMedication('paracetamol-500');
      const activeMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        dosageInstruction: [
          {
            timing: {
              event: ['2025-01-01'],
              repeat: { duration: 7, durationUnit: 'd' },
            },
          },
        ],
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': existingMedResource,
      };

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-01-03'),
        7,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('returns true when new medication matches an already-selected medication by code', () => {
      const newMed = makeMedication('paracetamol-500');
      const selectedEntry = makeEntry({
        medication: makeMedication('paracetamol-500'),
      });

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-01-01'),
        7,
        'd',
        [],
        [selectedEntry],
        {},
      );

      expect(result).toBe(true);
    });

    test('returns false when existing medication is STAT and codes match', () => {
      const newMed = makeMedication('paracetamol-500');
      const existingMedResource = makeMedication('paracetamol-500');
      const activeMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        priority: 'stat',
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': existingMedResource,
      };

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-03-01'),
        7,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('returns false when dates do not overlap even though codes match', () => {
      const newMed = makeMedication('paracetamol-500');
      const existingMedResource = makeMedication('paracetamol-500');
      const activeMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        dosageInstruction: [
          {
            timing: {
              event: ['2025-01-01'],
              repeat: { duration: 3, durationUnit: 'd' },
            },
          },
        ],
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': existingMedResource,
      };

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-02-01'),
        7,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('handles duration=0 by defaulting to 1', () => {
      const newMed = makeMedication('paracetamol-500');
      const existingMedResource = makeMedication('paracetamol-500');
      const activeMed = makeActiveMed({
        medicationReference: { reference: 'Medication/active-1' },
        dosageInstruction: [
          {
            timing: {
              event: ['2025-01-01'],
              repeat: { duration: 7, durationUnit: 'd' },
            },
          },
        ],
      });
      const medicationMap: Record<string, Medication> = {
        'active-1': existingMedResource,
      };

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-01-01'),
        0,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(true);
    });
  });
});
