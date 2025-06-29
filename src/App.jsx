// ========== GÜNCELLENECEK DOSYA: dashboard/src/App.jsx (Yeni Ana Layout ve Router) ==========
import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css'; // Yeni stil dosyasını import et

// Bileşenleri import et
import ExperimentsList from './components/ExperimentsList'; // Halen kullanılacak (sadece tablo gösterimi için)
import NewExperiment from './components/NewExperiment';
import ExperimentTracker from './components/ExperimentTracker';
import ExperimentDetailPage from './components/ExperimentDetailPage'; 
import DashboardOverview from './pages/DashboardOverview'; // Yeni Genel Bakış Sayfası

function App() {
  const [trackingTaskId, setTrackingTaskId] = useState(null); // Canlı takip edilen görev ID'si
  const navigate = useNavigate();
  const location = useLocation();

  // Yeni bir deney başlatıldığında çağrılacak callback
  const handleExperimentStarted = (taskId) => {
    if (taskId) {
        setTrackingTaskId(taskId); // Takip edilecek görevi ayarla
        navigate(`/tracker/${taskId}`); // Canlı takip sayfasına yönlendir
    }
  };

  // Aktif link stilini belirlemek için yardımcı fonksiyon
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/experiments';
    if (path === '/tracker' && location.pathname.startsWith('/tracker/')) return true;
    if (path === '/experiments' && location.pathname.startsWith('/experiments/')) return true;
    return location.pathname === path;
  };

  return (
    <div className="app-layout"> {/* Yeni ana layout div'i */}
      {/* Sidebar */}
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
            {/* Eğer bir görev takip ediliyorsa veya tracker sayfasındaysak canlı takip sekmesini göster */}
            {trackingTaskId && (
              <li>
                <Link to={`/tracker/${trackingTaskId}`} className={isActive('/tracker') ? 'active' : ''}>
                  <span role="img" aria-label="satellite">🛰️</span> Canlı Takip
                </Link>
              </li>
            )}
            {/* Diğer menü öğeleri (Uygulama Kataloğu, Model Kaydı vb.) buraya eklenebilir */}
          </ul>
        </nav>
      </aside>

      {/* Ana İçerik */}
      <main className="main-content">
        <Routes>
          {/* Ana sayfa "/experiments" ile aynı içeriği göstersin */}
          <Route path="/" element={<DashboardOverview 
            onExperimentSelect={(id) => navigate(`/experiments/${id}`)} 
            onNewExperimentClick={() => navigate('/new-experiment')}
          />} />
          <Route path="/experiments" element={<DashboardOverview 
            onExperimentSelect={(id) => navigate(`/experiments/${id}`)} 
            onNewExperimentClick={() => navigate('/new-experiment')}
          />} />
          <Route path="/new-experiment" element={<NewExperiment onExperimentStarted={handleExperimentStarted} />} />
          <Route path="/tracker/:taskId" element={<ExperimentTracker />} />
          <Route path="/experiments/:experimentId" element={<ExperimentDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;