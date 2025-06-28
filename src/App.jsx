// ========== DOSYA: src/App.jsx ==========
import { useState } from 'react';
import './App.css';
import ExperimentsList from './components/ExperimentsList';
import NewExperiment from './components/NewExperiment';

function App() {
  const [activeTab, setActiveTab] = useState('list');

  const refreshAndSwitchToList = () => {
    setActiveTab('list');
    // ExperimentsList bileşeni kendi kendini yenilediği için ekstra bir şey yapmaya gerek yok
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
      </nav>

      <main className="main-content">
        {activeTab === 'list' && <ExperimentsList />}
        {activeTab === 'new' && <NewExperiment onExperimentStarted={refreshAndSwitchToList} />}
      </main>
    </div>
  );
}

export default App;