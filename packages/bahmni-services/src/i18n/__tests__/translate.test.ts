import { createInstance, type i18n } from 'i18next';
import { initReactI18next, setI18n } from 'react-i18next';
import { translate } from '../translate';

let appI18n: i18n;

beforeAll(async () => {
  appI18n = createInstance();
  await appI18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: { translation: { GREETING: 'Hello', EMPTY_VALUE: '' } },
    },
  });
});

beforeEach(() => setI18n(appI18n));

afterAll(() => setI18n(null as unknown as i18n));

describe('translate', () => {
  it('returns the translation from the initialised i18n instance', () => {
    expect(translate('GREETING')).toBe('Hello');
  });

  it('falls back to the key when the translation is missing', () => {
    expect(translate('NOT_DEFINED')).toBe('NOT_DEFINED');
  });

  it('falls back to the key when the translation is an empty string', () => {
    expect(translate('EMPTY_VALUE')).toBe('EMPTY_VALUE');
  });

  it('falls back to the key when no i18n instance has been set up', () => {
    setI18n(null as unknown as i18n);

    expect(translate('GREETING')).toBe('GREETING');
  });
});
