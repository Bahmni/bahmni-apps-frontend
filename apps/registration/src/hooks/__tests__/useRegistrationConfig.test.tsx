import { RegistrationConfig } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(async () => {
    queryClient.clear();
    await queryClient.cancelQueries();
  });

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
      <QueryClientProvider client={queryClient}>
        <RegistrationConfigProvider initialConfig={mockConfig}>
          {children}
        </RegistrationConfigProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useRegistrationConfig(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.registrationConfig).toEqual(mockConfig);
  });

  it('should provide null config when no initialConfig is provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <RegistrationConfigProvider initialConfig={null}>
          {children}
        </RegistrationConfigProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useRegistrationConfig(), { wrapper });

    expect(result.current.registrationConfig).toBeNull();
  });
});
