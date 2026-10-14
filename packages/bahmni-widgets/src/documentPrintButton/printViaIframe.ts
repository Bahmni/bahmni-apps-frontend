function createIframe(sandboxed = true): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'border:none;opacity:0;pointer-events:none;z-index:-1;';
  if (sandboxed) {
    iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
  }
  return iframe;
}

const LOAD_TIMEOUT_MS = 5000;
const CLEANUP_TIMEOUT_MS = 60000;

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve();
    };
    iframe.addEventListener('load', finish, { once: true });
    const timeoutId = setTimeout(finish, LOAD_TIMEOUT_MS);
  });
}

function getIframeWindow(iframe: HTMLIFrameElement): Window | null {
  return iframe.contentWindow ?? null;
}

function getIframeDocument(iframe: HTMLIFrameElement): Document | null {
  return iframe.contentDocument ?? iframe.contentWindow?.document ?? null;
}

const IMAGE_LOAD_TIMEOUT_MS = 10000;

async function waitForImagesToLoad(doc: Document): Promise<void> {
  const pending = Array.from(doc.querySelectorAll('img')).filter(
    (img) => !img.complete,
  );
  if (pending.length === 0) return;

  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, IMAGE_LOAD_TIMEOUT_MS);
  });
  const allSettled = Promise.all(
    pending.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
  await Promise.race([allSettled, timeout]);
  clearTimeout(timeoutId!);
}

function cleanupIframe(iframe: HTMLIFrameElement): void {
  if (document.body.contains(iframe)) {
    iframe.remove();
  }
}

export async function printViaIframe(html: string): Promise<void> {
  const iframe = createIframe();

  const loaded = waitForIframeLoad(iframe);
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  await loaded;

  const iframeDoc = getIframeDocument(iframe);
  const iframeWindow = getIframeWindow(iframe);

  if (!iframeDoc || !iframeWindow) {
    cleanupIframe(iframe);
    return;
  }
  await waitForImagesToLoad(iframeDoc);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(fallbackId);
    cleanupIframe(iframe);
  };
  iframeWindow.addEventListener('afterprint', cleanup, { once: true });
  const fallbackId = setTimeout(cleanup, CLEANUP_TIMEOUT_MS);

  iframeWindow.focus();
  iframeWindow.print();
}

// The browser's PDF viewer reports the frame as loaded before it can print it.
const PDF_RENDER_DELAY_MS = 500;

/**
 * Prints a PDF. A PDF cannot be embedded in the sandboxed HTML frame printViaIframe uses (the
 * browser blocks its viewer there and the pages print blank), so the PDF is loaded into a frame of
 * its own, from a same-origin blob so it prints regardless of how the server frames its documents.
 */
export async function printPdfViaIframe(url: string): Promise<void> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(
      `Unable to load the document to print (${response.status})`,
    );
  }
  const pdf = new Blob([await response.blob()], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(pdf);

  const iframe = createIframe(false);
  const loaded = waitForIframeLoad(iframe);
  iframe.src = objectUrl;
  document.body.appendChild(iframe);
  await loaded;
  await new Promise((resolve) => setTimeout(resolve, PDF_RENDER_DELAY_MS));

  const iframeWindow = getIframeWindow(iframe);
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(fallbackId);
    cleanupIframe(iframe);
    URL.revokeObjectURL(objectUrl);
  };
  const fallbackId = setTimeout(cleanup, CLEANUP_TIMEOUT_MS);

  if (!iframeWindow) {
    cleanup();
    return;
  }
  iframeWindow.addEventListener('afterprint', cleanup, { once: true });
  iframeWindow.focus();
  iframeWindow.print();
}
