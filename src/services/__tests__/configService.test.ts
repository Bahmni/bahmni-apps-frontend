import { getConfig } from '../configService';
import * as api from '../api';
import Ajv from 'ajv';
import * as commonUtils from '@utils/common';
import { CONFIG_ERROR_MESSAGES } from '@constants/errors';
import {
  validFullConfig,
  minimalConfig,
  mixedConfig,
  invalidConfig,
  emptyResponse,
  largeConfig,
  allOptionalFieldsConfig,
} from '@__mocks__/configMocks';

// Mock the api module
jest.mock('../api');
const mockGet = api.get as jest.MockedFunction<typeof api.get>;

// Mock Ajv
jest.mock('ajv');
const mockAjv = Ajv as jest.MockedClass<typeof Ajv>;

// Mock getFormattedError
jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn().mockImplementation((error) => ({
    title: 'Error',
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
}));
const mockGetFormattedError =
  commonUtils.getFormattedError as jest.MockedFunction<
    typeof commonUtils.getFormattedError
  >;

describe('ConfigService', () => {
  // Mock schema for testing
  const mockSchema = {
    type: 'object',
    properties: {
      section: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
    },
    required: ['section'],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementation for Ajv
    const mockValidate = jest.fn().mockReturnValue(true);
    const mockCompile = jest.fn().mockReturnValue(mockValidate);
    mockAjv.mockImplementation(
      () =>
        ({
          compile: mockCompile,
        }) as unknown as Ajv,
    );
  });

  describe('getConfig', () => {
    describe('Success cases', () => {
      test('should fetch and validate a fully valid config', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(validFullConfig);

        // Act
        const result = await getConfig('/api/config/dashboard', mockSchema);

        // Assert
        expect(mockGet).toHaveBeenCalledWith('/api/config/dashboard');
        expect(result).toEqual(validFullConfig);
      });

      test('should fetch and validate config with only required fields', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(minimalConfig);

        // Act
        const result = await getConfig('/api/config/minimal', mockSchema);

        // Assert
        expect(mockGet).toHaveBeenCalledWith('/api/config/minimal');
        expect(result).toEqual(minimalConfig);
      });

      test('should validate config with both required and optional fields', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(mixedConfig);

        // Act
        const result = await getConfig('/api/config/mixed', mockSchema);

        // Assert
        expect(mockGet).toHaveBeenCalledWith('/api/config/mixed');
        expect(result).toEqual(mixedConfig);
      });

      test('should handle unusually large config object', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(largeConfig);

        // Act
        const result = await getConfig('/api/config/large', mockSchema);

        // Assert
        expect(mockGet).toHaveBeenCalledWith('/api/config/large');
        expect(result).toEqual(largeConfig);
        expect(result?.section.length).toBe(50);
      });

      test('should handle config with all possible optional fields', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(allOptionalFieldsConfig);

        // Act
        const result = await getConfig('/api/config/full', mockSchema);

        // Assert
        expect(mockGet).toHaveBeenCalledWith('/api/config/full');
        expect(result).toEqual(allOptionalFieldsConfig);

        // Verify the comprehensive section has all optional fields
        const section = result?.section[0];
        expect(section).toBeDefined();
        expect(section.name).toBe('Comprehensive Section');
        expect(section.controls.length).toBe(4);
        expect(
          section.controls.some(
            (control: { type: string }) =>
              control.type === 'patientInformation',
          ),
        ).toBe(true);
      });

      test('should return typed config when using generic type parameter', async () => {
        // Arrange
        interface TestConfig {
          section: Array<{
            name: string;
            controls: Array<{ type: string }>;
          }>;
        }
        mockGet.mockResolvedValueOnce(minimalConfig);

        // Act
        const result = await getConfig<TestConfig>(
          '/api/config/typed',
          mockSchema,
        );

        // Assert
        expect(result).toEqual(minimalConfig);
        // TypeScript will ensure this is properly typed
        expect(result?.section[0].name).toBe('Basic Information');
      });
    });

    describe('Error cases', () => {
      test('should throw error when API request fails', async () => {
        // Arrange
        const networkError = new Error('Network error');
        mockGet.mockRejectedValueOnce(networkError);
        mockGetFormattedError.mockReturnValueOnce({
          title: 'Error',
          message: 'Network error',
        });

        // Act & Assert
        await expect(
          getConfig('/api/config/dashboard', mockSchema),
        ).rejects.toThrow('Network error');
        expect(mockGet).toHaveBeenCalledWith('/api/config/dashboard');
        expect(mockGetFormattedError).toHaveBeenCalledWith(expect.any(Error));
      });

      test('should throw error when API returns empty response', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(emptyResponse);

        // Act & Assert
        await expect(
          getConfig('/api/config/dashboard', mockSchema),
        ).rejects.toThrow(CONFIG_ERROR_MESSAGES.FETCH_FAILED);
        expect(mockGet).toHaveBeenCalledWith('/api/config/dashboard');
      });

      test('should throw error when config fails schema validation', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(invalidConfig);

        // Setup Ajv to fail validation
        const mockValidate = jest.fn().mockReturnValue(false);
        const mockCompile = jest.fn().mockReturnValue(mockValidate);
        mockAjv.mockImplementation(
          () =>
            ({
              compile: mockCompile,
            }) as unknown as Ajv,
        );

        // Act & Assert
        await expect(
          getConfig('/api/config/dashboard', mockSchema),
        ).rejects.toThrow(CONFIG_ERROR_MESSAGES.SCHEMA_VALIDATION_FAILED);
        expect(mockGet).toHaveBeenCalledWith('/api/config/dashboard');
        expect(mockValidate).toHaveBeenCalledWith(invalidConfig);
      });

      test('should throw error when invalid JSON response is received', async () => {
        // Arrange
        const syntaxError = new SyntaxError('Unexpected token in JSON');
        mockGet.mockImplementationOnce(() => {
          throw syntaxError;
        });
        mockGetFormattedError.mockReturnValueOnce({
          title: 'Error',
          message: 'Unexpected token in JSON',
        });

        // Act & Assert
        await expect(
          getConfig('/api/config/dashboard', mockSchema),
        ).rejects.toThrow('Unexpected token in JSON');
        expect(mockGet).toHaveBeenCalledWith('/api/config/dashboard');
      });

      test('should throw error when schema validation throws', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(validFullConfig);

        // Setup Ajv to throw during compilation
        const schemaError = new Error('Invalid schema');
        const mockCompile = jest.fn().mockImplementation(() => {
          throw schemaError;
        });
        mockAjv.mockImplementation(
          () =>
            ({
              compile: mockCompile,
            }) as unknown as Ajv,
        );
        mockGetFormattedError.mockReturnValueOnce({
          title: 'Error',
          message: 'Invalid schema',
        });

        // Act & Assert
        await expect(
          getConfig('/api/config/dashboard', mockSchema),
        ).rejects.toThrow('Invalid schema');
        expect(mockGet).toHaveBeenCalledWith('/api/config/dashboard');
        expect(mockCompile).toHaveBeenCalled();
      });
    });
  });

  // Tests for the internal fetchConfig function through getConfig
  describe('fetchConfig (via getConfig)', () => {
    test('should fetch config successfully', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(minimalConfig);

      // Act
      const result = await getConfig('/api/config/minimal', mockSchema);

      // Assert
      expect(mockGet).toHaveBeenCalledWith('/api/config/minimal');
      expect(result).toEqual(minimalConfig);
    });

    test('should throw specific error when fetch fails', async () => {
      // Arrange
      mockGet.mockRejectedValueOnce(new Error('Network error'));
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: CONFIG_ERROR_MESSAGES.FETCH_FAILED,
      });

      // Act & Assert
      await expect(
        getConfig('/api/config/dashboard', mockSchema),
      ).rejects.toThrow(expect.any(Error));
      expect(mockGet).toHaveBeenCalledWith('/api/config/dashboard');
    });
  });

  // Tests for the internal validateConfig function through getConfig
  describe('validateConfig (via getConfig)', () => {
    test('should validate config successfully', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(validFullConfig);
      const mockValidate = jest.fn().mockReturnValue(true);
      const mockCompile = jest.fn().mockReturnValue(mockValidate);
      mockAjv.mockImplementation(
        () =>
          ({
            compile: mockCompile,
          }) as unknown as Ajv,
      );

      // Act
      const result = await getConfig('/api/config/dashboard', mockSchema);

      // Assert
      expect(mockCompile).toHaveBeenCalledWith(mockSchema);
      expect(mockValidate).toHaveBeenCalledWith(validFullConfig);
      expect(result).toEqual(validFullConfig);
    });

    test('should throw error when validation fails', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(invalidConfig);
      const mockValidate = jest.fn().mockReturnValue(false);
      const mockCompile = jest.fn().mockReturnValue(mockValidate);
      mockAjv.mockImplementation(
        () =>
          ({
            compile: mockCompile,
          }) as unknown as Ajv,
      );

      // Act & Assert
      await expect(
        getConfig('/api/config/dashboard', mockSchema),
      ).rejects.toThrow(CONFIG_ERROR_MESSAGES.SCHEMA_VALIDATION_FAILED);
      expect(mockCompile).toHaveBeenCalledWith(mockSchema);
      expect(mockValidate).toHaveBeenCalledWith(invalidConfig);
    });
  });
});
