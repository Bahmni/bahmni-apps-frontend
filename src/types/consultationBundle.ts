export interface ConsultationBundleEntry {
  fullUrl: string;
  resource: {
    resourceType: string;
    identifier?: Array<{
      use: string;
      value: string;
    }>;
    status: string;
    class: {
      system: string;
      code: string;
      display: string;
    };
    meta?: {
      tag: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    type?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    }>;
    subject: {
      reference: string;
    };
    participant?: Array<{
      individual: {
        reference: string;
        type: string;
      };
    }>;
    partOf?: {
      reference: string;
    };
    location?: Array<{
      location: {
        reference: string;
      };
    }>;
    period: {
      start: string;
    };
  };
  request: {
    method: string;
    url: string;
  };
}

export interface ConsultationBundle {
  resourceType: string;
  id: string;
  type: string;
  timestamp: string;
  entry: ConsultationBundleEntry[];
}
