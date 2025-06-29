import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css'; 

// YENİ: Toast bildirimleri için gerekli importlar
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import NewExperiment from './components/NewExperiment';
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
    // GÜNCELLEME: Rota kontrolünü daha esnek hale getiriyoruz
    if (path === '/' && (location.pathname === '/' || location.pathname.startsWith('/experiments'))) return true;
    return location.pathname === path;
  };

  return (
    <div className="app-layout">
      {/* YENİ: Toast bildirimlerinin render edileceği konteyner */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <aside className="sidebar">
        <h2>AzuraForge</h2>
        <nav>
          <ul>
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''}>
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
            setTrackingTaskId={setTrackingTaskId} // YENİ: Çalışan deneyi canlı izlemek için
          />} />
          {/* GÜNCELLEME: /experiments rotasını kaldırdık, anasayfa artık orası */}
          <Route path="/new-experiment" element={<NewExperiment onExperimentStarted={handleExperimentStarted} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;