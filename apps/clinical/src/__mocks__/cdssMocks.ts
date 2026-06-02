import type { CDSCard } from '@bahmni/services';

export const createMockCDSCard = (
  resourceType: string,
  resourceId: string,
  summary: string,
  suggestionLabel: string,
  indicator: 'info' | 'warning' | 'critical' = 'warning',
): CDSCard => ({
  summary,
  indicator,
  source: { label: 'Test CDSS' },
  suggestions: [
    {
      label: suggestionLabel,
      actions: [
        {
          type:
            indicator === 'critical'
              ? ('delete' as const)
              : ('update' as const),
          resource: {
            resourceType,
            id: resourceId,
            ...(indicator !== 'critical' && {
              status:
                resourceType === 'MedicationRequest' ? 'active' : 'completed',
            }),
          },
        },
      ],
    },
  ],
});
