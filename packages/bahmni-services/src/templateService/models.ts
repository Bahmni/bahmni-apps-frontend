export interface TemplateTrigger {
  label: string;
  shortcutKey?: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  triggers: TemplateTrigger[];
  outputFormats: Array<'html' | 'pdf'>;
}

export interface TemplateListResponse {
  templates: TemplateInfo[];
}

export interface RenderRequest {
  templateId: string;
  format: 'html' | 'pdf';
  locale?: string;
  context?: Record<string, string>;
  data?: Record<string, unknown>;
}
