import React from 'react';
import { render, screen } from '@testing-library/react';
import AllergiesTable from '../AllergiesTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import { mockAllergyIntolerance } from '@__mocks__/allergyMocks';
import { FhirAllergyIntolerance, FormattedAllergy } from '@types/allergy';
import * as common from '@utils/common';

// Mock the hooks
jest.mock('@hooks/usePatientUUID');
jest.mock('@hooks/useAllergies');
jest.mock('@services/allergyService');

const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const mockedUseAllergies = useAllergies as jest.MockedFunction<
  typeof useAllergies
>;

const mockedFormatAllergies = formatAllergies as jest.MockedFunction<
  typeof formatAllergies
>;

// Mock data for integration tests
const mockPatientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

const mockAllergies: FhirAllergyIntolerance[] = [mockAllergyIntolerance];

const mockFormattedAllergies: FormattedAllergy[] = [
  {
    id: 'allergy-123',
    display: 'Peanut Allergy',
    category: ['food'],
    criticality: 'high',
    status: 'Active',
    recordedDate: '2023-01-01T12:00:00Z',
    recorder: 'Dr. Smith',
    reactions: [
      {
        manifestation: ['Hives'],
        severity: 'moderate',
      },
    ],
  },
];

const mockMultipleAllergies: FormattedAllergy[] = [
  mockFormattedAllergies[0],
  {
    id: 'allergy-456',
    display: 'Shellfish Allergy',
    category: ['food'],
    criticality: 'moderate',
    status: 'Active',
    recordedDate: '2023-02-15T10:30:00Z',
    recorder: 'Dr. Johnson',
    reactions: [
      {
        manifestation: ['Rash', 'Swelling'],
        severity: 'moderate',
      },
      {
        manifestation: ['Difficulty breathing'],
        severity: 'severe',
      },
    ],
  },
  {
    id: 'allergy-789',
    display: 'Dust Allergy',
    category: ['environment'],
    criticality: 'low',
    status: 'Inactive',
    recordedDate: '2022-11-05T14:45:00Z',
    recorder: 'Dr. Williams',
    reactions: [
      {
        manifestation: ['Sneezing', 'Runny nose'],
        severity: 'mild',
      },
    ],
  },
];

describe('AllergiesTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    // Mock capitalize to capitalize first letter of each word
    jest
      .spyOn(common, 'capitalize')
      .mockImplementation((...args: unknown[]) => {
        const str = args[0] as string;
        if (!str) return '';
        return str
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      });
  });

  // Data Fetching and Display Tests
  describe('Data Fetching and Display', () => {
    it('should fetch allergy data and display it correctly', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      render(<AllergiesTable />);

      // Verify the data fetching flow
      expect(usePatientUUID).toHaveBeenCalled();
      expect(useAllergies).toHaveBeenCalledWith(mockPatientUUID);
      expect(formatAllergies).toHaveBeenCalledWith(mockAllergies);

      // Verify the formatted allergies are displayed
      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Hives')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('should render the loading state when data is being fetched', () => {
      // Mock the hooks with loading state
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      // Verify loading state is shown
      expect(
        screen.getByTestId('expandable-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('should render the error state when an error occurs', () => {
      // Mock the hooks with error state
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Failed to fetch allergies'),
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      // Verify error state is shown
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to fetch allergies', { exact: false }),
      ).toBeInTheDocument();
    });

    it('should display "No allergies found" when the patient has no recorded allergies', () => {
      // Mock the hooks with empty allergies
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue([]);

      render(<AllergiesTable />);

      // Verify empty state is shown
      expect(
        screen.getByTestId('expandable-data-table-empty'),
      ).toBeInTheDocument();
      expect(screen.getByText('No allergies found')).toBeInTheDocument();
    });
  });

  // Row Interaction Tests
  describe('Row Interactions', () => {
    it('should handle multiple allergies and render them properly in the table', () => {
      // Mock the hooks with multiple allergies
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue(mockMultipleAllergies);

      render(<AllergiesTable />);

      // Verify all allergies are displayed
      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
      expect(screen.getByText('Shellfish Allergy')).toBeInTheDocument();
      expect(screen.getByText('Dust Allergy')).toBeInTheDocument();

      // Verify different statuses are displayed correctly
      expect(screen.getAllByText('Active').length).toBe(2);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should correctly map reactions to their respective manifestation and severity levels', () => {
      // Mock the hooks with multiple allergies
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue(mockMultipleAllergies);

      render(<AllergiesTable />);

      // Verify reactions are displayed correctly
      expect(screen.getByText('Hives')).toBeInTheDocument();
      expect(
        screen.getByText('Rash, Swelling, Difficulty breathing'),
      ).toBeInTheDocument();
      expect(screen.getByText('Sneezing, Runny nose')).toBeInTheDocument();

      // Verify severity levels are displayed correctly
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Moderate, Severe')).toBeInTheDocument();
      expect(screen.getByText('Mild')).toBeInTheDocument();
    });
  });

  // Accessibility and Styling Tests
  describe('Accessibility and Styling', () => {
    it('should apply proper styling and accessibility attributes', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      render(<AllergiesTable />);

      // Verify the table has proper ARIA attributes
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Patient allergies');

      // Verify the table has proper styling
      const tableContainer = screen.getByTestId('allergy-table');
      expect(tableContainer).toHaveStyle({ width: '100%' });

      // Verify the table headers have proper attributes
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });

      // Verify the table rows have proper attributes
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should refetch allergies when patient UUID changes', () => {
      const refetchMock = jest.fn();

      // First render with initial UUID
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergies,
        loading: false,
        error: null,
        refetch: refetchMock,
      });
      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      const { rerender } = render(<AllergiesTable />);

      // Change the UUID and rerender
      const newUUID = 'new-patient-uuid';
      (usePatientUUID as jest.Mock).mockReturnValue(newUUID);

      rerender(<AllergiesTable />);

      // Verify useAllergies was called with the new UUID
      expect(useAllergies).toHaveBeenCalledWith(newUUID);
    });
  });
});
