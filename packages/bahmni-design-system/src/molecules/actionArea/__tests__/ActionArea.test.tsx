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

  describe('Expand/Collapse Toggle', () => {
    it('does not render the toggle button when onToggleExpand is not provided', () => {
      render(<ActionArea {...defaultProps} />);

      expect(
        screen.queryByTestId('action-area-expand-toggle'),
      ).not.toBeInTheDocument();
    });

    it('renders the toggle button when onToggleExpand is provided', () => {
      render(<ActionArea {...defaultProps} onToggleExpand={jest.fn()} />);

      expect(
        screen.getByTestId('action-area-expand-toggle'),
      ).toBeInTheDocument();
    });

    it('shows the expand icon and label when isExpanded is false', () => {
      render(
        <ActionArea
          {...defaultProps}
          onToggleExpand={jest.fn()}
          isExpanded={false}
          expandAriaLabel="Expand consultation pad"
          collapseAriaLabel="Collapse consultation pad"
        />,
      );

      const toggleButton = screen.getByTestId('action-area-expand-toggle');
      expect(toggleButton).toHaveAccessibleName('Expand consultation pad');
    });

    it('shows the collapse icon and label when isExpanded is true', () => {
      render(
        <ActionArea
          {...defaultProps}
          onToggleExpand={jest.fn()}
          isExpanded
          expandAriaLabel="Expand consultation pad"
          collapseAriaLabel="Collapse consultation pad"
        />,
      );

      const toggleButton = screen.getByTestId('action-area-expand-toggle');
      expect(toggleButton).toHaveAccessibleName('Collapse consultation pad');
    });

    it('calls onToggleExpand when the toggle button is clicked', () => {
      const onToggleExpand = jest.fn();
      render(<ActionArea {...defaultProps} onToggleExpand={onToggleExpand} />);

      fireEvent.click(screen.getByTestId('action-area-expand-toggle'));

      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('removes the left border when isExpanded is true', () => {
      render(<ActionArea {...defaultProps} isExpanded />);

      const actionArea = screen.getByRole('region', { name: 'Action Area' });
      expect(actionArea).toHaveClass('noBorder');
    });

    it('keeps the left border when isExpanded is false', () => {
      render(<ActionArea {...defaultProps} isExpanded={false} />);

      const actionArea = screen.getByRole('region', { name: 'Action Area' });
      expect(actionArea).not.toHaveClass('noBorder');
    });

    it('moves focus back to the toggle button after isExpanded changes, so it is not lost to the now-inert main display', () => {
      const { rerender } = render(
        <ActionArea
          {...defaultProps}
          onToggleExpand={jest.fn()}
          isExpanded={false}
        />,
      );

      const toggleButton = screen.getByTestId('action-area-expand-toggle');
      expect(toggleButton).not.toHaveFocus();

      rerender(
        <ActionArea {...defaultProps} onToggleExpand={jest.fn()} isExpanded />,
      );

      expect(toggleButton).toHaveFocus();
    });

    it('does not steal focus on initial mount', () => {
      render(
        <ActionArea {...defaultProps} onToggleExpand={jest.fn()} isExpanded />,
      );

      const toggleButton = screen.getByTestId('action-area-expand-toggle');
      expect(toggleButton).not.toHaveFocus();
    });
  });

  describe('Header Actions', () => {
    it('does not render a header actions row when neither headerActions nor onToggleExpand is provided', () => {
      render(<ActionArea {...defaultProps} />);

      expect(screen.queryByTestId('pin-icon')).not.toBeInTheDocument();
    });

    it('renders headerActions content in the header row', () => {
      render(
        <ActionArea
          {...defaultProps}
          headerActions={<span data-testid="pin-icon">Pin</span>}
        />,
      );

      expect(screen.getByTestId('pin-icon')).toBeInTheDocument();
    });

    it('renders headerActions as a sibling of the expand/collapse toggle, not inside the title', () => {
      render(
        <ActionArea
          {...defaultProps}
          headerActions={<span data-testid="pin-icon">Pin</span>}
          onToggleExpand={jest.fn()}
        />,
      );

      const title = screen.getByText('Test Title');
      const pinIcon = screen.getByTestId('pin-icon');
      const toggleButton = screen.getByTestId('action-area-expand-toggle');
      const headerActionsRow = pinIcon.parentElement;

      // The pin icon must not live inside the title element...
      expect(title).not.toContainElement(pinIcon);
      // ...and must share a common header-actions container with the toggle button instead.
      expect(headerActionsRow).toContainElement(toggleButton);
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
