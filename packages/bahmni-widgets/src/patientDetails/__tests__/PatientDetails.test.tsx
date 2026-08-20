import { FormattedPatientData, formatDateTime } from '@bahmni/services';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientPhoto } from '../../hooks/usePatientPhoto';
import PatientDetails from '../PatientDetails';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-uuid'),
}));
jest.mock('../../hooks/usePatientPhoto', () => ({
  usePatientPhoto: jest.fn(() => ({
    patientPhoto: undefined,
    isLoading: false,
    error: null,
  })),
}));
jest.mock('../../notification', () => ({
  useNotification: jest.fn(() => ({ addNotification: jest.fn() })),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
}));

const mockedUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockedFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockedUsePatientPhoto = usePatientPhoto as jest.MockedFunction<
  typeof usePatientPhoto
>;

const mockPatientQuery = (patientResult: Partial<UseQueryResult>) => {
  mockedUseQuery.mockImplementation(() => patientResult as UseQueryResult);
};

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
    mockPatientQuery({ data: undefined, isLoading: false, error: null });
    mockedUsePatientPhoto.mockReturnValue({
      patientPhoto: undefined,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading States', () => {
    it.each([
      ['loading', { isLoading: true, error: null, data: undefined }],
      [
        'error',
        { isLoading: false, error: new Error('Failed'), data: undefined },
      ],
      ['no patient', { isLoading: false, error: null, data: undefined }],
    ])('renders skeleton when %s', (_, mockState) => {
      mockPatientQuery(mockState);
      render(<PatientDetails />);
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });
  });

  describe('Patient Photo', () => {
    it('does not render photo when query has no data', () => {
      mockPatientQuery({
        data: createMockPatient(),
        isLoading: false,
        error: null,
      });

      render(<PatientDetails />);

      expect(
        screen.queryByTestId('patient-photo-test-id'),
      ).not.toBeInTheDocument();
    });

    it('renders photo data url when hook resolves', () => {
      const photoDataUrl = 'data:image/jpeg;base64,/9j/photo==';
      mockedUsePatientPhoto.mockReturnValue({
        patientPhoto: photoDataUrl,
        isLoading: false,
        error: null,
      });
      mockPatientQuery({
        data: createMockPatient(),
        isLoading: false,
        error: null,
      });

      render(<PatientDetails />);

      expect(screen.getByTestId('patient-photo-test-id')).toHaveAttribute(
        'src',
        photoDataUrl,
      );
    });

    it('does not render photo when hook returns no data', () => {
      mockPatientQuery({
        data: createMockPatient({
          photoUrl: '/openmrs/ws/rest/v2/patientImage?patientUuid=test-uuid',
        }),
        isLoading: false,
        error: null,
      });

      render(<PatientDetails />);

      expect(
        screen.queryByTestId('patient-photo-test-id'),
      ).not.toBeInTheDocument();
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

      mockPatientQuery({ data: patient, isLoading: false, error: null });

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

      mockPatientQuery({ data: patient, isLoading: false, error: null });

      render(<PatientDetails />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('ID123')).toBeInTheDocument();
      expect(screen.queryByText(/years|months|days/)).not.toBeInTheDocument();
      expect(screen.queryByText(/male|female/)).not.toBeInTheDocument();
    });
  });

  describe('Missing Fields Handling', () => {
    it('renders empty patient name when name is null', () => {
      const patient = createMockPatient({ fullName: null });
      mockPatientQuery({ data: patient, isLoading: false, error: null });

      render(<PatientDetails />);
      expect(screen.getByTestId('patient-name')).toBeEmptyDOMElement();
    });

    it('calculates and shows age when birthDate is provided', () => {
      const patient = createMockPatient({
        birthDate: '1990-01-01',
      });

      mockPatientQuery({ data: patient, isLoading: false, error: null });

      render(<PatientDetails />);
      expect(
        screen.getByText(/35YEARS 2MONTHS 15DAYS | 1990-01-01/),
      ).toBeInTheDocument();
    });

    it('hides age section when birth date is null', () => {
      const patient = createMockPatient({ birthDate: null });
      mockPatientQuery({ data: patient, isLoading: false, error: null });

      render(<PatientDetails />);
      expect(
        screen.queryByText(/YEARS|DAYS|MONTHS|\d{4}-\d{2}-\d{2}/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Identifier Handling', () => {
    it('hides identifier section when no identifiers exist', () => {
      const patient = createMockPatient({ identifiers: new Map() });
      mockPatientQuery({ data: patient, isLoading: false, error: null });

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

      mockPatientQuery({ data: patient, isLoading: false, error: null });

      render(<PatientDetails />);
      expect(screen.getByText('MRN123 | OP456')).toBeInTheDocument();
      expect(screen.queryByText(/Empty|Null/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it.each([
      [
        'patient data',
        { data: createMockPatient(), isLoading: false, error: null },
      ],
      ['loading state', { data: undefined, isLoading: true, error: null }],
    ])('passes axe accessibility tests with %s', async (_, mockState) => {
      jest.useRealTimers(); // axe doesn't work well with fake timers
      mockPatientQuery(mockState);

      const { container } = render(<PatientDetails />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
