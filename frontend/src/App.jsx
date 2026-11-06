import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Agreements from './pages/Agreements';
import RequestAnalyzer from './pages/RequestAnalyzer';
import MemoryCenter from './pages/MemoryCenter';
import LearningHistory from './pages/LearningHistory';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="projects" element={<Projects />} />
          <Route path="agreements" element={<Agreements />} />
          <Route path="analyzer" element={<RequestAnalyzer />} />
          <Route path="memory" element={<MemoryCenter />} />
          <Route path="history" element={<LearningHistory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
