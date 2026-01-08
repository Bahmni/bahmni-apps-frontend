import {
  FormattedAllergy,
  AllergyStatus,
  AllergySeverity,
  getFormattedAllergies,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { useNotification } from '../../notification';
import AllergiesTable from '../AllergiesTable';

jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedAllergies: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

const mockAddNotification = jest.fn();

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
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <AllergiesTable />
    </QueryClientProvider>
  );

  it('displays patient allergies with all critical information for clinical review', async () => {
    (getFormattedAllergies as jest.Mock).mockResolvedValue(mockSingleAllergy);

    render(wrapper);

    expect(screen.getByTestId('allergy-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
    });

    expect(screen.getByText('[ALLERGY_TYPE_FOOD]')).toBeInTheDocument();
    expect(screen.getByText('SEVERITY_MODERATE')).toBeInTheDocument();
    expect(screen.getByText('ALLERGY_LIST_ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Hives')).toBeInTheDocument();
    expect(getFormattedAllergies).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when patient has no recorded allergies', async () => {
    (getFormattedAllergies as jest.Mock).mockResolvedValue([]);

    render(wrapper);

    expect(screen.getByTestId('allergy-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('NO_ALLERGIES')).toBeInTheDocument();
    });
  });

  it('shows error state when allergy data cannot be fetched', async () => {
    const errorMessage = 'Failed to fetch allergies';
    (getFormattedAllergies as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    render(wrapper);

    expect(screen.getByTestId('allergy-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Failed to fetch allergies',
      });
    });
  });

  it('displays multiple allergies sorted by severity for patient safety', async () => {
    (getFormattedAllergies as jest.Mock).mockResolvedValue(
      mockMultipleAllergies,
    );

    render(wrapper);

    expect(screen.getByTestId('allergy-table')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Shellfish Allergy')).toBeInTheDocument();
    });

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
