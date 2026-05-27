import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppTile } from '../AppTile';
import { defaultProps } from './__mocks__/AppTileMocks';

expect.extend(toHaveNoViolations);

describe('AppTile', () => {
  it('renders tile with label, icon, and translated text', () => {
    render(<AppTile {...defaultProps} />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'registration' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Registration')).toBeInTheDocument();
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

  it('has no accessibility violations', async () => {
    const { container } = render(<AppTile {...defaultProps} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
