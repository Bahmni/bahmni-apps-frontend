import { getDiagnosticReportBundle } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import {
  ExtractedObservation,
  ExtractedObservationsResult,
} from '../../observations/models';
import { extractObservationsFromBundle } from '../../observations/utils';
import { RadiologyInvestigationReport } from '../RadiologyInvestigationReport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getDiagnosticReportBundle: jest.fn(),
}));

jest.mock('../../observations/utils', () => ({
  ...jest.requireActual('../../observations/utils'),
  extractObservationsFromBundle: jest.fn(),
}));

describe('Observations Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should render loading state when data is being fetched', () => {
    (getDiagnosticReportBundle as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    expect(screen.getByTestId(/skeleton/i)).toBeInTheDocument();
  });

  it('should render null when transformedObservations is null', async () => {
    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(null);

    const { container } = renderWithQueryClient(
      <RadiologyInvestigationReport reportId="report-1" />,
    );

    await screen.findByTestId(/skeleton/i);
    expect(container.querySelector('#radiology-observations')).toBeNull();
  });

  it('should render observations without members', async () => {
    const mockObservations: ExtractedObservation[] = [
      {
        id: 'obs-1',
        display: 'Heart Rate',
        observationValue: {
          value: 72,
          unit: 'bpm',
          type: 'quantity',
          isAbnormal: false,
        },
      },
    ];

    const transformedObservations: ExtractedObservationsResult = {
      observations: mockObservations,
      groupedObservations: [],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    expect(
      await screen.findByTestId('radiology-observations-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('observation-item-Heart Rate-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('observation-label-Heart Rate-0'),
    ).toHaveTextContent('Heart Rate');
    expect(
      screen.getByTestId('observation-value-Heart Rate-0'),
    ).toHaveTextContent('72 bpm');
  });

  it('should render observations with reference range', async () => {
    const mockObservations: ExtractedObservation[] = [
      {
        id: 'obs-1',
        display: 'Blood Glucose',
        observationValue: {
          value: 95,
          unit: 'mg/dL',
          type: 'quantity',
          isAbnormal: false,
          referenceRange: {
            low: { value: 70 },
            high: { value: 100 },
          },
        },
      },
    ];

    const transformedObservations: ExtractedObservationsResult = {
      observations: mockObservations,
      groupedObservations: [],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    expect(
      screen.getByTestId('observation-label-Blood Glucose-0'),
    ).toHaveTextContent('Blood Glucose');
    expect(
      screen.getByTestId('observation-label-Blood Glucose-0'),
    ).toHaveTextContent('(70 - 100)');
    expect(
      screen.getByTestId('observation-value-Blood Glucose-0'),
    ).toHaveTextContent('95 mg/dL');
  });

  it('should render abnormal observations with proper styling', async () => {
    const mockObservations: ExtractedObservation[] = [
      {
        id: 'obs-1',
        display: 'High Temperature',
        observationValue: {
          value: 39.5,
          unit: '°C',
          type: 'quantity',
          isAbnormal: true,
          referenceRange: {
            high: { value: 37.5 },
          },
        },
      },
    ];

    const transformedObservations: ExtractedObservationsResult = {
      observations: mockObservations,
      groupedObservations: [],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    const label = screen.getByTestId('observation-label-High Temperature-0');
    const value = screen.getByTestId('observation-value-High Temperature-0');

    expect(label).toHaveClass('abnormalValue');
    expect(value).toHaveClass('abnormalValue');
  });

  it('should render observations with only low reference range', async () => {
    const mockObservations: ExtractedObservation[] = [
      {
        id: 'obs-1',
        display: 'Hemoglobin',
        observationValue: {
          value: 13,
          unit: 'g/dL',
          type: 'quantity',
          isAbnormal: false,
          referenceRange: {
            low: { value: 12 },
          },
        },
      },
    ];

    const transformedObservations: ExtractedObservationsResult = {
      observations: mockObservations,
      groupedObservations: [],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    expect(
      screen.getByTestId('observation-label-Hemoglobin-0'),
    ).toHaveTextContent('(>12)');
  });

  it('should render observations with only high reference range', async () => {
    const mockObservations: ExtractedObservation[] = [
      {
        id: 'obs-1',
        display: 'Blood Pressure',
        observationValue: {
          value: 115,
          unit: 'mmHg',
          type: 'quantity',
          isAbnormal: false,
          referenceRange: {
            high: { value: 120 },
          },
        },
      },
    ];

    const transformedObservations: ExtractedObservationsResult = {
      observations: mockObservations,
      groupedObservations: [],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    expect(
      screen.getByTestId('observation-label-Blood Pressure-0'),
    ).toHaveTextContent('(<120)');
  });

  it('should render grouped observations with members', async () => {
    const transformedObservations: ExtractedObservationsResult = {
      observations: [],
      groupedObservations: [
        {
          id: 'group-1',
          display: 'Complete Blood Count',
          members: [
            {
              id: 'member-1',
              display: 'WBC',
              observationValue: {
                value: 7000,
                unit: 'cells/μL',
                type: 'quantity',
                isAbnormal: false,
              },
            },
            {
              id: 'member-2',
              display: 'RBC',
              observationValue: {
                value: 4.5,
                unit: 'million/μL',
                type: 'quantity',
                isAbnormal: false,
              },
            },
          ],
        },
      ],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    expect(
      screen.getByTestId('observation-label-Complete Blood Count-0'),
    ).toHaveTextContent('Complete Blood Count');
    expect(
      screen.getByTestId('observation-group-members-Complete Blood Count-0'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('obs-member-row-WBC-0')).toBeInTheDocument();
    expect(screen.getByTestId('obs-member-label-WBC-0')).toHaveTextContent(
      'WBC',
    );
    expect(screen.getByTestId('obs-member-value-WBC-0')).toHaveTextContent(
      '7000 cells/μL',
    );
    expect(screen.getByTestId('obs-member-row-RBC-1')).toBeInTheDocument();
  });

  it('should render nested grouped observations with proper indentation', async () => {
    const transformedObservations: ExtractedObservationsResult = {
      observations: [],
      groupedObservations: [
        {
          id: 'group-1',
          display: 'Panel',
          members: [
            {
              id: 'nested-group-1',
              display: 'Sub Panel',
              members: [
                {
                  id: 'member-1',
                  display: 'Nested Value',
                  observationValue: {
                    value: 100,
                    unit: 'mg/dL',
                    type: 'quantity',
                    isAbnormal: false,
                  },
                },
              ],
            },
          ],
        },
      ] as any,
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    expect(
      screen.getByTestId('obs-nested-group-Sub Panel-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('obs-nested-group-label-Sub Panel-0'),
    ).toHaveTextContent('Sub Panel');
    expect(
      screen.getByTestId('obs-member-row-Nested Value-0'),
    ).toBeInTheDocument();
  });

  it('should render abnormal values in grouped observations', async () => {
    const transformedObservations: ExtractedObservationsResult = {
      observations: [],
      groupedObservations: [
        {
          id: 'group-1',
          display: 'Liver Function',
          members: [
            {
              id: 'member-1',
              display: 'ALT',
              observationValue: {
                value: 150,
                unit: 'U/L',
                type: 'quantity',
                isAbnormal: true,
                referenceRange: {
                  high: { value: 40 },
                },
              },
            },
          ],
        },
      ] as any,
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    const memberLabel = screen.getByTestId('obs-member-label-ALT-0');
    const memberValue = screen.getByTestId('obs-member-value-ALT-0');

    expect(memberLabel).toHaveClass('abnormalValue');
    expect(memberValue).toHaveClass('abnormalValue');
    expect(memberLabel).toHaveTextContent('(<40)');
  });

  it('should render observations without units', async () => {
    const mockObservations: ExtractedObservation[] = [
      {
        id: 'obs-1',
        display: 'Result',
        observationValue: {
          value: 'Positive',
          type: 'string',
          isAbnormal: false,
        },
      },
    ];

    const transformedObservations: ExtractedObservationsResult = {
      observations: mockObservations,
      groupedObservations: [],
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    expect(screen.getByTestId('observation-value-Result-0')).toHaveTextContent(
      'Positive',
    );
  });

  it('should render multiple observations and grouped observations together', async () => {
    const transformedObservations: ExtractedObservationsResult = {
      observations: [
        {
          id: 'obs-1',
          display: 'Simple Test',
          conceptId: '12345',
          observationValue: {
            value: 10,
            unit: 'mg',
            type: 'quantity',
            isAbnormal: false,
          },
        },
      ],
      groupedObservations: [
        {
          id: 'group-1',
          display: 'Panel Test',
          members: [
            {
              id: 'member-1',
              display: 'Panel Member',
              conceptId: '23456',
              observationValue: {
                value: 20,
                unit: 'mg',
                type: 'quantity',
                isAbnormal: false,
              },
            },
          ],
        },
      ] as any,
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);

    await screen.findByTestId('radiology-observations-test-id');

    expect(
      screen.getByTestId('observation-item-Simple Test-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('observation-item-Panel Test-1'),
    ).toBeInTheDocument();
  });

  it('should render multiselect observation values as comma separated', async () => {
    const transformedObservations: ExtractedObservationsResult = {
      observations: [
        {
          id: 'obs-1',
          display: 'Simple Test',
          conceptId: '12345',
          observationValue: {
            value: 10,
            unit: 'mg',
            type: 'quantity',
            isAbnormal: false,
          },
        },
        {
          id: 'obs-1',
          display: 'Simple Test',
          conceptId: '12345',
          observationValue: {
            value: 20,
            unit: 'mg',
            type: 'quantity',
            isAbnormal: false,
          },
        },
      ],
      groupedObservations: [] as any,
    };

    (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      entry: [],
    });
    (extractObservationsFromBundle as jest.Mock).mockReturnValue(
      transformedObservations,
    );

    renderWithQueryClient(<RadiologyInvestigationReport reportId="report-1" />);
    await screen.findByTestId('radiology-observations-test-id');

    expect(
      screen.getByTestId('observation-item-Simple Test-0'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('observation-item-Simple Test-0'),
    ).toHaveTextContent('10, 20 mg');
  });
});
