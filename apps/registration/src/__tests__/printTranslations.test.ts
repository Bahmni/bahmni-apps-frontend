import en from '../../public/locales/locale_en.json';
import es from '../../public/locales/locale_es.json';

// Keys the shared DocumentPrintButton resolves in the consuming app's namespace.
const isWidgetPrintKey = (key: string) => key.startsWith('PRINT_');

// Labels of the options configured under `printOptions` for the Registration
// Print menu; they are resolved through the same namespace.
const isPrintOptionLabelKey = (key: string) =>
  key.startsWith('REGISTRATION_PRINT_');

const PRINT_OPTION_LABEL_KEYS = ['REGISTRATION_PRINT_REGISTRATION_CARD'];

const localeEn = en as Record<string, string>;
const localeEs = es as Record<string, string>;

describe('print translations', () => {
  const widgetPrintKeys = Object.keys(en).filter(isWidgetPrintKey);
  const printOptionLabelKeys = Object.keys(en).filter(isPrintOptionLabelKey);

  it('defines the keys the print widget needs', () => {
    expect(widgetPrintKeys).toEqual(
      expect.arrayContaining([
        'PRINT_MODAL_PREPARING_DOCUMENT',
        'PRINT_DOCUMENT_ERROR_TITLE',
        'PRINT_DOCUMENT_ERROR_MESSAGE',
      ]),
    );
  });

  it.each(widgetPrintKeys)(
    'has a non-empty Spanish translation for %s',
    (key) => {
      expect(localeEs[key]?.trim()).toBeTruthy();
    },
  );

  it('defines a label for every Registration print option', () => {
    expect(printOptionLabelKeys).toEqual(
      expect.arrayContaining(PRINT_OPTION_LABEL_KEYS),
    );
  });

  it.each(printOptionLabelKeys)(
    'has a non-empty Spanish translation for the print option label %s',
    (key) => {
      expect(localeEs[key]?.trim()).toBeTruthy();
    },
  );

  it.each(printOptionLabelKeys)(
    'has a plain-text label (no HTML markup) for %s in every locale',
    (key) => {
      // Legacy labels carried <u>L</u> shortcut-underline markup; the menu
      // renders text, so markup would be shown literally.
      expect(localeEn[key]).not.toMatch(/<[^>]+>/);
      expect(localeEs[key]).not.toMatch(/<[^>]+>/);
    },
  );
});
