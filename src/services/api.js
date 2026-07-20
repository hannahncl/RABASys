const API_URL = import.meta.env.VITE_API_URL || '/api';

const clearStoredAuth = () => {
  localStorage.removeItem('rabas_auth_token');
  localStorage.removeItem('rabas_current_user');
  localStorage.removeItem('rabas_session_id');
  localStorage.removeItem('rabas_session_expires_at');
  window.dispatchEvent(new Event('rabas-auth-invalidated'));
};

const getStoredToken = () => {
  const directToken = localStorage.getItem('rabas_auth_token');
  if (directToken) return directToken;

  try {
    const currentUser = JSON.parse(localStorage.getItem('rabas_current_user') || 'null');
    if (currentUser?.token) {
      localStorage.setItem('rabas_auth_token', currentUser.token);
      return currentUser.token;
    }
  } catch {
    // Ignore malformed stored user data and fall back to no token.
  }

  return null;
};

export async function api(path, options = {}) {
  const token = getStoredToken();
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the backend. Start it with "cd backend; npm run dev" and try again.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearStoredAuth();
    }
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}
