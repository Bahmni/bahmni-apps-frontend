import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useContext } from 'react';
import { ClinicalAppContext } from '../../contexts/ClinicalAppContext';
import { usePatientVisit } from '../../hooks/usePatientVisit';
import { ClinicalAppProvider } from '../ClinicalAppProvider';

// Mock the services
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getEncountersAndVisitsForEOC: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        LOADING_CLINICAL_DATA: 'Loading clinical data...',
        ERROR_FETCHING_CLINICAL_DATA: 'Error fetching clinical data',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../hooks/usePatientVisit');

const mockGetEncountersAndVisitsForEOC =
  services.getEncountersAndVisitsForEOC as jest.MockedFunction<
    typeof services.getEncountersAndVisitsForEOC
  >;

const mockUseSubscribeConsultationSaved =
  services.useSubscribeConsultationSaved as jest.MockedFunction<
    typeof services.useSubscribeConsultationSaved
  >;

const mockUsePatientVisit = usePatientVisit as jest.MockedFunction<
  typeof usePatientVisit
>;

const ContextDump: React.FC = () => {
  const context = useContext(ClinicalAppContext);
  return (
    <div data-testid="context-dump">
      {JSON.stringify(context?.episodeOfCare ?? [])}
    </div>
  );
};

describe('ClinicalAppProvider', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockUseSubscribeConsultationSaved.mockImplementation(() => {});
    mockUsePatientVisit.mockReturnValue({
      activeVisit: { id: 'active-visit-1' } as any,
      lastVisit: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Rendering', () => {
    it('should render children when data loads successfully', async () => {
      mockGetEncountersAndVisitsForEOC.mockResolvedValue({
        encounterUuids: ['encounter-1'],
        visitUuids: ['visit-1'],
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider
            episodeUuids={['episode-1']}
            patientId="patient-1"
          >
            <div data-testid="test-child">Test Child</div>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
      });
    });

    it('should show loading state when episodeUuids is non-empty and data is loading', () => {
      mockGetEncountersAndVisitsForEOC.mockImplementation(
        () =>
          new Promise(() => {
            // Never resolve to keep it in loading state
          }),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider
            episodeUuids={['episode-1']}
            patientId="patient-1"
          >
            <div data-testid="test-child">Test Child</div>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      expect(screen.getByText('Loading clinical data...')).toBeInTheDocument();
    });

    it('should show error state on query failure', async () => {
      mockGetEncountersAndVisitsForEOC.mockRejectedValue(
        new Error('API Error'),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider
            episodeUuids={['episode-1']}
            patientId="patient-1"
          >
            <div data-testid="test-child">Test Child</div>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Error fetching clinical data'),
        ).toBeInTheDocument();
      });
    });

    it('should render children without loading when episodeUuids is empty', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider episodeUuids={[]} patientId="patient-1">
            <div data-testid="test-child">Test Child</div>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(
        screen.queryByText('Loading clinical data...'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Consultation Saved Event Subscription', () => {
    it('should register consultation saved subscription', async () => {
      mockGetEncountersAndVisitsForEOC.mockResolvedValue({
        encounterUuids: ['encounter-1'],
        visitUuids: ['visit-1'],
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider
            episodeUuids={['episode-1']}
            patientId="patient-1"
          >
            <div data-testid="test-child">Test Child</div>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(mockUseSubscribeConsultationSaved).toHaveBeenCalled();
      });

      // Verify the subscription was set up with callback and dependencies
      expect(mockUseSubscribeConsultationSaved).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Array),
      );
    });

    it('should pass episodeUuids in subscription dependencies', async () => {
      mockGetEncountersAndVisitsForEOC.mockResolvedValue({
        encounterUuids: ['encounter-1'],
        visitUuids: ['visit-1'],
      });

      const deps: any[] = [];
      mockUseSubscribeConsultationSaved.mockImplementation(
        (_callback, dependencies) => {
          deps.push(dependencies);
        },
      );

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider
            episodeUuids={['episode-1']}
            patientId="patient-1"
          >
            <div data-testid="test-child">Test Child</div>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(deps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multiple active episodes', () => {
    it('keeps each episode of care scoped to its own encounters/visits, never merged', async () => {
      mockGetEncountersAndVisitsForEOC.mockImplementation((eocUuids) =>
        Promise.resolve(
          eocUuids[0] === 'episode-1'
            ? { encounterUuids: ['encounter-1'], visitUuids: ['visit-1'] }
            : { encounterUuids: ['encounter-2'], visitUuids: ['visit-2'] },
        ),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider
            episodeUuids={['episode-1', 'episode-2']}
            patientId="patient-1"
          >
            <ContextDump />
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      const contextDump = await screen.findByTestId('context-dump');

      await waitFor(() => {
        expect(mockGetEncountersAndVisitsForEOC).toHaveBeenCalledTimes(2);
      });

      expect(mockGetEncountersAndVisitsForEOC).toHaveBeenCalledWith([
        'episode-1',
      ]);
      expect(mockGetEncountersAndVisitsForEOC).toHaveBeenCalledWith([
        'episode-2',
      ]);

      await waitFor(() => {
        expect(contextDump.textContent).not.toBe('[]');
      });

      const dump = JSON.parse(contextDump.textContent ?? '[]');
      expect(dump).toEqual([
        {
          uuid: 'episode-1',
          encounterUuids: ['encounter-1'],
          visitUuids: ['visit-1'],
        },
        {
          uuid: 'episode-2',
          encounterUuids: ['encounter-2'],
          visitUuids: ['visit-2'],
        },
      ]);
    });

    it('invalidates each episode uuid query key independently on consultation save', async () => {
      mockGetEncountersAndVisitsForEOC.mockResolvedValue({
        encounterUuids: ['encounter-1'],
        visitUuids: ['visit-1'],
      });

      let savedCallback: (() => void) | undefined;
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        savedCallback = callback;
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      render(
        <QueryClientProvider client={queryClient}>
          <ClinicalAppProvider
            episodeUuids={['episode-1', 'episode-2']}
            patientId="patient-1"
          >
            <div data-testid="test-child">Test Child</div>
          </ClinicalAppProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
      });

      savedCallback?.();

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['encounters-for-eoc', 'episode-1'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['encounters-for-eoc', 'episode-2'],
      });
    });
  });
});
