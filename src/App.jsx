// dashboard/src/App.jsx
import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css';
import { useAuth } from './context/AuthContext';

import TopNavbar from './components/TopNavbar';
import NewExperimentPanel from './components/NewExperimentPanel';
import DashboardOverview from './pages/DashboardOverview';
import ModelRegistry from './pages/ModelRegistry';
import LoginPage from './pages/LoginPage'; // <-- Yeni
import ProtectedRoute from './components/ProtectedRoute'; // <-- Yeni

function App() {
  const { theme } = useAuth(); // Tema context'i artık Auth'dan geliyor gibi varsayılabilir, ama kendi context'i var.
  const navigate = useNavigate();
  const [isNewExperimentPanelOpen, setIsNewExperimentPanelOpen] = useState(false);

  const handleExperimentStarted = () => {
    setIsNewExperimentPanelOpen(false);
    navigate('/');
  };

  const handleOpenNewExperimentPanel = () => setIsNewExperimentPanelOpen(true);
  const handleCloseNewExperimentPanel = () => setIsNewExperimentPanelOpen(false);
  
  // İçerik, sadece korumalı yollarda gösterilecek
  const AppLayout = () => (
    <div className="app-layout">
      <TopNavbar onNewExperimentClick={handleOpenNewExperimentPanel} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/models" element={<ModelRegistry />} />
        </Routes>
      </main>
      <NewExperimentPanel 
        isOpen={isNewExperimentPanelOpen} 
        onClose={handleCloseNewExperimentPanel} 
        onExperimentStarted={handleExperimentStarted} 
      />
    </div>
  );

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={5000} theme={theme === 'dark' ? 'dark' : 'light'} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
           {/* Korunan tüm yollar buraya gelecek */}
           <Route path="/*" element={<AppLayout />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;