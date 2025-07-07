import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const setAuthHeader = (token) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthHeader = () => {
    delete apiClient.defaults.headers.common['Authorization'];
};

export const loginUser = (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    return apiClient.post('/auth/token', formData, {
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    });
};

export const registerUser = (username, password) => {
    return apiClient.post('/auth/register', { username, password });
};

export const fetchExperiments = () => apiClient.get('/experiments');
export const startNewExperiment = (config) => apiClient.post('/experiments', config);
export const fetchAvailablePipelines = () => apiClient.get('/pipelines'); 
export const fetchPipelineDefaultConfig = (pipelineId) => apiClient.get(`/pipelines/${pipelineId}/config`);
export const fetchExperimentDetails = (experimentId) => apiClient.get(`/experiments/${experimentId}/details`);
export const fetchReportContent = (experimentId) => apiClient.get(`/experiments/${experimentId}/report/content`);

export const predictFromExperiment = (experimentId, payload) => {
    return apiClient.post(`/experiments/${experimentId}/predict`, payload);
};

// === YENİ FONKSİYON ===
// Rapor içindeki korumalı görselleri getirmek için
export const fetchReportImageBlob = (imageUrl) => {
  return apiClient.get(imageUrl, {
    responseType: 'blob'
  });
};