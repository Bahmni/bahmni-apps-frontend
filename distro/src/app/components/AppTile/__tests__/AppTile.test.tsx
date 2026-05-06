import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppTile } from '../AppTile';
import { defaultProps } from './__mocks__/AppTileMocks';

expect.extend(toHaveNoViolations);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/design-system', () => ({
  Tile: ({ children, onClick, className, ...props }: any) => (
    <div onClick={onClick} className={className} data-testid="tile" {...props}>
      {children}
    </div>
  ),
  Icon: ({ name, id, ...props }: any) => (
    <div data-testid={`icon-${id}`} {...props}>
      {name}
    </div>
  ),
  ICON_SIZE: { LG: 'lg' },
}));

describe('AppTile', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders tile with label and icon', () => {
    render(<AppTile {...defaultProps} />);

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByTestId('icon-registration')).toBeInTheDocument();
    expect(screen.getByTestId('icon-registration')).toHaveTextContent(
      'registration',
    );
  });

  it('uses window.location.href for hash URLs on click', () => {
    render(
      <AppTile
        {...defaultProps}
        url="/bahmni/registration/index.html#/patient/search"
      />,
    );

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.click(tile);

    expect(window.location.href).toBe(
      '/bahmni/registration/index.html#/patient/search',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('uses react router navigate for relative URLs on click', () => {
    render(<AppTile {...defaultProps} url="registration" />);

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.click(tile);

    expect(mockNavigate).toHaveBeenCalledWith('registration');
  });

  it.each([
    ['/bahmni/clinical/#/default/patient/search', 'absolute path with hash'],
    ['/implementer-interface/#', 'non-bahmni absolute path'],
    ['/lab', 'absolute path without hash'],
    ['https://localhost/openmrs', 'full http URL'],
  ])('uses window.location.href for %s (%s)', (url) => {
    render(<AppTile {...defaultProps} url={url} />);

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.click(tile);

    expect(window.location.href).toBe(url);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it.each([
    ['Enter', { key: 'Enter' }],
    ['Space', { key: ' ' }],
  ])('activates on %s key', (_label, keyEvent) => {
    render(
      <AppTile
        {...defaultProps}
        url="/bahmni/registration/index.html#/patient/search"
      />,
    );

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.keyDown(tile, keyEvent);

    expect(window.location.href).toBe(
      '/bahmni/registration/index.html#/patient/search',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not activate on non-activating keys', () => {
    render(
      <AppTile
        {...defaultProps}
        url="/bahmni/registration/index.html#/patient/search"
      />,
    );

    const tile = screen.getByTestId('app-tile-registration');
    fireEvent.keyDown(tile, { key: 'Tab' });

    expect(window.location.href).toBe('');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AppTile {...defaultProps} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
