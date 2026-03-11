import axios, { AxiosError } from 'axios';

declare global {
  interface Window {
    APP_CONFIG?: { apiUrl?: string };
  }
}

function normalizeUrl(value?: string) {
  return value?.trim().replace(/\/+$/, '') || '';
}

function resolveApiBaseUrl(): string {
  // 1. Runtime config — editável em env.js sem precisar reconstruir o frontend
  const runtimeUrl = normalizeUrl(window.APP_CONFIG?.apiUrl);
  if (runtimeUrl) return runtimeUrl;

  // 2. Variável de build (VITE_API_URL definida na plataforma de deploy)
  const buildUrl = normalizeUrl(import.meta.env.VITE_API_URL);
  if (buildUrl) return buildUrl;

  // 3. Em desenvolvimento usa localhost
  if (!import.meta.env.PROD) return 'http://localhost:3333';

  // 4. Último recurso: mesmo domínio do frontend (funciona só se backend e
  //    frontend estiverem no mesmo servidor)
  console.warn(
    '[API] URL do backend nao configurada. Defina apiUrl em public/env.js ou a variavel VITE_API_URL no seu servico de deploy. Usando mesmo dominio como fallback: ' +
      window.location.origin
  );
  return window.location.origin;
}

export const resolvedBaseUrl = resolveApiBaseUrl();

if (import.meta.env.PROD) {
  console.info('[API] Base URL configurada para:', resolvedBaseUrl);
}

export const api = axios.create({
  baseURL: resolvedBaseUrl,
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
