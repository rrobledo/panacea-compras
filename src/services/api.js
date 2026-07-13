import axios from 'axios';

export const AUTH_STORAGE_KEY = 'panacea_produccion_auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

api.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const { access_token } = JSON.parse(stored);
      if (access_token) config.headers.Authorization = `Bearer ${access_token}`;
    }
  } catch {
    // malformed/missing stored session — send the request unauthenticated
  }
  // The backend requires X-API-Key on every mutating request, separate from
  // the per-user Bearer token above (see backend README's "panacea-front
  // integration note").
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey && MUTATING_METHODS.has(config.method)) config.headers['X-API-Key'] = apiKey;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Generic CRUD factory ─────────────────────────────────────────────────────
export const createCrudService = (resource) => ({
  list:   (params) => api.get(`/${resource}`, { params }),
  get:    (id)    => api.get(`/${resource}/${id}`),
  create: (data)  => api.post(`/${resource}`, data),
  update: (id, data) => api.put(`/${resource}/${id}`, data),
  patch:  (id, data) => api.patch(`/${resource}/${id}`, data),
  remove: (id)    => api.delete(`/${resource}/${id}`),
});
