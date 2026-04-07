import {
  ConsultationSavedEventPayload,
  formatDateTime,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bundle, Immunization } from 'fhir/r4';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
import AdministeredTab from '../AdministeredTab';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

const mockImmunization: Immunization = {
  resourceType: 'Immunization',
  id: 'imm-uuid-1',
  status: 'completed',
  vaccineCode: { coding: [{ display: 'Measles' }] },
  patient: { reference: 'Patient/patient-uuid' },
  occurrenceDateTime: '2026-03-24',
  location: { display: 'Test Hospital' },
  route: { coding: [{ display: 'Intravenous' }] },
  site: { coding: [{ display: 'Shoulder' }] },
  manufacturer: { display: 'Medsource' },
  lotNumber: '12345',
  protocolApplied: [{ doseNumberPositiveInt: 3 }],
  performer: [
    {
      function: { coding: [{ code: 'AP' }] },
      actor: { display: 'Aisha Khan' },
    },
    {
      function: { coding: [{ code: 'OP' }] },
      actor: { display: 'Dr S.Johnson' },
    },
  ],
  note: [{ text: 'Third dose completed successfully.' }],
  extension: [
    {
      url: 'http://fhir.bahmni.org/ext/immunization/administeredProduct',
      valueReference: { display: 'MisoPrime' },
    },
  ],
};

const mockBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockImmunization }],
};

const emptyBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

beforeEach(() => {
  mockFormatDateTime.mockReturnValue({
    formattedResult: '24-3-2026',
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
  render(<AdministeredTab patientUUID="patient-uuid" />);
  expect(screen.getByText('IMMUNIZATION_WIDGET_COL_CODE')).toBeInTheDocument();
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_COL_DOSE_SEQUENCE'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_COL_DRUG_NAME'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_COL_ADMINISTERED_ON'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('IMMUNIZATION_WIDGET_COL_ADMINISTERED_LOCATION'),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('IMMUNIZATION_WIDGET_COL_STATUS'),
  ).not.toBeInTheDocument();
});

it('renders immunization row data', () => {
  render(<AdministeredTab patientUUID="patient-uuid" />);
  expect(screen.getByText('Measles')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('MisoPrime')).toBeInTheDocument();
  expect(screen.getByText('24-3-2026')).toBeInTheDocument();
  expect(screen.getByText('Test Hospital')).toBeInTheDocument();
});

it('shows expanded row details when row is clicked', async () => {
  render(<AdministeredTab patientUUID="patient-uuid" />);
  const expandButton = screen
    .getByTestId('table-row-imm-uuid-1')
    .querySelector('button');
  await userEvent.click(expandButton!);
  expect(screen.getByText(/Intravenous/)).toBeInTheDocument();
  expect(screen.getByText(/Shoulder/)).toBeInTheDocument();
  expect(screen.getByText(/Medsource/)).toBeInTheDocument();
  expect(screen.getByText(/12345/)).toBeInTheDocument();
  expect(screen.getByText(/Aisha Khan/)).toBeInTheDocument();
  expect(screen.getByText(/Dr S\.Johnson/)).toBeInTheDocument();
  expect(
    screen.getByText(/Third dose completed successfully\./),
  ).toBeInTheDocument();
});

it('shows empty state when no data', () => {
  mockUseQuery.mockReturnValue({
    data: emptyBundle,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as any);
  render(<AdministeredTab patientUUID="patient-uuid" />);
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
  render(<AdministeredTab patientUUID="patient-uuid" />);
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

  render(<AdministeredTab patientUUID="patient-uuid-123" />);
  expect(refetch).toHaveBeenCalled();
});

it('does not show expand button when row has no additional details', () => {
  const minimalImmunization: Immunization = {
    resourceType: 'Immunization',
    id: 'imm-minimal-1',
    status: 'completed',
    vaccineCode: { coding: [{ display: 'Rotavirus' }] },
    patient: { reference: 'Patient/patient-uuid' },
    occurrenceDateTime: '2024-01-20',
    location: { display: 'Clinic A' },
    protocolApplied: [{ doseNumberPositiveInt: 1 }],
  };
  mockUseQuery.mockReturnValue({
    data: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: minimalImmunization }],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as any);

  render(<AdministeredTab patientUUID="patient-uuid" />);

  const row = screen.getByTestId('table-row-imm-minimal-1');
  expect(row.querySelector('button')).toBeNull();
});
