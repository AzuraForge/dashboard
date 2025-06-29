// ========== DOSYA: dashboard/src/services/api.js (DEĞİŞİKLİK YOK) ==========
// Zaten mevcut kodunuzda bu fonksiyona ihtiyacımız yok.
// fetchAvailablePipelines endpointi ile zaten pipeline listesini çekiyoruz.
// Yeni eklenen get_pipeline_default_config() API endpointini kullanmak için yeni bir fonksiyon ekleyeceğiz.

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchExperiments = () => {
  return apiClient.get('/experiments');
};

export const startNewExperiment = (config) => {
  return apiClient.post('/experiments', config);
};

export const fetchAvailablePipelines = () => {
  return apiClient.get('/pipelines'); 
};

// YENİ FONKSİYON: Belirli bir pipeline'ın varsayılan konfigürasyonunu çeker
export const fetchPipelineDefaultConfig = (pipelineId) => {
  return apiClient.get(`/pipelines/${pipelineId}/config`);
};

export const getTaskStatus = (taskId) => {
  return apiClient.get(`/experiments/${taskId}/status`);
};