import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  History,
  CheckCircle,
  AlertOctagon,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { analyzerAPI, projectsAPI } from '../services/api';

export default function LearningHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [analysesData, projectsData] = await Promise.all([
        analyzerAPI.getAnalyses(),
        projectsAPI.getAll(),
      ]);
      setAnalyses(analysesData || []);
      setProjects(projectsData || []);
    } catch (err) {
      console.error('Failed to load history data:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredAnalyses =
    selectedProjectId === 'all'
      ? analyses
      : analyses.filter((a) => a.project_id.toString() === selectedProjectId);

  // Group by project to show cumulative context progression
  const projectStats = analyses.reduce((acc, a) => {
    acc[a.project_id] = (acc[a.project_id] || 0) + 1;
    return acc;
  }, {});

  function getDecisionBadge(decision) {
    switch (decision) {
      case 'IN_SCOPE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            IN SCOPE
          </span>
        );
      case 'OUT_OF_SCOPE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400">
            <AlertOctagon className="h-3.5 w-3.5" />
            OUT OF SCOPE
          </span>
        );
      case 'NEEDS_CLARIFICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
            <HelpCircle className="h-3.5 w-3.5" />
            NEEDS CLARIFICATION
          </span>
        );
    }
  }

  function getRiskBadge(risk) {
    const map = {
      HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return (
      <span
        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
          map[risk] || map.MEDIUM
        }`}
      >
        {risk || 'MEDIUM'} RISK
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Learning & Context Progression</h1>
            <p className="text-xs text-slate-400">
              Track how ScopeSentry accumulates persistent context across real client interactions
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Projects ({analyses.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.name} ({projectStats[p.id] || 0} interactions)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Concept Explainer Banner */}
      <div className="rounded-2xl border border-violet-900/30 bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-900/40 p-5 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-slate-300">
            <h3 className="text-sm font-semibold text-white">Persistent Memory Accumulation</h3>
            <p>
              Unlike standard LLM prompts that forget after every chat, ScopeSentry retains every signed
              agreement, scope request, decision, and approved change inside Hindsight memory banks.
              Each subsequent analysis recalls previous interactions to provide higher context awareness.
            </p>
          </div>
        </div>
      </div>

      {/* Interactions Timeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          <span>Historical Sequence of Interactions ({filteredAnalyses.length})</span>
        </h2>

        {loading ? (
          <div className="rounded-2xl border border-blue-900/30 bg-slate-900/40 p-12 text-center">
            <Layers className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading interaction history...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <Brain className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-300">No Interactions Recorded Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Use the Request Analyzer or click "Run Demo Scenario" from the dashboard to simulate real
              client interactions.
            </p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800">
            {filteredAnalyses.map((analysis, index) => {
              const isExpanded = expandedId === analysis.id;
              const memoriesRecalled = analysis.hindsight_recalled_memories || [];

              return (
                <div key={analysis.id} className="relative pl-10">
                  {/* Step indicator node */}
                  <div className="absolute left-3.5 top-5 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 border-2 border-blue-500 text-[10px] font-bold text-blue-400">
                    {filteredAnalyses.length - index}
                  </div>

                  {/* Card */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-5 backdrop-blur-sm shadow-sm hover:border-slate-700/80 transition-all">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getDecisionBadge(analysis.decision)}
                        {getRiskBadge(analysis.risk_level)}
                        {analysis.project_name && (
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-medium">
                            {analysis.project_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {analysis.created_at
                            ? new Date(analysis.created_at).toLocaleString()
                            : 'Historical record'}
                        </span>
                      </div>
                    </div>

                    {/* Request Quote */}
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800/60 p-3 mb-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Client Request
                      </p>
                      <p className="text-sm text-slate-100 font-medium italic">
                        "{analysis.request_text}"
                      </p>
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">
                      {analysis.reason}
                    </p>

                    {/* Recalled Memory Context Pill */}
                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                      <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                        <Brain className="h-3.5 w-3.5" />
                        <span>{memoriesRecalled.length} Hindsight memories recalled for this decision</span>
                      </div>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : analysis.id)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 text-xs">
                        {analysis.recommendation && (
                          <div>
                            <span className="font-semibold text-slate-300 block mb-1">
                              Recommendation:
                            </span>
                            <p className="text-slate-400">{analysis.recommendation}</p>
                          </div>
                        )}

                        {analysis.suggested_reply && (
                          <div>
                            <span className="font-semibold text-slate-300 block mb-1">
                              Suggested Client Response:
                            </span>
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-slate-300">
                              {analysis.suggested_reply}
                            </div>
                          </div>
                        )}

                        {memoriesRecalled.length > 0 && (
                          <div>
                            <span className="font-semibold text-blue-300 block mb-1">
                              Memories Recalled by Hindsight:
                            </span>
                            <ul className="space-y-1 pl-4 list-disc text-slate-400">
                              {memoriesRecalled.map((m, i) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
