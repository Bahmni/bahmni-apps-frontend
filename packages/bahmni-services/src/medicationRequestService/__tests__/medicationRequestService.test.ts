import {
  MedicationRequest as FhirMedicationRequest,
  Bundle,
  Medication,
} from 'fhir/r4';
import { get } from '../../api';
import { VACCINES_URL } from '../constants';
import {
  getPatientMedications,
  fetchMedicationOrdersMetadata,
  searchMedications,
  getVaccinations,
} from '../medicationRequestService';
import { MedicationStatus, MedicationOrdersMetadataResponse } from '../models';

jest.mock('../../api');

const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
function createMockMedicationRequest(
  overrides: Partial<FhirMedicationRequest> = {},
): FhirMedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    id: 'default-id',
    status: 'active',
    subject: {
      reference: 'Patient/test-patient',
      display: 'Test Patient',
    },
    medicationReference: {
      reference: 'Medication/med-1',
      display: 'Aspirin 100mg',
    },
    authoredOn: '2025-03-25T06:48:32+00:00',
    requester: {
      reference: 'Practitioner/practitioner-1',
      display: 'Dr. Smith',
    },
    priority: 'routine',
    dosageInstruction: [
      {
        text: '{"instructions":"As directed","additionalInstructions":"Take with food"}',
        timing: {
          event: ['2025-03-25T06:48:32+00:00'],
          code: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/timing-abbreviation',
                code: 'BID',
                display: 'Twice daily',
              },
            ],
          },
          repeat: {
            duration: 30,
            durationUnit: 'd',
          },
        },
        asNeededBoolean: false,
        route: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '26643006',
              display: 'Oral',
            },
          ],
          text: 'Oral',
        },
        doseAndRate: [
          {
            doseQuantity: {
              value: 100,
              unit: 'mg',
            },
          },
        ],
      },
    ],
    dispenseRequest: {
      quantity: {
        value: 30,
        unit: 'tablets',
      },
      validityPeriod: {
        start: '2025-03-25T06:48:32+00:00',
        end: '2025-04-25T06:48:32+00:00',
      },
    },
    ...overrides,
  } as FhirMedicationRequest;
}

const createMockBundle = (
  medications: FhirMedicationRequest[] = [],
): Bundle => ({
  resourceType: 'Bundle',
  id: 'bundle-id',
  type: 'searchset',
  total: medications.length,
  entry: medications.map((medication) => ({
    resource: medication,
    fullUrl: `http://example.com/MedicationRequest/${medication.id}`,
  })),
});

describe('medicationRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getPatientMedications', () => {
    describe('Happy Path Cases', () => {
      it('should return array of formatted medications with all fields populated', async () => {
        const mockMedications = [
          createMockMedicationRequest({
            id: 'medication-1',
            medicationReference: {
              display: 'Aspirin 100mg',
              reference: 'Medication/med-1',
            },
            status: 'active',
            priority: 'urgent',
          }),
          createMockMedicationRequest({
            id: 'medication-2',
            medicationReference: {
              display: 'Metformin 500mg',
              reference: 'Medication/med-2',
            },
            status: 'completed',
            priority: 'routine',
          }),
        ];
        const mockBundle = createMockBundle(mockMedications);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(get).toHaveBeenCalledWith(expect.stringContaining(patientUUID));
        expect(result).toHaveLength(2);

        // First medication assertions
        expect(result[0].id).toBe('medication-1');
        expect(result[0].name).toBe('Aspirin 100mg');
        expect(result[0].status).toBe(MedicationStatus.Active);
        expect(result[0].priority).toBe('urgent');
        expect(result[0].dose).toEqual({ value: 100, unit: 'mg' });
        expect(result[0].frequency).toBe('Twice daily');
        expect(result[0].route).toBe('Oral');
        expect(result[0].duration).toEqual({
          duration: 30,
          durationUnit: 'd',
        });
        expect(result[0].startDate).toBe('2025-03-25T06:48:32+00:00');
        expect(result[0].orderDate).toBe('2025-03-25T06:48:32+00:00');
        expect(result[0].orderedBy).toBe('Dr. Smith');
        expect(result[0].instructions).toBe('As directed');
        expect(result[0].additionalInstructions).toBe('Take with food');
        expect(result[0].asNeeded).toBe(false);

        // Second medication assertions
        expect(result[1].id).toBe('medication-2');
        expect(result[1].name).toBe('Metformin 500mg');
        expect(result[1].status).toBe(MedicationStatus.Completed);
      });

      it('should handle empty bundle gracefully', async () => {
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result).toEqual([]);
      });

      it('maps all FHIR statuses correctly', async () => {
        const mockMedications = [
          createMockMedicationRequest({ id: '1', status: 'active' }),
          createMockMedicationRequest({ id: '2', status: 'completed' }),
          createMockMedicationRequest({ id: '3', status: 'stopped' }),
          createMockMedicationRequest({ id: '4', status: 'draft' }),
          createMockMedicationRequest({ id: '5', status: 'entered-in-error' }),
          createMockMedicationRequest({ id: '6', status: 'cancelled' }),
          createMockMedicationRequest({ id: '7', status: 'unknown' }),
          createMockMedicationRequest({ id: '8', status: 'on-hold' }),
        ];
        (get as jest.Mock).mockResolvedValueOnce(
          createMockBundle(mockMedications),
        );

        const result = await getPatientMedications(patientUUID);
        expect(result[0].status).toBe(MedicationStatus.Active);
        expect(result[1].status).toBe(MedicationStatus.Completed);
        expect(result[2].status).toBe(MedicationStatus.Stopped);
        expect(result[3].status).toBe(MedicationStatus.Draft);
        expect(result[4].status).toBe(MedicationStatus.EnteredInError);
        expect(result[5].status).toBe(MedicationStatus.Cancelled);
        expect(result[6].status).toBe(MedicationStatus.Unknown);
        expect(result[7].status).toBe(MedicationStatus.OnHold);
      });

      it('should extract dose information correctly', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'dose-test',
          dosageInstruction: [
            {
              doseAndRate: [
                {
                  doseQuantity: {
                    value: 250,
                    unit: 'mcg',
                  },
                },
              ],
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].dose).toEqual({ value: 250, unit: 'mcg' });
      });

      it('should return empty string if priority is missing', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'no-route-coding-0',
          priority: undefined,
        });

        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].priority).toBe('');
      });

      it('should extract frequency from timing code display', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'frequency-test',
          dosageInstruction: [
            {
              timing: {
                code: {
                  coding: [
                    {
                      system:
                        'http://terminology.hl7.org/CodeSystem/timing-abbreviation',
                      code: 'QID',
                      display: 'Four times daily',
                    },
                  ],
                },
              },
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].frequency).toBe('Four times daily');
      });

      it('should extract route from text when available', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'route-text-test',
          dosageInstruction: [
            {
              route: {
                text: 'Subcutaneous route',
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '34206005',
                    display: 'Subcutaneous route',
                  },
                ],
              },
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].route).toBe('Subcutaneous route');
      });

      it('should fallback to coding display for route when text is not available', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'route-coding-test',
          dosageInstruction: [
            {
              route: {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '78421000',
                    display: 'Intramuscular route',
                  },
                ],
              },
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].route).toBe('Intramuscular route');
      });

      it('should extract duration information correctly', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'duration-test',
          dosageInstruction: [
            {
              timing: {
                repeat: {
                  duration: 14,
                  durationUnit: 'wk',
                },
              },
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].duration).toEqual({
          duration: 14,
          durationUnit: 'wk',
        });
      });

      it('should extract notes from parsed JSON text', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'notes-test',
          dosageInstruction: [
            {
              text: '{"instructions":"As directed","additionalInstructions":"Monitor liver function"}',
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].instructions).toBe('As directed');
        expect(result[0].additionalInstructions).toBe('Monitor liver function');
      });

      it('should extract quantity from dispenseRequest correctly', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'quantity-test',
          dispenseRequest: {
            quantity: {
              value: 60,
              unit: 'capsules',
            },
            validityPeriod: {
              start: '2025-03-25T06:48:32+00:00',
              end: '2025-04-25T06:48:32+00:00',
            },
          },
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].quantity).toEqual({ value: 60, unit: 'capsules' });
      });

      it('should detect immediate timing correctly', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'immediate-test',
          dosageInstruction: [
            {
              timing: {
                code: {
                  text: 'Immediately',
                },
              },
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].isImmediate).toBe(true);
      });

      it('should detect immediate timing correctly when priority is stat', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'immediate-test',
          priority: 'stat',
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].isImmediate).toBe(true);
      });

      it('should set authoredOn date as start date for immediate medication', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'immediate-test',
          priority: 'stat',
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].startDate).toBe('2025-03-25T06:48:32+00:00');
      });

      it('should handle asNeeded boolean correctly', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'as-needed-test',
          dosageInstruction: [
            {
              asNeededBoolean: true,
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].asNeeded).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing doseAndRate in dosageInstruction', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'no-dose-rate',
          dosageInstruction: [
            {
              text: 'Apply topically',
              // doseAndRate is missing
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].dose).toEqual({ value: 0, unit: '' });
      });

      it('should return empty string if additionalInstructions is missing in parsed JSON text', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'notes-no-additional',
          dosageInstruction: [
            {
              text: '{"instructions":"Do not skip doses"}',
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].instructions).toBe('Do not skip doses');
        expect(result[0].additionalInstructions).toBe('');
      });

      it('should return empty string if dosageInstruction text is invalid JSON', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'notes-invalid-json',
          dosageInstruction: [
            {
              text: '{not-a-valid-json}',
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].instructions).toBe('');
      });

      it('should return empty string if dosageInstruction text is missing or falsy', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'notes-missing-text',
          dosageInstruction: [
            {
              // no text field
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].instructions).toBe('');
      });

      it('should handle missing doseQuantity in doseAndRate', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'no-dose-quantity',
          dosageInstruction: [
            {
              doseAndRate: [
                {
                  // doseQuantity is missing
                },
              ],
            },
          ],
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].dose).toEqual({ value: 0, unit: '' });
      });
    });
    it('should handle missing repeat in timing', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'no-repeat',
        dosageInstruction: [
          {
            timing: {
              // repeat is missing
            },
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].duration).toEqual({
        duration: 0,
        durationUnit: '',
      });
    });

    it('should handle bundle with no entries property', async () => {
      const bundleWithoutEntries: Bundle = {
        resourceType: 'Bundle',
        id: 'bundle-id',
        type: 'searchset',
        total: 0,
        // entry property is missing
      };
      (get as jest.Mock).mockResolvedValueOnce(bundleWithoutEntries);

      const result = await getPatientMedications(patientUUID);

      expect(result).toEqual([]);
    });

    it('should handle empty patient UUID', async () => {
      const emptyUUID = '';
      const emptyBundle = createMockBundle([]);
      (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

      const result = await getPatientMedications(emptyUUID);

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/MedicationRequest?_sort=-_lastUpdated&_count=100&patient=',
      );
      expect(result).toEqual([]);
    });

    it('should handle special characters in patient UUID', async () => {
      const specialUUID = 'patient-uuid-with-special-chars-@#$%';
      const emptyBundle = createMockBundle([]);
      (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

      const result = await getPatientMedications(specialUUID);

      expect(get).toHaveBeenCalledWith(expect.stringContaining(specialUUID));
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON in dosageInstruction text', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'invalid-json',
        dosageInstruction: [
          {
            text: 'invalid json string',
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      expect(async () => {
        await getPatientMedications(patientUUID);
      }).not.toThrow();
    });

    it('should handle missing coding array in timing code', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'no-timing-coding',
        dosageInstruction: [
          {
            timing: {
              code: {
                // coding array is missing
              },
            },
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].frequency).toBe('');
    });

    it('should handle missing dispenseRequest entirely', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'no-dispense-request',
        dispenseRequest: undefined,
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].quantity).toEqual({ value: 0, unit: '' });
    });

    it('should handle missing quantity in dispenseRequest', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'no-quantity-in-dispense',
        dispenseRequest: {
          validityPeriod: {
            start: '2025-03-25T06:48:32+00:00',
            end: '2025-04-25T06:48:32+00:00',
          },
          // quantity is missing
        },
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].quantity).toEqual({ value: 0, unit: '' });
    });

    it('should return empty route when route coding is missing', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'no-route-coding',
        dosageInstruction: [
          {
            route: {
              // coding array is missing
            },
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].route).toBe('');
    });

    it('should return empty route when route coding array is empty', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'empty-route-coding',
        dosageInstruction: [
          {
            route: {
              coding: [],
            },
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].route).toBe('');
    });

    it('should handle missing instructions field in JSON but present additionalInstructions', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'notes-no-instructions',
        dosageInstruction: [
          {
            text: '{"additionalInstructions":"Take with meals"}',
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].instructions).toBe('');
      expect(result[0].additionalInstructions).toBe('Take with meals');
    });

    it('should handle both instructions and additionalInstructions present in JSON', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'both-instructions',
        dosageInstruction: [
          {
            text: '{"instructions":"Take as prescribed","additionalInstructions":"Do not exceed recommended dose"}',
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].instructions).toBe('Take as prescribed');
      expect(result[0].additionalInstructions).toBe(
        'Do not exceed recommended dose',
      );
    });

    it('should handle JSON with extra unexpected fields', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'extra-json-fields',
        dosageInstruction: [
          {
            text: '{"instructions":"Follow dosing schedule","additionalInstructions":"Monitor side effects","extraField":"ignored","anotherField":123}',
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].instructions).toBe('Follow dosing schedule');
      expect(result[0].additionalInstructions).toBe('Monitor side effects');
    });

    it('should handle missing asNeededBoolean defaulting to false', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'no-as-needed',
        dosageInstruction: [
          {
            // asNeededBoolean is missing
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].asNeeded).toBe(false);
    });

    it('should handle missing timing code text defaulting to false for isImmediate', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'no-timing-text',
        dosageInstruction: [
          {
            timing: {
              code: {
                coding: [
                  {
                    system:
                      'http://terminology.hl7.org/CodeSystem/timing-abbreviation',
                    code: 'BID',
                    display: 'Twice daily',
                  },
                ],
                // text is missing
              },
            },
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0].isImmediate).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle API call failure', async () => {
      const apiError = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(apiError);

      await expect(getPatientMedications(patientUUID)).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle malformed bundle response', async () => {
      const malformedBundle = {
        // Missing required properties
        notAValidBundle: true,
      };
      (get as jest.Mock).mockResolvedValueOnce(malformedBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result).toEqual([]);
    });

    it('should handle JSON parsing errors in notes extraction', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'json-parse-error',
        dosageInstruction: [
          {
            text: '{"instructions":"As directed","additionalInstructions":"Take with food"}', // Invalid JSON
          },
        ],
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      // Should not throw an error
      await expect(getPatientMedications(patientUUID)).resolves.toBeDefined();
    });
  });

  describe('Data Transformation', () => {
    it('should preserve all original FHIR data in the transformed output', async () => {
      const mockMedication = createMockMedicationRequest({
        id: 'transformation-test',
        status: 'active',
        priority: 'urgent',
        authoredOn: '2025-03-25T10:30:00Z',
      });
      const mockBundle = createMockBundle([mockMedication]);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getPatientMedications(patientUUID);

      expect(result[0]).toMatchObject({
        id: 'transformation-test',
        status: MedicationStatus.Active,
        priority: 'urgent',
        orderDate: '2025-03-25T10:30:00Z',
      });
    });
  });

  describe('fetchMedicationOrdersMetadata', () => {
    const mockMetadataResponse: MedicationOrdersMetadataResponse = {
      doseUnits: [
        { uuid: 'dose-unit-1', name: 'mg' },
        { uuid: 'dose-unit-2', name: 'ml' },
      ],
      routes: [
        { uuid: 'route-1', name: 'Oral' },
        { uuid: 'route-2', name: 'IV' },
      ],
      durationUnits: [
        { uuid: 'duration-1', name: 'Day(s)' },
        { uuid: 'duration-2', name: 'Week(s)' },
      ],
      dispensingUnits: [
        { uuid: 'dispense-1', name: 'Tablet(s)' },
        { uuid: 'dispense-2', name: 'Capsule(s)' },
      ],
      dosingRules: ['rule1', 'rule2'],
      dosingInstructions: [
        { uuid: 'instruction-1', name: 'Before meals' },
        { uuid: 'instruction-2', name: 'After meals' },
      ],
      orderAttributes: [
        {
          uuid: 'attr-1',
          name: 'Temperature',
          dataType: 'Numeric',
          shortName: 'temp',
          units: '°C',
          conceptClass: 'Misc',
          hiNormal: '38',
          lowNormal: '36',
          set: false,
        },
      ],
      frequencies: [
        {
          uuid: 'freq-1',
          name: 'Once Daily',
          frequencyPerDay: 1,
        },
        {
          uuid: 'freq-2',
          name: 'Twice Daily',
          frequencyPerDay: 2,
        },
      ],
    };

    it('should fetch medication orders metadata successfully', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockMetadataResponse);

      const result = await fetchMedicationOrdersMetadata();

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/config/drugOrders',
      );
      expect(result).toEqual(mockMetadataResponse);
    });

    it('should return all metadata fields with proper structure', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockMetadataResponse);

      const result = await fetchMedicationOrdersMetadata();

      expect(result.doseUnits).toHaveLength(2);
      expect(result.routes).toHaveLength(2);
      expect(result.durationUnits).toHaveLength(2);
      expect(result.dispensingUnits).toHaveLength(2);
      expect(result.dosingRules).toHaveLength(2);
      expect(result.dosingInstructions).toHaveLength(2);
      expect(result.orderAttributes).toHaveLength(1);
      expect(result.frequencies).toHaveLength(2);
    });

    it('should handle empty metadata arrays', async () => {
      const emptyMetadata: MedicationOrdersMetadataResponse = {
        doseUnits: [],
        routes: [],
        durationUnits: [],
        dispensingUnits: [],
        dosingRules: [],
        dosingInstructions: [],
        orderAttributes: [],
        frequencies: [],
      };
      (get as jest.Mock).mockResolvedValueOnce(emptyMetadata);

      const result = await fetchMedicationOrdersMetadata();

      expect(result).toEqual(emptyMetadata);
      expect(result.doseUnits).toEqual([]);
      expect(result.routes).toEqual([]);
    });

    it('should properly map order attributes with all fields', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockMetadataResponse);

      const result = await fetchMedicationOrdersMetadata();

      expect(result.orderAttributes[0]).toMatchObject({
        uuid: 'attr-1',
        name: 'Temperature',
        dataType: 'Numeric',
        shortName: 'temp',
        units: '°C',
        conceptClass: 'Misc',
        hiNormal: '38',
        lowNormal: '36',
        set: false,
      });
    });
  });

  describe('searchMedications', () => {
    const createMedicationBundle = (
      medications: Medication[],
    ): Bundle<Medication> => ({
      resourceType: 'Bundle',
      type: 'searchset',
      total: medications.length,
      entry: medications.map((med) => ({
        resource: med,
        fullUrl: `http://example.com/Medication/${med.id}`,
      })),
    });

    const createMockMedication = (id: string, display: string): Medication => ({
      resourceType: 'Medication',
      id,
      code: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '123456',
            display,
          },
        ],
        text: display,
      },
    });

    it('should search medications with default count', async () => {
      const mockMedications = [
        createMockMedication('med-1', 'Aspirin 100mg'),
        createMockMedication('med-2', 'Paracetamol 500mg'),
      ];
      const mockBundle = createMedicationBundle(mockMedications);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await searchMedications('aspirin');

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/Medication?name=aspirin&_count=20',
      );
      expect(result).toEqual(mockBundle);
      expect(result.entry).toHaveLength(2);
    });

    it('should search medications with custom count', async () => {
      const mockMedications = [createMockMedication('med-1', 'Aspirin 100mg')];
      const mockBundle = createMedicationBundle(mockMedications);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await searchMedications('aspirin', 50);

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/Medication?name=aspirin&_count=50',
      );
      expect(result).toEqual(mockBundle);
    });

    it('should handle empty search results', async () => {
      const emptyBundle = createMedicationBundle([]);
      (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

      const result = await searchMedications('nonexistentdrug');

      expect(result.total).toBe(0);
      expect(result.entry).toEqual([]);
    });

    it('should encode special characters in search term', async () => {
      const emptyBundle = createMedicationBundle([]);
      (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

      await searchMedications('aspirin & paracetamol');

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/Medication?name=aspirin%20%26%20paracetamol&_count=20',
      );
    });

    it('should handle multiple medications in search results', async () => {
      const mockMedications = [
        createMockMedication('med-1', 'Aspirin 100mg'),
        createMockMedication('med-2', 'Aspirin 500mg'),
        createMockMedication('med-3', 'Aspirin Complex'),
      ];
      const mockBundle = createMedicationBundle(mockMedications);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await searchMedications('aspirin');

      expect(result.entry).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });

  describe('getVaccinations', () => {
    const createVaccineBundle = (
      vaccines: Medication[],
    ): Bundle<Medication> => ({
      resourceType: 'Bundle',
      type: 'searchset',
      total: vaccines.length,
      entry: vaccines.map((vaccine) => ({
        resource: vaccine,
        fullUrl: `http://example.com/Medication/${vaccine.id}`,
      })),
    });

    const createMockVaccine = (id: string, display: string): Medication => ({
      resourceType: 'Medication',
      id,
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/cvx',
            code: '03',
            display,
          },
        ],
        text: display,
      },
    });

    it('should fetch vaccinations successfully', async () => {
      const mockVaccines = [
        createMockVaccine('vaccine-1', 'COVID-19 Vaccine'),
        createMockVaccine('vaccine-2', 'Influenza Vaccine'),
      ];
      const mockBundle = createVaccineBundle(mockVaccines);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getVaccinations();

      expect(get).toHaveBeenCalledWith(VACCINES_URL);
      expect(result).toEqual(mockBundle);
      expect(result.entry).toHaveLength(2);
    });

    it('should handle empty vaccination list', async () => {
      const emptyBundle = createVaccineBundle([]);
      (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

      const result = await getVaccinations();

      expect(result.total).toBe(0);
      expect(result.entry).toEqual([]);
    });

    it('should use correct FHIR endpoint with CVX code system', async () => {
      const mockBundle = createVaccineBundle([]);
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      await getVaccinations();

      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('http://hl7.org/fhir/sid/cvx'),
      );
    });
  });
});
