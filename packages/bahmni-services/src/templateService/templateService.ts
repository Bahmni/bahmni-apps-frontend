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
  return response.html;
}
