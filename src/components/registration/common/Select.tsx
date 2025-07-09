import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
  touched?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, touched, ...props }) => {
  const hasError = touched && error;
  return (
    <div className={`form-field ${hasError ? 'has-error' : ''}`}>
      <label htmlFor={props.id}>{label}</label>
      <select {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && <span className="field-error">{error}</span>}
    </div>
  );
};
