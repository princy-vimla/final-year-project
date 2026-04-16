import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Cpu, Play, GitBranch, CheckCircle, XCircle,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import axios from 'axios';

// ─── constants ───────────────────────────────────────────────────────────────

const ROLES = [
  ['software_engineer','Software Engineer'],['ai_engineer','AI Engineer'],
  ['ml_engineer','ML Engineer'],['gen_ai_developer','Gen AI Developer'],
  ['data_analyst','Data Analyst'],['data_scientist','Data Scientist'],
  ['computer_vision_engineer','Computer Vision Eng.'],['devops_engineer','DevOps Engineer'],
  ['cloud_engineer','Cloud Engineer'],['cloud_architect','Cloud Architect'],
  ['full_stack_developer','Full Stack Developer'],['backend_engineer','Backend Engineer'],
  ['frontend_engineer','Frontend Engineer'],['mobile_developer','Mobile Developer'],
  ['security_analyst','Security Analyst'],['penetration_tester','Penetration Tester'],
  ['data_engineer','Data Engineer'],['mlops_engineer','MLOps Engineer'],
  ['blockchain_developer','Blockchain Developer'],['game_developer','Game Developer'],
  ['xr_developer','XR / Spatial Developer'],['embedded_engineer','Embedded Engineer'],
  ['iot_developer','IoT Developer'],['robotics_engineer','Robotics Engineer'],
  ['edge_ai_engineer','Edge AI Engineer'],['ui_ux_designer','UI/UX Designer'],
  ['product_manager','Product Manager'],['ai_product_manager','AI Product Manager'],
  ['research_scientist','Research Scientist'],['ai_safety_researcher','AI Safety Researcher'],
  ['quant_developer','Quant Developer'],['management_consultant','Management Consultant'],
  ['financial_analyst','Financial Analyst'],['chartered_accountant','Chartered Accountant'],
  ['digital_marketer','Digital Marketer'],['ev_engineer','EV Engineer'],
  ['entrepreneur','Entrepreneur / Founder'],['solution_architect','Solutions Architect'],
];

const WHAT_IFS = [
  { id: 'switch_company', label: '🏢 Switch to FAANG',    desc: 'Google / Microsoft / Amazon?' },
  { id: 'masters',        label: '🎓 Pursue Masters',     desc: 'MS abroad vs MTech India?' },
  { id: 'freelance',      label: '💼 Go Freelance',       desc: 'Earn more as consultant?' },
  { id: 'startup',        label: '🚀 Join Startup',       desc: 'Risk vs reward analysis' },
  { id: 'management',     label: '👥 Go Management',      desc: 'IC vs Manager track?' },
  { id: 'specialize',     label: '🔬 Hyper-Specialize',   desc: 'Deep dive one niche' },
  { id: 'abroad',         label: '✈️ Relocate Abroad',    desc: 'Best countries & visa' },
  { id: 'upskill',        label: '📚 3-Month Sprint',     desc: 'Intensive upskill ROI' },
];

// ─── AgentCard ────────────────────────────────────────────────────────────────

function AgentCard({ agent, isThinking, index }) {
  const [expanded, setExpanded] = useState(false);

  if (isThinking) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border-l-2 border-cyan-500/40"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{agent.icon}</span>
          <p className="text-white text-sm font-medium">{agent.name}</p>
          <div className="ml-auto flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-cyan-400" />
            <span className="text-xs text-cyan-400">Thinking...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const isError = agent.status !== 'success';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card cursor-pointer transition-all ${isError ? 'border-yellow-500/20' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">{agent.icon}</span>
          <h4 className="font-semibold text-white flex-1 text-sm">{agent.name}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isError ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
            {isError ? '⏱ slow' : '✓ done'}
          </span>
          {expanded ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
        </div>
        <div className={`text-sm text-gray-300 transition-all ${expanded ? '' : 'line-clamp-4'}`}>
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-strong:text-cyan-400 prose-p:my-1 prose-li:my-0.5">
            {agent.analysis || 'No response generated.'}
          </ReactMarkdown>
        </div>
        {!expanded && <p className="text-xs text-cyan-400 mt-2">Click to expand ↓</p>}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SimulatorPage({ profile, setProfile }) {
  const [perspectives, setPerspectives]     = useState([]);
  const [thinkingAgent, setThinkingAgent]   = useState(null);
  const [isRunning, setIsRunning]           = useState(false);
  const [progress, setProgress]             = useState(0);
  const [error, setError]                   = useState('');
  const [activeModel, setActiveModel]       = useState('');
  const [ollamaOk, setOllamaOk]             = useState(null);

  const [whatIfResults, setWhatIfResults]   = useState([]);
  const [whatIfThinking, setWhatIfThinking] = useState(null);
  const [whatIfRunning, setWhatIfRunning]   = useState(false);
  const [whatIfSelected, setWhatIfSelected] = useState('');
  const [whatIfError, setWhatIfError]       = useState('');

  const esRef = useRef(null);

  useEffect(() => { checkOllama(); }, []);

  // cleanup on unmount
  useEffect(() => () => { if (esRef.current) esRef.current.close(); }, []);

  const checkOllama = async () => {
    try {
      const r = await axios.get('/api/simulate/health', { timeout: 6000 });
      setOllamaOk(r.data.ollama_available);
      setActiveModel(r.data.active_model || '');
    } catch { setOllamaOk(false); }
  };

  const upd = (f, v) => setProfile(p => ({ ...p, [f]: v }));

  // ── SSE runner ──────────────────────────────────────────────────────────────
  const startSSE = (url, onThinking, onResult, onDone, onError) => {
    // We POST the profile then open SSE
    // Because EventSource only supports GET, we POST first then use the SSE endpoint
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage:              profile.stage || 'working',
        stream:             profile.stream || null,
        course:             profile.course || null,
        target_role:        profile.target_role || 'software_engineer',
        experience_years:   parseInt(profile.experience_years) || 0,
        skills:             Array.isArray(profile.skills) ? profile.skills : [],
        company_type:       profile.company_type || null,
        city:               profile.city || 'bangalore',
        goal:               profile.goal || 'career growth',
        current_salary_lpa: parseFloat(profile.current_salary_lpa) || null,
      }),
    }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const read = () => {
        reader.read().then(({ done, value }) => {
          if (done) { onDone(); return; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'thinking') onThinking(data);
                else if (data.type === 'result') onResult(data);
                else if (data.type === 'done') { onDone(data.model); return; }
              } catch {}
            }
          }
          read();
        }).catch(err => {
          if (!err.message?.includes('aborted')) onError(err.message);
        });
      };
      read();
    }).catch(err => onError(err.message));
  };

  // ── Run main analysis ───────────────────────────────────────────────────────
  const runAnalysis = () => {
    if (!profile.target_role) { setError('Please select a Target Role first.'); return; }
    if (esRef.current) esRef.current.close();
    setIsRunning(true); setPerspectives([]); setThinkingAgent(null);
    setError(''); setProgress(0);

    startSSE(
      '/api/simulate/perspectives/stream',
      (data) => setThinkingAgent({ id: data.agent_id, name: data.name, icon: data.icon }),
      (data) => {
        setThinkingAgent(null);
        setPerspectives(prev => [...prev, data]);
        setProgress(Math.round(((data.index + 1) / 10) * 100));
      },
      (model) => {
        setIsRunning(false);
        setThinkingAgent(null);
        setProgress(100);
        if (model) setActiveModel(model);
      },
      (errMsg) => {
        setIsRunning(false);
        setThinkingAgent(null);
        setError(`Stream error: ${errMsg}. Check backend terminal.`);
      }
    );
  };

  // ── Run what-if ─────────────────────────────────────────────────────────────
  const runWhatIf = (id) => {
    setWhatIfSelected(id); setWhatIfRunning(true);
    setWhatIfResults([]); setWhatIfThinking(null); setWhatIfError('');

    const url = `/api/simulate/what-if/stream?change=${id}`;
    startSSE(
      url,
      (data) => setWhatIfThinking({ id: data.agent_id, name: data.name, icon: data.icon }),
      (data) => {
        setWhatIfThinking(null);
        setWhatIfResults(prev => [...prev, data]);
      },
      () => { setWhatIfRunning(false); setWhatIfThinking(null); },
      (errMsg) => { setWhatIfRunning(false); setWhatIfThinking(null); setWhatIfError(errMsg); }
    );
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────
  const completedCount = perspectives.length;
  const totalExpected  = 10;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Cpu className="text-cyan-400" size={26} />
          <h1 className="text-3xl font-bold neon-text">Career Simulator</h1>
        </div>
        <p className="text-gray-400">10 AI agents analyze your career — results appear one by one as each agent finishes</p>
      </motion.div>

      {/* Ollama banner */}
      {ollamaOk === false && (
        <div className="glass-card p-4 border-l-4 border-red-500 flex items-start gap-3">
          <XCircle className="text-red-400 shrink-0" size={18} />
          <div>
            <p className="text-red-400 font-medium text-sm">Ollama not detected</p>
            <p className="text-gray-400 text-xs mt-1">Run <code className="bg-black/30 px-1 rounded text-yellow-400">ollama serve</code> in a terminal, then click Recheck.</p>
            <button onClick={checkOllama} className="mt-2 text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <RefreshCw size={11}/> Recheck
            </button>
          </div>
        </div>
      )}
      {ollamaOk === true && (
        <div className="glass-card p-3 border-l-4 border-green-500 flex items-center gap-3">
          <CheckCircle className="text-green-400 shrink-0" size={16} />
          <p className="text-green-400 text-sm">
            Ollama online — using <strong className="text-cyan-400">{activeModel || 'phi3:mini'}</strong> — 10 agents ready
          </p>
          <button onClick={checkOllama} className="ml-auto text-xs text-gray-500 hover:text-cyan-400">
            <RefreshCw size={12}/>
          </button>
        </div>
      )}

      {/* Profile Form */}
      <div className="glass p-6">
        <h3 className="font-semibold text-white mb-4">Your Career Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div>
            <label className="text-xs text-gray-400 block mb-1">Career Stage</label>
            <select value={profile.stage || ''} onChange={e => upd('stage', e.target.value)}
              className="w-full bg-[#0f0f2e] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none">
              <option value="">Select...</option>
              <option value="student">Student</option>
              <option value="graduate">Fresh Graduate (0-1yr)</option>
              <option value="working">Working Professional</option>
              <option value="experienced">Experienced (5+ yrs)</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-xs text-gray-400 block mb-1">Target / Current Role *</label>
            <select value={profile.target_role || ''} onChange={e => upd('target_role', e.target.value)}
              className="w-full bg-[#0f0f2e] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none">
              <option value="">Select role...</option>
              {ROLES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Experience (years)</label>
            <input type="number" min="0" max="30" value={profile.experience_years || 0}
              onChange={e => upd('experience_years', e.target.value)}
              className="w-full bg-[#0f0f2e] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none"/>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">City</label>
            <select value={profile.city || 'bangalore'} onChange={e => upd('city', e.target.value)}
              className="w-full bg-[#0f0f2e] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none">
              <option value="bangalore">Bangalore</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="pune">Pune</option>
              <option value="chennai">Chennai</option>
              <option value="delhi_ncr">Delhi NCR</option>
              <option value="mumbai">Mumbai</option>
              <option value="coimbatore">Coimbatore</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Company Type</label>
            <select value={profile.company_type || ''} onChange={e => upd('company_type', e.target.value)}
              className="w-full bg-[#0f0f2e] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none">
              <option value="">Select...</option>
              <option value="faang">FAANG / Big Tech</option>
              <option value="product_company">Product Company</option>
              <option value="funded_startup">Funded Startup</option>
              <option value="mid_tier_it">Mid-Tier IT</option>
              <option value="service_company">IT Services (TCS/Infosys)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Current CTC (LPA)</label>
            <input type="number" min="0" value={profile.current_salary_lpa || ''}
              onChange={e => upd('current_salary_lpa', e.target.value)} placeholder="e.g. 12"
              className="w-full bg-[#0f0f2e] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none"/>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Career Goal</label>
            <input type="text" value={profile.goal || ''} onChange={e => upd('goal', e.target.value)}
              placeholder="e.g. 50 LPA in 3 years"
              className="w-full bg-[#0f0f2e] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none"/>
          </div>

          <div className="flex items-end col-span-2 md:col-span-1">
            <button onClick={runAnalysis} disabled={isRunning || !profile.target_role}
              className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg px-4 py-2 font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
              {isRunning ? <Loader2 size={15} className="animate-spin"/> : <Play size={15}/>}
              {isRunning ? `${completedCount}/10 agents done...` : 'Run 10-Agent Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={18}/>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Progress bar while running */}
      {(isRunning || (perspectives.length > 0 && perspectives.length < 10)) && (
        <div className="glass-card p-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>
              {isRunning
                ? thinkingAgent
                  ? `🤔 ${thinkingAgent.name} is analyzing...`
                  : 'Starting agents...'
                : `✅ ${completedCount} of 10 agents complete`}
            </span>
            <span>{Math.round((completedCount / 10) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-cyan-400 h-2 rounded-full"
              animate={{ width: `${Math.round((completedCount / 10) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            phi3:mini: ~20s per agent • Results appear live below as each finishes
          </p>
        </div>
      )}

      {/* Agent results — appear one by one */}
      {(perspectives.length > 0 || thinkingAgent || isRunning) && (
        <div className="space-y-3">
          {perspectives.length > 0 && (
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">🤖 Expert Perspectives</h3>
              {!isRunning && (
                <span className="text-xs text-gray-400 glass-card px-3 py-1">
                  {perspectives.filter(p => p.status === 'success').length}/{perspectives.length} agents responded
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perspectives.map((p, i) => (
              <AgentCard key={p.agent_id} agent={p} isThinking={false} index={i}/>
            ))}
            {thinkingAgent && (
              <AgentCard agent={thinkingAgent} isThinking={true} index={perspectives.length}/>
            )}
          </div>
        </div>
      )}

      {/* ── What-If Section ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <GitBranch className="text-purple-400" size={22}/>
          <h2 className="text-2xl font-bold text-white">What-If Simulator</h2>
        </div>
        <p className="text-gray-400 text-sm">Pick a scenario — all 10 agents analyze it with INR numbers. Results stream live.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WHAT_IFS.map(w => (
            <button key={w.id} onClick={() => runWhatIf(w.id)} disabled={whatIfRunning}
              className={`glass-card p-4 text-left transition-all hover:scale-[1.02]
                ${whatIfSelected === w.id && whatIfResults.length > 0 ? 'border-purple-400/40 bg-purple-500/5' : ''}
                ${whatIfRunning ? 'opacity-60 cursor-wait' : ''}`}>
              <p className="font-medium text-white text-sm mb-1">{w.label}</p>
              <p className="text-xs text-gray-400">{w.desc}</p>
            </button>
          ))}
        </div>

        {whatIfError && (
          <div className="glass-card p-4 border-l-4 border-red-500 flex items-start gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={18}/>
            <p className="text-red-400 text-sm">{whatIfError}</p>
          </div>
        )}

        {/* What-if progress */}
        {(whatIfRunning || (whatIfResults.length > 0 && whatIfResults.length < 10)) && (
          <div className="glass-card p-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>
                {whatIfRunning && whatIfThinking
                  ? `🤔 ${whatIfThinking.name} analyzing...`
                  : `✅ ${whatIfResults.length}/10 agents complete`}
              </span>
              <span>{Math.round((whatIfResults.length / 10) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div className="bg-purple-400 h-2 rounded-full"
                animate={{ width: `${Math.round((whatIfResults.length / 10) * 100)}%` }}
                transition={{ duration: 0.4 }}/>
            </div>
          </div>
        )}

        {/* What-if results */}
        {(whatIfResults.length > 0 || whatIfThinking) && (
          <div className="space-y-3">
            {whatIfResults.length > 0 && (
              <h3 className="text-lg font-bold text-white">
                {WHAT_IFS.find(w => w.id === whatIfSelected)?.label} — Analysis
              </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whatIfResults.map((p, i) => (
                <AgentCard key={`wi-${p.agent_id}`} agent={p} isThinking={false} index={i}/>
              ))}
              {whatIfThinking && (
                <AgentCard agent={whatIfThinking} isThinking={true} index={whatIfResults.length}/>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
