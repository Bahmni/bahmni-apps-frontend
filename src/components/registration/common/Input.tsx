import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, touched, ...props }) => {
  const hasError = touched && error;
  return (
    <div className={`form-field ${hasError ? 'has-error' : ''}`}>
      <label htmlFor={props.id}>{label}</label>
      <input {...props} />
      {hasError && <span className="field-error">{error}</span>}
    </div>
  );
};
