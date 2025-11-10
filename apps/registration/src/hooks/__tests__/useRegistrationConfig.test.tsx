import { RegistrationConfig } from '@bahmni-frontend/bahmni-services';
import { renderHook } from '@testing-library/react';
import { RegistrationConfigProvider } from '../../providers/RegistrationConfigProvider';
import { useRegistrationConfig } from '../useRegistrationConfig';

const mockConfig: RegistrationConfig = {
  patientSearch: {
    customAttributes: [
      {
        translationKey: 'CUSTOM_ATTRIBUTE',
        fields: ['field1'],
        columnTranslationKeys: ['COLUMN1'],
        type: 'person',
      },
    ],
    appointment: [],
  },
};

describe('useRegistrationConfig', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useRegistrationConfig());
    }).toThrow(
      'useRegistrationConfig must be used within a RegistrationConfigProvider',
    );

    consoleError.mockRestore();
  });

  it('should return context when used within provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RegistrationConfigProvider initialConfig={mockConfig}>
        {children}
      </RegistrationConfigProvider>
    );

    const { result } = renderHook(() => useRegistrationConfig(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.registrationConfig).toEqual(mockConfig);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.setRegistrationConfig).toBe('function');
    expect(typeof result.current.setIsLoading).toBe('function');
    expect(typeof result.current.setError).toBe('function');
  });

  it('should provide null config when no initialConfig is provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RegistrationConfigProvider initialConfig={null}>
        {children}
      </RegistrationConfigProvider>
    );

    const { result } = renderHook(() => useRegistrationConfig(), { wrapper });

    expect(result.current.registrationConfig).toBeNull();
  });
});
