import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ActionAreaLayout from '../index';

expect.extend(toHaveNoViolations);

describe('ActionAreaLayout', () => {
  const defaultProps = {
    headerWSideNav: <div data-testid="mock-header">Mock Header</div>,
    mainDisplay: <div data-testid="mock-main-display">Mock Main Display</div>,
    actionArea: <div data-testid="mock-action-area">Mock Action Area</div>,
    isActionAreaVisible: false,
  };

  test('renders header and main display', () => {
    render(<ActionAreaLayout {...defaultProps} />);

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-main-display')).toBeInTheDocument();
  });

  test('renders complex nested components', () => {
    const complexProps = {
      ...defaultProps,
      mainDisplay: (
        <div data-testid="complex-content">
          <div>
            <div data-testid="deep-nested">Nested Content</div>
          </div>
        </div>
      ),
    };

    render(<ActionAreaLayout {...complexProps} />);

    expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    expect(screen.getByTestId('deep-nested')).toBeInTheDocument();
  });

  test('displays action area when isActionAreaVisible is true', () => {
    render(<ActionAreaLayout {...defaultProps} isActionAreaVisible />);

    expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
  });

  test('does not display action area when isActionAreaVisible is false', () => {
    render(<ActionAreaLayout {...defaultProps} isActionAreaVisible={false} />);

    expect(screen.queryByTestId('mock-action-area')).not.toBeInTheDocument();
  });

  test('renders separator when action area is visible', () => {
    render(<ActionAreaLayout {...defaultProps} isActionAreaVisible />);

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  test('does not render separator when action area is hidden', () => {
    render(<ActionAreaLayout {...defaultProps} />);

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  test('renders two panels when action area is visible', () => {
    const { container } = render(
      <ActionAreaLayout {...defaultProps} isActionAreaVisible />,
    );

    const panels = container.querySelectorAll('[data-panel]');
    expect(panels).toHaveLength(2);
  });

  test('renders one panel when action area is hidden', () => {
    const { container } = render(<ActionAreaLayout {...defaultProps} />);

    const panels = container.querySelectorAll('[data-panel]');
    expect(panels).toHaveLength(1);
  });

  test('has no accessibility violations', async () => {
    const { container } = render(<ActionAreaLayout {...defaultProps} />);

    const results = await axe(container, {
      rules: {
        'aria-allowed-attr': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
