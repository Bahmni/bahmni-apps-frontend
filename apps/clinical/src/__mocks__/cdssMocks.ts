import type { CDSCard } from '@bahmni/services';

/**
 * Factory function to create a mock CDS warning card
 * @param resourceType - The FHIR resource type (e.g., 'MedicationRequest', 'Immunization')
 * @param resourceId - The ID of the resource
 * @param summary - Custom summary text
 * @param suggestionLabel - Custom suggestion label
 */
export const createMockCDSCard = (
  resourceType: string,
  resourceId: string,
  summary: string,
  suggestionLabel: string,
): CDSCard => ({
  summary,
  indicator: 'warning' as const,
  source: { label: 'Test CDSS' },
  suggestions: [
    {
      label: suggestionLabel,
      actions: [
        {
          type: 'update' as const,
          resource: {
            resourceType,
            id: resourceId,
            status:
              resourceType === 'MedicationRequest' ? 'active' : 'completed',
          },
        },
      ],
    },
  ],
});

/**
 * Factory function to create a mock critical CDS card
 * @param resourceType - The FHIR resource type (e.g., 'MedicationRequest', 'Immunization')
 * @param resourceId - The ID of the resource
 * @param summary - Custom summary text
 * @param suggestionLabel - Custom suggestion label
 */
export const createMockCriticalCDSCard = (
  resourceType: string,
  resourceId: string,
  summary: string,
  suggestionLabel: string,
): CDSCard => ({
  summary,
  indicator: 'critical' as const,
  source: { label: 'Test CDSS' },
  suggestions: [
    {
      label: suggestionLabel,
      actions: [
        {
          type: 'delete' as const,
          resource: {
            resourceType,
            id: resourceId,
          },
        },
      ],
    },
  ],
});
