import { ValueSet } from 'fhir/r4';
import { FlattenedInvestigations } from '@types/investigations';
import { searchFHIRConceptsByName } from './conceptService';
import { ALL_ORDERABLES_CONCEPT_NAME } from '@constants/app';

const fetchInvestigations = async (): Promise<ValueSet> => {
  return await searchFHIRConceptsByName(ALL_ORDERABLES_CONCEPT_NAME);
};

const flattenInvestigations = (
  valueSet: ValueSet,
): FlattenedInvestigations[] => {
  const results: FlattenedInvestigations[] = [];

  if (!valueSet.expansion?.contains) {
    return results;
  }
  valueSet.expansion.contains.forEach((topLevelCategory) => {
    const categoryCode = topLevelCategory.code || '';
    const categoryDisplay = topLevelCategory.display || 'Unknown Category';
    topLevelCategory.contains?.forEach((subCategory) => {
      subCategory.contains?.forEach((investigation) => {
        results.push({
          code: investigation.code || '',
          display: investigation.display || 'Unknown investigation',
          category: categoryDisplay,
          categoryCode: categoryCode,
        });
      });
    });
  });

  return results;
};

export const getFlattenedInvestigations = async (): Promise<
  FlattenedInvestigations[]
> => {
  const valueSet = await fetchInvestigations();
  return flattenInvestigations(valueSet);
};
