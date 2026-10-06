import { uploadImportFile } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { useCsvUpload } from '../useCsvUpload';
import { IMPORTED_ITEMS_QUERY_KEY } from '../useImportedItems';

const mockAddNotification = jest.fn();
jest.mock('@bahmni/services', () => ({
  uploadImportFile: jest.fn(),
}));
jest.mock('@bahmni/widgets', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

const mockUpload = uploadImportFile as jest.MockedFunction<
  typeof uploadImportFile
>;
const importType = { key: 'concept', labelKey: 'K', url: '/upload/concept' };

const setup = () => {
  const queryClient = new QueryClient();
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () =>
      useCsvUpload({
        successTitle: 'Done',
        successMessage: (name) => `${name} ok`,
      }),
    { wrapper },
  );
  return { ...hook, invalidate };
};

describe('useCsvUpload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads files one at a time and reloads history once at the end', async () => {
    const order: string[] = [];
    mockUpload.mockImplementation(async (_url, file) => {
      order.push(`start ${file.name}`);
      await Promise.resolve();
      order.push(`end ${file.name}`);
    });
    const { result, invalidate } = setup();
    const files = ['a.csv', 'b.csv', 'c.csv'].map((n) => new File(['x'], n));

    await act(() => result.current.upload(files, importType));

    expect(order).toEqual([
      'start a.csv',
      'end a.csv',
      'start b.csv',
      'end b.csv',
      'start c.csv',
      'end c.csv',
    ]);
    expect(mockUpload).toHaveBeenCalledWith(
      '/upload/concept',
      files[0],
      '',
      expect.any(Function),
    );
    expect(mockAddNotification).toHaveBeenCalledTimes(3);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', message: 'a.csv ok' }),
    );
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: IMPORTED_ITEMS_QUERY_KEY,
    });
    expect(result.current.isUploading).toBe(false);
  });

  it('continues after a failed file without notifying, and still reloads history', async () => {
    mockUpload.mockRejectedValueOnce(new Error('500'));
    mockUpload.mockResolvedValueOnce();
    const { result, invalidate } = setup();
    const files = ['a.csv', 'b.csv'].map((n) => new File(['x'], n));

    await act(() => result.current.upload(files, importType));

    expect(mockUpload).toHaveBeenCalledTimes(2);
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'b.csv ok' }),
    );
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('exposes per-file progress while uploading', async () => {
    let finish: () => void = () => undefined;
    mockUpload.mockImplementation(
      (_url, _file, _algo, onProgress) =>
        new Promise<void>((resolve) => {
          onProgress?.({ loaded: 50, total: 200 });
          finish = resolve;
        }),
    );
    const { result } = setup();

    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.upload([new File(['x'], 'big.csv')], importType);
    });

    expect(result.current.uploadState).toEqual({
      fileName: 'big.csv',
      fileIndex: 1,
      fileCount: 1,
      percent: 25,
    });
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      finish();
      await done;
    });
    expect(result.current.uploadState).toBeNull();
  });
});
