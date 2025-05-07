import React from 'react';
import { render, screen } from '@testing-library/react';
import BahmniIcon from '../BahmniIcon';
import '@testing-library/jest-dom';
import { ICON_PADDING, ICON_SIZE } from '@/constants/icon';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock FontAwesomeIcon and pass props to the rendered element
jest.mock('@fortawesome/react-fontawesome', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FontAwesomeIcon: ({ icon, size, color, ...props }: any) => (
    <svg
      data-testid={props['data-testid']}
      data-icon={icon[1]}
      data-prefix={icon[0]}
      data-size={size}
      data-color={color}
      {...props}
    />
  ),
}));

describe('Icon Component', () => {
  it('renders solid icon', () => {
    render(<BahmniIcon name="fa-home" id="test-icon" />);
    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-icon', 'fa-home');
    expect(icon).toHaveAttribute('data-prefix', 'fas');
  });

  it('renders with all props', () => {
    render(
      <BahmniIcon
        name="fa-user"
        size={ICON_SIZE.X2}
        color="blue"
        id="full-icon"
        ariaLabel="user icon"
        padding={ICON_PADDING.MEDIUM}
      />,
    );
    const icon = screen.getByTestId('full-icon');
    const container = screen.getByLabelText('user icon');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-icon', 'fa-user');
    expect(icon).toHaveAttribute('data-prefix', 'fas');
    expect(icon).toHaveAttribute('data-size', '2x');
    expect(icon).toHaveAttribute('data-color', 'blue');
    expect(container).toHaveStyle('padding: 1rem');
  });

  it('accepts alternative icon syntax (fas-*)', () => {
    render(<BahmniIcon name="fas-star" id="alt-icon" />);
    const icon = screen.getByTestId('alt-icon');
    expect(icon).toHaveAttribute('data-icon', 'fas-star');
    expect(icon).toHaveAttribute('data-prefix', 'fas');
  });

  it('applies default padding', () => {
    render(<BahmniIcon name="fa-home" id="default-padding" />);
    const container = screen.getByLabelText('default-padding');
    expect(container).toHaveStyle('padding: 0.125rem');
  });

  it('applies custom padding', () => {
    render(
      <BahmniIcon
        name="fa-home"
        id="custom-padding"
        padding={ICON_PADDING.SMALL}
      />,
    );
    const container = screen.getByLabelText('custom-padding');
    expect(container).toHaveStyle('padding: 0.5rem');
  });

  it('applies size class', () => {
    render(<BahmniIcon name="fas-home" id="sized-icon" size={ICON_SIZE.LG} />);
    const icon = screen.getByTestId('sized-icon');
    expect(icon).toHaveAttribute('data-size', 'lg');
  });

  it('applies color', () => {
    render(<BahmniIcon name="fa-home" id="colored-icon" color="#FF0000" />);
    const icon = screen.getByTestId('colored-icon');
    expect(icon).toHaveAttribute('data-color', '#FF0000');
  });

  it('renders with empty name', () => {
    const icon = render(<BahmniIcon name="" id="empty-icon" />);
    expect(icon.container).toBeEmptyDOMElement();
  });

  // Test 9: Renders with malformed name (current behavior)
  it('renders with malformed name', () => {
    const icon = render(
      <BahmniIcon name="invalid-name-format" id="invalid-icon" />,
    );
    expect(icon.container).toBeEmptyDOMElement();
  });

  describe('Accessibility', () => {
    test('accessible forms pass axe', async () => {
      const { container } = render(
        <BahmniIcon name="invalid-name-format" id="invalid-icon" />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
