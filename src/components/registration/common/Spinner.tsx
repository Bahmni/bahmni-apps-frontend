import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label }) => {
  return (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-icon" />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
};
