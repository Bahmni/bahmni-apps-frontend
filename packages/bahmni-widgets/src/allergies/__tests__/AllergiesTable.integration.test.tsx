import {
  FormattedAllergy,
  AllergyStatus,
  AllergySeverity,
} from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import AllergiesTable from '../AllergiesTable';
import { useAllergies } from '../useAllergies';

jest.mock('../useAllergies');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

const mockedUseAllergies = useAllergies as jest.MockedFunction<
  typeof useAllergies
>;

const mockSingleAllergy: FormattedAllergy[] = [
  {
    id: 'allergy-123',
    display: 'Peanut Allergy',
    category: ['food'],
    criticality: 'high',
    status: AllergyStatus.Active,
    recordedDate: '2023-01-01T12:00:00Z',
    recorder: 'Dr. Smith',
    reactions: [
      {
        manifestation: ['Hives'],
        severity: AllergySeverity.moderate,
      },
    ],
    severity: AllergySeverity.moderate,
    note: 'Patient allergic to peanuts since childhood',
  },
];

const mockMultipleAllergies: FormattedAllergy[] = [
  {
    id: 'severe-allergy',
    display: 'Shellfish Allergy',
    category: ['food'],
    status: AllergyStatus.Active,
    recordedDate: '2023-02-15T10:30:00Z',
    recorder: 'Dr. Johnson',
    reactions: [
      {
        manifestation: ['Anaphylaxis', 'Difficulty breathing'],
        severity: AllergySeverity.severe,
      },
    ],
    severity: AllergySeverity.severe,
  },
  {
    id: 'mild-allergy',
    display: 'Dust Allergy',
    category: ['environment'],
    status: AllergyStatus.Inactive,
    recordedDate: '2022-11-05T14:45:00Z',
    recorder: 'Dr. Williams',
    reactions: [
      {
        manifestation: ['Sneezing'],
        severity: AllergySeverity.mild,
      },
    ],
    severity: AllergySeverity.mild,
  },
  {
    id: 'moderate-allergy',
    display: 'Peanut Allergy',
    category: ['food'],
    status: AllergyStatus.Active,
    recordedDate: '2023-01-01T12:00:00Z',
    recorder: 'Dr. Smith',
    reactions: [
      {
        manifestation: ['Hives'],
        severity: AllergySeverity.moderate,
      },
    ],
    severity: AllergySeverity.moderate,
  },
];

describe('AllergiesTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('displays patient allergies with all critical information for clinical review', () => {
    mockedUseAllergies.mockReturnValue({
      allergies: mockSingleAllergy,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AllergiesTable />);

    expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
    expect(screen.getByText('[ALLERGY_TYPE_FOOD]')).toBeInTheDocument();
    expect(screen.getByText('SEVERITY_MODERATE')).toBeInTheDocument();
    expect(screen.getByText('ALLERGY_LIST_ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Hives')).toBeInTheDocument();
  });

  it('shows loading state while fetching allergy data', () => {
    mockedUseAllergies.mockReturnValue({
      allergies: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<AllergiesTable />);

    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when patient has no recorded allergies', () => {
    mockedUseAllergies.mockReturnValue({
      allergies: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AllergiesTable />);

    expect(screen.getByText('NO_ALLERGIES')).toBeInTheDocument();
  });

  it('shows error state when allergy data cannot be fetched', () => {
    const mockError = new Error('Failed to fetch allergies');
    mockedUseAllergies.mockReturnValue({
      allergies: [],
      loading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    render(<AllergiesTable />);

    expect(screen.getByText('Failed to fetch allergies')).toBeInTheDocument();
  });

  it('displays multiple allergies sorted by severity for patient safety', () => {
    mockedUseAllergies.mockReturnValue({
      allergies: mockMultipleAllergies,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AllergiesTable />);

    const allergies = screen.getAllByRole('row').slice(1); // Skip header row
    const allergyNames = allergies.map(
      (row) => (row as HTMLElement).textContent ?? '',
    );

    // Verify severe allergies appear first
    expect(allergyNames[0]).toContain('Shellfish Allergy');
    expect(allergyNames[0]).toContain('SEVERITY_SEVERE');

    // Verify all allergies are displayed
    expect(screen.getByText('Shellfish Allergy')).toBeInTheDocument();
    expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
    expect(screen.getByText('Dust Allergy')).toBeInTheDocument();

    // Verify status display
    expect(screen.getAllByText('ALLERGY_LIST_ACTIVE')).toHaveLength(2);
    expect(screen.getByText('ALLERGY_LIST_INACTIVE')).toBeInTheDocument();
  });
});
