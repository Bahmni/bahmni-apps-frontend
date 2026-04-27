import {
  ConsultationSavedEventPayload,
  formatDateTime,
  getPatientImmunizations,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import NotAdministeredTab from '../components/NotAdministeredTab';
import { createNotAdministeredImmunizationViewModel } from '../utils';
import { mockNotAdministeredImmunization } from './__mocks__/immunizationMocks';

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

const mockRow = createNotAdministeredImmunizationViewModel(
  mockNotAdministeredImmunization,
);

describe('NotAdministeredTab', () => {
  beforeEach(() => {
    mockFormatDateTime.mockReturnValue({
      formattedResult: '19-3-2026',
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
    render(<NotAdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_CODE'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_REASON'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_DATE'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_COL_RECORDED_BY'),
    ).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<NotAdministeredTab patientUUID="patient-uuid" />);
    expect(screen.getByText('Hepatitis B')).toBeInTheDocument();
    expect(screen.getByText('Patient refused')).toBeInTheDocument();
    expect(screen.getByText('19-3-2026')).toBeInTheDocument();
    expect(screen.getByText('John Davis')).toBeInTheDocument();
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
      render(<NotAdministeredTab patientUUID="patient-uuid" />);
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
    render(<NotAdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.getByTestId('not-administered-immunizations-table-skeleton'),
    ).toBeInTheDocument();
  });

  it('fetches not-done immunizations with correct query key', () => {
    render(<NotAdministeredTab patientUUID="patient-uuid-123" />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['immunizations', 'patient-uuid-123', 'not-done'],
        enabled: true,
      }),
    );
  });

  it('queryFn fetches and maps immunizations', async () => {
    mockGetPatientImmunizations.mockResolvedValue([
      mockNotAdministeredImmunization,
    ]);
    render(<NotAdministeredTab patientUUID="patient-uuid-123" />);

    const { queryFn } = mockUseQuery.mock.calls[0][0] as any;
    const result = await queryFn();

    expect(mockGetPatientImmunizations).toHaveBeenCalledWith(
      'patient-uuid-123',
      'not-done',
    );
    expect(result).toEqual([
      createNotAdministeredImmunizationViewModel(
        mockNotAdministeredImmunization,
      ),
    ]);
  });

  it.each([
    {
      description: 'same patient with immunization update',
      payload: {
        patientUUID: 'patient-uuid-123',
        updatedResources: { immunizations: true },
      } as ConsultationSavedEventPayload,
      expectedCallCount: 1,
    },
    {
      description: 'different patient',
      payload: {
        patientUUID: 'other-uuid',
        updatedResources: { immunizations: true },
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
      render(<NotAdministeredTab patientUUID="patient-uuid-123" />);
      expect(refetch).toHaveBeenCalledTimes(expectedCallCount);
    },
  );

  it.each([
    { field: 'code', override: { code: null } },
    { field: 'reason', override: { reason: null } },
    { field: 'date', override: { date: null } },
  ])('renders - for $field when value is null', ({ field, override }) => {
    mockUseQuery.mockReturnValue({
      data: [{ ...mockRow, ...override }],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);
    render(<NotAdministeredTab patientUUID="patient-uuid" />);
    expect(
      screen.getByTestId(`table-cell-${mockRow.id}-${field}`),
    ).toHaveTextContent('-');
  });

  it('passes accessibility tests', async () => {
    const { container } = render(
      <NotAdministeredTab patientUUID="patient-uuid" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <NotAdministeredTab patientUUID="patient-uuid" />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
