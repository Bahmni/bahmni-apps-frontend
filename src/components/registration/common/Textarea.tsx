import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  touched?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, touched, ...props }) => {
  const hasError = touched && error;
  return (
    <div className={`form-field ${hasError ? 'has-error' : ''}`}>
      <label htmlFor={props.id}>{label}</label>
      <textarea {...props} />
      {hasError && <span className="field-error">{error}</span>}
    </div>
  );
};
