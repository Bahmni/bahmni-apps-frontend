import { getConfig } from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ClinicalConfigProvider } from '../index';
import { ClinicalConfig } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

const mockClinicalConfig: ClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'Dashboard 1',
      url: '/dashboard1',
      requiredPrivileges: ['privilege1'],
      icon: 'icon1',
      default: true,
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: 'med-uuid',
      foodAllergenUuid: 'food-uuid',
      environmentalAllergenUuid: 'env-uuid',
      allergyReactionUuid: 'reaction-uuid',
    },
  },
};

const TestComponent = () => <div data-testid="test-child">Test Child</div>;

describe('ClinicalConfigProvider', () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <ClinicalConfigProvider>{children}</ClinicalConfigProvider>
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
      description: 'renders children when clinical config is loaded',
      setup: () => mockGetConfig.mockResolvedValueOnce(mockClinicalConfig),
      syncVisibleIds: [] as string[],
      expectedVisibleId: 'test-child',
      expectedHiddenIds: [] as string[],
    },
    {
      description: 'shows loading state when clinical config is being fetched',
      setup: () =>
        mockGetConfig.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(mockClinicalConfig), 100),
            ),
        ),
      syncVisibleIds: ['clinical-config-loader-test-id'],
      expectedVisibleId: 'test-child',
      expectedHiddenIds: [] as string[],
    },
    {
      description:
        'shows error notification and empty screen when there is an error fetching clinical config',
      setup: () =>
        mockGetConfig.mockRejectedValueOnce(
          new Error('Failed to fetch clinical config'),
        ),
      syncVisibleIds: [] as string[],
      expectedVisibleId: 'clinical-config-error-test-id',
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
