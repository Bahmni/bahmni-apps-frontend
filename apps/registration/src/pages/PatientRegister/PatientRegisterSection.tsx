import { Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import {
  RegistrationFormControl,
  RegistrationFormSection,
} from '../../providers/registrationConfig/models';
import { builtInFormSections } from './formSectionMap';
import { FormControlRefs, FormControlData, FormControlGuards } from './models';
import styles from './styles/index.module.scss';

interface PatientRegisterSectionProps {
  section: RegistrationFormSection;
  refs: FormControlRefs;
  data: FormControlData;
  guards: FormControlGuards;
}

const PatientRegisterSection: React.FC<PatientRegisterSectionProps> = ({
  section,
  refs,
  data,
  guards,
}) => {
  const { t } = useTranslation();

  const renderComponent = (type: string): React.ReactNode => {
    const sectionConfig = builtInFormSections.find((s) => s.type === type);
    if (!sectionConfig) return null;
    return sectionConfig.render(refs, data, guards);
  };

  const renderControl = (control: RegistrationFormControl): React.ReactNode => {
    const component = renderComponent(control.type);
    if (!component) return null;

    return (
      <div key={control.type}>
        {control.titleTranslationKey && (
          <div
            className={styles.controlTitle}
            data-testid={`control-title-${control.type}`}
          >
            <span className={styles.formSectionTitle}>
              {t(control.titleTranslationKey)}
            </span>
          </div>
        )}
        {component}
      </div>
    );
  };

  const renderedControls = section.controls
    .map((control) => renderControl(control))
    .filter(Boolean);

  if (renderedControls.length === 0) {
    return null;
  }

  return (
    <div className={styles.formContainer}>
      {section.translationKey && (
        <Tile className={styles.headerTile} data-testid="section-header-tile">
          <span className={styles.sectionTitle}>
            {t(section.translationKey)}
          </span>
        </Tile>
      )}
      {renderedControls}
    </div>
  );
};

export default PatientRegisterSection;
