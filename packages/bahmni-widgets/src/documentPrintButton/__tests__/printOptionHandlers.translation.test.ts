import { notificationService, renderAsHtml } from '@bahmni/services';
import i18next, { createInstance, type i18n } from 'i18next';
import { initReactI18next, setI18n } from 'react-i18next';
import { printTemplate } from '../printOptionHandlers';

// In the built app the widgets package carries its own copy of `i18next` that nothing
// initialises; the app initialises a different instance and binds it to react-i18next.
// This mirrors that: an app instance wired through initReactI18next, while the default
// `i18next` export is a different instance that must not be used (the test setup initialises
// it, so here it is made to return a sentinel instead).
jest.mock('@bahmni/services', () => ({
  renderAsHtml: jest.fn(),
  getUserPreferredLocale: jest.fn().mockReturnValue('es'),
  notificationService: { showError: jest.fn() },
  // the real shared helpers, so this exercises the production translation path
  getValidationMessage:
    jest.requireActual('@bahmni/services').getValidationMessage,
  translate: jest.requireActual('@bahmni/services').translate,
}));

jest.mock('../printViaIframe', () => ({
  printViaIframe: jest.fn().mockResolvedValue(undefined),
}));

const option = { translationKey: 'PRINT_CARD', templateId: 'REG_CARD_V1' };

let appI18n: i18n;

beforeAll(async () => {
  appI18n = createInstance();
  await appI18n.use(initReactI18next).init({
    lng: 'es',
    fallbackLng: 'en',
    resources: {
      es: {
        translation: {
          PRINT_DOCUMENT_ERROR_TITLE: 'No se puede imprimir',
          PRINT_DOCUMENT_ERROR_MESSAGE: 'No se pudo preparar el documento.',
        },
      },
    },
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  setI18n(appI18n);
  (renderAsHtml as jest.Mock).mockRejectedValue(new Error('template missing'));
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('print failure notification text', () => {
  it('uses the app i18n instance, not the separate default i18next copy', async () => {
    jest
      .spyOn(i18next, 't')
      .mockReturnValue('FROM-DEFAULT-I18NEXT-COPY' as never);

    await printTemplate(option, {}, { setIsPrinting: jest.fn() });

    expect(notificationService.showError).toHaveBeenCalledWith(
      'No se puede imprimir',
      'No se pudo preparar el documento.',
    );
  });

  it.each([
    [
      'empty',
      { PRINT_DOCUMENT_ERROR_TITLE: '', PRINT_DOCUMENT_ERROR_MESSAGE: '' },
    ],
    ['missing', {}],
  ])(
    'falls back to the translation keys when the translations are %s',
    async (_label, translation) => {
      const sparse = createInstance();
      await sparse.use(initReactI18next).init({
        lng: 'es',
        resources: { es: { translation } },
      });
      setI18n(sparse);

      await printTemplate(option, {}, { setIsPrinting: jest.fn() });

      expect(notificationService.showError).toHaveBeenCalledWith(
        'PRINT_DOCUMENT_ERROR_TITLE',
        'PRINT_DOCUMENT_ERROR_MESSAGE',
      );
    },
  );

  it('falls back to the translation keys when no i18n instance has been set up', async () => {
    setI18n(null as unknown as i18n);

    await printTemplate(option, {}, { setIsPrinting: jest.fn() });

    expect(notificationService.showError).toHaveBeenCalledWith(
      'PRINT_DOCUMENT_ERROR_TITLE',
      'PRINT_DOCUMENT_ERROR_MESSAGE',
    );
  });
});
