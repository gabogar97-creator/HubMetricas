import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Menu, Moon, Sun } from 'lucide-react';
import { useUI } from '../context/UIContext';

export function Topbar() {
  console.log('--- Topbar component starting render now (final check 2) ---');
  console.log('--- Topbar component starting render now (final check) ---');
  console.log('--- Topbar component starting render now ---');
  console.log('--- Topbar component starting render ---');
  console.log('Starting Topbar component render...');
  console.log('Topbar component rendering...');
  console.log('Rendering Topbar...');
  
  const location = useLocation();
  const { toggleSidebar, theme, toggleTheme } = useUI();
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/': return { title: 'Dashboard Geral', sub: 'Visão Geral' };
      case '/projects': return { title: 'Projetos', sub: 'Análise por Projeto' };
      case '/admin': return { title: 'Painel Admin', sub: 'Configuração' };
      case '/logs': return { title: 'Logs / Auditoria', sub: 'Rastreabilidade' };
      case '/profile': return { title: 'Configurações de Perfil', sub: 'Minha Conta' };
      default: return { title: 'Hub de Métricas', sub: '' };
    }
  };

  const { title, sub } = getPageInfo();

  return (
    <header 
      className={`h-14 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] px-7 flex items-center justify-between sticky top-0 z-40 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)] transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="text-[15px] font-semibold text-[var(--text)]">{title}</div>
          <div className="text-xs text-[var(--text3)]">
            Hub de Métricas <span className="text-[var(--text3)]">›</span> {sub}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)] transition-colors"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="text-[11px] text-[var(--text3)] bg-[var(--glass-bg)] backdrop-blur-sm px-3 py-1.5 rounded border border-[var(--glass-border)]">
          {format(new Date(), "dd MMM yyyy", { locale: ptBR })}
        </div>
      </div>
    </header>
  );
}
