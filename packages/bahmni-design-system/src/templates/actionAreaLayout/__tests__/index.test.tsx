import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ActionAreaLayout } from '../index';

expect.extend(toHaveNoViolations);

// Mock the CSS module
jest.mock('../styles/ActionAreaLayout.module.scss', () => ({
  layout: 'layout',
  body: 'body',
  patientHeader: 'patientHeader',
  mainDisplay: 'mainDisplay',
  actionArea: 'actionArea',
  collapse: 'collapse',
  expand: 'expand',
  collapsedPatientHeader: 'collapsedPatientHeader',
  collapsedMainDisplay: 'collapsedMainDisplay',
}));

describe('ActionAreaLayout', () => {
  // Mock components for each section
  const MockHeader = () => <div data-testid="mock-header">Mock Header</div>;
  const MockPatientHeader = () => (
    <div data-testid="mock-patient-header">Mock Patient Header</div>
  );
  const MockMainDisplay = () => (
    <div data-testid="mock-main-display">Mock Main Display</div>
  );

  const defaultProps = {
    headerWSideNav: <MockHeader />,
    patientHeader: <MockPatientHeader />,
    mainDisplay: <MockMainDisplay />,
    actionArea: <div data-testid="mock-action-area">Mock Action Area</div>,
    isActionAreaVisible: false,
  };

  // Happy Path Tests
  describe('Happy Path', () => {
    test('renders all four sections when all props are provided', () => {
      render(<ActionAreaLayout {...defaultProps} />);

      // Check if all sections are rendered
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-patient-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-main-display')).toBeInTheDocument();
    });

    test('applies correct CSS classes to each section', () => {
      const { container } = render(<ActionAreaLayout {...defaultProps} />);

      // Check for layout structure classes
      expect(container.querySelector('[class*="layout"]')).toBeInTheDocument();
      expect(container.querySelector('[class*="body"]')).toBeInTheDocument();
      expect(
        container.querySelector('[class*="patientHeader"]'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('[class*="mainDisplay"]'),
      ).toBeInTheDocument();
    });
  });

  // Sad Path Tests
  describe('Sad Path', () => {
    test('renders with empty content in sections', () => {
      const emptyProps = {
        headerWSideNav: <div data-testid="empty-header" />,
        patientHeader: <div data-testid="empty-patient-header" />,
        mainDisplay: <div data-testid="empty-main-display" />,
        actionArea: <div data-testid="empty-action-area" />,
        isActionAreaVisible: false,
      };

      render(<ActionAreaLayout {...emptyProps} />);

      // Check if empty sections are rendered
      expect(screen.getByTestId('empty-header')).toBeInTheDocument();
      expect(screen.getByTestId('empty-patient-header')).toBeInTheDocument();
      expect(screen.getByTestId('empty-main-display')).toBeInTheDocument();
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    // is ignored as it is not relevant to the layout structure
    // Test with long content in mainDisplay and sidebar sections
    // can be done in browser-based E2E tests. As when using @testing-library/react and jest with CSS Modules: the actual CSS styles (like overflow-y: auto) are not applied or rendered in the JSDOM environment during tests. The style classes (className) are present, but the browser-like CSS rendering engine that applies computed styles is not.
    test('renders complex nested components', () => {
      const complexProps = {
        ...defaultProps,
        mainDisplay: (
          <div data-testid="complex-content">
            <div>Nested Level 1</div>
            <div>
              <div>Nested Level 2</div>
              <div>
                <div data-testid="deep-nested">Nested Level 3</div>
              </div>
            </div>
          </div>
        ),
      };

      render(<ActionAreaLayout {...complexProps} />);

      // Check if deeply nested content renders
      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByTestId('deep-nested')).toBeInTheDocument();
      expect(screen.getByText('Nested Level 1')).toBeInTheDocument();
      expect(screen.getByText('Nested Level 2')).toBeInTheDocument();
    });
  });

  // Conditional Rendering Tests
  describe('Conditional Rendering', () => {
    test('displays action area when isActionAreaVisible is true', () => {
      const visibleActionAreaProps = {
        ...defaultProps,
        isActionAreaVisible: true,
      };

      render(<ActionAreaLayout {...visibleActionAreaProps} />);

      // Check if action area is rendered when isActionAreaVisible is true
      expect(screen.getByTestId('mock-action-area')).toBeInTheDocument();
    });

    test('does not display action area when isActionAreaVisible is false', () => {
      const hiddenActionAreaProps = {
        ...defaultProps,
        isActionAreaVisible: false,
      };

      render(<ActionAreaLayout {...hiddenActionAreaProps} />);

      // Check if action area is not rendered when isActionAreaVisible is false
      expect(screen.queryByTestId('mock-action-area')).not.toBeInTheDocument();
    });

    test('applies collapse class to body when isActionAreaVisible is true', () => {
      const visibleActionAreaProps = {
        ...defaultProps,
        isActionAreaVisible: true,
      };

      const { container } = render(
        <ActionAreaLayout {...visibleActionAreaProps} />,
      );

      // Check if body div has collapse class when isActionAreaVisible is true
      const bodyElement = container.querySelector('[class*="body"]');
      expect(bodyElement).toHaveClass('body', 'collapse');
    });

    test('does not apply collapse class to body when isActionAreaVisible is false', () => {
      const hiddenActionAreaProps = {
        ...defaultProps,
        isActionAreaVisible: false,
      };

      const { container } = render(
        <ActionAreaLayout {...hiddenActionAreaProps} />,
      );

      // Check if body div does not have collapse class when isActionAreaVisible is false
      const bodyElement = container.querySelector('[class*="body"]');
      expect(bodyElement).toHaveClass('body', 'expand');
      expect(bodyElement).not.toHaveClass('collapse');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<ActionAreaLayout {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
