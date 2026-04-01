import { FormattedPatientData, formatDateTime } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PatientDetails from '../PatientDetails';
import { usePatient } from '../usePatient';

expect.extend(toHaveNoViolations);

jest.mock('../usePatient');
jest.mock('../../hooks/usePatientUUID');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  Icon: ({
    id,
    name,
    testId,
  }: {
    id: string;
    name: string;
    testId?: string;
  }) => (
    <span data-testid={testId ?? `icon-${id}`} data-icon-name={name}>
      {name}
    </span>
  ),
  ICON_SIZE: {
    SM: 'small',
    MD: 'medium',
    LG: 'large',
  },
}));

const mockedUsePatient = usePatient as jest.MockedFunction<typeof usePatient>;
const mockedFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;

const createMockPatient = (
  overrides?: Partial<FormattedPatientData>,
): FormattedPatientData => ({
  id: 'test-uuid',
  fullName: 'John Doe',
  gender: 'male',
  birthDate: '1990-01-01',
  formattedAddress: null,
  formattedContact: null,
  identifiers: new Map([['MRN', 'MRN123456']]),
  ...overrides,
});

describe('PatientDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-03-16'));
    mockedFormatDateTime.mockImplementation((date: string | number | Date) => ({
      formattedResult: String(date),
      error: undefined,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading States', () => {
    it.each([
      ['loading', { loading: true, error: null, patient: null }],
      ['error', { loading: false, error: new Error('Failed'), patient: null }],
      ['no patient', { loading: false, error: null, patient: null }],
    ])('renders skeleton when %s', (_, mockState) => {
      mockedUsePatient.mockReturnValue({ ...mockState, refetch: jest.fn() });
      render(<PatientDetails />);
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });
  });

  describe('Patient Data Rendering', () => {
    it('renders complete patient information', () => {
      const patient = createMockPatient({
        birthDate: '1989-01-01',
        identifiers: new Map([
          ['MRN', 'MRN123456'],
          ['OpenMRS ID', 'OP789'],
        ]),
      });

      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);

      expect(screen.getByTestId('patient-name')).toHaveTextContent('John Doe');
      expect(screen.getByText('MRN123456 | OP789')).toBeInTheDocument();
      expect(screen.getByText('male')).toBeInTheDocument();
      expect(
        screen.getByText(/36YEARS 2MONTHS 15DAYS | 1989-01-01/),
      ).toBeInTheDocument();
    });

    it('renders patient with minimal data', () => {
      const patient = createMockPatient({
        fullName: 'Jane Doe',
        gender: null,
        birthDate: null,
        identifiers: new Map([['ID', 'ID123']]),
      });

      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('ID123')).toBeInTheDocument();
      expect(screen.queryByText(/years|months|days/)).not.toBeInTheDocument();
      expect(screen.queryByText(/male|female/)).not.toBeInTheDocument();
    });
  });

  describe('Missing Fields Handling', () => {
    it('hides patient name section when name is null', () => {
      const patient = createMockPatient({ fullName: null });
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(screen.queryByTestId('patient-name')).not.toBeInTheDocument();
    });

    it('calculates and shows age when birthDate is provided', () => {
      const patient = createMockPatient({
        birthDate: '1990-01-01',
      });

      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(
        screen.getByText(/35YEARS 2MONTHS 15DAYS | 1990-01-01/),
      ).toBeInTheDocument();
    });

    it('shows only birth date when birthDate is null', () => {
      const patient = createMockPatient({ birthDate: null });
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(screen.queryByText(/YEARS/)).not.toBeInTheDocument();
    });

    it('hides age section when birth date is null', () => {
      const patient = createMockPatient({ birthDate: null });
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(
        screen.queryByText(/YEARS|DAYS|MONTHS|\d{4}-\d{2}-\d{2}/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Identifier Handling', () => {
    it('hides identifier section when no identifiers exist', () => {
      const patient = createMockPatient({ identifiers: new Map() });
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(screen.queryByText(/MRN|ID/)).not.toBeInTheDocument();
    });

    it('filters out empty and null identifier values', () => {
      const patient = createMockPatient({
        identifiers: new Map([
          ['MRN', 'MRN123'],
          ['Empty', ''],
          ['Null', null as any],
          ['OpenMRS ID', 'OP456'],
        ]),
      });

      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(screen.getByText('MRN123 | OP456')).toBeInTheDocument();
      expect(screen.queryByText(/Empty|Null/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('passes axe accessibility tests with patient data', async () => {
      jest.useRealTimers(); // axe doesn't work well with fake timers
      const patient = createMockPatient();
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<PatientDetails />);
      expect(await axe(container)).toHaveNoViolations();
      jest.useFakeTimers(); // restore fake timers
      jest.setSystemTime(new Date('2025-03-16'));
    });

    it('passes axe accessibility tests in loading state', async () => {
      jest.useRealTimers(); // axe doesn't work well with fake timers
      mockedUsePatient.mockReturnValue({
        patient: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<PatientDetails />);
      expect(await axe(container)).toHaveNoViolations();
      jest.useFakeTimers(); // restore fake timers
      jest.setSystemTime(new Date('2025-03-16'));
    });
  });
});
