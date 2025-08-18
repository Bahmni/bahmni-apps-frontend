import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TextAreaWClose } from '../TextAreaWClose';

expect.extend(toHaveNoViolations);

describe('TextAreaWClose', () => {
  const defaultProps = {
    id: 'test-textarea',
    labelText: 'Test Label',
    onChange: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with required props', () => {
      render(<TextAreaWClose {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with custom id and test id', () => {
      render(
        <TextAreaWClose
          {...defaultProps}
          data-testid="custom-textarea"
          closeButtonTestId="custom-close-btn"
        />,
      );

      expect(screen.getByTestId('custom-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('custom-close-btn')).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      const placeholder = 'Enter your text here';
      render(<TextAreaWClose {...defaultProps} placeholder={placeholder} />);

      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      const value = 'Initial text';
      render(<TextAreaWClose {...defaultProps} value={value} />);

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('should always hide label visually', () => {
      render(<TextAreaWClose {...defaultProps} />);

      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('cds--visually-hidden');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when text is entered', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<TextAreaWClose {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello World');

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<TextAreaWClose {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation for close button', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<TextAreaWClose {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button');
      await waitFor(() => {
        closeButton.focus();
        user.keyboard('{Enter}');
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('States', () => {
    it('should render disabled state', () => {
      render(<TextAreaWClose {...defaultProps} disabled />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should render invalid state with error text', () => {
      const invalidText = 'This field is required';
      render(
        <TextAreaWClose {...defaultProps} invalid invalidText={invalidText} />,
      );

      expect(screen.getByText(invalidText)).toBeInTheDocument();
    });

    it('should not render error text when invalid is false', () => {
      const invalidText = 'This field is required';
      render(
        <TextAreaWClose
          {...defaultProps}
          invalid={false}
          invalidText={invalidText}
        />,
      );

      expect(screen.queryByText(invalidText)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<TextAreaWClose {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in invalid state', async () => {
      const { container } = render(
        <TextAreaWClose
          {...defaultProps}
          invalid
          invalidText="This field is required"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in disabled state', async () => {
      const { container } = render(
        <TextAreaWClose {...defaultProps} disabled />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper aria attributes', () => {
      render(<TextAreaWClose {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      const closeButton = screen.getByRole('button');

      expect(textarea).toHaveAttribute('id', 'test-textarea');
      expect(closeButton).toHaveAttribute('aria-label');
    });

    it('should have close button with proper icon description', () => {
      render(<TextAreaWClose {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveAttribute('aria-label');
    });

    it('should associate textarea with label', () => {
      render(<TextAreaWClose {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('id', 'test-textarea');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty onChange gracefully', () => {
      const { container } = render(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <TextAreaWClose {...defaultProps} onChange={undefined as any} />,
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle empty onClose gracefully', () => {
      const { container } = render(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <TextAreaWClose {...defaultProps} onClose={undefined as any} />,
      );

      expect(container).toBeInTheDocument();
    });
  });
});
