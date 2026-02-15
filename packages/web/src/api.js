const API_BASE = '';

function getToken() {
  return localStorage.getItem('access_token');
}

function setToken(token) {
  localStorage.setItem('access_token', token);
}

function clearToken() {
  localStorage.removeItem('access_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    return data;
  },

  logout() {
    clearToken();
  },

  isAuthenticated() {
    return !!getToken();
  },

  rules: {
    list() {
      return request('/api/rules');
    },
    get(uid) {
      return request(`/api/rules/${uid}`);
    },
    create(rule) {
      return request('/api/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      });
    },
    update(uid, rule) {
      return request(`/api/rules/${uid}`, {
        method: 'PATCH',
        body: JSON.stringify(rule),
      });
    },
    delete(uid) {
      return request(`/api/rules/${uid}`, { method: 'DELETE' });
    },
  },
};
