import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageTile } from '../ImageTile';

jest.mock('../styles/ImageTile.module.scss', () => ({
  thumbnailButton: 'thumbnailButton-class',
  thumbnailImage: 'thumbnailImage-class',
  modalImageContainer: 'modalImageContainer-class',
  modalImage: 'modalImage-class',
}));

describe('ImageTile', () => {
  const defaultProps = {
    imageSrc: '100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.png',
    alt: 'Test image',
    id: 'test-image',
  };

  it('should render thumbnail button and image', () => {
    render(<ImageTile {...defaultProps} />);

    const button = screen.getByTestId('test-image-test-id');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    const thumbnailImage = screen.getByTestId('test-image-thumbnail-test-id');
    expect(thumbnailImage).toBeInTheDocument();
    expect(thumbnailImage).toHaveAttribute(
      'src',
      '/openmrs/auth?requested_document=/document_images/100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.png',
    );
    expect(thumbnailImage).toHaveAttribute('alt', 'Test image');
  });

  it('should open modal when thumbnail is clicked', async () => {
    render(<ImageTile {...defaultProps} modalTitle="Image Preview" />);

    const button = screen.getByTestId('test-image-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Image Preview')).toBeInTheDocument();
    });
  });

  it('should call onModalOpen callback when modal opens', () => {
    const onModalOpen = jest.fn();
    render(<ImageTile {...defaultProps} onModalOpen={onModalOpen} />);

    const button = screen.getByTestId('test-image-test-id');
    fireEvent.click(button);

    expect(onModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose callback when modal closes', async () => {
    const onModalClose = jest.fn();
    render(
      <ImageTile
        {...defaultProps}
        modalTitle="Image Preview"
        onModalClose={onModalClose}
      />,
    );

    const button = screen.getByTestId('test-image-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Image Preview')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onModalClose).toHaveBeenCalledTimes(1);
  });
});
