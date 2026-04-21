import {
  Button,
  Dropdown,
  Icon,
  ICON_PADDING,
  ICON_SIZE,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useParams } from 'react-router-dom';
import { useActiveVisit, useVisitTypes } from '../../hooks/useVisit';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { transformVisitTypesToArray } from '../../utils/visitUtils';
import styles from './styles/VisitTypeSelector.module.scss';

interface VisitTypeSelectorProps {
  onVisitTypeSelect: (visitType: { name: string; uuid: string }) => void;
  activeVisitLabel?: string;
  onActiveVisitClick?: () => void;
}

export const VisitTypeSelector = ({
  onVisitTypeSelect,
  activeVisitLabel,
  onActiveVisitClick,
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
        kind={hasActiveVisit ? 'primary' : 'tertiary'}
        disabled={isLoadingVisitTypes || visitTypesArray.length === 0}
        onClick={() => {
          if (hasActiveVisit) {
            if (onActiveVisitClick) {
              onActiveVisitClick();
            } else if (defaultVisitType) {
              onVisitTypeSelect(defaultVisitType);
            }
          } else if (defaultVisitType) {
            onVisitTypeSelect(defaultVisitType);
          }
        }}
      >
        {!isLoadingVisitTypes && defaultVisitType ? (
          hasActiveVisit ? (
            <span className={styles.buttonContent}>
              {activeVisitLabel ?? t('ENTER_VISIT_DETAILS')}
              <Icon
                id="patient-dashboard-arrow"
                name="fa-arrow-right"
                size={ICON_SIZE.SM}
                padding={ICON_PADDING.NONE}
              />
            </span>
          ) : (
            t('START_VISIT_TYPE', { visitType: defaultVisitType.name })
          )
        ) : (
          ''
        )}
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
