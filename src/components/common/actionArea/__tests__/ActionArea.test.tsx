import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionArea from '../ActionArea';
import { axe, toHaveNoViolations } from 'jest-axe';

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

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ActionArea {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
