import {
  ConsultationSavedEventPayload,
  formatDateTime,
  getPatientImmunizations,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AdministeredTab from '../components/AdministeredTab';
import { createAdministeredImmunizationViewModel } from '../utils';
import {
  mockAdministeredImmunization,
  mockMinimalAdministeredImmunization,
} from './__mocks__/immunizationMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
  getPatientImmunizations: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockGetPatientImmunizations =
  getPatientImmunizations as jest.MockedFunction<
    typeof getPatientImmunizations
  >;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

const mockRow = createAdministeredImmunizationViewModel(
  mockAdministeredImmunization,
);
const mockMinimalRow = createAdministeredImmunizationViewModel(
  mockMinimalAdministeredImmunization,
);

describe('AdministeredTab', () => {
  beforeEach(() => {
    mockFormatDateTime.mockReturnValue({
      formattedResult: '24-3-2026',
    } as ReturnType<typeof formatDateTime>);
    mockUseSubscribeConsultationSaved.mockImplementation(() => {});
    mockUseQuery.mockReturnValue({
      data: [mockRow],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders column headers', () => {
    render(<AdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_CODE'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_DOSE_SEQUENCE'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_DRUG_NAME'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_ADMINISTERED_ON'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_ADMINISTERED_LOCATION'),
    ).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<AdministeredTab patientUUID="patient-uuid" />);
    expect(screen.getByText('Measles')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('MisoPrime')).toBeInTheDocument();
    expect(screen.getByText('24-3-2026')).toBeInTheDocument();
    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
  });

  it.each([
    {
      description: 'no data',
      queryResult: { data: [], isLoading: false, isError: false },
      expectedText: 'IMMUNIZATION_HISTORY_WIDGET_NO_IMMUNIZATIONS_RECORDED',
    },
    {
      description: 'fetch error',
      queryResult: { data: undefined, isLoading: false, isError: true },
      expectedText: 'IMMUNIZATION_HISTORY_WIDGET_ERROR_FETCHING_DATA',
    },
  ])(
    'shows correct message on $description',
    ({
      queryResult,
      expectedText,
    }: {
      description: string;
      queryResult: { data: unknown; isLoading: boolean; isError: boolean };
      expectedText: string;
    }) => {
      mockUseQuery.mockReturnValue({
        ...queryResult,
        refetch: jest.fn(),
      } as any);
      render(<AdministeredTab patientUUID="patient-uuid" />);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    },
  );

  it('shows skeleton while loading', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    } as any);
    render(<AdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.getByTestId('administered-immunizations-table-skeleton'),
    ).toBeInTheDocument();
  });

  it('fetches completed immunizations with correct query key', () => {
    render(<AdministeredTab patientUUID="patient-uuid-123" />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['immunizations', 'patient-uuid-123', 'completed'],
        enabled: true,
      }),
    );
  });

  it('queryFn fetches and maps immunizations', async () => {
    mockGetPatientImmunizations.mockResolvedValue([
      mockAdministeredImmunization,
    ]);
    render(<AdministeredTab patientUUID="patient-uuid-123" />);

    const { queryFn } = mockUseQuery.mock.calls[0][0] as any;
    const result = await queryFn();

    expect(mockGetPatientImmunizations).toHaveBeenCalledWith(
      'patient-uuid-123',
      'completed',
    );
    expect(result).toEqual([
      createAdministeredImmunizationViewModel(mockAdministeredImmunization),
    ]);
  });

  it.each([
    {
      description: 'same patient with immunization update',
      payload: {
        patientUUID: 'patient-uuid-123',
        updatedResources: { immunizationHistory: true },
      } as ConsultationSavedEventPayload,
      expectedCallCount: 1,
    },
    {
      description: 'different patient',
      payload: {
        patientUUID: 'other-uuid',
        updatedResources: { immunizationHistory: true },
      } as ConsultationSavedEventPayload,
      expectedCallCount: 0,
    },
    {
      description: 'same patient without immunization update',
      payload: {
        patientUUID: 'patient-uuid-123',
        updatedResources: { immunizations: false },
      } as ConsultationSavedEventPayload,
      expectedCallCount: 0,
    },
  ])(
    'ConsultationSaved — $description: refetch called $expectedCallCount time(s)',
    ({ payload, expectedCallCount }) => {
      const refetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch,
      } as any);
      mockUseSubscribeConsultationSaved.mockImplementation(
        (callback: (payload: ConsultationSavedEventPayload) => void) => {
          callback(payload);
        },
      );
      render(<AdministeredTab patientUUID="patient-uuid-123" />);
      expect(refetch).toHaveBeenCalledTimes(expectedCallCount);
    },
  );

  it('displays tooltip icon when immunization has notes', () => {
    render(<AdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.getByLabelText('Third dose completed successfully.'),
    ).toBeInTheDocument();
  });

  it('does not display tooltip icon when immunization has no notes', () => {
    mockUseQuery.mockReturnValue({
      data: [mockMinimalRow],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);
    render(<AdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.queryByLabelText('Third dose completed successfully.'),
    ).not.toBeInTheDocument();
  });

  it('renders expanded row content for a row with details', () => {
    render(<AdministeredTab patientUUID="patient-uuid" />);
    fireEvent.click(screen.getByRole('button', { name: 'Expand current row' }));
    expect(
      screen.getByTestId(`immunization-expanded-row-${mockRow.id}-test-id`),
    ).toBeInTheDocument();
  });

  it('does not render expanded row content for a row without details', () => {
    mockUseQuery.mockReturnValue({
      data: [mockMinimalRow],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);
    render(<AdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.queryByTestId(
        `immunization-expanded-row-${mockMinimalRow.id}-test-id`,
      ),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      description: 'administeredOn is null',
      rowOverride: { administeredOn: null },
      testId: `table-cell-${mockRow.id}-administeredOn`,
    },
    {
      description: 'code is null',
      rowOverride: { code: null },
      testId: `table-cell-${mockRow.id}-code`,
    },
  ])('renders - when $description', ({ rowOverride, testId }) => {
    mockUseQuery.mockReturnValue({
      data: [{ ...mockRow, ...rowOverride }],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);
    render(<AdministeredTab patientUUID="patient-uuid" />);
    expect(screen.getByTestId(testId)).toHaveTextContent('-');
  });

  it('passes accessibility tests', async () => {
    const { container } = render(
      <AdministeredTab patientUUID="patient-uuid" />,
    );
    // empty-table-header: Carbon's expand column header has no text — known Carbon limitation
    expect(
      await axe(container, {
        rules: { 'empty-table-header': { enabled: false } },
      }),
    ).toHaveNoViolations();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <AdministeredTab patientUUID="patient-uuid" />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
