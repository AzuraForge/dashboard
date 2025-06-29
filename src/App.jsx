import { useState, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css'; 
import { ThemeContext } from './context/ThemeContext';
import NewExperiment from './pages/NewExperiment';
import DashboardOverview from './pages/DashboardOverview';
import LiveTrackerPane from './components/LiveTrackerPane';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [trackingTaskId, setTrackingTaskId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(ThemeContext);

  const handleExperimentStarted = (taskId) => {
    if (taskId) setTrackingTaskId(taskId);
  };
  
  const handleCloseTracker = () => {
    setTrackingTaskId(null);
  };

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname.startsWith('/experiments'))) return true;
    return location.pathname === path;
  };

  return (
    <div className="app-layout">
      <ToastContainer position="bottom-right" autoClose={5000} theme={theme} />
      <aside className="sidebar">
        <Logo />
        <nav style={{ flexGrow: 1 }}>
          <ul>
            <li><Link to="/" className={isActive('/') ? 'active' : ''}><span role="img" aria-label="dashboard">📊</span><span>Genel Bakış</span></Link></li>
            <li><Link to="/new-experiment" className={isActive('/new-experiment') ? 'active' : ''}><span role="img" aria-label="rocket">🚀</span><span>Yeni Deney</span></Link></li>
          </ul>
        </nav>
        <ThemeToggle />
      </aside>
      <main className="main-content">
        {trackingTaskId && <LiveTrackerPane taskId={trackingTaskId} onClose={handleCloseTracker} />}
        <Routes>
          <Route path="/" element={<DashboardOverview onNewExperimentClick={() => navigate('/new-experiment')} setTrackingTaskId={setTrackingTaskId} />} />
          <Route path="/new-experiment" element={<NewExperiment onExperimentStarted={handleExperimentStarted} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;