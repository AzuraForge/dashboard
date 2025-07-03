import { useState, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css';
import { ThemeContext } from './context/ThemeContext';

import TopNavbar from './components/TopNavbar';
import NewExperimentPanel from './components/NewExperimentPanel';
import DashboardOverview from './pages/DashboardOverview';
import ModelRegistry from './pages/ModelRegistry';

function App() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isNewExperimentPanelOpen, setIsNewExperimentPanelOpen] = useState(false);

  const handleExperimentStarted = () => {
    setIsNewExperimentPanelOpen(false);
    navigate('/');
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
}

export default App;