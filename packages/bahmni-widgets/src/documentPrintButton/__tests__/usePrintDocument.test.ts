import {
  renderAsHtml,
  getUserPreferredLocale,
  notificationService,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { usePrintDocument, renderTemplateQueryKey } from '../usePrintDocument';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  renderAsHtml: jest.fn(),
  getUserPreferredLocale: jest.fn(() => 'en'),
  notificationService: { showError: jest.fn() },
  getFormattedError: jest.fn((error: unknown) => ({
    title: 'Error',
    message: error instanceof Error ? error.message : String(error),
  })),
}));

const mockRenderAsHtml = renderAsHtml as jest.MockedFunction<
  typeof renderAsHtml
>;
const mockGetUserPreferredLocale =
  getUserPreferredLocale as jest.MockedFunction<typeof getUserPreferredLocale>;
const mockShowError = notificationService.showError as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return Wrapper;
};

let mockPrint: jest.Mock;
let mockIframe: Record<string, unknown>;

interface MockImg {
  complete: boolean;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  _fire: (event: string) => void;
}

const buildMockImg = (complete: boolean): MockImg => {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    complete,
    addEventListener: jest.fn((event: string, handler: () => void) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(handler);
    }),
    removeEventListener: jest.fn((event: string, handler: () => void) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
    }),
    _fire: (event: string) => handlers[event]?.forEach((h) => h()),
  };
};

const buildMockIframe = (mockImages: MockImg[] = []) => {
  mockPrint = jest.fn();

  const mockContentWindow = { print: mockPrint };

  const mockContentDoc = {
    open: jest.fn(),
    write: jest.fn(),
    close: jest.fn(),
    querySelectorAll: jest.fn().mockReturnValue(mockImages),
  };

  return {
    _isMockIframe: true,
    style: { cssText: '' },
    setAttribute: jest.fn(),
    contentDocument: mockContentDoc,
    contentWindow: mockContentWindow,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUserPreferredLocale.mockReturnValue('en');

  mockIframe = buildMockIframe();

  const originalCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'iframe') return mockIframe as unknown as HTMLIFrameElement;
    return originalCreateElement(tag as any);
  });

  const originalAppendChild = document.body.appendChild.bind(document.body);
  jest.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
    if ((node as Record<string, unknown>)._isMockIframe) return node;
    return originalAppendChild(node);
  });

  const originalRemoveChild = document.body.removeChild.bind(document.body);
  jest.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => {
    if ((node as Record<string, unknown>)._isMockIframe) return node;
    return originalRemoveChild(node);
  });

  const originalContains = document.body.contains.bind(document.body);
  jest
    .spyOn(document.body, 'contains')
    .mockImplementation((node: Node | null) => {
      if ((node as Record<string, unknown> | null)?._isMockIframe) return true;
      return originalContains(node);
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePrintDocument', () => {
  const templateId = 'REG_CARD_V1';
  const options = {
    context: { patientUuid: 'patient-uuid-123' },
  };

  it('starts with isPrinting false', () => {
    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPrinting).toBe(false);
  });

  it('does not fetch HTML until triggerPrint is called', () => {
    renderHook(() => usePrintDocument(options), { wrapper: createWrapper() });

    expect(mockRenderAsHtml).not.toHaveBeenCalled();
  });

  it('sets isPrinting true and fetches HTML when triggered', async () => {
    const mockHtml = '<html><body>Card</body></html>';
    mockRenderAsHtml.mockResolvedValueOnce(mockHtml);

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    expect(result.current.isPrinting).toBe(true);

    await waitFor(() =>
      expect(mockRenderAsHtml).toHaveBeenCalledWith({
        templateId: 'REG_CARD_V1',
        format: 'html',
        locale: 'en',
        context: { patientUuid: 'patient-uuid-123' },
      }),
    );
  });

  it('writes HTML to iframe and prints immediately when there are no images', async () => {
    const mockHtml = '<html><body>Card</body></html>';
    mockRenderAsHtml.mockResolvedValueOnce(mockHtml);

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    await waitFor(() => expect(mockPrint).toHaveBeenCalled());

    const doc = mockIframe.contentDocument as Record<string, jest.Mock>;
    expect(doc.open).toHaveBeenCalled();
    expect(doc.write).toHaveBeenCalledWith(mockHtml);
    expect(doc.close).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(mockIframe);
  });

  it('prints immediately when all images are already complete', async () => {
    const completeImg = buildMockImg(true);
    mockIframe = buildMockIframe([completeImg]);

    mockRenderAsHtml.mockResolvedValueOnce(
      '<html><body><img src="/logo.png"/></body></html>',
    );

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    await waitFor(() => expect(mockPrint).toHaveBeenCalled());
    expect(completeImg.addEventListener).not.toHaveBeenCalled();
  });

  it('waits for all pending images to load before printing', async () => {
    const img1 = buildMockImg(false);
    const img2 = buildMockImg(false);
    mockIframe = buildMockIframe([img1, img2]);

    mockRenderAsHtml.mockResolvedValueOnce(
      '<html><body><img src="/a.png"/><img src="/b.png"/></body></html>',
    );

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    await waitFor(() =>
      expect(img1.addEventListener).toHaveBeenCalledWith(
        'load',
        expect.any(Function),
        { once: true },
      ),
    );

    expect(mockPrint).not.toHaveBeenCalled();

    act(() => {
      img1._fire('load');
    });
    expect(mockPrint).not.toHaveBeenCalled();

    act(() => {
      img2._fire('load');
    });
    expect(mockPrint).toHaveBeenCalled();
  });

  it('prints after 10 s timeout when an image never settles', async () => {
    jest.useFakeTimers();
    const img = buildMockImg(false);
    mockIframe = buildMockIframe([img]);

    mockRenderAsHtml.mockResolvedValueOnce(
      '<html><body><img src="/stalled.png"/></body></html>',
    );

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    await waitFor(() =>
      expect(img.addEventListener).toHaveBeenCalledWith(
        'load',
        expect.any(Function),
        { once: true },
      ),
    );

    expect(mockPrint).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockPrint).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('prints after an image fires an error (does not block on failed images)', async () => {
    const img = buildMockImg(false);
    mockIframe = buildMockIframe([img]);

    mockRenderAsHtml.mockResolvedValueOnce(
      '<html><body><img src="/missing.png"/></body></html>',
    );

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    await waitFor(() =>
      expect(img.addEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
        { once: true },
      ),
    );

    expect(mockPrint).not.toHaveBeenCalled();

    act(() => {
      img._fire('error');
    });
    expect(mockPrint).toHaveBeenCalled();
  });

  it('resets isPrinting and shows error notification when fetch fails', async () => {
    mockRenderAsHtml.mockRejectedValueOnce(new Error('Template not found'));

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    await waitFor(() => expect(result.current.isPrinting).toBe(false));

    expect(mockShowError).toHaveBeenCalledWith('Error', 'Template not found');
  });

  it('does not print stale HTML when re-triggered before fresh fetch completes', async () => {
    const firstHtml = '<html><body>First</body></html>';
    const secondHtml = '<html><body>Second</body></html>';

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );

    mockRenderAsHtml.mockResolvedValueOnce(firstHtml);

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });
    await waitFor(() => expect(mockPrint).toHaveBeenCalledTimes(1));

    queryClient.setQueryData(
      renderTemplateQueryKey(templateId, options.context, 'en'),
      firstHtml,
    );

    let resolveSecond!: (v: string) => void;
    mockRenderAsHtml.mockImplementationOnce(
      () =>
        new Promise<string>((res) => {
          resolveSecond = res;
        }),
    );

    mockPrint.mockClear();
    const doc = mockIframe.contentDocument as Record<string, jest.Mock>;
    doc.write.mockClear();

    act(() => {
      result.current.triggerPrint(templateId);
    });

    expect(mockPrint).not.toHaveBeenCalled();
    expect(doc.write).not.toHaveBeenCalled();

    await act(async () => {
      resolveSecond(secondHtml);
    });
    await waitFor(() => expect(mockPrint).toHaveBeenCalledTimes(1));

    expect(doc.write).toHaveBeenCalledWith(secondHtml);
    expect(doc.write).not.toHaveBeenCalledWith(firstHtml);
  });

  it('uses locale from getUserPreferredLocale', async () => {
    mockGetUserPreferredLocale.mockReturnValue('es');
    mockRenderAsHtml.mockResolvedValueOnce('<html/>');

    const { result } = renderHook(() => usePrintDocument(options), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.triggerPrint(templateId);
    });

    await waitFor(() => expect(mockRenderAsHtml).toHaveBeenCalled());

    expect(mockRenderAsHtml).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'es' }),
    );
  });
});
