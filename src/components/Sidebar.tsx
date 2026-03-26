import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Hexagon, LayoutDashboard, Target, Settings, Activity } from 'lucide-react';

export function Sidebar() {
  console.log('--- Sidebar component starting render now (final check 2) ---');
  console.log('--- Sidebar component starting render now (final check) ---');
  console.log('--- Sidebar component starting render now ---');
  console.log('--- Sidebar component starting render ---');
  console.log('Starting Sidebar component render...');
  console.log('Sidebar component rendering...');
  console.log('Rendering Sidebar...');
  return (
    <aside className="w-[220px] min-h-screen bg-[var(--bg2)] border-r border-[var(--border)] flex flex-col fixed top-0 left-0 z-50">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="font-mono text-lg font-bold text-[var(--accent)] tracking-tight">MetricOS</div>
        <div className="text-[10px] text-[var(--text3)] tracking-widest uppercase mt-1">Monitoring Platform</div>
      </div>
      
      <nav className="flex-1 py-3">
        <div className="px-5 py-2 text-[9px] tracking-widest uppercase text-[var(--text3)] font-mono">Principal</div>
        <NavItem to="/" icon={<Hexagon size={16} />} label="Dashboard" />
        
        <div className="px-5 py-2 mt-2 text-[9px] tracking-widest uppercase text-[var(--text3)] font-mono">Módulos</div>
        <NavItem to="/projects" icon={<LayoutDashboard size={16} />} label="Projetos / ROI" />
        
        <div className="px-5 py-2 mt-2 text-[9px] tracking-widest uppercase text-[var(--text3)] font-mono">Configuração</div>
        <NavItem to="/admin" icon={<Settings size={16} />} label="Admin" />
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--bg4)] border border-[var(--border2)] rounded-full flex items-center justify-center text-xs font-mono text-[var(--accent)]">TM</div>
          <div>
            <div className="text-xs font-medium text-[var(--text)]">Tech Master</div>
            <div className="text-[10px] text-[var(--text3)]">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-all border-l-2 ${
          isActive
            ? 'bg-[rgba(0,212,255,0.06)] text-[var(--accent)] border-[var(--accent)]'
            : 'text-[var(--text2)] border-transparent hover:bg-[var(--bg3)] hover:text-[var(--text)]'
        }`
      }
    >
      <span className="w-[18px] text-center">{icon}</span>
      {label}
      {badge && (
        <span className="ml-auto bg-[var(--red)] text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
