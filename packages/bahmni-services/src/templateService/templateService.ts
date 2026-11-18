import { get, post } from '../api';
import { TEMPLATE_SERVICE_BASE } from './constants';
import type { RenderRequest, TemplateListResponse } from './models';

export async function getTemplates(): Promise<TemplateListResponse> {
  return get<TemplateListResponse>(`${TEMPLATE_SERVICE_BASE}/templates`);
}

export async function renderAsHtml(request: RenderRequest): Promise<string> {
  const response = await post<{ html: string }>(
    `${TEMPLATE_SERVICE_BASE}/render`,
    request,
  );
  // A 2xx without usable HTML would otherwise reach the print iframe and
  // produce a blank or broken print dialog; failing here lets callers show
  // their normal error notification instead.
  if (typeof response?.html !== 'string' || response.html.trim() === '') {
    throw new Error('Template render response did not contain HTML');
  }
  return response.html;
}
