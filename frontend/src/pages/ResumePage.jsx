import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, User, Mail, Phone, Github, Cpu, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API = axios.create({ baseURL: '/api', timeout: 60000 });

function StrengthBar({ score }) {
  const color = score >= 70 ? '#00ff88' : score >= 45 ? '#fbbf24' : '#ef4444';
  const label = score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : 'Needs Work';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Resume Strength: <span style={{ color }}>{label}</span></span>
        <span style={{ color }}>{score}/100</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1 }}
          className="h-1.5 rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

export default function ResumePage({ profile, setProfile }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [aiInsights, setAiInsights] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true); setError(''); setResult(null); setAiInsights('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      if (setProfile && res.data) {
        setProfile(p => ({
          ...p,
          skills: res.data.skills_found || [],
          experience_years: res.data.experience_years || 0,
          target_role: res.data.suggested_roles?.[0] || p.target_role,
        }));
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to parse resume. Ensure backend is running.');
    }
    setUploading(false);
  }, [setProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1
  });

  const getAICoaching = async () => {
    if (!result) return;
    setAiLoading(true); setAiInsights('');
    try {
      const res = await API.post('/simulate/perspective/skill_coach', {
        stage: 'working',
        target_role: result.suggested_roles?.[0] || 'software_engineer',
        experience_years: result.experience_years || 0,
        skills: result.skills_found || [],
        goal: `Get hired as ${(result.suggested_roles?.[0] || 'software engineer').replace(/_/g, ' ')} and grow career`,
        city: profile.city || 'bangalore',
      }, { timeout: 120000 });
      setAiInsights(res.data?.analysis || 'No insights generated.');
    } catch (e) {
      setAiInsights('Could not get AI insights — ensure Ollama is running.');
    }
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <FileText className="text-cyan-400" size={26} />
          <h1 className="text-3xl font-bold neon-text">Resume Intelligence</h1>
        </div>
        <p className="text-gray-400">Upload your PDF — OCR extracts text even from scanned resumes</p>
      </motion.div>

      {/* Upload */}
      <div {...getRootProps()} className={`glass-card p-10 border-2 border-dashed cursor-pointer text-center transition-all ${isDragActive ? 'border-cyan-400 bg-cyan-500/5' : 'border-gray-700 hover:border-cyan-500/50'}`}>
        <input {...getInputProps()} />
        {uploading
          ? <div className="flex flex-col items-center"><Loader2 className="text-cyan-400 animate-spin mb-3" size={40} /><p className="text-white">Parsing resume...</p><p className="text-gray-500 text-sm mt-1">Running OCR if needed</p></div>
          : <div className="flex flex-col items-center"><Upload className="text-cyan-400 mb-3" size={40} /><p className="text-white font-semibold text-lg">Drop resume PDF here</p><p className="text-gray-500 text-sm mt-1">or click to browse • Max 10MB</p></div>
        }
      </div>

      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={18} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results + PDF side by side */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Analysis Results */}
          <div className="space-y-4">
            {/* Header card */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl font-bold text-cyan-400">
                  {result.contact_info?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{result.contact_info?.name || 'Candidate'}</h3>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {result.contact_info?.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={11} />{result.contact_info.email}</span>}
                    {result.contact_info?.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={11} />{result.contact_info.phone}</span>}
                    {result.contact_info?.github && <span className="flex items-center gap-1 text-xs text-gray-400"><Github size={11} />{result.contact_info.github}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.resume_strength === 'strong' ? 'bg-green-500/20 text-green-400' : result.resume_strength === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {result.resume_strength}
                  </span>
                  <span className="text-xs text-gray-500">{result.ocr_used ? '🔍 OCR' : '📄 Text'}</span>
                </div>
              </div>
              <StrengthBar score={result.strength_score || 50} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-3 text-center">
                <p className="text-2xl font-bold text-cyan-400">{result.skill_count || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">Skills Found</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">{result.experience_years || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">Years Exp</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{result.companies_worked?.length || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">Companies</p>
              </div>
            </div>

            {/* Suggested roles */}
            <div className="glass-card p-4">
              <h4 className="font-semibold text-white mb-3 text-sm">🎯 Suggested Career Roles</h4>
              <div className="space-y-1.5">
                {(result.suggested_roles || []).map((r, i) => (
                  <div key={r} className={`flex items-center gap-2 p-2 rounded-lg ${i === 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'}`}>
                    <span className={`text-sm capitalize flex-1 ${i === 0 ? 'text-green-400 font-medium' : 'text-gray-300'}`}>
                      {i === 0 ? '⭐ ' : `${i + 1}. `}{r.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="glass-card p-4">
              <h4 className="font-semibold text-white mb-3 text-sm">⚡ Detected Skills ({result.skills_found?.length || 0})</h4>
              <div className="flex flex-wrap gap-1.5">
                {(result.skills_found || []).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-xs border border-cyan-500/15">{s}</span>
                ))}
                {(!result.skills_found || result.skills_found.length === 0) && (
                  <p className="text-gray-500 text-xs">No skills detected. PDF may be image-based — install Tesseract for OCR.</p>
                )}
              </div>
            </div>

            {/* Education + Companies */}
            {(result.education?.length > 0 || result.companies_worked?.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {result.education?.length > 0 && (
                  <div className="glass-card p-4">
                    <h4 className="font-semibold text-white mb-2 text-sm">🎓 Education</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {result.education.map(e => <span key={e} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs capitalize">{e}</span>)}
                    </div>
                  </div>
                )}
                {result.companies_worked?.length > 0 && (
                  <div className="glass-card p-4">
                    <h4 className="font-semibold text-white mb-2 text-sm">🏢 Companies</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {result.companies_worked.map(c => <span key={c} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs">{c}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Coaching */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2"><Cpu className="text-cyan-400" size={16} /> AI Skill Coach</h4>
                <button onClick={getAICoaching} disabled={aiLoading}
                  className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs hover:bg-cyan-500/30 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {aiLoading ? <><Loader2 size={12} className="animate-spin" /> Analyzing...</> : '🚀 Get AI Coaching'}
                </button>
              </div>
              {aiInsights
                ? <div className="prose prose-invert prose-sm max-w-none prose-strong:text-cyan-400 prose-p:my-1"><ReactMarkdown>{aiInsights}</ReactMarkdown></div>
                : <p className="text-gray-500 text-xs">Click above to get personalized coaching based on your resume</p>
              }
            </div>
          </div>

          {/* RIGHT: PDF Viewer */}
          <div className="glass-card p-4 flex flex-col">
            <h4 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
              <FileText className="text-cyan-400" size={16} /> Resume Preview
            </h4>
            {result.pdf_base64
              ? <iframe
                  src={`data:application/pdf;base64,${result.pdf_base64}`}
                  className="w-full rounded-lg border border-gray-700 flex-1"
                  style={{ minHeight: '600px' }}
                  title="Resume Preview"
                />
              : <div className="flex flex-col items-center justify-center flex-1 py-12 text-gray-500">
                  <FileText size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">PDF preview not available</p>
                  <p className="text-xs mt-1">The file may be too large or corrupted</p>
                </div>
            }
            <div className="mt-3 text-xs text-gray-500 flex items-center gap-3">
              <span>Extracted: {result.total_text_length || 0} chars</span>
              <span>•</span>
              <span>Method: {result.extraction_method || 'pypdf2'}</span>
              {result.ocr_used && <span className="text-purple-400">• OCR applied</span>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Import ReactMarkdown if needed */}
      {result && !window._mdImported && <span style={{display:'none'}} ref={() => { window._mdImported = true }} />}
    </div>
  );
}
