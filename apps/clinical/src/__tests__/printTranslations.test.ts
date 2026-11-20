import en from '../../public/locales/locale_en.json';
import es from '../../public/locales/locale_es.json';

// Keys the shared DocumentPrintButton resolves in the consuming app's namespace.
const isPrintKey = (key: string) => key.startsWith('PRINT_');

describe('print translations', () => {
  const printKeys = Object.keys(en).filter(isPrintKey);

  it('defines the keys the print widget needs', () => {
    expect(printKeys).toEqual(
      expect.arrayContaining([
        'PRINT_MODAL_PREPARING_DOCUMENT',
        'PRINT_DOCUMENT_ERROR_TITLE',
        'PRINT_DOCUMENT_ERROR_MESSAGE',
      ]),
    );
  });

  it.each(printKeys)('has a non-empty Spanish translation for %s', (key) => {
    expect((es as Record<string, string>)[key]?.trim()).toBeTruthy();
  });
});
