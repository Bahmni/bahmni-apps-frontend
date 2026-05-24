import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CommandPalette } from '../CommandPalette';
import type { SearchAnnotation } from '../CommandPaletteContext';

import { useCommandPalette } from '../CommandPaletteContext';
import { useCommandPaletteSearch } from '../useCommandPaletteSearch';

jest.mock('@bahmni/services', () => ({
  formatUrl: jest.fn((template: string, params: Record<string, string>) =>
    template.replace(
      /\{\{(\w+)\}\}/g,
      (_: string, key: string) => params[key] ?? '',
    ),
  ),
}));

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('cmdk', () => ({
  Command: Object.assign(
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="cmdk-root">{children}</div>
    ),
    {
      Input: ({
        onValueChange,
        value,
        placeholder,
        onKeyDown,
        ...rest
      }: {
        onValueChange?: (v: string) => void;
        value?: string;
        placeholder?: string;
        onKeyDown?: React.KeyboardEventHandler;
        [key: string]: unknown;
      }) => (
        <input
          data-testid="cmdk-input"
          placeholder={placeholder}
          onChange={(e) => onValueChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          value={value ?? ''}
          {...(rest as object)}
        />
      ),
      List: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="cmdk-list">{children}</div>
      ),
      Empty: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="cmdk-empty">{children}</div>
      ),
      Group: ({
        children,
        heading,
      }: {
        children: React.ReactNode;
        heading?: string;
      }) => (
        <div data-testid="cmdk-group" data-heading={heading}>
          {children}
        </div>
      ),
      Item: ({
        children,
        onSelect,
        value,
      }: {
        children: React.ReactNode;
        onSelect?: () => void;
        value?: string;
      }) => (
        <div data-testid="cmdk-item" data-value={value} onClick={onSelect}>
          {children}
        </div>
      ),
    },
  ),
}));

jest.mock('../CommandPaletteContext', () => ({
  ...jest.requireActual('../CommandPaletteContext'),
  useCommandPalette: jest.fn(),
}));

jest.mock('../useCommandPaletteSearch', () => ({
  useCommandPaletteSearch: jest.fn(),
}));

const mockUseCommandPalette = useCommandPalette as jest.Mock;
const mockUseCommandPaletteSearch = useCommandPaletteSearch as jest.Mock;

const phoneAnnotation: SearchAnnotation = {
  prefix: '@phone',
  label: 'Phone',
  searchType: 'patientAttribute',
  fieldType: 'person',
  fieldsToSearch: ['phoneNumber'],
};

const mockNavItem = {
  id: 'org.bahmni.commandpalette.nav.registration',
  label: 'Go to Registration',
  path: '/bahmni-new/registration/search',
  newTab: false,
};

const mockPatient = {
  uuid: 'patient-uuid-1',
  givenName: 'John',
  middleName: '',
  familyName: 'Doe',
  identifier: 'P001',
  age: '30',
  gender: 'M',
};

const defaultContextValue = {
  isOpen: false,
  setOpen: jest.fn(),
  toggle: jest.fn(),
  navItems: [mockNavItem],
  patientActions: [],
  patientFieldsConfig: {
    primaryFields: ['name', 'identifier'] as const,
    additionalFields: ['age', 'gender'] as const,
  },
  searchAnnotations: [phoneAnnotation],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCommandPalette.mockReturnValue(defaultContextValue);
  mockUseCommandPaletteSearch.mockReturnValue({
    patients: [],
    loading: false,
    error: null,
  });
  Object.defineProperty(window, 'location', {
    value: { href: '', pathname: '/' },
    writable: true,
  });
});

describe('CommandPalette', () => {
  it('renders nothing when isOpen is false', () => {
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: false,
    });

    const { container } = render(<CommandPalette />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the palette dialog when isOpen is true', () => {
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
    });

    render(<CommandPalette />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows nav items in the Navigation group', () => {
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
    });

    render(<CommandPalette />);

    const navGroup = screen.getByTestId('cmdk-group');
    expect(navGroup).toHaveAttribute('data-heading', 'Navigation');
    expect(screen.getByText('Go to Registration')).toBeInTheDocument();
  });

  it('shows the annotation filter chip when selectedAnnotation is set via typing prefix', async () => {
    const user = userEvent.setup();
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
    });

    render(<CommandPalette />);

    const input = screen.getByTestId('cmdk-input');
    await user.type(input, '@phone ');

    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('shows "Search failed. Please try again." when search returns an error', async () => {
    const user = userEvent.setup();
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
      navItems: [],
      searchAnnotations: [],
    });
    mockUseCommandPaletteSearch.mockReturnValue({
      patients: [],
      loading: false,
      error: 'Network error',
    });

    render(<CommandPalette />);

    const input = screen.getByTestId('cmdk-input');
    await user.type(input, 'jo');

    expect(
      screen.getByText('Search failed. Please try again.'),
    ).toBeInTheDocument();
  });

  it('navigates via window.location.href when a nav item with internal path is selected', async () => {
    const user = userEvent.setup();
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
    });

    render(<CommandPalette />);

    const navItem = screen.getByText('Go to Registration');
    await user.click(navItem.closest('[data-testid="cmdk-item"]')!);

    expect(window.location.href).toBe('/bahmni-new/registration/search');
  });
});
