// dashboard/src/App.jsx

import { useState, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css';
import { ThemeContext } from './context/ThemeContext';

// Yeni Navigasyon ve Panel Bileşenleri
import TopNavbar from './components/TopNavbar';
import NewExperimentPanel from './components/NewExperimentPanel';

// Dashboard Overview hala ana içeriğimiz
import DashboardOverview from './pages/DashboardOverview';

function App() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isNewExperimentPanelOpen, setIsNewExperimentPanelOpen] = useState(false);

  // Deney başlatıldığında panelin kapanması ve ana sayfaya yönlendirme
  const handleExperimentStarted = () => {
    setIsNewExperimentPanelOpen(false); // Paneli kapat
    navigate('/'); // Ana sayfaya yönlendir
  };

  const handleOpenNewExperimentPanel = () => {
    setIsNewExperimentPanelOpen(true);
  };

  const handleCloseNewExperimentPanel = () => {
    setIsNewExperimentPanelOpen(false);
  };

  return (
    <div className="app-layout">
      <ToastContainer position="bottom-right" autoClose={5000} theme={theme} />
      
      {/* Sol menü kaldırıldı, yerine üst navigasyon çubuğu */}
      <TopNavbar onNewExperimentClick={handleOpenNewExperimentPanel} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          {/* NewExperiment sayfası artık bir rota olarak değil, yan panel olarak açılacak */}
        </Routes>
      </main>

      {/* Yeni Deney Yan Paneli */}
      <NewExperimentPanel 
        isOpen={isNewExperimentPanelOpen} 
        onClose={handleCloseNewExperimentPanel} 
        onExperimentStarted={handleExperimentStarted} 
      />
    </div>
  );
}

export default App;