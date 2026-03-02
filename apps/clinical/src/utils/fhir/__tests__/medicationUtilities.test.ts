import {
  Medication,
  MedicationRequest as FhirMedicationRequest,
} from 'fhir/r4';

import { MedicationInputEntry } from '../../../models/medication';
import {
  checkMedicationsOverlap,
  extractMedicationCodes,
  isDuplicateMedication,
  medicationsMatchByConceptCode,
  medicationsMatchById,
  extractDoseForm,
} from '../medicationUtilities';

const makeMedication = (
  id: string,
  code?: string,
  system = 'http://snomed.info/sct',
): Medication => ({
  resourceType: 'Medication',
  id,
  code: {
    coding: [{ code: code ?? id, system }],
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
  medicationReference: { reference: 'Medication/backend-ref' },
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

const makeActiveMedWithRef = (
  refId: string,
  startDate = '2025-01-01',
  duration = 7,
  durationUnit = 'd',
  extraOverrides: Partial<FhirMedicationRequest> = {},
): FhirMedicationRequest =>
  makeActiveMed({
    medicationReference: { reference: `Medication/${refId}` },
    dosageInstruction: [
      {
        timing: {
          event: [startDate],
          repeat: { duration, durationUnit },
        },
      },
    ],
    ...extraOverrides,
  });

const makeMedMap = (
  ...pairs: [string, Medication][]
): Record<string, Medication> => Object.fromEntries(pairs);

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

      const matches = medicationsMatchByConceptCode(med1, med2);

      expect(matches).toBe(true);
    });

    test('returns empty array when medication is undefined', () => {
      const codes = extractMedicationCodes(undefined);

      expect(codes).toEqual([]);
    });
  });

  describe('medicationsMatchByConceptCode', () => {
    test('matches medications with identical SNOMED codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            { code: 'paracetamol-500', system: 'http://snomed.info/sct' },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [
            { code: 'paracetamol-500', system: 'http://snomed.info/sct' },
          ],
        },
      };

      expect(medicationsMatchByConceptCode(med1, med2)).toBe(true);
    });

    test('does not match medications with different codes', () => {
      const med1 = {
        id: 'med-1',
        code: {
          coding: [
            { code: 'paracetamol-500', system: 'http://snomed.info/sct' },
          ],
        },
      };

      const med2 = {
        id: 'med-2',
        code: {
          coding: [{ code: 'ibuprofen-400', system: 'http://snomed.info/sct' }],
        },
      };

      expect(medicationsMatchByConceptCode(med1, med2)).toBe(false);
    });

    test('matches OpenMRS concepts by code value alone', () => {
      const med1 = { id: 'med-1', code: { coding: [{ code: '5000' }] } };
      const med2 = { id: 'med-2', code: { coding: [{ code: '5000' }] } };

      expect(medicationsMatchByConceptCode(med1, med2)).toBe(true);
    });
  });

  describe('medicationsMatchById', () => {
    test('matches medications with the same ID', () => {
      const med1 = { id: 'med-paracetamol-500', code: {} };
      const med2 = { id: 'med-paracetamol-500', code: {} };

      expect(medicationsMatchById(med1, med2)).toBe(true);
    });

    test('does not match medications with different IDs', () => {
      const med1 = { id: 'med-paracetamol-500', code: {} };
      const med2 = { id: 'med-paracetamol-650', code: {} };

      expect(medicationsMatchById(med1, med2)).toBe(false);
    });

    test('returns false when either medication is null or undefined', () => {
      const med = { id: 'med-1', code: {} };

      expect(medicationsMatchById(null, med)).toBe(false);
      expect(medicationsMatchById(med, null)).toBe(false);
      expect(medicationsMatchById(null, null)).toBe(false);
      expect(medicationsMatchById(undefined, undefined)).toBe(false);
    });

    test('returns false when either medication has no ID', () => {
      const medWithId = { id: 'med-1', code: {} };
      const medWithoutId = { code: {} };

      expect(medicationsMatchById(medWithId, medWithoutId)).toBe(false);
      expect(medicationsMatchById(medWithoutId, medWithId)).toBe(false);
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
    test('returns false for empty selected medications', () => {
      const result = checkMedicationsOverlap([], [], {});

      expect(result).toBe(false);
    });

    test('returns true when same medication is added twice with overlapping dates', () => {
      const med = makeMedication('med-paracetamol-500');
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

    test('returns true when a STAT medication is paired with same medication', () => {
      const med = makeMedication('med-paracetamol-500');
      const entry1 = makeEntry({ medication: med, isSTAT: true });
      const entry2 = makeEntry({ medication: med });

      const result = checkMedicationsOverlap([entry1, entry2], [], {});

      expect(result).toBe(true);
    });

    test('returns true when selected STAT medication matches an active backend medication', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const statEntry = makeEntry({
        medication: medResource,
        isSTAT: true,
        startDate: new Date('2025-01-03'),
        duration: 7,
      });
      const activeMed = makeActiveMedWithRef('med-paracetamol-500-ref');
      const medicationMap = makeMedMap([
        'med-paracetamol-500-ref',
        medResource,
      ]);

      const result = checkMedicationsOverlap(
        [statEntry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('returns true when active backend medication is STAT and selected medication is the same drug', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const regularEntry = makeEntry({
        medication: medResource,
        startDate: new Date('2025-01-03'),
        duration: 7,
      });
      const statActiveMed = makeActiveMedWithRef(
        'med-paracetamol-500-ref',
        '2025-01-01',
        7,
        'd',
        { priority: 'stat' },
      );
      const medicationMap = makeMedMap([
        'med-paracetamol-500-ref',
        medResource,
      ]);

      const result = checkMedicationsOverlap(
        [regularEntry],
        [statActiveMed],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('returns true when PRN medications with same ID have overlapping dates', () => {
      const med = makeMedication('med-paracetamol-500');
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

      expect(result).toBe(true);
    });

    test('returns true when selected medication overlaps with active backend medication', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const entry = makeEntry({
        medication: medResource,
        startDate: new Date('2025-01-03'),
        duration: 7,
      });
      const activeMed = makeActiveMedWithRef('med-paracetamol-500-ref');
      const medicationMap = makeMedMap([
        'med-paracetamol-500-ref',
        medResource,
      ]);

      const result = checkMedicationsOverlap(
        [entry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('returns false when same medication has non-overlapping dates', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const entry = makeEntry({
        medication: medResource,
        startDate: new Date('2025-02-01'),
        duration: 7,
      });
      const activeMed = makeActiveMedWithRef('med-paracetamol-500-ref');
      const medicationMap = makeMedMap([
        'med-paracetamol-500-ref',
        medResource,
      ]);

      const result = checkMedicationsOverlap(
        [entry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('returns false when different medications have overlapping dates', () => {
      const med1 = makeMedication('med-paracetamol-500');
      const med2 = makeMedication('med-ibuprofen-400');
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

    test('returns false for different formulations of the same concept with overlapping dates', () => {
      const paracetamol500 = makeMedication(
        'med-paracetamol-500',
        'paracetamol-concept',
      );
      const paracetamol650 = makeMedication(
        'med-paracetamol-650',
        'paracetamol-concept',
      );
      const entry1 = makeEntry({
        medication: paracetamol500,
        startDate: new Date('2025-01-01'),
        duration: 7,
      });
      const entry2 = makeEntry({
        medication: paracetamol650,
        startDate: new Date('2025-01-01'),
        duration: 7,
      });

      const result = checkMedicationsOverlap([entry1, entry2], [], {});

      expect(result).toBe(false);
    });

    test('returns false for different formulations against active backend medication', () => {
      const paracetamol500 = makeMedication(
        'med-paracetamol-500',
        'paracetamol-concept',
      );
      const paracetamol650 = makeMedication(
        'med-paracetamol-650',
        'paracetamol-concept',
      );
      const entry = makeEntry({
        medication: paracetamol650,
        startDate: new Date('2025-01-03'),
        duration: 7,
      });
      const activeMed = makeActiveMedWithRef('backend-ref');
      const medicationMap = makeMedMap(['backend-ref', paracetamol500]);

      const result = checkMedicationsOverlap(
        [entry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('handles duration=0 by defaulting to 1', () => {
      const med = makeMedication('med-paracetamol-500');
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

    test('detects duplicate when existing backend med was ordered yesterday for 1 day and new med is for today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const medResource = makeMedication('med-albendazole-200');
      const entry = makeEntry({
        medication: medResource,
        startDate: today,
        duration: 1,
      });
      const activeMed = makeActiveMedWithRef(
        'med-albendazole-200-ref',
        yesterday.toISOString(),
        1,
      );
      const medicationMap = makeMedMap([
        'med-albendazole-200-ref',
        medResource,
      ]);

      const result = checkMedicationsOverlap(
        [entry],
        [activeMed],
        medicationMap,
      );

      expect(result).toBe(true);
    });
  });

  describe('isDuplicateMedication', () => {
    test('returns false when no matching medications exist', () => {
      const newMed = makeMedication('med-paracetamol-500');

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

    test('returns true when same medication is active with overlapping dates', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const activeMed = makeActiveMedWithRef('backend-ref');
      const medicationMap = makeMedMap(['backend-ref', medResource]);

      const result = isDuplicateMedication(
        medResource,
        new Date('2025-01-03'),
        7,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('returns true when same medication is already selected', () => {
      const med = makeMedication('med-paracetamol-500');
      const selectedEntry = makeEntry({ medication: med });

      const result = isDuplicateMedication(
        med,
        new Date('2025-01-01'),
        7,
        'd',
        [],
        [selectedEntry],
        {},
      );

      expect(result).toBe(true);
    });

    test('returns false for different formulation already selected', () => {
      const newMed = makeMedication(
        'med-paracetamol-650',
        'paracetamol-concept',
      );
      const selectedMed = makeMedication(
        'med-paracetamol-500',
        'paracetamol-concept',
      );
      const selectedEntry = makeEntry({ medication: selectedMed });

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-01-01'),
        7,
        'd',
        [],
        [selectedEntry],
        {},
      );

      expect(result).toBe(false);
    });

    test('returns true when existing active medication is STAT', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const activeMed = makeActiveMedWithRef(
        'backend-ref',
        '2025-01-01',
        7,
        'd',
        {
          priority: 'stat',
        },
      );
      const medicationMap = makeMedMap(['backend-ref', medResource]);

      const result = isDuplicateMedication(
        medResource,
        new Date('2025-03-01'),
        7,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('returns false when dates do not overlap', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const activeMed = makeActiveMedWithRef('backend-ref', '2025-01-01', 3);
      const medicationMap = makeMedMap(['backend-ref', medResource]);

      const result = isDuplicateMedication(
        medResource,
        new Date('2025-02-01'),
        7,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('returns false for different formulation active in backend with overlapping dates', () => {
      const newMed = makeMedication(
        'med-paracetamol-650',
        'paracetamol-concept',
      );
      const existingMed = makeMedication(
        'med-paracetamol-500',
        'paracetamol-concept',
      );
      const activeMed = makeActiveMedWithRef('backend-ref');
      const medicationMap = makeMedMap(['backend-ref', existingMed]);

      const result = isDuplicateMedication(
        newMed,
        new Date('2025-01-03'),
        7,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(false);
    });

    test('handles duration=0 by defaulting to 1', () => {
      const medResource = makeMedication('med-paracetamol-500');
      const activeMed = makeActiveMedWithRef('backend-ref');
      const medicationMap = makeMedMap(['backend-ref', medResource]);

      const result = isDuplicateMedication(
        medResource,
        new Date('2025-01-01'),
        0,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(true);
    });

    test('detects duplicate when existing med was ordered yesterday for 1 day and new med is for today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const medResource = makeMedication('med-albendazole-200');
      const activeMed = makeActiveMedWithRef(
        'backend-ref',
        yesterday.toISOString(),
        1,
      );
      const medicationMap = makeMedMap(['backend-ref', medResource]);

      const result = isDuplicateMedication(
        medResource,
        today,
        1,
        'd',
        [activeMed],
        [],
        medicationMap,
      );

      expect(result).toBe(true);
    });
  });
});
