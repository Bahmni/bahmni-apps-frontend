import { useCamera } from '@bahmni-frontend/bahmni-services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientPhotoUpload } from './PatientPhotoUpload';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  useCamera: jest.fn(),
}));

const mockUseCamera = useCamera as jest.MockedFunction<typeof useCamera>;

describe('PatientPhotoUpload', () => {
  const mockOnPhotoConfirm = jest.fn();
  const mockStart = jest.fn();
  const mockStop = jest.fn();
  const mockCapture = jest.fn();
  const mockVideoRef = { current: document.createElement('video') };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCamera.mockReturnValue({
      videoRef: mockVideoRef,
      start: mockStart,
      stop: mockStop,
      capture: mockCapture,
    });
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
    global.alert = jest.fn();

    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(),
      canvas: {
        toDataURL: jest.fn(() => 'data:image/jpeg;base64,mockdata'),
      },
    })) as any;

    HTMLCanvasElement.prototype.toDataURL = jest.fn(
      () => 'data:image/jpeg;base64,mockdata',
    );

    global.Image = class {
      onload: (() => void) | null = null;
      src = '';
      naturalWidth = 100;
      naturalHeight = 100;
      width = 100;
      height = 100;

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;
  });

  describe('Initial render and button states', () => {
    it('should render upload and capture buttons when no photo is confirmed', () => {
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      expect(
        screen.getByRole('button', { name: /CREATE_PATIENT_UPLOAD_PHOTO$/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /CREATE_PATIENT_CAPTURE_PHOTO/ }),
      ).toBeInTheDocument();
    });

    it('should render confirmed photo with remove button after photo is confirmed', async () => {
      const user = userEvent.setup();
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      const uploadBtn = screen.getByRole('button', {
        name: /CREATE_PATIENT_UPLOAD_PHOTO$/,
      });
      await user.click(uploadBtn);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const input = screen.getByLabelText(
        /CREATE_PATIENT_UPLOAD_PHOTO_CHOOSE_FILE/,
      );
      await user.upload(input, file);

      const confirmBtn = screen.getByRole('button', {
        name: /CREATE_PATIENT_UPLOAD_PHOTO_CONFIRM/,
      });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByAltText('Patient')).toBeInTheDocument();
        expect(
          screen.getByRole('button', {
            name: 'CREATE_PATIENT_UPLOAD_PHOTO_REMOVE',
          }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Upload modal functionality', () => {
    it('should open upload modal and handle file upload with validation', async () => {
      const user = userEvent.setup();
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      const uploadBtn = screen.getByRole('button', {
        name: /CREATE_PATIENT_UPLOAD_PHOTO$/,
      });
      await user.click(uploadBtn);

      expect(
        screen.getByText(/CREATE_PATIENT_UPLOAD_PHOTO_MODAL_HEADING/),
      ).toBeInTheDocument();

      const validFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(validFile, 'size', { value: 100 * 1024 });

      const input = screen.getByLabelText(
        /CREATE_PATIENT_UPLOAD_PHOTO_CHOOSE_FILE/,
      );
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
      });
    });

    it('should show error when file size exceeds 500KB limit', async () => {
      const user = userEvent.setup();
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /CREATE_PATIENT_UPLOAD_PHOTO$/ }),
      );

      const largeFile = new File(['test'], 'large.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(largeFile, 'size', { value: 600 * 1024 });

      const input = screen.getByLabelText(
        /CREATE_PATIENT_UPLOAD_PHOTO_CHOOSE_FILE/,
      );
      await user.upload(input, largeFile);

      expect(
        screen.getByText(/CREATE_PATIENT_UPLOAD_PHOTO_FILE_SIZE_ERROR/),
      ).toBeInTheDocument();
    });

    it('should close modal and cleanup on close button click', async () => {
      const user = userEvent.setup();
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /CREATE_PATIENT_UPLOAD_PHOTO$/ }),
      );

      const closeBtn = screen.getByRole('button', { name: /close/i });
      await user.click(closeBtn);

      expect(mockStop).toHaveBeenCalled();
      expect(
        screen.queryByText(/CREATE_PATIENT_UPLOAD_PHOTO_MODAL_HEADING/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Capture modal functionality', () => {
    it('should open capture modal and start camera', async () => {
      const user = userEvent.setup();
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      const captureBtn = screen.getByRole('button', {
        name: /CREATE_PATIENT_CAPTURE_PHOTO/,
      });
      await user.click(captureBtn);

      expect(
        screen.getByText(/CREATE_PATIENT_CAPTURE_PHOTO_MODAL_HEADING/),
      ).toBeInTheDocument();
      expect(mockStart).toHaveBeenCalled();
    });

    it('should handle camera capture and show preview with confirm/retake buttons', async () => {
      const user = userEvent.setup();
      mockCapture.mockReturnValue('data:image/png;base64,mockdata');

      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /CREATE_PATIENT_CAPTURE_PHOTO/ }),
      );

      const captureBtn = screen.getAllByRole('button', {
        name: /CREATE_PATIENT_CAPTURE_PHOTO/,
      })[1];
      await user.click(captureBtn);

      expect(mockCapture).toHaveBeenCalled();
      expect(mockStop).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
        expect(
          screen.getByRole('button', {
            name: /CREATE_PATIENT_UPLOAD_PHOTO_CONFIRM/,
          }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', {
            name: /CREATE_PATIENT_UPLOAD_PHOTO_RETAKE/,
          }),
        ).toBeInTheDocument();
      });
    });

    it('should handle camera permission error and close modal', async () => {
      const user = userEvent.setup();
      mockStart.mockRejectedValueOnce(new Error('Permission denied'));

      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /CREATE_PATIENT_CAPTURE_PHOTO/ }),
      );

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'CREATE_PATIENT_CAMERA_ACCESS_ERROR',
        );
      });
    });
  });

  describe('Photo confirmation and removal', () => {
    it('should confirm photo, convert to JPEG base64, and call onPhotoConfirm', async () => {
      const user = userEvent.setup();
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /CREATE_PATIENT_UPLOAD_PHOTO$/ }),
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const input = screen.getByLabelText(
        /CREATE_PATIENT_UPLOAD_PHOTO_CHOOSE_FILE/,
      );
      await user.upload(input, file);

      const confirmBtn = screen.getByRole('button', {
        name: /CREATE_PATIENT_UPLOAD_PHOTO_CONFIRM/,
      });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(mockOnPhotoConfirm).toHaveBeenCalledWith(expect.any(String));
        expect(mockOnPhotoConfirm.mock.calls[0][0]).toBeTruthy();
      });
    });

    it('should remove confirmed photo and clear state', async () => {
      const user = userEvent.setup();
      render(<PatientPhotoUpload onPhotoConfirm={mockOnPhotoConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /CREATE_PATIENT_UPLOAD_PHOTO$/ }),
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const input = screen.getByLabelText(
        /CREATE_PATIENT_UPLOAD_PHOTO_CHOOSE_FILE/,
      );
      await user.upload(input, file);

      await user.click(
        screen.getByRole('button', {
          name: /CREATE_PATIENT_UPLOAD_PHOTO_CONFIRM/,
        }),
      );

      await waitFor(() => {
        expect(screen.getByAltText('Patient')).toBeInTheDocument();
      });

      const removeBtn = screen.getByRole('button', {
        name: 'CREATE_PATIENT_UPLOAD_PHOTO_REMOVE',
      });
      await user.click(removeBtn);

      expect(
        screen.getByRole('button', { name: /CREATE_PATIENT_UPLOAD_PHOTO$/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /CREATE_PATIENT_CAPTURE_PHOTO/ }),
      ).toBeInTheDocument();
    });
  });
});
