import { get, post } from '../../api';
import {
  findCdsServiceConfig,
  buildContextFromResourceMap,
  invokeCDSSRule,
} from '../cdssService';
import { CDSSRule, CDSHooksRequest } from '../models';
import {
  mockCDSSServerConfig,
  mockCDSHooksResponse,
  mockEmptyCDSHooksResponse,
  mockCDSSContext,
  mockBundle,
} from './mocks';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPost = post as jest.MockedFunction<typeof post>;

describe('cdssService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findCdsServiceConfig', () => {
    it('should return server and service config when both exist', () => {
      const result = findCdsServiceConfig(
        mockCDSSServerConfig,
        'test-cdss-server',
        'medication-prescribe',
      );

      expect(result).toBeDefined();
      expect(result.serverConfig.server).toBe('test-cdss-server');
      expect(result.serviceConfig.name).toBe('medication-prescribe');
    });

    it('should throw error when server is not found', () => {
      expect(() =>
        findCdsServiceConfig(
          mockCDSSServerConfig,
          'non-existent-server',
          'medication-prescribe',
        ),
      ).toThrow('CDSS server "non-existent-server" not found in configuration');
    });

    it('should throw error when service is not found in server', () => {
      expect(() =>
        findCdsServiceConfig(
          mockCDSSServerConfig,
          'test-cdss-server',
          'non-existent-service',
        ),
      ).toThrow(
        'CDSS service "non-existent-service" not found in server "test-cdss-server"',
      );
    });

    it('should find service in different server', () => {
      const result = findCdsServiceConfig(
        mockCDSSServerConfig,
        'another-server',
        'other-service',
      );

      expect(result.serverConfig.server).toBe('another-server');
      expect(result.serviceConfig.name).toBe('other-service');
    });
  });

  describe('buildContextFromResourceMap', () => {
    it('should build context from resource map', () => {
      const resourceMap = [
        { type: 'MedicationRequest', attribute: 'draftOrders' },
        { type: 'Observation', attribute: 'observations' },
      ];

      const result = buildContextFromResourceMap(mockBundle, resourceMap);

      expect(result).toHaveProperty('draftOrders');
      expect(result).toHaveProperty('observations');
      expect(result.draftOrders).toMatchObject({
        resourceType: 'Bundle',
        type: 'collection',
      });
      expect((result.draftOrders as any).entry).toHaveLength(1);
      expect((result.observations as any).entry).toHaveLength(1);
    });

    it('should return empty object when resourceMap is undefined', () => {
      const result = buildContextFromResourceMap(mockBundle);

      expect(result).toEqual({});
    });

    it('should not include resources with no matching entries', () => {
      const resourceMap = [
        { type: 'Condition', attribute: 'conditions' },
        { type: 'Procedure', attribute: 'procedures' },
      ];

      const result = buildContextFromResourceMap(mockBundle, resourceMap);

      expect(result).toEqual({});
    });

    it('should return empty object when bundle has no entries', () => {
      const emptyBundle = {
        resourceType: 'Bundle' as const,
        type: 'collection' as const,
      };
      const resourceMap = [
        { type: 'MedicationRequest', attribute: 'draftOrders' },
      ];

      const result = buildContextFromResourceMap(emptyBundle, resourceMap);

      expect(result).toEqual({});
    });

    it('should filter only matching resource types', () => {
      const resourceMap = [
        { type: 'Immunization', attribute: 'immunizations' },
      ];

      const result = buildContextFromResourceMap(mockBundle, resourceMap);

      expect(result).toHaveProperty('immunizations');
      expect((result.immunizations as any).entry).toHaveLength(1);
      expect((result.immunizations as any).entry[0].resource.resourceType).toBe(
        'Immunization',
      );
    });
  });

  describe('invokeCDSSRule', () => {
    const mockRule: CDSSRule = {
      event: 'onSelect',
      server: 'test-cdss-server',
      service: 'medication-prescribe',
    };

    beforeEach(() => {
      mockedPost.mockResolvedValueOnce(mockCDSHooksResponse);
    });

    it('should invoke CDSS rule and return cards', async () => {
      const result = await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      expect(result).toEqual(mockCDSHooksResponse.cards);
      expect(mockedPost).toHaveBeenCalledTimes(1); // API call
    });

    it('should include patientId in context', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];
      const requestBody = postCall[1] as CDSHooksRequest;

      expect(requestBody.context.patientId).toBe('patient-123');
    });

    it('should include visitId when provided', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];
      const requestBody = postCall[1] as CDSHooksRequest;

      expect(requestBody.context.visitId).toBe('visit-456');
    });

    it('should include episodeId when provided', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];
      const requestBody = postCall[1] as CDSHooksRequest;

      expect(requestBody.context.episodeId).toBe('episode-789');
    });

    it('should not include visitId when undefined', async () => {
      const contextWithoutVisit = {
        patientId: 'patient-123',
      };

      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        contextWithoutVisit,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];
      const requestBody = postCall[1] as CDSHooksRequest;

      expect(requestBody.context).not.toHaveProperty('visitId');
    });

    it('should include prefetch when specified in service config', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];
      const requestBody = postCall[1] as CDSHooksRequest;

      expect(requestBody.prefetch).toEqual({
        patient: 'Patient/{{context.patientId}}',
      });
    });

    it('should build filtered context from resource map', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];
      const requestBody = postCall[1] as CDSHooksRequest;

      expect(requestBody.context.draftOrders).toBeDefined();
      expect(requestBody.context.observations).toBeDefined();
    });

    it('should use correct API endpoint', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];

      expect(postCall[0]).toBe(
        'http://test-cdss.example.com/medication-prescribe',
      );
    });

    it('should call post with correct request body structure', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      expect(mockedPost).toHaveBeenCalledWith(
        'http://test-cdss.example.com/medication-prescribe',
        expect.objectContaining({
          hook: 'medication-prescribe',
          hookInstance: expect.any(String),
          context: expect.any(Object),
        }),
      );
    });

    it('should include hookInstance as UUID', async () => {
      await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      const postCall = mockedPost.mock.calls[0];
      const requestBody = postCall[1] as CDSHooksRequest;

      expect(requestBody.hookInstance).toBeDefined();
      expect(typeof requestBody.hookInstance).toBe('string');
      expect(requestBody.hookInstance).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should return empty array when response has no cards', async () => {
      mockedPost.mockReset();
      mockedPost.mockResolvedValueOnce(mockEmptyCDSHooksResponse);

      const result = await invokeCDSSRule(
        mockCDSSServerConfig,
        mockRule,
        mockCDSSContext,
        mockBundle,
      );

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      mockedPost.mockReset();
      mockedPost.mockRejectedValueOnce(new Error('Internal Server Error'));

      await expect(
        invokeCDSSRule(
          mockCDSSServerConfig,
          mockRule,
          mockCDSSContext,
          mockBundle,
        ),
      ).rejects.toThrow('Internal Server Error');
    });

    it('should throw error when service config not found', async () => {
      const invalidRule: CDSSRule = {
        event: 'onSelect',
        server: 'invalid-server',
        service: 'invalid-service',
      };

      await expect(
        invokeCDSSRule(
          mockCDSSServerConfig,
          invalidRule,
          mockCDSSContext,
          mockBundle,
        ),
      ).rejects.toThrow(
        'CDSS server "invalid-server" not found in configuration',
      );
    });
  });
});
