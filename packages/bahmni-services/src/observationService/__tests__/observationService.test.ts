import * as api from '../../api';
import { FHIR_OBSERVATION_URL } from '../constants';
import { getPatientObservations } from '../observationService';

jest.mock('../../api');

describe('observationService', () => {
  describe('getPatientObservations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call API with correct patient and concept UUIDs', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1', 'concept-2'];
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientObservations(patientUuid, conceptCodes);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(patientUuid, conceptCodes),
      );
    });

    it('should return observation bundle from API', async () => {
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      const result = await getPatientObservations('patient-123', ['concept-1']);

      expect(result).toEqual(mockBundle);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(
        getPatientObservations('patient-123', ['concept-1']),
      ).rejects.toThrow(mockError);
    });

    it('should handle empty concept array', async () => {
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      const result = await getPatientObservations('patient-123', []);

      expect(result).toEqual(mockBundle);
      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL('patient-123', []),
      );
    });
  });
});
