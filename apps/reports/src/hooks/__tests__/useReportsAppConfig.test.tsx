import { getConfig } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import appConfigSchema from '../../components/ReportList/appConfigSchema.json';
import { REPORTS_APP_CONFIG_URL } from '../../constants/app';
import { useReportsAppConfig } from '../useReportsAppConfig';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useReportsAppConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the app.json config URL with the app config schema', async () => {
    mockGetConfig.mockResolvedValue({});
    const { result } = renderHook(() => useReportsAppConfig(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetConfig).toHaveBeenCalledWith(
      REPORTS_APP_CONFIG_URL,
      appConfigSchema,
    );
  });

  it('reads supportedFormats and paperSize from the nested `config` object, matching the real app.json envelope', async () => {
    mockGetConfig.mockResolvedValue({
      id: 'bahmni.reports',
      description: 'Bahmni Reports App',
      extensionPoints: [],
      config: {
        paperSize: 'A3',
        enableReportQueue: true,
        supportedFormats: ['PDF', 'CSV', 'HTML'],
      },
    });

    const { result } = renderHook(() => useReportsAppConfig(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.config?.supportedFormats).toEqual([
      'PDF',
      'CSV',
      'HTML',
    ]);
    expect(result.current.data?.config?.paperSize).toBe('A3');
    expect(result.current.data?.config?.enableReportQueue).toBe(true);
  });

  it('falls back to an empty config when the fetch fails', async () => {
    mockGetConfig.mockRejectedValue(new Error('not found'));
    const { result } = renderHook(() => useReportsAppConfig(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({});
  });
});
