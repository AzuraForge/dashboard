// ========== DOSYA: dashboard/src/services/api.js ==========
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Tüm tamamlanmış/çalışan deney görevlerini API'dan çeker.
 * Şu anda sahte veri döndürüyor. Gerçek veritabanı eklendiğinde güncellenecek.
 */
export const fetchExperiments = () => {
  return apiClient.get('/experiments');
};

/**
 * Yeni bir deneyi başlatmak için API'a istek gönderir.
 * @param {object} config - Deney konfigürasyonu (pipeline_name, data_sourcing, training_params vb.)
 */
export const startNewExperiment = (config) => {
  return apiClient.post('/experiments', config);
};

/**
 * Platformda kurulu ve keşfedilmiş tüm pipeline'ları ve varsayılan 
 * konfigürasyonlarını API'dan çeker.
 */
export const fetchAvailablePipelines = () => {
  return apiClient.get('/pipelines'); 
};

/**
 * Belirli bir görevin (task) anlık durumunu sorgular.
 * @param {string} taskId - Celery görev ID'si
 */
export const getTaskStatus = (taskId) => {
  return apiClient.get(`/experiments/${taskId}/status`);
};