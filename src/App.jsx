// ========== DOSYA: dashboard/src/App.jsx ==========
import { useState } from 'react';
import './App.css'; // Stil dosyasını import et

// Bileşenleri import et
import ExperimentsList from './components/ExperimentsList';
import NewExperiment from './components/NewExperiment';
import ExperimentTracker from './components/ExperimentTracker';

function App() {
  const [activeTab, setActiveTab] = useState('new'); // Varsayılan olarak "Yeni Deney Başlat" sekmesini açalım
  const [trackingTaskId, setTrackingTaskId] = useState(null); // Takip edilen görev ID'si

  // Yeni bir deney başlatıldığında çağrılacak callback
  const handleExperimentStarted = (taskId) => {
    if (taskId) {
        setTrackingTaskId(taskId); // Takip edilecek görevi ayarla
        setActiveTab('tracker');   // Canlı takip sekmesine otomatik geçiş yap
    }
  };

  // Aktif sekmeye göre doğru bileşeni render et
  const renderContent = () => {
    switch (activeTab) {
      case 'new':
        return <NewExperiment onExperimentStarted={handleExperimentStarted} />;
      case 'tracker':
        return <ExperimentTracker taskId={trackingTaskId} />;
      case 'list':
      default: // Varsayılan olarak listeyi göster
        return <ExperimentsList />;
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1><span role="img" aria-label="brain">🧠</span> AzuraForge Dashboard</h1>
        <p>Deney Yönetim ve İzleme Merkezi</p>
      </header>
      
      <nav className="tabs">
          <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'active' : ''}>📊 Deney Listesi</button>
          <button onClick={() => setActiveTab('new')} className={activeTab === 'new' ? 'active' : ''}>🚀 Yeni Deney Başlat</button>
          {/* Sadece bir görev takip edildiğinde Canlı Takip sekmesini göster */}
          {trackingTaskId && (
            <button onClick={() => setActiveTab('tracker')} className={activeTab === 'tracker' ? 'active' : ''}>🛰️ Canlı Takip</button>
          )}
      </nav>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;