import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../utils/api.js';

describe('apiFetch', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    localStorage.clear();
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should call fetch with the correct URL', async () => {
    await apiFetch('/test-endpoint');
    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', expect.anything());
  });

  it('should set credentials to same-origin by default', async () => {
    await apiFetch('/test-endpoint');

    const fetchArgs = mockFetch.mock.calls[0];
    const init = fetchArgs[1];
    expect(init.credentials).toBe('same-origin');
  });

  it('should allow overriding credentials option', async () => {
    await apiFetch('/test-endpoint', { credentials: 'omit' });

    const fetchArgs = mockFetch.mock.calls[0];
    const init = fetchArgs[1];
    expect(init.credentials).toBe('omit');
  });

  it('should return the fetch response', async () => {
    const response = await apiFetch('/test-endpoint');
    const data = await response.json();
    expect(data).toEqual({ success: true });
    expect(response.status).toBe(200);
  });

  it('should handle 401 status code (optional logout logic placeholder)', async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 401 }));

    const response = await apiFetch('/test-endpoint');
    expect(response.status).toBe(401);
  });
});
