import React from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { DatePicker } from './DatePicker';
import { PatientAttribute } from '@/types/registration';

interface CustomAttributesProps {
  attributes: PatientAttribute[];
  onChange: (attributes: PatientAttribute[]) => void;
  errors?: any;
  touched?: any;
}

export const CustomAttributes: React.FC<CustomAttributesProps> = ({ attributes, onChange, errors = {}, touched = {} }) => {
  const handleChange = (index: number, value: any) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], value };
    onChange(newAttributes);
  };

  return (
    <div className="custom-attributes">
      {attributes.map((attribute, index) => {
        const attributeType = attribute.attributeType;
        const error = errors[attributeType.name];
        const isTouched = touched[attributeType.name];

        if (attributeType.format === 'java.lang.String') {
          return (
            <Input
              key={attributeType.uuid}
              label={attributeType.name}
              value={attribute.value || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              error={error}
              touched={isTouched}
            />
          );
        }

        if (attributeType.format === 'org.openmrs.Concept') {
          return (
            <Select
              key={attributeType.uuid}
              label={attributeType.name}
              options={attributeType.answers.map(a => ({ value: a.conceptId, label: a.description }))}
              value={attribute.value || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              error={error}
              touched={isTouched}
            />
          );
        }

        if (attributeType.format === 'org.openmrs.util.Date') {
            return (
              <DatePicker
                key={attributeType.uuid}
                label={attributeType.name}
                value={attribute.value || ''}
                onChange={(e) => handleChange(index, e.target.value)}
                error={error}
                touched={isTouched}
              />
            );
        }

        return null;
      })}
    </div>
  );
};
