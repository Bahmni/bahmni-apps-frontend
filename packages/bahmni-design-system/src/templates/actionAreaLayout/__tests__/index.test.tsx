import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ActionAreaLayout from '../index';

expect.extend(toHaveNoViolations);

// jsdom has no real layout engine, so react-resizable-panels can't compute
// real pixel/percentage sizes for its panels, making it impossible to
// observe mainDisplayPanelRef.current.resize() calls via rendered styles.
// Instead, override usePanelRef so the ref it exposes always reads back our
// own stub handle (silently ignoring whatever the real Panel tries to
// publish into it). Panel/Group/Separator still render exactly as before -
// this only affects what ActionAreaLayout's effect calls resize() on.
const mockResize = jest.fn();

jest.mock('react-resizable-panels', () => {
  const actual = jest.requireActual('react-resizable-panels');
  return {
    ...actual,
    usePanelRef: () => ({
      get current() {
        return { resize: mockResize };
      },
      set current(_value: unknown) {},
    }),
  };
});

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

  test('applies collapse class when action area is visible and hasSideNav is true', () => {
    const { container } = render(
      <ActionAreaLayout {...defaultProps} isActionAreaVisible hasSideNav />,
    );

    const mainDisplay = container.querySelector('#main-display-area');
    expect(mainDisplay?.className).toMatch(/collapse/);
  });

  test('does not apply collapse class when action area is visible and hasSideNav is false', () => {
    const { container } = render(
      <ActionAreaLayout
        {...defaultProps}
        isActionAreaVisible
        hasSideNav={false}
      />,
    );

    const mainDisplay = container.querySelector('#main-display-area');
    // Using word boundary to match 'collapse' but not 'collapsedModal'
    expect(mainDisplay?.className).not.toMatch(/\bcollapse\b/);
  });

  test('does not apply collapse class when action area is not visible', () => {
    const { container } = render(
      <ActionAreaLayout
        {...defaultProps}
        isActionAreaVisible={false}
        hasSideNav={false}
      />,
    );

    const mainDisplay = container.querySelector('#main-display-area');
    expect(mainDisplay?.className).not.toMatch(/collapse/);
  });

  describe('isActionAreaExpanded', () => {
    test('does not apply expanded class to panel group by default', () => {
      const { container } = render(
        <ActionAreaLayout {...defaultProps} isActionAreaVisible />,
      );

      const mainDisplayPanel = container.querySelector('#main-display-panel');
      expect(mainDisplayPanel?.parentElement?.className).not.toMatch(
        /expanded/,
      );
    });

    test('applies expanded class to panel group when isActionAreaExpanded is true', () => {
      const { container } = render(
        <ActionAreaLayout
          {...defaultProps}
          isActionAreaVisible
          isActionAreaExpanded
        />,
      );

      const mainDisplayPanel = container.querySelector('#main-display-panel');
      expect(mainDisplayPanel?.parentElement?.className).toMatch(/expanded/);
    });

    test('still renders both panels when expanded', () => {
      const { container } = render(
        <ActionAreaLayout
          {...defaultProps}
          isActionAreaVisible
          isActionAreaExpanded
        />,
      );

      const panels = container.querySelectorAll('[data-panel]');
      expect(panels).toHaveLength(2);
    });

    test('renders main display and action area panels with explicit ids', () => {
      const { container } = render(
        <ActionAreaLayout {...defaultProps} isActionAreaVisible />,
      );

      expect(
        container.querySelector('#main-display-panel'),
      ).toBeInTheDocument();
      expect(container.querySelector('#action-area-panel')).toBeInTheDocument();
    });

    test('hides the separator when isActionAreaExpanded is true', () => {
      render(
        <ActionAreaLayout
          {...defaultProps}
          isActionAreaVisible
          isActionAreaExpanded
        />,
      );

      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });

    test('shows the separator when isActionAreaExpanded is false', () => {
      render(
        <ActionAreaLayout
          {...defaultProps}
          isActionAreaVisible
          isActionAreaExpanded={false}
        />,
      );

      expect(screen.getByRole('separator')).toBeInTheDocument();
    });
  });

  describe('panel resize behavior', () => {
    beforeEach(() => {
      mockResize.mockClear();
    });

    test('calls resize(0) on the main display panel when toggled to expanded, and resize(40) when toggled back', async () => {
      // resize() is deferred to requestAnimationFrame in the component (to
      // avoid a race with react-resizable-panels registering the panel), so
      // assertions have to wait for that frame to flush.
      const { rerender } = render(
        <ActionAreaLayout
          {...defaultProps}
          isActionAreaVisible
          isActionAreaExpanded={false}
        />,
      );

      rerender(
        <ActionAreaLayout
          {...defaultProps}
          isActionAreaVisible
          isActionAreaExpanded
        />,
      );
      await waitFor(() => expect(mockResize).toHaveBeenCalledWith(0));

      rerender(
        <ActionAreaLayout
          {...defaultProps}
          isActionAreaVisible
          isActionAreaExpanded={false}
        />,
      );
      await waitFor(() => expect(mockResize).toHaveBeenLastCalledWith(40));
    });
  });
});
