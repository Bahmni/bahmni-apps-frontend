import {
  renderAsHtml,
  getUserPreferredLocale,
  notificationService,
  getFormattedError,
} from '@bahmni/services';
import type { RenderRequest } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface UsePrintDocumentOptions {
  templateId: string;
  context: Record<string, string>;
  data?: Record<string, unknown>;
}

interface UsePrintDocumentResult {
  isPrinting: boolean;
  triggerPrint: () => void;
}

export const renderTemplateQueryKey = (
  templateId: string,
  context: Record<string, string>,
  locale: string,
  data?: Record<string, unknown>,
) => ['renderTemplate', templateId, 'html', context, locale, data] as const;

export function usePrintDocument({
  templateId,
  context,
  data,
}: UsePrintDocumentOptions): UsePrintDocumentResult {
  const [triggered, setTriggered] = useState(false);

  const locale = getUserPreferredLocale();

  const renderRequest: RenderRequest = {
    templateId,
    format: 'html',
    locale,
    context,
    ...(data && { data }),
  };

  const {
    data: htmlContent,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: renderTemplateQueryKey(templateId, context, locale, data),
    queryFn: () => renderAsHtml(renderRequest),
    enabled: triggered,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!triggered || isFetching || !htmlContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'border:none;opacity:0;pointer-events:none;z-index:-1;';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;

    const teardown = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      setTriggered(false);
    };

    if (!iframeDoc || !iframe.contentWindow) {
      teardown();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    const doPrint = () => {
      iframe.contentWindow?.print();
      teardown();
    };

    const images = Array.from(
      iframeDoc.querySelectorAll('img'),
    ) as HTMLImageElement[];
    const pending = images.filter((img) => !img.complete);

    if (pending.length === 0) {
      doPrint();
      return;
    }

    let remaining = pending.length;
    let printed = false;
    const safePrint = () => {
      if (printed) return;
      printed = true;
      doPrint();
    };
    const timeoutId = window.setTimeout(safePrint, 10000);
    const onSettled = () => {
      remaining -= 1;
      if (remaining === 0) {
        window.clearTimeout(timeoutId);
        safePrint();
      }
    };

    pending.forEach((img) => {
      img.addEventListener('load', onSettled, { once: true });
      img.addEventListener('error', onSettled, { once: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      pending.forEach((img) => {
        img.removeEventListener('load', onSettled);
        img.removeEventListener('error', onSettled);
      });
      teardown();
    };
  }, [triggered, isFetching, htmlContent]);

  useEffect(() => {
    if (!queryError) return;
    const { title, message } = getFormattedError(queryError);
    notificationService.showError(title, message);
    setTriggered(false);
  }, [queryError]);

  return {
    isPrinting: triggered,
    triggerPrint: () => setTriggered(true),
  };
}
