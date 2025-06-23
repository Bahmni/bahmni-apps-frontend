import { getPatientMedications } from '../medicationService';
import { get } from '../api';
import { MedicationStatus } from '@types/medication';
import { MedicationRequest, Bundle, Medication, Practitioner } from 'fhir/r4';
import notificationService from '../notificationService';
import { getFormattedError } from '@utils/common';

jest.mock('../api');
jest.mock('../notificationService');
jest.mock('@utils/common');

describe('medicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    // Setup default mock for getFormattedError
    (getFormattedError as jest.Mock).mockReturnValue({
      title: 'Error',
      message: 'An error occurred',
    });
  });

  describe('getPatientMedications', () => {
    const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

    const createMockMedicationRequest = (
      overrides: Partial<MedicationRequest> = {},
    ): MedicationRequest => ({
      resourceType: 'MedicationRequest',
      id: 'medication-1',
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
      dosageInstruction: [
        {
          text: 'Take one tablet daily',
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: 'day',
            },
          },
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
        validityPeriod: {
          start: '2025-03-25T06:48:32+00:00',
          end: '2025-04-25T06:48:32+00:00',
        },
        expectedSupplyDuration: {
          value: 30,
          unit: 'days',
        },
      },
      note: [
        {
          text: 'Take with food',
        },
      ],
      ...overrides,
    });

    const createMockMedication = (): Medication => ({
      resourceType: 'Medication',
      id: 'med-1',
      form: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '385055001',
            display: 'Tablet',
          },
        ],
        text: 'Tablet',
      },
    });

    const createMockPractitioner = (): Practitioner => ({
      resourceType: 'Practitioner',
      id: 'practitioner-1',
      name: [
        {
          text: 'Dr. John Smith',
          given: ['John'],
          family: 'Smith',
        },
      ],
    });

    const createMockBundle = (
      medications: MedicationRequest[] = [],
      includedResources: (Medication | Practitioner)[] = [],
    ): Bundle => ({
      resourceType: 'Bundle',
      id: 'bundle-id',
      type: 'searchset',
      total: medications.length + includedResources.length,
      entry: [
        ...medications.map((medication) => ({
          resource: medication,
          fullUrl: `http://example.com/MedicationRequest/${medication.id}`,
        })),
        ...includedResources.map((resource) => ({
          resource,
          fullUrl: `http://example.com/${resource.resourceType}/${resource.id}`,
        })),
      ],
    });

    describe('Happy Path Cases', () => {
      it('should return array of formatted medications', async () => {
        const mockMedications = [
          createMockMedicationRequest({
            id: 'medication-1',
            medicationReference: {
              display: 'Aspirin 100mg',
              reference: 'Medication/med-1',
            },
            status: 'active',
          }),
          createMockMedicationRequest({
            id: 'medication-2',
            medicationReference: {
              display: 'Metformin 500mg',
              reference: 'Medication/med-2',
            },
            status: 'completed',
          }),
        ];
        const mockBundle = createMockBundle(mockMedications, [
          createMockMedication(),
          createMockPractitioner(),
        ]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/MedicationRequest?patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('medication-1');
        expect(result[0].name).toBe('Aspirin 100mg');
        expect(result[0].status).toBe(MedicationStatus.Active);
        expect(result[0].isActive).toBe(true);
        expect(result[1].id).toBe('medication-2');
        expect(result[1].name).toBe('Metformin 500mg');
        expect(result[1].status).toBe(MedicationStatus.Completed);
        expect(result[1].isActive).toBe(false);
      });

      it('should handle empty bundle gracefully', async () => {
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result).toEqual([]);
      });

      it('should map medication statuses correctly', async () => {
        const mockMedications = [
          createMockMedicationRequest({ id: 'active-med', status: 'active' }),
          createMockMedicationRequest({
            id: 'completed-med',
            status: 'completed',
          }),
          createMockMedicationRequest({ id: 'stopped-med', status: 'stopped' }),
          createMockMedicationRequest({ id: 'draft-med', status: 'draft' }),
          createMockMedicationRequest({ id: 'onhold-med', status: 'on-hold' }),
          createMockMedicationRequest({
            id: 'unknown-med',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: 'unknown' as any,
          }),
        ];
        const mockBundle = createMockBundle(mockMedications);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].status).toBe(MedicationStatus.Active);
        expect(result[1].status).toBe(MedicationStatus.Completed);
        expect(result[2].status).toBe(MedicationStatus.Stopped);
        expect(result[3].status).toBe(MedicationStatus.Scheduled);
        expect(result[4].status).toBe(MedicationStatus.Scheduled);
        expect(result[5].status).toBe(MedicationStatus.Scheduled); // defaults to scheduled
      });

      it('should extract medication details correctly', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'detailed-med',
          dosageInstruction: [
            {
              text: 'Take twice daily',
              timing: {
                repeat: {
                  frequency: 2,
                  period: 1,
                  periodUnit: 'day',
                },
              },
              route: {
                text: 'Oral',
                coding: [
                  {
                    code: '26643006',
                    display: 'Oral',
                    system: 'http://snomed.info/sct',
                  },
                ],
              },
              doseAndRate: [
                {
                  doseQuantity: {
                    value: 500,
                    unit: 'mg',
                  },
                },
              ],
            },
          ],
          dispenseRequest: {
            validityPeriod: {
              start: '2025-03-25T06:48:32+00:00',
            },
            expectedSupplyDuration: {
              value: 30,
              unit: 'days',
            },
          },
          note: [{ text: 'Take with food' }],
        });
        const mockBundle = createMockBundle(
          [mockMedication],
          [createMockMedication()],
        );

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].dose).toBe('500 mg');
        expect(result[0].frequency).toBe('2 / 1day');
        expect(result[0].route).toBe('Oral');
        expect(result[0].duration).toBe('30 days');
        expect(result[0].startDate).toBe('2025-03-25T06:48:32+00:00');
        expect(result[0].notes).toBe('Take with food');
        expect(result[0].form).toBe('Tablet');
      });

      it('should handle missing optional fields gracefully', async () => {
        const mockMedication = createMockMedicationRequest({
          id: 'minimal-med',
          dosageInstruction: undefined,
          dispenseRequest: undefined,
          note: undefined,
          authoredOn: undefined,
          requester: undefined,
        });
        const mockBundle = createMockBundle([mockMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].dose).toBe('');
        expect(result[0].frequency).toBe('');
        expect(result[0].route).toBe('');
        expect(result[0].duration).toBe('');
        expect(result[0].startDate).toBe('');
        expect(result[0].orderDate).toBe('');
        expect(result[0].orderedBy).toBe('');
        expect(result[0].notes).toBe('');
        expect(result[0].priority).toBe('');
        expect(result[0].form).toBe('');
      });

      it('should handle practitioner name extraction', async () => {
        const practitionerWithFullName = createMockPractitioner();
        const practitionerWithTextOnly: Practitioner = {
          resourceType: 'Practitioner',
          id: 'practitioner-2',
          name: [{ text: 'Dr. Jane Doe' }],
        };
        const practitionerWithGivenFamily: Practitioner = {
          resourceType: 'Practitioner',
          id: 'practitioner-3',
          name: [{ given: ['Alice'], family: 'Johnson' }],
        };

        const mockMedications = [
          createMockMedicationRequest({
            id: 'med-1',
            requester: { reference: 'Practitioner/practitioner-1' },
          }),
          createMockMedicationRequest({
            id: 'med-2',
            requester: { reference: 'Practitioner/practitioner-2' },
          }),
          createMockMedicationRequest({
            id: 'med-3',
            requester: { reference: 'Practitioner/practitioner-3' },
          }),
        ];

        const mockBundle = createMockBundle(mockMedications, [
          practitionerWithFullName,
          practitionerWithTextOnly,
          practitionerWithGivenFamily,
        ]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].orderedBy).toBe('Dr. John Smith');
        expect(result[1].orderedBy).toBe('Dr. Jane Doe');
        expect(result[2].orderedBy).toBe('Alice Johnson');
      });

      it('should filter out non-MedicationRequest resources from bundle', async () => {
        const bundle: Bundle = {
          resourceType: 'Bundle',
          id: 'bundle-id',
          type: 'searchset',
          total: 2,
          entry: [
            {
              resource: createMockMedicationRequest({ id: 'medication-1' }),
              fullUrl: 'http://example.com/MedicationRequest/medication-1',
            },
            {
              resource: {
                resourceType: 'Patient',
                id: 'patient-1',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
              fullUrl: 'http://example.com/Patient/patient-1',
            },
          ],
        };

        (get as jest.Mock).mockResolvedValueOnce(bundle);

        const result = await getPatientMedications(patientUUID);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('medication-1');
      });

      it('should return empty array when bundle has no entries', async () => {
        const bundleWithoutEntries: Bundle = {
          resourceType: 'Bundle',
          id: 'bundle-id',
          type: 'searchset',
          total: 0,
        };
        (get as jest.Mock).mockResolvedValueOnce(bundleWithoutEntries);

        const result = await getPatientMedications(patientUUID);

        expect(result).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      it('should handle API call failure and show notification', async () => {
        const apiError = new Error('API Error');
        (get as jest.Mock).mockRejectedValueOnce(apiError);
        (getFormattedError as jest.Mock).mockReturnValueOnce({
          title: 'Error Title',
          message: 'API Error',
        });

        const result = await getPatientMedications(patientUUID);

        expect(notificationService.showError).toHaveBeenCalledWith(
          'Error Title',
          'API Error',
        );
        expect(result).toEqual([]);
      });

      it('should handle invalid medication data and show notification', async () => {
        const invalidMedication = createMockMedicationRequest({
          id: undefined,
        });
        const mockBundle = createMockBundle([invalidMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);
        (getFormattedError as jest.Mock).mockReturnValueOnce({
          title: 'Validation Error',
          message: 'Incomplete medication data',
        });

        const result = await getPatientMedications(patientUUID);

        expect(notificationService.showError).toHaveBeenCalledWith(
          'Validation Error',
          'Incomplete medication data',
        );
        expect(result).toEqual([]);
      });

      it('should handle missing medication id', async () => {
        const invalidMedication = createMockMedicationRequest({ id: '' });
        const mockBundle = createMockBundle([invalidMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);
        (getFormattedError as jest.Mock).mockReturnValueOnce({
          title: 'Validation Error',
          message: 'Incomplete medication data',
        });

        const result = await getPatientMedications(patientUUID);

        expect(result).toEqual([]);
      });

      it('should handle missing medication status', async () => {
        const invalidMedication = createMockMedicationRequest({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: undefined as any,
        });
        const mockBundle = createMockBundle([invalidMedication]);

        (get as jest.Mock).mockResolvedValueOnce(mockBundle);
        (getFormattedError as jest.Mock).mockReturnValueOnce({
          title: 'Validation Error',
          message: 'Incomplete medication data',
        });

        const result = await getPatientMedications(patientUUID);

        expect(result).toEqual([]);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty patient UUID', async () => {
        const emptyUUID = '';
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientMedications(emptyUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/MedicationRequest?patient=${emptyUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toEqual([]);
      });

      it('should handle special characters in patient UUID', async () => {
        const specialUUID = 'patient-uuid-with-special-chars-@#$%';
        const emptyBundle = createMockBundle([]);
        (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

        const result = await getPatientMedications(specialUUID);

        expect(get).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/MedicationRequest?patient=${specialUUID}&_count=100&_sort=-_lastUpdated`,
        );
        expect(result).toEqual([]);
      });

      it('should handle bundle with empty entry array', async () => {
        const bundleWithEmptyEntries: Bundle = {
          resourceType: 'Bundle',
          id: 'bundle-id',
          type: 'searchset',
          total: 0,
          entry: [],
        };
        (get as jest.Mock).mockResolvedValueOnce(bundleWithEmptyEntries);

        const result = await getPatientMedications(patientUUID);

        expect(result).toEqual([]);
      });

      it('should handle dose extraction edge cases', async () => {
        const medicationWithValueOnly = createMockMedicationRequest({
          id: 'med-value-only',
          dosageInstruction: [
            {
              doseAndRate: [
                {
                  doseQuantity: {
                    value: 100,
                    // unit is missing
                  },
                },
              ],
            },
          ],
        });

        const medicationWithoutDose = createMockMedicationRequest({
          id: 'med-no-dose',
          dosageInstruction: [
            {
              // doseAndRate is missing
            },
          ],
        });

        const mockBundle = createMockBundle([
          medicationWithValueOnly,
          medicationWithoutDose,
        ]);
        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].dose).toBe('100'); // value without unit
        expect(result[1].dose).toBe(''); // no dose info
      });

      it('should handle frequency extraction with text fallback', async () => {
        const medicationWithTextFrequency = createMockMedicationRequest({
          id: 'med-text-freq',
          dosageInstruction: [
            {
              text: 'Take as needed',
              timing: {
                // repeat is missing, should fall back to text
              },
            },
          ],
        });

        const mockBundle = createMockBundle([medicationWithTextFrequency]);
        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].frequency).toBe('Take as needed');
      });

      it('should handle route extraction with coding fallback', async () => {
        const medicationWithCodingRoute = createMockMedicationRequest({
          id: 'med-coding-route',
          dosageInstruction: [
            {
              route: {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '26643006',
                    display: 'Oral route',
                  },
                ],
                // text is missing, should use coding display
              },
            },
          ],
        });

        const mockBundle = createMockBundle([medicationWithCodingRoute]);
        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].route).toBe('Oral route');
      });

      it('should handle priority extraction from extensions', async () => {
        const medicationWithSTAT = createMockMedicationRequest({
          id: 'med-stat',
          dosageInstruction: [
            {
              extension: [{ valueCode: 'STAT' }],
            },
          ],
        });

        const medicationWithPRN = createMockMedicationRequest({
          id: 'med-prn',
          dosageInstruction: [
            {
              extension: [{ valueCode: 'PRN' }],
            },
          ],
        });

        const mockBundle = createMockBundle([
          medicationWithSTAT,
          medicationWithPRN,
        ]);
        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].priority).toBe('STAT');
        expect(result[1].priority).toBe('PRN');
      });

      it('should handle multiple notes correctly', async () => {
        const medicationWithMultipleNotes = createMockMedicationRequest({
          id: 'med-multi-notes',
          note: [
            { text: 'Take with food' },
            { text: 'Avoid alcohol' },
            { text: 'Monitor blood pressure' },
          ],
        });

        const mockBundle = createMockBundle([medicationWithMultipleNotes]);
        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].notes).toBe(
          'Take with food; Avoid alcohol; Monitor blood pressure',
        );
      });

      it('should handle isActive and isScheduled flags correctly', async () => {
        const mockMedications = [
          createMockMedicationRequest({ id: 'active-med', status: 'active' }),
          createMockMedicationRequest({ id: 'scheduled-med', status: 'draft' }),
          createMockMedicationRequest({
            id: 'completed-med',
            status: 'completed',
          }),
        ];

        const mockBundle = createMockBundle(mockMedications);
        (get as jest.Mock).mockResolvedValueOnce(mockBundle);

        const result = await getPatientMedications(patientUUID);

        expect(result[0].isActive).toBe(true);
        expect(result[0].isScheduled).toBe(false);
        expect(result[1].isActive).toBe(false);
        expect(result[1].isScheduled).toBe(true);
        expect(result[2].isActive).toBe(false);
        expect(result[2].isScheduled).toBe(false);
      });
    });
  });
});
