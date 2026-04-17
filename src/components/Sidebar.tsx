import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Hexagon, LayoutDashboard, Target, Settings, Activity, UserCog, LogOut, ListOrdered } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

export function Sidebar() {
  console.log('--- Sidebar component starting render now (final check 2) ---');
  console.log('--- Sidebar component starting render now (final check) ---');
  console.log('--- Sidebar component starting render now ---');
  console.log('--- Sidebar component starting render ---');
  console.log('Starting Sidebar component render...');
  console.log('Sidebar component rendering...');
  console.log('Rendering Sidebar...');
  
  const { isSidebarOpen } = useUI();
  const { signOut, profile } = useAuth();
  const { hasNewLogs } = useAppContext();
  const navigate = useNavigate();
  
  return (
    <aside className={`w-[220px] min-h-screen text-white flex flex-col fixed top-0 left-0 z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #0b0f19 65%, #000000 100%)' }}>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="leading-none">
            <div className="font-sans text-[15px] font-bold tracking-tight">Hub de Métricas</div>
            <div className="text-[10px] text-white/70 tracking-widest uppercase mt-1">Zucchetti</div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-3 overflow-y-auto">
        <NavItem to="/" icon={<Hexagon size={16} />} label="Dashboard" />
        <NavItem to="/queue" icon={<ListOrdered size={16} />} label="Fila de Priorização" />
        <NavItem to="/projects" icon={<LayoutDashboard size={16} />} label="Projetos" />
        <NavItem to="/admin" icon={<Settings size={16} />} label="Cadastro" />
        <NavItem to="/logs" icon={<Activity size={16} />} label="Logs / Auditoria" hasNotification={hasNewLogs} />
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-xs font-mono text-white overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profile?.name || 'User').substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-white">{profile?.name || 'Usuário'}</div>
              <div className="text-[10px] text-white/70 capitalize">{profile?.role || 'viewer'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/profile')}
              className="text-white/70 hover:text-white transition-colors p-1" 
              title="Configurações de Perfil"
            >
              <UserCog size={16} />
            </button>
            <button 
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="text-white/70 hover:text-white transition-colors p-1" 
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label, badge, hasNotification }: { to: string; icon: React.ReactNode; label: string; badge?: string; hasNotification?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-all relative mx-2 rounded-lg mb-1 ${
          isActive
            ? 'bg-white/15 text-white shadow-[0_0_18px_rgba(59,130,246,0.25)]'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <span className="w-[18px] text-center relative">
        {icon}
        {hasNotification && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--bg2)]"></span>
        )}
      </span>
      {label}
      {badge && (
        <span className="ml-auto bg-[var(--red)] text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
