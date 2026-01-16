import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import ActionArea from '../ActionArea';

expect.extend(toHaveNoViolations);
describe('ActionArea', () => {
  const defaultProps = {
    title: 'Test Title',
    primaryButtonText: 'Done',
    onPrimaryButtonClick: jest.fn(),
    secondaryButtonText: 'Cancel',
    onSecondaryButtonClick: jest.fn(),
    content: <div data-testid="test-content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with required props', () => {
    render(<ActionArea {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders with all props', () => {
    render(
      <ActionArea
        {...defaultProps}
        secondaryButtonText="Save Draft"
        onSecondaryButtonClick={jest.fn()}
        tertiaryButtonText="Discard"
        onTertiaryButtonClick={jest.fn()}
        className="custom-class"
        ariaLabel="Custom Action Area"
      />,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    expect(screen.getByText('Discard')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();

    // Check for custom class and aria label
    const actionArea = screen.getByRole('region', {
      name: 'Custom Action Area',
    });
    expect(actionArea).toHaveClass('custom-class');
  });

  it('calls the primary button click handler when clicked', () => {
    render(<ActionArea {...defaultProps} />);

    fireEvent.click(screen.getByText('Done'));
    expect(defaultProps.onPrimaryButtonClick).toHaveBeenCalledTimes(1);
  });

  it('calls the secondary button click handler when clicked', () => {
    const onSecondaryButtonClick = jest.fn();
    render(
      <ActionArea
        {...defaultProps}
        secondaryButtonText="Save Draft"
        onSecondaryButtonClick={onSecondaryButtonClick}
      />,
    );

    fireEvent.click(screen.getByText('Save Draft'));
    expect(onSecondaryButtonClick).toHaveBeenCalledTimes(1);
  });

  it('calls the tertiary button click handler when clicked', () => {
    const onTertiaryButtonClick = jest.fn();
    render(
      <ActionArea
        {...defaultProps}
        tertiaryButtonText="Discard"
        onTertiaryButtonClick={onTertiaryButtonClick}
      />,
    );

    fireEvent.click(screen.getByText('Discard'));
    expect(onTertiaryButtonClick).toHaveBeenCalledTimes(1);
  });

  describe('Button Disabled States', () => {
    it('disables primary button when isPrimaryButtonDisabled is true', () => {
      render(<ActionArea {...defaultProps} isPrimaryButtonDisabled />);

      const primaryButton = screen.getByText('Done');
      expect(primaryButton).toBeDisabled();
    });

    it('disables secondary button when isSecondaryButtonDisabled is true', () => {
      render(<ActionArea {...defaultProps} isSecondaryButtonDisabled />);

      const secondaryButton = screen.getByText('Cancel');
      expect(secondaryButton).toBeDisabled();
    });

    it('disables both primary and secondary buttons when both disabled props are true', () => {
      render(
        <ActionArea
          {...defaultProps}
          isPrimaryButtonDisabled
          isSecondaryButtonDisabled
        />,
      );

      const primaryButton = screen.getByText('Done');
      const secondaryButton = screen.getByText('Cancel');

      expect(primaryButton).toBeDisabled();
      expect(secondaryButton).toBeDisabled();
    });

    it('does not call primary button click handler when button is disabled', () => {
      const onPrimaryButtonClick = jest.fn();
      render(
        <ActionArea
          {...defaultProps}
          onPrimaryButtonClick={onPrimaryButtonClick}
          isPrimaryButtonDisabled
        />,
      );

      const primaryButton = screen.getByText('Done');
      fireEvent.click(primaryButton);

      expect(onPrimaryButtonClick).not.toHaveBeenCalled();
    });

    it('does not call secondary button click handler when button is disabled', () => {
      const onSecondaryButtonClick = jest.fn();
      render(
        <ActionArea
          {...defaultProps}
          onSecondaryButtonClick={onSecondaryButtonClick}
          isSecondaryButtonDisabled
        />,
      );

      const secondaryButton = screen.getByText('Cancel');
      fireEvent.click(secondaryButton);

      expect(onSecondaryButtonClick).not.toHaveBeenCalled();
    });

    it('disables tertiary button when isTertiaryButtonDisabled is true', () => {
      render(
        <ActionArea
          {...defaultProps}
          tertiaryButtonText="Discard"
          onTertiaryButtonClick={jest.fn()}
          isTertiaryButtonDisabled
        />,
      );

      const tertiaryButton = screen.getByText('Discard');
      expect(tertiaryButton).toBeDisabled();
    });

    it('disables all buttons when all disabled props are true', () => {
      render(
        <ActionArea
          {...defaultProps}
          tertiaryButtonText="Discard"
          onTertiaryButtonClick={jest.fn()}
          isPrimaryButtonDisabled
          isSecondaryButtonDisabled
          isTertiaryButtonDisabled
        />,
      );

      const primaryButton = screen.getByText('Done');
      const secondaryButton = screen.getByText('Cancel');
      const tertiaryButton = screen.getByText('Discard');

      expect(primaryButton).toBeDisabled();
      expect(secondaryButton).toBeDisabled();
      expect(tertiaryButton).toBeDisabled();
    });

    it('does not call tertiary button click handler when button is disabled', () => {
      const onTertiaryButtonClick = jest.fn();
      render(
        <ActionArea
          {...defaultProps}
          tertiaryButtonText="Discard"
          onTertiaryButtonClick={onTertiaryButtonClick}
          isTertiaryButtonDisabled
        />,
      );

      const tertiaryButton = screen.getByText('Discard');
      fireEvent.click(tertiaryButton);

      expect(onTertiaryButtonClick).not.toHaveBeenCalled();
    });

    it('tertiary button remains unaffected by primary and secondary disabled states', () => {
      const onTertiaryButtonClick = jest.fn();
      render(
        <ActionArea
          {...defaultProps}
          tertiaryButtonText="Discard"
          onTertiaryButtonClick={onTertiaryButtonClick}
          isPrimaryButtonDisabled
          isSecondaryButtonDisabled
        />,
      );

      const tertiaryButton = screen.getByText('Discard');
      expect(tertiaryButton).toBeEnabled();

      fireEvent.click(tertiaryButton);
      expect(onTertiaryButtonClick).toHaveBeenCalledTimes(1);
    });

    it('maintains proper aria attributes when buttons are disabled', () => {
      render(
        <ActionArea
          {...defaultProps}
          isPrimaryButtonDisabled
          isSecondaryButtonDisabled
        />,
      );

      const primaryButton = screen.getByText('Done');
      const secondaryButton = screen.getByText('Cancel');

      expect(primaryButton).toBeDisabled();
      expect(secondaryButton).toBeDisabled();
      expect(primaryButton).toHaveAttribute('aria-label', 'Done');
      expect(secondaryButton).toHaveAttribute('aria-label', 'Cancel');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ActionArea {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with disabled buttons', async () => {
      const { container } = render(
        <ActionArea
          {...defaultProps}
          isPrimaryButtonDisabled
          isSecondaryButtonDisabled
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Hidden State', () => {
    it('applies hidden class and aria-hidden when hidden prop is true', () => {
      const { container } = render(<ActionArea {...defaultProps} hidden />);

      // When aria-hidden="true", the element is not in the accessibility tree,
      // so we need to query it directly from the container
      const actionArea = container.querySelector('[aria-label="Action Area"]');

      expect(actionArea).toHaveClass('hidden');
      expect(actionArea).toHaveAttribute('aria-hidden', 'true');
    });

    it('does not apply hidden class when hidden prop is false', () => {
      render(<ActionArea {...defaultProps} hidden={false} />);

      const actionArea = screen.getByRole('region', {
        name: 'Action Area',
      });

      expect(actionArea).not.toHaveClass('hidden');
      expect(actionArea).toHaveAttribute('aria-hidden', 'false');
    });

    it('is visible by default when hidden prop is not provided', () => {
      render(<ActionArea {...defaultProps} />);

      const actionArea = screen.getByRole('region', {
        name: 'Action Area',
      });

      expect(actionArea).not.toHaveClass('hidden');
      expect(actionArea).toHaveAttribute('aria-hidden', 'false');
    });
  });
});
