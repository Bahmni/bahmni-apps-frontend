import { render, screen, fireEvent } from '@testing-library/react';
import { FileTile } from '../FileTile';

jest.mock('../styles/FileTile.module.scss', () => ({
  fileTileButton: 'fileTileButton-class',
}));

describe('FileTile', () => {
  const defaultProps = {
    fileName: 'test-document.pdf',
    id: 'test-file',
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render file tile button with icon', () => {
    render(<FileTile {...defaultProps} />);

    const button = screen.getByTestId('test-file-test-id');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    const icon = screen.getByTestId('test-file-icon-test-id');
    expect(icon).toBeInTheDocument();
  });

  it('should call onClick callback when button is clicked', () => {
    const onClick = jest.fn();
    render(<FileTile {...defaultProps} onClick={onClick} />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render with custom icon when iconName is provided', () => {
    render(<FileTile {...defaultProps} iconName="fa-file-pdf" />);

    const button = screen.getByTestId('test-file-test-id');
    expect(button).toBeInTheDocument();
  });

  it('should render with default fa-file icon when iconName is not provided', () => {
    render(<FileTile {...defaultProps} />);

    const button = screen.getByTestId('test-file-test-id');
    expect(button).toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    const { container } = render(
      <FileTile {...defaultProps} className="custom-class" />,
    );

    const button = container.querySelector('.fileTileButton-class');
    expect(button).toHaveClass('custom-class');
  });
});
