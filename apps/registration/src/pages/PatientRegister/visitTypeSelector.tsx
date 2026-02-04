import { Button, Dropdown } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useParams } from 'react-router-dom';
import { useRegistrationConfig } from '../../hooks/useRegistrationConfig';
import { useActiveVisit, useVisitTypes } from '../../hooks/useVisit';
import { transformVisitTypesToArray } from '../../utils/visitUtils';
import styles from './styles/VisitTypeSelector.module.scss';

interface VisitTypeSelectorProps {
  onVisitTypeSelect: (visitType: { name: string; uuid: string }) => void;
}

export const VisitTypeSelector = ({
  onVisitTypeSelect,
}: VisitTypeSelectorProps) => {
  const { t } = useTranslation();
  const { patientUuid } = useParams<{ patientUuid: string }>();
  const { hasActiveVisit } = useActiveVisit(patientUuid);
  const { registrationConfig } = useRegistrationConfig();
  const { visitTypes, isLoading: isLoadingVisitTypes } = useVisitTypes();

  const visitTypesArray = transformVisitTypesToArray(visitTypes);

  const defaultVisitType =
    visitTypesArray.find(
      (vt) => vt.name === registrationConfig?.defaultVisitType,
    ) ?? visitTypesArray[0];

  return (
    <div className={styles.opdVisitGroup}>
      <Button
        id="visit-button"
        data-testid="start-visit-button"
        className={styles.visitButton}
        kind="tertiary"
        disabled={isLoadingVisitTypes || visitTypesArray.length === 0}
        onClick={() => defaultVisitType && onVisitTypeSelect(defaultVisitType)}
      >
        {!isLoadingVisitTypes && defaultVisitType
          ? hasActiveVisit
            ? t('ENTER_VISIT_DETAILS')
            : t('START_VISIT_TYPE', { visitType: defaultVisitType.name })
          : ''}
      </Button>
      {!hasActiveVisit && (
        <Dropdown
          id="visit-dropdown"
          data-testid="visit-type-dropdown"
          className={styles.visitDropdown}
          items={visitTypesArray.filter(
            (vt) => vt.uuid !== defaultVisitType?.uuid,
          )}
          itemToString={(item) =>
            item ? t('START_VISIT_TYPE', { visitType: item.name }) : ''
          }
          onChange={({ selectedItem }) =>
            selectedItem && onVisitTypeSelect(selectedItem)
          }
          label=""
          type="inline"
          size="lg"
          disabled={isLoadingVisitTypes || visitTypesArray.length === 0}
          titleText=""
          selectedItem={null}
        />
      )}
    </div>
  );
};
