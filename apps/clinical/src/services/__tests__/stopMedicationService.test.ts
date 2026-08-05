import { get, post } from '@bahmni/services';
import { Bundle, ValueSet } from 'fhir/r4';
import { fetchStopReasons, stopMedication } from '../stopMedicationService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  get: jest.fn(),
  post: jest.fn(),
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;

describe('stopMedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStopReasons', () => {
    it('should return stop reasons from ValueSet expand', async () => {
      const searchBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ValueSet',
              id: 'vs-uuid-1',
              status: 'active',
            } as ValueSet,
          },
        ],
      };

      const expandedValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'vs-uuid-1',
        status: 'active',
        expansion: {
          timestamp: '2025-01-01',
          contains: [
            { code: 'reason-1', display: 'Adverse reaction' },
            { code: 'reason-2', display: 'Patient request' },
            { code: 'reason-3', display: 'Drug interaction' },
          ],
        },
      };

      mockGet
        .mockResolvedValueOnce(searchBundle)
        .mockResolvedValueOnce(expandedValueSet);

      const result = await fetchStopReasons();

      expect(result).toEqual([
        { uuid: 'reason-1', display: 'Adverse reaction' },
        { uuid: 'reason-2', display: 'Patient request' },
        { uuid: 'reason-3', display: 'Drug interaction' },
      ]);

      expect(mockGet).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/ValueSet?title=Stopped%20Order%20Reason',
      );
      expect(mockGet).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/ValueSet/vs-uuid-1/$expand',
      );
    });

    it('should return empty array when ValueSet not found', async () => {
      const emptyBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      mockGet.mockResolvedValueOnce(emptyBundle);

      const result = await fetchStopReasons();

      expect(result).toEqual([]);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when search bundle has no entries', async () => {
      const bundleNoEntries: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
      };

      mockGet.mockResolvedValueOnce(bundleNoEntries);

      const result = await fetchStopReasons();

      expect(result).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchStopReasons();

      expect(result).toEqual([]);
    });

    it('should handle missing code/display in contains gracefully', async () => {
      const searchBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ValueSet',
              id: 'vs-uuid-1',
              status: 'active',
            } as ValueSet,
          },
        ],
      };

      const expandedValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'vs-uuid-1',
        status: 'active',
        expansion: {
          timestamp: '2025-01-01',
          contains: [{ system: 'http://example.com' }],
        },
      };

      mockGet
        .mockResolvedValueOnce(searchBundle)
        .mockResolvedValueOnce(expandedValueSet);

      const result = await fetchStopReasons();

      expect(result).toEqual([{ uuid: '', display: '' }]);
    });
  });

  describe('stopMedication', () => {
    it('should call POST with correct endpoint and Parameters resource', async () => {
      const mockResponse = {
        resourceType: 'MedicationRequest' as const,
        id: 'med-req-1',
        status: 'stopped' as const,
        intent: 'order' as const,
        subject: { reference: 'Patient/patient-1' },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const params = {
        medicationRequestId: 'med-req-1',
        reason: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
        effectiveDate: new Date('2025-06-10'),
        note: 'Patient developed rash',
      };

      const result = await stopMedication(params);

      expect(mockPost).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/MedicationRequest/med-req-1/$stop',
        {
          resourceType: 'Parameters',
          parameter: [
            {
              name: 'reason',
              valueCodableConcept: {
                coding: [
                  { code: 'reason-uuid-1', display: 'Adverse reaction' },
                ],
                text: 'Adverse reaction',
              },
            },
            { name: 'effectiveDate', valueDate: '2025-06-10' },
            { name: 'note', valueString: 'Patient developed rash' },
          ],
        },
      );

      expect(result).toEqual(mockResponse);
    });

    it('should include reason and effectiveDate in parameters', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication({
        medicationRequestId: 'med-req-2',
        reason: { uuid: 'reason-uuid-2', display: 'Patient request' },
        effectiveDate: new Date('2025-12-25'),
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const paramNames = calledParams.parameter.map(
        (p: { name: string }) => p.name,
      );

      expect(paramNames).toContain('reason');
      expect(paramNames).toContain('effectiveDate');
      expect(
        calledParams.parameter.find(
          (p: { name: string }) => p.name === 'reason',
        ).valueCodableConcept.text,
      ).toBe('Patient request');
      expect(
        calledParams.parameter.find(
          (p: { name: string }) => p.name === 'effectiveDate',
        ).valueDate,
      ).toBe('2025-12-25');
    });

    it('should omit note parameter when note is undefined', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication({
        medicationRequestId: 'med-req-3',
        reason: { uuid: 'reason-uuid-3', display: 'Drug interaction' },
        effectiveDate: new Date('2025-06-10'),
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const paramNames = calledParams.parameter.map(
        (p: { name: string }) => p.name,
      );

      expect(paramNames).not.toContain('note');
      expect(calledParams.parameter).toHaveLength(2);
    });

    it('formats effectiveDate using local date parts (not UTC) to avoid timezone off-by-one', async () => {
      mockPost.mockResolvedValueOnce({});

      // new Date(year, month, day) creates local midnight — toISOString() would produce
      // the previous day's date in UTC-offset timezones (e.g., UTC-1 → 2025-06-09T23:00Z).
      // Local getters must be used instead.
      const localMidnight = new Date(2025, 5, 10); // June 10 local midnight

      await stopMedication({
        medicationRequestId: 'med-1',
        reason: { uuid: 'reason-uuid-1', display: 'test' },
        effectiveDate: localMidnight,
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const valueDate = calledParams.parameter.find(
        (p: { name: string }) => p.name === 'effectiveDate',
      ).valueDate;

      expect(valueDate).toBe('2025-06-10');
    });

    it('should return MedicationRequest response', async () => {
      const mockResponse = {
        resourceType: 'MedicationRequest' as const,
        id: 'med-req-1',
        status: 'stopped' as const,
        intent: 'order' as const,
        subject: { reference: 'Patient/patient-1' },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await stopMedication({
        medicationRequestId: 'med-req-1',
        reason: { uuid: 'reason-uuid-1', display: 'reason' },
        effectiveDate: new Date('2025-01-01'),
      });

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('stopped');
    });
  });
});
