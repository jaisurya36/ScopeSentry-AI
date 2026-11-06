import { useState, useEffect } from 'react';
import {
  Users,
  FolderOpen,
  Zap,
  TrendingDown,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Brain,
  PlayCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardAPI, demoAPI } from '../services/api';

const DECISION_COLORS = {
  IN_SCOPE: '#22c55e',
  OUT_OF_SCOPE: '#ef4444',
  NEEDS_CLARIFICATION: '#f59e0b',
};

const DecisionBadge = ({ decision }) => {
  const configs = {
    IN_SCOPE: 'bg-green-500/20 text-green-400 border-green-500/30',
    OUT_OF_SCOPE: 'bg-red-500/20 text-red-400 border-red-500/30',
    NEEDS_CLARIFICATION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  const labels = {
    IN_SCOPE: 'In Scope',
    OUT_OF_SCOPE: 'Out of Scope',
    NEEDS_CLARIFICATION: 'Needs Clarification',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${configs[decision] || 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
      {labels[decision] || decision}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="rounded-xl border border-blue-900/30 p-5" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold text-white">{value ?? '—'}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMsg, setDemoMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, st] = await Promise.all([dashboardAPI.getStats(), dashboardAPI.getStatus()]);
      setStats(s);
      setStatus(st);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDemo = async () => {
    setDemoLoading(true);
    setDemoMsg('');
    try {
      const res = await demoAPI.setup();
      setDemoMsg(res?.message || 'Demo scenario loaded!');
      await fetchData();
    } catch (e) {
      setDemoMsg('Demo failed: ' + e.message);
    } finally {
      setDemoLoading(false);
    }
  };

  const pieData = stats?.decision_distribution
    ? Object.entries(stats.decision_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const barData = stats?.recent_analyses?.slice(0, 10).map((a, i) => ({
    name: `#${i + 1}`,
    decision: a.decision,
    risk: a.risk_level === 'HIGH' ? 3 : a.risk_level === 'MEDIUM' ? 2 : 1,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Overview of your scope management activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-blue-800/40 bg-blue-950/40 px-3 py-2 text-sm text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20"
          >
            <PlayCircle className="h-4 w-4" />
            {demoLoading ? 'Loading...' : 'Run Demo Scenario'}
          </button>
        </div>
      </div>

      {demoMsg && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${demoMsg.includes('failed') ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
          {demoMsg}
        </div>
      )}

      {/* Service Status */}
      <div className="flex flex-wrap gap-3">
        <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${status?.groq_connected ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
          {status?.groq_connected ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          Groq AI — {status?.groq_connected ? 'Connected' : 'Disconnected'}
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${status?.hindsight_connected ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-slate-600/40 bg-slate-700/20 text-slate-400'}`}>
          <Brain className="h-4 w-4" />
          Hindsight Memory — {status?.hindsight_connected ? 'Connected' : 'Not Configured'}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400">
          <Activity className="h-4 w-4" />
          System Active
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error} — Showing cached data or defaults.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Clients" value={stats?.total_clients} color="bg-blue-500/20 text-blue-400" subtitle="Registered clients" />
        <StatCard icon={FolderOpen} label="Active Projects" value={stats?.active_projects} color="bg-violet-500/20 text-violet-400" subtitle="In progress" />
        <StatCard icon={Zap} label="Requests Analyzed" value={stats?.total_analyses} color="bg-amber-500/20 text-amber-400" subtitle="Total analyses" />
        <StatCard icon={TrendingDown} label="Out of Scope" value={stats?.out_of_scope_count} color="bg-red-500/20 text-red-400" subtitle="Flagged requests" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="rounded-xl border border-blue-900/30 p-5" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Scope Risk Overview</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={DECISION_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#e2e8f0' }}
                />
                <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value.replace('_', ' ')}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-slate-500 text-sm">
              No analysis data yet. Run the demo scenario to get started.
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="rounded-xl border border-blue-900/30 p-5" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Risk Levels</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={18}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'LOW', 'MED', 'HIGH'][v] || ''} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#e2e8f0' }}
                  formatter={(v) => [['', 'LOW', 'MEDIUM', 'HIGH'][v], 'Risk']}
                />
                <Bar dataKey="risk" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-slate-500 text-sm">
              No risk data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="rounded-xl border border-blue-900/30 overflow-hidden" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-900/20">
          <h3 className="text-sm font-semibold text-slate-200">Recent Request Analyses</h3>
          <span className="text-xs text-slate-500">{stats?.recent_analyses?.length || 0} records</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats?.recent_analyses?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-900/20">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Request</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Decision</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/10">
                {stats.recent_analyses.slice(0, 10).map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-300 max-w-xs truncate">{a.request_text}</td>
                    <td className="px-5 py-3"><DecisionBadge decision={a.decision} /></td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${a.risk_level === 'HIGH' ? 'text-red-400' : a.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-green-400'}`}>
                        {a.risk_level}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-10 w-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">No analyses yet. Use the Request Analyzer to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
