import React from 'react';
import { render, screen } from '@testing-library/react';
import PatientDetails from './PatientDetails';
import { usePatient } from '@hooks/usePatient';
import { usePatientUUID } from '@hooks/usePatientUUID';
import * as patientService from '@services/patientService';
import { FormattedPatientData, Age } from '@types/patient';
import i18n from '@/setupTests.i18n';

// Mock the custom hooks and patient service
jest.mock('@hooks/usePatient');
jest.mock('@hooks/usePatientUUID');
jest.mock('@services/patientService');

const mockedUsePatient = usePatient as jest.MockedFunction<typeof usePatient>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedFormatPatientData =
  patientService.formatPatientData as jest.MockedFunction<
    typeof patientService.formatPatientData
  >;

describe('PatientDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset i18n to English
    i18n.changeLanguage('en');
    // Mock the usePatientUUID hook to return a test UUID
    mockedUsePatientUUID.mockReturnValue('test-uuid');
  });

  it('should render loading state', () => {
    // Arrange
    mockedUsePatient.mockReturnValue({
      patient: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should render patient information when data is loaded', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
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

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    expect(
      screen.getByText('male | 35 years, 2 months, 15 days | 1990-01-01'),
    ).toBeInTheDocument();
  });

  it('should render patient with address information', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
      birthDate: '1990-01-01',
      address: [
        {
          line: ['123 Main St'],
          city: 'Boston',
          state: 'MA',
          postalCode: '02115',
        },
      ],
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
      formattedAddress: '123 Main St, Boston, MA 02115',
      formattedContact: null,
      identifiers: new Map([['ID', 'test-uuid']]),
      age: mockAge,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(
      screen.getByText('123 Main St, Boston, MA 02115'),
    ).toBeInTheDocument();
  });

  it('should render patient with contact information', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
      birthDate: '1990-01-01',
      telecom: [
        {
          system: 'phone' as const,
          value: '555-123-4567',
        },
      ],
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
      formattedContact: 'phone: 555-123-4567',
      identifiers: new Map([['ID', 'test-uuid']]),
      age: mockAge,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('phone: 555-123-4567')).toBeInTheDocument();
  });

  it('should handle patient with multiple names', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [
        { given: ['John', 'Robert'], family: 'Doe' },
        { given: ['Johnny'], family: 'D', use: 'nickname' },
      ],
      gender: 'male' as const,
      birthDate: '1990-01-01',
    };

    const mockAge: Age = {
      years: 35,
      months: 2,
      days: 15,
    };

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Robert Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'test-uuid']]),
      age: mockAge,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Robert Doe')).toBeInTheDocument();
  });

  it('should handle patient with missing optional fields', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      // Missing gender and birthDate
    };

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: null,
      birthDate: null,
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'test-uuid']]),
      age: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    // Gender and birthDate should not be present in the details section
    expect(screen.queryByText(/male/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1990-01-01/)).not.toBeInTheDocument();
  });

  it('should render error state', () => {
    // Arrange
    const mockError = new Error('Failed to fetch patient');

    mockedUsePatient.mockReturnValue({
      patient: null,
      loading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should handle different error messages', () => {
    // Arrange
    const mockError = new Error('Network timeout');

    mockedUsePatient.mockReturnValue({
      patient: null,
      loading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should render empty state when no patient is found', () => {
    // Arrange
    mockedUsePatient.mockReturnValue({
      patient: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should handle patient with missing name information', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{}], // Empty name object
      gender: 'male' as const,
      birthDate: '1990-01-01',
    };

    const mockAge: Age = {
      years: 35,
      months: 2,
      days: 15,
    };

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: null,
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'test-uuid']]),
      age: mockAge,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    // Should still render other information
    expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    expect(
      screen.getByText('male | 35 years, 2 months, 15 days | 1990-01-01'),
    ).toBeInTheDocument();
    // Name should not be present
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('should handle patient with empty address array', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
      birthDate: '1990-01-01',
      address: [], // Empty address array
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

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Address should not be rendered
    expect(screen.queryByText(/123 Main St/)).not.toBeInTheDocument();
  });

  it('should handle patient with malformed address data', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
      birthDate: '1990-01-01',
      address: [{}], // Address with no data
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
      formattedAddress: null, // The formatter should handle malformed data and return null
      formattedContact: null,
      identifiers: new Map([['ID', 'test-uuid']]),
      age: mockAge,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Address should not be rendered since it's null
    expect(screen.queryByText(/123 Main St/)).not.toBeInTheDocument();
  });

  it('should handle patient with empty telecom array', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
      birthDate: '1990-01-01',
      telecom: [], // Empty telecom array
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

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Contact should not be rendered
    expect(screen.queryByText(/phone:/)).not.toBeInTheDocument();
  });

  it('should handle patient with empty identifiers map', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
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
      identifiers: new Map(), // Empty identifiers map
      age: mockAge,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // No identifiers should be rendered
    expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
  });

  it('should handle patient with age object but undefined years', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
      birthDate: '1990-01-01',
    };

    // Age with undefined years
    const mockAge = {
      years: undefined,
      months: 2,
      days: 15,
    } as unknown as Age;

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

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Age should not be formatted since years is undefined
    expect(screen.queryByText(/Years/)).not.toBeInTheDocument();
    expect(screen.getByText('male | 1990-01-01')).toBeInTheDocument();
  });

  it('should handle both address and contact info present', () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male' as const,
      birthDate: '1990-01-01',
      address: [
        {
          line: ['123 Main St'],
          city: 'Boston',
          state: 'MA',
          postalCode: '02115',
        },
      ],
      telecom: [
        {
          system: 'phone' as const,
          value: '555-123-4567',
        },
      ],
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
      formattedAddress: '123 Main St, Boston, MA 02115',
      formattedContact: 'phone: 555-123-4567',
      identifiers: new Map([['ID', 'test-uuid']]),
      age: mockAge,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Both address and contact should be rendered together
    expect(
      screen.getByText('123 Main St, Boston, MA 02115 | phone: 555-123-4567'),
    ).toBeInTheDocument();
  });

  it('should handle null patient UUID', () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(null);

    mockedUsePatient.mockReturnValue({
      patient: null,
      loading: false,
      error: new Error('Invalid patient UUID'),
      refetch: jest.fn(),
    });

    // Act
    render(<PatientDetails />);

    // Assert
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });
});
