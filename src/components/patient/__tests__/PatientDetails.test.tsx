import React from 'react';
import { render, screen } from '@testing-library/react';
import PatientDetails from '../PatientDetails';
import { usePatient } from '@hooks/usePatient';
import * as patientService from '@services/patientService';
import { FormattedPatientData } from '@services/patientService';

// Mock the custom hook and patient service
jest.mock('../../../hooks/usePatient');
jest.mock('../../../services/patientService');

const mockedUsePatient = usePatient as jest.MockedFunction<typeof usePatient>;
const mockedFormatPatientData =
  patientService.formatPatientData as jest.MockedFunction<
    typeof patientService.formatPatientData
  >;

describe('PatientDetails Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
    render(<PatientDetails patientUUID="test-uuid" />);

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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Gender: male')).toBeInTheDocument();
    expect(screen.getByText('Birth Date: 1990-01-01')).toBeInTheDocument();
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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: '123 Main St, Boston, MA 02115',
      formattedContact: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(
      screen.getByText('Address: 123 Main St, Boston, MA 02115'),
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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: 'phone: 555-123-4567',
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(
      screen.getByText('Contact: phone: 555-123-4567'),
    ).toBeInTheDocument();
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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Robert Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

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
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    // Gender and birthDate should not be present
    expect(screen.queryByText(/Gender:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Birth Date:/)).not.toBeInTheDocument();
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
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch patient')).toBeInTheDocument();
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
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
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
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(
      screen.getByText('Patient information not found'),
    ).toBeInTheDocument();
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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: null,
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    // Should still render other information
    expect(screen.getByText('ID: test-uuid')).toBeInTheDocument();
    expect(screen.getByText('Gender: male')).toBeInTheDocument();
    expect(screen.getByText('Birth Date: 1990-01-01')).toBeInTheDocument();
    // Name should not be present
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Address should not be rendered
    expect(screen.queryByText(/Address:/)).not.toBeInTheDocument();
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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null, // The formatter should handle malformed data and return null
      formattedContact: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Address should not be rendered since it's null
    expect(screen.queryByText(/Address:/)).not.toBeInTheDocument();
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

    const mockFormattedPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'John Doe',
      gender: 'male',
      birthDate: '1990-01-01',
      formattedAddress: null,
      formattedContact: null,
    };

    mockedUsePatient.mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatPatientData.mockReturnValue(mockFormattedPatient);

    // Act
    render(<PatientDetails patientUUID="test-uuid" />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Contact should not be rendered
    expect(screen.queryByText(/Contact:/)).not.toBeInTheDocument();
  });
});
