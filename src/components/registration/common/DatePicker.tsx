import React from 'react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, error, touched, ...props }) => {
  const hasError = touched && error;
  return (
    <div className={`form-field ${hasError ? 'has-error' : ''}`}>
      <label htmlFor={props.id}>{label}</label>
      <input type="date" {...props} />
      {hasError && <span className="field-error">{error}</span>}
    </div>
  );
};
