// ========== GÜNCELLENECEK DOSYA: dashboard/src/App.jsx ==========
import { useState } from 'react';
import './App.css';
import ExperimentsList from './components/ExperimentsList';
import NewExperiment from './components/NewExperiment';
import ExperimentTracker from './components/ExperimentTracker';

function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [trackingTaskId, setTrackingTaskId] = useState(null);

  const handleExperimentStarted = (taskId) => {
    if (taskId) {
        setTrackingTaskId(taskId);
        setActiveTab('tracker');
    }
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
      <header className="app-header">
        <h1><span role="img" aria-label="brain">🧠</span> AzuraForge Dashboard</h1>
        <p>Deney Yönetim ve İzleme Merkezi</p>
      </header>
      
      <nav className="tabs">
          <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'active' : ''}>📊 Deney Listesi</button>
          <button onClick={() => setActiveTab('new')} className={activeTab === 'new' ? 'active' : ''}>🚀 Yeni Deney Başlat</button>
          {/* Sadece bir görevi takip ederken bu sekmeyi göster */}
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