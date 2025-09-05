import { render, screen, fireEvent } from '@testing-library/react';
import { FormCard } from '../FormCard';

// Mock the Icon component
jest.mock('../../icon', () => ({
  Icon: ({ name, id }: { name: string; id: string }) => (
    <div data-testid={id}>{name}</div>
  ),
  ICON_SIZE: {
    SM: 'sm',
    LG: 'lg',
  },
  ICON_PADDING: {
    NONE: 'none',
  },
}));

describe('FormCard', () => {
  const defaultProps = {
    title: 'Test Card',
    icon: 'fa-test',
  };

  it('renders with basic props', () => {
    render(<FormCard {...defaultProps} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByTestId('card-icon-fa-test')).toBeInTheDocument();
  });

  it('renders with action icon', () => {
    const onActionClick = jest.fn();
    render(
      <FormCard
        {...defaultProps}
        actionIcon="fa-close"
        onActionClick={onActionClick}
      />,
    );

    expect(screen.getByTestId('action-icon-fa-close')).toBeInTheDocument();
  });

  it('calls onActionClick when action icon is clicked', () => {
    const onActionClick = jest.fn();
    render(
      <FormCard
        {...defaultProps}
        actionIcon="fa-close"
        onActionClick={onActionClick}
      />,
    );

    const actionIcon = screen.getByTestId('action-icon-fa-close').parentElement;
    fireEvent.click(actionIcon!);

    expect(onActionClick).toHaveBeenCalledTimes(1);
  });

  it('calls onCardClick when card is clicked', () => {
    const onCardClick = jest.fn();
    render(<FormCard {...defaultProps} onCardClick={onCardClick} />);

    const card = screen.getByTestId('form-card');
    fireEvent.click(card);

    expect(onCardClick).toHaveBeenCalledTimes(1);
  });

  it('does not call handlers when disabled', () => {
    const onCardClick = jest.fn();
    const onActionClick = jest.fn();

    render(
      <FormCard
        {...defaultProps}
        disabled
        onCardClick={onCardClick}
        actionIcon="fa-close"
        onActionClick={onActionClick}
      />,
    );

    const card = screen.getByTestId('form-card');
    fireEvent.click(card);

    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('applies selected class when selected', () => {
    render(<FormCard {...defaultProps} selected />);

    const card = screen.getByTestId('form-card');
    expect(card).toHaveClass('selected');
  });

  it('applies disabled class when disabled', () => {
    render(<FormCard {...defaultProps} disabled />);

    const card = screen.getByTestId('form-card');
    expect(card).toHaveClass('disabled');
  });

  it('supports keyboard navigation', () => {
    const onCardClick = jest.fn();
    render(<FormCard {...defaultProps} onCardClick={onCardClick} />);

    const card = screen.getByTestId('form-card');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onCardClick).toHaveBeenCalledTimes(1);
  });

  it('prioritizes onCardClick over onOpen', () => {
    const onCardClick = jest.fn();
    const onOpen = jest.fn();

    render(
      <FormCard {...defaultProps} onCardClick={onCardClick} onOpen={onOpen} />,
    );

    const card = screen.getByTestId('form-card');
    fireEvent.click(card);

    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('uses onOpen when onCardClick is not provided', () => {
    const onOpen = jest.fn();

    render(<FormCard {...defaultProps} onOpen={onOpen} />);

    const card = screen.getByTestId('form-card');
    fireEvent.click(card);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<FormCard {...defaultProps} className="custom-class" />);

    const card = screen.getByTestId('form-card');
    expect(card).toHaveClass('custom-class');
  });

  it('applies custom dataTestId', () => {
    render(<FormCard {...defaultProps} dataTestId="custom-test-id" />);

    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });
});
