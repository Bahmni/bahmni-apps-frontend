import type { VisitType } from '@bahmni/services';

export const transformVisitTypesToArray = (visitTypes?: {
  visitTypes: Record<string, string>;
}): VisitType[] => {
  if (!visitTypes?.visitTypes) {
    return [];
  }

  return Object.entries(visitTypes.visitTypes).map(([name, uuid]) => ({
    name,
    uuid: uuid as string,
  }));
};
