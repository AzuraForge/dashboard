// ========== GÜNCELLENECEK DOSYA: dashboard/src/services/api.js ==========
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchExperiments = () => {
  // Bu, /api/v1/experiments adresine istek atar
  return apiClient.get('/experiments');
};

export const startNewExperiment = (config) => {
  // Bu, /api/v1/experiments adresine POST isteği atar
  return apiClient.post('/experiments', config);
};

export const fetchAvailablePipelines = () => {
  // Bu, /api/v1/pipelines adresine istek atar
  return apiClient.get('/pipelines');
};

export const getTaskStatus = (taskId) => {
  // Bu, /api/v1/experiments/{taskId}/status adresine istek atar
  return apiClient.get(`/experiments/${taskId}/status`);
};