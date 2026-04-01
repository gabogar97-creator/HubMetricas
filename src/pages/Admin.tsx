import React, { useState } from 'react';
import { useAppContext, RoiMethod } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function Admin() {
  const { profile } = useAuth();
  
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  console.log('--- Admin component starting render now (final check 2) ---');
  console.log('--- Admin component starting render now (final check) ---');
  console.log('--- Admin component starting render now ---');
  console.log('--- Admin component starting render ---');
  console.log('Starting Admin component render...');
  console.log('Admin component rendering...');
  console.log('Rendering Admin...');
  const [activeTab, setActiveTab] = useState('proj');
  const { projects, globalNSMs, refreshData, deleteProject, deleteCollectionNSM, updateProject, addProject, updateCollectionNSM, updateNSM, addNSM, deleteNSM } = useAppContext();
  
  const [nsmLinkType, setNsmLinkType] = useState<'project' | 'global'>('project');

  // Project Form State
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [projName, setProjName] = useState('');
  const [projDate, setProjDate] = useState('');
  const [projCostFormula, setProjCostFormula] = useState('');
  const [projReturnFormula, setProjReturnFormula] = useState('');
  const [projRoiMethods, setProjRoiMethods] = useState<RoiMethod[]>([]);
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodType, setNewMethodType] = useState('Saving');

  // NSM Collection Form State
  const [editingNsmId, setEditingNsmId] = useState<number | null>(null);
  const [nsmProjectId, setNsmProjectId] = useState('');
  const [nsmDate, setNsmDate] = useState('');
  const [nsmName, setNsmName] = useState('');
  const [nsmType, setNsmType] = useState('number');
  const [nsmValue, setNsmValue] = useState('');
  const [nsmTarget, setNsmTarget] = useState('');

  const handleSaveProject = async () => {
    if (!projName) return;
    const data = {
      name: projName,
      goLiveDate: projDate || null,
      costFormula: projCostFormula || 'Horas × Valor da Hora (ou definido manualmente)',
      returnFormula: projReturnFormula || 'Quantidade × Horas × Valor da Hora',
      roiMethods: projRoiMethods
    };

    if (editingProjectId) {
      await updateProject(editingProjectId, data);
    } else {
      await addProject(data);
    }
    
    setProjName(''); setProjDate(''); setProjCostFormula(''); setProjReturnFormula(''); setProjRoiMethods([]); setEditingProjectId(null);
    await refreshData();
  };

  const handleEditProject = (p: any) => {
    setEditingProjectId(p.id);
    setProjName(p.name);
    setProjDate(p.goLiveDate ? p.goLiveDate.split('T')[0] : '');
    setProjCostFormula(p.costFormula || '');
    setProjReturnFormula(p.returnFormula || '');
    setProjRoiMethods(p.roiMethods || []);
  };

  const addRoiMethod = () => {
    if (!newMethodName) return;
    setProjRoiMethods([...projRoiMethods, { 
      id: Date.now().toString(), 
      name: newMethodName, 
      type: newMethodType,
      fields: [],
      formula: []
    }]);
    setNewMethodName('');
  };

  const removeRoiMethod = (id: string) => {
    setProjRoiMethods(projRoiMethods.filter(m => m.id !== id));
  };

  const addField = (methodId: string) => {
    setProjRoiMethods(projRoiMethods.map(m => m.id === methodId ? {
      ...m,
      fields: [...(m.fields || []), { id: Date.now().toString(), name: 'Novo Campo', type: 'variable' }]
    } : m));
  };

  const updateField = (methodId: string, fieldIndex: number, key: string, value: any) => {
    setProjRoiMethods(projRoiMethods.map(m => m.id === methodId ? {
      ...m,
      fields: m.fields?.map((f, i) => i === fieldIndex ? { ...f, [key]: value } : f)
    } : m));
  };

  const addFormulaPart = (methodId: string, type: 'field' | 'operator', value: string) => {
    if (!value) return;
    setProjRoiMethods(projRoiMethods.map(m => m.id === methodId ? {
      ...m,
      formula: [...(m.formula || []), { type, value }]
    } : m));
  };

  const clearFormula = (methodId: string) => {
    setProjRoiMethods(projRoiMethods.map(m => m.id === methodId ? {
      ...m,
      formula: []
    } : m));
  };

  const removeField = (methodId: string, fieldIndex: number) => {
    setProjRoiMethods(projRoiMethods.map(m => m.id === methodId ? {
      ...m,
      fields: m.fields?.filter((_, i) => i !== fieldIndex)
    } : m));
  };

  const handleSaveNSM = async () => {
    if (!nsmName) return;
    if (nsmLinkType === 'project' && !nsmProjectId) return;

    const data = {
      projectId: nsmLinkType === 'project' ? Number(nsmProjectId) : null,
      name: nsmName,
      type: nsmType,
      target: nsmTarget,
    };

    if (editingNsmId) {
      await updateNSM(editingNsmId, data);
    } else {
      await addNSM(data);
    }
    
    setNsmName(''); setNsmType('number'); setNsmTarget(''); setEditingNsmId(null); setNsmProjectId(projects[0]?.id.toString() || '');
    await refreshData();
  };

  const handleEditNSM = (n: any) => {
    setEditingNsmId(n.id);
    setNsmLinkType(n.projectId ? 'project' : 'global');
    setNsmProjectId(n.projectId ? n.projectId.toString() : '');
    setNsmName(n.name);
    setNsmType(n.type || 'number');
    setNsmTarget(n.target || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-[var(--bg4)] p-1 rounded-lg w-fit flex-wrap">
        <Tab id="proj" label="Projetos" active={activeTab} onClick={setActiveTab} />
        <Tab id="nsm" label="Coletas NSM" active={activeTab} onClick={setActiveTab} />
      </div>

      {activeTab === 'proj' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-[fadeIn_0.2s_ease]">
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text2)] font-mono">Cadastrar Projeto</div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Nome do Projeto" placeholder="Ex: AI Lab" value={projName} onChange={(e: any) => setProjName(e.target.value)} />
                <FormGroup label="Data Go-Live" type="date" value={projDate} onChange={(e: any) => setProjDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormGroup label="Fórmula de Custo" placeholder="Ex: Horas × Valor da Hora" value={projCostFormula} onChange={(e: any) => setProjCostFormula(e.target.value)} />
                <FormGroup label="Fórmula de Retorno" placeholder="Ex: Quantidade × Horas × Valor da Hora" value={projReturnFormula} onChange={(e: any) => setProjReturnFormula(e.target.value)} />
              </div>

              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Tipos de Retorno/Custo Personalizados</div>
                <div className="flex gap-2">
                  <select value={newMethodType} onChange={e => setNewMethodType(e.target.value)} className="bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none">
                    <option value="Saving">Saving</option>
                    <option value="Revenue">Receita</option>
                    <option value="Cost Avoidance">Custo Evitado</option>
                    <option value="Custo">Custo</option>
                  </select>
                  <input type="text" placeholder="Nome (Ex: Relatório de Leads)" value={newMethodName} onChange={e => setNewMethodName(e.target.value)} className="flex-1 bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none" />
                  <button onClick={addRoiMethod} className="px-4 py-2 bg-[var(--bg4)] hover:bg-[var(--surface-high)] border border-[var(--border2)] rounded-md text-xs font-medium transition-colors">Adicionar</button>
                </div>
                {projRoiMethods.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {projRoiMethods.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-[var(--bg4)] px-3 py-2 rounded-md border border-[var(--border2)]">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setEditingMethodId(m.id)}>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${m.type === 'Saving' ? 'bg-[rgba(51,221,255,0.1)] text-[var(--accent)]' : m.type === 'Revenue' ? 'bg-[rgba(0,255,136,0.1)] text-[var(--green)]' : m.type === 'Custo' ? 'bg-[rgba(255,68,68,0.1)] text-[var(--red)]' : 'bg-[rgba(255,170,0,0.1)] text-[var(--orange)]'}`}>{m.type}</span>
                          <span className="text-xs text-[var(--text)]">{m.name}</span>
                        </div>
                        <button onClick={() => removeRoiMethod(m.id)} className="text-[var(--red)] hover:text-[var(--red2)] text-xs">Remover</button>
                      </div>
                    ))}
                  </div>
                )}
                {editingMethodId && (
                  <div className="mt-4 p-4 bg-[var(--bg4)] rounded-lg border border-[var(--border2)] space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-semibold">Editando: {projRoiMethods.find(m => m.id === editingMethodId)?.name}</div>
                      <button onClick={() => setEditingMethodId(null)} className="text-xs text-[var(--text3)] hover:text-[var(--text)]">Fechar Editor</button>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="text-xs font-semibold uppercase text-[var(--text3)]">Campos</div>
                       {projRoiMethods.find(m => m.id === editingMethodId)?.fields?.map((f, i) => (
                         <div key={f.id} className="flex gap-2">
                            <input value={f.name} onChange={e => updateField(editingMethodId, i, 'name', e.target.value)} className="bg-[var(--bg3)] border border-[var(--border2)] p-1 rounded text-xs w-full" />
                            <select value={f.type} onChange={e => updateField(editingMethodId, i, 'type', e.target.value)} className="bg-[var(--bg3)] border border-[var(--border2)] p-1 rounded text-xs">
                               <option value="fixed">Fixo</option>
                               <option value="variable">Variável</option>
                            </select>
                            {f.type === 'fixed' && (
                              <input 
                                type="number" 
                                placeholder="Valor" 
                                value={f.defaultValue || ''} 
                                onChange={e => updateField(editingMethodId, i, 'defaultValue', Number(e.target.value))} 
                                className="bg-[var(--bg3)] border border-[var(--border2)] p-1 rounded text-xs w-20" 
                              />
                            )}
                            <button onClick={() => removeField(editingMethodId, i)} className="text-[var(--red)] text-xs">X</button>
                         </div>
                       ))}
                       <button onClick={() => addField(editingMethodId)} className="text-xs text-[var(--accent)] hover:text-[#33ddff]">+ Adicionar Campo</button>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="text-xs font-semibold uppercase text-[var(--text3)]">Fórmula</div>
                       <div className="flex gap-2">
                          <select value="" onChange={e => addFormulaPart(editingMethodId, 'field', e.target.value)} className="bg-[var(--bg3)] border border-[var(--border2)] p-1 rounded text-xs">
                             <option value="" disabled>Campo...</option>
                             {projRoiMethods.find(m => m.id === editingMethodId)?.fields?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                          <select value="" onChange={e => addFormulaPart(editingMethodId, 'operator', e.target.value)} className="bg-[var(--bg3)] border border-[var(--border2)] p-1 rounded text-xs">
                             <option value="" disabled>Operador...</option>
                             <option value="+">+</option>
                             <option value="-">-</option>
                             <option value="*">*</option>
                             <option value="/">/</option>
                          </select>
                          <button onClick={() => clearFormula(editingMethodId)} className="text-xs text-[var(--red)]">Limpar</button>
                       </div>
                       <div className="text-xs font-mono bg-[var(--bg3)] p-2 rounded min-h-[32px] flex items-center flex-wrap gap-1">
                          {projRoiMethods.find(m => m.id === editingMethodId)?.formula?.map((p, i) => (
                            <span key={i} className={p.type === 'operator' ? 'text-[var(--accent)] font-bold' : 'bg-[var(--bg4)] px-1 rounded border border-[var(--border2)]'}>
                              {p.type === 'field' ? (projRoiMethods.find(m => m.id === editingMethodId)?.fields?.find(f => f.id === p.value || f.name === p.value)?.name || '[Removido]') : p.value}
                            </span>
                          ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveProject} className="flex-1 py-2.5 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[#3377ff] transition-colors">
                  {editingProjectId ? 'Salvar Alterações' : 'Cadastrar Projeto'}
                </button>
                {editingProjectId && (
                  <button onClick={() => {
                    setEditingProjectId(null);
                    setProjName(''); setProjDate(''); setProjCostFormula(''); setProjReturnFormula(''); setProjRoiMethods([]);
                  }} className="px-4 py-2.5 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">
                    Cancelar
                  </button>
                )}
                <button onClick={async () => {
                  if (confirm('Tem certeza que deseja excluir todos os projetos?')) {
                    for (const p of projects) {
                      await deleteProject(p.id);
                    }
                  }
                }} className="px-4 py-2.5 rounded-md text-xs font-semibold bg-[var(--red)] text-white hover:bg-[var(--red2)] transition-colors">
                  Excluir Todos
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text2)] font-mono">Projetos Ativos</div>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[var(--bg4)] border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text3)] font-mono sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Projeto</th>
                    <th className="px-4 py-2.5 font-medium">Go-Live</th>
                    <th className="px-4 py-2.5 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {projects.map(p => (
                    <ProjectRow key={p.id} id={p.id} name={p.name} date={p.goLiveDate ? new Date(p.goLiveDate).toLocaleDateString() : '—'} onDelete={deleteProject} onEdit={() => handleEditProject(p)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nsm' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-[fadeIn_0.2s_ease]">
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text2)] font-mono">Cadastrar Nova NSM</div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Vincular a</label>
                <div className="flex gap-2 bg-[var(--bg4)] p-1 rounded-lg w-full">
                  <button 
                    onClick={() => setNsmLinkType('project')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${nsmLinkType === 'project' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`}
                  >
                    Projeto
                  </button>
                  <button 
                    onClick={() => setNsmLinkType('global')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${nsmLinkType === 'global' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`}
                  >
                    Métrica Global
                  </button>
                </div>
              </div>
              
              {nsmLinkType === 'project' && (
                <div className="space-y-1.5 animate-[fadeIn_0.2s_ease]">
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Projeto</label>
                  <select value={nsmProjectId} onChange={(e) => setNsmProjectId(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors">
                    <option value="" disabled>Selecione um projeto...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <FormGroup label="Nome da Métrica (NSM)" placeholder="Ex: Leads Gerados, DAU, MAU" value={nsmName} onChange={(e: any) => setNsmName(e.target.value)} />
              <FormGroup label="Meta (Target)" placeholder="Ex: 1000, 50%" value={nsmTarget} onChange={(e: any) => setNsmTarget(e.target.value)} />
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Tipo de Métrica</label>
                <select value={nsmType} onChange={(e) => setNsmType(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors">
                  <option value="number">Número</option>
                  <option value="percentage">Percentual (%)</option>
                  <option value="currency">Moeda (R$)</option>
                  <option value="status">Status</option>
                  <option value="text">Texto Livre</option>
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveNSM} className="flex-1 py-2.5 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors">
                  {editingNsmId ? 'Salvar Alterações' : 'Criar NSM'}
                </button>
                {editingNsmId && (
                  <button onClick={() => {
                    setEditingNsmId(null);
                    setNsmName('');
                    setNsmType('number');
                  }} className="px-4 py-2.5 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text2)] font-mono">NSMs Cadastradas</div>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[var(--bg4)] border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text3)] font-mono sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Projeto</th>
                    <th className="px-4 py-2.5 font-medium">Métrica</th>
                    <th className="px-4 py-2.5 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {/* Global NSMs */}
                  {globalNSMs.map(n => (
                    <tr key={n.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-4 py-3 text-[var(--accent)] font-semibold">Global</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{n.name}</td>
                      <td className="px-4 py-3 flex gap-3">
                        <button onClick={() => handleEditNSM(n)} className="text-[var(--accent)] hover:text-[#33ddff] text-xs font-medium">Editar</button>
                        <button onClick={() => deleteNSM(n.id)} className="text-[var(--red)] hover:text-[var(--red2)] text-xs font-medium">Excluir</button>
                      </td>
                    </tr>
                  ))}
                  {/* Project NSMs */}
                  {projects.flatMap(p => (p.NSMs || []).map(n => (
                    <tr key={n.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{n.name}</td>
                      <td className="px-4 py-3 flex gap-3">
                        <button onClick={() => handleEditNSM(n)} className="text-[var(--accent)] hover:text-[#33ddff] text-xs font-medium">Editar</button>
                        <button onClick={() => deleteNSM(n.id)} className="text-[var(--red)] hover:text-[var(--red2)] text-xs font-medium">Excluir</button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tab({ id, label, active, onClick }: any) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active === id
          ? 'bg-[var(--bg3)] text-[var(--text)]'
          : 'text-[var(--text3)] hover:text-[var(--text2)]'
      }`}
    >
      {label}
    </button>
  );
}

function FormGroup({ label, type = 'text', placeholder, value, onChange }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
      />
    </div>
  );
}

function ProjectRow({ id, name, date, onDelete, onEdit }: any) {
  return (
    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      <td className="px-4 py-3">{name}</td>
      <td className="px-4 py-3 font-mono text-[11px]">{date}</td>
      <td className="px-4 py-3 flex gap-3">
        <button onClick={() => onEdit(id)} className="text-[var(--accent)] hover:text-[#33ddff] text-xs font-medium">Editar</button>
        <button onClick={() => onDelete(id)} className="text-[var(--red)] hover:text-[var(--red2)] text-xs font-medium">Excluir</button>
      </td>
    </tr>
  );
}
