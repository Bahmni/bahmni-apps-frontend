import { ValueSet, ValueSetExpansionContains } from 'fhir/r4';
import { FlattenedInvestigations } from '@types/investigations';
import { searchFHIRConceptsByName } from './conceptService';
import { ALL_ORDERABLES_CONCEPT_NAME } from '@constants/app';
import i18next from 'i18next';

const fetchInvestigations = async (): Promise<ValueSet> => {
  return await searchFHIRConceptsByName(ALL_ORDERABLES_CONCEPT_NAME);
};

const getInvestigationDisplay = (
  investigation: ValueSetExpansionContains,
): string => {
  let investigationDisplay = investigation.display || 'Unknown investigation';
  if (investigation.contains && investigation.contains.length > 0) {
    investigationDisplay += ` (${i18next.t('INVESTIGATION_PANEL')})`;
  }
  return investigationDisplay;
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
    const categoryDisplay = translateCategory(
      topLevelCategory.display || 'Unknown Category',
    );
    topLevelCategory.contains?.forEach((subCategory) => {
      subCategory.contains?.forEach((investigation) => {
        results.push({
          code: investigation.code || '',
          display: getInvestigationDisplay(investigation),
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

const translateCategory = (category: string): string => {
  if (category === 'Lab Samples') {
    return i18next.t('LAB_INVESTIGATIONS_CATEGORY');
  }
  return category;
};
