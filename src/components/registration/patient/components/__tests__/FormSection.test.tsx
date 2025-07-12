import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormSection } from '../FormSection';

describe('FormSection', () => {
  it('renders title and children correctly', () => {
    render(
      <FormSection title="Test Section">
        <div>Test content</div>
      </FormSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('uses correct heading level', () => {
    render(
      <FormSection title="Test Section" headingLevel="h2">
        <div>Test content</div>
      </FormSection>
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('defaults to h3 heading level', () => {
    render(
      <FormSection title="Test Section">
        <div>Test content</div>
      </FormSection>
    );

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FormSection title="Test Section" className="custom-class">
        <div>Test content</div>
      </FormSection>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses semantic section element', () => {
    render(
      <FormSection title="Test Section">
        <div>Test content</div>
      </FormSection>
    );

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('supports different heading levels', () => {
    const headingLevels = ['h2', 'h3', 'h4', 'h5', 'h6'] as const;

    headingLevels.forEach((level, index) => {
      const { unmount } = render(
        <FormSection title={`Test Section ${level}`} headingLevel={level}>
          <div>Test content</div>
        </FormSection>
      );

      expect(screen.getByRole('heading', { level: index + 2 })).toBeInTheDocument();
      unmount();
    });
  });
});
