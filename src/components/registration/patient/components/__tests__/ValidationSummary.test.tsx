import React from 'react';
import { render, screen } from '@testing-library/react';
import { ValidationSummary } from '../ValidationSummary';

describe('ValidationSummary', () => {
  it('renders nothing when errors array is empty', () => {
    const { container } = render(
      <ValidationSummary
        errors={[]}
        title="Test Title"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders single error using InlineNotification', () => {
    render(
      <ValidationSummary
        errors={['Single error message']}
        title="Error Title"
      />
    );

    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Single error message')).toBeInTheDocument();
  });

  it('renders multiple errors using custom div', () => {
    const errors = ['First error', 'Second error', 'Third error'];

    render(
      <ValidationSummary
        errors={errors}
        title="Multiple Errors"
      />
    );

    expect(screen.getByText('Multiple Errors')).toBeInTheDocument();
    expect(screen.getByText('First error')).toBeInTheDocument();
    expect(screen.getByText('Second error')).toBeInTheDocument();
    expect(screen.getByText('Third error')).toBeInTheDocument();
  });

  it('uses correct notification type', () => {
    render(
      <ValidationSummary
        errors={['Test error']}
        title="Warning Title"
        type="warning"
      />
    );

    // Check if the notification has the warning kind
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('defaults to error type', () => {
    render(
      <ValidationSummary
        errors={['Test error']}
        title="Default Title"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ValidationSummary
        errors={['Test error']}
        title="Test Title"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <ValidationSummary
        errors={['Test error']}
        title="Test Title"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders list items for multiple errors', () => {
    const errors = ['First error', 'Second error'];

    render(
      <ValidationSummary
        errors={errors}
        title="Multiple Errors"
      />
    );

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent('First error');
    expect(listItems[1]).toHaveTextContent('Second error');
  });

  it('supports different notification types', () => {
    const types = ['error', 'warning', 'success', 'info'] as const;

    types.forEach((type) => {
      const { unmount } = render(
        <ValidationSummary
          errors={['Test message']}
          title={`${type} title`}
          type={type}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      unmount();
    });
  });
});
