import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  Server,
  Database,
  Cpu,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { dashboardAPI } from '../services/api';

export default function Settings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const data = await dashboardAPI.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg shadow-black/40">
            <SettingsIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">System Settings & Health</h1>
            <p className="text-xs text-slate-400">
              Integrations, security posture, and persistent memory service connections
            </p>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3.5 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Groq Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Cpu className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Groq AI Engine</h3>
                <p className="text-xs text-slate-400">LLM Inference for Scope Decisions</p>
              </div>
            </div>

            {status?.groq?.available ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
                Not Configured
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Powers rapid, structured analysis comparing client requests against original agreements.
            Uses model <code className="text-blue-400 font-mono">llama-3.3-70b-versatile</code> with
            strict JSON schema output.
          </p>

          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">GROQ_API_KEY</span>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>Get API Key</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Hindsight Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Hindsight Persistent Memory</h3>
                <p className="text-xs text-slate-400">Vector & Reflection Memory Store</p>
              </div>
            </div>

            {status?.hindsight?.available ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
                Not Configured
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Maintains isolated persistent memory banks for each client project. Performs real-time
            <code className="text-blue-400 font-mono"> retain</code>,{' '}
            <code className="text-blue-400 font-mono">recall</code>, and{' '}
            <code className="text-blue-400 font-mono">reflect</code> operations across restarts.
          </p>

          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">HINDSIGHT_API_KEY</span>
            <a
              href="https://ui.hindsight.vectorize.io"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>Console & Keys</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Configuration Guide */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-blue-400" />
          <span>Configuring Environment Variables</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          For security, API keys are kept strictly on the backend and never exposed to browser clients.
          To configure or update your keys, edit the <code className="text-blue-400 font-mono">backend/.env</code> file:
        </p>
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <p><span className="text-slate-500"># Groq AI Key (llama-3.3-70b-versatile)</span></p>
          <p className="text-emerald-400">GROQ_API_KEY=gsk_your_groq_api_key_here</p>
          <p className="pt-2"><span className="text-slate-500"># Hindsight Cloud API Key</span></p>
          <p className="text-blue-400">HINDSIGHT_API_KEY=your_hindsight_api_key_here</p>
          <p className="text-slate-400">HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io</p>
          <p className="pt-2"><span className="text-slate-500"># Database Connection</span></p>
          <p className="text-purple-400">DATABASE_URL=sqlite+aiosqlite:///./scopesentry.db</p>
        </div>
      </div>

      {/* System Architecture Details */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
          <Server className="h-4 w-4 text-purple-400" />
          <span>Architecture & Security Boundary</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-1">
            <span className="font-semibold text-slate-200 block">Bank Isolation</span>
            <p className="text-slate-400">
              Each client project gets an isolated Hindsight memory bank (<code className="text-blue-400">scopesentry-project-X-client-Y</code>)
              so client data never mixes.
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-1">
            <span className="font-semibold text-slate-200 block">Truth Enforcement</span>
            <p className="text-slate-400">
              The AI is instructed strictly never to invent agreement terms. If an agreement is ambiguous or
              unspecified, it returns <code className="text-amber-400">NEEDS_CLARIFICATION</code>.
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-1">
            <span className="font-semibold text-slate-200 block">Dual Persistence</span>
            <p className="text-slate-400">
              Structured records are stored in SQLite via SQLAlchemy, while vector context and semantic
              reflection are stored in Hindsight Cloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
