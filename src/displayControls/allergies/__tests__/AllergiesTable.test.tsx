import React from 'react';
import { render, screen } from '@testing-library/react';
import AllergiesTable from '../AllergiesTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import { formatDateTime } from '@utils/date';
import { generateId } from '@utils/common';
import * as common from '@utils/common';
import i18n from '@/setupTests.i18n';
import {
  mockAllergyIntolerance,
  mockAllergyWithMissingFields,
  mockAllergyWithEmptyReactions,
  mockAllergyWithMultipleCategories,
  mockAllergyWithType,
  mockIntoleranceWithType,
  mockAllergyWithHighCriticality,
  mockAllergyWithLowCriticality,
  mockInactiveAllergy,
  mockAllergyWithMultipleSeverities,
} from '@__mocks__/allergyMocks';
import { FhirAllergyIntolerance, FormattedAllergy } from '@types/allergy';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock the hooks and utilities
jest.mock('@hooks/usePatientUUID');
jest.mock('@hooks/useAllergies');
jest.mock('@services/allergyService');
jest.mock('@utils/date');
jest.mock('@utils/common');
// Mock CSS modules
jest.mock('../styles/AllergiesTable.module.scss', () => ({
  mildSeverity: 'mildSeverity',
  moderateSeverity: 'moderateSeverity',
  severeSeverity: 'severeSeverity',
}));

jest.mock('@components/common/expandableDataTable/ExpandableDataTable', () => ({
  ExpandableDataTable: jest.fn(
    ({
      tableTitle,
      rows,
      headers,
      renderCell,
      renderExpandedContent,
      loading,
      error,
      emptyStateMessage,
      rowClassNames,
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    }: any) => {
      if (loading) {
        return <div data-testid="mock-loading-state">Loading...</div>;
      }

      if (error) {
        return <div data-testid="mock-error-state">{error.message}</div>;
      }

      if (!rows || rows.length === 0) {
        return <div data-testid="mock-empty-state">{emptyStateMessage}</div>;
      }

      // Render table headers
      const headerElements = headers.map(
        (header: { key: string; header: string }) => (
          <div key={header.key} data-testid={`header-${header.key}`}>
            {header.header}
          </div>
        ),
      );

      // Render table rows
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const rowElements = rows.map((row: any, rowIndex: number) => {
        const cells = headers.map((header: { key: string }) => (
          <div
            key={`${rowIndex}-${header.key}`}
            data-testid={`cell-${header.key}-${rowIndex}`}
          >
            {renderCell(row, header.key)}
          </div>
        ));

        // Render expanded content only if it exists
        const expandedContent = renderExpandedContent(row) ? (
          <div data-testid={`expanded-content-${rowIndex}`}>
            {renderExpandedContent(row)}
          </div>
        ) : null;

        // Apply row class if provided - use row.id as key for rowClassNames
        const rowClass =
          rowClassNames && row.id && rowClassNames[row.id]
            ? rowClassNames[row.id]
            : '';

        return (
          <div
            key={rowIndex}
            data-testid={`row-${rowIndex}`}
            className={rowClass}
          >
            {cells}
            {expandedContent}
          </div>
        );
      });

      return (
        <div data-testid="mock-expandable-table">
          <div data-testid="table-title">{tableTitle}</div>
          <div data-testid="table-headers">{headerElements}</div>
          <div data-testid="table-rows">{rowElements}</div>
        </div>
      );
    },
  ),
}));

// Mock implementations
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedUseAllergies = useAllergies as jest.MockedFunction<
  typeof useAllergies
>;
const mockedFormatAllergies = formatAllergies as jest.MockedFunction<
  typeof formatAllergies
>;
const mockedFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockedGenerateId = generateId as jest.MockedFunction<typeof generateId>;

// Mock data for formatted allergies
const mockPatientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

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
    note: ['Patient experiences severe reaction within minutes of exposure'],
  },
];

const mockFormattedAllergiesWithNotes: FormattedAllergy[] = [
  {
    ...mockFormattedAllergies[0],
    note: ['Patient experiences severe reaction within minutes of exposure'],
  },
];

const mockFormattedAllergiesWithMultipleReactions: FormattedAllergy[] = [
  {
    ...mockFormattedAllergies[0],
    reactions: [
      {
        manifestation: ['Hives', 'Swelling'],
        severity: 'moderate',
      },
      {
        manifestation: ['Difficulty breathing'],
        severity: 'severe',
      },
    ],
  },
];

// Additional mock data for sad path tests
const mockAllergyWithoutReactions: FormattedAllergy = {
  ...mockFormattedAllergies[0],
  reactions: undefined,
  severity: undefined,
};

const mockAllergyWithoutRecorder: FormattedAllergy = {
  ...mockFormattedAllergies[0],
  recorder: undefined,
};

const mockMalformedAllergy = {
  id: 'malformed-allergy',
  // Missing required fields
} as unknown as FormattedAllergy;

const mockUnexpectedStructure = {
  id: 'unexpected-structure',
  display: 123, // Wrong type for display (number instead of string)
  status: true, // Wrong type for status (boolean instead of string)
} as unknown as FormattedAllergy;

describe('AllergiesTable Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGenerateId.mockReturnValue('mock-id');
    mockedFormatDateTime.mockImplementation((date) => ({
      formattedResult: `Formatted: ${date}`,
    }));

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

  // 1. Component Initialization and Hook Interactions
  describe('Component Initialization and Hook Interactions', () => {
    it('should call usePatientUUID to get patient UUID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue([]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(usePatientUUID).toHaveBeenCalled();
    });

    it('should call useAllergies with the correct patient UUID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue([]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(useAllergies).toHaveBeenCalledWith(mockPatientUUID);
    });

    it('should call formatAllergies with the allergies from useAllergies', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue([]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(formatAllergies).toHaveBeenCalledWith([mockAllergyIntolerance]);
    });

    it('should not call formatAllergies when allergies array is empty', () => {
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
      expect(formatAllergies).not.toHaveBeenCalled();
    });
  });

  // 2. Rendering Tests
  describe('Rendering Tests', () => {
    it('should render loading state when loading is true', () => {
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
      expect(screen.getByTestId('mock-loading-state')).toBeInTheDocument();
    });

    it('should render error state when there is an error', () => {
      // Arrange
      const mockError = new Error('Test error message');
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
      expect(screen.getByTestId('mock-error-state')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render empty state when allergies array is empty', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue([]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-empty-state')).toBeInTheDocument();
      expect(
        screen.getByText('No Allergies recorded for this patient.'),
      ).toBeInTheDocument();
    });

    it('should render table with correct headers', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('header-display')).toHaveTextContent(
        'Allergen',
      );
      expect(screen.getByTestId('header-manifestation')).toHaveTextContent(
        'Reaction(s)',
      );
      expect(screen.getByTestId('header-recorder')).toHaveTextContent(
        'Recorded By',
      );
      expect(screen.getByTestId('header-status')).toHaveTextContent('Status');
    });

    it('should render table with correct title', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('table-title')).toHaveTextContent('Allergies');
    });
  });

  // 3. Cell Rendering Tests
  describe('Cell Rendering Tests', () => {
    it('should render display cell correctly with category and severity tag', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      // Act
      render(<AllergiesTable />);

      // Assert
      const displayCell = screen.getByTestId('cell-display-0');
      expect(displayCell).toHaveTextContent('Peanut Allergy [Food]');
      expect(displayCell).toHaveTextContent('Moderate');
    });

    it('should render status cell with correct tag type for active status', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const activeAllergy: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        status: 'Active',
      };

      mockedFormatAllergies.mockReturnValue([activeAllergy]);

      // Act
      render(<AllergiesTable />);

      // Assert
      const statusCell = screen.getByTestId('cell-status-0');
      expect(statusCell).toHaveTextContent('Active');
      // In a real test, we would check for the Tag component with type="green"
      // but since we're using a mock, we just check for the content
    });

    it('should render status cell with correct tag type for inactive status', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const inactiveAllergy: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        status: 'Inactive',
      };

      mockedFormatAllergies.mockReturnValue([inactiveAllergy]);

      // Act
      render(<AllergiesTable />);

      // Assert
      const statusCell = screen.getByTestId('cell-status-0');
      expect(statusCell).toHaveTextContent('Inactive');
      // In a real test, we would check for the Tag component with type="gray"
      // but since we're using a mock, we just check for the content
    });

    it('should render manifestation cell correctly with single reaction', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('cell-manifestation-0')).toHaveTextContent(
        'Hives',
      );
    });

    it('should render manifestation cell correctly with multiple reactions', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue(
        mockFormattedAllergiesWithMultipleReactions,
      );

      // Act
      render(<AllergiesTable />);

      // Assert
      const manifestationCell = screen.getByTestId('cell-manifestation-0');
      expect(manifestationCell).toHaveTextContent(
        'Hives, Swelling, Difficulty breathing',
      );
    });

    it('should render recorder cell correctly', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('cell-recorder-0')).toHaveTextContent(
        'Dr. Smith',
      );
    });

    it('should render "Not available" for missing recorder', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithMissingFields],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const allergyWithoutRecorder: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        recorder: undefined,
      };

      mockedFormatAllergies.mockReturnValue([allergyWithoutRecorder]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('cell-recorder-0')).toHaveTextContent(
        'Not available',
      );
    });

    it('should render "Not available" for missing reactions', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithEmptyReactions],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const allergyWithoutReactions: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        reactions: undefined,
      };

      mockedFormatAllergies.mockReturnValue([allergyWithoutReactions]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('cell-manifestation-0')).toHaveTextContent(
        'Not available',
      );
    });
  });

  // 4. Expanded Content Tests
  describe('Expanded Content Tests', () => {
    it('should render notes in expanded content when allergy has notes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue(mockFormattedAllergiesWithNotes);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('expanded-content-0')).toHaveTextContent(
        'Patient experiences severe reaction within minutes of exposure',
      );
    });

    it('should render content without expansion when allergy has no notes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      // Act
      render(<AllergiesTable />);

      // Assert

      expect(screen.getByTestId('row-0')).toBeInTheDocument();
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Peanut Allergy [Food]',
      );
    });

    it('should render multiple notes when allergy has multiple notes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const allergyWithMultipleNotes: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        note: ['First note', 'Second note', 'Third note'],
      };

      mockedFormatAllergies.mockReturnValue([allergyWithMultipleNotes]);

      // Act
      render(<AllergiesTable />);

      // Assert
      const expandedContent = screen.getByTestId('expanded-content-0');
      expect(expandedContent).toHaveTextContent(
        'First note, Second note, Third note',
      );
    });

    it('should correctly generate unique IDs for expanded row content', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue(mockFormattedAllergies);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(generateId).toHaveBeenCalled();
    });
  });

  // 5. New Field Tests
  describe('New Field Tests', () => {
    it('should handle allergy type field correctly', () => {
      // Arrange
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

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Peanut Allergy [Food]',
      );
    });

    it('should handle intolerance type field correctly', () => {
      // Arrange
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

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Peanut Allergy [Food]',
      );
    });

    it('should handle multiple categories correctly', () => {
      // Arrange
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

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Peanut Allergy [Food]',
      );
    });

    it('should handle high criticality correctly', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithHighCriticality],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedAllergyWithHighCriticality: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: 'allergy-high-criticality',
        criticality: 'high',
      };

      mockedFormatAllergies.mockReturnValue([
        formattedAllergyWithHighCriticality,
      ]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Peanut Allergy [Food]',
      );
    });

    it('should handle low criticality correctly', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithLowCriticality],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const formattedAllergyWithLowCriticality: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: 'allergy-low-criticality',
        criticality: 'low',
      };

      mockedFormatAllergies.mockReturnValue([
        formattedAllergyWithLowCriticality,
      ]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Peanut Allergy [Food]',
      );
    });

    it('should handle inactive status correctly', () => {
      // Arrange
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

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
      expect(screen.getByTestId('cell-status-0')).toHaveTextContent('Inactive');
    });

    it('should handle multiple reactions with different severities correctly', () => {
      // Arrange
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
        severity: 'severe',
      };

      mockedFormatAllergies.mockReturnValue([
        formattedAllergyWithMultipleSeverities,
      ]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
      expect(screen.getByTestId('cell-manifestation-0')).toHaveTextContent(
        'Hives, Difficulty breathing, Anaphylaxis',
      );
    });
  });

  // 6. Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    it('should handle null patient UUID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(null);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Invalid patient UUID'),
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Invalid patient UUID',
      );
    });

    it('should handle network errors', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Network error',
      );
    });

    it('should handle server errors', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Server error: 500 Internal Server Error'),
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Server error: 500 Internal Server Error',
      );
    });

    it('should handle authorization errors', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: new Error('Authorization error: 401 Unauthorized'),
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Authorization error: 401 Unauthorized',
      );
    });

    it('should handle allergies with missing ID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const allergyWithoutId: FormattedAllergy = {
        ...mockFormattedAllergies[0],
        id: undefined as unknown as string, // Force undefined ID
      };

      mockedFormatAllergies.mockReturnValue([allergyWithoutId]);

      // Act
      render(<AllergiesTable />);

      // Assert
      // The component should use generateId to create an ID
      expect(generateId).toHaveBeenCalled();
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
    });

    it('should display "Not available" when the allergy reactions are missing', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue([mockAllergyWithoutReactions]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('cell-manifestation-0')).toHaveTextContent(
        'Not available',
      );
    });

    it('should display "Not available" when the provider/recorder field is missing', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue([mockAllergyWithoutRecorder]);

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('cell-recorder-0')).toHaveTextContent(
        'Not available',
      );
    });

    it('should return an empty array when no allergies data is provided', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: null as unknown as FhirAllergyIntolerance[], // Force null allergies
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<AllergiesTable />);

      // Assert
      expect(screen.getByTestId('mock-empty-state')).toBeInTheDocument();
      expect(
        screen.getByText('No Allergies recorded for this patient.'),
      ).toBeInTheDocument();
    });

    it('should handle empty or malformed allergy data without crashing', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue([mockMalformedAllergy]);

      // Act
      render(<AllergiesTable />);

      // Assert
      // The component should render without crashing
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
    });

    it('should not break if formatAllergies returns an unexpected structure', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyIntolerance],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockedFormatAllergies.mockReturnValue([mockUnexpectedStructure]);

      // Act
      render(<AllergiesTable />);

      // Assert
      // The component should render without crashing
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('accessible forms pass axe', async () => {
      const { container } = render(<AllergiesTable />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
