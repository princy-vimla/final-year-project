import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, GraduationCap, Briefcase, Code, Star, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API = axios.create({ baseURL: '/api', timeout: 30000 });

export default function Dashboard({ profile, setProfile }) {
  const [step, setStep] = useState(0);
  const [streams, setStreams] = useState([]);
  const [paths, setPaths] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [roles, setRoles] = useState([]);
  const [roleData, setRoleData] = useState(null);
  const [salaryData, setSalaryData] = useState([]);
  const [companies, setCompanies] = useState({});
  const [expandedCo, setExpandedCo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/career/streams');
      const s = res.data?.streams || [];
      setStreams(s);
      if (s.length === 0) setError('No streams loaded. Check backend is running on port 8000.');
    } catch (e) {
      setError(`Cannot reach backend: ${e.message}. Make sure "python run.py" is running.`);
    }
    setLoading(false);
  };

  const selectStream = async (stream) => {
    setProfile(p => ({ ...p, stream: stream.id }));
    setLoading(true);
    try {
      const res = await API.get(`/career/paths/${stream.id}`);
      setPaths(res.data);
      setStep(1);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const selectPath = (path) => { setSelectedPath(path); setStep(2); };

  const selectCourse = (course) => {
    setProfile(p => ({ ...p, course: course.id }));
    setRoles(course.career_roles || []);
    setStep(3);
  };

  const selectRole = async (roleId) => {
    setProfile(p => ({ ...p, target_role: roleId }));
    setLoading(true);
    try {
      const res = await API.get(`/career/role/${roleId}`);
      setRoleData(res.data);
      setStep(4);
      loadSalary(roleId);
      loadCompanies();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const loadSalary = async (roleId) => {
    const years = [0, 1, 3, 5, 8, 12, 16];
    const types = ['product_company', 'faang', 'service_company'];
    const results = [];
    for (const yr of years) {
      const entry = { year: `${yr}yr` };
      for (const ct of types) {
        try {
          const res = await API.get(`/career/salary-estimate?role_id=${roleId}&experience=${yr}&city=bangalore&company_type=${ct}`);
          entry[ct] = res.data.estimated_ctc_lpa || 0;
        } catch { entry[ct] = 0; }
      }
      results.push(entry);
    }
    setSalaryData(results);
  };

  const loadCompanies = async () => {
    try {
      const res = await API.get('/career/companies');
      setCompanies(res.data.companies || {});
    } catch (e) { console.error(e); }
  };

  const stepLabels = ['Stream', 'Path', 'Course', 'Role', 'Details'];

  const streamEmoji = (id) => ({ bio_math: '🧬', cse_math: '💻', commerce: '📊', pcm: '⚛️', arts_humanities: '🎨' }[id] || '📚');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold neon-text mb-1">NeuroCareer AI Dashboard</h1>
        <p className="text-gray-400">Navigate your career from stream to senior leadership</p>
      </motion.div>

      {/* Step Wizard */}
      <div className="glass p-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {stepLabels.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                i === step ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium' :
                i < step ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-white/5 text-gray-600 border border-white/10'
              }`}>{i + 1}. {s}</div>
              {i < stepLabels.length - 1 && <ChevronRight size={14} className={i < step ? 'text-green-400' : 'text-gray-700'} />}
            </React.Fragment>
          ))}
        </div>

        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="text-sm text-gray-400 hover:text-cyan-400 mb-4 flex items-center gap-1">
            ← Back
          </button>
        )}

        {/* Error display */}
        {error && (
          <div className="glass-card p-4 border-l-4 border-red-500 flex items-start gap-3 mb-4">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={loadStreams} className="text-xs text-cyan-400 hover:underline mt-1">Retry →</button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: STREAMS */}
          {step === 0 && !loading && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold neon-text mb-2">Choose Your Stream</h2>
              <p className="text-gray-400 text-sm mb-5">What did you study after 10th standard?</p>
              {streams.length === 0 && !error && (
                <p className="text-gray-500 text-sm">Loading streams...</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streams.map(s => (
                  <button key={s.id} onClick={() => selectStream(s)} className="glass-card p-6 text-left hover:scale-[1.02] transition-transform">
                    <div className="text-3xl mb-3">{streamEmoji(s.id)}</div>
                    <h3 className="text-lg font-semibold text-white mb-1">{s.label}</h3>
                    <p className="text-sm text-gray-400">{s.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1: PATHS */}
          {step === 1 && paths && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold neon-text mb-2">Choose Your Path</h2>
              <p className="text-gray-400 text-sm mb-5">How do you want to proceed?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(paths.paths || []).map((p, i) => (
                  <button key={i} onClick={() => selectPath(p)} className="glass-card p-5 text-left hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      {p.type === 'entrance_exam' ? <Zap className="text-yellow-400" size={20} /> : <GraduationCap className="text-cyan-400" size={20} />}
                      <h3 className="font-semibold text-white">{p.label}</h3>
                    </div>
                    {p.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.difficulty === 'very_high' ? 'bg-red-500/20 text-red-400' :
                        p.difficulty === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>{p.difficulty.replace('_', ' ')} difficulty</span>
                    )}
                    <p className="text-sm text-gray-400 mt-2">{(p.courses || []).length} courses available</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: COURSES */}
          {step === 2 && selectedPath && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold neon-text mb-2">Choose Your Course</h2>
              <p className="text-gray-400 text-sm mb-5">Select a degree program</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(selectedPath.courses || []).map(c => (
                  <button key={c.id} onClick={() => selectCourse(c)} className="glass-card p-4 text-left hover:scale-[1.02] transition-transform">
                    <Code className="text-purple-400 mb-2" size={20} />
                    <h3 className="font-semibold text-white text-sm mb-1">{c.label}</h3>
                    {c.duration_years && <p className="text-xs text-gray-400">{c.duration_years} years</p>}
                    <p className="text-xs text-cyan-400 mt-1">{(c.career_roles || []).length} career paths</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: ROLES */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold neon-text mb-2">Choose Your Career Role</h2>
              <p className="text-gray-400 text-sm mb-5">What career interests you?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map(r => (
                  <button key={r} onClick={() => selectRole(r)} className="glass-card p-4 text-left hover:scale-[1.02] transition-transform">
                    <Briefcase className="text-green-400 mb-2" size={18} />
                    <h3 className="font-medium text-white text-sm capitalize">{r.replace(/_/g, ' ')}</h3>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: ROLE DETAILS */}
          {step === 4 && roleData && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-xl font-bold neon-text">{roleData.role?.label}</h2>

              {/* Salary bands */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Entry Level', d: roleData.role?.entry_salary_lpa, color: 'text-cyan-400' },
                  { label: 'Mid Level', d: roleData.role?.mid_salary_lpa, color: 'text-purple-400' },
                  { label: 'Senior Level', d: roleData.role?.senior_salary_lpa, color: 'text-green-400' },
                ].map(({ label, d, color }) => d && (
                  <div key={label} className="glass-card p-5">
                    <p className="text-sm text-gray-400">{label}</p>
                    <p className={`text-2xl font-bold ${color} mt-1`}>₹{d.min}–₹{d.max} LPA</p>
                    <p className="text-xs text-gray-500 mt-1">Avg: ₹{d.avg} LPA</p>
                  </div>
                ))}
              </div>

              {/* Growth path */}
              {roleData.role?.growth_path && (
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-white mb-3">Career Growth Path</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {roleData.role.growth_path.map((g, i) => (
                      <React.Fragment key={g}>
                        <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs border border-cyan-500/20 capitalize">{g.replace(/_/g, ' ')}</span>
                        {i < roleData.role.growth_path.length - 1 && <ChevronRight size={12} className="text-gray-600" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {roleData.role?.required_skills && (
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-white mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {roleData.role.required_skills.map(s => (
                      <span key={s} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs border border-purple-500/20">{s.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Future impact */}
              {roleData.future_impact?.ai_impact_by_2030 && (
                <div className="glass-card p-5 border-l-2 border-yellow-500">
                  <h3 className="font-semibold text-yellow-400 mb-2">⚡ AI Impact by 2030</h3>
                  <p className="text-sm text-gray-300">{roleData.future_impact.ai_impact_by_2030}</p>
                  {roleData.future_impact.survival_strategy && (
                    <p className="text-sm text-green-400 mt-2">Strategy: {roleData.future_impact.survival_strategy}</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mr-3" />
            <span className="text-gray-400">Loading...</span>
          </div>
        )}
      </div>

      {/* Salary Chart */}
      {salaryData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">💰 Salary Trajectory — Bangalore (LPA)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salaryData}>
              <defs>
                <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b347ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#b347ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e52" />
              <XAxis dataKey="year" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ background: '#0f0f2e', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="faang" name="FAANG" stroke="#00f5ff" fill="url(#gf)" strokeWidth={2} />
              <Area type="monotone" dataKey="product_company" name="Product Co." stroke="#b347ea" fill="url(#gp)" strokeWidth={2} />
              <Area type="monotone" dataKey="service_company" name="Service Co." stroke="#ff6b6b" fill="url(#gs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Company Cards */}
      {Object.keys(companies).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-white">🏢 Company Deep Dive</h3>
          {Object.entries(companies).map(([key, co]) => (
            <div key={key} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedCo(expandedCo === key ? null : key)}
                className="w-full p-5 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-lg font-bold text-cyan-400">
                    {(co.name || 'C')[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{co.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Star size={12} className="text-yellow-400" />
                      <span className="text-xs text-yellow-400">{co.glassdoor_rating}</span>
                      <span className="text-xs text-gray-500">WLB: {co.work_life_balance}/5</span>
                    </div>
                  </div>
                </div>
                {expandedCo === key ? <ChevronUp className="text-gray-400" size={18} /> : <ChevronDown className="text-gray-400" size={18} />}
              </button>

              {expandedCo === key && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-5 pb-5 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(co.levels || {}).map(([lvl, info]) => (
                      <div key={lvl} className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-medium text-sm">{info.title}</span>
                          <span className="text-xs text-gray-500">{lvl}</span>
                        </div>
                        <p className="text-green-400 text-base font-bold">
                          ₹{info.total_ctc_lpa?.min}–₹{info.total_ctc_lpa?.max} LPA
                        </p>
                        <p className="text-xs text-gray-400">
                          In-hand: ₹{Math.round((info.in_hand_monthly?.min || 0) / 1000)}K–₹{Math.round((info.in_hand_monthly?.max || 0) / 1000)}K/mo
                        </p>
                        {info.stock_rsu_yearly_lpa && (
                          <p className="text-xs text-purple-400 mt-0.5">RSU: ₹{info.stock_rsu_yearly_lpa} LPA/yr</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(co.benefits || []).map((b, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">{b}</span>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border-l-2 border-yellow-500">
                    <p className="text-sm text-gray-300">{co.reviews_summary}</p>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
