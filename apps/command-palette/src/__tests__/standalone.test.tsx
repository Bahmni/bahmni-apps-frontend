import { act, waitFor } from '@testing-library/react';
import { COMMAND_PALETTE_ENABLED_STORAGE_KEY } from '../constants/app';

jest.mock('virtual:command-palette-styles?inline', () => '.palette{}', {
  virtual: true,
});

const mockWidgetProvider = jest.fn().mockReturnValue(null);
jest.mock('@bahmni/widgets', () => ({
  CommandPaletteProvider: (props: unknown) => mockWidgetProvider(props),
}));

jest.mock('../hooks/useCommandPaletteConfig', () => ({
  useCommandPaletteConfig: () => ({
    navItems: [],
    patientActions: [],
    patientFieldsConfig: { primaryFields: ['name'], additionalFields: [] },
    trigger: { type: 'combination', keys: ['meta+k'] },
    searchAnnotations: [],
  }),
}));

const TAG_NAME = 'bahmni-command-palette';

describe('standalone entry', () => {
  beforeEach(() => {
    localStorage.setItem(COMMAND_PALETTE_ENABLED_STORAGE_KEY, 'true');
    document.body.innerHTML = '';
    mockWidgetProvider.mockClear();
    jest.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('registers the custom element, mounts it in an isolated shadow root with no ambient Router, and forwards the shadow root as the portal container', async () => {
    await act(async () => {
      await import('../standalone');
    });

    expect(customElements.get(TAG_NAME)).toBeDefined();

    const host = document.querySelector(TAG_NAME);
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).not.toBeNull();
    expect(host?.shadowRoot?.querySelector('style')?.textContent).toBe(
      '.palette{}',
    );

    await waitFor(() => {
      expect(mockWidgetProvider).toHaveBeenCalledWith(
        expect.objectContaining({ portalContainer: host?.shadowRoot }),
      );
    });
  });

  it('does not append a second instance if one already exists', async () => {
    await act(async () => {
      await import('../standalone');
    });
    jest.resetModules();
    await act(async () => {
      await import('../standalone');
    });

    expect(document.querySelectorAll(TAG_NAME).length).toBe(1);
  });
});
