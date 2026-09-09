export interface ContextResourceMap {
  type: string;
  attribute: string;
}

export interface CDSSServiceConfig {
  name: string;
  description: string;
  contextResourceMap?: ContextResourceMap[];
  prefetch?: { [key: string]: string };
}

export interface CDSSServerConfig {
  server: string;
  url: string;
  services: CDSSServiceConfig[];
}

export interface CDSSRule {
  event: string;
  server: string;
  service: string;
}

export interface CDSCard {
  summary: string;
  indicator: 'info' | 'warning' | 'critical';
  source: {
    label: string;
  };
  suggestions?: CDSSuggestion[];
}

export interface CDSSuggestion {
  label: string;
  actions?: CDSAction[];
}

export interface CDSAction {
  type: 'create' | 'update' | 'delete';
  resource?: {
    id?: string;
    resourceType?: string;
    [key: string]: unknown;
  };
}

export interface CDSHooksRequest {
  hook: string;
  hookInstance: string;
  context: {
    patientId: string;
    visitId?: string;
    episodeId?: string;
    [key: string]: unknown;
  };
  prefetch?: { [key: string]: string };
}

export interface CDSHooksResponse {
  cards: CDSCard[];
}

export interface CDSSContext {
  patientId: string;
  visitId?: string;
  episodeId?: string;
}

export interface CDSSEventDetail {
  controlKey: string;
  itemId: string;
  event: string;
}
