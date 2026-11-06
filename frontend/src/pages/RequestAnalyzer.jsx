import { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  DollarSign,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import { analyzerAPI, projectsAPI, clientsAPI } from '../services/api';

const DEMO_SCENARIOS = [
  {
    label: 'Extra Page Request',
    text: 'Can you add a blog section to the website with 10 posts and an admin panel to manage content?',
  },
  {
    label: 'Color Change (In Scope)',
    text: 'I would like to change the primary button color from blue to green across the whole site.',
  },
  {
    label: 'E-commerce Addition',
    text: 'We need to add a shopping cart and payment gateway (Stripe) so customers can buy products directly from the site.',
  },
];

const decisionConfig = {
  IN_SCOPE: {
    bg: 'from-green-900/60 to-green-800/30',
    border: 'border-green-500/40',
    badge: 'bg-green-500 text-white',
    icon: CheckCircle,
    label: 'IN SCOPE',
    textColor: 'text-green-400',
  },
  OUT_OF_SCOPE: {
    bg: 'from-red-900/60 to-red-800/30',
    border: 'border-red-500/40',
    badge: 'bg-red-500 text-white',
    icon: XCircle,
    label: 'OUT OF SCOPE',
    textColor: 'text-red-400',
  },
  NEEDS_CLARIFICATION: {
    bg: 'from-amber-900/60 to-amber-800/30',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500 text-white',
    icon: AlertTriangle,
    label: 'NEEDS CLARIFICATION',
    textColor: 'text-amber-400',
  },
};

const riskColors = {
  LOW: 'text-green-400 bg-green-500/10 border-green-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-blue-900/30 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.02] transition-colors">
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="border-t border-blue-900/20 px-4 py-3">{children}</div>}
    </div>
  );
}

function CopyBox({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg border border-blue-900/30 bg-slate-900/60 p-4">
      <button onClick={copy} className="absolute top-3 right-3 flex items-center gap-1 text-xs text-slate-400 hover:text-blue-300 transition-colors">
        {copied ? <><Check className="h-3.5 w-3.5 text-green-400" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
      </button>
      <p className="text-sm text-slate-300 leading-relaxed pr-16 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

export default function RequestAnalyzer() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [requestText, setRequestText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [p, c] = await Promise.all([projectsAPI.getAll(), clientsAPI.getAll()]);
        setProjects(Array.isArray(p) ? p : p?.projects || []);
        setClients(Array.isArray(c) ? c : c?.clients || []);
      } catch {}
    };
    fetchMeta();
  }, []);

  const handleProjectChange = (e) => {
    const pid = e.target.value;
    setProjectId(pid);
    const proj = projects.find(p => p.id?.toString() === pid?.toString());
    if (proj?.client_id) setClientId(proj.client_id.toString());
  };

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!projectId) { setError('Please select a project.'); return; }
    if (!clientId) { setError('Please select a client.'); return; }
    if (!requestText.trim()) { setError('Please enter a client request.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzerAPI.analyze({
        project_id: parseInt(projectId),
        client_id: parseInt(clientId),
        request_text: requestText,
      });
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? (decisionConfig[result.decision] || decisionConfig.NEEDS_CLARIFICATION) : null;
  const DecisionIcon = cfg?.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-400" />
          Request Analyzer
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">AI-powered scope analysis with memory recall from past agreements</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-900/30 p-5 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
            <h2 className="text-sm font-semibold text-slate-200">Analysis Setup</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Project <span className="text-red-400">*</span></label>
                <select value={projectId} onChange={handleProjectChange} className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Client <span className="text-red-400">*</span></label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Client Request <span className="text-red-400">*</span></label>
              <textarea
                value={requestText}
                onChange={e => setRequestText(e.target.value)}
                rows={6}
                placeholder="Enter the client's request here... e.g. 'Can you add an e-commerce store to the website?'"
                className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
              />
              <p className="text-xs text-slate-600 mt-1">{requestText.length} characters</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with AI...</>
              ) : (
                <><Zap className="h-4 w-4" /> Analyze Request</>
              )}
            </button>
          </div>

          {/* Demo Scenarios */}
          <div className="rounded-xl border border-blue-900/30 p-5" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" /> Quick Demo Scenarios
            </h2>
            <div className="space-y-2">
              {DEMO_SCENARIOS.map(scenario => (
                <button
                  key={scenario.label}
                  onClick={() => setRequestText(scenario.text)}
                  className="w-full text-left rounded-lg border border-blue-900/20 bg-slate-900/30 px-3 py-2.5 hover:bg-blue-900/20 hover:border-blue-700/40 transition-all group"
                >
                  <p className="text-xs font-medium text-blue-300 group-hover:text-blue-200">{scenario.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{scenario.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div ref={resultsRef}>
          {loading && (
            <div className="rounded-xl border border-blue-900/30 p-10 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
              <div className="relative">
                <div className="h-14 w-14 border-2 border-blue-900/40 border-t-blue-500 rounded-full animate-spin" />
                <Brain className="absolute inset-0 m-auto h-6 w-6 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-slate-200 font-medium">Analyzing Request...</p>
                <p className="text-xs text-slate-500 mt-1">Recalling memories from Hindsight · Consulting agreement · Generating AI verdict</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="rounded-xl border border-dashed border-blue-900/30 p-10 flex flex-col items-center justify-center gap-3 text-center" style={{ background: 'rgba(17, 24, 39, 0.5)' }}>
              <Zap className="h-10 w-10 text-slate-700" />
              <p className="text-slate-500 text-sm">Analysis results will appear here after you submit a request.</p>
            </div>
          )}

          {!loading && result && cfg && (
            <div className="space-y-4">
              {/* Decision Banner */}
              <div className={`rounded-xl border p-5 bg-gradient-to-br ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-3 mb-3">
                  <DecisionIcon className={`h-7 w-7 ${cfg.textColor}`} />
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold tracking-widest ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {result.risk_level && (
                      <span className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${riskColors[result.risk_level] || riskColors.MEDIUM}`}>
                        {result.risk_level} RISK
                      </span>
                    )}
                  </div>
                </div>

                {/* Memories indicator */}
                {result.memories_retrieved !== undefined && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm">
                    <Brain className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-blue-300 font-medium">{result.memories_retrieved} memories retrieved</span>
                    <span className="text-blue-500 text-xs">from Hindsight AI Memory</span>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              {result.reasoning && (
                <div className="rounded-xl border border-blue-900/30 p-4 space-y-2" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Reasoning</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.reasoning}</p>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3">
                {result.requested_changes?.length > 0 && (
                  <Collapsible title={<span className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-400" /> Requested Changes</span>} defaultOpen>
                    <ul className="space-y-1">
                      {result.requested_changes.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </Collapsible>
                )}

                {result.agreement_reference && (
                  <Collapsible title={<span className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-violet-400" /> Agreement Reference</span>}>
                    <p className="text-sm text-slate-400 leading-relaxed">{result.agreement_reference}</p>
                  </Collapsible>
                )}

                {result.recommendation && (
                  <div className="rounded-lg border border-blue-700/30 bg-blue-900/20 px-4 py-3">
                    <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Recommendation</h4>
                    <p className="text-sm text-slate-300">{result.recommendation}</p>
                  </div>
                )}

                {result.suggested_additional_charge && (
                  <div className="rounded-lg border border-green-700/30 bg-green-900/20 px-4 py-3 flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Suggested Additional Charge</h4>
                      <p className="text-sm text-slate-300">{result.suggested_additional_charge}</p>
                    </div>
                  </div>
                )}

                {result.professional_response && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5" /> Professional Response to Client
                    </h3>
                    <CopyBox text={result.professional_response} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
