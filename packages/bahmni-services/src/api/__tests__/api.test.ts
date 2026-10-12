import { AxiosInstance } from 'axios';
import { get, post, put, patch, del } from '../api';
import client from '../client';

// Mock dependencies
jest.mock('../constants', () => ({
  LOGIN_PATH: '/login',
  BINARY_RESPONSE_TYPES: [],
}));

jest.mock('../../errorHandling', () => ({
  getFormattedError: jest.fn(() => ({
    title: 'Error',
    message: 'Test error message',
  })),
}));

jest.mock('../utils', () => ({
  decodeHtmlEntities: jest.fn((data) => data),
  isOpenMRSWebServiceApi: jest.fn(() => true),
  isTemplateServiceApi: jest.fn(() => false),
  getResponseUrl: jest.fn(() => '/openmrs/ws/rest/v1/patient'),
}));

describe('Public API Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Method Functions', () => {
    // Mock axios client methods
    const mockAxiosGet = jest.fn();
    const mockAxiosPost = jest.fn();
    const mockAxiosPut = jest.fn();
    const mockAxiosPatch = jest.fn();
    const mockAxiosDelete = jest.fn();

    beforeEach(() => {
      client.get = mockAxiosGet;
      client.post = mockAxiosPost;
      client.put = mockAxiosPut;
      client.patch = mockAxiosPatch;
      client.delete = mockAxiosDelete;
    });

    describe('get', () => {
      it('should make GET request and return response data', async () => {
        const mockData = { id: 1, name: 'Test Patient' };
        mockAxiosGet.mockResolvedValue({ data: mockData });

        const result = await get('/api/patients/1');

        expect(mockAxiosGet).toHaveBeenCalledWith('/api/patients/1', undefined);
        expect(result).toEqual(mockData);
      });

      it('should make GET request with options and return response data', async () => {
        const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
        mockAxiosGet.mockResolvedValue({ data: mockBlob });

        const result = await get('/api/image', { responseType: 'blob' });

        expect(mockAxiosGet).toHaveBeenCalledWith('/api/image', {
          responseType: 'blob',
        });
        expect(result).toEqual(mockBlob);
      });

      it('should handle GET request errors', async () => {
        const error = new Error('Network error');
        mockAxiosGet.mockRejectedValue(error);

        await expect(get('/api/patients/1')).rejects.toThrow('Network error');
        expect(mockAxiosGet).toHaveBeenCalledWith('/api/patients/1', undefined);
      });
    });

    describe('post', () => {
      it('should make POST request and return response data', async () => {
        const mockData = { id: 1, name: 'New Patient' };
        const requestData = { name: 'New Patient', age: 30 };
        mockAxiosPost.mockResolvedValue({ data: mockData });

        const result = await post('/api/patients', requestData);

        expect(mockAxiosPost).toHaveBeenCalledWith(
          '/api/patients',
          requestData,
          undefined,
        );
        expect(result).toEqual(mockData);
      });

      it('should make POST request with options and return response data', async () => {
        const mockData = 'template-location.xlsx';
        const formData = new FormData();
        mockAxiosPost.mockResolvedValue({ data: mockData });

        const result = await post('/api/upload', formData, {
          headers: { 'Content-Type': undefined },
        });

        expect(mockAxiosPost).toHaveBeenCalledWith('/api/upload', formData, {
          headers: { 'Content-Type': undefined },
        });
        expect(result).toEqual(mockData);
      });

      it('should handle POST request errors', async () => {
        const error = new Error('Validation error');
        mockAxiosPost.mockRejectedValue(error);

        await expect(post('/api/patients', {})).rejects.toThrow(
          'Validation error',
        );
        expect(mockAxiosPost).toHaveBeenCalledWith(
          '/api/patients',
          {},
          undefined,
        );
      });
    });

    describe('put', () => {
      it('should make PUT request and return response data', async () => {
        const mockData = { id: 1, name: 'Updated Patient' };
        const requestData = { name: 'Updated Patient', age: 31 };
        mockAxiosPut.mockResolvedValue({ data: mockData });

        const result = await put('/api/patients/1', requestData);

        expect(mockAxiosPut).toHaveBeenCalledWith(
          '/api/patients/1',
          requestData,
        );
        expect(result).toEqual(mockData);
      });

      it('should handle PUT request errors', async () => {
        const error = new Error('Not found');
        mockAxiosPut.mockRejectedValue(error);

        await expect(put('/api/patients/1', {})).rejects.toThrow('Not found');
        expect(mockAxiosPut).toHaveBeenCalledWith('/api/patients/1', {});
      });
    });

    describe('patch', () => {
      it('should make PATCH request and return response data', async () => {
        const mockData = { id: 1, name: 'Partially Updated Patient' };
        const requestData = { name: 'Partially Updated Patient' };
        mockAxiosPatch.mockResolvedValue({ data: mockData });

        const result = await patch('/api/patients/1', requestData);

        expect(mockAxiosPatch).toHaveBeenCalledWith(
          '/api/patients/1',
          requestData,
        );
        expect(result).toEqual(mockData);
      });

      it('should handle PATCH request errors', async () => {
        const error = new Error('Conflict');
        mockAxiosPatch.mockRejectedValue(error);

        await expect(patch('/api/patients/1', {})).rejects.toThrow('Conflict');
        expect(mockAxiosPatch).toHaveBeenCalledWith('/api/patients/1', {});
      });
    });

    describe('del', () => {
      it('should make DELETE request and return response data', async () => {
        const mockData = { success: true };
        mockAxiosDelete.mockResolvedValue({ data: mockData });

        const result = await del('/api/patients/1');

        expect(mockAxiosDelete).toHaveBeenCalledWith(
          '/api/patients/1',
          undefined,
        );
        expect(result).toEqual(mockData);
      });

      it('should make DELETE request with options', async () => {
        const mockData = { success: true };
        mockAxiosDelete.mockResolvedValue({ data: mockData });

        const result = await del('/api/session', { timeout: 10000 });

        expect(mockAxiosDelete).toHaveBeenCalledWith('/api/session', {
          timeout: 10000,
        });
        expect(result).toEqual(mockData);
      });

      it('should handle DELETE request errors', async () => {
        const error = new Error('Forbidden');
        mockAxiosDelete.mockRejectedValue(error);

        await expect(del('/api/patients/1')).rejects.toThrow('Forbidden');
        expect(mockAxiosDelete).toHaveBeenCalledWith(
          '/api/patients/1',
          undefined,
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete request-response cycle', async () => {
      const responseData = { id: 1, display: 'Test Patient' };
      const mockAxiosPost = jest.fn().mockResolvedValue({ data: responseData });
      client.post = mockAxiosPost;

      const result = await post('/api/patients', { name: 'Test Patient' });

      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/api/patients',
        { name: 'Test Patient' },
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('FormData Content-Type handling (regression for the multipart upload bug)', () => {
    const getFreshClient = (): AxiosInstance => {
      let freshClient: AxiosInstance | undefined;
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        freshClient = require('../client').default;
      });
      return freshClient as AxiosInstance;
    };

    it('does not force a JSON Content-Type as a default on the real client instance', () => {
      const freshClient = getFreshClient();
      expect(
        freshClient.defaults.headers.common['Content-Type'],
      ).toBeUndefined();
    });

    it('lets axios set its own multipart boundary when uploading FormData through the real client', async () => {
      const freshClient = getFreshClient();
      let capturedContentType: unknown;
      freshClient.defaults.adapter = async (config) => {
        capturedContentType =
          typeof config.headers?.get === 'function'
            ? config.headers.get('Content-Type')
            : config.headers?.['Content-Type'];
        return {
          data: 'template-location.xlsx',
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      };

      const formData = new FormData();
      formData.append('file', new Blob(['test content']), 'test.xlsx');

      const response = await freshClient.post(
        '/bahmnireports/upload',
        formData,
      );

      expect(response.data).toBe('template-location.xlsx');
      expect(capturedContentType).not.toBe('application/json');
    });
  });
});
