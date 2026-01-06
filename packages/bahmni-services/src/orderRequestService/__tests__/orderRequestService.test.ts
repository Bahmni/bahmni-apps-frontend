import type { Bundle, ServiceRequest } from 'fhir/r4';
import { get } from '../../api';
import { SERVICE_REQUESTS_URL } from '../constants';
import { getServiceRequests } from '../orderRequestService';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

const mockServiceRequestBundle: Bundle<ServiceRequest> = {
  resourceType: 'Bundle',
  id: '42235c1c-9f6a-4122-977c-ff7e1c3072b9',
  type: 'searchset',
  total: 3,
  entry: [
    {
      fullUrl:
        'http://localhost/openmrs/ws/fhir2/R4/ServiceRequest/4964b392-2d03-4ff2-870a-ad4ed177e59c',
      resource: {
        resourceType: 'ServiceRequest',
        id: '4964b392-2d03-4ff2-870a-ad4ed177e59c',
        status: 'completed',
        intent: 'order',
        category: [
          {
            coding: [
              {
                system: 'http://fhir.bahmni.org/code-system/order-type',
                code: '3f224d3e-afd7-4e90-8f14-34cf481b6d0f',
                display: 'Procedure Order',
              },
            ],
            text: 'Procedure Order',
          },
        ],
        priority: 'routine',
        code: {
          coding: [
            {
              code: '166105AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              display: 'Arthrodesis',
            },
          ],
          text: 'Arthrodesis',
        },
        subject: {
          reference: 'Patient/6db60a96-a688-4891-b9f6-59c78db52215',
          type: 'Patient',
          display: 'Shaik Jameela (Patient Identifier: PA000011)',
        },
      },
    },
  ],
};

describe('serviceRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SERVICE_REQUESTS_URL', () => {
    const category = '3f224d3e-afd7-4e90-8f14-34cf481b6d0f';
    const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';

    it('should construct URL with required parameters only', () => {
      const url = SERVICE_REQUESTS_URL(category, patientUuid);

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=${category}&patient=${patientUuid}`,
      );
    });

    it('should construct URL with numberOfVisits parameter', () => {
      const numberOfVisits = 5;
      const url = SERVICE_REQUESTS_URL(
        category,
        patientUuid,
        undefined,
        numberOfVisits,
        undefined,
      );

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=${category}&patient=${patientUuid}&numberOfVisits=${numberOfVisits}`,
      );
    });

    it('should prioritize encounterUuids over numberOfVisits', () => {
      const encounterUuids = 'encounter-1';
      const numberOfVisits = 5;
      const url = SERVICE_REQUESTS_URL(
        category,
        patientUuid,
        encounterUuids,
        numberOfVisits,
        undefined,
      );

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=${category}&patient=${patientUuid}&encounter=${encounterUuids}`,
      );
      expect(url).not.toContain('numberOfVisits');
    });

    it('should construct URL with all parameters', () => {
      const encounterUuids = 'encounter-1,encounter-2';
      const revinclude = 'ImagingStudy:basedon';
      const url = SERVICE_REQUESTS_URL(
        category,
        patientUuid,
        encounterUuids,
        undefined,
        revinclude,
      );

      expect(url).toBe(
        `/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=${category}&patient=${patientUuid}&_revinclude=${revinclude}&encounter=${encounterUuids}`,
      );
    });
  });

  describe('getServiceRequests', () => {
    it('should fetch service requests with required parameters', async () => {
      const category = '3f224d3e-afd7-4e90-8f14-34cf481b6d0f';
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      mockedGet.mockResolvedValueOnce(mockServiceRequestBundle);

      await getServiceRequests(category, patientUuid);

      expect(mockedGet).toHaveBeenCalledWith(
        SERVICE_REQUESTS_URL(category, patientUuid),
      );
    });

    it('should return the service request bundle', async () => {
      const category = '3f224d3e-afd7-4e90-8f14-34cf481b6d0f';
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      mockedGet.mockResolvedValueOnce(mockServiceRequestBundle);

      const result = await getServiceRequests(category, patientUuid);

      expect(result).toEqual(mockServiceRequestBundle);
    });

    it('should fetch service requests with encounterUuids', async () => {
      const category = '3f224d3e-afd7-4e90-8f14-34cf481b6d0f';
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      const encounterUuids = ['encounter-1', 'encounter-2'];
      mockedGet.mockResolvedValueOnce(mockServiceRequestBundle);

      await getServiceRequests(category, patientUuid, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        SERVICE_REQUESTS_URL(
          category,
          patientUuid,
          'encounter-1,encounter-2',
          undefined,
          undefined,
        ),
      );
    });

    it('should fetch service requests with empty encounterUuids array', async () => {
      const category = '3f224d3e-afd7-4e90-8f14-34cf481b6d0f';
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      const encounterUuids: string[] = [];
      mockedGet.mockResolvedValueOnce(mockServiceRequestBundle);

      await getServiceRequests(category, patientUuid, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        SERVICE_REQUESTS_URL(
          category,
          patientUuid,
          undefined,
          undefined,
          undefined,
        ),
      );
    });

    it('should fetch service requests with all optional parameters', async () => {
      const category = '3f224d3e-afd7-4e90-8f14-34cf481b6d0f';
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      const encounterUuids = ['encounter-1'];
      const revinclude = 'ImagingStudy:basedon';
      mockedGet.mockResolvedValueOnce(mockServiceRequestBundle);

      await getServiceRequests(
        category,
        patientUuid,
        encounterUuids,
        undefined,
        revinclude,
      );

      expect(mockedGet).toHaveBeenCalledWith(
        SERVICE_REQUESTS_URL(
          category,
          patientUuid,
          'encounter-1',
          undefined,
          revinclude,
        ),
      );
    });
  });
});
