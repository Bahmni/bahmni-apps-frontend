import { renderHook } from '@testing-library/react';
import { useFileSelection } from '../useFileSelection';

const mockAddNotification = jest.fn();
jest.mock('../../notification', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

const file = (name: string, type: string, sizeBytes = 10) =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('useFileSelection', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('with configured extensions', () => {
    const options = { supportedFileTypes: ['.pdf', 'JPEG', '.png'] };

    it('accepts files whose extension is listed, ignoring case and leading dot', () => {
      const { result } = renderHook(() => useFileSelection(options));
      const files = [
        file('report.PDF', 'application/pdf'),
        file('scan.jpeg', 'image/jpeg'),
        file('photo.png', 'image/png'),
      ];

      expect(result.current.selectFiles(files)).toEqual(files);
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('rejects other extensions and reports the invalid type once', () => {
      const { result } = renderHook(() => useFileSelection(options));
      const pdf = file('report.pdf', 'application/pdf');

      const accepted = result.current.selectFiles([
        pdf,
        file('notes.docx', 'application/msword'),
        file('movie.mp4', 'video/mp4'),
        file('no-extension', 'image/png'),
      ]);

      expect(accepted).toEqual([pdf]);
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'DOCUMENT_UPLOAD_INVALID_TYPE_TITLE',
          type: 'error',
        }),
      );
    });

    it('exposes the extensions as dotted accept values', () => {
      const { result } = renderHook(() => useFileSelection(options));

      expect(result.current.accept).toEqual(['.pdf', '.jpeg', '.png']);
    });
  });

  describe('without configured extensions', () => {
    it('accepts images, videos and PDFs by MIME type', () => {
      const { result } = renderHook(() => useFileSelection());
      const files = [
        file('a.png', 'image/png'),
        file('b.mp4', 'video/mp4'),
        file('c.pdf', 'application/pdf'),
      ];

      expect(result.current.selectFiles(files)).toEqual(files);
    });

    it('rejects other MIME types', () => {
      const { result } = renderHook(() => useFileSelection());

      expect(
        result.current.selectFiles([file('a.zip', 'application/zip')]),
      ).toEqual([]);
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('size limit', () => {
    it('rejects files over the limit and reports the size once', () => {
      const { result } = renderHook(() =>
        useFileSelection({ maxFileSizeMb: 1 }),
      );
      const small = file('small.png', 'image/png', 1000);

      const accepted = result.current.selectFiles([
        small,
        file('big.png', 'image/png', 1000 * 1000 + 1),
        file('bigger.png', 'image/png', 2 * 1000 * 1000),
      ]);

      expect(accepted).toEqual([small]);
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE',
          message: 'DOCUMENT_UPLOAD_SIZE_EXCEEDED_MESSAGE',
        }),
      );
    });

    it('accepts a file exactly at the limit', () => {
      const { result } = renderHook(() =>
        useFileSelection({ maxFileSizeMb: 1 }),
      );
      const exact = file('exact.png', 'image/png', 1000 * 1000);

      expect(result.current.selectFiles([exact])).toEqual([exact]);
    });

    it('applies no limit when none is configured', () => {
      const { result } = renderHook(() => useFileSelection());
      const huge = file('huge.png', 'image/png', 50 * 1000 * 1000);

      expect(result.current.selectFiles([huge])).toEqual([huge]);
    });
  });

  it('reports both problems when a batch has unsupported and oversized files', () => {
    const { result } = renderHook(() => useFileSelection({ maxFileSizeMb: 1 }));

    result.current.selectFiles([
      file('a.zip', 'application/zip'),
      file('big.png', 'image/png', 2 * 1000 * 1000),
    ]);

    expect(mockAddNotification).toHaveBeenCalledTimes(2);
  });
});
