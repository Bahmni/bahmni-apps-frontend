import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React, { createContext } from 'react';
import { NotificationProvider } from '../../notification';
import { createConfigProvider } from '../createConfigProvider';

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
  namePrefix: 'test-config',
  displayName: 'TestConfigProvider',
});

const TestChild = () => <div data-testid="test-child">Child</div>;

describe('createConfigProvider', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <TestProvider>{children}</TestProvider>
      </QueryClientProvider>
    </NotificationProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
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
    {
      description: 'shows error element and hides children when fetch fails',
      setup: () =>
        mockQueryFn.mockRejectedValueOnce(new Error('Failed to fetch config')),
      syncVisibleIds: [] as string[],
      expectedVisibleId: 'test-config-error-test-id',
      expectedHiddenIds: ['test-child'],
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
});
