import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileTile } from '../FileTile';

describe('FileTile', () => {
  const defaultProps = {
    src: '100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.pdf',
    id: 'test-file',
  };

  it('should render thumbnail button with DocumentView icon', () => {
    render(<FileTile {...defaultProps} />);

    const button = screen.getByTestId('test-file-test-id');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    const icon = screen.getByTestId('test-file-document-thumbnail-test-id');
    expect(icon).toBeInTheDocument();
  });

  it('should open modal when thumbnail is clicked', async () => {
    render(<FileTile {...defaultProps} modalTitle="PDF Preview" />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('PDF Preview')).toBeInTheDocument();
    });
  });

  it('should call onModalOpen callback when modal opens', () => {
    const onModalOpen = jest.fn();
    render(<FileTile {...defaultProps} onModalOpen={onModalOpen} />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    expect(onModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose callback when modal closes', async () => {
    const onModalClose = jest.fn();
    render(
      <FileTile
        {...defaultProps}
        modalTitle="PDF Preview"
        onModalClose={onModalClose}
      />,
    );

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('PDF Preview')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('should render modal iframe with correct src', async () => {
    render(<FileTile {...defaultProps} modalTitle="PDF Preview" />);

    const button = screen.getByTestId('test-file-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      const iframe = screen.getByTestId('test-file-modal-iframe-test-id');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        'src',
        '/openmrs/auth?requested_document=/document_images/100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.pdf#toolbar=0',
      );
    });
  });

  it('should apply custom className when provided', () => {
    const { container } = render(
      <FileTile {...defaultProps} className="custom-class" />,
    );

    const button = container.querySelector('.fileTileButton');
    expect(button).toHaveClass('custom-class');
  });
});
