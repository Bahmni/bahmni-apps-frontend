import { act, render, screen } from '@testing-library/react';
import { HomeApp } from '../App';

const mockInitAppI18n = jest.fn();

jest.mock('@bahmni/services', () => ({
  initAppI18n: (...args: unknown[]) => mockInitAppI18n(...args),
}));

jest.mock('@bahmni/design-system', () => ({
  Loading: () => <div data-testid="loading" />,
  initFontAwesome: jest.fn(),
}));

jest.mock('../components/HomePage', () => ({
  HomePage: () => <div data-testid="home-page" />,
}));

describe('HomeApp', () => {
  beforeEach(() => {
    mockInitAppI18n.mockResolvedValue(undefined);
  });

  it('shows <Loading /> before initialization completes', () => {
    mockInitAppI18n.mockReturnValue(new Promise(() => {}));
    render(<HomeApp />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders home page content after initialization resolves', async () => {
    render(<HomeApp />);
    await act(async () => {});
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders home page content even when initAppI18n rejects', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockInitAppI18n.mockRejectedValue(new Error('i18n failed'));
    render(<HomeApp />);
    await act(async () => {});
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});
