import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ServiceRequestInputEntry } from '../../../../models/serviceRequest';
import SelectedInvestigationItem from '../SelectedInvestigationItem';

expect.extend(toHaveNoViolations);

// Mock the CSS modules
jest.mock('../styles/SelectedInvestigationItem.module.scss', () => ({
  selectedInvestigationTitle: 'selectedInvestigationTitle',
  selectedInvestigationUrgentPriority: 'selectedInvestigationUrgentPriority',
  addInvestigationNote: 'addInvestigationNote',
}));

const mockInvestigation: ServiceRequestInputEntry = {
  id: 'test-investigation-1',
  display: 'Complete Blood Count (CBC)',
  selectedPriority: 'routine',
};

const defaultProps = {
  investigation: mockInvestigation,
  onPriorityChange: jest.fn(),
  onNoteChange: jest.fn(),
};

describe('SelectedInvestigationItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders investigation display name correctly', () => {
      render(<SelectedInvestigationItem {...defaultProps} />);

      expect(
        screen.getByText('Complete Blood Count (CBC)'),
      ).toBeInTheDocument();
    });

    test('renders urgent priority checkbox with correct label', () => {
      render(<SelectedInvestigationItem {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /urgent/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute(
        'id',
        'investigation-priority-checkbox-test-investigation-1',
      );
    });

    test('calls onPriorityChange with "stat" when checkbox is checked', async () => {
      const user = userEvent.setup();
      const mockOnPriorityChange = jest.fn();

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          onPriorityChange={mockOnPriorityChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox', { name: /urgent/i });
      await user.click(checkbox);

      expect(mockOnPriorityChange).toHaveBeenCalledTimes(1);
      expect(mockOnPriorityChange).toHaveBeenCalledWith('stat');
    });

    test('toggles priority when checkbox is clicked multiple times', async () => {
      const user = userEvent.setup();
      const mockOnPriorityChange = jest.fn();

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          onPriorityChange={mockOnPriorityChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox', { name: /urgent/i });

      // First click - should call with 'stat'
      await user.click(checkbox);
      expect(mockOnPriorityChange).toHaveBeenNthCalledWith(1, 'stat');

      // Second click - should call with 'routine'
      await user.click(checkbox);
      expect(mockOnPriorityChange).toHaveBeenNthCalledWith(2, 'routine');
    });

    test('renders "Add Note" link when investigation has no note', () => {
      render(<SelectedInvestigationItem {...defaultProps} />);

      const addNoteLink = screen.getByRole('link', { name: /add note/i });
      expect(addNoteLink).toBeInTheDocument();
    });

    test('shows textarea when "Add Note" link is clicked', async () => {
      const user = userEvent.setup();
      render(<SelectedInvestigationItem {...defaultProps} />);

      const addNoteLink = screen.getByRole('link', { name: /add note/i });
      await user.click(addNoteLink);

      const textarea = screen.getByTestId(
        'investigation-note-test-investigation-1',
      );
      expect(textarea).toBeInTheDocument();
      expect(addNoteLink).not.toBeInTheDocument();
    });

    test('calls onNoteChange when text is entered in textarea', async () => {
      const user = userEvent.setup();
      const mockOnNoteChange = jest.fn();

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          onNoteChange={mockOnNoteChange}
        />,
      );

      const addNoteLink = screen.getByRole('link', { name: /add note/i });
      await user.click(addNoteLink);

      const textarea = screen.getByTestId(
        'investigation-note-test-investigation-1',
      );
      await user.type(textarea, 'Test note');

      expect(mockOnNoteChange).toHaveBeenCalled();
      expect(mockOnNoteChange.mock.calls.length).toBeGreaterThan(0);
    });

    test('hides textarea and clears note when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnNoteChange = jest.fn();

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          onNoteChange={mockOnNoteChange}
        />,
      );

      const addNoteLink = screen.getByRole('link', { name: /add note/i });
      await user.click(addNoteLink);

      const textarea = screen.getByTestId(
        'investigation-note-test-investigation-1',
      );
      await user.type(textarea, 'Test note');

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(
        screen.queryByTestId('investigation-note-test-investigation-1'),
      ).not.toBeInTheDocument();
      expect(mockOnNoteChange).toHaveBeenCalledWith('');
      expect(
        screen.getByRole('link', { name: /add note/i }),
      ).toBeInTheDocument();
    });

    test('shows textarea when investigation has an existing note', () => {
      const investigationWithNote = {
        ...mockInvestigation,
        note: 'Existing note',
      };

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          investigation={investigationWithNote}
        />,
      );

      const textarea = screen.getByTestId(
        'investigation-note-test-investigation-1',
      );
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Existing note');
      expect(
        screen.queryByRole('link', { name: /add note/i }),
      ).not.toBeInTheDocument();
    });

    test('textarea has correct attributes', async () => {
      const user = userEvent.setup();
      render(<SelectedInvestigationItem {...defaultProps} />);

      const addNoteLink = screen.getByRole('link', { name: /add note/i });
      await user.click(addNoteLink);

      const textarea = screen.getByTestId(
        'investigation-note-test-investigation-1',
      );
      expect(textarea).toHaveAttribute(
        'id',
        'investigation-note-test-investigation-1',
      );
      expect(textarea).toHaveAttribute('maxlength', '1024');
    });
  });

  describe('Edge Cases', () => {
    test('handles investigation with empty display name', () => {
      const emptyDisplayInvestigation = {
        ...mockInvestigation,
        display: '',
      };

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          investigation={emptyDisplayInvestigation}
        />,
      );

      // Should still render without crashing
      const checkbox = screen.getByRole('checkbox', { name: /urgent/i });
      expect(checkbox).toBeInTheDocument();
    });

    test('handles investigation with empty note string', () => {
      const investigationWithEmptyNote = {
        ...mockInvestigation,
        note: '',
      };

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          investigation={investigationWithEmptyNote}
        />,
      );

      expect(
        screen.getByRole('link', { name: /add note/i }),
      ).toBeInTheDocument();
    });

    test('handles investigation with undefined note', () => {
      const investigationWithUndefinedNote = {
        ...mockInvestigation,
        note: undefined,
      };

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          investigation={investigationWithUndefinedNote}
        />,
      );

      expect(
        screen.getByRole('link', { name: /add note/i }),
      ).toBeInTheDocument();
    });

    test('handles investigation with very long display name', () => {
      const longDisplayInvestigation = {
        ...mockInvestigation,
        display:
          'This is a very long investigation name that might cause layout issues in the UI and should be handled gracefully by the component',
      };

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          investigation={longDisplayInvestigation}
        />,
      );

      expect(
        screen.getByText(longDisplayInvestigation.display),
      ).toBeInTheDocument();
    });

    test('handles rapid checkbox clicks', async () => {
      const user = userEvent.setup();
      const mockOnPriorityChange = jest.fn();

      render(
        <SelectedInvestigationItem
          {...defaultProps}
          onPriorityChange={mockOnPriorityChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox', { name: /urgent/i });

      // Rapid clicks
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(mockOnPriorityChange).toHaveBeenCalledTimes(3);
      expect(mockOnPriorityChange).toHaveBeenNthCalledWith(1, 'stat');
      expect(mockOnPriorityChange).toHaveBeenNthCalledWith(2, 'routine');
      expect(mockOnPriorityChange).toHaveBeenNthCalledWith(3, 'stat');
    });

    test('prevents default behavior when clicking Add Note link', async () => {
      const user = userEvent.setup();
      render(<SelectedInvestigationItem {...defaultProps} />);

      const addNoteLink = screen.getByRole('link', { name: /add note/i });

      await user.click(addNoteLink);

      expect(
        screen.getByTestId('investigation-note-test-investigation-1'),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <SelectedInvestigationItem {...defaultProps} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has no accessibility violations with note textarea open', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <SelectedInvestigationItem {...defaultProps} />,
      );

      const addNoteLink = screen.getByRole('link', { name: /add note/i });
      await user.click(addNoteLink);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  describe('Snapshot', () => {
    test('matches snapshot', () => {
      const { container } = render(
        <SelectedInvestigationItem {...defaultProps} />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot with existing note', () => {
      const investigationWithNote = {
        ...mockInvestigation,
        note: 'Test note content',
      };
      const { container } = render(
        <SelectedInvestigationItem
          {...defaultProps}
          investigation={investigationWithNote}
        />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
