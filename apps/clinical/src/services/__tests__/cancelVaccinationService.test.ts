import { get, post } from '@bahmni/services';
import { Bundle, ValueSet } from 'fhir/r4';
import { fetchCancelReasons, cancelVaccination } from '../cancelVaccinationService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  get: jest.fn(),
  post: jest.fn(),
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;

describe('cancelVaccinationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCancelReasons', () => {
    it('should return cancel reasons from ValueSet expand', async () => {
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
          ],
        },
      };

      mockGet
        .mockResolvedValueOnce(searchBundle)
        .mockResolvedValueOnce(expandedValueSet);

      const result = await fetchCancelReasons();

      expect(result).toEqual([
        { uuid: 'reason-1', display: 'Adverse reaction' },
        { uuid: 'reason-2', display: 'Patient request' },
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

      const result = await fetchCancelReasons();

      expect(result).toEqual([]);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when search bundle has no entries', async () => {
      const bundleNoEntries: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
      };

      mockGet.mockResolvedValueOnce(bundleNoEntries);

      const result = await fetchCancelReasons();

      expect(result).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchCancelReasons();

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

      const result = await fetchCancelReasons();

      expect(result).toEqual([{ uuid: '', display: '' }]);
    });
  });

  describe('cancelVaccination', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date(2025, 5, 10));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call POST with correct endpoint and Parameters resource', async () => {
      const mockResponse = {
        resourceType: 'MedicationRequest' as const,
        id: 'med-req-1',
        status: 'stopped' as const,
        intent: 'order' as const,
        subject: { reference: 'Patient/patient-1' },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await cancelVaccination({
        medicationRequestId: 'med-req-1',
        reason: 'Adverse reaction',
        note: 'Patient developed rash',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/MedicationRequest/med-req-1/$stop',
        {
          resourceType: 'Parameters',
          parameter: [
            { name: 'reason', valueString: 'Adverse reaction' },
            { name: 'effectiveDate', valueDate: '2025-06-10' },
            { name: 'note', valueString: 'Patient developed rash' },
          ],
        },
      );

      expect(result).toEqual(mockResponse);
    });

    it('should omit note parameter when note is undefined', async () => {
      mockPost.mockResolvedValueOnce({});

      await cancelVaccination({
        medicationRequestId: 'med-req-3',
        reason: 'Drug interaction',
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const paramNames = calledParams.parameter.map(
        (p: { name: string }) => p.name,
      );

      expect(paramNames).not.toContain('note');
      expect(calledParams.parameter).toHaveLength(2);
    });

    it('should set effectiveDate to today', async () => {
      mockPost.mockResolvedValueOnce({});

      await cancelVaccination({
        medicationRequestId: 'med-1',
        reason: 'test',
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const valueDate = calledParams.parameter.find(
        (p: { name: string }) => p.name === 'effectiveDate',
      ).valueDate;

      expect(valueDate).toBe('2025-06-10');
    });
  });
});
