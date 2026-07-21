import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CommandPalette } from '../CommandPalette';
import type { SearchAnnotation } from '../models';

import { useCommandPalette } from '../useCommandPalette';
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

jest.mock('cmdk');

jest.mock('../useCommandPalette', () => ({
  useCommandPalette: jest.fn(),
}));

jest.mock('../useCommandPaletteSearch', () => ({
  useCommandPaletteSearch: jest.fn(),
}));

jest.mock('../aiChat', () => ({
  AiChatPanel: ({
    onBack,
    initialQuery,
  }: {
    onBack: () => void;
    initialQuery?: string;
  }) => (
    <div data-testid="ai-chat-panel-stub">
      <span data-testid="ai-chat-initial-query">{initialQuery ?? ''}</span>
      <button type="button" onClick={onBack}>
        back to search
      </button>
    </div>
  ),
}));

jest.mock('../aiChat/aiChatStore', () => ({
  useAiChatStore: jest.fn(() => false),
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

const mockT = (key: string, opts?: Record<string, string>) => {
  if (opts) {
    return Object.entries(opts).reduce(
      (str, [k, v]) => str.replace(`{{${k}}}`, v),
      key,
    );
  }
  return key;
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
  t: mockT,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCommandPalette.mockReturnValue(defaultContextValue);
  mockUseCommandPaletteSearch.mockReturnValue({
    patients: [],
    loading: false,
    error: null,
  });
  Object.defineProperty(globalThis, 'location', {
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

    const navGroup = screen
      .getAllByTestId('cmdk-group')
      .find((el) => el.dataset.heading === 'COMMAND_PALETTE_GROUP_NAVIGATION');
    expect(navGroup).toBeInTheDocument();
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
      screen.getByText('COMMAND_PALETTE_SEARCH_ERROR'),
    ).toBeInTheDocument();
  });

  it('extracts patient UUID from value when a patient item is highlighted', async () => {
    const user = userEvent.setup();
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
      patientActions: [
        {
          id: 'action-1',
          label: 'Dashboard',
          getPath: ({ patientUuid }: { patientUuid: string }) =>
            `/dashboard/${patientUuid}`,
          basePath: '/dashboard',
        },
      ],
    });
    mockUseCommandPaletteSearch.mockReturnValue({
      patients: [mockPatient],
      loading: false,
      error: null,
    });

    render(<CommandPalette />);

    const input = screen.getByTestId('cmdk-input');
    await user.type(input, 'jo');

    const patientItem = screen
      .getAllByTestId('cmdk-item')
      .find((el) => el.dataset.value?.startsWith('patient:'))!;
    expect(patientItem).toBeInTheDocument();

    await user.click(patientItem);

    expect(globalThis.location.href).toBe('/dashboard/patient-uuid-1');
  });

  it('resets selected patient UUID when a non-patient item is highlighted', async () => {
    const user = userEvent.setup();
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
    });

    render(<CommandPalette />);

    const navItem = screen
      .getByText('Go to Registration')
      .closest('[data-testid="cmdk-item"]')!;
    expect(navItem).toBeInTheDocument();

    await user.click(navItem);

    expect(globalThis.location.href).toBe('/bahmni-new/registration/search');
  });

  it('navigates via globalThis.location.href when a nav item with internal path is selected', async () => {
    const user = userEvent.setup();
    mockUseCommandPalette.mockReturnValue({
      ...defaultContextValue,
      isOpen: true,
    });

    render(<CommandPalette />);

    const navItem = screen.getByText('Go to Registration');
    await user.click(navItem.closest('[data-testid="cmdk-item"]')!);

    expect(globalThis.location.href).toBe('/bahmni-new/registration/search');
  });

  describe('Ask AI', () => {
    it('shows a pinned "Ask AI" item above the other groups', () => {
      mockUseCommandPalette.mockReturnValue({
        ...defaultContextValue,
        isOpen: true,
      });

      render(<CommandPalette />);

      expect(
        screen.getByText('COMMAND_PALETTE_AI_CHAT_ITEM_LABEL'),
      ).toBeInTheDocument();
    });

    it('seeds the item label with the current search term', async () => {
      const user = userEvent.setup();
      mockUseCommandPalette.mockReturnValue({
        ...defaultContextValue,
        isOpen: true,
      });

      render(<CommandPalette />);
      await user.type(screen.getByTestId('cmdk-input'), 'paracetamol dose');

      expect(
        screen.getByText('COMMAND_PALETTE_AI_CHAT_ITEM_LABEL_WITH_QUERY'),
      ).toBeInTheDocument();
    });

    it('hides the "Ask AI" item while typing an annotation prefix', async () => {
      const user = userEvent.setup();
      mockUseCommandPalette.mockReturnValue({
        ...defaultContextValue,
        isOpen: true,
      });

      render(<CommandPalette />);
      await user.type(screen.getByTestId('cmdk-input'), '@ph');

      expect(
        screen.queryByText('COMMAND_PALETTE_AI_CHAT_ITEM_LABEL'),
      ).not.toBeInTheDocument();
    });

    it('switches to the chat panel when selected, passing the typed text as the initial query', async () => {
      const user = userEvent.setup();
      mockUseCommandPalette.mockReturnValue({
        ...defaultContextValue,
        isOpen: true,
      });

      render(<CommandPalette />);
      await user.type(screen.getByTestId('cmdk-input'), 'paracetamol dose');
      const aiItem = screen
        .getByText('COMMAND_PALETTE_AI_CHAT_ITEM_LABEL_WITH_QUERY')
        .closest('[data-testid="cmdk-item"]')!;
      await user.click(aiItem);

      expect(screen.getByTestId('ai-chat-panel-stub')).toBeInTheDocument();
      expect(screen.queryByTestId('cmdk-root')).not.toBeInTheDocument();
      expect(screen.getByTestId('ai-chat-initial-query')).toHaveTextContent(
        'paracetamol dose',
      );
    });

    it('returns to the search view and clears the search term when the panel calls onBack', async () => {
      const user = userEvent.setup();
      mockUseCommandPalette.mockReturnValue({
        ...defaultContextValue,
        isOpen: true,
      });

      render(<CommandPalette />);
      await user.type(screen.getByTestId('cmdk-input'), 'paracetamol');
      await user.click(
        screen
          .getByText('COMMAND_PALETTE_AI_CHAT_ITEM_LABEL_WITH_QUERY')
          .closest('[data-testid="cmdk-item"]')!,
      );
      expect(screen.getByTestId('ai-chat-panel-stub')).toBeInTheDocument();

      await user.click(screen.getByText('back to search'));

      expect(
        screen.queryByTestId('ai-chat-panel-stub'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('cmdk-input')).toHaveValue('');
    });
  });
});
