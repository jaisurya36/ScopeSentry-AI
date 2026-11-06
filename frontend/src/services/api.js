import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const clientsAPI = {
  getAll: () => api.get('/clients/'),
  create: (data) => api.post('/clients/', data),
  get: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const projectsAPI = {
  getAll: (clientId) => api.get('/projects/', { params: clientId ? { client_id: clientId } : {} }),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const agreementsAPI = {
  getAll: (filters) => api.get('/agreements/', { params: filters }),
  create: (data) => api.post('/agreements/', data),
  get: (id) => api.get(`/agreements/${id}`),
  update: (id, data) => api.put(`/agreements/${id}`, data),
};

export const analyzerAPI = {
  analyze: (data) => api.post('/analyze', data),
  getAnalyses: (filters) => api.get('/analyses', { params: filters }),
  getAnalysis: (id) => api.get(`/analyses/${id}`),
};

export const memoryAPI = {
  getProjectMemories: (projectId, clientId) => api.get(`/memory/${projectId}/${clientId}`),
  searchMemories: (projectId, clientId, query) => api.post(`/memory/${projectId}/${clientId}/search`, { query }),
  getStatus: () => api.get('/memory/status'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getStatus: () => api.get('/dashboard/status'),
};

export const demoAPI = {
  setup: () => api.post('/demo/setup'),
};

export default api;
