import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormCardContainer } from '../FormCardContainer';

describe('FormCardContainer', () => {
  it('renders with title and children', () => {
    render(
      <FormCardContainer title="Test Forms">
        <div>Form Card 1</div>
        <div>Form Card 2</div>
      </FormCardContainer>,
    );

    expect(screen.getByText('Test Forms')).toBeInTheDocument();
    expect(screen.getByText('Form Card 1')).toBeInTheDocument();
    expect(screen.getByText('Form Card 2')).toBeInTheDocument();
  });

  it('renders nothing when no children and showNoFormsMessage is false', () => {
    const { container } = render(
      <FormCardContainer title="Empty Forms">{null}</FormCardContainer>,
    );

    expect(screen.getByText('Empty Forms')).toBeInTheDocument();
    expect(screen.queryByText('No forms found')).not.toBeInTheDocument();

    // Should only have title div, no forms grid or message
    const formCardContainer = container.firstChild;
    expect(formCardContainer?.childNodes).toHaveLength(1);
  });

  it('shows no forms message when no children and showNoFormsMessage is true', () => {
    render(
      <FormCardContainer title="Empty Forms" showNoFormsMessage>
        {null}
      </FormCardContainer>,
    );

    expect(screen.getByText('Empty Forms')).toBeInTheDocument();
    expect(screen.getByText('No forms found')).toBeInTheDocument();
  });

  it('shows custom no forms message', () => {
    render(
      <FormCardContainer
        title="Custom Empty"
        noFormsMessage="Custom message here"
        showNoFormsMessage
      >
        {null}
      </FormCardContainer>,
    );

    expect(screen.getByText('Custom Empty')).toBeInTheDocument();
    expect(screen.getByText('Custom message here')).toBeInTheDocument();
    expect(screen.queryByText('No forms found')).not.toBeInTheDocument();
  });
});
