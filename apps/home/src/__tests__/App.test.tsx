import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { HomeApp } from '../App';

const mockInitAppI18n = jest.fn();

jest.mock('@bahmni/services', () => ({
  initAppI18n: (...args: unknown[]) => mockInitAppI18n(...args),
}));

jest.mock('@bahmni/design-system', () => ({
  Loading: () => <div data-testid="loading" />,
  initFontAwesome: jest.fn(),
}));

jest.mock('../components/HomePageGrid', () => ({
  HomePageGrid: () => <div data-testid="home-page-grid" />,
}));

jest.mock('../components/HomePageHeader', () => ({
  HomePageHeader: () => <div data-testid="home-page-header" />,
}));

jest.mock('../context', () => ({
  LocationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@bahmni/widgets', () => ({
  ActivePractitionerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  NotificationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  NotificationServiceComponent: () => null,
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
    expect(screen.getByTestId('home-page-header')).toBeInTheDocument();
    expect(screen.getByTestId('home-page-grid')).toBeInTheDocument();
  });

  it('renders home page content even when initAppI18n rejects', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockInitAppI18n.mockRejectedValue(new Error('i18n failed'));

    render(<HomeApp />);

    await act(async () => {});

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page-header')).toBeInTheDocument();
  });
});
