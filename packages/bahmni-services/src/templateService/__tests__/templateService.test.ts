import { get, post } from '../../api';
import { TEMPLATE_SERVICE_BASE } from '../constants';
import type { RenderRequest, TemplateListResponse } from '../models';
import { getTemplates, renderAsHtml } from '../templateService';

jest.mock('../../api');

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTemplates', () => {
  it('calls get with the correct URL and returns the template list', async () => {
    const mockResponse: TemplateListResponse = {
      templates: [
        {
          id: 'REG_CARD_V1',
          name: 'Registration Card',
          category: 'patientRegistration',
          triggers: [{ label: 'Print Card' }],
          outputFormats: ['html'],
        },
      ],
    };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await getTemplates();

    expect(mockGet).toHaveBeenCalledWith(`${TEMPLATE_SERVICE_BASE}/templates`);
    expect(result).toEqual(mockResponse);
  });

  it('propagates errors from the API', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    await expect(getTemplates()).rejects.toThrow('Network error');
  });
});

describe('renderAsHtml', () => {
  const renderRequest: RenderRequest = {
    templateId: 'REG_CARD_V1',
    format: 'html',
    locale: 'en',
    context: { patientUuid: 'patient-uuid-123' },
  };

  it('calls post with the correct URL and request body, returning HTML', async () => {
    const mockHtml = '<html><body>Registration Card</body></html>';
    mockPost.mockResolvedValueOnce({ html: mockHtml });

    const result = await renderAsHtml(renderRequest);

    expect(mockPost).toHaveBeenCalledWith(
      `${TEMPLATE_SERVICE_BASE}/render`,
      renderRequest,
    );
    expect(result).toBe(mockHtml);
  });

  it('propagates errors from the API', async () => {
    mockPost.mockRejectedValueOnce(new Error('Template not found'));

    await expect(renderAsHtml(renderRequest)).rejects.toThrow(
      'Template not found',
    );
  });
});
