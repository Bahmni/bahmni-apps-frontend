import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppTile } from '../AppTile';
import { bedsTileProps, defaultProps } from './__mocks__/AppTileMocks';

expect.extend(toHaveNoViolations);

describe('AppTile', () => {
  it('renders tile with label, icon, and translated text', () => {
    render(<AppTile {...defaultProps} />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'registration' }),
    ).toBeInTheDocument();
    expect(screen.getByText('HOME_MODULE_REGISTRATION')).toBeInTheDocument();
  });

  it('passes url as href to ClickableTile', () => {
    render(
      <AppTile
        {...defaultProps}
        url="/bahmni/registration/index.html#/patient/search"
      />,
    );

    expect(screen.getByTestId('app-tile-registration')).toHaveAttribute(
      'href',
      '/bahmni/registration/index.html#/patient/search',
    );
  });

  it('renders no icon when the config supplies a non-FontAwesome icon name', () => {
    // Legacy Bahmni config used names like `icon-bahmni-inpatient`, which the
    // design-system Icon rejects. The tile must still render its label.
    render(<AppTile {...defaultProps} icon="icon-bahmni-inpatient" />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  describe('beds tile', () => {
    afterEach(async () => {
      cleanup();
      i18n.removeResourceBundle('es', 'translation');
      await i18n.changeLanguage('en');
    });

    it('shows the label translated into the current language', async () => {
      i18n.addResourceBundle('es', 'translation', {
        MODULE_LABEL_BEDS_KEY: 'Camas',
      });
      await i18n.changeLanguage('es');

      render(<AppTile {...bedsTileProps} />);

      expect(screen.getByText('Camas')).toBeInTheDocument();
    });

    it('shows the fallback label instead of the raw key when no locale has the key', () => {
      render(<AppTile {...bedsTileProps} />);

      expect(screen.getByText('Beds')).toBeInTheDocument();
      expect(
        screen.queryByText('MODULE_LABEL_BEDS_KEY'),
      ).not.toBeInTheDocument();
    });

    it('links to the bed management OWA as a plain anchor so the browser does a full navigation', () => {
      render(<AppTile {...bedsTileProps} />);

      const tile = screen.getByRole('link', { name: 'Beds' });
      expect(tile.tagName).toBe('A');
      expect(tile).toHaveAttribute(
        'href',
        '/openmrs/owa/bedmanagement/admissionLocations.html',
      );
      // A client-side router link would call preventDefault in its onClick.
      // Record that once the event has bubbled past React, then stop jsdom
      // attempting the (unimplemented) navigation itself.
      let preventedByTile: boolean | undefined;
      const onClick = (event: MouseEvent) => {
        preventedByTile = event.defaultPrevented;
        event.preventDefault();
      };
      document.addEventListener('click', onClick);
      fireEvent.click(tile);
      document.removeEventListener('click', onClick);

      expect(preventedByTile).toBe(false);
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AppTile {...defaultProps} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
