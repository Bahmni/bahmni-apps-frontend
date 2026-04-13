import {
  FormattedPatientData,
  getFormattedPatientById,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PatientDetails from '../PatientDetails';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedPatientById: jest.fn(),
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

const mockedGetFormattedPatientById =
  getFormattedPatientById as jest.MockedFunction<
    typeof getFormattedPatientById
  >;

const renderPatientDetails = () =>
  render(
    <MemoryRouter initialEntries={['/patient/test-uuid']}>
      <Routes>
        <Route path="/patient/:patientUuid" element={<PatientDetails />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PatientDetails Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-03-16'));
  });

  afterEach(() => {
    jest.useRealTimers();
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
    };

    mockedGetFormattedPatientById.mockResolvedValue(mockPatient);

    renderPatientDetails();

    await waitFor(() => {
      expect(screen.getByTestId('patient-name')).toHaveTextContent('John Doe');
    });

    expect(screen.getByText('MRN123456')).toBeInTheDocument();
    expect(screen.getByText('male')).toBeInTheDocument();
    expect(screen.getByText(/35YEARS 2MONTHS 15DAYS/)).toBeInTheDocument();
  });

  it('integrates usePatient hook with error state', async () => {
    mockedGetFormattedPatientById.mockRejectedValue(new Error('Network error'));

    renderPatientDetails();

    await waitFor(() => {
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });
  });

  it('integrates usePatient hook with loading state', () => {
    mockedGetFormattedPatientById.mockImplementation(
      () => new Promise(() => {}),
    );

    renderPatientDetails();

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('integrates translation system with singular age formatting', async () => {
    const mockPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'Jane Doe',
      gender: 'female',
      birthDate: '2024-02-15',
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'ID123']]),
    };

    mockedGetFormattedPatientById.mockResolvedValue(mockPatient);

    renderPatientDetails();

    await waitFor(() => {
      expect(screen.getByText(/1YEARS 1MONTHS 1DAYS/)).toBeInTheDocument();
    });
  });
});
