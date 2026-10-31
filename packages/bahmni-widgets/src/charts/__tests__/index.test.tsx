import { getBundle } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import Graph from '..';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { resolveNavigationURL } from '../../utils/urlUtils';
import { ChartConfig } from '../model';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getBundle: jest.fn(),
}));
jest.mock('../../utils/urlUtils', () => ({
  resolveNavigationURL: jest.fn(),
}));
jest.mock('@bahmni/design-system', () => ({
  LineChart: (props: {
    data?: unknown[];
    ariaLabel?: string;
    testId?: string;
  }) => (
    <div
      data-testid="mock-LineChart"
      data-points={props.data?.length ?? 0}
      data-aria={props.ariaLabel}
      data-tid={props.testId}
    />
  ),
  AreaChart: (props: {
    data?: unknown[];
    ariaLabel?: string;
    testId?: string;
  }) => (
    <div
      data-testid="mock-AreaChart"
      data-points={props.data?.length ?? 0}
      data-aria={props.ariaLabel}
      data-tid={props.testId}
    />
  ),
  BarChart: (props: {
    data?: unknown[];
    ariaLabel?: string;
    testId?: string;
  }) => (
    <div
      data-testid="mock-BarChart"
      data-points={props.data?.length ?? 0}
      data-aria={props.ariaLabel}
      data-tid={props.testId}
    />
  ),
  ScatterChart: (props: {
    data?: unknown[];
    ariaLabel?: string;
    testId?: string;
  }) => (
    <div
      data-testid="mock-ScatterChart"
      data-points={props.data?.length ?? 0}
      data-aria={props.ariaLabel}
      data-tid={props.testId}
    />
  ),
  ChartSkeleton: (props: { ariaLabel?: string; testId?: string }) => (
    <div
      data-testid="mock-ChartSkeleton"
      data-aria={props.ariaLabel}
      data-tid={props.testId}
    />
  ),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockGetBundle = getBundle as jest.MockedFunction<typeof getBundle>;
const mockResolveNavigationURL = resolveNavigationURL as jest.MockedFunction<
  typeof resolveNavigationURL
>;

const baseConfig = (overrides: Partial<ChartConfig> = {}): ChartConfig => ({
  url: 'fhir/Observation?patient={patientUuid}',
  chartType: 'line',
  title: 'Chart',
  expression: `{"points":[],"xType":"category"}`,
  ...overrides,
});

const renderGraph = (config: ChartConfig): RenderResult => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return render(<Graph config={config as never} />, { wrapper });
};

describe('Graph widget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientUUID.mockReturnValue('patient-1');
    mockResolveNavigationURL.mockImplementation((url) => Promise.resolve(url));
    mockGetBundle.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    } as never);
  });

  it('renders the ChartSkeleton while the fetch is in flight', () => {
    mockGetBundle.mockReturnValue(new Promise(() => undefined));

    renderGraph(baseConfig());

    const skeleton = screen.getByTestId('mock-ChartSkeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('data-aria', 'Loading chart');
    expect(skeleton).toHaveAttribute('data-tid', 'chart-loading');
  });

  it('renders the empty state with the default message when points are empty', async () => {
    renderGraph(baseConfig());

    await waitFor(() => {
      expect(screen.getByTestId('chart-empty-test-id')).toHaveTextContent(
        'CHART_EMPTY_DEFAULT',
      );
    });
  });

  it('uses config.emptyMessage for the empty state when provided', async () => {
    renderGraph(
      baseConfig({ emptyMessage: 'No vitals in the selected period.' }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('chart-empty-test-id')).toHaveTextContent(
        'No vitals in the selected period.',
      );
    });
  });

  it('renders the error state with the default message when the fetch fails', async () => {
    mockGetBundle.mockRejectedValue(new Error('network down'));

    renderGraph(baseConfig());

    await waitFor(() => {
      expect(screen.getByTestId('chart-error-test-id')).toHaveTextContent(
        'network down',
      );
    });
  });

  it('falls back to the error state when patientUuid is missing', async () => {
    mockUsePatientUUID.mockReturnValue(null);

    renderGraph(baseConfig());

    await waitFor(() => {
      expect(screen.getByTestId('chart-error-test-id')).toHaveTextContent(
        'CHART_MISSING_PATIENT_ID',
      );
      expect(mockGetBundle).not.toHaveBeenCalled();
    });
  });

  it('falls back to the error state when chartType is unknown', async () => {
    renderGraph(
      baseConfig({ chartType: 'donut' as unknown as ChartConfig['chartType'] }),
    );

    expect(screen.getByTestId('chart-error-test-id')).toHaveTextContent(
      'CHART_ERROR_DEFAULT',
    );
    expect(mockGetBundle).not.toHaveBeenCalled();
  });

  it.each([
    ['line', 'mock-LineChart'],
    ['area', 'mock-AreaChart'],
    ['bar', 'mock-BarChart'],
    ['scatter', 'mock-ScatterChart'],
  ] as Array<[ChartConfig['chartType'], string]>)(
    'routes %s points to its matching Carbon wrapper',
    async (chartType, testId) => {
      mockGetBundle.mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: {} }],
      } as never);

      renderGraph(
        baseConfig({
          chartType,
          expression:
            '{"points":[{"x":1,"y":10},{"x":2,"y":20}],"xType":"category"}',
        }),
      );

      expect(await screen.findByTestId(testId)).toBeInTheDocument();
    },
  );

  it('routes multi-series points without dropping a group', async () => {
    mockGetBundle.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: {} }],
    } as never);

    renderGraph(
      baseConfig({
        expression:
          '{"points":[{"x":1,"y":120,"series":"systolic"},{"x":1,"y":80,"series":"diastolic"}],"xType":"date"}',
      }),
    );

    const el = await screen.findByTestId('mock-LineChart');
    expect(el.getAttribute('data-points')).toBe('2');
  });

  it('falls back to the error state when url cannot be resolved', async () => {
    mockResolveNavigationURL.mockResolvedValue(null as never);

    renderGraph(baseConfig());

    await waitFor(() => {
      expect(screen.getByTestId('chart-error-test-id')).toHaveTextContent(
        'CHART_URL_UNRESOLVED',
      );
      expect(mockGetBundle).not.toHaveBeenCalled();
    });
  });

  it('matches snapshot', async () => {
    const { container } = renderGraph(
      baseConfig({
        expression:
          '{"points":[{"x":1,"y":120,"series":"systolic"},{"x":1,"y":80,"series":"diastolic"}],"xType":"date"}',
      }),
    );
    expect(container).toMatchSnapshot();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderGraph(
      baseConfig({
        expression:
          '{"points":[{"x":1,"y":120,"series":"systolic"},{"x":1,"y":80,"series":"diastolic"}],"xType":"date"}',
      }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
