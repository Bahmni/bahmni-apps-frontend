import {
  FormattedAllergy,
  AllergySeverity,
  AllergyStatus,
} from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import AllergiesTable from '../AllergiesTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedAllergies: jest.fn(),
}));
jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
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

const mockAddNotification = jest.fn();

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
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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

  describe('Component States', () => {
    it('displays loading state', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isError: null,
        isLoading: true,
      });

      render(wrapper);

      expect(screen.getByTestId('allergy-table')).toBeInTheDocument();
      expect(
        screen.getByTestId('allergies-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('displays error state with error message', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isError: true,
        isLoading: false,
      });

      render(wrapper);

      expect(screen.getByTestId('allergy-table')).toBeInTheDocument();
      expect(screen.getByTestId('allergies-table-error')).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Network error',
      });
    });

    it('displays empty state when no allergies', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      expect(screen.getByTestId('allergy-table')).toBeInTheDocument();
      expect(screen.getByTestId('allergies-table-empty')).toBeInTheDocument();
      expect(screen.getByText('NO_ALLERGIES')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders table with headers when allergies exist', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockAllergy],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

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
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockAllergy],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      expect(screen.getByText('Peanut Allergy')).toBeInTheDocument();
      expect(screen.getByText('[ALLERGY_TYPE_FOOD]')).toBeInTheDocument();
      expect(screen.getByText('SEVERITY_MODERATE')).toBeInTheDocument();
      expect(screen.getByText('Hives')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('ALLERGY_LIST_ACTIVE')).toBeInTheDocument();
    });

    it('displays inactive status correctly', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockInactiveAllergy],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      expect(screen.getByText('ALLERGY_LIST_INACTIVE')).toBeInTheDocument();
    });

    it('displays tooltip when allergy has notes', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockAllergyWithNote],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      const tooltip = screen.getByTestId('tooltip-icon');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveAttribute(
        'title',
        'Patient reports severe reaction',
      );
    });

    it('displays multiple reaction manifestations', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockAllergyWithMultipleReactions],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      expect(
        screen.getByText('Hives, Difficulty breathing, Anaphylaxis'),
      ).toBeInTheDocument();
    });
  });

  describe('Allergy Sorting', () => {
    it('displays allergies sorted by severity (severe → moderate → mild)', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockSortedAllergies,
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

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

      (useQuery as jest.Mock).mockReturnValue({
        data: [allergyWithoutReactions],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      expect(
        screen.getByText('ALLERGY_TABLE_NOT_AVAILABLE'),
      ).toBeInTheDocument();
    });

    it('displays fallback text when recorder is missing', () => {
      const allergyWithoutRecorder: FormattedAllergy = {
        ...mockAllergy,
        recorder: undefined,
      };

      (useQuery as jest.Mock).mockReturnValue({
        data: [allergyWithoutRecorder],
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      expect(
        screen.getByText('ALLERGY_TABLE_NOT_AVAILABLE'),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [mockAllergy],
        error: null,
        isError: false,
        isLoading: false,
      });

      const { container } = render(wrapper);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests in empty state', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isError: false,
        isLoading: false,
      });

      const { container } = render(wrapper);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
