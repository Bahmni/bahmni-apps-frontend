import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import PatientDetails from './PatientDetails';
import * as patientService from '@services/patientService';
import { FormattedPatientData, Age } from '@types/patient';
import { NotificationProvider } from '@providers/NotificationProvider';
import i18n from '@/setupTests.i18n';

// Mock axios and patientService
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
    get: jest.fn(
      (url: string) =>
        new Promise((resolve, reject) => {
          if (url.includes('test-uuid')) {
            resolve({ data: { resourceType: 'Patient', id: 'test-uuid' } });
          } else {
            reject(new Error('Failed to fetch patient'));
          }
        }),
    ),
  })),
  isAxiosError: jest.fn(),
  get: jest.fn(),
}));

jest.mock('@services/patientService', () => {
  const originalModule = jest.requireActual('@services/patientService');
  return {
    ...originalModule,
    formatPatientData: jest.fn(),
  };
});

// Mock the usePatientUUID hook
jest.mock('@hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn().mockReturnValue('test-uuid'),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFormatPatientData =
  patientService.formatPatientData as jest.MockedFunction<
    typeof patientService.formatPatientData
  >;

describe('PatientDetails Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  it('should fetch and display patient data', async () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient',
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male',
      birthDate: '1990-01-01',
    };

    const mockAge: Age = {
      years: 35,
      months: 2,
      days: 15,
    };

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'test-uuid']]),
      age: mockAge,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockPatient });
    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(
      <NotificationProvider>
        <MemoryRouter initialEntries={['/patients/test-uuid']}>
          <PatientDetails />
        </MemoryRouter>
      </NotificationProvider>,
    );

    // Assert - Initially loading
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Assert - Data displayed correctly
    expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    expect(
      screen.getByText('male | 35 years, 2 months, 15 days | 1990-01-01'),
    ).toBeInTheDocument();
  });

  it('should handle missing patient data', async () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient',
      id: 'test-uuid',
      // Missing name, gender, birthDate
    };

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: null,
      gender: null,
      birthDate: null,
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'test-uuid']]),
      age: null,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockPatient });
    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(
      <NotificationProvider>
        <MemoryRouter initialEntries={['/patients/test-uuid']}>
          <PatientDetails />
        </MemoryRouter>
      </NotificationProvider>,
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    });

    // Assert - Only ID should be displayed
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument(); // No name heading
    expect(screen.queryByText(/male/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1990-01-01/)).not.toBeInTheDocument();
  });
});
