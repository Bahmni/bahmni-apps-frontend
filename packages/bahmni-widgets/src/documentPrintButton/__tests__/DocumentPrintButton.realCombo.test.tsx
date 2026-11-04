import { renderAsHtml } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentPrintButton } from '../DocumentPrintButton';
import { printViaIframe } from '../printViaIframe';

// Unlike DocumentPrintButton.test.tsx, @bahmni/design-system is NOT mocked here,
// so the real Carbon ComboButton is exercised.
jest.mock('@bahmni/services', () => ({
  renderAsHtml: jest.fn().mockResolvedValue('<html/>'),
  getUserPreferredLocale: jest.fn().mockReturnValue('en'),
  notificationService: { showError: jest.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
  getUserLoginLocation: jest.fn(() => {
    throw new Error('no login location cookie');
  }),
}));

jest.mock('i18next', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

jest.mock('../../activePractitioner', () => ({
  useActivePractitioner: jest.fn(() => ({ practitioner: null })),
}));

jest.mock('../printViaIframe', () => ({
  printViaIframe: jest.fn().mockResolvedValue(undefined),
}));

const options = [
  { translationKey: 'PRINT_A', templateId: 'a' },
  { translationKey: 'PRINT_B', templateId: 'b' },
  { translationKey: 'PRINT_C', templateId: 'c' },
];

describe('DocumentPrintButton with the real ComboButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the first option as the primary action', async () => {
    render(<DocumentPrintButton printOptions={options} renderContext={{}} />);

    await userEvent.click(screen.getByText('PRINT_A'));

    await waitFor(() =>
      expect(renderAsHtml).toHaveBeenCalledWith(
        expect.objectContaining({ templateId: 'a' }),
      ),
    );
    expect(printViaIframe).toHaveBeenCalledTimes(1);
  });

  it('lists the remaining options in order and prints the selected one', async () => {
    render(<DocumentPrintButton printOptions={options} renderContext={{}} />);

    await userEvent.click(
      screen.getByRole('button', { name: /additional actions/i }),
    );

    const items = screen
      .getAllByRole('menuitem', { hidden: true })
      .map((i) => i.textContent);
    expect(items).toEqual(['PRINT_B', 'PRINT_C']);

    await userEvent.click(screen.getByText('PRINT_C'));
    await waitFor(() =>
      expect(renderAsHtml).toHaveBeenCalledWith(
        expect.objectContaining({ templateId: 'c' }),
      ),
    );
  });
});
