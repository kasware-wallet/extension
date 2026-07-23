import { fetchLocale } from './i18n';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('fetchLocale', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches locale and transforms __ to space in keys', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        Copy__address: { message: 'Copy address', description: 'Copy address label' },
        Your__transaction__has__been__sent: {
          message: 'Your transaction has been sent',
          description: 'Success message'
        },
        appName: { message: 'KasWare', description: 'App name' }
      })
    });

    const result = await fetchLocale('en');

    expect(mockFetch).toHaveBeenCalledWith('./_locales/en/messages.json');
    expect(result).toEqual({
      'Copy address': 'Copy address',
      'Your transaction has been sent': 'Your transaction has been sent',
      appName: 'KasWare'
    });
  });

  it('returns empty object on fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchLocale('xx');

    expect(result).toEqual({});
  });

  it('returns empty object on invalid JSON', async () => {
    mockFetch.mockResolvedValue({
      json: async () => {
        throw new SyntaxError('Unexpected token');
      }
    });

    const result = await fetchLocale('en');

    expect(result).toEqual({});
  });

  it('returns empty object for empty locale data', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({})
    });

    const result = await fetchLocale('en');

    expect(result).toEqual({});
  });
});
