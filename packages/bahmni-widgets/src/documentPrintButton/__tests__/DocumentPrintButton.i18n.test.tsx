import { notificationService, renderAsHtml } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance, type i18n } from 'i18next';
import { initReactI18next, setI18n } from 'react-i18next';
import { DocumentPrintButton } from '../DocumentPrintButton';

// Unlike the other suites, i18n is NOT mocked: labels go through a real i18next
// instance configured like the apps do (config bundle merged over the bundled
// one, English fallback). Only the services the widget calls are stubbed.
jest.mock('@bahmni/services', () => ({
  renderAsHtml: jest.fn().mockRejectedValue(new Error('template missing')),
  getUserPreferredLocale: jest.fn().mockReturnValue('es'),
  notificationService: { showError: jest.fn() },
  useTranslation: jest.requireActual('react-i18next').useTranslation,
  translate: jest.requireActual('@bahmni/services').translate,
  getValidationMessage:
    jest.requireActual('@bahmni/services').getValidationMessage,
  getUserLoginLocation: jest.fn(() => {
    throw new Error('no login location cookie');
  }),
}));

jest.mock('../../activePractitioner', () => ({
  useActivePractitioner: jest.fn(() => ({ practitioner: null })),
}));

jest.mock('../printViaIframe', () => ({
  printViaIframe: jest.fn().mockResolvedValue(undefined),
}));

const options = [
  // bundled key, translated in es
  { translationKey: 'REGISTRATION_PRINT_REGISTRATION_CARD', templateId: 'a' },
  // facility-configured key, translated only in the facility (config) bundle
  { translationKey: 'FACILITY_PRINT_SECOND', templateId: 'b' },
  // facility key with no es translation: must fall back to English
  { translationKey: 'FACILITY_ENGLISH_ONLY', templateId: 'c' },
  // key defined nowhere: shows the raw key
  { translationKey: 'FACILITY_UNDEFINED_KEY', templateId: 'd' },
];

// An isolated instance bound to react-i18next for this file only; the shared default
// `i18next` export is never touched.
let appI18n: i18n;

beforeAll(async () => {
  appI18n = createInstance();
  await appI18n.use(initReactI18next).init({
    lng: 'es',
    fallbackLng: 'en',
    defaultNS: 'registration',
    ns: ['registration'],
    interpolation: { escapeValue: false },
    resources: {
      es: {
        registration: {
          REGISTRATION_PRINT_REGISTRATION_CARD: 'Imprimir tarjeta de registro',
          FACILITY_PRINT_SECOND: 'Segunda opción',
          PRINT_MODAL_PREPARING_DOCUMENT: 'Preparando documento…',
          PRINT_DOCUMENT_ERROR_TITLE: 'No se puede imprimir',
          PRINT_DOCUMENT_ERROR_MESSAGE: 'No se pudo preparar el documento.',
        },
      },
      en: {
        registration: {
          REGISTRATION_PRINT_REGISTRATION_CARD: 'Print Registration Card',
          FACILITY_PRINT_SECOND: 'Second Option',
          FACILITY_ENGLISH_ONLY: 'English only label',
          PRINT_DOCUMENT_ERROR_TITLE: 'Unable to print',
        },
      },
    },
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  setI18n(appI18n);
});

afterAll(() => setI18n(null as unknown as i18n));

describe('DocumentPrintButton translations (real i18n, locale es)', () => {
  it('shows the primary label and every dropdown label translated, with English fallback', async () => {
    render(<DocumentPrintButton printOptions={options} renderContext={{}} />);

    expect(
      screen.getByRole('button', { name: 'Imprimir tarjeta de registro' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /additional actions/i }),
    );
    const labels = screen
      .getAllByRole('menuitem', { hidden: true })
      .map((i) => i.textContent);
    expect(labels).toEqual([
      'Segunda opción',
      'English only label',
      'FACILITY_UNDEFINED_KEY',
    ]);
  });

  it('shows the error notification in Spanish, falling back to English where untranslated', async () => {
    (renderAsHtml as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    render(
      <DocumentPrintButton printOptions={[options[0]]} renderContext={{}} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Imprimir tarjeta de registro' }),
    );

    await waitFor(() =>
      expect(notificationService.showError).toHaveBeenCalledWith(
        'No se puede imprimir',
        'No se pudo preparar el documento.',
      ),
    );
    consoleError.mockRestore();
  });
});
