import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchExperiments = () => apiClient.get('/experiments');
export const startNewExperiment = (config) => apiClient.post('/experiments', config);
export const fetchAvailablePipelines = () => apiClient.get('/pipelines'); 
export const fetchPipelineDefaultConfig = (pipelineId) => apiClient.get(`/pipelines/${pipelineId}/config`);