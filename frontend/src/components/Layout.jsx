import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Zap,
  Brain,
  TrendingUp,
  Settings,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/agreements', icon: FileText, label: 'Agreements' },
  { to: '/analyzer', icon: Zap, label: 'Request Analyzer', highlight: true },
  { to: '/memory', icon: Brain, label: 'Memory Center' },
  { to: '/history', icon: TrendingUp, label: 'Learning History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(item => location.pathname.startsWith(item.to))?.label || 'ScopeSentry AI';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #030e3d 0%, #0d1526 50%, #0a1428 100%)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-30 h-full w-64 flex-shrink-0 flex flex-col border-r border-blue-900/30 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'rgba(3, 14, 61, 0.95)', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-900/30">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">ScopeSentry AI</h1>
            <p className="text-xs text-blue-300/70">Scope Protection</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? highlight
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : highlight
                    ? 'text-blue-200 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-violet-600/20 hover:text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${highlight ? 'text-current' : ''}`} style={{ width: '18px', height: '18px' }} />
              <span className="flex-1">{label}</span>
              {highlight && (
                <span className="rounded-full bg-blue-500/30 px-1.5 py-0.5 text-xs text-blue-200">AI</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-blue-900/30 p-4">
          <div className="rounded-lg bg-blue-950/50 border border-blue-800/30 p-3">
            <p className="text-xs text-blue-300/80 font-medium">AI-Powered Scope Guard</p>
            <p className="text-xs text-slate-500 mt-0.5">Protect your project boundaries</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-blue-900/30 px-4 lg:px-6"
          style={{ background: 'rgba(3, 14, 61, 0.7)', backdropFilter: 'blur(8px)' }}>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">ScopeSentry</span>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-slate-200 font-medium">{currentPage}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Groq</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1">
              <Brain className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">Hindsight</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
