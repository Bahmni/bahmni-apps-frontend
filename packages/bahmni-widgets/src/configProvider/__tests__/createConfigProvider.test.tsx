import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React, { createContext } from 'react';
import { useNotification } from '../../notification/useNotification';
import { createConfigProvider } from '../createConfigProvider';

jest.mock('../../notification/useNotification');

interface TestConfig {
  value: string;
}

interface TestContextValue {
  testConfig: TestConfig | undefined;
  isLoading: boolean;
  error: Error | null;
}

const TestContext = createContext<TestContextValue | undefined>(undefined);

const mockQueryFn = jest.fn();

const TestProvider = createConfigProvider<TestConfig, TestContextValue>({
  context: TestContext,
  queryKey: ['testConfig'],
  queryFn: mockQueryFn,
  valueMapper: (testConfig, isLoading, error) => ({
    testConfig,
    isLoading,
    error,
  }),
  id: 'test-config',
  name: 'Test Config',
  displayName: 'TestConfigProvider',
});

const TestChild = () => <div data-testid="test-child">Child</div>;

const mockAddNotification = jest.fn();

describe('createConfigProvider', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TestProvider>{children}</TestProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(async () => {
    queryClient.clear();
    await queryClient.cancelQueries();
  });

  it.each([
    {
      description: 'renders children when config is loaded',
      setup: () => mockQueryFn.mockResolvedValueOnce({ value: 'test' }),
      syncVisibleIds: [] as string[],
      expectedVisibleId: 'test-child',
      expectedHiddenIds: [] as string[],
    },
    {
      description: 'shows loading state when config is being fetched',
      setup: () =>
        mockQueryFn.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ value: 'test' }), 100),
            ),
        ),
      syncVisibleIds: ['test-config-loader-test-id'],
      expectedVisibleId: 'test-child',
      expectedHiddenIds: [] as string[],
    },
  ])(
    'should $description',
    async ({ setup, syncVisibleIds, expectedVisibleId, expectedHiddenIds }) => {
      setup();

      render(
        <TestWrapper>
          <TestChild />
        </TestWrapper>,
      );

      for (const id of syncVisibleIds) {
        expect(screen.getByTestId(id)).toBeInTheDocument();
      }

      await waitFor(() => {
        expect(screen.getByTestId(expectedVisibleId)).toBeInTheDocument();
      });

      for (const id of expectedHiddenIds) {
        expect(screen.queryByTestId(id)).not.toBeInTheDocument();
      }
    },
  );

  it('should show error UI and hide children when fetch fails', async () => {
    mockQueryFn.mockRejectedValueOnce(new Error('Failed to fetch config'));

    render(
      <TestWrapper>
        <TestChild />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('test-config-error-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByText('ERROR_CONFIG_TITLE')).toBeInTheDocument();
      expect(
        screen.getByText('ERROR_CONFIG_GENERIC_MESSAGE'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument();
    expect(screen.getByTestId('test-config-error-test-id')).toHaveAttribute(
      'aria-label',
      'ERROR_CONFIG_TITLE',
    );
  });

  it('should trigger error notification with config name when fetch fails', async () => {
    mockQueryFn.mockRejectedValueOnce(new Error('Failed to fetch config'));

    render(
      <TestWrapper>
        <TestChild />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_CONFIG_TITLE',
        message: 'Failed to fetch config',
      });
    });
  });
});
