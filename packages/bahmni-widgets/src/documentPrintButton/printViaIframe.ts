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

export interface PrintViaIframeOptions {
  focus?: boolean;
  container?: HTMLElement | null;
  signal?: AbortSignal;
}

export async function printViaIframe(
  html: string,
  { focus = true, container, signal }: PrintViaIframeOptions = {},
): Promise<void> {
  const iframe = createIframe();

  const loaded = waitForIframeLoad(iframe);
  iframe.srcdoc = html;
  (container ?? document.body).appendChild(iframe);
  await loaded;

  const iframeDoc = getIframeDocument(iframe);
  const iframeWindow = getIframeWindow(iframe);

  if (!iframeDoc || !iframeWindow) {
    cleanupIframe(iframe);
    return;
  }
  await waitForImagesToLoad(iframeDoc);

  if (signal?.aborted) {
    cleanupIframe(iframe);
    return;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(fallbackId);
    cleanupIframe(iframe);
  };
  iframeWindow.addEventListener('afterprint', cleanup, { once: true });
  const fallbackId = setTimeout(cleanup, CLEANUP_TIMEOUT_MS);

  if (focus) {
    iframeWindow.focus();
  }
  iframeWindow.print();
}

// The browser's PDF viewer reports the frame as loaded before it can print it.
const PDF_RENDER_DELAY_MS = 500;
const PRINT_DIALOG_TIMEOUT_MS = 120000;
const PRINT_DIALOG_OPEN_GRACE_MS = 3000;

/**
 * Resolves when the print dialog opened by a frame has been closed, however the browser reports it.
 * The PDF viewer prints out of process, so `afterprint` does not reliably fire for it; the page
 * losing and regaining focus is what a dialog opening and closing looks like from here. Always
 * settles: on abort, and after a last-resort timeout.
 */
function waitForPrintDialogClose(
  printWindow: Window,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let sawBlur = false;
    const finish = () => {
      clearTimeout(timeoutId);
      clearTimeout(graceId);
      printWindow.removeEventListener('afterprint', finish);
      window.removeEventListener('afterprint', finish);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    const onBlur = () => {
      sawBlur = true;
    };
    const onFocus = () => {
      if (sawBlur) finish();
    };
    const timeoutId = setTimeout(finish, PRINT_DIALOG_TIMEOUT_MS);
    const graceId = setTimeout(() => {
      if (!sawBlur) finish();
    }, PRINT_DIALOG_OPEN_GRACE_MS);
    printWindow.addEventListener('afterprint', finish);
    window.addEventListener('afterprint', finish);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    signal?.addEventListener('abort', finish);
    if (signal?.aborted) finish();
  });
}

export interface PrintPdfOptions {
  container?: HTMLElement | null;
  focus?: boolean;
  signal?: AbortSignal;
}

export async function printPdfViaIframe(
  url: string,
  { container, focus = true, signal }: PrintPdfOptions = {},
): Promise<void> {
  const response = await fetch(url, { credentials: 'same-origin', signal });
  if (!response.ok) {
    throw new Error(
      `Unable to load the document to print (${response.status})`,
    );
  }
  const pdf = new Blob([await response.blob()], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(pdf);

  const iframe = createIframe(false);
  const cleanup = () => {
    cleanupIframe(iframe);
    URL.revokeObjectURL(objectUrl);
  };

  try {
    const loaded = waitForIframeLoad(iframe);
    iframe.src = objectUrl;
    (container ?? document.body).appendChild(iframe);
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, PDF_RENDER_DELAY_MS));

    const iframeWindow = getIframeWindow(iframe);
    if (!iframeWindow || signal?.aborted) {
      return;
    }
    if (focus) {
      iframeWindow.focus();
    }
    const closed = waitForPrintDialogClose(iframeWindow, signal);
    iframeWindow.print();
    await closed;
  } finally {
    cleanup();
  }
}
