// dashboard/src/services/api.js

import axios from 'axios';

// DÜZELTME: API_BASE_URL sabitini export ediyoruz
export const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchExperiments = () => apiClient.get('/experiments');

export const startNewExperiment = (config) => apiClient.post('/experiments', config);

export const fetchAvailablePipelines = () => apiClient.get('/pipelines'); 

export const fetchPipelineDefaultConfig = (pipelineId) => apiClient.get(`/pipelines/${pipelineId}/config`);

// YENİ FONKSİYON
export const fetchExperimentReport = (experimentId) => {
  // Rapor düz metin (markdown) olduğu için, responseType'ı 'text' olarak ayarlıyoruz.
  // Bu, axios'un yanıtı JSON olarak parse etmeye çalışmasını engeller.
  return apiClient.get(`/experiments/${experimentId}/report`, { responseType: 'text' });
};