import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionItem,
  Button,
  Select,
  SelectItem,
  TextInput,
  Stack,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';
import {
  FormSectionProps,
  PatientIdentifier,
} from '../../../types/registration';
import * as styles from './styles/ExtraPatientIdentifiersSection.module.scss';

const ExtraPatientIdentifiersSection: React.FC<FormSectionProps> = ({
  data,
  onChange,
  errors,
  disabled,
  config,
}) => {
  const { t } = useTranslation();
  const identifiers = data.extraIdentifiers || [];

  const handleAddIdentifier = () => {
    const newIdentifier: PatientIdentifier = {
      identifier: '',
      identifierType: config?.identifierTypes[0]!,
    };
    onChange('extraIdentifiers', [...identifiers, newIdentifier]);
  };

  const handleRemoveIdentifier = (index: number) => {
    const newIdentifiers = [...identifiers];
    newIdentifiers.splice(index, 1);
    onChange('extraIdentifiers', newIdentifiers);
  };

  const handleIdentifierChange = (
    index: number,
    field: keyof PatientIdentifier,
    value: any,
  ) => {
    const newIdentifiers = [...identifiers];
    newIdentifiers[index] = { ...newIdentifiers[index], [field]: value };
    onChange('extraIdentifiers', newIdentifiers);
  };

  return (
    <AccordionItem
      title={t('REGISTRATION_SECTION_TITLE_EXTRA_IDENTIFIERS')}
      open
      className={styles.registrationSection}
    >
      <div className={styles.fieldset}>
        <Stack gap={6}>
          {identifiers.map((identifier, index) => (
            <div key={index} className={styles.identifierRow}>
              <Select
                id={`identifierType-${index}`}
                labelText={t('REGISTRATION_IDENTIFIER_TYPE')}
                value={identifier.identifierType.uuid}
                onChange={(e) =>
                  handleIdentifierChange(
                    index,
                    'identifierType',
                    config?.identifierTypes.find(
                      (type) => type.uuid === e.target.value,
                    ),
                  )
                }
                disabled={disabled}
              >
                {config?.identifierTypes.map((type) => (
                  <SelectItem
                    key={type.uuid}
                    value={type.uuid}
                    text={type.name}
                  />
                ))}
              </Select>
              <TextInput
                id={`identifier-${index}`}
                labelText={t('REGISTRATION_IDENTIFIER')}
                value={identifier.identifier}
                onChange={(e) =>
                  handleIdentifierChange(index, 'identifier', e.target.value)
                }
                disabled={disabled}
              />
              <Button
                kind="danger--tertiary"
                renderIcon={TrashCan}
                onClick={() => handleRemoveIdentifier(index)}
                disabled={disabled}
                hasIconOnly
                iconDescription={t('REGISTRATION_REMOVE_IDENTIFIER')}
              />
            </div>
          ))}
          <Button
            kind="ghost"
            renderIcon={Add}
            onClick={handleAddIdentifier}
            disabled={disabled}
          >
            {t('REGISTRATION_ADD_IDENTIFIER')}
          </Button>
        </Stack>
      </div>
    </AccordionItem>
  );
};

export default ExtraPatientIdentifiersSection;
