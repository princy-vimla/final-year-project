import React, { useState, useEffect } from 'react';
import { getMarketPulse, getJobTrends } from '../utils/api';
import { motion } from 'framer-motion';
import { TrendingUp, Globe, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MarketPage({ profile }) {
  const [pulse, setPulse] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, t] = await Promise.all([getMarketPulse(), profile.target_role ? getJobTrends(profile.target_role) : Promise.resolve({ data: null })]);
      setPulse(p.data); if (t.data) setTrends(t.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const chartData = (pulse?.hottest_skills_2024_2025 || []).map(s => ({ name: s.skill.substring(0, 18), growth: parseInt(s.demand_growth) }));

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}><h1 className="text-3xl font-bold neon-text mb-1">📊 Market Intelligence</h1><p className="text-gray-400">Real-time tech job market insights</p></motion.div>
      {pulse && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5"><Globe className="text-cyan-400 mb-2" size={24} /><p className="text-sm text-gray-400">Tech Hiring</p><p className="text-2xl font-bold text-white capitalize">{pulse.overall_tech_hiring}</p></div>
        <div className="glass-card p-5"><Zap className="text-purple-400 mb-2" size={24} /><p className="text-sm text-gray-400">Remote AI Roles</p><p className="text-xl font-bold text-white">{pulse.remote_work_trend}</p></div>
        <div className="glass-card p-5"><TrendingUp className="text-green-400 mb-2" size={24} /><p className="text-sm text-gray-400">Layoff Recovery</p><p className="text-xl font-bold text-white">{pulse.layoff_recovery_index}</p></div>
      </div>}
      {chartData.length > 0 && <div className="glass-card p-6"><h3 className="font-semibold text-white mb-4">🔥 Hottest Skills Demand Growth</h3><ResponsiveContainer width="100%" height={350}><BarChart data={chartData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e1e52" /><XAxis type="number" stroke="#666" /><YAxis type="category" dataKey="name" stroke="#888" width={150} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ background: '#0f0f2e', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '8px' }} /><Bar dataKey="growth" fill="#00f5ff" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}
      {pulse?.india_specific && <div className="glass-card p-6"><h3 className="font-semibold text-white mb-4">🇮🇳 India Insights</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Object.entries(pulse.india_specific).map(([k, v]) => <div key={k} className="flex justify-between py-2 border-b border-white/5"><span className="text-sm text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span><span className="text-sm text-white font-medium">{v}</span></div>)}</div></div>}
      {trends && <div className="glass-card p-6"><h3 className="font-semibold text-white mb-4">Companies Hiring: {trends.role?.replace(/_/g, ' ')}</h3><div className="flex flex-wrap gap-2">{(trends.top_companies_hiring || []).map((c, i) => <span key={i} className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/20">{c}</span>)}</div></div>}
    </div>
  );
}