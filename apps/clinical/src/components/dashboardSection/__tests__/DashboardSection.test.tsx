import { Loading } from '@bahmni/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import React, { Suspense } from 'react';
import { DashboardSectionConfig } from '../../../pages/models';
import { ClinicalAppProvider } from '../../../providers/ClinicalAppProvider';
import DashboardSection from '../DashboardSection';

jest.mock('../../../providers/ClinicalAppProvider', () => ({
  ClinicalAppProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-clinical-apps-provider">{children}</div>
  ),
}));

jest.mock('../../../hooks/useClinicalAppData', () => ({
  useClinicalAppData: () => ({
    episodeOfCare: [],
    visit: [],
    encounter: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@bahmni/design-system', () => ({
  Tile: jest.fn(({ children, ref, ...rest }) => (
    <div className="cds--tile" data-testid="carbon-tile" ref={ref} {...rest}>
      {children}
    </div>
  )),
  Loading: jest.fn(() => <div data-testid="loading" />),
}));

jest.mock('@bahmni/services', () => {
  const actual = jest.requireActual('@bahmni/services');
  return {
    ...actual,
    useTranslation: () => ({
      t: jest.fn((key) => {
        const translations: Record<string, string> = {
          'custom.translation.key': 'Translated Title',
          NO_CONFIGURED_CONTROLS: 'No widgets configured for this section',
          CONTROL_NOT_FOUND: 'Widget not found in registry',
          INITIALIZING_CONTROL: 'Loading widget...',
        };
        return translations[key] || key;
      }),
    }),
    useEncounterSessionStore: jest.fn(() => ({
      canEditOrCreate: false,
      isLoading: false,
      matchReasons: [],
    })),
  };
});

jest.mock('@bahmni/widgets', () => {
  const actual = jest.requireActual('@bahmni/widgets');
  return {
    ...actual,
    getWidget: jest.fn(),
    registerWidget: jest.fn(),
  };
});

const mockGetWidget = jest.mocked(
  jest.requireMock('@bahmni/widgets').getWidget,
);
const mockUseEncounterSessionStore = jest.mocked(
  jest.requireMock('@bahmni/services').useEncounterSessionStore,
);

const MockAllergiesWidget = ({
  config,
}: {
  config?: Record<string, unknown>;
}) => (
  <div data-testid="allergies-widget">
    Allergies Widget{' '}
    {typeof config?.testProp === 'string' && `- ${config.testProp}`}
  </div>
);

const MockConditionsWidget = ({
  config,
}: {
  config?: Record<string, unknown>;
}) => (
  <div data-testid="conditions-widget">
    Conditions Widget{' '}
    {typeof config?.testProp === 'string' && `- ${config.testProp}`}
  </div>
);

const MockDiagnosisWidget = () => (
  <div data-testid="diagnosis-widget">Diagnosis Widget</div>
);

const MockTreatmentWidget = () => (
  <div data-testid="treatment-widget">Treatment Widget</div>
);

const renderSection = (
  section: DashboardSectionConfig,
  ref = React.createRef<HTMLDivElement>(),
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ClinicalAppProvider episodeUuids={['episode-1']}>
        <DashboardSection
          section={section}
          ref={ref}
          encounterUuids={[]}
          visitUuids={[]}
          episodeOfCareUuids={[]}
        />
      </ClinicalAppProvider>
    </QueryClientProvider>,
  );
};

describe('DashboardSection Component', () => {
  const mockRef = React.createRef<HTMLDivElement>();

  beforeEach(() => {
    mockGetWidget.mockReset();
    mockUseEncounterSessionStore.mockReturnValue({
      matchReasons: [],
      canEditOrCreate: false,
      isLoading: false,
    });
  });

  describe('Basic Rendering', () => {
    it('renders with the correct section name', () => {
      renderSection({
        id: 'test-section-id',
        name: 'Test Section',
        icon: 'test-icon',
        controls: [],
      });
      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('has the correct id attribute', () => {
      const { container } = renderSection({
        id: 'test-section-id',
        name: 'Test Section',
        icon: 'test-icon',
        controls: [],
      });
      expect(
        container.querySelector('div[id="section-test-section-id"]'),
      ).not.toBeNull();
    });

    it('renders a Tile component', () => {
      renderSection({
        id: 'test-section-id',
        name: 'Test Section',
        icon: 'test-icon',
        controls: [],
      });
      expect(
        screen.getByTestId('dashboard-section-tile-Test Section'),
      ).toBeInTheDocument();
    });

    it('uses translationKey instead of name when available', () => {
      renderSection({
        id: 'test-section-id',
        name: 'Test Section',
        translationKey: 'custom.translation.key',
        icon: 'test-icon',
        controls: [],
      });
      expect(screen.getByText('Translated Title')).toBeInTheDocument();
      expect(screen.queryByText('Test Section')).not.toBeInTheDocument();
    });

    it('renders no button in the tile header', () => {
      renderSection({
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [{ type: 'allergies', name: '', config: {} }],
      });
      const tile = screen.getByTestId('dashboard-section-tile-Allergies');
      expect(within(tile).queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Registry-based Widget Rendering', () => {
    it('renders a single widget from controls array', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'allergies')
          return React.lazy(() =>
            Promise.resolve({ default: MockAllergiesWidget }),
          );
        return undefined;
      });

      renderSection({
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [{ type: 'allergies', name: '', config: {} }],
      });

      await waitFor(() => {
        expect(screen.getByTestId('allergies-widget')).toBeInTheDocument();
      });
      expect(mockGetWidget).toHaveBeenCalledWith('allergies');
    });

    it('renders multiple widgets from controls array', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'conditions')
          return React.lazy(() =>
            Promise.resolve({ default: MockConditionsWidget }),
          );
        if (type === 'diagnosis')
          return React.lazy(() =>
            Promise.resolve({ default: MockDiagnosisWidget }),
          );
        return undefined;
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={['episode-1']}>
            <Suspense fallback={<Loading />}>
              <DashboardSection
                section={{
                  id: 'conditions-section',
                  name: 'Conditions',
                  icon: 'test-icon',
                  controls: [
                    { type: 'conditions', name: '', config: {} },
                    { type: 'diagnosis', name: '', config: {} },
                  ],
                }}
                ref={mockRef}
                encounterUuids={[]}
                visitUuids={[]}
                episodeOfCareUuids={[]}
              />
            </Suspense>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('conditions-widget')).toBeInTheDocument();
        expect(screen.getByTestId('diagnosis-widget')).toBeInTheDocument();
      });
    });

    it('passes config as props to widgets', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'allergies')
          return React.lazy(() =>
            Promise.resolve({ default: MockAllergiesWidget }),
          );
        return undefined;
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={['episode-1']}>
            <Suspense fallback={<Loading />}>
              <DashboardSection
                section={{
                  id: 'allergies-section',
                  name: 'Allergies',
                  icon: 'test-icon',
                  controls: [
                    {
                      type: 'allergies',
                      name: '',
                      config: { testProp: 'custom-value' },
                    },
                  ],
                }}
                ref={mockRef}
                encounterUuids={[]}
                visitUuids={[]}
                episodeOfCareUuids={[]}
              />
            </Suspense>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Allergies Widget - custom-value'),
        ).toBeInTheDocument();
      });
    });

    it('renders dividers between multiple widgets', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        const map: Record<string, React.FC> = {
          conditions: MockConditionsWidget,
          diagnosis: MockDiagnosisWidget,
          treatment: MockTreatmentWidget,
        };
        return map[type]
          ? React.lazy(() => Promise.resolve({ default: map[type] }))
          : undefined;
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={['episode-1']}>
            <Suspense fallback={<Loading />}>
              <DashboardSection
                section={{
                  id: 'multi-section',
                  name: 'Multi',
                  icon: 'test-icon',
                  controls: [
                    { type: 'conditions', name: '', config: {} },
                    { type: 'diagnosis', name: '', config: {} },
                    { type: 'treatment', name: '', config: {} },
                  ],
                }}
                ref={mockRef}
                encounterUuids={[]}
                visitUuids={[]}
                episodeOfCareUuids={[]}
              />
            </Suspense>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('conditions-widget')).toBeInTheDocument();
      });
      expect(container.querySelectorAll('.divider')).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when widget is not found in registry', () => {
      mockGetWidget.mockReturnValue(undefined);

      renderSection({
        id: 'unknown-section',
        name: 'Unknown Widget',
        icon: 'test-icon',
        controls: [{ type: 'unknown-widget', name: '', config: {} }],
      });

      expect(
        screen.getByText(/Widget not found in registry/),
      ).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('displays no content message when controls array is empty', () => {
      renderSection({
        id: 'empty-section',
        name: 'Empty Section',
        icon: 'test-icon',
        controls: [],
      });
      expect(
        screen.getByText('No widgets configured for this section'),
      ).toBeInTheDocument();
    });
  });

  describe('disableActions prop', () => {
    it('passes disableActions=true when matchReasons includes NO_ACTIVE_VISIT', async () => {
      const capturedProps: Record<string, unknown>[] = [];
      const ProbeWidget = (props: Record<string, unknown>) => {
        capturedProps.push(props);
        return <div data-testid="probe-widget" />;
      };
      mockGetWidget.mockReturnValue(
        React.lazy(() => Promise.resolve({ default: ProbeWidget })),
      );
      mockUseEncounterSessionStore.mockReturnValue({
        matchReasons: ['NO_ACTIVE_VISIT'],
        canEditOrCreate: false,
        isLoading: false,
      });

      renderSection({
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [{ type: 'allergies', name: '', config: {} }],
      });

      await waitFor(() => {
        expect(screen.getByTestId('probe-widget')).toBeInTheDocument();
      });
      expect(capturedProps[0].disableActions).toBe(true);
    });

    it('passes canEditOrCreate to widgets', async () => {
      const capturedProps: Record<string, unknown>[] = [];
      const ProbeWidget = (props: Record<string, unknown>) => {
        capturedProps.push(props);
        return <div data-testid="probe-widget-edit" />;
      };
      mockGetWidget.mockReturnValue(
        React.lazy(() => Promise.resolve({ default: ProbeWidget })),
      );
      mockUseEncounterSessionStore.mockReturnValue({
        matchReasons: [],
        canEditOrCreate: true,
        isLoading: false,
        activeEncounter: { id: 'enc-123' },
      });

      renderSection({
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [{ type: 'allergies', name: '', config: {} }],
      });

      await waitFor(() => {
        expect(screen.getByTestId('probe-widget-edit')).toBeInTheDocument();
      });
      expect(capturedProps[0].canEditOrCreate).toBe(true);
    });

    it('passes activeEncounterUuid derived from activeEncounter to widgets', async () => {
      const capturedProps: Record<string, unknown>[] = [];
      const ProbeWidget = (props: Record<string, unknown>) => {
        capturedProps.push(props);
        return <div data-testid="probe-widget-enc" />;
      };
      mockGetWidget.mockReturnValue(
        React.lazy(() => Promise.resolve({ default: ProbeWidget })),
      );
      mockUseEncounterSessionStore.mockReturnValue({
        matchReasons: [],
        canEditOrCreate: true,
        isLoading: false,
        activeEncounter: { id: 'enc-active-uuid' },
      });

      renderSection({
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [{ type: 'allergies', name: '', config: {} }],
      });

      await waitFor(() => {
        expect(screen.getByTestId('probe-widget-enc')).toBeInTheDocument();
      });
      expect(capturedProps[0].activeEncounterUuid).toBe('enc-active-uuid');
    });

    it('passes activeEncounterUuid as null when no active encounter exists', async () => {
      const capturedProps: Record<string, unknown>[] = [];
      const ProbeWidget = (props: Record<string, unknown>) => {
        capturedProps.push(props);
        return <div data-testid="probe-widget-no-enc" />;
      };
      mockGetWidget.mockReturnValue(
        React.lazy(() => Promise.resolve({ default: ProbeWidget })),
      );
      mockUseEncounterSessionStore.mockReturnValue({
        matchReasons: [],
        canEditOrCreate: false,
        isLoading: false,
        activeEncounter: undefined,
      });

      renderSection({
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [{ type: 'allergies', name: '', config: {} }],
      });

      await waitFor(() => {
        expect(screen.getByTestId('probe-widget-no-enc')).toBeInTheDocument();
      });
      expect(capturedProps[0].activeEncounterUuid).toBeNull();
    });

    it('passes disableActions=false when matchReasons is empty', async () => {
      const capturedProps: Record<string, unknown>[] = [];
      const ProbeWidget = (props: Record<string, unknown>) => {
        capturedProps.push(props);
        return <div data-testid="probe-widget-active" />;
      };
      mockGetWidget.mockReturnValue(
        React.lazy(() => Promise.resolve({ default: ProbeWidget })),
      );

      renderSection({
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [{ type: 'allergies', name: '', config: {} }],
      });

      await waitFor(() => {
        expect(screen.getByTestId('probe-widget-active')).toBeInTheDocument();
      });
      expect(capturedProps[0].disableActions).toBe(false);
    });
  });
});
