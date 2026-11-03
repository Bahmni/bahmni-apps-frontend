import { getConfig } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import schema from '../../components/ReportList/schema.json';
import { REPORTS_JSON_CONFIG_URL } from '../../constants/app';
import { useReportsConfig } from '../useReportsConfig';

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

describe('useReportsConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the reports.json config URL with the reports schema', async () => {
    mockGetConfig.mockResolvedValue({});
    const { result } = renderHook(() => useReportsConfig(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetConfig).toHaveBeenCalledWith(REPORTS_JSON_CONFIG_URL, schema);
  });

  it('does not retry a permanent schema-validation/fetch failure', async () => {
    mockGetConfig.mockRejectedValue(new Error('invalid config'));
    const { result } = renderHook(() => useReportsConfig(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockGetConfig).toHaveBeenCalledTimes(1);
  });
});
