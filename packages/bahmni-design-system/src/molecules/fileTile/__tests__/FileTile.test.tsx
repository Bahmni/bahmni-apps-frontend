import { render, screen, fireEvent } from '@testing-library/react';
import { FileTile } from '../FileTile';

describe('FileTile', () => {
  const defaultProps = {
    id: 'test-file',
    src: 'test-document.pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render file tile button with document icon', () => {
    render(<FileTile {...defaultProps} />);

    const button = screen.getByTestId('test-file-test-id');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    const documentIcon = screen.getByTestId(
      'test-file-document-thumbnail-test-id',
    );
    expect(documentIcon).toBeInTheDocument();
  });

  it('should open modal with iframe when button is clicked', () => {
    render(<FileTile {...defaultProps} />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    const modal = screen.getByTestId('test-file-modal-test-id');
    expect(modal).toBeInTheDocument();

    const iframe = screen.getByTestId('test-file-modal-iframe-test-id');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      '/openmrs/auth?requested_document=/document_images/test-document.pdf',
    );
  });

  it('should close modal when onRequestClose is called', () => {
    render(<FileTile {...defaultProps} />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    expect(screen.getByTestId('test-file-modal-test-id')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(
      screen.queryByTestId('test-file-modal-test-id'),
    ).not.toBeInTheDocument();
  });

  it('should call onModalOpen callback when modal opens', () => {
    const onModalOpen = jest.fn();
    render(<FileTile {...defaultProps} onModalOpen={onModalOpen} />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    expect(onModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose callback when modal closes', () => {
    const onModalClose = jest.fn();
    render(<FileTile {...defaultProps} onModalClose={onModalClose} />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className to button', () => {
    render(<FileTile {...defaultProps} className="custom-class" />);

    const button = screen.getByTestId('test-file-test-id');
    expect(button).toHaveClass('custom-class');
  });

  it('should display modal with custom title when modalTitle is provided', () => {
    render(<FileTile {...defaultProps} modalTitle="Test Document" />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });
});
