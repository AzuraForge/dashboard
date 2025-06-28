// ========== GÜNCELLENECEK DOSYA: dashboard/src/App.jsx ==========
import { useState } from 'react';
import './App.css';
import ExperimentsList from './components/ExperimentsList';
import NewExperiment from './components/NewExperiment';
import ExperimentTracker from './components/ExperimentTracker'; // Yeni bileşeni import et

function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [trackingTaskId, setTrackingTaskId] = useState(null); // Takip edilen görev ID'si

  const handleExperimentStarted = (taskId) => {
    setTrackingTaskId(taskId); // Takip edilecek görevi ayarla
    setActiveTab('tracker'); // Canlı takip sekmesine geç
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'new':
        return <NewExperiment onExperimentStarted={handleExperimentStarted} />;
      case 'tracker':
        return <ExperimentTracker taskId={trackingTaskId} />;
      case 'list':
      default:
        return <ExperimentsList />;
    }
  };

  return (
    <div className="container">
      <header>...</header>
      <nav className="tabs">
          <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'active' : ''}>📊 Deney Listesi</button>
          <button onClick={() => setActiveTab('new')} className={activeTab === 'new' ? 'active' : ''}>🚀 Yeni Deney Başlat</button>
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