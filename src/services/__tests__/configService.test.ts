import { getClinicalConfig, getDashboardConfig } from '../configService';
import * as api from '../api';
import Ajv from 'ajv';
import * as commonUtils from '@utils/common';
import { CONFIG_ERROR_MESSAGES, ERROR_TITLES } from '@constants/errors';
import notificationService from '../notificationService';
import i18n from '@/setupTests.i18n';
import {
  validFullClinicalConfig,
  minimalClinicalConfig,
  mixedClinicalConfig,
  invalidClinicalConfig,
  largeConfig,
  allOptionalFieldsConfig,
  validDashboardConfig,
  invalidDashboardConfig,
} from '@__mocks__/configMocks';
import { CLINICAL_CONFIG_URL, DASHBOARD_CONFIG_URL } from '@constants/app';

// Mock the api module
jest.mock('../api');
const mockGet = api.get as jest.MockedFunction<typeof api.get>;

// Mock Ajv
jest.mock('ajv');
const mockAjv = Ajv as jest.MockedClass<typeof Ajv>;

// Mock common utils
jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn().mockImplementation((error) => ({
    title: 'Error',
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
  generateId: jest.fn().mockReturnValue('mock-generated-id'),
}));
const mockGetFormattedError =
  commonUtils.getFormattedError as jest.MockedFunction<
    typeof commonUtils.getFormattedError
  >;

// Mock notificationService
jest.mock('../notificationService', () => ({
  showError: jest.fn(),
  __esModule: true,
  default: {
    showError: jest.fn(),
  },
}));

jest.mock('@schemas/clinicalConfig.schema.json', () => ({
  __esModule: true,
  default: {
    type: 'object',
    properties: {
      patientInformation: {
        type: 'object',
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      dashboards: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
    },
    required: ['patientInformation', 'actions', 'dashboards'],
  },
}));
const mockSchema = {
  type: 'object',
  properties: {
    patientInformation: {
      type: 'object',
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    dashboards: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  },
  required: ['patientInformation', 'actions', 'dashboards'],
};

jest.mock('@schemas/dashboardConfig.schema.json', () => ({
  __esModule: true,
  default: {
    type: 'object',
    required: ['sections'],
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'icon', 'controls'],
          properties: {
            name: { type: 'string' },
            translationKey: { type: 'string' },
            icon: { type: 'string' },
            controls: { type: 'array' },
          },
        },
      },
    },
  },
}));
const mockDashboardSchema = {
  type: 'object',
  required: ['sections'],
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'icon', 'controls'],
        properties: {
          name: { type: 'string' },
          translationKey: { type: 'string' },
          icon: { type: 'string' },
          controls: { type: 'array' },
        },
      },
    },
  },
};

const mockShowError = notificationService.showError as jest.MockedFunction<
  typeof notificationService.showError
>;

describe('ConfigService', () => {
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

  describe('getClinicalConfig', () => {
    describe('Success cases', () => {
      test('should fetch and validate a fully valid config', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(validFullClinicalConfig);

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(result).toEqual(validFullClinicalConfig);
      });

      test('should fetch and validate config with only required fields', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(minimalClinicalConfig);

        // Act
        const result = await getClinicalConfig();
        // Assert
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(result).toEqual(minimalClinicalConfig);
      });

      test('should validate config with both required and optional fields', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(mixedClinicalConfig);

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(result).toEqual(mixedClinicalConfig);
      });

      test('should handle unusually large config object', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(largeConfig);

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(result).toEqual(largeConfig);
        expect(result?.dashboards.length).toBe(50);
      });

      test('should handle config with all possible optional fields', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(allOptionalFieldsConfig);

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(result).toEqual(allOptionalFieldsConfig);

        // Verify the comprehensive dashboard has all optional fields
        const dashboard = result?.dashboards[0];
        expect(dashboard).toBeDefined();
        if (dashboard) {
          expect(dashboard.name).toBe('Comprehensive Dashboard');
          expect(dashboard.requiredPrivileges).toContain(
            'View Comprehensive Dashboard',
          );
          expect(dashboard.default).toBe(true);
        }

        // Verify patient information has custom sections
        const customSections = result?.patientInformation.customSections as
          | Array<{ name: string; attributes: string[] }>
          | undefined;
        expect(customSections).toBeDefined();
        expect(customSections?.length).toBe(2);
      });

      test('should return typed config when using generic type parameter', async () => {
        // Arrange
        interface TestConfig {
          patientInformation: Record<string, unknown>;
          actions: Array<unknown>;
          dashboards: Array<{
            name: string;
            url: string;
            requiredPrivileges: string[];
          }>;
        }
        mockGet.mockResolvedValueOnce(minimalClinicalConfig);

        // Act
        const result = await getClinicalConfig<TestConfig>();

        // Assert
        expect(result).toEqual(minimalClinicalConfig);
        // TypeScript will ensure this is properly typed
        expect(result?.dashboards[0].name).toBe('Basic Information');
      });
    });

    describe('Error cases', () => {
      test('should return null and show error when API request fails', async () => {
        // Arrange
        const networkError = new Error('Network error');
        mockGet.mockRejectedValueOnce(networkError);
        mockGetFormattedError.mockReturnValueOnce({
          title: 'Error',
          message: 'Network error',
        });

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(mockGetFormattedError).toHaveBeenCalledWith(expect.any(Error));
        expect(mockShowError).toHaveBeenCalledWith('Error', 'Network error');
      });

      test('should return null and show error when API returns empty response', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(null);

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(mockShowError).toHaveBeenCalledWith(
          i18n.t(ERROR_TITLES.CONFIG_ERROR),
          i18n.t(CONFIG_ERROR_MESSAGES.CONFIG_NOT_FOUND),
        );
      });

      test('should return null and show error when config fails schema validation', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(invalidClinicalConfig);

        // Setup Ajv to fail validation
        const mockValidate = jest.fn().mockReturnValue(false);
        const mockCompile = jest.fn().mockReturnValue(mockValidate);
        mockAjv.mockImplementation(
          () =>
            ({
              compile: mockCompile,
            }) as unknown as Ajv,
        );

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(mockValidate).toHaveBeenCalledWith(invalidClinicalConfig);
        expect(mockShowError).toHaveBeenCalledWith(
          i18n.t(ERROR_TITLES.VALIDATION_ERROR),
          i18n.t(CONFIG_ERROR_MESSAGES.VALIDATION_FAILED),
        );
      });

      test('should return null and show error when invalid JSON response is received', async () => {
        // Arrange
        const syntaxError = new SyntaxError('Unexpected token in JSON');
        mockGet.mockImplementationOnce(() => {
          throw syntaxError;
        });
        mockGetFormattedError.mockReturnValueOnce({
          title: 'Error',
          message: 'Unexpected token in JSON',
        });

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(mockShowError).toHaveBeenCalledWith(
          'Error',
          'Unexpected token in JSON',
        );
      });

      test('should return null and show error when schema validation throws', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(validFullClinicalConfig);

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

        // Act
        const result = await getClinicalConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
        expect(mockCompile).toHaveBeenCalled();
        expect(mockShowError).toHaveBeenCalledWith('Error', 'Invalid schema');
      });
    });
  });

  // Tests for the internal fetchConfig function through getConfig
  describe('fetchConfig (via getConfig)', () => {
    test('should fetch config successfully', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(minimalClinicalConfig);

      // Act
      const result = await getClinicalConfig();

      // Assert
      expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
      expect(result).toEqual(minimalClinicalConfig);
    });

    test('should return null and show error when fetch fails', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockGet.mockRejectedValueOnce(networkError);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Network error',
      });

      // Act
      const result = await getClinicalConfig();

      // Assert
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith(CLINICAL_CONFIG_URL);
      expect(mockShowError).toHaveBeenCalledWith('Error', 'Network error');
    });
  });

  // Tests for the internal validateConfig function through getConfig
  describe('validateConfig (via getConfig)', () => {
    test('should validate config successfully', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(validFullClinicalConfig);
      const mockValidate = jest.fn().mockReturnValue(true);
      const mockCompile = jest.fn().mockReturnValue(mockValidate);
      mockAjv.mockImplementation(
        () =>
          ({
            compile: mockCompile,
          }) as unknown as Ajv,
      );

      // Act
      const result = await getClinicalConfig();

      // Assert
      expect(mockCompile).toHaveBeenCalledWith(mockSchema);
      expect(mockValidate).toHaveBeenCalledWith(validFullClinicalConfig);
      expect(result).toEqual(validFullClinicalConfig);
    });

    test('should return null and show error when validation fails', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(invalidClinicalConfig);
      const mockValidate = jest.fn().mockReturnValue(false);
      const mockCompile = jest.fn().mockReturnValue(mockValidate);
      mockAjv.mockImplementation(
        () =>
          ({
            compile: mockCompile,
          }) as unknown as Ajv,
      );

      // Act
      const result = await getClinicalConfig();

      // Assert
      expect(result).toBeNull();
      expect(mockCompile).toHaveBeenCalledWith(mockSchema);
      expect(mockValidate).toHaveBeenCalledWith(invalidClinicalConfig);
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t(ERROR_TITLES.VALIDATION_ERROR),
        i18n.t(CONFIG_ERROR_MESSAGES.VALIDATION_FAILED),
      );
    });
  });

  // Tests for getDashboardConfig
  describe('getDashboardConfig', () => {
    const testDashboardURL = 'test-dashboard';
    const formattedDashboardURL = DASHBOARD_CONFIG_URL(testDashboardURL);

    test('should call API with correct dashboard URL', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(validDashboardConfig);

      // Act
      const result = await getDashboardConfig(testDashboardURL);

      // Assert
      expect(mockGet).toHaveBeenCalledWith(formattedDashboardURL);
      expect(result).toEqual(validDashboardConfig);
    });

    test("should generate IDs for dashboard sections that don't have them", async () => {
      // Arrange
      // Mock a dashboard config without IDs
      const configWithoutIds = {
        sections: [
          { name: 'Section1', icon: 'icon1', controls: [] },
          { name: 'Section2', icon: 'icon2', controls: [] },
        ],
      };
      mockGet.mockResolvedValueOnce(configWithoutIds);

      // Act
      const result = await getDashboardConfig(testDashboardURL);

      // Assert
      expect(result?.sections[0].id).toBeDefined();
      expect(result?.sections[1].id).toBeDefined();
      expect(typeof result?.sections[0].id).toBe('string');
      expect(typeof result?.sections[1].id).toBe('string');
    });

    test('should preserve existing IDs when present', async () => {
      // Arrange
      // Mock a dashboard config with some existing IDs
      const existingId = 'existing-id';
      const configWithSomeIds = {
        sections: [
          { id: existingId, name: 'Section1', icon: 'icon1', controls: [] },
          { name: 'Section2', icon: 'icon2', controls: [] },
        ],
      };
      mockGet.mockResolvedValueOnce(configWithSomeIds);

      // Act
      const result = await getDashboardConfig(testDashboardURL);

      // Assert
      expect(result?.sections[0].id).toBe(existingId);
      expect(result?.sections[1].id).toBeDefined();
      expect(result?.sections[1].id).not.toBe(existingId);
    });

    test('should validate config against dashboard schema', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(validDashboardConfig);
      const mockValidate = jest.fn().mockReturnValue(true);
      const mockCompile = jest.fn().mockReturnValue(mockValidate);
      mockAjv.mockImplementation(
        () =>
          ({
            compile: mockCompile,
          }) as unknown as Ajv,
      );

      // Act
      const result = await getDashboardConfig(testDashboardURL);

      // Assert
      expect(mockCompile).toHaveBeenCalledWith(mockDashboardSchema);
      expect(mockValidate).toHaveBeenCalledWith(validDashboardConfig);
      expect(result).toEqual(validDashboardConfig);
    });

    test('should return null when validation fails', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(invalidDashboardConfig);
      const mockValidate = jest.fn().mockReturnValue(false);
      const mockCompile = jest.fn().mockReturnValue(mockValidate);
      mockAjv.mockImplementation(
        () =>
          ({
            compile: mockCompile,
          }) as unknown as Ajv,
      );

      // Act
      const result = await getDashboardConfig(testDashboardURL);

      // Assert
      expect(result).toBeNull();
      expect(mockCompile).toHaveBeenCalledWith(mockDashboardSchema);
      expect(mockValidate).toHaveBeenCalledWith(invalidDashboardConfig);
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t(ERROR_TITLES.VALIDATION_ERROR),
        i18n.t(CONFIG_ERROR_MESSAGES.VALIDATION_FAILED),
      );
    });
  });
});
