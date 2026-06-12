import { get, post } from '@bahmni/services';
import { Bundle, ValueSet } from 'fhir/r4';
import {
  STOP_REASON_VALUESET_URL,
  STOP_REASON_VALUESET_EXPAND_URL,
} from '../../constants/app';
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
    it('should return stop reasons from FHIR ValueSet expand', async () => {
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

      const result = await fetchStopReasons();

      expect(result).toEqual([
        { uuid: 'reason-1', display: 'Adverse reaction' },
        { uuid: 'reason-2', display: 'Patient request' },
      ]);
      expect(mockGet).toHaveBeenCalledWith(STOP_REASON_VALUESET_URL);
      expect(mockGet).toHaveBeenCalledWith(
        STOP_REASON_VALUESET_EXPAND_URL('vs-uuid-1'),
      );
    });

    it('should return empty array when ValueSet not found', async () => {
      mockGet.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      } as Bundle);

      const result = await fetchStopReasons();

      expect(result).toEqual([]);
    });

    it('should return empty array when API throws', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchStopReasons();

      expect(result).toEqual([]);
    });
  });

  describe('stopMedication', () => {
    it('calls stopMedication with correct params', async () => {
      const mockResponse = {
        resourceType: 'MedicationRequest' as const,
        id: 'med-req-1',
        status: 'stopped' as const,
        intent: 'order' as const,
        subject: { reference: 'Patient/patient-uuid-1' },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const params = {
        medicationRequestId: 'med-req-1',
        reason: 'Adverse reaction',
        effectiveDate: new Date('2025-06-10'),
        note: 'Patient developed rash',
      };

      const result = await stopMedication(params);

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

    it('should include reason and effectiveDate in parameters', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication({
        medicationRequestId: 'med-req-2',
        reason: 'Patient request',
        effectiveDate: new Date('2025-12-25'),
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const paramNames = calledParams.parameter.map(
        (p: { name: string }) => p.name,
      );

      expect(paramNames).toContain('reason');
      expect(paramNames).toContain('effectiveDate');
    });

    it('should omit note parameter when note is undefined', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication({
        medicationRequestId: 'med-req-3',
        reason: 'Drug interaction',
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

      const localMidnight = new Date(2025, 5, 10);

      await stopMedication({
        medicationRequestId: 'med-1',
        reason: 'test',
        effectiveDate: localMidnight,
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const valueDate = calledParams.parameter.find(
        (p: { name: string }) => p.name === 'effectiveDate',
      ).valueDate;

      expect(valueDate).toBe('2025-06-10');
    });
  });
});
