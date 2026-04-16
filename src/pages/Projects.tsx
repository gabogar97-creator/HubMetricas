import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { Plus, X, FolderOpen, Edit2, Trash2, ArrowRight, ArrowLeft, Save, Clock } from 'lucide-react';
import { addMonths, format, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number | null) => n == null || isNaN(n) ? "R$ —" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const fmtShort = (n: number | null) => { if (n == null || isNaN(n)) return "—"; const a = Math.abs(n); if (a >= 1e6) return `R$ ${(n/1e6).toFixed(1)}M`; if (a >= 1e3) return `R$ ${(n/1e3).toFixed(1)}K`; return fmt(n); };
const fmtPct = (n: number | null) => n == null || isNaN(n) ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtDate = (d: string | null) => { if (!d) return "—"; const [y, m, day] = d.split("T")[0].split("-"); return `${day}/${m}/${y}`; };
const fmtMonths = (n: number | null) => n == null || isNaN(n) || !isFinite(n) ? "—" : `${Math.round(n)} meses`;
const fmtRatio = (n: number | null) => n == null || isNaN(n) || !isFinite(n) ? "—" : n.toFixed(2).replace('.', ',');

export function Projects() {
  console.log('--- Projects component starting render now (final check 2) ---');
  console.log('--- Projects component starting render now (final check) ---');
  console.log('--- Projects component starting render now ---');
  console.log('--- Projects component starting render ---');
  console.log('Starting Projects component render...');
  console.log('Projects component rendering...');
  console.log('Rendering Projects...');
  const { projects, deleteCollectionROI, refreshData, addCollectionNSM, addCollectionROI } = useAppContext();
  const [selId, setSelId] = useState<number | null>(null);
  const [wizard, setWizard] = useState(false);
  const [nsmWizard, setNsmWizard] = useState(false);
  const location = useLocation();

  const getLatestAccumulatedValue = (rows: any[], type: string) => {
    const latest = (rows || [])
      .filter((r: any) => r?.type === type && r?.totalValue != null && !isNaN(Number(r.totalValue)))
      .sort((a: any, b: any) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))[0];
    return latest ? Number(latest.totalValue) : 0;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectIdParam = params.get('projectId');

    if (projectIdParam) {
      const parsed = Number(projectIdParam);
      if (!Number.isNaN(parsed) && projects.some(p => p.id === parsed)) {
        setSelId(parsed);
        return;
      }
    }

    if (projects.length > 0 && selId === null) {
      setSelId(projects[0].id);
    }
  }, [projects, selId, location.search]);

  const project = projects.find(p => p.id === selId);

  const {
    totalInvestment,
    totalReturn,
    totalSaving,
    totalCostAvoidance,
    totalRevenue,
    roiPercentage,
    paybackMonths,
    paybackMonthLabel,
    nsmSeriesLabel,
    chartData,
    nsmChartData,
    pc
  } = useMemo(() => {
    if (!project) return {
      totalInvestment: 0, totalReturn: 0, totalSaving: 0, totalCostAvoidance: 0,
      totalRevenue: 0, roiPercentage: null, paybackMonths: null, nsmSeriesLabel: null, chartData: [], nsmChartData: [], pc: []
    };

    let inv = 0;
    let ret = 0;
    let sav = 0;
    let ca = 0;
    let rev = 0;

    let firstDate = new Date();
    let lastDate = new Date();
    let hasCollections = false;

    const monthlyData: Record<string, any> = {};

    const projectCollections = project.CollectionROIs || [];
    const sortedPc = [...projectCollections].sort((a, b) => (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0));

    const invAcc = getLatestAccumulatedValue(projectCollections, 'Custo');
    const savAcc = getLatestAccumulatedValue(projectCollections, 'Saving');
    const caAcc = getLatestAccumulatedValue(projectCollections, 'Cost Avoidance');
    const revAcc = getLatestAccumulatedValue(projectCollections, 'Revenue');
    const retAcc = savAcc + caAcc + revAcc;

    sortedPc.forEach(col => {
      if (!col.date) return;
      const d = new Date(col.date);
      if (isNaN(d.getTime())) return;
      if (!hasCollections || d < firstDate) firstDate = d;
      if (!hasCollections || d > lastDate) lastDate = d;
      hasCollections = true;

      const month = format(d, 'MMM/yy', { locale: ptBR });
      if (!monthlyData[month]) {
        monthlyData[month] = { date: month, Custo: 0, Saving: 0, 'Custo Evitado': 0, Receita: 0, Investimento: 0 };
      }

      if (col.type === 'Custo') {
        inv += col.totalValue;
        monthlyData[month].Investimento += col.totalValue;
      } else {
        ret += col.totalValue;
        if (col.type === 'Saving') { sav += col.totalValue; monthlyData[month].Saving += col.totalValue; }
        if (col.type === 'Cost Avoidance') { ca += col.totalValue; monthlyData[month]['Custo Evitado'] += col.totalValue; }
        if (col.type === 'Revenue') { rev += col.totalValue; monthlyData[month].Receita += col.totalValue; }
      }
    });

    const cData = Object.values(monthlyData);

    const nsmData: Record<string, any> = {};
    const nsmNames = new Set<string>();
    project.NSMs?.forEach(nsm => {
      const isNumeric = ['number', 'percentage', 'currency'].includes(nsm.type || 'number');
      if (!isNumeric) return;
      if (nsm.name) nsmNames.add(nsm.name);
      
      nsm.CollectionNSMs?.forEach(col => {
        if (!col.date) return;
        const d = new Date(col.date);
        if (isNaN(d.getTime())) return;
        const day = format(d, 'dd/MM/yy', { locale: ptBR });
        if (!nsmData[day]) {
          nsmData[day] = { date: day, Valor: 0, Meta: 0, count: 0 };
        }
        // Normalize to percentage for aggregated view
        const v = Number(col.value) || 0;
        const t = Number(nsm.target) || 0;
        const pct = t > 0 ? (v / t) * 100 : 0;
        nsmData[day].Valor += pct;
        nsmData[day].count += 1;
      });
    });
    const nData = Object.values(nsmData).map((t: any) => ({
      date: t.date,
      Valor: t.count > 0 ? t.Valor / t.count : 0,
      Meta: 100 // Normalized target is 100%
    })).sort((a, b) => {
      const [dA, mA, yA] = a.date.split('/');
      const [dB, mB, yB] = b.date.split('/');
      const timeA = new Date(`20${yA}-${mA}-${dA}`).getTime() || 0;
      const timeB = new Date(`20${yB}-${mB}-${dB}`).getTime() || 0;
      return timeA - timeB;
    });

    const pRoi = invAcc > 0 ? ((retAcc - invAcc) / invAcc) * 100 : (retAcc > 0 ? null : null);
    const months = Math.max(1, differenceInMonths(lastDate, firstDate) || 1);
    const avgMonthlyRet = retAcc / months;
    const pPayback = avgMonthlyRet > 0 ? invAcc / avgMonthlyRet : null;

    const paybackDate = pPayback != null ? addMonths(firstDate, Math.round(pPayback)) : null;
    const paybackMonthLabel = paybackDate ? format(paybackDate, 'MMM/yy', { locale: ptBR }) : null;
    const nsmSeriesLabel = nsmNames.size === 1 ? Array.from(nsmNames)[0] : (nsmNames.size > 1 ? 'Média (NSMs)' : null);

    return {
      totalInvestment: invAcc,
      totalReturn: retAcc,
      totalSaving: savAcc,
      totalCostAvoidance: caAcc,
      totalRevenue: revAcc,
      roiPercentage: pRoi,
      paybackMonths: pPayback,
      paybackMonthLabel,
      nsmSeriesLabel,
      chartData: cData,
      nsmChartData: nData,
      pc: sortedPc
    };
  }, [project]);

  return (
    <div className="animate-[fadeIn_0.2s_ease]">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-5 gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <select 
            className="bg-[var(--surface-high)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] text-[13px] outline-none max-w-[280px]"
            value={selId || ''} 
            onChange={e => {
              const val = e.target.value;
              setSelId(val ? Number(val) : null);
            }}
          >
            <option value="" disabled>Selecione um projeto...</option>
            <optgroup label="Projetos">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      {!project ? (
        <div className="glass-card rounded-xl text-center p-16 text-[var(--text-dim)]">
          <div className="flex justify-center mb-3"><FolderOpen size={40} className="text-[var(--text-dim)]" /></div>
          <div className="text-[15px] text-[var(--text-mid)] font-semibold">Selecione ou crie um projeto</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total de Investimento" value={fmtShort(totalInvestment)} color="var(--red)" helper="O custo total do projeto acumulado" />
            <KpiCard label="Retorno do Investimento" value={fmtShort(totalReturn)} color="var(--green)" helper="O total de retorno, considerando saving, custo evitado e receita" />
            <KpiCard
              label="Payback do Investimento"
              value={paybackMonths === 0 ? 'Payback obtido' : (paybackMonths != null ? `${Math.round(paybackMonths)} meses${paybackMonthLabel ? ` · ${paybackMonthLabel}` : ''}` : "—")}
              color={paybackMonths === 0 ? 'var(--green)' : 'var(--yellow)'}
              helper="Dado o retorno acumulado, obtemos a média mês de retorno, se mantido o custo, calculamos o payback acima"
            />
            <KpiCard
              label="ROI"
              value={roiPercentage != null ? `${fmtPct(roiPercentage)} · ${fmtRatio(1 + roiPercentage / 100)}` : "—"}
              color={roiPercentage != null ? (roiPercentage >= 0 ? "var(--green)" : "var(--red)") : "var(--text-dim)"}
              helper="Quanto mais próximo do 0% ou 1, mais próximo do payback"
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <BreakdownCard label="Total de Saving" value={totalSaving} color="var(--saving)" helper="Custo existente e reduzido pelo projeto" />
            <BreakdownCard label="Custo Evitado" value={totalCostAvoidance} color="var(--custo-evitado)" helper="Custo não existente, mas potencialmente necessário, evitado pelo projeto" />
            <BreakdownCard label="Total de Receita" value={totalRevenue} color="var(--receita)" helper="Receita obtida diretamente pelo projeto" />
            <BreakdownCard label="Total de Custo" value={totalInvestment} color="var(--red)" />
          </div>

          {/* Charts */}
          {pc.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
              <div className="glass-card rounded-xl p-[18px_20px]">
                <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-3.5">Evolução por Tipo de Retorno</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                    <XAxis dataKey="date" tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>fmtShort(v).replace("R$ ","")}/>
                    <Tooltip formatter={(v: number)=>fmt(v)} contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <Line type="monotone" dataKey="Saving" stroke="var(--saving)" strokeWidth={2} dot={{fill:"var(--saving)",r:3}}/>
                    <Line type="monotone" dataKey="Custo Evitado" stroke="var(--custo-evitado)" strokeWidth={2} dot={{fill:"var(--custo-evitado)",r:3}}/>
                    <Line type="monotone" dataKey="Receita" stroke="var(--receita)" strokeWidth={2} dot={{fill:"var(--receita)",r:3}}/>
                    <Line type="monotone" dataKey="Investimento" stroke="var(--red)" strokeWidth={2} strokeDasharray="5 3" dot={{fill:"var(--red)",r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card rounded-xl p-[18px_20px]">
                <div className="flex justify-between items-center mb-3.5">
                  <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Evolução da NSM</div>
                  {nsmSeriesLabel && (
                    <div className="text-[11px] text-[var(--text-dim)] truncate max-w-[220px]">{nsmSeriesLabel}</div>
                  )}
                </div>
                {nsmChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={nsmChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
                      <Legend wrapperStyle={{fontSize:11}}/>
                      <Line type="monotone" dataKey="Valor" stroke="var(--green)" strokeWidth={2} dot={{fill:"var(--green)",r:3}}/>
                      <Line type="monotone" dataKey="Meta" stroke="var(--yellow)" strokeWidth={2} strokeDasharray="4 3" dot={{fill:"var(--yellow)",r:3}}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center flex-col gap-2.5 text-[var(--text-dim)]">
                    <Clock size={28} className="text-[var(--text-dim)]" />
                    <span className="text-xs">Sem coletas de NSM</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NSM Metrics List */}
          {project.NSMs && project.NSMs.length > 0 && (
            <div className="glass-card rounded-xl p-[18px_20px]">
              <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-4">Métricas NSM</div>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                {project.NSMs.map(nsm => {
                  const cols = nsm.CollectionNSMs || [];
                  const sorted = [...cols].sort((a,b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
                  const latest = sorted[0];
                  const isNumeric = ['number', 'percentage', 'currency'].includes(nsm.type || 'number');
                  
                  let achievement = 0;
                  if (isNumeric && latest) {
                    const valNum = Number(latest.value) || 0;
                    const tgtNum = Number(nsm.target) || 0;
                    achievement = tgtNum > 0 ? (valNum / tgtNum) * 100 : 0;
                  }

                  return (
                    <div key={nsm.id} className="bg-[var(--surface-high)] rounded-lg p-3 border border-[var(--border)]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-xs font-bold text-[var(--text)]">{nsm.name}</div>
                          <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{nsm.type}</div>
                        </div>
                        {latest && isNumeric && (
                          <span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold" style={{ background: achievement >= 100 ? 'var(--green-dim)' : achievement >= 80 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)', color: achievement >= 100 ? 'var(--green)' : achievement >= 80 ? 'var(--yellow)' : 'var(--red)' }}>
                            {achievement.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {latest ? (
                        <>
                          <div className="flex gap-4 text-[11px] mb-3">
                            <div><span className="text-[var(--text-dim)]">Atual:</span> <span className="font-mono text-[var(--text)]">{isNumeric ? Number(latest.value).toLocaleString() : latest.value}</span></div>
                            <div><span className="text-[var(--text-dim)]">Meta:</span> <span className="font-mono text-[var(--text)]">{isNumeric ? Number(nsm.target).toLocaleString() : nsm.target}</span></div>
                          </div>
                          
                          {/* History Table */}
                          {sorted.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[var(--border)]">
                              <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-1.5">Histórico</div>
                              <div className="max-h-[100px] overflow-y-auto">
                                <table className="w-full text-[10px] text-left">
                                  <thead className="text-[var(--text-dim)] sticky top-0 bg-[var(--surface-high)]">
                                    <tr>
                                      <th className="py-1 font-medium">Data</th>
                                      <th className="py-1 font-medium text-right">Valor</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--border)]">
                                    {sorted.map((h: any, idx: number) => (
                                      <tr key={idx}>
                                        <td className="py-1 text-[var(--text-mid)]">
                                          {h.date && !isNaN(new Date(h.date.split('T')[0] + 'T12:00:00Z').getTime())
                                            ? format(new Date(h.date.split('T')[0] + 'T12:00:00Z'), 'dd/MM/yy', { locale: ptBR })
                                            : '-'}
                                        </td>
                                        <td className="py-1 text-right font-mono text-[var(--text)]">{isNumeric ? Number(h.value).toLocaleString() : h.value}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[11px] text-[var(--text-dim)]">Sem dados coletados</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formula */}
          <div className="glass-card rounded-xl p-[18px_20px]">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-3">Fórmula / Memória de Cálculo</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
              <div className="bg-[var(--surface-high)] rounded-lg p-3">
                <div className="text-[10px] text-[var(--blue)] font-bold mb-1.5">FÓRMULA DE CUSTO</div>
                <div className="text-xs text-[var(--text-mid)] whitespace-pre-wrap">{project.costFormula || 'Horas × Valor da Hora (ou definido manualmente)'}</div>
              </div>
              <div className="bg-[var(--surface-high)] rounded-lg p-3">
                <div className="text-[10px] text-[var(--green)] font-bold mb-1.5">FÓRMULA DE RETORNO</div>
                <div className="text-xs text-[var(--text-mid)] whitespace-pre-wrap">{project.returnFormula || 'Quantidade × Horas × Valor da Hora'}</div>
              </div>
            </div>
          </div>

          {/* Collections */}
          <div className="glass-card rounded-xl p-[18px_20px]">
            <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Coletas Registradas ({pc.length})</div>
              <button 
                className="bg-[var(--green)] text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                onClick={() => setWizard(true)}
              >
                <Plus size={14} /> Nova Coleta
              </button>
            </div>
            {pc.length === 0 ? (
              <div className="text-center p-8 text-[var(--text-dim)] text-[13px]">
                Nenhuma coleta ainda. Clique em "Nova Coleta" para começar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {["Data","Descrição","Investimento","Saving","Custo Evitado","Receita","Total Retorno","ROI",""].map(h => (
                        <th key={h} className="p-[9px_12px] text-left bg-[var(--surface-high)] text-[var(--text-dim)] font-bold text-[10px] uppercase tracking-[0.07em] border-b border-[var(--border)] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...pc].reverse().map(c => {
                      const ts = c.type === 'Saving' ? c.totalValue : 0;
                      const tce = c.type === 'Cost Avoidance' ? c.totalValue : 0;
                      const tr = c.type === 'Revenue' ? c.totalValue : 0;
                      const tot = ts + tce + tr; 
                      const invC = c.type === 'Custo' ? c.totalValue : 0;
                      const roi = invC > 0 ? ((tot - invC) / invC) * 100 : null;
                      return (
                        <tr key={c.id}>
                          <td className="p-[10px_12px] border-b border-[var(--border)] font-semibold text-[var(--text)]">{fmtDate(c.date)}</td>
                          <td className="p-[10px_12px] border-b border-[var(--border)] text-[var(--text-mid)]">{c.description || c.type}</td>
                          <td className="p-[10px_12px] border-b border-[var(--border)] text-[var(--red)]">{fmt(invC)}</td>
                          <td className="p-[10px_12px] border-b border-[var(--border)] text-[var(--saving)]">{fmt(ts)}</td>
                          <td className="p-[10px_12px] border-b border-[var(--border)] text-[var(--custo-evitado)]">{fmt(tce)}</td>
                          <td className="p-[10px_12px] border-b border-[var(--border)] text-[var(--receita)]">{fmt(tr)}</td>
                          <td className="p-[10px_12px] border-b border-[var(--border)] text-[var(--green)] font-semibold">{fmt(tot)}</td>
                          <td className="p-[10px_12px] border-b border-[var(--border)]">
                            <span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold" style={{ background: roi != null ? (roi >= 0 ? 'var(--green-dim)' : 'rgba(244,63,94,0.1)') : 'transparent', color: roi != null ? (roi >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-dim)' }}>
                              {roi != null ? fmtPct(roi) : "—"}
                            </span>
                          </td>
                          <td className="p-[10px_12px] border-b border-[var(--border)]">
                            <div className="flex gap-1.5">
                              <button className="bg-transparent border-none text-[var(--red)] cursor-pointer p-1 hover:opacity-80" onClick={() => deleteCollectionROI(c.id)}><Trash2 size={13}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {wizard && project && (
        <CollectionWizard 
          project={project} 
          onClose={() => setWizard(false)} 
          onSaveMultiple={async (payloads: any[]) => {
            for (const p of payloads) {
              await addCollectionROI(p);
            }
            setWizard(false);
          }} 
        />
      )}

      {nsmWizard && (
        <NSMCollectionWizard 
          nsms={project?.NSMs || []}
          title={`NSMs — ${project?.name}`}
          onClose={() => setNsmWizard(false)}
          onSave={async (payloads) => {
            for (const p of payloads) {
              await addCollectionNSM(p);
            }
            setNsmWizard(false);
          }}
        />
      )}
    </div>
  );
}

function NSMCard({ nsm }: { nsm: any, key?: any }) {
  const cols = nsm.CollectionNSMs || [];
  const sorted = [...cols].sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  const latest = sorted[0];
  const isNumeric = ['number', 'percentage', 'currency'].includes(nsm.type || 'number');

  let achievement = 0;
  if (isNumeric && latest) {
    const valNum = Number(latest.value) || 0;
    const tgtNum = Number(nsm.target) || 0;
    achievement = tgtNum > 0 ? (valNum / tgtNum) * 100 : 0;
  }

  return (
    <div className="bg-[var(--surface-high)] rounded-lg p-4 border border-[var(--border)]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-bold text-[var(--text)]">{nsm.name}</div>
          <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{nsm.type}</div>
        </div>
        {latest && isNumeric && (
          <span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold" style={{ background: achievement >= 100 ? 'var(--green-dim)' : achievement >= 80 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)', color: achievement >= 100 ? 'var(--green)' : achievement >= 80 ? 'var(--yellow)' : 'var(--red)' }}>
            {achievement.toFixed(1)}%
          </span>
        )}
      </div>
      {latest ? (
        <div className="space-y-3">
          <div className="flex gap-4 text-xs">
            <div><span className="text-[var(--text-dim)]">Atual:</span> <span className="font-mono text-[var(--text)]">{isNumeric ? Number(latest.value).toLocaleString() : latest.value}</span></div>
            <div><span className="text-[var(--text-dim)]">Meta:</span> <span className="font-mono text-[var(--text)]">{isNumeric ? Number(nsm.target).toLocaleString() : nsm.target}</span></div>
          </div>
          <div className="pt-2 border-t border-[var(--border)]">
            <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-1.5">Últimas Coletas</div>
            <div className="max-h-[80px] overflow-y-auto">
              <table className="w-full text-[10px] text-left">
                <tbody className="divide-y divide-[var(--border)]">
                  {sorted.slice(0, 5).map((h: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-1 text-[var(--text-mid)]">
                        {h.date && !isNaN(new Date(h.date.split('T')[0] + 'T12:00:00Z').getTime())
                          ? format(new Date(h.date.split('T')[0] + 'T12:00:00Z'), 'dd/MM/yy', { locale: ptBR })
                          : '-'}
                      </td>
                      <td className="py-1 text-right font-mono text-[var(--text)]">{isNumeric ? Number(h.value).toLocaleString() : h.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-[var(--text-dim)] py-4">Sem dados coletados</div>
      )}
    </div>
  );
}

function NSMCollectionWizard({ nsms, title, onClose, onSave }: { nsms: any[], title: string, onClose: () => void, onSave: (payloads: any[]) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState<Record<number, string>>({});

  const handleSave = () => {
    const payloads = Object.entries(values).map(([id, val]) => ({
      nsmId: Number(id),
      date,
      value: val
    })).filter(p => p.value !== '');
    onSave(payloads);
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="glass-card w-full max-w-[820px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[var(--border)] shrink-0 bg-[var(--surface)] sticky top-0 z-10">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold truncate">Nova Coleta — {title}</h3>
            <div className="text-[12px] text-[var(--text-dim)] mt-0.5">Preencha os valores e salve para registrar a coleta.</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)] shrink-0"><X size={16} /></button>
        </div>
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-mid)] uppercase tracking-wider mb-1.5">Data da Coleta</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[var(--surface-high)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
          </div>
          <div className="space-y-3">
            {nsms.map(nsm => (
              <div key={nsm.id} className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-mid)]">{nsm.name}</label>
                <input 
                  type={['number', 'currency', 'percentage'].includes(nsm.type) ? 'number' : 'text'} 
                  value={values[nsm.id] || ''} 
                  onChange={e => setValues({ ...values, [nsm.id]: e.target.value })}
                  placeholder={`Valor (${nsm.type})`}
                  className="w-full bg-[var(--surface-high)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" 
                />
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 sm:p-6 border-t border-[var(--border)] flex justify-end gap-3 shrink-0 bg-[var(--surface)]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-mid)] hover:text-[var(--text)]">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-bold hover:opacity-80 transition-opacity">Salvar Coletas</button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, helper }: any) {
  return (
    <div className="glass-card rounded-xl p-[18px_20px]">
      <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-1.5">{label}</div>
      <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
      {helper && (
        <div className="text-[11px] text-[var(--text-dim)] mt-2 leading-snug">{helper}</div>
      )}
    </div>
  );
}

function BreakdownCard({ label, value, color, helper }: any) {
  return (
    <div className="glass-card rounded-[10px] p-[14px_16px] border-t-[2px]" style={{ borderTopColor: color }}>
      <div className="text-[11px] text-[var(--text-mid)] mb-1">{label}</div>
      <div className="text-lg font-extrabold" style={{ color }}>{fmtShort(value)}</div>
      {helper && (
        <div className="text-[11px] text-[var(--text-dim)] mt-1 leading-snug">{helper}</div>
      )}
    </div>
  );
}

function CollectionWizard({ project, onClose, onSaveMultiple }: any) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const defaultMethods = [
    { id: 'default-saving', name: 'Saving', type: 'Saving' },
    { id: 'default-ca', name: 'Custo Evitado', type: 'Cost Avoidance' },
    { id: 'default-rev', name: 'Receita', type: 'Revenue' },
    { id: 'default-cost', name: 'Custo', type: 'Custo' }
  ];

  const methods = (project.roiMethods && project.roiMethods.length > 0) ? project.roiMethods : defaultMethods;

  const createInitialState = (m: any) => {
    const initialState: Record<string, any> = { active: false, desc: m.name };
    m.fields?.forEach((f: any) => {
      initialState[f.id] = f.defaultValue || 0;
    });
    return initialState;
  };

  const [methodsData, setMethodsData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    methods.forEach((m: any) => {
      initial[m.id] = createInitialState(m);
    });
    return initial;
  });

  const steps = [
    { id: 'date', title: 'Data da Coleta' },
    ...methods.map((m: any) => ({ id: m.id, title: m.name, type: m.type })),
    { id: 'confirm', title: 'Confirmação' }
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));

  const calculateTotal = (m: any, data: any) => {
    if (!m.formula || m.formula.length === 0) return data.manual || 0;
    
    let total = 0;
    let currentOperator = '+';
    
    m.formula.forEach((part: any) => {
      if (part.type === 'field') {
        const field = m.fields?.find((f: any) => f.id === part.value || f.name === part.value);
        const value = field ? Number(data[field.id]) : 0;
        
        if (currentOperator === '+') total += value;
        else if (currentOperator === '-') total -= value;
        else if (currentOperator === '*') total *= value;
        else if (currentOperator === '/') total /= value;
      } else {
        currentOperator = part.value;
      }
    });
    
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payloads: any[] = [];
    
    methods.forEach((m: any) => {
      const data = methodsData[m.id];
      const total = calculateTotal(m, data);
      if (data.active && total > 0) {
        payloads.push({
          type: m.type,
          description: data.desc || m.name,
          totalValue: total,
          customData: data
        });
      }
    });

    const finalPayloads = payloads.map(p => ({ ...p, projectId: project.id, date }));
    onSaveMultiple(finalPayloads);
  };

  const updateMethodData = (id: string, newData: any) => {
    setMethodsData(prev => ({ ...prev, [id]: { ...prev[id], ...newData } }));
  };

  const renderForm = (m: any) => {
    const data = methodsData[m.id];
    return (
    <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
      <label className="flex items-center gap-2 cursor-pointer p-3 bg-[var(--surface-high)] rounded-lg border border-[var(--border)] hover:border-[var(--green)] transition-colors">
        <input type="checkbox" checked={data.active} onChange={e => updateMethodData(m.id, { active: e.target.checked })} className="w-4 h-4 accent-[var(--green)]" />
        <span className="text-[13px] font-medium text-[var(--text)]">Registrar {m.name} nesta data?</span>
      </label>

      {data.active && (
        <div className="space-y-4 pl-4 border-l-2 border-[var(--green)] mt-4 animate-[fadeIn_0.2s_ease]">
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-mid)] uppercase tracking-[0.07em] mb-1.5">Descrição</label>
            <input type="text" value={data.desc} readOnly className="w-full bg-[var(--surface-high)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-dim)] focus:outline-none cursor-not-allowed" />
          </div>

          {m.fields?.map((f: any) => (
             <div key={f.id}>
                <label className="block text-[10px] font-bold text-[var(--text-mid)] uppercase tracking-[0.07em] mb-1.5">{f.name}</label>
                <input 
                  type="number" 
                  value={data[f.id]} 
                  onChange={e => updateMethodData(m.id, { [f.id]: Number(e.target.value) })} 
                  readOnly={f.type === 'fixed'}
                  className={`w-full bg-[var(--surface-high)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none ${f.type === 'fixed' ? 'text-[var(--text-dim)] cursor-not-allowed' : 'focus:border-[var(--green)]'}`} 
                />
             </div>
          ))}

          <div className="bg-[var(--surface-high)] p-3 rounded-lg flex justify-between items-center border border-[var(--border)] mt-2">
            <span className="text-[13px] text-[var(--text-mid)] font-semibold">Total Calculado:</span>
            <span className="font-mono font-bold text-lg text-[var(--green)]">R$ {calculateTotal(m, data).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="glass-card w-full max-w-[980px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex justify-between items-center p-[20px_22px] sm:p-[24px_26px] border-b border-[var(--border)] shrink-0 bg-[var(--surface)] sticky top-0 z-10">
          <h3 className="m-0 text-[15px] font-bold">Nova Coleta — {project.name}</h3>
          <button onClick={onClose} className="bg-transparent border-none text-[var(--text-dim)] cursor-pointer hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-[20px_22px] sm:p-[24px_26px]">
          {/* Stepper */}
          <div className="flex mb-[22px] bg-[var(--surface-high)] rounded-[12px] overflow-hidden border border-[var(--border)]">
            {steps.map((s, i) => (
              <div 
                key={i} 
                onClick={() => i < step && setStep(i)} 
                className={`flex-1 p-[8px_2px] text-center text-[10px] font-bold ${i < step ? 'cursor-pointer' : 'cursor-default'} ${i === step ? 'bg-[var(--green)] text-white' : i < step ? 'bg-[var(--green-dim)] text-[var(--green)]' : 'bg-transparent text-[var(--text-dim)]'} ${i < steps.length - 1 ? 'border-r border-[var(--border)]' : 'border-none'}`}
              >
                {s.title}
              </div>
            ))}
          </div>

          <h4 className="m-[0_0_14px] text-[15px] text-[var(--text)]">{steps[step].title}</h4>

          {step === 0 && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
              <p className="m-[0_0_16px] text-[13px] text-[var(--text-mid)]">Informe a data de referência desta coleta.</p>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-mid)] uppercase tracking-[0.07em] mb-1.5">Data da Coleta</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[var(--surface-high)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--green)]" />
              </div>
            </div>
          )}

          {step > 0 && step < steps.length - 1 && renderForm(methods[step - 1])}

          {step === steps.length - 1 && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
              <div className="bg-[var(--surface-high)] rounded-[10px] p-4 mb-4">
                <div className="text-[11px] text-[var(--text-dim)] mb-0.5">Data da Coleta</div>
                <div className="text-base font-bold mb-4">{fmtDate(date)}</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {methods.map((m: any) => {
                    const data = methodsData[m.id];
                    const col = m.type === 'Saving' ? 'var(--saving)' : m.type === 'Revenue' ? 'var(--receita)' : m.type === 'Cost Avoidance' ? 'var(--custo-evitado)' : 'var(--red)';
                    return (
                    <div key={m.id} className="bg-[var(--bg)] rounded-lg p-[10px_12px]">
                      <div className="text-[10px] text-[var(--text-dim)] mb-[3px] uppercase font-semibold">{m.name}</div>
                      <div className="text-base font-extrabold" style={{ color: data.active ? col : 'var(--text-dim)' }}>{data.active ? fmt(calculateTotal(m, data)) : '—'}</div>
                    </div>
                  )})}
                </div>
              </div>
              {!methods.some((m: any) => methodsData[m.id].active) && (
                <div className="text-[13px] text-[var(--red)] bg-[rgba(244,63,94,0.1)] p-3 rounded-lg border border-[rgba(244,63,94,0.2)]">
                  Atenção: Nenhum valor foi preenchido. Nada será salvo.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-[22px] pt-4 border-t border-[var(--border)] p-[0_22px_20px] sm:p-[0_26px_24px] shrink-0 bg-[var(--surface)]">
          <button 
            type="button" 
            onClick={step === 0 ? onClose : handlePrev} 
            className="bg-[var(--surface-high)] text-[var(--text)] px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={13} /> {step === 0 ? 'Cancelar' : 'Anterior'}
          </button>
          
          {step < steps.length - 1 ? (
            <button 
              type="button" 
              onClick={handleNext} 
              className="bg-[var(--green)] text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              Próximo <ArrowRight size={13} />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={!methods.some((m: any) => methodsData[m.id].active)}
              className="bg-[var(--green)] text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={13} /> Salvar Coleta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
