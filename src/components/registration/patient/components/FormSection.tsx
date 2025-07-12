/**
 * FormSection Component
 * Reusable component for consistent section grouping with Carbon styling
 */
import React from 'react';

interface FormSectionProps {
  /** The title of the section */
  title: string;
  /** The content of the section */
  children: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** The heading level for accessibility */
  headingLevel?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * FormSection component for consistent section grouping
 * Uses semantic HTML with Carbon design tokens for proper structure
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  className,
  headingLevel = 'h3',
}) => {
  const HeadingTag = headingLevel;

  return (
    <section className={className} style={{ marginBottom: '2rem' }}>
      <HeadingTag style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#161616',
        marginBottom: '1rem',
        lineHeight: '1.4'
      }}>
        {title}
      </HeadingTag>
      <div style={{ marginLeft: '0' }}>
        {children}
      </div>
    </section>
  );
};

export default FormSection;
