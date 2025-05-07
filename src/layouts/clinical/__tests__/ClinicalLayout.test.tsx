import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClinicalLayout from '../ClinicalLayout';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock the CSS module
jest.mock('../styles/ClinicalLayout.module.scss', () => ({
  layout: 'layout',
  header: 'header',
  body: 'body',
  patientDetails: 'patientDetails',
  sidebar: 'sidebar',
  mainDisplay: 'mainDisplay',
}));

describe('ClinicalLayout Component', () => {
  // Mock components for each section
  const MockHeader = () => <div data-testid="mock-header">Mock Header</div>;
  const MockPatientDetails = () => (
    <div data-testid="mock-patient-details">Mock Patient Details</div>
  );
  const MockSidebar = () => <div data-testid="mock-sidebar">Mock Sidebar</div>;
  const MockMainDisplay = () => (
    <div data-testid="mock-main-display">Mock Main Display</div>
  );

  const defaultProps = {
    header: <MockHeader />,
    patientDetails: <MockPatientDetails />,
    sidebar: <MockSidebar />,
    mainDisplay: <MockMainDisplay />,
  };

  // Happy Path Tests
  describe('Happy Path', () => {
    test('renders all four sections when all props are provided', () => {
      render(
        <BrowserRouter>
          <ClinicalLayout {...defaultProps} />
        </BrowserRouter>,
      );

      // Check if all sections are rendered
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-patient-details')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-main-display')).toBeInTheDocument();
    });

    test('applies correct CSS classes to each section', () => {
      const { container } = render(
        <BrowserRouter>
          <ClinicalLayout {...defaultProps} />
        </BrowserRouter>,
      );

      // Check for layout structure classes
      expect(container.querySelector('[class*="layout"]')).toBeInTheDocument();
      expect(container.querySelector('[class*="header"]')).toBeInTheDocument();
      expect(container.querySelector('[class*="body"]')).toBeInTheDocument();
      expect(
        container.querySelector('[class*="patientDetails"]'),
      ).toBeInTheDocument();
      expect(container.querySelector('[class*="sidebar"]')).toBeInTheDocument();
      expect(
        container.querySelector('[class*="mainDisplay"]'),
      ).toBeInTheDocument();
    });
  });

  // Sad Path Tests
  describe('Sad Path', () => {
    test('renders with empty content in sections', () => {
      const emptyProps = {
        header: <div data-testid="empty-header"></div>,
        patientDetails: <div data-testid="empty-patient-details"></div>,
        sidebar: <div data-testid="empty-sidebar"></div>,
        mainDisplay: <div data-testid="empty-main-display"></div>,
      };

      render(
        <BrowserRouter>
          <ClinicalLayout {...emptyProps} />
        </BrowserRouter>,
      );

      // Check if empty sections are rendered
      expect(screen.getByTestId('empty-header')).toBeInTheDocument();
      expect(screen.getByTestId('empty-patient-details')).toBeInTheDocument();
      expect(screen.getByTestId('empty-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('empty-main-display')).toBeInTheDocument();
    });

    test('renders null components gracefully', () => {
      const nullProps = {
        ...defaultProps,
        sidebar: null,
      };

      // Should not throw an error
      expect(() => {
        render(
          <BrowserRouter>
            <ClinicalLayout {...nullProps} />
          </BrowserRouter>,
        );
      }).not.toThrow();
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    // Test with long content in mainDisplay and sidebar sections
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

      render(
        <BrowserRouter>
          <ClinicalLayout {...complexProps} />
        </BrowserRouter>,
      );

      // Check if deeply nested content renders
      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByTestId('deep-nested')).toBeInTheDocument();
      expect(screen.getByText('Nested Level 1')).toBeInTheDocument();
      expect(screen.getByText('Nested Level 2')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <BrowserRouter>
          <ClinicalLayout {...defaultProps} />
        </BrowserRouter>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
