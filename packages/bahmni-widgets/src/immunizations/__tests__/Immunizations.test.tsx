import {
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bundle, Immunization } from 'fhir/r4';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import Immunizations from '../Immunizations';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  getPatientImmunizations: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

const emptyBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

beforeEach(() => {
  mockUsePatientUUID.mockReturnValue('patient-uuid-123');
  mockUseTranslation.mockReturnValue({ t: (key: string) => key } as ReturnType<
    typeof useTranslation
  >);
  mockUseSubscribeConsultationSaved.mockImplementation(() => {});
  mockUseQuery.mockReturnValue({
    data: emptyBundle,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as any);
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

it('shows no patient reference message when patientUUID is null', () => {
  mockUsePatientUUID.mockReturnValue(null);
  render(<Immunizations config={{}} />);
  expect(screen.getByTestId('immunization-history-widget')).toHaveTextContent(
    'IMMUNIZATION_WIDGET_NO_PATIENT_REFERENCE',
  );
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});

it('renders Administered tab first and active by default', () => {
  render(<Immunizations config={{}} />);
  const tabs = screen.getAllByRole('tab');
  expect(tabs[0]).toHaveTextContent('IMMUNIZATION_WIDGET_TAB_ADMINISTERED');
  expect(tabs[1]).toHaveTextContent('IMMUNIZATION_WIDGET_TAB_NOT_ADMINISTERED');
});

it('switches to Not Administered tab on click', async () => {
  render(<Immunizations config={{}} />);
  const notAdministeredTab = screen.getByText(
    'IMMUNIZATION_WIDGET_TAB_NOT_ADMINISTERED',
  );
  await userEvent.click(notAdministeredTab);
  expect(
    screen.getByTestId('not-administered-immunizations-table-empty'),
  ).toBeInTheDocument();
});

it('shows only Administered table when config.status is completed', () => {
  render(<Immunizations config={{ status: 'completed' }} />);
  expect(
    screen.getByTestId('administered-immunizations-table-empty'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(
    screen.queryByTestId('not-administered-immunizations-table-empty'),
  ).not.toBeInTheDocument();
});

it('shows only Not Administered table when config.status is not-done', () => {
  render(<Immunizations config={{ status: 'not-done' }} />);
  expect(
    screen.getByTestId('not-administered-immunizations-table-empty'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(
    screen.queryByTestId('administered-immunizations-table-empty'),
  ).not.toBeInTheDocument();
});

it('matches snapshot with tabs (default config)', () => {
  const { asFragment } = render(<Immunizations config={{}} />);
  expect(asFragment()).toMatchSnapshot();
});

it('matches snapshot without tabs (status filter applied)', () => {
  const { asFragment } = render(
    <Immunizations config={{ status: 'completed' }} />,
  );
  expect(asFragment()).toMatchSnapshot();
});
