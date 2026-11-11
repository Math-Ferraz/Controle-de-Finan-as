import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://controle-de-financas-1au6.onrender.com',
});

// Injeta o token nas requisições buscando a chave correta @Finance:token
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('@Finance:token') || localStorage.getItem('token');

  // Trata caso o token esteja guardado como string JSON por engano
  if (token && token.startsWith('{')) {
    try {
      const parsed = JSON.parse(token);
      token = parsed.access_token || token;
    } catch (e) {
      // Mantém a string original
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata expiração de sessão (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('@Finance:token');
      localStorage.removeItem('token');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);