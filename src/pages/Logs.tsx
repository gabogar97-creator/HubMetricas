import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter } from 'lucide-react';

interface LogEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  timestamp: Date;
  details: string;
}

// Mock data for logs
const mockLogs: LogEntry[] = [
  { id: '1', user: 'Tech Master', action: 'CREATE', entity: 'Project', timestamp: new Date(Date.now() - 1000 * 60 * 30), details: 'Created project "Alpha"' },
  { id: '2', user: 'Tech Master', action: 'UPDATE', entity: 'NSM', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), details: 'Updated NSM target for "Alpha"' },
  { id: '3', user: 'Admin User', action: 'DELETE', entity: 'CollectionROI', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), details: 'Deleted ROI entry #45' },
  { id: '4', user: 'Tech Master', action: 'LOGIN', entity: 'System', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), details: 'User logged in' },
];

export function Logs() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockLogs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">Logs e Auditoria</h1>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
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
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--bg2)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--text2)]">
                    {format(log.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--text)]">
                    {log.user}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${log.action === 'CREATE' ? 'bg-[var(--green-dim)] text-[var(--green)] border-[var(--green-border)]' : 
                        log.action === 'DELETE' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                        'bg-[var(--bg4)] text-[var(--text2)] border-[var(--border2)]'}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text2)]">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 text-[var(--text3)]">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
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
