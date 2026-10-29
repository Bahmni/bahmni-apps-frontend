import { printPdfViaIframe, printViaIframe } from '../printViaIframe';

interface MockImg {
  complete: boolean;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  _fire: (event: 'load' | 'error') => void;
}

const buildMockImg = (complete: boolean): MockImg => {
  const mock: MockImg = {
    complete,
    onload: null,
    onerror: null,
    _fire: (event: 'load' | 'error') => {
      if (event === 'load') mock.onload?.();
      if (event === 'error') mock.onerror?.();
    },
  };
  return mock;
};

let mockPrint: jest.Mock;
let mockFocus: jest.Mock;
let mockRemove: jest.Mock;
let mockIframe: Record<string, unknown>;
let loadHandler: (() => void) | null;
let afterprintHandler: (() => void) | null;

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const fireIframeLoad = () => loadHandler?.();

const fireAfterprint = () => afterprintHandler?.();

const buildMockIframe = (mockImages: MockImg[] = []) => {
  mockPrint = jest.fn();
  mockFocus = jest.fn();
  mockRemove = jest.fn();
  loadHandler = null;
  afterprintHandler = null;

  const mockContentDoc = {
    querySelectorAll: jest.fn().mockReturnValue(mockImages),
  };

  return {
    _isMockIframe: true,
    style: { cssText: '' },
    srcdoc: '',
    setAttribute: jest.fn(),
    remove: mockRemove,
    addEventListener: jest.fn((event: string, cb: () => void) => {
      if (event === 'load') loadHandler = cb;
    }),
    contentDocument: mockContentDoc,
    contentWindow: {
      print: mockPrint,
      focus: mockFocus,
      addEventListener: jest.fn((event: string, cb: () => void) => {
        if (event === 'afterprint') afterprintHandler = cb;
      }),
      removeEventListener: jest.fn(),
    },
  };
};

beforeEach(() => {
  mockIframe = buildMockIframe();

  const originalCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'iframe') return mockIframe as unknown as HTMLIFrameElement;
    return originalCreateElement(tag as keyof HTMLElementTagNameMap);
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

describe('printViaIframe', () => {
  it('renders HTML into the iframe via srcdoc, focuses, and prints', async () => {
    const html = '<html><body>Card</body></html>';
    const promise = printViaIframe(html);
    fireIframeLoad();
    await promise;

    expect(mockIframe.srcdoc).toBe(html);
    expect(mockFocus).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
  });

  it('removes the iframe only after the print dialog closes (afterprint)', async () => {
    const promise = printViaIframe('<html><body>Card</body></html>');
    fireIframeLoad();
    await promise;

    // Still mounted while the dialog is open.
    expect(mockRemove).not.toHaveBeenCalled();

    fireAfterprint();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('prints immediately when all images are already complete', async () => {
    const completeImg = buildMockImg(true);
    mockIframe = buildMockIframe([completeImg]);

    const promise = printViaIframe(
      '<html><body><img src="/logo.png"/></body></html>',
    );
    fireIframeLoad();
    await promise;

    expect(mockPrint).toHaveBeenCalled();
    expect(completeImg.onload).toBeNull();
  });

  it('waits for all pending images to load before printing', async () => {
    const img1 = buildMockImg(false);
    const img2 = buildMockImg(false);
    mockIframe = buildMockIframe([img1, img2]);

    const promise = printViaIframe(
      '<html><body><img src="/a.png"/><img src="/b.png"/></body></html>',
    );

    fireIframeLoad();
    await flushMicrotasks();
    expect(mockPrint).not.toHaveBeenCalled();

    img1._fire('load');
    expect(mockPrint).not.toHaveBeenCalled();

    img2._fire('load');
    await promise;

    expect(mockPrint).toHaveBeenCalled();
  });

  it('prints after an image fires an error (does not block on failed images)', async () => {
    const img = buildMockImg(false);
    mockIframe = buildMockIframe([img]);

    const promise = printViaIframe(
      '<html><body><img src="/missing.png"/></body></html>',
    );

    fireIframeLoad();
    await flushMicrotasks();
    expect(mockPrint).not.toHaveBeenCalled();

    img._fire('error');
    await promise;

    expect(mockPrint).toHaveBeenCalled();
  });

  describe('timeout', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('prints after 10 s when an image never settles', async () => {
      const img = buildMockImg(false);
      mockIframe = buildMockIframe([img]);

      const promise = printViaIframe(
        '<html><body><img src="/slow.png"/></body></html>',
      );

      fireIframeLoad();
      await flushMicrotasks();
      expect(mockPrint).not.toHaveBeenCalled();

      jest.advanceTimersByTime(10000);
      await promise;

      expect(mockPrint).toHaveBeenCalled();
    });
  });

  it('resolves without printing when iframe document is unavailable', async () => {
    (mockIframe as Record<string, unknown>).contentDocument = null;
    (mockIframe as Record<string, unknown>).contentWindow = null;

    const promise = printViaIframe('<html/>');
    fireIframeLoad();
    await promise;

    expect(mockPrint).not.toHaveBeenCalled();
  });
});

describe('printViaIframe container and abort', () => {
  it('mounts the frame in the given container instead of the body', async () => {
    const container = { appendChild: jest.fn() };

    const promise = printViaIframe('<html/>', {
      container: container as unknown as HTMLElement,
    });
    fireIframeLoad();
    await promise;

    expect(container.appendChild).toHaveBeenCalledWith(mockIframe);
    expect(document.body.appendChild).not.toHaveBeenCalledWith(mockIframe);
  });

  it('does not print, and removes the frame, when aborted before the dialog opens', async () => {
    const controller = new AbortController();
    controller.abort();

    const promise = printViaIframe('<html/>', { signal: controller.signal });
    fireIframeLoad();
    await promise;

    expect(mockPrint).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('printViaIframe focus', () => {
  it('focuses the frame before printing by default', async () => {
    const promise = printViaIframe('<html/>');
    fireIframeLoad();
    await promise;

    expect(mockFocus).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
  });

  it('prints without focusing the frame when told not to', async () => {
    const promise = printViaIframe('<html/>', { focus: false });
    fireIframeLoad();
    await promise;

    expect(mockFocus).not.toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
  });
});

describe('printPdfViaIframe', () => {
  const OBJECT_URL = 'blob:http://localhost/pdf';

  beforeEach(() => {
    jest.useFakeTimers();
    global.URL.createObjectURL = jest.fn(() => OBJECT_URL);
    global.URL.revokeObjectURL = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: jest.fn().mockResolvedValue(new Blob(['%PDF'])),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Starts a print and lets it reach the point where the dialog is open; the returned promise
  // settles once the dialog closes.
  const startPrint = async (
    options?: Parameters<typeof printPdfViaIframe>[1],
  ) => {
    const closed = printPdfViaIframe('http://localhost/doc.pdf', options);
    await flushMicrotasks();
    await flushMicrotasks();
    fireIframeLoad();
    await flushMicrotasks();
    jest.advanceTimersByTime(500);
    await flushMicrotasks();
    return { closed };
  };

  it('loads the pdf into its own frame from a same-origin blob and prints it', async () => {
    const { closed } = await startPrint();

    expect(global.fetch).toHaveBeenCalledWith('http://localhost/doc.pdf', {
      credentials: 'same-origin',
      signal: undefined,
    });
    expect(mockIframe.src).toBe(OBJECT_URL);
    expect(mockFocus).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
    fireAfterprint();
    await closed;
  });

  it('does not sandbox the frame, which would blank the pdf viewer', async () => {
    const { closed } = await startPrint();

    expect(mockIframe.setAttribute).not.toHaveBeenCalledWith(
      'sandbox',
      expect.anything(),
    );
    fireAfterprint();
    await closed;
  });

  it('waits for the viewer to render before printing', async () => {
    const closed = printPdfViaIframe('http://localhost/doc.pdf');
    await flushMicrotasks();
    await flushMicrotasks();
    fireIframeLoad();
    await flushMicrotasks();

    expect(mockPrint).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    await flushMicrotasks();
    expect(mockPrint).toHaveBeenCalled();
    fireAfterprint();
    await closed;
  });

  it('does not resolve until the print dialog closes', async () => {
    let resolved = false;
    const { closed } = await startPrint();
    const done = closed.then(() => {
      resolved = true;
    });
    await flushMicrotasks();

    expect(resolved).toBe(false);

    fireAfterprint();
    await done;

    expect(resolved).toBe(true);
  });

  it('removes the frame and releases the blob after the print dialog closes', async () => {
    const { closed } = await startPrint();
    expect(mockRemove).not.toHaveBeenCalled();

    fireAfterprint();
    await closed;

    expect(mockRemove).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('mounts the pdf frame in the given container', async () => {
    const container = { appendChild: jest.fn() };
    const { closed } = await startPrint({
      container: container as unknown as HTMLElement,
    });

    expect(container.appendChild).toHaveBeenCalledWith(mockIframe);
    fireAfterprint();
    await closed;
  });

  it('does not focus the frame when told not to', async () => {
    const { closed } = await startPrint({ focus: false });

    expect(mockFocus).not.toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
    fireAfterprint();
    await closed;
  });

  it('resolves when the page regains focus after the dialog took it, without afterprint', async () => {
    const { closed } = await startPrint();
    let resolved = false;
    const done = closed.then(() => {
      resolved = true;
    });

    window.dispatchEvent(new Event('blur'));
    await flushMicrotasks();
    expect(resolved).toBe(false);

    window.dispatchEvent(new Event('focus'));
    await done;

    expect(resolved).toBe(true);
    expect(mockRemove).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('does not wait for a dialog it never saw open', async () => {
    const { closed } = await startPrint();

    jest.advanceTimersByTime(3000);
    await closed;

    expect(mockRemove).toHaveBeenCalled();
  });

  it('keeps waiting while the dialog holds focus, up to a last-resort limit', async () => {
    const { closed } = await startPrint();
    let resolved = false;
    const done = closed.then(() => {
      resolved = true;
    });
    window.dispatchEvent(new Event('blur'));

    jest.advanceTimersByTime(60000);
    await flushMicrotasks();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(60000);
    await done;
    expect(resolved).toBe(true);
  });

  it('stops waiting and removes the frame when aborted', async () => {
    const controller = new AbortController();
    const { closed } = await startPrint({ signal: controller.signal });
    window.dispatchEvent(new Event('blur'));

    controller.abort();
    await closed;

    expect(mockRemove).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('passes the abort signal on to the download', async () => {
    const controller = new AbortController();
    const { closed } = await startPrint({ signal: controller.signal });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost/doc.pdf', {
      credentials: 'same-origin',
      signal: controller.signal,
    });
    fireAfterprint();
    await closed;
  });

  it('rejects without creating a frame when the pdf cannot be fetched', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

    await expect(printPdfViaIframe('http://localhost/x.pdf')).rejects.toThrow(
      '404',
    );
    expect(mockPrint).not.toHaveBeenCalled();
  });
});
