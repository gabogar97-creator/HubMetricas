import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { format, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartBar, Target, Plus, X } from 'lucide-react';

const fmt = (n: number | null) => n == null || isNaN(n) ? "R$ —" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const fmtShort = (n: number | null) => { if (n == null || isNaN(n)) return "—"; const a = Math.abs(n); if (a >= 1e6) return `R$ ${(n/1e6).toFixed(1)}M`; if (a >= 1e3) return `R$ ${(n/1e3).toFixed(1)}K`; return fmt(n); };
const fmtPct = (n: number | null) => n == null || isNaN(n) ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtMonths = (n: number | null) => n == null || isNaN(n) || !isFinite(n) ? "—" : `${Math.round(n)} meses`;
const fmtRatio = (n: number | null) => n == null || isNaN(n) || !isFinite(n) ? "—" : n.toFixed(2).replace('.', ',');

export function Dashboard() {
  const { projects, globalNSMs, refreshData, addCollectionNSM } = useAppContext();
  const [activeTab, setActiveTab] = useState<'roi' | 'nsm'>('roi');
  const [selectedMetricFilter, setSelectedMetricFilter] = useState<string>('all');
  const [isNsmModalOpen, setIsNsmModalOpen] = useState(false);
  const [newNsmId, setNewNsmId] = useState('');
  const [newNsmDate, setNewNsmDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNsmValue, setNewNsmValue] = useState('');
  const navigate = useNavigate();

  const getLatestAccumulatedValue = (rows: any[], type: string) => {
    const latest = (rows || [])
      .filter((r: any) => r?.type === type && r?.totalValue != null && !isNaN(Number(r.totalValue)))
      .sort((a: any, b: any) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))[0];
    return latest ? Number(latest.totalValue) : 0;
  };

  const handleSaveNsmValue = async () => {
    if (!newNsmId || !newNsmDate || !newNsmValue) return;
    await addCollectionNSM({
      nsmId: Number(newNsmId),
      date: newNsmDate,
      value: newNsmValue
    });
    setIsNsmModalOpen(false);
    setNewNsmId(''); setNewNsmValue('');
  };

  const allNsms = useMemo(() => {
    const list: any[] = [];
    projects.forEach(p => {
      if (p.NSMs) p.NSMs.forEach(n => list.push({ ...n, projectName: p.name }));
    });
    globalNSMs.forEach(n => list.push({ ...n, projectName: 'Global' }));
    return list;
  }, [projects, globalNSMs]);

  const {
    totalInvestment,
    totalReturn,
    totalSaving,
    totalCostAvoidance,
    totalRevenue,
    roiPercentage,
    paybackMonths,
    avgRoiPerProject,
    avgPaybackPerProject,
    projectMetrics
  } = useMemo(() => {
    const paybackStartDate = new Date('2025-10-01T00:00:00');
    let inv = 0;
    let ret = 0;
    let sav = 0;
    let ca = 0;
    let rev = 0;
    let projCount = 0;
    let sumRoi = 0;
    let sumPayback = 0;

    const projMetrics: any[] = [];

    projects.forEach(p => {
      const pInv = getLatestAccumulatedValue(p.CollectionROIs, 'Custo');
      const pSav = getLatestAccumulatedValue(p.CollectionROIs, 'Saving');
      const pCa = getLatestAccumulatedValue(p.CollectionROIs, 'Cost Avoidance');
      const pRev = getLatestAccumulatedValue(p.CollectionROIs, 'Revenue');
      const pRet = pSav + pCa + pRev;

      let firstDate = new Date();
      let lastDate = new Date();
      let hasCollections = false;

      p.CollectionROIs?.forEach(roi => {
        if (!roi.date) return;
        const d = new Date(roi.date);
        if (isNaN(d.getTime())) return;
        if (!hasCollections || d < firstDate) firstDate = d;
        if (!hasCollections || d > lastDate) lastDate = d;
        hasCollections = true;
      });

      inv += pInv;
      ret += pRet;
      sav += pSav;
      ca += pCa;
      rev += pRev;

      if (hasCollections) {
        projCount++;
        const pRoi = pInv > 0 ? ((pRet - pInv) / pInv) * 100 : (pRet > 0 ? 100 : 0);
        sumRoi += pRoi;

        const months = Math.max(1, differenceInMonths(lastDate, firstDate) || 1);
        const avgMonthlyRet = pRet / months;
        const pPayback = avgMonthlyRet > 0 ? pInv / avgMonthlyRet : 0;
        sumPayback += pPayback;

        projMetrics.push({
          id: p.id,
          name: p.name,
          roi: pRoi,
          payback: pPayback
        });
      } else {
        projMetrics.push({
          id: p.id,
          name: p.name,
          roi: null,
          payback: null
        });
      }
    });

    const overallRoi = inv > 0 ? ((ret - inv) / inv) * 100 : (ret > 0 ? null : null);
    const monthsSinceStart = Math.max(1, differenceInMonths(new Date(), paybackStartDate) || 1);
    const overallAvgMonthlyRet = ret / monthsSinceStart;
    const overallPayback = overallAvgMonthlyRet > 0 ? inv / overallAvgMonthlyRet : null;

    return {
      totalInvestment: inv,
      totalReturn: ret,
      totalSaving: sav,
      totalCostAvoidance: ca,
      totalRevenue: rev,
      roiPercentage: overallRoi,
      paybackMonths: overallPayback,
      avgRoiPerProject: projCount > 0 ? sumRoi / projCount : null,
      avgPaybackPerProject: projCount > 0 ? sumPayback / projCount : null,
      projectMetrics: projMetrics
    };
  }, [projects]);

  const nsmMetrics = useMemo(() => {
    let totalProjectsWithNsm = 0;
    let totalNumericNsms = 0;
    let sumAchievement = 0;
    const projectNsmList: any[] = [];
    const nsmTimeline: Record<string, any> = {};
    const metricsSet = new Set<string>();

    const processNsm = (nsm: any, projectName: string) => {
      metricsSet.add(nsm.name);
      if (selectedMetricFilter !== 'all' && nsm.name !== selectedMetricFilter) return;

      const collections = nsm.CollectionNSMs || [];
      if (!collections || collections.length === 0) return;
      totalProjectsWithNsm++;
      
      // Sort to get latest
      const sorted = [...collections].sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
      const latest = sorted[0];
      
      const isNumeric = ['number', 'percentage', 'currency'].includes(nsm.type || 'number');
      let achievement = 0;
      
      if (isNumeric) {
        const valNum = Number(latest.value) || 0;
        const tgtNum = Number(nsm.target) || 0;
        achievement = tgtNum > 0 ? (valNum / tgtNum) * 100 : 0;
        sumAchievement += achievement;
        totalNumericNsms++;
      }

      projectNsmList.push({
        name: projectName,
        metricName: nsm.name,
        type: nsm.type || 'number',
        value: latest.value,
        target: nsm.target,
        achievement,
        date: latest.date,
        isNumeric,
        history: sorted
      });

      // Timeline
      if (isNumeric) {
        sorted.forEach(col => {
          if (!col.date) return;
          const d = new Date(col.date.split('T')[0] + 'T12:00:00Z');
          if (isNaN(d.getTime())) return;
          const day = format(d, 'dd/MM/yy', { locale: ptBR });
          if (!nsmTimeline[day]) {
            nsmTimeline[day] = { date: day, Valor: 0, Meta: 0, count: 0 };
          }
          const v = Number(col.value) || 0;
          const t = Number(nsm.target) || 0;
          const pct = t > 0 ? (v / t) * 100 : 0;
          nsmTimeline[day].Valor += pct;
          nsmTimeline[day].count += 1;
        });
      }
    };

    projects.forEach(p => {
      if (p.NSMs) {
        p.NSMs.forEach(nsm => processNsm(nsm, p.name));
      }
    });

    globalNSMs.forEach(nsm => processNsm(nsm, 'Global'));

    const avgAchievement = totalNumericNsms > 0 ? sumAchievement / totalNumericNsms : 0;

    const timelineData = Object.values(nsmTimeline).map((t: any) => ({
      date: t.date,
      'Atingimento Médio (%)': t.count > 0 ? t.Valor / t.count : 0
    })).sort((a, b) => {
      const [dA, mA, yA] = a.date.split('/');
      const [dB, mB, yB] = b.date.split('/');
      const timeA = new Date(`20${yA}-${mA}-${dA}`).getTime() || 0;
      const timeB = new Date(`20${yB}-${mB}-${dB}`).getTime() || 0;
      return timeA - timeB;
    });

    return {
      totalProjectsWithNsm,
      avgAchievement,
      projectNsmList: projectNsmList.sort((a, b) => b.achievement - a.achievement),
      timelineData,
      availableMetrics: Array.from(metricsSet)
    };
  }, [projects, selectedMetricFilter]);

  if (!projects.length) return (
    <div className="glass-card rounded-xl text-center p-20 text-[var(--text-dim)]">
      <div className="flex justify-center mb-4"><ChartBar size={48} className="text-[var(--text-dim)]" /></div>
      <div className="mt-4 text-base font-semibold text-[var(--text-mid)]">Nenhum projeto ainda</div>
      <div className="mt-1.5 text-[13px]">Vá em Projetos para criar o primeiro.</div>
    </div>
  );

  const validROI = projectMetrics.filter(x => x.roi != null);

  return (
    <div className="flex flex-col gap-[18px] animate-[fadeIn_0.2s_ease]">
      
      <div className="flex gap-1 bg-[var(--bg4)] p-1 rounded-lg w-fit flex-wrap mb-2 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('roi')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'roi' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
          }`}
        >
          Visão Financeira (ROI)
        </button>
        <button
          onClick={() => setActiveTab('nsm')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'nsm' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
          }`}
        >
          Visão de Produto (NSM)
        </button>
      </div>

      {activeTab === 'roi' && (
        <>
          {/* Row 1 — 4 Big KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
        <KpiCard label="Total de Investimento" value={fmtShort(totalInvestment)} sub={fmt(totalInvestment)} color="var(--red)" />
        <KpiCard label="Retorno do Investimento" value={fmtShort(totalReturn)} sub={fmt(totalReturn)} color="var(--green)" />
        <KpiCard
          label="Payback do Investimento"
          value={fmtMonths(paybackMonths)}
          sub={paybackMonths ? `~${paybackMonths.toFixed(1)} meses` : "Sem retorno"}
          helper="Dado o retorno acumulado, obtemos a média mês de retorno, se mantido o custo, calculamos o payback acima"
          color="var(--yellow)"
        />
        <KpiCard
          label="ROI Global"
          value={roiPercentage != null ? `${fmtPct(roiPercentage)} · ${fmtRatio(1 + roiPercentage / 100)}` : "—"}
          sub={`${validROI.length} projetos com dados`}
          helper="Quanto mais próximo do 0% ou 1, mais próximo do payback"
          color={roiPercentage != null && roiPercentage >= 0 ? "var(--green)" : "var(--red)"}
        />
      </div>

      {/* Row 2 — Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
        <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
          <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-1.5">ROI Médio por Projeto</div>
          <div className="text-2xl font-extrabold mb-4" style={{ color: avgRoiPerProject != null ? (avgRoiPerProject >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-dim)' }}>
            {avgRoiPerProject != null ? fmtPct(avgRoiPerProject) : "—"}
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {projectMetrics.filter(x => x.roi != null).sort((a,b) => b.roi - a.roi).map((m) => (
              <button
                key={m.id ?? m.name}
                type="button"
                onClick={() => m.id != null && navigate(`/projects?projectId=${m.id}`)}
                className="w-full text-left flex justify-between items-center glass-card p-2 rounded-lg cursor-pointer border border-transparent hover:border-[var(--border2)] hover:bg-[var(--bg2)] transition-colors"
              >
                <span className="text-xs text-[var(--text-mid)] truncate mr-2">{m.name}</span>
                <span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold shrink-0" style={{ background: m.roi >= 0 ? 'var(--green-dim)' : 'rgba(244,63,94,0.1)', color: m.roi >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {fmtPct(m.roi)}
                </span>
              </button>
            ))}
            {projectMetrics.filter(x => x.roi === null).map((m) => (
              <div key={m.name} className="flex justify-between items-center glass-card p-2 rounded-lg">
                <span className="text-xs text-[var(--text-dim)] truncate mr-2">{m.name}</span>
                <span className="text-[11px] text-[var(--text-dim)] shrink-0">sem coletas</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
          <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-1.5">Payback Médio por Projeto</div>
          <div className="text-2xl font-extrabold text-[var(--yellow)] mb-4">{fmtMonths(avgPaybackPerProject)}</div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {projectMetrics.filter(x => x.payback != null && isFinite(x.payback)).sort((a,b) => a.payback - b.payback).map((m) => (
              <div key={m.name} className="flex justify-between items-center glass-card p-2 rounded-lg">
                <span className="text-xs text-[var(--text-mid)] truncate mr-2">{m.name}</span>
                <span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(245,158,11,0.1)] text-[var(--yellow)] shrink-0">
                  {fmtMonths(m.payback)}
                </span>
              </div>
            ))}
            {projectMetrics.filter(x => x.payback == null || !isFinite(x.payback)).map((m) => (
              <div key={m.name} className="flex justify-between items-center glass-card p-2 rounded-lg">
                <span className="text-xs text-[var(--text-dim)] truncate mr-2">{m.name}</span>
                <span className="text-[11px] text-[var(--text-dim)] shrink-0">—</span>
              </div>
            ))}
          </div>
        </div>
      </div>

          {/* Row 3 — Retorno por Tipo */}
          <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-4">Retorno por Tipo</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[14px] mb-5">
              {[
                {label:"Total de Saving",value:totalSaving,color:"var(--saving)"},
                {label:"Total de Custo Evitado",value:totalCostAvoidance,color:"var(--custo-evitado)"},
                {label:"Total de Receita",value:totalRevenue,color:"var(--receita)"},
              ].map(item=>(
                <div key={item.label} className="glass-card rounded-[10px] p-[14px_16px] border-l-[3px]" style={{ borderLeftColor: item.color }}>
                  <div className="text-[11px] text-[var(--text-mid)] mb-1.5">{item.label}</div>
                  <div className="text-xl font-extrabold" style={{ color: item.color }}>{fmtShort(item.value)}</div>
                  <div className="text-[11px] text-[var(--text-dim)] mt-[3px]">{fmt(item.value)}</div>
                </div>
              ))}
            </div>
            {(totalSaving+totalCostAvoidance+totalRevenue) > 0 && (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[300px]">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={[{name:"Saving",value:totalSaving,fill:"var(--saving)"},{name:"Custo Evitado",value:totalCostAvoidance,fill:"var(--custo-evitado)"},{name:"Receita",value:totalRevenue,fill:"var(--receita)"}].filter(d=>d.value>0)} barSize={48}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="name" tick={{fill:"var(--text-mid)",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>fmtShort(v).replace("R$ ","")} width={60}/>
                      <Tooltip formatter={(v: number)=>fmt(v)} contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}} cursor={{fill:"var(--border-light)"}}/>
                      <Bar dataKey="value" radius={[6,6,0,0]} fill="var(--green)"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'nsm' && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Filtrar por Métrica:</label>
              <select 
                value={selectedMetricFilter} 
                onChange={(e) => setSelectedMetricFilter(e.target.value)} 
                className="bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-1.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors w-full sm:w-auto"
              >
                <option value="all">Todas as Métricas</option>
                {nsmMetrics.availableMetrics.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button onClick={() => setIsNsmModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors w-full sm:w-auto">
              <Plus size={14} />
              Adicionar Valores
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
            <div className="glass-card rounded-xl p-4 sm:p-[18px_20px] overflow-hidden">
              <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-2">Projetos com NSM</div>
              <div className="text-[22px] font-extrabold leading-none text-[var(--blue)]">{nsmMetrics.totalProjectsWithNsm}</div>
              <div className="text-[11px] text-[var(--text-dim)] mt-1.5">Total de projetos monitorando métricas</div>
            </div>
            <div className="glass-card rounded-xl p-4 sm:p-[18px_20px] overflow-hidden">
              <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-2">Atingimento Médio Global</div>
              <div className="text-[22px] font-extrabold leading-none" style={{ color: nsmMetrics.avgAchievement >= 100 ? 'var(--green)' : nsmMetrics.avgAchievement >= 80 ? 'var(--yellow)' : 'var(--red)' }}>
                {nsmMetrics.avgAchievement.toFixed(1)}%
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-1.5">Média de atingimento da meta atual</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
            <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
              <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-4">Status Atual por Projeto</div>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                {nsmMetrics.projectNsmList.map((m, i) => (
                  <div key={i} className="glass-card rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-[var(--text)]">{m.name}</div>
                        <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{m.metricName}</div>
                      </div>
                      {m.isNumeric ? (
                        <span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold w-fit" style={{ background: m.achievement >= 100 ? 'var(--green-dim)' : m.achievement >= 80 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)', color: m.achievement >= 100 ? 'var(--green)' : m.achievement >= 80 ? 'var(--yellow)' : 'var(--red)' }}>
                          {m.achievement.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold glass-card text-[var(--text-mid)] w-fit">
                          {m.type === 'status' ? 'Status' : 'Texto'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-[11px] mb-3">
                      <div><span className="text-[var(--text-dim)]">Atual:</span> <span className="font-mono text-[var(--text)]">{m.isNumeric ? Number(m.value).toLocaleString() : m.value}</span></div>
                      <div><span className="text-[var(--text-dim)]">Meta:</span> <span className="font-mono text-[var(--text)]">{m.isNumeric ? Number(m.target).toLocaleString() : m.target}</span></div>
                    </div>
                    
                    {/* History Table */}
                    {m.history && m.history.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)]">
                        <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-1.5">Histórico</div>
                        <div className="max-h-[100px] overflow-y-auto">
                          <table className="w-full text-[10px] text-left">
                            <thead className="text-[var(--text-dim)] sticky top-0 bg-[var(--bg3)]">
                              <tr>
                                <th className="py-1 font-medium">Data</th>
                                <th className="py-1 font-medium text-right">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                              {m.history.map((h: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="py-1 text-[var(--text-mid)]">
                                    {h.date && !isNaN(new Date(h.date.split('T')[0] + 'T12:00:00Z').getTime()) 
                                      ? format(new Date(h.date.split('T')[0] + 'T12:00:00Z'), 'dd/MM/yy', { locale: ptBR })
                                      : '-'}
                                  </td>
                                  <td className="py-1 text-right font-mono text-[var(--text)]">{m.isNumeric ? Number(h.value).toLocaleString() : h.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {nsmMetrics.projectNsmList.length === 0 && (
                  <div className="text-center p-8 text-[var(--text-dim)] text-[13px]">
                    Nenhuma métrica NSM registrada.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
              <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-4">Evolução de Atingimento (Média %)</div>
              {nsmMetrics.timelineData.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[300px]">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={nsmMetrics.timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                        <XAxis dataKey="date" tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} width={40}/>
                        <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
                        <Line type="monotone" dataKey="Atingimento Médio (%)" stroke="var(--blue)" strokeWidth={2} dot={{fill:"var(--blue)",r:4}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center flex-col gap-2.5 text-[var(--text-dim)]">
                  <Target size={28} className="text-[var(--text-dim)]" />
                  <span className="text-xs">Sem dados históricos</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {isNsmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text)]">Adicionar Valor NSM</h3>
              <button onClick={() => setIsNsmModalOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">NSM</label>
                <select value={newNsmId} onChange={(e) => setNewNsmId(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors">
                  <option value="">Selecione uma NSM...</option>
                  {allNsms.map(n => (
                    <option key={n.id} value={n.id}>{n.projectName} - {n.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Data</label>
                <input type="date" value={newNsmDate} onChange={(e) => setNewNsmDate(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Valor</label>
                <input type="text" value={newNsmValue} onChange={(e) => setNewNsmValue(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setIsNsmModalOpen(false)} className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Cancelar</button>
                <button onClick={handleSaveNsmValue} className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function KpiCard({ label, value, sub, helper, color }: any) {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-[18px_20px] overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-2 relative z-10">{label}</div>
      <div className="text-xl sm:text-[22px] font-extrabold leading-none relative z-10" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[var(--text-dim)] mt-1.5 relative z-10">{sub}</div>
      {helper && (
        <div className="text-[11px] text-[var(--text-dim)] mt-2 leading-snug relative z-10">{helper}</div>
      )}
    </div>
  );
}
