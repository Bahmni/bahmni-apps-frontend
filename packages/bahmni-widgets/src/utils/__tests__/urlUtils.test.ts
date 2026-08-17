import { resolveNavigationURL } from '../urlUtils';

describe('resolveNavigationURL', () => {
  it('resolves placeholders with JSONata expressions', async () => {
    const result = await resolveNavigationURL('/patient/{name}', {
      name: 'John Doe',
    });
    expect(result).toBe('/patient/John%20Doe');
  });

  it('resolves multiple placeholders', async () => {
    const result = await resolveNavigationURL('/patient/{name}/visit/{id}', {
      name: 'John Doe',
      id: '123',
    });
    expect(result).toBe('/patient/John%20Doe/visit/123');
  });

  it('converts resolved value to string', async () => {
    const result = await resolveNavigationURL('/patient/{age}', { age: 30 });
    expect(result).toBe('/patient/30');
  });

  it('encodes special characters in resolved values', async () => {
    const result = await resolveNavigationURL('/patient/{name}', {
      name: 'John/Doe & Smith',
    });
    expect(result).toBe('/patient/John%2FDoe%20%26%20Smith');
  });

  it.each([
    ['expression evaluates to null', '/patient/{uuid}', { name: 'John Doe' }],
    [
      'expression evaluates to undefined',
      '/patient/{missing}',
      { name: 'John Doe' },
    ],
    [
      'JSONata expression throws error',
      '/patient/{$invalid}',
      { name: 'John Doe' },
    ],
  ])('returns null when %s', async (_description, template, rowData) => {
    const result = await resolveNavigationURL(template, rowData);
    expect(result).toBeNull();
  });
});
