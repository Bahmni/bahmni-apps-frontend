/**
 * ValidationSummary Component
 * Reusable component for consistent validation feedback with Carbon styling
 */
import React from 'react';
import { InlineNotification } from '@carbon/react';

interface ValidationSummaryProps {
  /** Array of error messages */
  errors: string[];
  /** The type of notification */
  type?: 'error' | 'warning' | 'success' | 'info';
  /** The title of the notification */
  title: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * ValidationSummary component for consistent validation feedback
 * Uses Carbon's InlineNotification component for consistent styling
 */
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  type = 'error',
  title,
  className,
}) => {
  if (errors.length === 0) {
    return null;
  }

  // For single error, use subtitle
  if (errors.length === 1) {
    return (
      <InlineNotification
        kind={type}
        title={title}
        subtitle={errors[0]}
        hideCloseButton
        className={className}
        role="alert"
        style={{ marginBottom: '1rem' }}
      />
    );
  }

  // For multiple errors, use a custom approach
  return (
    <div
      className={className}
      role="alert"
      style={{
        marginBottom: '1rem',
        padding: '1rem',
        border: `1px solid ${type === 'error' ? '#da1e28' : '#0f62fe'}`,
        borderRadius: '4px',
        backgroundColor: type === 'error' ? '#fff1f1' : '#f4f4f4'
      }}
    >
      <h4 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '1rem',
        fontWeight: '600',
        color: type === 'error' ? '#da1e28' : '#0f62fe'
      }}>
        {title}
      </h4>
      <ul style={{
        margin: '0',
        paddingLeft: '1rem',
        listStyle: 'disc'
      }}>
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary;
