import { getConfig } from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { RegistrationConfigProvider } from '../index';
import { RegistrationConfig } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

const mockRegistrationConfig: RegistrationConfig = {
  patientSearch: {
    customAttributes: [],
    appointment: [],
  },
  defaultVisitType: 'OPD',
  patientInformation: {
    defaultIdentifierPrefix: 'REG',
    showMiddleName: true,
    showLastName: true,
  },
  fieldValidation: {},
  extensionPoints: [],
  registrationAppExtensions: [],
};

const TestComponent = () => <div data-testid="test-child">Test Child</div>;

describe('RegistrationConfigProvider', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <RegistrationConfigProvider>{children}</RegistrationConfigProvider>
      </QueryClientProvider>
    </NotificationProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    queryClient.clear();
    await queryClient.cancelQueries();
  });

  it.each([
    {
      description: 'renders children when registration config is loaded',
      setup: () => mockGetConfig.mockResolvedValueOnce(mockRegistrationConfig),
      syncVisibleIds: [] as string[],
      expectedVisibleId: 'test-child',
      expectedHiddenIds: [] as string[],
    },
    {
      description:
        'shows loading state when registration config is being fetched',
      setup: () =>
        mockGetConfig.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(mockRegistrationConfig), 100),
            ),
        ),
      syncVisibleIds: ['registration-config-loader-test-id'],
      expectedVisibleId: 'test-child',
      expectedHiddenIds: [] as string[],
    },
    {
      description:
        'shows error notification and empty screen when there is an error fetching registration config',
      setup: () =>
        mockGetConfig.mockRejectedValueOnce(
          new Error('Failed to fetch registration config'),
        ),
      syncVisibleIds: [] as string[],
      expectedVisibleId: 'registration-config-error-test-id',
      expectedHiddenIds: ['test-child'],
    },
  ])(
    'should $description',
    async ({ setup, syncVisibleIds, expectedVisibleId, expectedHiddenIds }) => {
      setup();

      render(
        <TestWrapper>
          <TestComponent />
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
