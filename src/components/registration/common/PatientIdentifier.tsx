import React from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Identifier } from '@/types/registration';

interface PatientIdentifierProps {
  identifier: Identifier;
  onChange: (identifier: Identifier) => void;
  error?: string;
  touched?: boolean;
}

export const PatientIdentifier: React.FC<PatientIdentifierProps> = ({ identifier, onChange, error, touched }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...identifier, registrationNumber: e.target.value });
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const source = identifier.identifierType.identifierSources.find(s => s.prefix === e.target.value);
    onChange({ ...identifier, selectedIdentifierSource: source });
  };

  return (
    <div className="patient-identifier">
      <Input
        label={identifier.identifierType.name}
        value={identifier.registrationNumber || ''}
        onChange={handleInputChange}
        error={error}
        touched={touched}
      />
      {identifier.identifierType.identifierSources.length > 1 && (
        <Select
          label="Source"
          options={identifier.identifierType.identifierSources.map(s => ({ value: s.prefix, label: s.name }))}
          value={identifier.selectedIdentifierSource?.prefix || ''}
          onChange={handleSourceChange}
        />
      )}
    </div>
  );
};
