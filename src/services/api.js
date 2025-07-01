// dashboard/src/services/api.js

import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// fetchExperiments artık tüm detayları getiriyor
export const fetchExperiments = () => apiClient.get('/experiments');
export const startNewExperiment = (config) => apiClient.post('/experiments', config);
export const fetchAvailablePipelines = () => apiClient.get('/pipelines'); 
export const fetchPipelineDefaultConfig = (pipelineId) => apiClient.get(`/pipelines/${pipelineId}/config`);

// fetchExperimentDetails artık UI'da doğrudan kullanılmayacak, ancak API'de kalabilir.
export const fetchExperimentDetails = (experimentId) => {
  return apiClient.get(`/experiments/${experimentId}/details`);
};