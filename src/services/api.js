// dashboard/src/services/api.js
import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000/api/v1';

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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
};

export const registerUser = (username, password) => {
    return apiClient.post('/auth/register', { username, password });
};

// Mevcut API fonksiyonları
export const fetchExperiments = () => apiClient.get('/experiments');
export const startNewExperiment = (config) => apiClient.post('/experiments', config);
export const fetchAvailablePipelines = () => apiClient.get('/pipelines'); 
export const fetchPipelineDefaultConfig = (pipelineId) => apiClient.get(`/pipelines/${pipelineId}/config`);
export const fetchExperimentDetails = (experimentId) => apiClient.get(`/experiments/${experimentId}/details`);

// === YENİ RAPOR FONKSİYONLARI ===
export const fetchReportContent = (experimentId) => apiClient.get(`/experiments/${experimentId}/report/content`);
// İmaj URL'ini doğrudan oluşturacağımız için ayrı bir fetch fonksiyonuna gerek yok.
// === DEĞİŞİKLİK SONU ===