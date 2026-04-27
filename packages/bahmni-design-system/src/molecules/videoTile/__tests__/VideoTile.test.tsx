import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoTile } from '../VideoTile';

describe('VideoTile', () => {
  const defaultProps = {
    videoSrc: '100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.mp4',
    id: 'test-video',
  };

  it('should render thumbnail button, video and play icon overlay', () => {
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

    const playIcon = screen.getByTestId('test-video-video-play-test-id');
    expect(playIcon).toBeInTheDocument();
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

  it('should render icon and hide thumbnail when hideThumbnail is true', () => {
    render(<VideoTile {...defaultProps} hideThumbnail />);

    const button = screen.getByTestId('test-video-test-id');
    expect(button).toHaveClass('hideThumbnail');

    const icon = screen.getByTestId('test-video-hidden-thumbnail-test-id');
    expect(icon).toBeInTheDocument();

    const thumbnailVideo = screen.queryByTestId('test-video-thumbnail-test-id');
    expect(thumbnailVideo).not.toBeInTheDocument();

    const playIcon = screen.queryByTestId('test-video-video-play-test-id');
    expect(playIcon).not.toBeInTheDocument();
  });

  it('should still open modal when hideThumbnail is true and thumbnail is clicked', async () => {
    render(
      <VideoTile {...defaultProps} modalTitle="Video Preview" hideThumbnail />,
    );

    const button = screen.getByTestId('test-video-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Video Preview')).toBeInTheDocument();
      expect(
        screen.getByTestId('test-video-modal-video-test-id'),
      ).toBeInTheDocument();
    });
  });

  it('should apply custom className to thumbnail button', () => {
    render(<VideoTile {...defaultProps} className="custom-class" />);

    const button = screen.getByTestId('test-video-test-id');
    expect(button).toHaveClass('custom-class');
  });

  it('should not render modal initially', () => {
    render(<VideoTile {...defaultProps} modalTitle="Video Preview" />);

    const modalVideo = screen.queryByTestId('test-video-modal-video-test-id');
    expect(modalVideo).not.toBeInTheDocument();
  });
});
