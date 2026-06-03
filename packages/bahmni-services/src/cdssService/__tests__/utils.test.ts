import { filterCdsCardsForItems } from '../utils';
import {
  mockCDSCard,
  mockCDSCardInfo,
  mockCDSCardWithMultipleActions,
} from './mocks';

describe('cdssService utils', () => {
  describe('filterCdsCardsForItems', () => {
    it('should return cards with matching resource IDs', () => {
      const cards = [mockCDSCard];
      const itemIds = new Set(['med-123']);

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result).toHaveLength(1);
      expect(result[0].resourceId).toBe('med-123');
      expect(result[0].card.summary).toBe('Drug interaction warning');
      expect(result[0].card.suggestions).toHaveLength(1);
    });

    it('should return empty array when no resource IDs match', () => {
      const cards = [mockCDSCard];
      const itemIds = new Set(['non-existent-id']);

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result).toHaveLength(0);
    });

    it('should not return cards mapped to any resources when cards has no suggestions', () => {
      const cards = [mockCDSCardInfo];
      const itemIds = new Set(['any-id']);

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result).toHaveLength(0);
    });

    it('should not return cards mapped to any resources when cards has suggestions but no actions', () => {
      const cardWithNoActions = {
        ...mockCDSCard,
        suggestions: [{ label: 'No actions' }],
      };
      const cards = [cardWithNoActions];
      const itemIds = new Set(['med-123']);

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result).toHaveLength(0);
    });

    it('should handle multiple cards with different resource IDs', () => {
      const cards = [mockCDSCard, mockCDSCardWithMultipleActions];
      const itemIds = new Set(['med-123', 'med-789']);

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((r) => r.resourceId === 'med-123')).toBe(true);
      expect(result.some((r) => r.resourceId === 'med-789')).toBe(true);
    });

    it('should create separate card entries for each matching action in a suggestion', () => {
      const cards = [mockCDSCardWithMultipleActions];
      const itemIds = new Set(['med-789', 'med-101']);

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result).toHaveLength(2);
      expect(result[0].resourceId).toBe('med-789');
      expect(result[1].resourceId).toBe('med-101');
    });

    it('should handle empty itemIds set', () => {
      const cards = [mockCDSCard];
      const itemIds = new Set<string>();

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result).toHaveLength(0);
    });

    it('should filter cards with actions that have no resource', () => {
      const cardWithNoResource = {
        ...mockCDSCard,
        suggestions: [
          {
            label: 'Test',
            actions: [
              {
                type: 'create' as const,
              },
            ],
          },
        ],
      };
      const cards = [cardWithNoResource];
      const itemIds = new Set(['med-123']);

      const result = filterCdsCardsForItems(cards, itemIds);

      expect(result).toHaveLength(0);
    });
  });
});
