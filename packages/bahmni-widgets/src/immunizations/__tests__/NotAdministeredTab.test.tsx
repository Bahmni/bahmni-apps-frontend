import {
  ConsultationSavedEventPayload,
  formatDateTime,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { Bundle, Immunization } from 'fhir/r4';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
import NotAdministeredTab from '../NotAdministeredTab';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  formatDateTime: jest.fn(),
  getPatientImmunizations: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

const mockWaiverImmunization: Immunization = {
  resourceType: 'Immunization',
  id: 'waiver-uuid-1',
  status: 'not-done',
  vaccineCode: { coding: [{ display: 'Hepatitis B' }] },
  patient: { reference: 'Patient/patient-uuid' },
  occurrenceDateTime: '2026-03-19',
  statusReason: { coding: [{ display: 'Patient refused' }] },
  performer: [
    {
      function: { coding: [{ code: 'AP' }] },
      actor: { display: 'John Davis' },
    },
  ],
};

const mockBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockWaiverImmunization }],
};

const emptyBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

beforeEach(() => {
  mockUseTranslation.mockReturnValue({ t: (key: string) => key } as ReturnType<
    typeof useTranslation
  >);
  mockFormatDateTime.mockReturnValue({
    formattedResult: '19-3-2026',
  } as ReturnType<typeof formatDateTime>);
  mockUseSubscribeConsultationSaved.mockImplementation(() => {});
  mockUseQuery.mockReturnValue({
    data: mockBundle,
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
  expect(screen.getByText('IMMUNIZATION_WIDGET_COL_CODE')).toBeInTheDocument();
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_COL_REASON'),
  ).toBeInTheDocument();
  expect(screen.getByText('IMMUNIZATION_WIDGET_COL_DATE')).toBeInTheDocument();
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_COL_RECORDED_BY'),
  ).toBeInTheDocument();
});

it('renders waiver row data', () => {
  render(<NotAdministeredTab patientUUID="patient-uuid" />);
  expect(screen.getByText('Hepatitis B')).toBeInTheDocument();
  expect(screen.getByText('Patient refused')).toBeInTheDocument();
  expect(screen.getByText('19-3-2026')).toBeInTheDocument();
  expect(screen.getByText('John Davis')).toBeInTheDocument();
});

it('shows empty state when no data', () => {
  mockUseQuery.mockReturnValue({
    data: emptyBundle,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as any);
  render(<NotAdministeredTab patientUUID="patient-uuid" />);
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_NO_IMMUNIZATIONS_RECORDED'),
  ).toBeInTheDocument();
});

it('shows error state when fetch fails', () => {
  mockUseQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: jest.fn(),
  } as any);
  render(<NotAdministeredTab patientUUID="patient-uuid" />);
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_ERROR_FETCHING_DATA'),
  ).toBeInTheDocument();
});

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

it('refetches on ConsultationSaved event for same patient', () => {
  const refetch = jest.fn();
  mockUseQuery.mockReturnValue({
    data: emptyBundle,
    isLoading: false,
    isError: false,
    refetch,
  } as any);

  mockUseSubscribeConsultationSaved.mockImplementation(
    (callback: (payload: ConsultationSavedEventPayload) => void) => {
      callback({
        patientUUID: 'patient-uuid-123',
        updatedResources: { immunizations: true },
      } as ConsultationSavedEventPayload);
    },
  );

  render(<NotAdministeredTab patientUUID="patient-uuid-123" />);
  expect(refetch).toHaveBeenCalled();
});
