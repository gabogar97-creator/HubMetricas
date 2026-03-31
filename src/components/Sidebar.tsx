import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Hexagon, LayoutDashboard, Target, Settings, Activity, UserCog } from 'lucide-react';
import { useUI } from '../context/UIContext';

export function Sidebar() {
  console.log('--- Sidebar component starting render now (final check 2) ---');
  console.log('--- Sidebar component starting render now (final check) ---');
  console.log('--- Sidebar component starting render now ---');
  console.log('--- Sidebar component starting render ---');
  console.log('Starting Sidebar component render...');
  console.log('Sidebar component rendering...');
  console.log('Rendering Sidebar...');
  
  const { isSidebarOpen, userProfile } = useUI();
  const navigate = useNavigate();
  
  return (
    <aside className={`w-[220px] min-h-screen bg-[var(--bg2)] border-r border-[var(--border)] flex flex-col fixed top-0 left-0 z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 border-b border-[var(--border)]">
        <div className="font-sans text-xl font-bold text-[var(--accent)] tracking-tight">Spot Hub</div>
        <div className="text-[10px] text-[var(--text3)] tracking-widest uppercase mt-1">Zucchetti</div>
      </div>
      
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-5 py-2 text-[9px] tracking-widest uppercase text-[var(--text3)] font-mono">Principal</div>
        <NavItem to="/" icon={<Hexagon size={16} />} label="Dashboard" />
        
        <div className="px-5 py-2 mt-2 text-[9px] tracking-widest uppercase text-[var(--text3)] font-mono">Módulos</div>
        <NavItem to="/projects" icon={<LayoutDashboard size={16} />} label="Projetos / ROI" />
        
        <div className="px-5 py-2 mt-2 text-[9px] tracking-widest uppercase text-[var(--text3)] font-mono">Configuração</div>
        <NavItem to="/admin" icon={<Settings size={16} />} label="Cadastro" />
        <NavItem to="/logs" icon={<Activity size={16} />} label="Logs / Auditoria" />
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--bg4)] border border-[var(--border2)] rounded-full flex items-center justify-center text-xs font-mono text-[var(--accent)] overflow-hidden">
              {userProfile.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--text)]">{userProfile.name}</div>
              <div className="text-[10px] text-[var(--text3)]">{userProfile.role}</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="text-[var(--text3)] hover:text-[var(--accent)] transition-colors p-1" 
            title="Configurações de Perfil"
          >
            <UserCog size={16} />
          </button>
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
            ? 'bg-[var(--green-dim)] text-[var(--accent)] border-[var(--accent)]'
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
