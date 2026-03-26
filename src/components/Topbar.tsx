import React from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Topbar() {
  console.log('--- Topbar component starting render now (final check 2) ---');
  console.log('--- Topbar component starting render now (final check) ---');
  console.log('--- Topbar component starting render now ---');
  console.log('--- Topbar component starting render ---');
  console.log('Starting Topbar component render...');
  console.log('Topbar component rendering...');
  console.log('Rendering Topbar...');
  const location = useLocation();
  
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/': return { title: 'Dashboard Geral', sub: 'Visão Geral' };
      case '/projects': return { title: 'Projetos & ROI', sub: 'Análise por Projeto' };
      case '/admin': return { title: 'Painel Admin', sub: 'Configuração' };
      default: return { title: 'MetricOS', sub: '' };
    }
  };

  const { title, sub } = getPageInfo();

  return (
    <header className="h-14 bg-[var(--bg2)] border-b border-[var(--border)] px-7 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[15px] font-semibold text-[var(--text)]">{title}</div>
          <div className="text-xs text-[var(--text3)]">
            MetricOS <span className="text-[var(--text3)]">›</span> {sub}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="font-mono text-[11px] text-[var(--text3)] bg-[var(--bg3)] px-3 py-1.5 rounded border border-[var(--border)]">
          {format(new Date(), "dd MMM yyyy", { locale: ptBR })}
        </div>
      </div>
    </header>
  );
}
