// ========== GÜNCELLENECEK DOSYA: dashboard/src/services/api.js ==========
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({ baseURL: API_BASE_URL });

export const fetchExperiments = () => apiClient.get('/experiments');
export const startNewExperiment = (config) => apiClient.post('/experiments', config);
export const fetchAvailablePipelines = () => apiClient.get('/pipelines');
export const getTaskStatus = (taskId) => apiClient.get(`/experiments/${taskId}/status`);