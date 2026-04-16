import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Cpu, TrendingUp, Telescope } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ResumePage from './pages/ResumePage';
import SimulatorPage from './pages/SimulatorPage';
import MarketPage from './pages/MarketPage';
import FuturePage from './pages/FuturePage';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/resume', icon: FileText, label: 'Resume' },
  { path: '/simulator', icon: Cpu, label: 'Simulator' },
  { path: '/market', icon: TrendingUp, label: 'Market' },
  { path: '/future', icon: Telescope, label: 'Future' },
];

function Sidebar() {
  const location = useLocation();
  return (
    <div className="w-60 glass m-3 p-5 flex flex-col gap-2 shrink-0">
      <div className="flex items-center gap-3 mb-8 px-2">
        <span className="text-3xl">🧠</span>
        <h1 className="text-lg font-bold neon-text">NeuroCareer AI</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}>
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="pulse-dot"></div>
          <span className="text-xs text-green-400">LLM Online</span>
        </div>
        <p className="text-xs text-gray-500">mistral via Ollama</p>
        <p className="text-xs text-gray-500 mt-1">10 Agents Active</p>
      </div>
    </div>
  );
}

function App() {
  const [profile, setProfile] = useState({
    stage: '', stream: '', course: '', target_role: '',
    experience_years: 0, skills: [], company_type: '',
    city: 'bangalore', goal: 'career growth', current_salary_lpa: 0,
  });

  return (
    <Router>
      <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a, #0f0f2e, #161640)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard profile={profile} setProfile={setProfile} />} />
            <Route path="/resume" element={<ResumePage profile={profile} setProfile={setProfile} />} />
            <Route path="/simulator" element={<SimulatorPage profile={profile} setProfile={setProfile} />} />
            <Route path="/market" element={<MarketPage profile={profile} />} />
            <Route path="/future" element={<FuturePage profile={profile} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;