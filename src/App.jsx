import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css'; 

// Bileşenleri import et
import NewExperiment from './components/NewExperiment';
import ExperimentDetailPage from './components/ExperimentDetailPage'; 
import DashboardOverview from './pages/DashboardOverview';
import LiveTrackerPane from './components/LiveTrackerPane'; // YENİ: Canlı takip paneli

function App() {
  const [trackingTaskId, setTrackingTaskId] = useState(null); // Canlı takip edilen görev ID'si
  const navigate = useNavigate();
  const location = useLocation();

  const handleExperimentStarted = (taskId) => {
    if (taskId) {
        setTrackingTaskId(taskId); // SADECE state'i güncelle, yönlendirme yok!
    }
  };
  
  const handleCloseTracker = () => {
    setTrackingTaskId(null); // Takip panelini kapat
  };

  const isActive = (path) => {
    if (path === '/experiments' && (location.pathname === '/' || location.pathname.startsWith('/experiments'))) return true;
    return location.pathname === path;
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>AzuraForge</h2>
        <nav>
          <ul>
            <li>
              <Link to="/experiments" className={isActive('/experiments') ? 'active' : ''}>
                <span role="img" aria-label="dashboard">📊</span> Genel Bakış
              </Link>
            </li>
            <li>
              <Link to="/new-experiment" className={isActive('/new-experiment') ? 'active' : ''}>
                <span role="img" aria-label="rocket">🚀</span> Yeni Deney Başlat
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        {/* YENİ: Canlı takip paneli burada, rotaların üstünde render edilecek */}
        {trackingTaskId && (
          <LiveTrackerPane 
            taskId={trackingTaskId} 
            onClose={handleCloseTracker} 
          />
        )}
      
        <Routes>
          <Route path="/" element={<DashboardOverview 
            onExperimentSelect={(id) => navigate(`/experiments/${id}`)} 
            onNewExperimentClick={() => navigate('/new-experiment')}
          />} />
          <Route path="/experiments" element={<DashboardOverview 
            onExperimentSelect={(id) => navigate(`/experiments/${id}`)} 
            onNewExperimentClick={() => navigate('/new-experiment')}
          />} />
          <Route path="/new-experiment" element={<NewExperiment onExperimentStarted={handleExperimentStarted} />} />
          <Route path="/experiments/:experimentId" element={<ExperimentDetailPage />} />
          {/* /tracker/:taskId rotası kaldırıldı */}
        </Routes>
      </main>
    </div>
  );
}

export default App;