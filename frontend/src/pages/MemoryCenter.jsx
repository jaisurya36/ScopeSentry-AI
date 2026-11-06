import { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  RefreshCw,
  FolderOpen,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { projectsAPI, clientsAPI, memoryAPI } from '../services/api';

export default function MemoryCenter() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [memories, setMemories] = useState([]);
  const [bankId, setBankId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hindsightStatus, setHindsightStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [projs, cls, status] = await Promise.all([
        projectsAPI.getAll(),
        clientsAPI.getAll(),
        memoryAPI.getStatus().catch(() => ({ hindsight_available: false })),
      ]);
      setProjects(projs || []);
      setClients(cls || []);
      setHindsightStatus(status);

      if (projs && projs.length > 0) {
        setSelectedProjectId(projs[0].id.toString());
        setSelectedClientId(projs[0].client_id.toString());
        fetchMemories(projs[0].id, projs[0].client_id);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchMemories(projectId, clientId) {
    if (!projectId || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await memoryAPI.getProjectMemories(projectId, clientId);
      setMemories(data.memories || []);
      setBankId(data.bank_id || '');
    } catch (err) {
      setMemories([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim() || !selectedProjectId || !selectedClientId) return;
    setSearchLoading(true);
    setError(null);
    try {
      const data = await memoryAPI.searchMemories(
        selectedProjectId,
        selectedClientId,
        searchQuery
      );
      setMemories(data.memories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleProjectChange(e) {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    const proj = projects.find((p) => p.id.toString() === projId);
    if (proj) {
      setSelectedClientId(proj.client_id.toString());
      fetchMemories(proj.id, proj.client_id);
    }
  }

  function getMemoryCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('agreement') || lower.includes('deliverables')) {
      return { label: 'Agreement', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
    if (lower.includes('out_of_scope') || lower.includes('out of scope')) {
      return { label: 'Out of Scope', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
    }
    if (lower.includes('in_scope') || lower.includes('in scope')) {
      return { label: 'In Scope', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
    }
    if (lower.includes('decision') || lower.includes('scope analysis')) {
      return { label: 'Decision', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    }
    if (lower.includes('discussion') || lower.includes('requested')) {
      return { label: 'Client Request', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
    return { label: 'Persistent Memory', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Client Memory Center</h1>
              <p className="text-xs text-slate-400">
                Persistent Hindsight memory banks isolated per client & project
              </p>
            </div>
          </div>
        </div>

        {/* Hindsight Status Badge */}
        <div className="flex items-center gap-2">
          {hindsightStatus?.hindsight_available ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Hindsight Engine Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Hindsight Not Configured</span>
            </div>
          )}
        </div>
      </div>

      {/* Selectors and Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Project Selector */}
        <div className="lg:col-span-5 rounded-xl border border-blue-900/30 bg-slate-900/60 p-4 backdrop-blur-md">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Target Project & Memory Bank
          </label>
          <div className="flex gap-2">
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="w-full rounded-lg bg-slate-950 border border-slate-700/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => fetchMemories(selectedProjectId, selectedClientId)}
              disabled={loading}
              className="flex items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              title="Refresh memories"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {bankId && (
            <p className="mt-2 text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <span className="text-blue-400">Bank ID:</span> {bankId}
            </p>
          )}
        </div>

        {/* Semantic Memory Search */}
        <div className="lg:col-span-7 rounded-xl border border-blue-900/30 bg-slate-900/60 p-4 backdrop-blur-md">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Query Client Memory (Hindsight Recall)
          </label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. payment gateway, revisions limit, budget discussions..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700/60 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>Recall</span>
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            Performs vector semantic retrieval over stored commitments and scope decisions.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Memory Retrieval Notice</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Memory Cards Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Stored Context Records</span>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300 font-mono">
              {memories.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-blue-900/30 bg-slate-900/40 p-12 text-center">
            <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Recalling memories from Hindsight...</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <Brain className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-300">No Memories Stored Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Agreements, client scope requests, and approved changes for this project will be
              automatically indexed here using Hindsight persistent memory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {memories.map((mem, idx) => {
              const category = getMemoryCategory(mem);
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 hover:border-blue-900/60 transition-colors backdrop-blur-sm shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${category.color}`}
                    >
                      {category.label}
                    </span>
                    <span className="text-xs font-mono text-slate-500">Record #{idx + 1}</span>
                  </div>
                  <pre className="font-sans text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {mem}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
