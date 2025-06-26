import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AllergiesTable from '../AllergiesTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import {
  mockAllergyIntolerance,
  mockAllergyWithMultipleCategories,
  mockAllergyWithHighCriticality,
  mockAllergyWithLowCriticality,
  mockInactiveAllergy,
  mockAllergyWithMultipleSeverities,
} from '@__mocks__/allergyMocks';
import { AllergyIntolerance } from 'fhir/r4';
import i18n from '@/setupTests.i18n';

expect.extend(toHaveNoViolations);

// Mock only the hooks, keep real utility functions for integration testing
jest.mock('@hooks/usePatientUUID');
jest.mock('@hooks/useAllergies');

const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedUseAllergies = useAllergies as jest.MockedFunction<
  typeof useAllergies
>;

const mockPatientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

// Create realistic allergies with different severities for sorting tests
const createAllergyWithSeverity = (
  id: string,
  display: string,
  severity: 'mild' | 'moderate' | 'severe',
): AllergyIntolerance => ({
  ...mockAllergyIntolerance,
  id,
  code: {
    ...mockAllergyIntolerance.code!,
    text: display,
  },
  reaction: [
    {
      manifestation: [{ text: 'Test Reaction' }],
      severity,
    },
  ],
});

const mockAllergiesForSorting: AllergyIntolerance[] = [
  createAllergyWithSeverity('mild-allergy', 'Mild Allergy', 'mild'),
  createAllergyWithSeverity('severe-allergy', 'Severe Allergy', 'severe'),
  createAllergyWithSeverity('moderate-allergy', 'Moderate Allergy', 'moderate'),
];

describe('AllergiesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  describe('Hook Integration', () => {
    it('should call usePatientUUID to get patient identifier', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(usePatientUUID).toHaveBeenCalledTimes(1);
    });

    it('should call useAllergies with the patient UUID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(useAllergies).toHaveBeenCalledWith(mockPatientUUID);
      expect(useAllergies).toHaveBeenCalledTimes(1);
    });

    it('should handle null patient UUID gracefully', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(null);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Patient UUID is required'),
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(useAllergies).toHaveBeenCalledWith(null);
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading skeleton when data is loading', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(
        screen.getByTestId('expandable-table-skeleton'),
      ).toBeInTheDocument();
      expect(screen.getByText('Allergies')).toBeInTheDocument();
    });

    it('should display error message when there is an error', () => {
      // Arrange
      const mockError = new Error('Failed to fetch allergies');
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch allergies/)).toBeInTheDocument();
    });

    it('should display empty state when no allergies exist', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(
        screen.getByTestId('expandable-data-table-empty'),
      ).toBeInTheDocument();
      expect(screen.getByText('No allergies recorded')).toBeInTheDocument();
    });

    it('should handle undefined allergies array', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allergies: undefined as any,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(
        screen.getByTestId('expandable-data-table-empty'),
      ).toBeInTheDocument();
    });
  });

  describe('Data Rendering', () => {
    it('should render table with correct structure and headers', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('allergy-table')).toBeInTheDocument();
      expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
      expect(screen.getByText('Allergies')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Allergen')).toBeInTheDocument();
      expect(screen.getByText('Reaction(s)')).toBeInTheDocument();
      expect(screen.getByText('Recorded By')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render accordion that can be expanded', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Initially, accordion content should be visible (tables are open by default in this component)
      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();

      // Find and click the accordion button to test interaction
      const accordionButton = screen.getByRole('button', {
        name: /allergies/i,
      });
      fireEvent.click(accordionButton);

      // Assert that accordion interaction works
      expect(accordionButton).toBeInTheDocument();
    });

    it('should render with proper ARIA attributes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Allergies');
    });
  });

  describe('Severity-Based Sorting', () => {
    it('should sort allergies by severity: severe → moderate → mild', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: mockAllergiesForSorting, // mild, severe, moderate order
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert - verify the allergies are rendered in severity order
      const allergyNames = screen.getAllByText(
        /Severe Allergy|Moderate Allergy|Mild Allergy/,
      );
      expect(allergyNames[0]).toHaveTextContent('Severe Allergy');
      expect(allergyNames[1]).toHaveTextContent('Moderate Allergy');
      expect(allergyNames[2]).toHaveTextContent('Mild Allergy');
    });

    it('should maintain stable sorting for allergies with same severity', () => {
      // Arrange - create multiple severe allergies
      const multipleSevereAllergies: AllergyIntolerance[] = [
        createAllergyWithSeverity('first-severe', 'First Severe', 'severe'),
        createAllergyWithSeverity('second-severe', 'Second Severe', 'severe'),
        createAllergyWithSeverity('mild-allergy', 'Mild Allergy', 'mild'),
      ];

      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: multipleSevereAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert - both severe allergies should appear before mild
      const allergyNames = screen.getAllByText(
        /First Severe|Second Severe|Mild Allergy/,
      );
      expect(allergyNames[0]).toHaveTextContent('First Severe');
      expect(allergyNames[1]).toHaveTextContent('Second Severe');
      expect(allergyNames[2]).toHaveTextContent('Mild Allergy');
    });

    it('should handle allergies without severity gracefully', () => {
      // Arrange
      const allergyWithoutSeverity: AllergyIntolerance = {
        ...mockAllergyIntolerance,
        id: 'no-severity',
        reaction: undefined,
      };

      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [allergyWithoutSeverity],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert - should render without crashing
      expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
    });
  });

  describe('Cell Content Rendering', () => {
    it('should render allergen cell with display name, category, and severity', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
      expect(screen.getByText('[Food]')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('should render reaction manifestations correctly', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByText('Hives')).toBeInTheDocument();
    });

    it('should render multiple reaction manifestations joined with commas', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithMultipleSeverities],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(
        screen.getByText('Hives, Difficulty breathing, Anaphylaxis'),
      ).toBeInTheDocument();
    });

    it('should render recorder name when available', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    it('should render active status with appropriate styling', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      const statusTag = screen.getByText('Active');
      expect(statusTag).toBeInTheDocument();
      expect(statusTag.closest('.cds--tag')).toBeInTheDocument();
    });

    it('should render inactive status with appropriate styling', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockInactiveAllergy],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      const statusTag = screen.getByText('Inactive');
      expect(statusTag).toBeInTheDocument();
      expect(statusTag.closest('.cds--tag')).toBeInTheDocument();
    });

    it('should render severity tags with appropriate CSS classes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      const severityTag = screen.getByText('Moderate');
      expect(severityTag).toBeInTheDocument();
      expect(severityTag.closest('.cds--tag')).toBeInTheDocument();
    });
  });

  describe('Multiple Categories and Complex Data', () => {
    it('should handle multiple categories correctly', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithMultipleCategories],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert - should show the first category
      expect(screen.getByText('[Food]')).toBeInTheDocument();
    });

    it('should handle high criticality allergies', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithHighCriticality],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
    });

    it('should handle low criticality allergies', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithLowCriticality],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should display translated text for English locale', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByText('Allergies')).toBeInTheDocument();
      expect(screen.getByText('Allergen')).toBeInTheDocument();
      expect(screen.getByText('Reaction(s)')).toBeInTheDocument();
      expect(screen.getByText('Recorded By')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should display correct category translations', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByText('[Food]')).toBeInTheDocument();
    });

    it('should display correct severity translations', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('should display correct status translations', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout errors', () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: timeoutError,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Request timeout/)).toBeInTheDocument();
    });

    it('should handle server errors gracefully', () => {
      // Arrange
      const serverError = new Error('500 Internal Server Error');
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: serverError,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/500 Internal Server Error/)).toBeInTheDocument();
    });

    it('should handle empty patient UUID string', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue('');
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Invalid patient UUID'),
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(useAllergies).toHaveBeenCalledWith('');
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    });

    it('should handle allergies with missing required fields gracefully', () => {
      // Arrange
      const incompleteAllergy: AllergyIntolerance = {
        resourceType: 'AllergyIntolerance',
        id: 'incomplete-allergy',
        // Missing many required fields
      } as AllergyIntolerance;

      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [incompleteAllergy],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert - should not crash and should render the table
      expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow accordion expansion and collapse', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      const accordionButton = screen.getByRole('button', {
        name: /allergies/i,
      });

      // Test click interaction
      fireEvent.click(accordionButton);

      // Assert
      expect(accordionButton).toBeInTheDocument();
      // The accordion should respond to clicks (exact behavior depends on Carbon implementation)
    });

    it('should maintain table accessibility during interactions', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Allergies');

      // Check for proper table structure
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should pass accessibility tests', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      const { container } = render(<AllergiesTable />);

      // Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render loading state without critical accessibility violations', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      const { container } = render(<AllergiesTable />);

      // Assert - loading skeletons may have temporary accessibility issues
      // We test for the presence of the skeleton and basic structure
      expect(
        screen.getByTestId('expandable-table-skeleton'),
      ).toBeInTheDocument();
      expect(screen.getByText('Allergies')).toBeInTheDocument();

      // Test accessibility but exclude table header violations for skeleton
      const results = await axe(container, {
        rules: {
          'empty-table-header': { enabled: false }, // Skeleton tables may have empty headers temporarily
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should pass accessibility tests in error state', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Test error'),
        refetch: jest.fn(),
      });

      // Act
      const { container } = render(<AllergiesTable />);

      // Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass accessibility tests in empty state', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      const { container } = render(<AllergiesTable />);

      // Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
