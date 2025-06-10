import React from 'react';
import { render, screen } from '@testing-library/react';
import i18n from '@/setupTests.i18n';
import AllergiesTable from '../AllergiesTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import {
  mockAllergyIntolerance,
  mockAllergyWithMultipleCategories,
  mockAllergyWithType,
  mockIntoleranceWithType,
  mockAllergyWithHighCriticality,
  mockAllergyWithLowCriticality,
  mockInactiveAllergy,
  mockAllergyWithMultipleSeverities,
} from '@__mocks__/allergyMocks';
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
    severity: 'moderate',
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
        severity: 'severe',
      },
      {
        manifestation: ['Difficulty breathing'],
        severity: 'severe',
      },
    ],
    severity: 'severe',
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
    severity: 'mild',
  },
];

describe('AllergiesTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    // Reset i18n to English
    i18n.changeLanguage('en');
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
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument(); // Severity tag
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Hives')).toBeInTheDocument();
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
      expect(
        screen.getByText('No Allergies recorded for this patient.'),
      ).toBeInTheDocument();
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
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(screen.getByText('Shellfish Allergy [Food]')).toBeInTheDocument();
      expect(
        screen.getByText('Dust Allergy [Environment]'),
      ).toBeInTheDocument();

      // Verify severity tags are displayed correctly
      expect(screen.getByText('Moderate')).toBeInTheDocument(); // Peanut allergy
      expect(screen.getByText('Severe')).toBeInTheDocument(); // Shellfish allergy
      expect(screen.getByText('Mild')).toBeInTheDocument(); // Dust allergy

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
      expect(table).toHaveAttribute('aria-label', 'Allergies');

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

  // New Field Tests
  describe('New Field Tests', () => {
    it('should handle allergy type field correctly', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithType],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedAllergyWithType: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: 'allergy-with-type',
      };

      mockedFormatAllergies.mockReturnValue([formattedAllergyWithType]);

      render(<AllergiesTable />);

      // Verify the allergy is displayed correctly
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should handle intolerance type field correctly', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockIntoleranceWithType],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedIntoleranceWithType: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: 'intolerance-with-type',
      };

      mockedFormatAllergies.mockReturnValue([formattedIntoleranceWithType]);

      render(<AllergiesTable />);

      // Verify the intolerance is displayed correctly
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should handle multiple categories correctly', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithMultipleCategories],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedAllergyWithMultipleCategories: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: 'allergy-multiple-categories',
        category: ['food', 'medication', 'environment'],
      };

      mockedFormatAllergies.mockReturnValue([
        formattedAllergyWithMultipleCategories,
      ]);

      render(<AllergiesTable />);

      // Verify the allergy with multiple categories is displayed correctly
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should handle criticality levels correctly', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [
          mockAllergyWithHighCriticality,
          mockAllergyWithLowCriticality,
        ],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedAllergiesWithCriticality: FormattedAllergy[] = [
        {
          ...mockFormattedAllergies[0],
          id: 'allergy-high-criticality',
          criticality: 'high',
        },
        {
          ...mockFormattedAllergies[0],
          id: 'allergy-low-criticality',
          criticality: 'low',
          display: 'Low Criticality Allergy',
        },
      ];

      mockedFormatAllergies.mockReturnValue(formattedAllergiesWithCriticality);

      render(<AllergiesTable />);

      // Verify both allergies are displayed correctly
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(
        screen.getByText('Low Criticality Allergy [Food]'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('Active').length).toBe(2);
    });

    it('should handle multiple reactions with different severities correctly', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithMultipleSeverities],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedAllergyWithMultipleSeverities: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: 'allergy-multiple-severities',
        reactions: [
          {
            manifestation: ['Hives'],
            severity: 'mild',
          },
          {
            manifestation: ['Difficulty breathing'],
            severity: 'severe',
          },
          {
            manifestation: ['Anaphylaxis'],
            severity: 'severe',
          },
        ],
      };

      mockedFormatAllergies.mockReturnValue([
        formattedAllergyWithMultipleSeverities,
      ]);

      render(<AllergiesTable />);

      // Verify the allergy with multiple severities is displayed correctly
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(
        screen.getByText('Hives, Difficulty breathing, Anaphylaxis'),
      ).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle inactive status correctly', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockInactiveAllergy],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedInactiveAllergy: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: 'inactive-allergy',
        status: 'Inactive',
      };

      mockedFormatAllergies.mockReturnValue([formattedInactiveAllergy]);

      render(<AllergiesTable />);

      // Verify the inactive allergy is displayed correctly
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should handle missing fields gracefully', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const allergyWithMissingFields: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        recorder: undefined,
        reactions: undefined,
        recordedDate: '',
      };

      mockedFormatAllergies.mockReturnValue([allergyWithMissingFields]);

      render(<AllergiesTable />);

      // Verify the allergy with missing fields is displayed correctly
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
      expect(screen.getAllByText('Not available')).toHaveLength(2); // For missing recorder and reactions
    });

    it('should handle malformed data without crashing', () => {
      // Mock the hooks
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Create a malformed allergy object
      const malformedAllergy = {
        id: 'malformed-allergy',
        display: 'Malformed Allergy',
        // Missing required fields
      } as unknown as FormattedAllergy;

      mockedFormatAllergies.mockReturnValue([malformedAllergy]);

      // This should not throw an error
      render(<AllergiesTable />);

      // Verify the component rendered without crashing
      expect(
        screen.getByText('Malformed Allergy [undefined]'),
      ).toBeInTheDocument();
    });

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
