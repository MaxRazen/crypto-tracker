import {
  authControllerLogin,
  apiRulesControllerCreate,
  apiRulesControllerFindAll,
  apiRulesControllerFindOne,
  apiRulesControllerRemove,
  apiRulesControllerUpdate,
} from './client';
import { createClient } from './client/client';
import type { CreateRuleDto, UpdateRuleDto } from './client/types.gen';

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

const client = createClient({
  baseUrl: '',
  auth: () => getToken() ?? undefined,
  responseStyle: 'data',
  throwOnError: true,
});

client.interceptors.response.use(async (response, _request, _opts) => {
  if (response.status === 401) {
    clearToken();
    throw new Error('UNAUTHORIZED');
  }
  return response;
});

client.interceptors.error.use(async (error, response) => {
  if (response?.status === 401) {
    clearToken();
    throw new Error('UNAUTHORIZED');
  }
  if (error && typeof error === 'object' && 'message' in error) {
    throw new Error((error as { message: string }).message);
  }
  throw error;
});

export const api = {
  async login(username: string, password: string) {
    const data = (await authControllerLogin({
      client,
      body: { username, password },
    })) as unknown as { access_token: string };
    setToken(data.access_token);
    return data;
  },

  logout() {
    clearToken();
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  rules: {
    async list() {
      return apiRulesControllerFindAll({ client }) as unknown as Promise<Array<Record<string, unknown>>>;
    },
    async get(uid: string) {
      return apiRulesControllerFindOne({ client, path: { uid } });
    },
    async create(rule: CreateRuleDto) {
      return apiRulesControllerCreate({ client, body: rule });
    },
    async update(uid: string, rule: UpdateRuleDto) {
      return apiRulesControllerUpdate({ client, path: { uid }, body: rule });
    },
    async delete(uid: string) {
      return apiRulesControllerRemove({ client, path: { uid } });
    },
  },
};
