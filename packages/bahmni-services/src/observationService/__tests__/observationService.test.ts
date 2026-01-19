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

    it('should return observation bundle', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        entry: [
          {
            resourceType: 'Observation',
            id: 'f001',
            identifier: [
              {
                use: 'official',
                system: 'http://www.bmc.nl/zorgportal/identifiers/observations',
                value: '6323',
              },
            ],
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '15074-8',
                  display: 'Glucose [Moles/volume] in Blood',
                },
              ],
            },
            subject: {
              reference: 'Patient/f001',
              display: 'P. van de Heuvel',
            },
            effectiveDateTime: '2013-04-02T09:30:10+01:00',
            issued: '2013-04-03T15:30:10+01:00',
            performer: [
              {
                reference: 'Practitioner/f005',
                display: 'A. Langeveld',
              },
            ],
            valueQuantity: {
              value: 6.3,
              unit: 'mmol/l',
              system: 'http://unitsofmeasure.org',
              code: 'mmol/L',
            },
            interpretation: [
              {
                coding: [
                  {
                    system:
                      'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                    code: 'H',
                    display: 'High',
                  },
                ],
              },
            ],
            referenceRange: [
              {
                low: {
                  value: 3.1,
                  unit: 'mmol/l',
                  system: 'http://unitsofmeasure.org',
                  code: 'mmol/L',
                },
                high: {
                  value: 6.2,
                  unit: 'mmol/l',
                  system: 'http://unitsofmeasure.org',
                  code: 'mmol/L',
                },
              },
            ],
          },
        ],
      };
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
  });
});
