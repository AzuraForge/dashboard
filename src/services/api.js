// dashboard/src/services/api.js
import axios from 'axios';

// === DEĞİŞİKLİK BURADA: API adresi artık ortam değişkeninden okunuyor ===
// Vite, .env dosyasındaki VITE_ ile başlayan değişkenleri import.meta.env nesnesine ekler.
// Eğer değişken tanımlı değilse, yerel geliştirme için varsayılan bir değer kullanırız.
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
    // loginUser endpoint'inin tam yolu baseURL'e göre değil, kök domaine göre olmalı.
    // baseURL /api/v1 içerdiği için, /auth/token'e gitmek için yolu düzeltmeliyiz.
    const loginUrl = `${API_BASE_URL.replace('/api/v1', '')}/auth/token`;

    return axios.post(loginUrl, formData, {
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    });
};

export const registerUser = (username, password) => {
    const registerUrl = `${API_BASE_URL.replace('/api/v1', '')}/auth/register`;
    return axios.post(registerUrl, { username, password });
};

// Diğer API fonksiyonları apiClient'i kullandığı için
// baseURL'den dolayı doğru şekilde çalışmaya devam edecek.
export const fetchExperiments = () => apiClient.get('/experiments');
export const startNewExperiment = (config) => apiClient.post('/experiments', config);
export const fetchAvailablePipelines = () => apiClient.get('/pipelines'); 
export const fetchPipelineDefaultConfig = (pipelineId) => apiClient.get(`/pipelines/${pipelineId}/config`);
export const fetchExperimentDetails = (experimentId) => apiClient.get(`/experiments/${experimentId}/details`);
export const fetchReportContent = (experimentId) => apiClient.get(`/experiments/${experimentId}/report/content`);

// Tahmin endpoint'i de apiClient'i kullanacak şekilde düzenlenmeli.
// PredictionModal.jsx içinde doğrudan URL oluşturmak yerine, buradan çağırmak daha doğru.
export const predictFromExperiment = (experimentId, payload) => {
    return apiClient.post(`/experiments/${experimentId}/predict`, payload);
};