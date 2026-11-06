import { useState, useEffect } from 'react';
import { Plus, X, Loader2, CheckCircle, AlertCircle, FileText, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { agreementsAPI, projectsAPI, clientsAPI } from '../services/api';

const DynamicList = ({ label, items, onChange, placeholder }) => {
  const addItem = () => onChange([...items, '']);
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const updateItem = (i, val) => onChange(items.map((item, idx) => idx === i ? val : item));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <button type="button" onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={e => updateItem(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <button type="button" onClick={() => removeItem(i)} className="text-slate-500 hover:text-red-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-blue-900/30 px-3 py-2 text-xs text-slate-600">
            No items. Click "Add" to add one.
          </div>
        )}
      </div>
    </div>
  );
};

export default function Agreements() {
  const [agreements, setAgreements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const initForm = () => ({
    project_id: '',
    client_id: '',
    project_description: '',
    deliverables: [''],
    included_features: [''],
    excluded_features: [''],
    revisions_allowed: 3,
    budget: '',
    deadline: '',
    additional_conditions: '',
  });
  const [form, setForm] = useState(initForm());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, p, c] = await Promise.all([agreementsAPI.getAll(), projectsAPI.getAll(), clientsAPI.getAll()]);
      setAgreements(Array.isArray(a) ? a : a?.agreements || []);
      setProjects(Array.isArray(p) ? p : p?.projects || []);
      setClients(Array.isArray(c) ? c : c?.clients || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleProjectChange = (e) => {
    const pid = e.target.value;
    const proj = projects.find(p => p.id?.toString() === pid?.toString());
    setForm(f => ({ ...f, project_id: pid, client_id: proj?.client_id?.toString() || f.client_id }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.project_id) { setFormError('Please select a project.'); return; }
    if (!form.client_id) { setFormError('Please select a client.'); return; }
    setSaving(true);
    setFormError('');
    try {
      await agreementsAPI.create({
        ...form,
        project_id: parseInt(form.project_id),
        client_id: parseInt(form.client_id),
        deliverables: form.deliverables.filter(Boolean),
        included_features: form.included_features.filter(Boolean),
        excluded_features: form.excluded_features.filter(Boolean),
        revisions_allowed: parseInt(form.revisions_allowed) || 0,
      });
      setModalOpen(false);
      setForm(initForm());
      await fetchAll();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || id || '—';
  const getClientName = (id) => clients.find(c => c.id === id)?.name || id || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agreements</h1>
          <p className="text-sm text-slate-400 mt-0.5">Define project scope agreements stored in AI memory</p>
        </div>
        <button onClick={() => { setForm(initForm()); setFormError(''); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20">
          <Plus className="h-4 w-4" /> Create Agreement
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : agreements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-blue-900/30" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
          <FileText className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No agreements yet</p>
          <p className="text-slate-500 text-sm mt-1">Create an agreement to define project scope boundaries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agreements.map(agreement => (
            <div key={agreement.id} className="rounded-xl border border-blue-900/30 overflow-hidden" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-200 truncate">{getProjectName(agreement.project_id)}</h3>
                    {agreement.hindsight_stored ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs text-green-400">
                        <CheckCircle className="h-3 w-3" /> Hindsight Stored
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-slate-700/50 border border-slate-600/40 px-2 py-0.5 text-xs text-slate-500">
                        <AlertCircle className="h-3 w-3" /> Not in Memory
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-500">
                    <span>Client: {getClientName(agreement.client_id)}</span>
                    {agreement.budget && <span>Budget: {agreement.budget}</span>}
                    {agreement.deadline && <span>Deadline: {new Date(agreement.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={() => setExpanded(expanded === agreement.id ? null : agreement.id)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  {expanded === agreement.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              {expanded === agreement.id && (
                <div className="border-t border-blue-900/20 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Deliverables</h4>
                    <ul className="space-y-1">
                      {(agreement.deliverables || []).map((d, i) => <li key={i} className="text-slate-300 flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span>{d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Included</h4>
                    <ul className="space-y-1">
                      {(agreement.included_features || []).map((f, i) => <li key={i} className="text-green-400 flex items-start gap-1.5"><span className="mt-0.5">✓</span><span className="text-slate-300">{f}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Excluded</h4>
                    <ul className="space-y-1">
                      {(agreement.excluded_features || []).map((f, i) => <li key={i} className="text-red-400 flex items-start gap-1.5"><span className="mt-0.5">✗</span><span className="text-slate-300">{f}</span></li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-blue-900/40 shadow-2xl" style={{ background: '#111827' }}>
            <div className="flex items-center justify-between border-b border-blue-900/30 px-5 py-4 sticky top-0 z-10" style={{ background: '#111827' }}>
              <h2 className="text-base font-semibold text-white">Create Scope Agreement</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Project <span className="text-red-400">*</span></label>
                  <select name="project_id" value={form.project_id} onChange={handleProjectChange} className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Client <span className="text-red-400">*</span></label>
                  <select name="client_id" value={form.client_id} onChange={handleChange} className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Description</label>
                <textarea name="project_description" value={form.project_description} onChange={handleChange} rows={3} placeholder="Describe the full project scope..." className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none" />
              </div>

              <DynamicList label="Deliverables" items={form.deliverables} onChange={v => setForm(f => ({ ...f, deliverables: v }))} placeholder="e.g. 5-page responsive website" />
              <DynamicList label="Included Features" items={form.included_features} onChange={v => setForm(f => ({ ...f, included_features: v }))} placeholder="e.g. Contact form integration" />
              <DynamicList label="Excluded Features" items={form.excluded_features} onChange={v => setForm(f => ({ ...f, excluded_features: v }))} placeholder="e.g. E-commerce functionality" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Revisions Allowed</label>
                  <input type="number" name="revisions_allowed" value={form.revisions_allowed} onChange={handleChange} min="0" className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Budget</label>
                  <input type="text" name="budget" value={form.budget} onChange={handleChange} placeholder="$5,000" className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Deadline</label>
                  <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional Conditions</label>
                <textarea name="additional_conditions" value={form.additional_conditions} onChange={handleChange} rows={2} placeholder="Any extra terms or conditions..." className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none" />
              </div>

              {saving && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Storing agreement in Hindsight AI Memory...
                </div>
              )}

              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2 text-sm text-white hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-60">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
