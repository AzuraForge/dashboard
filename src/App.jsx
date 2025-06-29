import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css'; 

import NewExperiment from './components/NewExperiment';
// ExperimentDetailPage import'u kaldırıldı
import DashboardOverview from './pages/DashboardOverview';
import LiveTrackerPane from './components/LiveTrackerPane';

function App() {
  const [trackingTaskId, setTrackingTaskId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleExperimentStarted = (taskId) => {
    if (taskId) {
        setTrackingTaskId(taskId);
    }
  };
  
  const handleCloseTracker = () => {
    setTrackingTaskId(null);
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
                <span role="img" aria-label="dashboard">📊</span>
                <span>Genel Bakış</span>
              </Link>
            </li>
            <li>
              <Link to="/new-experiment" className={isActive('/new-experiment') ? 'active' : ''}>
                <span role="img" aria-label="rocket">🚀</span>
                <span>Yeni Deney</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        {trackingTaskId && (
          <LiveTrackerPane 
            taskId={trackingTaskId} 
            onClose={handleCloseTracker} 
          />
        )}
      
        <Routes>
          <Route path="/" element={<DashboardOverview 
            onNewExperimentClick={() => navigate('/new-experiment')}
          />} />
          <Route path="/experiments" element={<DashboardOverview 
            onNewExperimentClick={() => navigate('/new-experiment')}
          />} />
          <Route path="/new-experiment" element={<NewExperiment onExperimentStarted={handleExperimentStarted} />} />
          {/* /experiments/:experimentId rotası kaldırıldı */}
        </Routes>
      </main>
    </div>
  );
}

export default App;