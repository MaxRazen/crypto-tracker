import type {
  CreateRuleDto,
  FetchExchangeOrdersDto,
  FetchExchangeOrdersResponseDto,
  UpdateRuleDto,
} from './gen/types.gen';

const TOKEN_KEY = 'access_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    if (url !== '/api/auth/login') {
      window.location.reload();
    }
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  async login(username: string, password: string) {
    const data = await request<{ access_token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    return data;
  },

  logout() {
    clearToken();
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  orders: {
    exchangeOrdersList(dto: FetchExchangeOrdersDto): Promise<FetchExchangeOrdersResponseDto> {
      return request('/api/orders/exchange/list', { method: 'POST', body: JSON.stringify(dto) });
    },
  },

  rules: {
    list(): Promise<Array<Record<string, unknown>>> {
      return request('/api/rules');
    },
    get(uid: string): Promise<unknown> {
      return request(`/api/rules/${uid}`);
    },
    create(rule: CreateRuleDto): Promise<unknown> {
      return request('/api/rules', { method: 'POST', body: JSON.stringify(rule) });
    },
    update(uid: string, rule: UpdateRuleDto): Promise<unknown> {
      return request(`/api/rules/${uid}`, { method: 'PATCH', body: JSON.stringify(rule) });
    },
    delete(uid: string): Promise<void> {
      return request(`/api/rules/${uid}`, { method: 'DELETE' });
    },
  },
};
