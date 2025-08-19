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
}));

const mockInvestigation: ServiceRequestInputEntry = {
  id: 'test-investigation-1',
  display: 'Complete Blood Count (CBC)',
  selectedPriority: 'routine',
};

const defaultProps = {
  investigation: mockInvestigation,
  onPriorityChange: jest.fn(),
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
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <SelectedInvestigationItem {...defaultProps} />,
      );

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
  });
});
