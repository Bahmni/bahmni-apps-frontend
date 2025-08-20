import { FormattedPatientData } from '@bahmni-frontend/bahmni-services';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useTranslation } from 'react-i18next';
import PatientDetails from '../PatientDetails';
import { usePatient } from '../usePatient';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

jest.mock('../usePatient');
jest.mock('../../hooks/usePatientUUID');
jest.mock('react-i18next');
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('@bahmni-frontend/bahmni-design-system', () => ({
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
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockT = jest
  .fn()
  .mockImplementation((key: string, options?: { count?: number }) => {
    const translations: Record<string, string> = {
      CLINICAL_YEARS_TRANSLATION_KEY: options?.count === 1 ? 'year' : 'years',
      CLINICAL_MONTHS_TRANSLATION_KEY:
        options?.count === 1 ? 'month' : 'months',
      CLINICAL_DAYS_TRANSLATION_KEY: options?.count === 1 ? 'day' : 'days',
    };
    return translations[key] || key;
  }) as any;

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
  age: {
    years: 35,
    months: 2,
    days: 15,
  },
  ...overrides,
});

describe('PatientDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({
      t: mockT,
      i18n: {} as any,
      ready: true,
    } as any);
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
        screen.getByText(/35 years, 2 months, 15 days/),
      ).toBeInTheDocument();
      expect(screen.getByText(/1990-01-01/)).toBeInTheDocument();
    });

    it('renders patient with minimal data', () => {
      const patient = createMockPatient({
        fullName: 'Jane Doe',
        gender: null,
        birthDate: null,
        age: null,
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

    it('shows only birth date when age years is undefined', () => {
      const patient = createMockPatient({
        age: { years: undefined, months: 2, days: 15 } as any,
      });

      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.queryByText(/years/)).not.toBeInTheDocument();
    });

    it('shows only birth date when age is null', () => {
      const patient = createMockPatient({ age: null });
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
    });

    it('hides age section when both age and birth date are null', () => {
      const patient = createMockPatient({ age: null, birthDate: null });
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(
        screen.queryByText(/years|days|months|\d{4}-\d{2}-\d{2}/),
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

  describe('Internationalization', () => {
    it('uses singular forms for age values of 1', () => {
      const patient = createMockPatient({
        age: { years: 1, months: 1, days: 1 },
      });

      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(screen.getByText(/1 year, 1 month, 1 day/)).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith('CLINICAL_YEARS_TRANSLATION_KEY', {
        count: 1,
      });
      expect(mockT).toHaveBeenCalledWith('CLINICAL_MONTHS_TRANSLATION_KEY', {
        count: 1,
      });
      expect(mockT).toHaveBeenCalledWith('CLINICAL_DAYS_TRANSLATION_KEY', {
        count: 1,
      });
    });

    it('uses plural forms for age values greater than 1', () => {
      const patient = createMockPatient({
        age: { years: 25, months: 3, days: 10 },
      });

      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PatientDetails />);
      expect(
        screen.getByText(/25 years, 3 months, 10 days/),
      ).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith('CLINICAL_YEARS_TRANSLATION_KEY', {
        count: 25,
      });
      expect(mockT).toHaveBeenCalledWith('CLINICAL_MONTHS_TRANSLATION_KEY', {
        count: 3,
      });
      expect(mockT).toHaveBeenCalledWith('CLINICAL_DAYS_TRANSLATION_KEY', {
        count: 10,
      });
    });
  });

  describe('Accessibility', () => {
    it('passes axe accessibility tests with patient data', async () => {
      const patient = createMockPatient();
      mockedUsePatient.mockReturnValue({
        patient,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<PatientDetails />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('passes axe accessibility tests in loading state', async () => {
      mockedUsePatient.mockReturnValue({
        patient: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<PatientDetails />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
