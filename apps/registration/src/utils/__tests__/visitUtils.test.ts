import { transformVisitTypesToArray } from '../visitUtils';

describe('visitUtils', () => {
  describe('transformVisitTypesToArray', () => {
    it('should transform visit types object to array', () => {
      const input = {
        visitTypes: {
          'OPD Visit': 'uuid-1',
          'Emergency Visit': 'uuid-2',
        },
      };

      const result = transformVisitTypesToArray(input);

      expect(result).toEqual([
        { name: 'OPD Visit', uuid: 'uuid-1' },
        { name: 'Emergency Visit', uuid: 'uuid-2' },
      ]);
    });

    it('should return empty array when visitTypes is undefined', () => {
      const result = transformVisitTypesToArray(undefined);

      expect(result).toEqual([]);
    });
  });
});
