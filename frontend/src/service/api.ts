import axios, { AxiosError } from 'axios';

const normalizeApiUrl = (value?: string) => value?.trim().replace(/\/+$/, '');

const configuredApiUrl = normalizeApiUrl(import.meta.env.VITE_API_URL);

function resolveApiBaseUrl() {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (!import.meta.env.PROD) {
    return 'http://localhost:3333';
  }

  const sameOriginFallback = window.location.origin;
  console.error(
    'VITE_API_URL nao esta definido em producao. O frontend vai tentar usar o mesmo dominio do site; se a API estiver em outro dominio, configure VITE_API_URL no deploy.'
  );
  return sameOriginFallback;
}

if (import.meta.env.PROD && !configuredApiUrl) {
  console.warn('VITE_API_URL nao esta definido em producao. Usando o mesmo dominio do frontend como fallback.');
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Estudio:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@Estudio:token');
      localStorage.removeItem('@Estudio:user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
