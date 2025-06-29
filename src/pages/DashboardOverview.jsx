import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import ExperimentsList from '../components/ExperimentsList';
import ComparisonView from '../components/ComparisonView';
import { fetchExperiments, startNewExperiment } from '../services/api';

function DashboardOverview({ onNewExperimentClick, setTrackingTaskId }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtreleme ve Arama State'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Karşılaştırma State'leri
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const [comparisonData, setComparisonData] = useState(null);

  const getExperiments = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const response = await fetchExperiments();
      // Gelen veriyi başlangıç zamanına göre sırala (en yeni en üstte)
      const sortedData = response.data.sort((a, b) => new Date(b.config.start_time) - new Date(a.config.start_time));
      setExperiments(sortedData);
      setError(null);
    } catch (err) {
      setError('API sunucusuna bağlanılamadı veya veri çekilemedi. Servislerin çalıştığından emin olun.');
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  };

  useEffect(() => {
    getExperiments(true); // Sayfa ilk yüklendiğinde loading göstergesiyle veri çek
    const intervalId = setInterval(() => getExperiments(false), 5000); // Arka planda sessizce güncelle
    return () => clearInterval(intervalId); // Component unmount olduğunda interval'ı temizle
  }, []);

  // Mevcut deneylerden dinamik olarak durum listesi oluşturur
  const allStatuses = useMemo(() => {
    const statuses = new Set(experiments.map(exp => exp.status));
    return ['ALL', ...Array.from(statuses).sort()];
  }, [experiments]);

  // Filtrelenmiş deneyleri hesaplar
  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      // Durum filtresi
      const statusMatch = filterStatus === 'ALL' || exp.status === filterStatus;
      if (!statusMatch) return false;

      // Arama terimi filtresi (ID, pipeline adı veya ticker sembolü)
      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const searchFields = [
          exp.experiment_id,
          exp.config?.pipeline_name,
          exp.config?.data_sourcing?.ticker
        ];
        return searchFields.some(field => field?.toLowerCase().includes(lowerCaseSearchTerm));
      }

      return true;
    });
  }, [experiments, filterStatus, searchTerm]);
  
  // Karşılaştırma için deney seçme/kaldırma fonksiyonu
  const handleComparisonSelect = (experimentId) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(experimentId)) {
        newSelection.delete(experimentId);
      } else {
        newSelection.add(experimentId);
      }
      return newSelection;
    });
  };

  // Bir deneyi konfigürasyonuyla yeniden çalıştırma fonksiyonu
  const handleReRun = async (experimentConfig) => {
    // Yeniden çalıştırmadan önce eski ID ve zaman bilgilerini temizle
    const { experiment_id, task_id, start_time, ...configToReRun } = experimentConfig;
    toast.info(`"${configToReRun.pipeline_name}" deneyi yeniden başlatılıyor...`);
    try {
      const response = await startNewExperiment(configToReRun);
      toast.success(`Deney başarıyla gönderildi! ID: ${response.data.task_id}`);
      setTrackingTaskId(response.data.task_id); // Yeniden çalıştırılan deneyi canlı izlemeye başla
    } catch (err) {
      toast.error('Deney yeniden başlatılamadı.');
    }
  };

  // Karşılaştırma modalını açar
  const handleStartComparison = () => {
    const dataToCompare = experiments.filter(exp => selectedForComparison.has(exp.experiment_id));
    if (dataToCompare.length > 1) {
      setComparisonData(dataToCompare);
    }
  };

  // Yükleme ve Hata durumları için gösterilecek arayüz
  if (loading) return <p style={{textAlign: 'center', padding: '40px'}}>Deney verileri yükleniyor...</p>;
  if (error) return <p style={{textAlign: 'center', padding: '40px', color: 'var(--error-color)'}}>{error}</p>;

  return (
    <div className="dashboard-overview">
      {/* Karşılaştırma modalı, sadece data varsa render edilir */}
      {comparisonData && <ComparisonView experiments={comparisonData} onClose={() => setComparisonData(null)}/>}
      
      <div className="page-header">
        <h1>Genel Bakış</h1>
        <p>Tüm deneylerinizi tek bir yerden yönetin, takip edin ve karşılaştırın.</p>
      </div>
      
      {/* Filtreleme ve Aksiyonlar Paneli */}
      <div className="card" style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="search-term">Arama</label>
              <input type="text" id="search-term" placeholder="ID, Pipeline, Sembol ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-status">Durum</label>
              <select id="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                {allStatuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Tümü' : s}</option>)}
              </select>
            </div>
          </div>
          <button 
            className="button-primary" 
            onClick={handleStartComparison} 
            disabled={selectedForComparison.size < 2} 
            title={selectedForComparison.size < 2 ? 'Karşılaştırmak için en az 2 deney seçin' : ''}
          >
            <span role="img" aria-label="scales">⚖️</span> Seçilenleri Karşılaştır ({selectedForComparison.size})
          </button>
        </div>
      </div>
      
      {/* Deney Tablosu */}
      <ExperimentsList 
        experiments={filteredExperiments} 
        selectedIds={selectedForComparison} 
        onSelect={handleComparisonSelect} 
        onReRun={handleReRun} 
        setTrackingTaskId={setTrackingTaskId} 
      />
    </div>
  );
}
DashboardOverview.propTypes = { 
  onNewExperimentClick: PropTypes.func.isRequired, 
  setTrackingTaskId: PropTypes.func.isRequired, 
};
export default DashboardOverview;