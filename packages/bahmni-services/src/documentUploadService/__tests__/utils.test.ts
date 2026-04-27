import { processFileForUpload } from '../utils';

describe('processFileForUpload', () => {
  const mockFileReaderInstance = {
    readAsDataURL: jest.fn(),
    onload: null as any,
    onerror: null as any,
    result: null as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).FileReader = jest.fn(() => mockFileReaderInstance);
  });

  it('should process image file and return base64 content with metadata', async () => {
    const mockFile = new File(
      ['test'],
      'Screenshot 2025-03-22 at 7.10.26 PM.png',
      {
        type: 'image/png',
      },
    );

    const processPromise = processFileForUpload(mockFile);

    mockFileReaderInstance.result =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
    mockFileReaderInstance.onload();

    const result = await processPromise;

    expect(result).toEqual({
      content: 'iVBORw0KGgoAAAANSUhEUgAAAAUA',
      fileName: 'Screenshot 2025-03-22 at 7.10.26 PM',
      fileType: 'image',
      format: 'png',
    });
    expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(mockFile);
  });

  it('should process PDF file correctly', async () => {
    const mockFile = new File(['test'], 'document.pdf', {
      type: 'application/pdf',
    });

    const processPromise = processFileForUpload(mockFile);

    mockFileReaderInstance.result = 'data:application/pdf;base64,JVBERi0xLjQK';
    mockFileReaderInstance.onload();

    const result = await processPromise;

    expect(result).toEqual({
      content: 'JVBERi0xLjQK',
      fileName: 'document',
      fileType: 'application',
      format: 'pdf',
    });
  });

  it('should handle file without extension', async () => {
    const mockFile = new File(['test'], 'file-without-extension', {
      type: 'text/plain',
    });

    const processPromise = processFileForUpload(mockFile);

    mockFileReaderInstance.result = 'data:text/plain;base64,dGVzdA==';
    mockFileReaderInstance.onload();

    const result = await processPromise;

    expect(result).toEqual({
      content: 'dGVzdA==',
      fileName: 'file-without-extension',
      fileType: 'text',
      format: '',
    });
  });

  it('should handle file without MIME type', async () => {
    const mockFile = new File(['test'], 'file.bin', { type: '' });

    const processPromise = processFileForUpload(mockFile);

    mockFileReaderInstance.result = 'data:;base64,dGVzdA==';
    mockFileReaderInstance.onload();

    const result = await processPromise;

    expect(result.fileType).toBe('application');
  });

  it('should reject when file reading fails', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    const processPromise = processFileForUpload(mockFile);
    mockFileReaderInstance.onerror();

    await expect(processPromise).rejects.toThrow('Failed to read file');
  });
});
