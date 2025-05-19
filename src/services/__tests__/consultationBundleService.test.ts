import {
  postConsultationBundle,
  createConsultationBundlePayload,
} from '../consultationBundleService';
import { post } from '../api';

jest.mock('../api');

describe('consultationBundleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postConsultationBundle', () => {
    it('should call post with the correct URL and payload', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockBundle = { resourceType: 'ConsultationBundle' } as any;
      const mockResponse = { status: 'success' };

      (post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postConsultationBundle(mockBundle);

      expect(post).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ConsultationBundle`,
        mockBundle,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createConsultationBundlePayload', () => {
    it('should create a valid consultation bundle payload', () => {
      // Mock crypto.randomUUID to return a fixed value for testing
      const originalRandomUUID = crypto.randomUUID;
      global.crypto.randomUUID = jest
        .fn()
        .mockReturnValue('1d87ab20-8b86-4b41-a30d-984b2208d945');

      // Mock date to return a fixed timestamp for testing
      const originalDate = global.Date;
      const mockDate = new Date('2025-03-21T15:02:26.605+05:30');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.prototype = originalDate.prototype;
      global.Date.now = originalDate.now;
      mockDate.toISOString = jest
        .fn()
        .mockReturnValue('2025-03-21T15:02:26.605+05:30');

      const patientUUID = '1571ac14-f055-4830-8bb2-7d15c2cde753';
      const practitionerUUID = 'd7a67c17-5e07-11ef-8f7c-0242ac120002';
      const parentEncounterUUID = '00af0da4-4de7-4b30-905f-bcaf791ffdb5';
      const locationUUID = '5e232c47-8ff5-4c5c-8057-7e39a64fefa5';
      const encounterTypeUUID = 'd34fe3ab-5e07-11ef-8f7c-0242ac120002';
      const encounterTypeDisplay = 'Consultation';

      const result = createConsultationBundlePayload(
        patientUUID,
        practitionerUUID,
        parentEncounterUUID,
        locationUUID,
        encounterTypeUUID,
        encounterTypeDisplay,
      );

      expect(result).toEqual({
        resourceType: 'ConsultationBundle',
        id: '1d87ab20-8b86-4b41-a30d-984b2208d945',
        type: 'transaction',
        timestamp: '2025-03-21T15:02:26.605+05:30',
        entry: [
          {
            fullUrl: 'urn:uuid:1d87ab20-8b86-4b41-a30d-984b2208d945',
            resource: {
              resourceType: 'Encounter',
              identifier: [
                {
                  use: 'temp',
                  value: '1d87ab20-8b86-4b41-a30d-984b2208d945',
                },
              ],
              status: 'in-progress',
              class: {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                code: 'AMB',
                display: 'ambulatory',
              },
              meta: {
                tag: [
                  {
                    system: 'http://fhir.openmrs.org/ext/encounter-tag',
                    code: 'encounter',
                    display: 'Encounter',
                  },
                ],
              },
              type: [
                {
                  coding: [
                    {
                      system:
                        'http://fhir.openmrs.org/code-system/encounter-type',
                      code: 'd34fe3ab-5e07-11ef-8f7c-0242ac120002',
                      display: 'Consultation',
                    },
                  ],
                },
              ],
              subject: {
                reference: 'Patient/1571ac14-f055-4830-8bb2-7d15c2cde753',
              },
              participant: [
                {
                  individual: {
                    reference:
                      'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
                    type: 'Practitioner',
                  },
                },
              ],
              partOf: {
                reference: 'Encounter/00af0da4-4de7-4b30-905f-bcaf791ffdb5',
              },
              location: [
                {
                  location: {
                    reference: 'Location/5e232c47-8ff5-4c5c-8057-7e39a64fefa5',
                  },
                },
              ],
              period: {
                start: '2025-03-21T15:02:26.605+05:30',
              },
            },
            request: {
              method: 'POST',
              url: 'Encounter',
            },
          },
        ],
      });

      // Restore original implementations
      global.crypto.randomUUID = originalRandomUUID;
      global.Date = originalDate;
    });
  });
});
