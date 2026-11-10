import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Interceptor: Adiciona o token de autorização se ele existir no LocalStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Finance:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});