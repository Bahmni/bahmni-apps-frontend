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
  PatientRelationship,
} from '../../../types/registration';
import * as styles from './styles/PatientRelationshipsSection.module.scss';

const PatientRelationshipsSection: React.FC<FormSectionProps> = ({
  data,
  onChange,
  errors,
  disabled,
  config,
}) => {
  const { t } = useTranslation();
  const relationships = data.relationships || [];

  const handleAddRelationship = () => {
    const newRelationship: PatientRelationship = {
      relationshipType: config?.relationshipTypes[0]!,
      personB: {
        uuid: '',
        display: '',
      },
    };
    onChange('relationships', [...relationships, newRelationship]);
  };

  const handleRemoveRelationship = (index: number) => {
    const newRelationships = [...relationships];
    newRelationships.splice(index, 1);
    onChange('relationships', newRelationships);
  };

  const handleRelationshipChange = (
    index: number,
    field: keyof PatientRelationship,
    value: any,
  ) => {
    const newRelationships = [...relationships];
    newRelationships[index] = { ...newRelationships[index], [field]: value };
    onChange('relationships', newRelationships);
  };

  return (
    <AccordionItem
      title={t('REGISTRATION_SECTION_TITLE_RELATIONSHIPS')}
      open
      className={styles.registrationSection}
    >
      <div className={styles.fieldset}>
        <Stack gap={6}>
          {relationships.map((relationship, index) => (
            <div key={index} className={styles.relationshipRow}>
              <Select
                id={`relationshipType-${index}`}
                labelText={t('REGISTRATION_RELATIONSHIP_TYPE')}
                value={relationship.relationshipType.uuid}
                onChange={(e) =>
                  handleRelationshipChange(
                    index,
                    'relationshipType',
                    config?.relationshipTypes.find(
                      (type) => type.uuid === e.target.value,
                    ),
                  )
                }
                disabled={disabled}
              >
                {config?.relationshipTypes.map((type) => (
                  <SelectItem
                    key={type.uuid}
                    value={type.uuid}
                    text={type.aIsToB}
                  />
                ))}
              </Select>
              <TextInput
                id={`personB-${index}`}
                labelText={t('REGISTRATION_PERSON')}
                value={relationship.personB?.display}
                onChange={(e) =>
                  handleRelationshipChange(index, 'personB', {
                    ...relationship.personB,
                    display: e.target.value,
                  })
                }
                disabled={disabled}
              />
              <Button
                kind="danger--tertiary"
                renderIcon={TrashCan}
                onClick={() => handleRemoveRelationship(index)}
                disabled={disabled}
                hasIconOnly
                iconDescription={t('REGISTRATION_REMOVE_RELATIONSHIP')}
              />
            </div>
          ))}
          <Button
            kind="ghost"
            renderIcon={Add}
            onClick={handleAddRelationship}
            disabled={disabled}
          >
            {t('REGISTRATION_ADD_RELATIONSHIP')}
          </Button>
        </Stack>
      </div>
    </AccordionItem>
  );
};

export default PatientRelationshipsSection;
