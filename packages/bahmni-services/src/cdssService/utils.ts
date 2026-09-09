import { CDSCard } from './models';

/**
 * Filters cards relevant to a set of item IDs using self-identification pattern
 * @param cards - Array of CDS cards from CDSS response
 * @param itemIds - Set of item IDs owned by this control
 * @returns Array of cards relevant to this control's items, with filtered suggestions
 */
export const filterCdsCardsForItems = (
  cards: CDSCard[],
  itemIds: Set<string>,
): Array<{ card: CDSCard; resourceId: string }> => {
  const relevantCards: Array<{ card: CDSCard; resourceId: string }> = [];

  cards.forEach((card) => {
    if (!card.suggestions || card.suggestions.length === 0) {
      return;
    }

    card.suggestions.forEach((suggestion) => {
      if (!suggestion.actions) return;

      suggestion.actions.forEach((action) => {
        const resourceId = action.resource?.id;

        // Check if this resource ID belongs to our items
        if (resourceId && itemIds.has(resourceId)) {
          // Create a card copy with only the relevant suggestion
          relevantCards.push({
            card: {
              ...card,
              suggestions: [suggestion],
            },
            resourceId,
          });
        }
      });
    });
  });

  return relevantCards;
};
