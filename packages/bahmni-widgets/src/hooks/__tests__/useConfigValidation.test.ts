import { renderHook, waitFor } from '@testing-library/react';
import { validateConfig } from '@bahmni/services';
import { useConfigValidation } from '../useConfigValidation';

jest.mock('@bahmni/services');

const mockedValidateConfig = validateConfig as jest.MockedFunction<
  typeof validateConfig
>;

describe('useConfigValidation', () => {
  const mockSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name'],
  };

  const validConfig = {
    name: 'John Doe',
    age: 30,
  };

  const invalidConfig = {
    age: 'thirty',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    mockedValidateConfig.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useConfigValidation({
        config: validConfig,
        schema: mockSchema,
      }),
    );

    expect(result.current.isValidating).toBe(true);
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should validate config successfully and set isValid to true', async () => {
    mockedValidateConfig.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useConfigValidation({
        config: validConfig,
        schema: mockSchema,
      }),
    );

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(mockedValidateConfig).toHaveBeenCalledWith(validConfig, mockSchema);
    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set isValid to false when validation fails', async () => {
    mockedValidateConfig.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useConfigValidation({
        config: invalidConfig,
        schema: mockSchema,
      }),
    );

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(mockedValidateConfig).toHaveBeenCalledWith(
      invalidConfig,
      mockSchema,
    );
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe(
      'Configuration does not match required schema',
    );
  });

  it('should handle validation errors correctly', async () => {
    const mockError = new Error('Schema validation failed');
    mockedValidateConfig.mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useConfigValidation({
        config: validConfig,
        schema: mockSchema,
      }),
    );

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(mockedValidateConfig).toHaveBeenCalledWith(validConfig, mockSchema);
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe('Schema validation failed');
  });

  it('should handle non-Error objects thrown during validation', async () => {
    const nonErrorObject = { message: 'Validation error' };
    mockedValidateConfig.mockRejectedValue(nonErrorObject);

    const { result } = renderHook(() =>
      useConfigValidation({
        config: validConfig,
        schema: mockSchema,
      }),
    );

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe('Unknown validation error');
  });

  it('should handle empty config object', async () => {
    mockedValidateConfig.mockResolvedValue(false);
    const emptyConfig = {};

    const { result } = renderHook(() =>
      useConfigValidation({
        config: emptyConfig,
        schema: mockSchema,
      }),
    );

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(mockedValidateConfig).toHaveBeenCalledWith(emptyConfig, mockSchema);
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe(
      'Configuration does not match required schema',
    );
  });

  it('should handle null config', async () => {
    mockedValidateConfig.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useConfigValidation({
        config: null,
        schema: mockSchema,
      }),
    );

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(mockedValidateConfig).toHaveBeenCalledWith(null, mockSchema);
    expect(result.current.isValid).toBe(false);
  });

  it('should handle undefined config', async () => {
    mockedValidateConfig.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useConfigValidation({
        config: undefined,
        schema: mockSchema,
      }),
    );

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(mockedValidateConfig).toHaveBeenCalledWith(undefined, mockSchema);
    expect(result.current.isValid).toBe(false);
  });
});