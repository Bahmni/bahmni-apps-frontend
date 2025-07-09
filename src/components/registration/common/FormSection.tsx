import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children }) => {
  return (
    <div className="form-section">
      <h3>{title}</h3>
      <div className="form-section-content">{children}</div>
    </div>
  );
};
