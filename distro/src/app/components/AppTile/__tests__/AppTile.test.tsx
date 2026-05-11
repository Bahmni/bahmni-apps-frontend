import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppTile } from '../AppTile';
import { defaultProps } from './__mocks__/AppTileMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/design-system', () => ({
  ClickableTile: ({ children, href, className, testId, ...props }: any) => (
    <a href={href} className={className} data-testid={testId} {...props}>
      {children}
    </a>
  ),
  Icon: ({ name, id, ...props }: any) => (
    <div data-testid={`icon-${id}`} {...props}>
      {name}
    </div>
  ),
  ICON_SIZE: { LG: 'lg', X2: '2x' },
  ArrowRight: ({ 'data-testid': dataTestId, ...props }: any) => (
    <svg data-testid={dataTestId} {...props} />
  ),
}));

describe('AppTile', () => {
  it('renders tile with label, icon, and translated text', () => {
    render(<AppTile {...defaultProps} />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByTestId('icon-registration')).toBeInTheDocument();
    expect(screen.getByTestId('icon-registration')).toHaveTextContent(
      'registration',
    );
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
