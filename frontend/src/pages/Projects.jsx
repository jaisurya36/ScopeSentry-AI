import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, FolderOpen } from 'lucide-react';
import { projectsAPI, clientsAPI } from '../services/api';

const statusConfig = {
  active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  on_hold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', client_id: '', status: 'active' });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsAPI.getAll(filterClient || undefined);
      setProjects(Array.isArray(data) ? data : data?.projects || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchClients = async () => {
    try {
      const data = await clientsAPI.getAll();
      setClients(Array.isArray(data) ? data : data?.clients || []);
    } catch {}
  };

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => { fetchProjects(); }, [filterClient]);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', description: '', client_id: clients[0]?.id || '', status: 'active' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditProject(project);
    setForm({ name: project.name || '', description: project.description || '', client_id: project.client_id || '', status: project.status || 'active' });
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Project name is required.'); return; }
    if (!form.client_id) { setFormError('Please select a client.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        client_id: parseInt(form.client_id),
      };
      if (editProject) {
        await projectsAPI.update(editProject.id, payload);
      } else {
        await projectsAPI.create(payload);
      }
      setModalOpen(false);
      await fetchProjects();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await projectsAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchProjects();
    } catch (e) { setError(e.message); }
  };

  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || clientId || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage projects across all clients</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20">
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">Filter by client:</label>
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Table */}
      <div className="rounded-xl border border-blue-900/30 overflow-hidden" style={{ background: 'rgba(17, 24, 39, 0.8)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-10 w-10 text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium">No projects found</p>
            <p className="text-slate-500 text-sm mt-1">Create a project to link agreements and analyses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-900/20">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/10">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-slate-200">{project.name}</p>
                        {project.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{project.description}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{getClientName(project.client_id)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig[project.status] || 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                        {project.status?.replace('_', ' ') || 'unknown'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {project.created_at ? new Date(project.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(project)} className="rounded-md p-1.5 text-slate-500 hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(project)} className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
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

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Name <span className="text-red-400">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Website Redesign" className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Brief project description..." className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Client <span className="text-red-400">*</span></label>
            <select name="client_id" value={form.client_id} onChange={handleChange} className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2 text-sm text-white hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-red-900/40 shadow-2xl p-5" style={{ background: '#111827' }}>
            <h3 className="text-base font-semibold text-white mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-400 mb-5">Delete project "{deleteTarget.name}"? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
