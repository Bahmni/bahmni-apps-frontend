import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageThumbnail } from '../ImageThumbnail';

jest.mock('../styles/ImageThumbnail.module.scss', () => ({
  thumbnailButton: 'thumbnailButton-class',
  thumbnailImage: 'thumbnailImage-class',
  modalImageContainer: 'modalImageContainer-class',
  modalImage: 'modalImage-class',
}));

describe('ImageThumbnail', () => {
  const defaultProps = {
    imageSrc: 'https://example.com/image.jpg',
    alt: 'Test image',
    id: 'test-image',
  };

  it('should render thumbnail button and image', () => {
    render(<ImageThumbnail {...defaultProps} />);

    const button = screen.getByTestId('test-image-test-id');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    const thumbnailImage = screen.getByTestId('test-image-thumbnail-test-id');
    expect(thumbnailImage).toBeInTheDocument();
    expect(thumbnailImage).toHaveAttribute(
      'src',
      'https://example.com/image.jpg',
    );
    expect(thumbnailImage).toHaveAttribute('alt', 'Test image');
  });

  it('should open modal when thumbnail is clicked', async () => {
    render(<ImageThumbnail {...defaultProps} modalTitle="Image Preview" />);

    const button = screen.getByTestId('test-image-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Image Preview')).toBeInTheDocument();
    });
  });

  it('should call onModalOpen callback when modal opens', () => {
    const onModalOpen = jest.fn();
    render(<ImageThumbnail {...defaultProps} onModalOpen={onModalOpen} />);

    const button = screen.getByTestId('test-image-test-id');
    fireEvent.click(button);

    expect(onModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose callback when modal closes', async () => {
    const onModalClose = jest.fn();
    render(
      <ImageThumbnail
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
