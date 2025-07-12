/**
 * DataField Component
 * Reusable component for displaying label-value pairs with consistent Carbon styling
 */
import React from 'react';

interface DataFieldProps {
  /** The label for the data field */
  label: string;
  /** The value to display */
  value: string | React.ReactNode;
  /** Whether this field is required */
  required?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * DataField component for displaying structured label-value pairs
 * Uses semantic HTML with Carbon design tokens for consistent styling
 */
export const DataField: React.FC<DataFieldProps> = ({
  label,
  value,
  required = false,
  className,
}) => {
  return (
    <div className={className} style={{ marginBottom: '0.5rem' }}>
      <dt style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#525252',
        marginBottom: '0.25rem'
      }}>
        {label}
        {required && <span aria-label="required"> *</span>}:
      </dt>
      <dd style={{
        fontSize: '1rem',
        color: '#161616',
        margin: '0'
      }}>
        {value}
      </dd>
    </div>
  );
};

export default DataField;
