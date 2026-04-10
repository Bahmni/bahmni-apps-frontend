import {
  getBrowserLocaleDateFormat,
  getDateFormats,
  DEFAULT_DATE_FORMAT,
} from '../dateFormatUtils';

describe('dateFormatUtils', () => {
  describe('getBrowserLocaleDateFormat', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      [
        'MM/dd/yyyy for US pattern',
        [
          { type: 'month', value: '3' },
          { type: 'literal', value: '/' },
          { type: 'day', value: '24' },
          { type: 'literal', value: '/' },
          { type: 'year', value: '2026' },
        ],
        'MM/dd/yyyy',
      ],
      [
        'dd/MM/yyyy for UK/European pattern',
        [
          { type: 'day', value: '24' },
          { type: 'literal', value: '/' },
          { type: 'month', value: '3' },
          { type: 'literal', value: '/' },
          { type: 'year', value: '2026' },
        ],
        'dd/MM/yyyy',
      ],
      [
        'yyyy-MM-dd for Asian pattern',
        [
          { type: 'year', value: '2026' },
          { type: 'literal', value: '-' },
          { type: 'month', value: '03' },
          { type: 'literal', value: '-' },
          { type: 'day', value: '24' },
        ],
        'yyyy-MM-dd',
      ],
    ])('returns %s', (_, parts, expected) => {
      jest
        .spyOn(Intl, 'DateTimeFormat')
        .mockImplementation(() => ({ formatToParts: () => parts }) as any);

      expect(getBrowserLocaleDateFormat()).toBe(expected);
    });

    it('returns default format when error occurs', () => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
        throw new Error('DateTimeFormat error');
      });

      expect(getBrowserLocaleDateFormat()).toBe(DEFAULT_DATE_FORMAT);
    });
  });

  describe('getDateFormats', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
      jest.restoreAllMocks();
    });

    it('returns both dateFnsFormat and flatpickrFormat', () => {
      const formats = getDateFormats();

      expect(formats).toHaveProperty('dateFnsFormat');
      expect(formats).toHaveProperty('flatpickrFormat');
      expect(typeof formats.dateFnsFormat).toBe('string');
      expect(typeof formats.flatpickrFormat).toBe('string');
    });

    it.each([
      ['MM/dd/yyyy', 'm/d/Y'],
      ['yyyy-MM-dd', 'Y-m-d'],
      ['dd-MMM-yyyy', 'd-M-Y'],
      ['dd/MM/yyyy', 'd/m/Y'],
    ])(
      'uses localStorage format %s and converts to %s',
      (dateFnsFormat, flatpickrFormat) => {
        localStorage.setItem('default_dateFormat', dateFnsFormat);

        const formats = getDateFormats();

        expect(formats.dateFnsFormat).toBe(dateFnsFormat);
        expect(formats.flatpickrFormat).toBe(flatpickrFormat);
      },
    );

    it('falls back to browser locale when localStorage is empty', () => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
        () =>
          ({
            formatToParts: () => [
              { type: 'month', value: '3' },
              { type: 'literal', value: '/' },
              { type: 'day', value: '24' },
              { type: 'literal', value: '/' },
              { type: 'year', value: '2026' },
            ],
          }) as any,
      );

      const formats = getDateFormats();

      expect(formats.dateFnsFormat).toBe('MM/dd/yyyy');
      expect(formats.flatpickrFormat).toBe('m/d/Y');
    });

    it('handles localStorage error gracefully', () => {
      const getItemSpy = jest
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('localStorage error');
        });

      const formats = getDateFormats();

      expect(formats.dateFnsFormat).toBeDefined();
      expect(formats.flatpickrFormat).toBeDefined();

      getItemSpy.mockRestore();
    });

    it('uses unmapped format as-is for flatpickr when not in mapping', () => {
      const customFormat = 'custom-unmapped-format';
      localStorage.setItem('default_dateFormat', customFormat);

      const formats = getDateFormats();

      expect(formats.dateFnsFormat).toBe(customFormat);
      expect(formats.flatpickrFormat).toBe(customFormat);
    });
  });
});
