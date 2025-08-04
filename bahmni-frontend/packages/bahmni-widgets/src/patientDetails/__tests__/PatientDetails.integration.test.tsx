import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormattedPatientData } from '@bahmni-frontend/bahmni-services';
import PatientDetails from '../PatientDetails';

jest.mock('../../hooks/usePatient', () => ({
  usePatient: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        CLINICAL_YEARS_TRANSLATION_KEY: options?.count === 1 ? 'year' : 'years',
        CLINICAL_MONTHS_TRANSLATION_KEY:
          options?.count === 1 ? 'month' : 'months',
        CLINICAL_DAYS_TRANSLATION_KEY: options?.count === 1 ? 'day' : 'days',
      };
      return translations[key] || key;
    }),
  }),
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
    <span data-testid={testId || `icon-${id}`} data-icon-name={name}>
      {name}
    </span>
  ),
  ICON_SIZE: {
    SM: 'small',
    MD: 'medium',
    LG: 'large',
  },
}));

const mockedUsePatient = require('../../hooks/usePatient')
  .usePatient as jest.MockedFunction<
  () => {
    patient: FormattedPatientData | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }
>;

describe('PatientDetails Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('integrates usePatient hook with loading to success state', async () => {
    const mockPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['MRN', 'MRN123456']]),
      age: { years: 35, months: 2, days: 15 },
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PatientDetails />);

    expect(screen.getByTestId('patient-name')).toHaveTextContent('John Doe');
    expect(screen.getByText('MRN123456')).toBeInTheDocument();
    expect(screen.getByText('male')).toBeInTheDocument();
    expect(screen.getByText(/35 years, 2 months, 15 days/)).toBeInTheDocument();
  });

  it('integrates usePatient hook with error state', () => {
    mockedUsePatient.mockReturnValue({
      patient: null,
      loading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });

    render(<PatientDetails />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('integrates usePatient hook with loading state', () => {
    mockedUsePatient.mockReturnValue({
      patient: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<PatientDetails />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('integrates translation system with singular age formatting', () => {
    const mockPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'Jane Doe',
      gender: 'female',
      birthDate: '2023-01-01',
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'ID123']]),
      age: { years: 1, months: 1, days: 1 },
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PatientDetails />);

    expect(screen.getByText(/1 year, 1 month, 1 day/)).toBeInTheDocument();
  });
});
