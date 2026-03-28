export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await fetch(input, {
    ...init,
    // Ensure credentials (like cookies) are included if not explicitly overridden
    credentials: init?.credentials || 'same-origin',
  });

  if (response.status === 401) {
    // Optional: trigger a logout if the token becomes invalid
    // localStorage.setItem('isAuthenticated', 'false');
    // window.location.href = '/';
  }

  return response;
};
