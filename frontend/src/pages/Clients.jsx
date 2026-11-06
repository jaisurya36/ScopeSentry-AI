import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, ChevronRight, Building2, Mail, User, Loader2 } from 'lucide-react';
import { clientsAPI, projectsAPI } from '../services/api';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-blue-900/40 shadow-2xl" style={{ background: '#111827' }}>
        <div className="flex items-center justify-between border-b border-blue-900/30 px-5 py-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-red-900/40 shadow-2xl p-5" style={{ background: '#111827' }}>
        <h3 className="text-base font-semibold text-white mb-2">Confirm Delete</h3>
        <p className="text-sm text-slate-400 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, type = 'text', required, placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
    />
  </div>
);

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', company: '', email: '' });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await clientsAPI.getAll();
      setClients(Array.isArray(data) ? data : data?.clients || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreate = () => {
    setEditClient(null);
    setForm({ name: '', company: '', email: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditClient(client);
    setForm({ name: client.name || '', company: client.company || '', email: client.email || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editClient) {
        await clientsAPI.update(editClient.id, form);
      } else {
        await clientsAPI.create(form);
      }
      setModalOpen(false);
      await fetchClients();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await clientsAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchClients();
    } catch (e) { setError(e.message); }
  };

  const viewClient = async (client) => {
    setSelectedClient(client);
    setProjectsLoading(true);
    try {
      const data = await projectsAPI.getAll(client.id);
      setClientProjects(Array.isArray(data) ? data : data?.projects || []);
    } catch { setClientProjects([]); }
    finally { setProjectsLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your client relationships</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20">
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Client detail panel */}
      {selectedClient && (
        <div className="rounded-xl border border-blue-700/30 p-5" style={{ background: 'rgba(17, 24, 39, 0.9)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {selectedClient.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-white">{selectedClient.name}</h3>
                <p className="text-xs text-slate-400">{selectedClient.company}</p>
              </div>
            </div>
            <button onClick={() => setSelectedClient(null)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Projects</h4>
          {projectsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading projects...</div>
          ) : clientProjects.length === 0 ? (
            <p className="text-sm text-slate-500">No projects for this client yet.</p>
          ) : (
            <div className="space-y-2">
              {clientProjects.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-blue-900/20 bg-slate-900/40 px-3 py-2">
                  <ChevronRight className="h-3 w-3 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{p.name}</span>
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-blue-500/20 text-blue-400' : p.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-blue-900/30 overflow-hidden" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-10 w-10 text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium">No clients yet</p>
            <p className="text-slate-500 text-sm mt-1">Add your first client to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-900/20">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Projects</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/10">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => viewClient(client)} className="flex items-center gap-2 group">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {client.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-blue-300 group-hover:text-blue-200 transition-colors">{client.name}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        {client.company || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-600" />
                        {client.email || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                        {client.project_count ?? 0} projects
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(client)} className="rounded-md p-1.5 text-slate-500 hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(client)} className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editClient ? 'Edit Client' : 'Add Client'}>
        <form onSubmit={handleSave} className="space-y-4">
          <InputField label="Name" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
          <InputField label="Company" name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" />
          <InputField label="Email" name="email" value={form.email} onChange={handleChange} type="email" placeholder="john@acme.com" />
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2 text-sm text-white hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editClient ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
