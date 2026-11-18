import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import client from '../../api/client';
import { renderAsHtml } from '../templateService';

// Runs a request through the real API client and error formatting, with only the
// network replaced, to pin down what a caller of renderAsHtml receives on failure.
const failWith = (status: number, data: unknown): AxiosAdapter => {
  return (config: InternalAxiosRequestConfig) =>
    Promise.reject(
      new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        {
          status,
          statusText: '',
          headers: {},
          config,
          data,
        },
      ),
    );
};

const request = {
  templateId: 'PRESCRIPTION_V1',
  format: 'html' as const,
  context: { patientUUID: 'patient-1' },
};

describe('renderAsHtml failures', () => {
  const originalAdapter = client.defaults.adapter;

  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it("rejects with the service's explanation and keeps the HTTP status for a 400", async () => {
    client.defaults.adapter = failWith(400, {
      message: 'No medications prescribed for this visit',
    });

    const error = await renderAsHtml(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      'No medications prescribed for this visit',
    );
    expect(((error as Error).cause as AxiosError).response?.status).toBe(400);
  });

  it('reports a missing template as a 404 so the caller can treat it as a failure', async () => {
    client.defaults.adapter = failWith(404, {
      message: 'Template not found: "NOPE"',
    });

    const error = await renderAsHtml(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect(((error as Error).cause as AxiosError).response?.status).toBe(404);
  });

  it('reports an unavailable service as a 5xx', async () => {
    client.defaults.adapter = failWith(503, { message: 'Service Unavailable' });

    const error = await renderAsHtml(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect(((error as Error).cause as AxiosError).response?.status).toBe(503);
  });
});
