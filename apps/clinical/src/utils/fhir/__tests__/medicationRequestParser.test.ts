import { MedicationRequest as FhirMedicationRequest } from 'fhir/r4';
import { DURATION_UNIT_OPTIONS } from '../../../components/forms/medicationRequest/constants';
import { MedicationConfig } from '../../../models/medicationConfig';
import { parseFhirToMedicationInputEntry } from '../medicationRequestParser';

const mockConfig: MedicationConfig = {
  doseUnits: [
    { name: 'mg', uuid: 'dose-unit-mg' },
    { name: 'ml', uuid: 'dose-unit-ml' },
  ],
  routes: [
    { name: 'Oral', uuid: 'route-oral' },
    { name: 'Intravenous', uuid: 'route-iv' },
  ],
  frequencies: [
    { name: 'Twice a day', uuid: 'freq-bd', frequencyPerDay: 2 },
    { name: 'Immediately', uuid: '0', frequencyPerDay: 0 },
  ],
  dosingInstructions: [
    { name: 'Before meals', uuid: 'instr-before-meals' },
    { name: 'After meals', uuid: 'instr-after-meals' },
  ],
  durationUnits: [],
  dispensingUnits: [],
  dosingRules: [],
  orderAttributes: [],
} as unknown as MedicationConfig;

const createMockFhirMedRequest = (
  overrides?: Partial<FhirMedicationRequest>,
): FhirMedicationRequest => ({
  resourceType: 'MedicationRequest',
  id: 'med-req-123',
  status: 'active',
  intent: 'order',
  priority: 'routine',
  subject: { reference: 'Patient/patient-1' },
  medicationReference: {
    reference: 'Medication/med-456',
    display: 'Paracetamol 500mg (Tablet)',
  },
  dosageInstruction: [
    {
      doseAndRate: [
        {
          doseQuantity: {
            value: 2,
            code: 'dose-unit-mg',
          },
        },
      ],
      timing: {
        code: {
          coding: [{ code: 'freq-bd', display: 'Twice a day' }],
        },
        repeat: {
          boundsPeriod: { start: '2026-05-10T00:00:00.000Z' },
          duration: 5,
          durationUnit: 'd',
        },
      },
      route: {
        coding: [{ code: 'route-oral', display: 'Oral' }],
      },
      asNeededBoolean: false,
      text: JSON.stringify({ instructions: 'Before meals' }),
    },
  ],
  dispenseRequest: {
    quantity: { value: 20, code: 'dose-unit-mg' },
  },
  note: [{ text: 'Take with water' }],
  ...overrides,
});

describe('parseFhirToMedicationInputEntry', () => {
  it('parses a complete FHIR MedicationRequest correctly', () => {
    const fhirMed = createMockFhirMedRequest();
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.id).toBe('med-req-123');
    expect(result.fhirResourceId).toBe('med-req-123');
    expect(result.display).toBe('Paracetamol 500mg (Tablet)');
    expect(result.dosage).toBe(2);
    expect(result.dosageUnit).toEqual({ name: 'mg', uuid: 'dose-unit-mg' });
    expect(result.frequency).toEqual({
      name: 'Twice a day',
      uuid: 'freq-bd',
      frequencyPerDay: 2,
    });
    expect(result.route).toEqual({ name: 'Oral', uuid: 'route-oral' });
    expect(result.duration).toBe(5);
    expect(result.durationUnit).toEqual(
      DURATION_UNIT_OPTIONS.find((u) => u.code === 'd'),
    );
    expect(result.instruction).toEqual({
      name: 'Before meals',
      uuid: 'instr-before-meals',
    });
    expect(result.isPRN).toBe(false);
    expect(result.isSTAT).toBe(false);
    expect(result.dispenseQuantity).toBe(20);
    expect(result.note).toBe('Take with water');
    expect(result.medication.id).toBe('med-456');
    expect(result.errors).toEqual({});
    expect(result.hasBeenValidated).toBe(false);
  });

  it('parses a STAT medication correctly', () => {
    const fhirMed = createMockFhirMedRequest({ priority: 'stat' });
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.isSTAT).toBe(true);
    expect(result.startDate).toBeInstanceOf(Date);
  });

  it('parses a PRN medication correctly', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.dosageInstruction![0].asNeededBoolean = true;
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.isPRN).toBe(true);
  });

  it('handles missing dosage gracefully', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.dosageInstruction = [{}];
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.dosage).toBe(0);
    expect(result.dosageUnit).toBeNull();
    expect(result.frequency).toBeNull();
    expect(result.route).toBeNull();
    expect(result.duration).toBe(0);
    expect(result.durationUnit).toBeNull();
  });

  it('handles missing medication reference display', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.medicationReference = { reference: 'Medication/med-456' };
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.display).toBe('Medication');
    expect(result.medication.id).toBe('med-456');
  });

  it('handles unknown concept UUIDs and names by returning null', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.dosageInstruction![0].doseAndRate![0].doseQuantity!.code =
      'unknown-uuid';
    fhirMed.dosageInstruction![0].doseAndRate![0].doseQuantity!.unit =
      'Unknown Unit';
    fhirMed.dosageInstruction![0].route!.coding![0].code = 'unknown-route';
    fhirMed.dosageInstruction![0].route!.coding![0].display = 'Unknown Route';
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.dosageUnit).toBeNull();
    expect(result.route).toBeNull();
  });

  it('handles missing instructions text', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.dosageInstruction![0].text = undefined;
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.instruction).toBeNull();
  });

  it('handles invalid instructions JSON', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.dosageInstruction![0].text = 'not-json';
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.instruction).toBeNull();
  });

  it('handles missing notes', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.note = undefined;
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.note).toBe('');
  });

  it('handles contained medication resource', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.contained = [
      {
        resourceType: 'Medication',
        id: 'contained-med',
        code: { text: 'Contained Med Name' },
        form: { text: 'Capsule' },
      },
    ];
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.medication.resourceType).toBe('Medication');
    expect(result.medication.id).toBe('contained-med');
  });

  it('parses start date from boundsPeriod', () => {
    const fhirMed = createMockFhirMedRequest();
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.startDate).toEqual(new Date('2026-05-10T00:00:00.000Z'));
  });

  it('handles missing dispenseRequest', () => {
    const fhirMed = createMockFhirMedRequest();
    fhirMed.dispenseRequest = undefined;
    const result = parseFhirToMedicationInputEntry(fhirMed, mockConfig);

    expect(result.dispenseQuantity).toBe(0);
    expect(result.dispenseUnit).toBeNull();
  });
});
