// ========== DOSYA: src/services/api.js ==========
import axios from 'axios';

// API sunucumuzun adresini merkezi bir yerden alıyoruz
const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Tüm deneyleri API'dan çeker.
 */
export const fetchExperiments = () => {
  return apiClient.get('/experiments');
};

/**
 * Yeni bir deneyi başlatmak için API'a istek gönderir.
 * @param {object} config - Deney konfigürasyonu
 */
export const startNewExperiment = (config) => {
  return apiClient.post('/experiments', config);
};