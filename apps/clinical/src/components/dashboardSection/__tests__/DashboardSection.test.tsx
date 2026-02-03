import { DashboardSectionConfig } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';
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

// Mock dependencies
jest.mock('@bahmni/design-system', () => ({
  Tile: jest.fn(({ children, ref, ...rest }) => (
    <div className="cds--tile" data-testid="carbon-tile" ref={ref} {...rest}>
      {children}
    </div>
  )),
}));

// Mock the translation hook from @bahmni/services
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
  };
});

// Mock CSS modules
jest.mock('../styles/DashboardSection.module.scss', () => ({
  sectionTitle: 'sectionTitle',
  sectionTile: 'sectionTile',
  sectionName: 'sectionName',
  sectionWrapper: 'sectionWrapper',
  divider: 'divider',
  widgetError: 'widgetError',
  widgetLoading: 'widgetLoading',
  noContent: 'noContent',
}));

// Mock widget registry
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

// Create mock widget components
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

const renderDashboardSectionWithProvider = (
  section: DashboardSectionConfig,
  ref: React.RefObject<HTMLDivElement | null>,
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const mockEpisodeIds = ['episode-1', 'episode-2'];

  return render(
    <QueryClientProvider client={queryClient}>
      <ClinicalAppProvider episodeUuids={mockEpisodeIds}>
        <DashboardSection
          section={section}
          ref={ref}
          encounterUuids={[]}
          visitUuids={[]}
        />
      </ClinicalAppProvider>
    </QueryClientProvider>,
  );
};

describe('DashboardSection Component', () => {
  const mockRef = React.createRef<HTMLDivElement>();

  beforeEach(() => {
    mockGetWidget.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders with the correct section name', () => {
      const mockSection: DashboardSectionConfig = {
        id: 'test-section-id',
        name: 'Test Section',
        icon: 'test-icon',
        controls: [],
      };

      renderDashboardSectionWithProvider(mockSection, mockRef);

      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('has the correct id attribute', () => {
      const mockSection: DashboardSectionConfig = {
        id: 'test-section-id',
        name: 'Test Section',
        icon: 'test-icon',
        controls: [],
      };

      const { container } = renderDashboardSectionWithProvider(
        mockSection,
        mockRef,
      );

      const sectionDiv = container.querySelector(
        `div[id="section-${mockSection.id}"]`,
      );
      expect(sectionDiv).not.toBeNull();
    });

    it('renders a Tile component', () => {
      const mockSection: DashboardSectionConfig = {
        id: 'test-section-id',
        name: 'Test Section',
        icon: 'test-icon',
        controls: [],
      };

      renderDashboardSectionWithProvider(mockSection, mockRef);

      // data-testid includes section name for uniqueness
      expect(
        screen.getByTestId('dashboard-section-tile-Test Section'),
      ).toBeInTheDocument();
    });

    it('accepts a ref prop', () => {
      const testRef = React.createRef<HTMLDivElement>();
      const mockSection: DashboardSectionConfig = {
        id: 'test-section-id',
        name: 'Test Section',
        icon: 'test-icon',
        controls: [],
      };

      renderDashboardSectionWithProvider(mockSection, testRef);

      // data-testid includes section name for uniqueness
      expect(
        screen.getByTestId('dashboard-section-tile-Test Section'),
      ).toBeInTheDocument();
    });

    it('uses translationKey instead of name when available', () => {
      const sectionWithTranslationKey: DashboardSectionConfig = {
        id: 'test-section-id',
        name: 'Test Section',
        translationKey: 'custom.translation.key',
        icon: 'test-icon',
        controls: [],
      };

      renderDashboardSectionWithProvider(sectionWithTranslationKey, mockRef);

      // The mock returns the translated text for 'custom.translation.key'
      expect(screen.getByText('Translated Title')).toBeInTheDocument();
      // The original name should not be rendered
      expect(screen.queryByText('Test Section')).not.toBeInTheDocument();
    });
  });

  describe('Registry-based Widget Rendering', () => {
    it('renders a single widget from controls array', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'allergies') {
          return React.lazy(() =>
            Promise.resolve({ default: MockAllergiesWidget }),
          );
        }
        return undefined;
      });

      const section: DashboardSectionConfig = {
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [
          {
            type: 'allergies',
            config: {},
          },
        ],
      };

      renderDashboardSectionWithProvider(section, mockRef);

      await waitFor(() => {
        expect(screen.getByTestId('allergies-widget')).toBeInTheDocument();
      });

      expect(mockGetWidget).toHaveBeenCalledWith('allergies');
    });

    it('renders multiple widgets from controls array', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'conditions') {
          return React.lazy(() =>
            Promise.resolve({ default: MockConditionsWidget }),
          );
        }
        if (type === 'diagnosis') {
          return React.lazy(() =>
            Promise.resolve({ default: MockDiagnosisWidget }),
          );
        }
        return undefined;
      });

      const section: DashboardSectionConfig = {
        id: 'conditions-section',
        name: 'Conditions & Diagnoses',
        icon: 'test-icon',
        controls: [
          {
            type: 'conditions',
            config: {},
          },
          {
            type: 'diagnosis',
            config: {},
          },
        ],
      };

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={['episode-1', 'episode-2']}>
            <Suspense fallback={<div>Loading...</div>}>
              <DashboardSection
                section={section}
                ref={mockRef}
                encounterUuids={[]}
                visitUuids={[]}
              />
            </Suspense>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('conditions-widget')).toBeInTheDocument();
        expect(screen.getByTestId('diagnosis-widget')).toBeInTheDocument();
      });

      expect(mockGetWidget).toHaveBeenCalledWith('conditions');
      expect(mockGetWidget).toHaveBeenCalledWith('diagnosis');
    });

    it('passes config as props to widgets', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'allergies') {
          return React.lazy(() =>
            Promise.resolve({ default: MockAllergiesWidget }),
          );
        }
        return undefined;
      });

      const section: DashboardSectionConfig = {
        id: 'allergies-section',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [
          {
            type: 'allergies',
            config: {
              testProp: 'custom-value',
            },
          },
        ],
      };

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={['episode-1', 'episode-2']}>
            <Suspense fallback={<div>Loading...</div>}>
              <DashboardSection
                section={section}
                ref={mockRef}
                encounterUuids={[]}
                visitUuids={[]}
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
        if (type === 'conditions') {
          return React.lazy(() =>
            Promise.resolve({ default: MockConditionsWidget }),
          );
        }
        if (type === 'diagnosis') {
          return React.lazy(() =>
            Promise.resolve({ default: MockDiagnosisWidget }),
          );
        }
        if (type === 'treatment') {
          return React.lazy(() =>
            Promise.resolve({ default: MockTreatmentWidget }),
          );
        }
        return undefined;
      });

      const section: DashboardSectionConfig = {
        id: 'multi-widget-section',
        name: 'Multiple Widgets',
        icon: 'test-icon',
        controls: [
          { type: 'conditions', config: {} },
          { type: 'diagnosis', config: {} },
          { type: 'treatment', config: {} },
        ],
      };

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={['episode-1', 'episode-2']}>
            <Suspense fallback={<div>Loading...</div>}>
              <DashboardSection
                section={section}
                ref={mockRef}
                encounterUuids={[]}
                visitUuids={[]}
              />
            </Suspense>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('conditions-widget')).toBeInTheDocument();
      });

      // Should have 2 dividers for 3 widgets
      const dividers = container.querySelectorAll('.divider');
      expect(dividers).toHaveLength(2);
    });

    it('does not render divider after the last widget', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'allergies') {
          return React.lazy(() =>
            Promise.resolve({ default: MockAllergiesWidget }),
          );
        }
        return undefined;
      });

      const section: DashboardSectionConfig = {
        id: 'single-widget-section',
        name: 'Single Widget',
        icon: 'test-icon',
        controls: [{ type: 'allergies', config: {} }],
      };

      renderDashboardSectionWithProvider(section, mockRef);

      await waitFor(() => {
        expect(screen.getByTestId('allergies-widget')).toBeInTheDocument();
      });

      // Should have no dividers for single widget
      const { container } = render(
        <QueryClientProvider client={new QueryClient()}>
          <ClinicalAppProvider episodeUuids={[]}>
            <DashboardSection
              section={section}
              ref={mockRef}
              encounterUuids={[]}
              visitUuids={[]}
            />
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );
      const dividers = container.querySelectorAll('.divider');
      expect(dividers).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when widget is not found in registry', () => {
      mockGetWidget.mockReturnValue(undefined);

      const section: DashboardSectionConfig = {
        id: 'unknown-section',
        name: 'Unknown Widget',
        icon: 'test-icon',
        controls: [
          {
            type: 'unknown-widget',
            config: {},
          },
        ],
      };

      renderDashboardSectionWithProvider(section, mockRef);

      expect(
        screen.getByText(/Widget not found in registry/),
      ).toBeInTheDocument();
      expect(mockGetWidget).toHaveBeenCalledWith('unknown-widget');
    });

    it('displays multiple error messages for multiple unknown widgets', () => {
      mockGetWidget.mockReturnValue(undefined);

      const section: DashboardSectionConfig = {
        id: 'multiple-unknown-section',
        name: 'Multiple Unknown Widgets',
        icon: 'test-icon',
        controls: [
          { type: 'unknown-widget-1', config: {} },
          { type: 'unknown-widget-2', config: {} },
        ],
      };

      renderDashboardSectionWithProvider(section, mockRef);

      expect(screen.getAllByText(/Widget not found in registry/)).toHaveLength(
        2,
      );
    });

    it('renders valid widgets and shows errors for invalid ones', async () => {
      mockGetWidget.mockImplementation((type: string) => {
        if (type === 'allergies') {
          return React.lazy(() =>
            Promise.resolve({ default: MockAllergiesWidget }),
          );
        }
        if (type === 'diagnosis') {
          return React.lazy(() =>
            Promise.resolve({ default: MockDiagnosisWidget }),
          );
        }
        return undefined; // For unknown-widget
      });

      const section: DashboardSectionConfig = {
        id: 'mixed-section',
        name: 'Mixed Valid and Invalid',
        icon: 'test-icon',
        controls: [
          { type: 'allergies', config: {} },
          { type: 'unknown-widget', config: {} },
          { type: 'diagnosis', config: {} },
        ],
      };

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={['episode-1', 'episode-2']}>
            <Suspense fallback={<div>Loading...</div>}>
              <DashboardSection
                section={section}
                ref={mockRef}
                encounterUuids={[]}
                visitUuids={[]}
              />
            </Suspense>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('allergies-widget')).toBeInTheDocument();
        expect(screen.getByTestId('diagnosis-widget')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Widget not found in registry/),
      ).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('displays no content message when controls array is empty', () => {
      const section: DashboardSectionConfig = {
        id: 'empty-section',
        name: 'Empty Section',
        icon: 'test-icon',
        controls: [],
      };

      renderDashboardSectionWithProvider(section, mockRef);

      expect(
        screen.getByText('No widgets configured for this section'),
      ).toBeInTheDocument();
    });

    it('displays no content message when controls array is undefined', () => {
      const section: DashboardSectionConfig = {
        id: 'undefined-section',
        name: 'Undefined Controls',
        icon: 'test-icon',
        controls: undefined as any,
      };

      renderDashboardSectionWithProvider(section, mockRef);

      expect(
        screen.getByText('No widgets configured for this section'),
      ).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading fallback while widget is loading', async () => {
      mockGetWidget.mockReturnValue(
        React.lazy(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ default: MockAllergiesWidget }), 100),
            ),
        ),
      );

      const section: DashboardSectionConfig = {
        id: 'loading-section',
        name: 'Loading Widget',
        icon: 'test-icon',
        controls: [{ type: 'allergies', config: {} }],
      };

      renderDashboardSectionWithProvider(section, mockRef);

      expect(screen.getByText('Loading widget...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('allergies-widget')).toBeInTheDocument();
      });

      expect(screen.queryByText('Loading widget...')).not.toBeInTheDocument();
    });
  });
});
