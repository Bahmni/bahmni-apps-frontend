import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SaveAndCancelButtons } from '../SaveAndCancelButtons';

expect.extend(toHaveNoViolations);

jest.mock('react-intl', () => ({
  FormattedMessage: ({
    id,
    defaultMessage,
  }: {
    id: string;
    defaultMessage: string;
  }) => <span>{defaultMessage || id}</span>,
}));

jest.mock('../styles/SaveAndCancelButtons.module.scss', () => ({
  footer: 'footer-class',
  cancelButton: 'cancelButton-class',
  saveButton: 'saveButton-class',
}));

describe('SaveAndCancelButtons', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  const defaultProps = {
    onSave: mockOnSave,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Paths', () => {
    it('should render correctly with required props', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should call onSave when save button is clicked', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should render with default button text', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render with custom primaryButtonText', () => {
      const customButtonText = <span>Submit</span>;

      render(
        <SaveAndCancelButtons
          {...defaultProps}
          primaryButtonText={customButtonText}
        />,
      );

      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render save button as disabled when isSaveDisabled is true', () => {
      render(<SaveAndCancelButtons {...defaultProps} isSaveDisabled />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should render save button as enabled when isSaveDisabled is false', () => {
      render(<SaveAndCancelButtons {...defaultProps} isSaveDisabled={false} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should render save button as enabled by default', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should have correct button kinds', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const saveButton = screen.getByRole('button', { name: /save/i });

      expect(cancelButton).toHaveClass('cancelButton-class');
      expect(saveButton).toHaveClass('saveButton-class');
    });

    it('should render buttons in correct order (cancel, then save)', () => {
      const { container } = render(<SaveAndCancelButtons {...defaultProps} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('Cancel');
      expect(buttons[1]).toHaveTextContent('Save');
    });

    it('should match snapshot', () => {
      const { container } = render(<SaveAndCancelButtons {...defaultProps} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<SaveAndCancelButtons {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not call onSave when save button is disabled', () => {
      render(<SaveAndCancelButtons {...defaultProps} isSaveDisabled />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should have proper button roles', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should be keyboard accessible', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      saveButton.focus();

      expect(saveButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple save button clicks', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple cancel button clicks', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    it('should render with custom React node as primaryButtonText', () => {
      const customText = (
        <div>
          <span>Custom</span>
          <span>Save</span>
        </div>
      );

      render(
        <SaveAndCancelButtons
          {...defaultProps}
          primaryButtonText={customText}
        />,
      );

      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render with string as primaryButtonText', () => {
      render(
        <SaveAndCancelButtons {...defaultProps} primaryButtonText="Confirm" />,
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should handle rapid consecutive clicks', () => {
      render(<SaveAndCancelButtons {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      const cancelButton = screen.getByText('Cancel');

      fireEvent.click(saveButton);
      fireEvent.click(cancelButton);
      fireEvent.click(saveButton);
      fireEvent.click(cancelButton);

      expect(mockOnSave).toHaveBeenCalledTimes(2);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it('should handle toggling isSaveDisabled', () => {
      const { rerender } = render(
        <SaveAndCancelButtons {...defaultProps} isSaveDisabled={false} />,
      );

      let saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();

      rerender(<SaveAndCancelButtons {...defaultProps} isSaveDisabled />);

      saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();

      rerender(
        <SaveAndCancelButtons {...defaultProps} isSaveDisabled={false} />,
      );

      saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });
  });
});
