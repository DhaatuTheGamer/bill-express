export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // Optional: trigger a logout if the token becomes invalid
    // localStorage.setItem('isAuthenticated', 'false');
    // window.location.href = '/';
  }

  return response;
};
