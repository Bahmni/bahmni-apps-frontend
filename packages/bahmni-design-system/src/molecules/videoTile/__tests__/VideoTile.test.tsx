import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoTile } from '../VideoTile';

jest.mock('../styles/VideoTile.module.scss', () => ({
  thumbnailButton: 'thumbnailButton-class',
  thumbnailVideo: 'thumbnailVideo-class',
  playIconOverlay: 'playIconOverlay-class',
  playIcon: 'playIcon-class',
  modalVideoContainer: 'modalVideoContainer-class',
  modalVideo: 'modalVideo-class',
}));

describe('VideoTile', () => {
  const defaultProps = {
    videoSrc: '100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.mp4',
    alt: 'Test video',
    id: 'test-video',
  };

  it('should render thumbnail button and video', () => {
    render(<VideoTile {...defaultProps} />);

    const button = screen.getByTestId('test-video-test-id');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    const thumbnailVideo = screen.getByTestId('test-video-thumbnail-test-id');
    expect(thumbnailVideo).toBeInTheDocument();

    const source = thumbnailVideo.querySelector('source');
    expect(source).toBeInTheDocument();
    expect(source).toHaveAttribute(
      'src',
      '/openmrs/auth?requested_document=/document_images/100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.mp4#t=0.1',
    );
  });

  it('should open modal when thumbnail is clicked', async () => {
    render(<VideoTile {...defaultProps} modalTitle="Video Preview" />);

    const button = screen.getByTestId('test-video-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Video Preview')).toBeInTheDocument();
    });
  });

  it('should call onModalOpen callback when modal opens', () => {
    const onModalOpen = jest.fn();
    render(<VideoTile {...defaultProps} onModalOpen={onModalOpen} />);

    const button = screen.getByTestId('test-video-test-id');
    fireEvent.click(button);

    expect(onModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose callback when modal closes', async () => {
    const onModalClose = jest.fn();
    render(
      <VideoTile
        {...defaultProps}
        modalTitle="Video Preview"
        onModalClose={onModalClose}
      />,
    );

    const button = screen.getByTestId('test-video-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Video Preview')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('should render modal video with controls and autoPlay', async () => {
    render(<VideoTile {...defaultProps} modalTitle="Video Preview" />);

    const button = screen.getByTestId('test-video-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      const modalVideo = screen.getByTestId('test-video-modal-video-test-id');
      expect(modalVideo).toBeInTheDocument();
      expect(modalVideo).toHaveAttribute('controls');
      expect(modalVideo).toHaveAttribute('autoplay');
      expect(modalVideo).toHaveAttribute(
        'src',
        '/openmrs/auth?requested_document=/document_images/100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.mp4',
      );
    });
  });
});
