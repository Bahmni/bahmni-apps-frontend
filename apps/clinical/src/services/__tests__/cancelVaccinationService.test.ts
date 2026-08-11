import { post } from '@bahmni/services';
import { cancelVaccination } from '../cancelVaccinationService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  post: jest.fn(),
}));

const mockPost = post as jest.MockedFunction<typeof post>;

describe('cancelVaccinationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date(2025, 5, 10));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('cancelVaccination', () => {
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
            {
              name: 'reason',
              valueCodeableConcept: { text: 'Adverse reaction' },
            },
            { name: 'effectiveDate', valueDate: '2025-06-10' },
            { name: 'note', valueString: 'Patient developed rash' },
          ],
        },
      );

      expect(result).toEqual(mockResponse);
    });

    it('should include the encounter parameter when encounterUuid is provided', async () => {
      mockPost.mockResolvedValueOnce({});

      await cancelVaccination({
        medicationRequestId: 'med-req-2',
        reason: 'Patient request',
        encounterUuid: 'encounter-uuid-1',
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      expect(calledParams.parameter).toContainEqual({
        name: 'encounter',
        valueString: 'encounter-uuid-1',
      });
    });

    it('should omit the encounter parameter when encounterUuid is undefined', async () => {
      mockPost.mockResolvedValueOnce({});

      await cancelVaccination({
        medicationRequestId: 'med-req-2',
        reason: 'Patient request',
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const paramNames = calledParams.parameter.map(
        (p: { name: string }) => p.name,
      );

      expect(paramNames).not.toContain('encounter');
    });

    it('should omit the note parameter when note is undefined', async () => {
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

    it('should send the reason as a valueCodeableConcept with the reason text', async () => {
      mockPost.mockResolvedValueOnce({});

      await cancelVaccination({
        medicationRequestId: 'med-1',
        reason: 'Allergy',
      });

      const calledParams = mockPost.mock.calls[0][1] as any;
      const reasonParam = calledParams.parameter.find(
        (p: { name: string }) => p.name === 'reason',
      );

      expect(reasonParam.valueCodeableConcept).toEqual({ text: 'Allergy' });
    });

    it('should return the MedicationRequest response', async () => {
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
        reason: 'reason',
      });

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('stopped');
    });
  });
});
