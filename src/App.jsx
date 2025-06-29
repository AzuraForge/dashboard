// ========== GÜNCELLENECEK DOSYA: dashboard/src/App.jsx (React Router Entegrasyonu) ==========
import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'; // Router bileşenleri import edildi
import './App.css'; 

// Bileşenleri import et
import ExperimentsList from './components/ExperimentsList';
import NewExperiment from './components/NewExperiment';
import ExperimentTracker from './components/ExperimentTracker';
// Yeni oluşturacağımız deney detay sayfası bileşeni (şimdilik placeholder)
import ExperimentDetailPage from './components/ExperimentDetailPage'; // Henüz yok, sonra oluşturacağız

function App() {
  const [trackingTaskId, setTrackingTaskId] = useState(null);
  const navigate = useNavigate(); // Programatik navigasyon için
  const location = useLocation(); // Mevcut yolu almak için

  // Yeni bir deney başlatıldığında çağrılacak callback
  const handleExperimentStarted = (taskId) => {
    if (taskId) {
        setTrackingTaskId(taskId); // Takip edilecek görevi ayarla
        // Canlı takip sayfasına yönlendir
        navigate(`/tracker/${taskId}`); // Yönlendirmeyi değiştiriyoruz
    }
  };

  // Sekme butonlarının aktif durumunu belirlemek için yardımcı fonksiyon
  const isActive = (path) => location.pathname === path || (path === '/tracker' && location.pathname.startsWith('/tracker/'));

  return (
    <div className="container">
      <header className="app-header">
        <h1><span role="img" aria-label="brain">🧠</span> AzuraForge Dashboard</h1>
        <p>Deney Yönetim ve İzleme Merkezi</p>
      </header>
      
      <nav className="tabs">
          {/* Link bileşenleri ile navigasyon */}
          <Link to="/experiments" className={isActive('/experiments') ? 'active' : ''}>📊 Deney Listesi</Link>
          <Link to="/new-experiment" className={isActive('/new-experiment') ? 'active' : ''}>🚀 Yeni Deney Başlat</Link>
          
          {/* Eğer bir görev takip ediliyorsa veya tracker sayfasındaysak canlı takip sekmesini göster */}
          {trackingTaskId && (
            <Link to={`/tracker/${trackingTaskId}`} className={isActive('/tracker') ? 'active' : ''}>🛰️ Canlı Takip</Link>
          )}
      </nav>

      <main className="main-content">
        {/* Routes ve Route bileşenleri ile sayfa yönlendirmesi */}
        <Routes>
          <Route path="/" element={<ExperimentsList />} /> {/* Ana sayfa */}
          <Route path="/experiments" element={<ExperimentsList />} />
          <Route path="/new-experiment" element={<NewExperiment onExperimentStarted={handleExperimentStarted} />} />
          <Route path="/tracker/:taskId" element={<ExperimentTracker />} /> {/* Task ID'ye göre takip */}
          <Route path="/experiments/:experimentId" element={<ExperimentDetailPage />} /> {/* Yeni deney detay sayfası */}
        </Routes>
      </main>
    </div>
  );
}

export default App;