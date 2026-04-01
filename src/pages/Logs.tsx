import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  created_at: string;
  new_value?: any;
  old_value?: any;
  profiles?: {
    name: string;
    email: string;
  };
}

export function Logs() {
  const { profile } = useAuth();
  
  if (profile?.role === 'viewer') {
    return <Navigate to="/" replace />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { clearNewLogs } = useAppContext();

  useEffect(() => {
    fetchLogs();
    clearNewLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error in fetchLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">Logs e Auditoria</h1>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex gap-4 items-center bg-[var(--bg2)]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" size={16} />
            <input
              type="text"
              placeholder="Buscar logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--text)] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--bg3)] transition-colors text-[var(--text2)]">
            <Filter size={16} />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg3)] text-[var(--text3)] font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Data/Hora</th>
                <th className="px-6 py-4 font-medium">Usuário</th>
                <th className="px-6 py-4 font-medium">Ação</th>
                <th className="px-6 py-4 font-medium">Entidade</th>
                <th className="px-6 py-4 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--text3)]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando logs...
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--bg2)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--text2)] align-top">
                    {log.created_at && !isNaN(new Date(log.created_at).getTime()) 
                      ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--text)] align-top">
                    {log.profiles?.name || log.user_id}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${log.action === 'CREATE' ? 'bg-[var(--green-dim)] text-[var(--green)] border-[var(--green-border)]' : 
                        log.action === 'DELETE' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                        'bg-[var(--bg4)] text-[var(--text2)] border-[var(--border2)]'}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text2)] align-top">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 text-[var(--text3)] max-w-md align-top">
                    {log.new_value || log.old_value ? (
                      <div className="flex flex-col gap-2">
                        {log.old_value && (
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-wider mb-1 block">Anterior</span>
                            <pre className="bg-[var(--bg3)] p-2 rounded border border-[var(--border)] overflow-x-auto max-h-32 text-[11px] font-mono whitespace-pre-wrap text-[var(--text2)]">
                              {JSON.stringify(log.old_value, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.new_value && (
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-wider mb-1 block">Novo</span>
                            <pre className="bg-[var(--bg3)] p-2 rounded border border-[var(--border)] overflow-x-auto max-h-32 text-[11px] font-mono whitespace-pre-wrap text-[var(--text2)]">
                              {JSON.stringify(log.new_value, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--text3)]">
                    Nenhum log encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
