import React from 'react';

interface ValidationMessageProps {
  error?: string;
  touched?: boolean;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ error, touched }) => {
  if (!touched || !error) return null;
  return <span className="field-error">{error}</span>;
};
