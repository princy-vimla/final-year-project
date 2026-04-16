import React, { useState, useEffect } from 'react';
import { getFuturePrediction, getEmergingRoles } from '../utils/api';
import { motion } from 'framer-motion';
import { Telescope, AlertTriangle, Clock, Rocket, Shield, Zap } from 'lucide-react';

export default function FuturePage({ profile }) {
  const [prediction, setPrediction] = useState(null);
  const [emerging, setEmerging] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [profile.target_role]);

  const loadData = async () => {
    try {
      const [p, e] = await Promise.all([
        profile.target_role ? getFuturePrediction(profile.target_role, 5) : Promise.resolve({ data: null }),
        getEmergingRoles()
      ]);
      if (p.data) setPrediction(p.data);
      setEmerging(e.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}><h1 className="text-3xl font-bold neon-purple mb-1">🔮 Future Vision</h1><p className="text-gray-400">Predict how your career will evolve with AI, quantum, and emerging tech</p></motion.div>

      {prediction && <>
        <div className="glass-card p-6"><h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-400" /> AI Automation Risk</h3><div className="relative h-4 bg-white/10 rounded-full overflow-hidden mb-2"><motion.div initial={{ width: 0 }} animate={{ width: `${prediction.automation_risk_percent_by_2030}%` }} transition={{ duration: 1.5 }} className={`h-full rounded-full ${prediction.automation_risk_percent_by_2030 > 50 ? 'bg-red-500' : prediction.automation_risk_percent_by_2030 > 30 ? 'bg-yellow-500' : 'bg-green-500'}`} /></div><p className="text-sm text-gray-400">{prediction.automation_risk_percent_by_2030}% of tasks may be automated by 2030</p></div>

        <div className="glass-card p-6"><h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Clock className="text-cyan-400" /> Career Timeline</h3><div className="space-y-4">{prediction.timeline_prediction?.map((t, i) => <motion.div key={t.year} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} className="flex gap-4"><div className="flex flex-col items-center"><div className={`w-3 h-3 rounded-full ${t.phase === 'consolidation' ? 'bg-cyan-400' : t.phase === 'expansion' ? 'bg-purple-400' : 'bg-green-400'}`} />{i < prediction.timeline_prediction.length - 1 && <div className="w-0.5 flex-1 bg-gray-700 mt-1" />}</div><div className="pb-4"><div className="flex items-center gap-2"><span className="font-bold text-white">{t.year}</span><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${t.phase === 'consolidation' ? 'bg-cyan-500/10 text-cyan-400' : t.phase === 'expansion' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>{t.phase}</span></div><p className="text-sm text-gray-300 mt-1">{t.advice}</p><p className="text-xs text-gray-500 mt-1">{t.market_prediction}</p></div></motion.div>)}</div></div>

        <div className="glass-card p-6"><h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Shield className="text-green-400" /> Survival Strategies</h3><div className="space-y-2">{prediction.survival_strategies?.map((s, i) => <div key={i} className="flex items-start gap-3 py-2"><Zap className="text-cyan-400 shrink-0 mt-0.5" size={16} /><p className="text-sm text-gray-300">{s}</p></div>)}</div></div>
      </>}

      <div className="glass-card p-6"><h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Rocket className="text-purple-400" /> Emerging Roles 2025-2035</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.entries(emerging).map(([k, r]) => <div key={k} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition-colors"><h4 className="font-semibold text-white mb-1">{r.label}</h4><div className="flex items-center gap-2 mb-2"><span className="text-xs text-gray-500">Emerges: {r.emergence_year}</span><span className="text-xs text-gray-500">→ Mature: {r.maturity_year}</span></div><p className="text-sm text-green-400">₹{r.estimated_salary_lpa?.entry} - ₹{r.estimated_salary_lpa?.senior} LPA</p><p className="text-xs text-gray-400 mt-2">{r.demand_prediction}</p></div>)}</div></div>
    </div>
  );
}