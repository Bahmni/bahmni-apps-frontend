import {
  FormattedAllergy,
  AllergySeverity,
  AllergyStatus,
} from '@bahmni-frontend/bahmni-services';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import AllergiesTable from '../AllergiesTable';
import { useAllergies } from '../useAllergies';

expect.extend(toHaveNoViolations);

jest.mock('../useAllergies');
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));
jest.mock('@bahmni-frontend/bahmni-design-system', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-design-system'),
  TooltipIcon: ({
    content,
    ariaLabel,
  }: {
    content: string;
    ariaLabel: string;
  }) => (
    <div data-testid="tooltip-icon" title={content} aria-label={ariaLabel}>
      <span role="img" aria-label="notes">
        ℹ️
      </span>
    </div>
  ),
}));

const mockedUseAllergies = useAllergies as jest.MockedFunction<
  typeof useAllergies
>;

const mockAllergy: FormattedAllergy = {
  id: 'allergy-1',
  display: 'Peanut Allergy',
  severity: AllergySeverity.moderate,
  category: ['food'],
  status: AllergyStatus.Active,
  reactions: [{ manifestation: ['Hives'] }],
  recorder: 'Dr. Smith',
  recordedDate: '2024-01-15',
};

const mockInactiveAllergy: FormattedAllergy = {
  ...mockAllergy,
  id: 'allergy-2',
  status: AllergyStatus.Inactive,
};

const mockAllergyWithNote: FormattedAllergy = {
  ...mockAllergy,
  id: 'allergy-3',
  note: 'Patient reports severe reaction',
};

const mockAllergyWithMultipleReactions: FormattedAllergy = {
  ...mockAllergy,
  id: 'allergy-4',
  reactions: [
    { manifestation: ['Hives', 'Difficulty breathing'] },
    { manifestation: ['Anaphylaxis'] },
  ],
};

const mockSortedAllergies: FormattedAllergy[] = [
  {
    ...mockAllergy,
    id: 'mild',
    display: 'Mild Allergy',
    severity: AllergySeverity.mild,
  },
  {
    ...mockAllergy,
    id: 'severe',
    display: 'Severe Allergy',
    severity: AllergySeverity.severe,
  },
  {
    ...mockAllergy,
    id: 'moderate',
    display: 'Moderate Allergy',
    severity: AllergySeverity.moderate,
  },
];

describe('AllergiesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component States', () => {
    it('displays loading state', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
    });

    it('displays error state with error message', () => {
      const error = new Error('Network error');
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(screen.getByTestId('allergies-table-error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('displays empty state when no allergies', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
      expect(screen.getByText('NO_ALLERGIES')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders table with headers when allergies exist', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergy],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(screen.getByRole('table')).toHaveAttribute(
        'aria-label',
        'ALLERGIES_DISPLAY_CONTROL_HEADING',
      );
      expect(screen.getByText('ALLERGEN')).toBeInTheDocument();
      expect(screen.getByText('REACTIONS')).toBeInTheDocument();
      expect(screen.getByText('ALLERGY_LIST_RECORDED_BY')).toBeInTheDocument();
      expect(screen.getByText('ALLERGY_LIST_STATUS')).toBeInTheDocument();
    });

    it('displays allergy information correctly', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergy],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
      expect(screen.getByText('[ALLERGY_TYPE_FOOD]')).toBeInTheDocument();
      expect(screen.getByText('SEVERITY_MODERATE')).toBeInTheDocument();
      expect(screen.getByText('Hives')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('ALLERGY_LIST_ACTIVE')).toBeInTheDocument();
    });

    it('displays inactive status correctly', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [mockInactiveAllergy],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(screen.getByText('ALLERGY_LIST_INACTIVE')).toBeInTheDocument();
    });

    it('displays tooltip when allergy has notes', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithNote],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      const tooltip = screen.getByTestId('tooltip-icon');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveAttribute(
        'title',
        'Patient reports severe reaction',
      );
    });

    it('displays multiple reaction manifestations', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergyWithMultipleReactions],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(
        screen.getByText('Hives, Difficulty breathing, Anaphylaxis'),
      ).toBeInTheDocument();
    });
  });

  describe('Allergy Sorting', () => {
    it('displays allergies sorted by severity (severe → moderate → mild)', () => {
      mockedUseAllergies.mockReturnValue({
        allergies: mockSortedAllergies,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      const allergyNames = screen.getAllByText(
        /Severe Allergy|Moderate Allergy|Mild Allergy/,
      );
      expect(allergyNames[0]).toHaveTextContent('Severe Allergy');
      expect(allergyNames[1]).toHaveTextContent('Moderate Allergy');
      expect(allergyNames[2]).toHaveTextContent('Mild Allergy');
    });
  });

  describe('Cell Content Edge Cases', () => {
    it('displays fallback text when reactions are missing', () => {
      const allergyWithoutReactions: FormattedAllergy = {
        ...mockAllergy,
        reactions: undefined,
      };

      mockedUseAllergies.mockReturnValue({
        allergies: [allergyWithoutReactions],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(
        screen.getByText('ALLERGY_TABLE_NOT_AVAILABLE'),
      ).toBeInTheDocument();
    });

    it('displays fallback text when recorder is missing', () => {
      const allergyWithoutRecorder: FormattedAllergy = {
        ...mockAllergy,
        recorder: undefined,
      };

      mockedUseAllergies.mockReturnValue({
        allergies: [allergyWithoutRecorder],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AllergiesTable />);

      expect(
        screen.getByText('ALLERGY_TABLE_NOT_AVAILABLE'),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [mockAllergy],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<AllergiesTable />);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests in empty state', async () => {
      mockedUseAllergies.mockReturnValue({
        allergies: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<AllergiesTable />);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
