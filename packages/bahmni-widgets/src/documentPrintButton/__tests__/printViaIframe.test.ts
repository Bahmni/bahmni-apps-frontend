import { printViaIframe } from '../printViaIframe';

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
