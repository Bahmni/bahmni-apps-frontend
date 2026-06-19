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
let mockIframe: Record<string, unknown>;

const buildMockIframe = (mockImages: MockImg[] = []) => {
  mockPrint = jest.fn();

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
    contentWindow: { print: mockPrint },
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
  it('writes HTML to iframe and prints immediately when there are no images', async () => {
    const html = '<html><body>Card</body></html>';
    await printViaIframe(html);

    const doc = mockIframe.contentDocument as Record<string, jest.Mock>;
    expect(doc.open).toHaveBeenCalled();
    expect(doc.write).toHaveBeenCalledWith(html);
    expect(doc.close).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(mockIframe);
  });

  it('prints immediately when all images are already complete', async () => {
    const completeImg = buildMockImg(true);
    mockIframe = buildMockIframe([completeImg]);

    await printViaIframe('<html><body><img src="/logo.png"/></body></html>');

    expect(mockPrint).toHaveBeenCalled();
    expect(completeImg.onload).toBeNull();
  });

  it('waits for all pending images to load before printing', async () => {
    const img1 = buildMockImg(false);
    const img2 = buildMockImg(false);
    mockIframe = buildMockIframe([img1, img2]);

    let resolved = false;
    const promise = printViaIframe(
      '<html><body><img src="/a.png"/><img src="/b.png"/></body></html>',
    ).then(() => {
      resolved = true;
    });

    expect(mockPrint).not.toHaveBeenCalled();

    img1._fire('load');
    expect(mockPrint).not.toHaveBeenCalled();
    expect(resolved).toBe(false);

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

      expect(mockPrint).not.toHaveBeenCalled();

      jest.advanceTimersByTime(10000);
      await promise;

      expect(mockPrint).toHaveBeenCalled();
    });
  });

  it('resolves without printing when iframe document is unavailable', async () => {
    (mockIframe as Record<string, unknown>).contentDocument = null;
    (mockIframe as Record<string, unknown>).contentWindow = null;

    await printViaIframe('<html/>');

    expect(mockPrint).not.toHaveBeenCalled();
  });
});
