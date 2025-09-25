import Ajv from 'ajv';
import * as api from '../../api';
import { getFormattedError } from '../../errorHandling';
import { notificationService } from '../../notification';
import {
  validFullClinicalConfig,
  minimalClinicalConfig,
  mixedClinicalConfig,
  invalidClinicalConfig,
  largeConfig,
  allOptionalFieldsConfig,
  validDashboardConfig,
  invalidDashboardConfig,
  validRegistrationConfig,
  minimalRegistrationConfig,
  invalidRegistrationConfig,
} from '../__mocks__/configMocks';
import {
  getClinicalConfig,
  getDashboardConfig,
  getMedicationConfig,
  getRegistrationConfig,
} from '../configService';
import {
  CLINICAL_CONFIG_URL,
  DASHBOARD_CONFIG_URL,
  MEDICATIONS_CONFIG_URL,
  REGISTRATION_CONFIG_URL,
  ERROR_MESSAGES,
  ERROR_TITLES,
} from '../constants';
import { MedicationJSONConfig } from '../models/medicationConfig';

//TODO: Remove this import once the test i18n setup is complete
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: jest.fn().mockImplementation((key: string) => key),
  },
}));

// Mock the api module
jest.mock('../../api');
const mockGet = api.get as jest.MockedFunction<typeof api.get>;

// Mock Ajv
jest.mock('ajv');
const mockAjv = Ajv as jest.MockedClass<typeof Ajv>;

// Mock common utils
jest.mock('../../errorHandling', () => ({
  getFormattedError: jest.fn().mockImplementation((error) => ({
    title: 'Error',
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
  generateId: jest.fn().mockReturnValue('mock-generated-id'),
}));
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

// Mock notificationService
jest.mock('../../notification', () => ({
  notificationService: {
    showError: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../schemas/clinicalConfig.schema.json', () => ({
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
      consultationPad: {
        type: 'object',
        properties: {
          allergyConceptMap: {
            type: 'object',
            properties: {
              medicationAllergenUuid: { type: 'string' },
              foodAllergenUuid: { type: 'string' },
              environmentalAllergenUuid: { type: 'string' },
              allergyReactionUuid: { type: 'string' },
            },
            required: [
              'medicationAllergenUuid',
              'foodAllergenUuid',
              'environmentalAllergenUuid',
              'allergyReactionUuid',
            ],
          },
        },
        required: ['allergyConceptMap'],
      },
    },
    required: [
      'patientInformation',
      'actions',
      'dashboards',
      'consultationPad',
    ],
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
    consultationPad: {
      type: 'object',
      properties: {
        allergyConceptMap: {
          type: 'object',
          properties: {
            medicationAllergenUuid: { type: 'string' },
            foodAllergenUuid: { type: 'string' },
            environmentalAllergenUuid: { type: 'string' },
            allergyReactionUuid: { type: 'string' },
          },
          required: [
            'medicationAllergenUuid',
            'foodAllergenUuid',
            'environmentalAllergenUuid',
            'allergyReactionUuid',
          ],
        },
      },
      required: ['allergyConceptMap'],
    },
  },
  required: ['patientInformation', 'actions', 'dashboards', 'consultationPad'],
};

jest.mock('../schemas/dashboardConfig.schema.json', () => ({
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

jest.mock('../schemas/medicationConfig.schema.json', () => ({
  __esModule: true,
  default: {
    type: 'object',
    properties: {
      defaultDurationUnit: { type: 'string' },
      defaultInstructions: { type: 'string' },
      drugFormDefaults: {
        type: 'object',
        patternProperties: {
          '^.*$': {
            type: 'object',
            properties: {
              doseUnits: { type: 'string' },
              route: { type: 'string' },
            },
          },
        },
      },
    },
  },
}));

const mockMedicationSchema = {
  type: 'object',
  properties: {
    defaultDurationUnit: { type: 'string' },
    defaultInstructions: { type: 'string' },
    drugFormDefaults: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'object',
          properties: {
            doseUnits: { type: 'string' },
            route: { type: 'string' },
          },
        },
      },
    },
  },
};

jest.mock('../schemas/registrationConfig.schema.json', () => ({
  __esModule: true,
  default: {
    type: 'object',
    additionalProperties: true,
    properties: {
      patientSearch: {
        type: 'object',
        additionalProperties: true,
        properties: {
          customAttributes: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['label', 'fields'],
              properties: {
                label: { type: 'string' },
                placeholder: { type: 'string' },
                fields: {
                  type: 'array',
                  items: { type: 'string' },
                },
                type: { type: 'string' },
                default: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
}));

const mockRegistrationSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    patientSearch: {
      type: 'object',
      additionalProperties: true,
      properties: {
        customAttributes: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'fields'],
            properties: {
              label: { type: 'string' },
              placeholder: { type: 'string' },
              fields: {
                type: 'array',
                items: { type: 'string' },
              },
              type: { type: 'string' },
              default: { type: 'boolean' },
            },
          },
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
        expect(dashboard?.name).toBe('Comprehensive Dashboard');
        expect(dashboard?.requiredPrivileges).toContain(
          'View Comprehensive Dashboard',
        );
        expect(dashboard?.default).toBe(true);

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
          consultationPad: {
            allergyConceptMap: {
              medicationAllergenUuid: string;
              foodAllergenUuid: string;
              environmentalAllergenUuid: string;
              allergyReactionUuid: string;
            };
          };
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
          ERROR_TITLES.CONFIG_ERROR,
          ERROR_MESSAGES.CONFIG_NOT_FOUND,
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
          ERROR_TITLES.VALIDATION_ERROR,
          ERROR_MESSAGES.VALIDATION_FAILED,
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
        ERROR_TITLES.VALIDATION_ERROR,
        ERROR_MESSAGES.VALIDATION_FAILED,
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
        ERROR_TITLES.VALIDATION_ERROR,
        ERROR_MESSAGES.VALIDATION_FAILED,
      );
    });
  });

  describe('getMedicationConfig', () => {
    const validMedicationConfig: MedicationJSONConfig = {
      defaultDurationUnit: 'Days',
      defaultInstructions: 'As directed',
      drugFormDefaults: {
        Tablet: {
          doseUnits: 'Tablet',
          route: 'Oral',
        },
        Injection: {
          doseUnits: 'mg',
          route: 'Intravenous',
        },
      },
    };

    const minimalMedicationConfig: MedicationJSONConfig = {
      defaultDurationUnit: 'Days',
    };

    const invalidMedicationConfig = {
      // Invalid property type
      defaultDurationUnit: 123, // Should be string
      defaultInstructions: 'As directed',
    };

    describe('Success cases', () => {
      test('should fetch and validate a fully valid medication config', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(validMedicationConfig);

        // Act
        const result = await getMedicationConfig();

        // Assert
        expect(mockGet).toHaveBeenCalledWith(MEDICATIONS_CONFIG_URL);
        expect(result).toEqual(validMedicationConfig);
      });

      test('should fetch and validate config with only required fields', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(minimalMedicationConfig);

        // Act
        const result = await getMedicationConfig();

        // Assert
        expect(mockGet).toHaveBeenCalledWith(MEDICATIONS_CONFIG_URL);
        expect(result).toEqual(minimalMedicationConfig);
      });

      test('should validate config against medication schema', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(validMedicationConfig);
        const mockValidate = jest.fn().mockReturnValue(true);
        const mockCompile = jest.fn().mockReturnValue(mockValidate);
        mockAjv.mockImplementation(
          () =>
            ({
              compile: mockCompile,
            }) as unknown as Ajv,
        );

        // Act
        const result = await getMedicationConfig();

        // Assert
        expect(mockCompile).toHaveBeenCalledWith(mockMedicationSchema);
        expect(mockValidate).toHaveBeenCalledWith(validMedicationConfig);
        expect(result).toEqual(validMedicationConfig);
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
        const result = await getMedicationConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(MEDICATIONS_CONFIG_URL);
        expect(mockGetFormattedError).toHaveBeenCalledWith(expect.any(Error));
        expect(mockShowError).toHaveBeenCalledWith('Error', 'Network error');
      });

      test('should return null and show error when API returns empty response', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(null);

        // Act
        const result = await getMedicationConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(MEDICATIONS_CONFIG_URL);
        expect(mockShowError).toHaveBeenCalledWith(
          ERROR_TITLES.CONFIG_ERROR,
          ERROR_MESSAGES.CONFIG_NOT_FOUND,
        );
      });

      test('should return null and show error when config fails schema validation', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(invalidMedicationConfig);

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
        const result = await getMedicationConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(MEDICATIONS_CONFIG_URL);
        expect(mockValidate).toHaveBeenCalledWith(invalidMedicationConfig);
        expect(mockShowError).toHaveBeenCalledWith(
          ERROR_TITLES.VALIDATION_ERROR,
          ERROR_MESSAGES.VALIDATION_FAILED,
        );
      });

      test('should return null and show error when schema validation throws', async () => {
        // Arrange
        mockGet.mockResolvedValueOnce(validMedicationConfig);

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
        const result = await getMedicationConfig();

        // Assert
        expect(result).toBeNull();
        expect(mockGet).toHaveBeenCalledWith(MEDICATIONS_CONFIG_URL);
        expect(mockCompile).toHaveBeenCalled();
        expect(mockShowError).toHaveBeenCalledWith('Error', 'Invalid schema');
      });
    });

    describe('getRegistrationConfig', () => {
      describe('Success cases', () => {
        test('should fetch and validate a fully valid registration config', async () => {
          // Arrange
          mockGet.mockResolvedValueOnce(validRegistrationConfig);

          // Act
          const result = await getRegistrationConfig();

          // Assert
          expect(mockGet).toHaveBeenCalledWith(REGISTRATION_CONFIG_URL);
          expect(result).toEqual(validRegistrationConfig);
        });

        test('should fetch and validate config with minimal search fields', async () => {
          // Arrange
          mockGet.mockResolvedValueOnce(minimalRegistrationConfig);

          // Act
          const result = await getRegistrationConfig();

          // Assert
          expect(mockGet).toHaveBeenCalledWith(REGISTRATION_CONFIG_URL);
          expect(result).toEqual(minimalRegistrationConfig);
        });

        test('should validate config against registration schema', async () => {
          // Arrange
          mockGet.mockResolvedValueOnce(validRegistrationConfig);
          const mockValidate = jest.fn().mockReturnValue(true);
          const mockCompile = jest.fn().mockReturnValue(mockValidate);
          mockAjv.mockImplementation(
            () =>
              ({
                compile: mockCompile,
              }) as unknown as Ajv,
          );

          // Act
          const result = await getRegistrationConfig();

          // Assert
          expect(mockCompile).toHaveBeenCalledWith(mockRegistrationSchema);
          expect(mockValidate).toHaveBeenCalledWith(validRegistrationConfig);
          expect(result).toEqual(validRegistrationConfig);
        });

        test('should return properly typed config', async () => {
          // Arrange
          mockGet.mockResolvedValueOnce(minimalRegistrationConfig);

          // Act
          const result = await getRegistrationConfig();

          // Assert
          expect(result).toEqual(minimalRegistrationConfig);
          expect(result?.patientSearch?.customAttributes[0].label).toBe(
            'Phone Number',
          );
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
          const result = await getRegistrationConfig();

          // Assert
          expect(result).toBeNull();
          expect(mockGet).toHaveBeenCalledWith(REGISTRATION_CONFIG_URL);
          expect(mockGetFormattedError).toHaveBeenCalledWith(expect.any(Error));
          expect(mockShowError).toHaveBeenCalledWith('Error', 'Network error');
        });

        test('should return null and show error when API returns empty response', async () => {
          // Arrange
          mockGet.mockResolvedValueOnce(null);

          // Act
          const result = await getRegistrationConfig();

          // Assert
          expect(result).toBeNull();
          expect(mockGet).toHaveBeenCalledWith(REGISTRATION_CONFIG_URL);
          expect(mockShowError).toHaveBeenCalledWith(
            ERROR_TITLES.CONFIG_ERROR,
            ERROR_MESSAGES.CONFIG_NOT_FOUND,
          );
        });

        test('should return null and show error when config fails schema validation', async () => {
          // Arrange
          mockGet.mockResolvedValueOnce(invalidRegistrationConfig);

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
          const result = await getRegistrationConfig();

          // Assert
          expect(result).toBeNull();
          expect(mockGet).toHaveBeenCalledWith(REGISTRATION_CONFIG_URL);
          expect(mockValidate).toHaveBeenCalledWith(invalidRegistrationConfig);
          expect(mockShowError).toHaveBeenCalledWith(
            ERROR_TITLES.VALIDATION_ERROR,
            ERROR_MESSAGES.VALIDATION_FAILED,
          );
        });

        test('should return null and show error when schema validation throws', async () => {
          // Arrange
          mockGet.mockResolvedValueOnce(validRegistrationConfig);

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
          const result = await getRegistrationConfig();

          // Assert
          expect(result).toBeNull();
          expect(mockGet).toHaveBeenCalledWith(REGISTRATION_CONFIG_URL);
          expect(mockCompile).toHaveBeenCalled();
          expect(mockShowError).toHaveBeenCalledWith('Error', 'Invalid schema');
        });
      });
    });
  });
});
