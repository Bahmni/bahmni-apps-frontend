function createIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'border:none;opacity:0;pointer-events:none;z-index:-1;';
  iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
  document.body.appendChild(iframe);
  return iframe;
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
    document.body.removeChild(iframe);
  }
}

export async function printViaIframe(html: string): Promise<void> {
  const iframe = createIframe();
  const iframeDoc = getIframeDocument(iframe);
  const iframeWindow = getIframeWindow(iframe);

  if (!iframeDoc || !iframeWindow) {
    cleanupIframe(iframe);
    return;
  }
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();
  await waitForImagesToLoad(iframeDoc);

  iframeWindow.print();
  cleanupIframe(iframe);
}
