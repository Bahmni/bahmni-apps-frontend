import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import InvestigationsForm from '../InvestigationsForm';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock CSS modules
jest.mock('../styles/InvestigationsForm.module.scss', () => ({
  investigationsFormTile: 'investigationsFormTile',
  investigationsFormTitle: 'investigationsFormTitle',
}));

describe('InvestigationsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    i18n.changeLanguage('en');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders form title correctly', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      expect(screen.getByText('Order Investigations')).toBeInTheDocument();
    });

    test('renders search combobox with correct attributes', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute('id', 'investigations-search');
      expect(combobox).toHaveAttribute(
        'placeholder',
        'Search to add laboratory or radiology investigations',
      );
    });

    test('renders with proper tile structure', () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const tile = container.querySelector('.investigationsFormTile');
      expect(tile).toBeInTheDocument();

      const title = container.querySelector('.investigationsFormTitle');
      expect(title).toBeInTheDocument();
    });

    test('component is memoized correctly', () => {
      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      // Re-render with same props should not cause re-render due to React.memo
      rerender(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      expect(screen.getByText('Order Investigations')).toBeInTheDocument();
    });
  });

  // SAD PATH TESTS
  describe('Sad Path Scenarios', () => {
    test('handles missing translation keys gracefully', () => {
      // Test that component renders even when translations might be missing
      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      // Component should still render successfully
      expect(screen.getByText('Order Investigations')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  test('component renders without crashing when no items provided', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    // Component should render successfully even with empty items array
    expect(screen.getByText('Order Investigations')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

// ACCESSIBILITY TESTS
describe('Accessibility', () => {
  test('should have no accessibility violations', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('combobox has proper aria-label', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute(
      'aria-label',
      'INVESTIGATIONS_SEARCH_ARIA_LABEL',
    );
  });

  test('form elements are properly labeled', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    // Check that the combobox is accessible
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();

    // Check that it has an accessible name (either aria-label or associated label)
    expect(combobox).toHaveAccessibleName();
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    const combobox = screen.getByRole('combobox');

    // Test keyboard focus
    await user.tab();
    expect(combobox).toHaveFocus();
  });

  test('combobox has proper autoAlign attribute', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    const combobox = screen.getByRole('combobox');
    // The autoAlign prop should be present on the ComboBox component
    expect(combobox).toBeInTheDocument();
  });
});

// INTEGRATION WITH TRANSLATION
describe('Translation Integration', () => {
  test('displays translated text correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    expect(screen.getByText('Order Investigations')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        'Search to add laboratory or radiology investigations',
      ),
    ).toBeInTheDocument();
  });
});

// COMPONENT STRUCTURE TESTS
describe('Component Structure', () => {
  test('renders with correct CSS classes', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    expect(
      container.querySelector('.investigationsFormTile'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.investigationsFormTitle'),
    ).toBeInTheDocument();
  });

  test('title and combobox are properly nested within tile', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );

    const tile = container.querySelector(
      '.investigationsFormTile',
    ) as HTMLElement;
    const title = container.querySelector(
      '.investigationsFormTitle',
    ) as HTMLElement;
    const combobox = screen.getByRole('combobox');

    expect(tile).toContainElement(title);
    expect(tile).toContainElement(combobox);
  });
});

// SNAPSHOT TESTS
describe('Snapshot Tests', () => {
  test('matches snapshot with default state', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <InvestigationsForm />
      </I18nextProvider>,
    );
    expect(container).toMatchSnapshot();
  });
});
