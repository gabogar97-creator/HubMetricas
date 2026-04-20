import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { format, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartBar, Target, Plus, X, Trash2 } from 'lucide-react';

const fmt = (n: number | null) => n == null || isNaN(n) ? "R$ —" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const fmtShort = (n: number | null) => { if (n == null || isNaN(n)) return "—"; const a = Math.abs(n); if (a >= 1e6) return `R$ ${(n/1e6).toFixed(1)}M`; if (a >= 1e3) return `R$ ${(n/1e3).toFixed(1)}K`; return fmt(n); };
const fmtPct = (n: number | null) => n == null || isNaN(n) ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtMonths = (n: number | null) => n == null || isNaN(n) || !isFinite(n) ? "—" : `${Math.round(n)} meses`;
const fmtRatio = (n: number | null) => n == null || isNaN(n) || !isFinite(n) ? "—" : n.toFixed(2).replace('.', ',');

export function Dashboard() {
  const {
    projects,
    refreshData,
    addCollectionNSM,
    addOKR,
    addOkrKeyResult,
    updateOkrKeyResult,
    addCollectionOkrKeyResult,
    deleteOKR,
    deleteOkrKeyResult,
    deleteCollectionOkrKeyResult
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<'roi' | 'nsm' | 'pe' | 'ops'>('roi');
  const [selectedMetricFilter, setSelectedMetricFilter] = useState<string>('all');
  const [isNsmModalOpen, setIsNsmModalOpen] = useState(false);
  const [newNsmId, setNewNsmId] = useState('');
  const [newNsmDate, setNewNsmDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNsmValue, setNewNsmValue] = useState('');
  const [nsmSaveError, setNsmSaveError] = useState<string>('');
  const [isSavingNsm, setIsSavingNsm] = useState(false);
  const [peYear, setPeYear] = useState<number>(new Date().getFullYear());
  const [isOkrModalOpen, setIsOkrModalOpen] = useState(false);
  const [editingKr, setEditingKr] = useState<any | null>(null);
  const [collectingKr, setCollectingKr] = useState<any | null>(null);
  const navigate = useNavigate();

  const envJiraEmail = import.meta.env.VITE_JIRA_EMAIL as string | undefined;
  const envJiraToken = import.meta.env.VITE_JIRA_API_TOKEN as string | undefined;
  const [opsJiraSprintsLoading, setOpsJiraSprintsLoading] = useState(false);
  const [opsJiraSprintsError, setOpsJiraSprintsError] = useState<string>('');
  const [opsJiraSprints, setOpsJiraSprints] = useState<any[]>([]);
  const [opsJiraMetricsLoading, setOpsJiraMetricsLoading] = useState(false);
  const [opsNotEstimatedOpen, setOpsNotEstimatedOpen] = useState(false);
  const [opsNotEstimatedList, setOpsNotEstimatedList] = useState<any[]>([]);
  const [opsNotEstimatedCount, setOpsNotEstimatedCount] = useState<number | null>(null);
  const [opsCreatingOpen, setOpsCreatingOpen] = useState(false);
  const [opsCreatingMetricsLoaded, setOpsCreatingMetricsLoaded] = useState(false);
  const [opsDbLoading, setOpsDbLoading] = useState(false);
  const [opsDbError, setOpsDbError] = useState<string>('');

  const [opsRows, setOpsRows] = useState<any[]>([]);

  const [expandedOpsIds, setExpandedOpsIds] = useState<string[]>([]);
  const [selectedOpsId, setSelectedOpsId] = useState<string>('');
  const [editingOpsId, setEditingOpsId] = useState<string>('');
  const [opsDraftById, setOpsDraftById] = useState<Record<string, any>>({});
  const [newOpsDraft, setNewOpsDraft] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    sprint: '',
    sprintId: '',
    spEstimate: '',
    spDone: '',
    throughput: '',
    bugsVolume: '',
    deadlinesAgreed: '',
    deadlinesMet: '',
    deadlineAccuracy: '',
    velocity: '',
  });

  const invokeJiraOps = async (payload: any) => {
    const { data, error } = await supabase.functions.invoke('jira-ops-sprints', {
      body: {
        ...(payload || {}),
        ...(envJiraEmail && envJiraToken ? { jiraEmail: envJiraEmail, jiraApiToken: envJiraToken } : {}),
      },
    });
    if (error) throw new Error(error.message || 'Falha ao consultar Jira.');
    return data as any;
  };

  const loadOpsJiraSprints = async () => {
    try {
      setOpsJiraSprintsLoading(true);
      setOpsJiraSprintsError('');
      const data = await invokeJiraOps({ action: 'listSprints' });
      setOpsJiraSprints(Array.isArray(data?.sprints) ? data.sprints : []);
    } catch (e: any) {
      console.error('Failed to load Jira sprints:', e);
      setOpsJiraSprintsError(e?.message || 'Falha ao carregar sprints do Jira.');
    } finally {
      setOpsJiraSprintsLoading(false);
    }
  };

  const loadOpsRowsFromDb = async () => {
    try {
      setOpsDbLoading(true);
      setOpsDbError('');
      const { data, error } = await supabase
        .from('ops_sprints')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOpsRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Failed to load ops sprints from DB:', e);
      setOpsDbError(e?.message || 'Falha ao carregar sprints do banco.');
    } finally {
      setOpsDbLoading(false);
    }
  };

  const computeDefaultVelocity = () => {
    const rows = Array.isArray(opsRowsSorted) ? opsRowsSorted : [];
    const last3 = rows
      .filter((r: any) => r?.velocity != null && !Number.isNaN(Number(r.velocity)))
      .slice(0, 3)
      .map((r: any) => Number(r.velocity));
    if (last3.length === 0) return null;
    const sum = last3.reduce((a: number, b: number) => a + b, 0);
    return sum / 3;
  };

  const computeDeadlineAccuracy = (agreedRaw: any, metRaw: any) => {
    const agreed = agreedRaw === '' || agreedRaw == null ? null : Number(agreedRaw);
    const met = metRaw === '' || metRaw == null ? null : Number(metRaw);
    if (!agreed || Number.isNaN(agreed) || agreed <= 0) return '';
    if (met == null || Number.isNaN(met) || met < 0) return '';
    return met / agreed;
  };

  useEffect(() => {
    if (activeTab !== 'ops') return;
    loadOpsRowsFromDb();
  }, [activeTab]);

  const insertOpsSprint = async (payload: any) => {
    const { data, error } = await supabase
      .from('ops_sprints')
      .insert([
        {
          sprint_id: payload?.sprintId ? Number(payload.sprintId) : null,
          sprint: payload?.sprint || null,
          date: payload?.date || null,
          sp_estimate: payload?.spEstimate === '' ? null : payload?.spEstimate,
          sp_done: payload?.spDone === '' ? null : payload?.spDone,
          throughput: payload?.throughput === '' ? null : payload?.throughput,
          bugs_volume: payload?.bugsVolume === '' ? null : payload?.bugsVolume,
          deadlines_agreed: payload?.deadlinesAgreed === '' ? null : payload?.deadlinesAgreed,
          deadlines_met: payload?.deadlinesMet === '' ? null : payload?.deadlinesMet,
          deadline_accuracy: payload?.deadlineAccuracy === '' ? null : payload?.deadlineAccuracy,
          velocity: payload?.velocity === '' ? null : payload?.velocity,
          not_estimated_count: opsNotEstimatedCount == null ? null : Number(opsNotEstimatedCount),
        },
      ])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  };

  const updateOpsSprint = async (id: string, patch: any) => {
    const { data, error } = await supabase
      .from('ops_sprints')
      .update({
        sprint_id: patch?.sprintId ? Number(patch.sprintId) : null,
        sprint: patch?.sprint || null,
        date: patch?.date || null,
        sp_estimate: patch?.spEstimate === '' ? null : patch?.spEstimate,
        sp_done: patch?.spDone === '' ? null : patch?.spDone,
        throughput: patch?.throughput === '' ? null : patch?.throughput,
        bugs_volume: patch?.bugsVolume === '' ? null : patch?.bugsVolume,
        deadlines_agreed: patch?.deadlinesAgreed === '' ? null : patch?.deadlinesAgreed,
        deadlines_met: patch?.deadlinesMet === '' ? null : patch?.deadlinesMet,
        deadline_accuracy: patch?.deadlineAccuracy === '' ? null : patch?.deadlineAccuracy,
        velocity: patch?.velocity === '' ? null : patch?.velocity,
        not_estimated_count: patch?.notEstimatedCount == null ? null : Number(patch.notEstimatedCount),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  };

  const deleteOpsSprint = async (id: string) => {
    const { error } = await supabase.from('ops_sprints').delete().eq('id', id);
    if (error) throw error;
  };

  const loadOpsJiraMetricsForSprint = async (sprintId: number) => {
    try {
      setOpsJiraMetricsLoading(true);
      setOpsCreatingMetricsLoaded(false);
      console.log('[ops] loading Jira metrics for sprint', { sprintId });
      const [bugs, throughput, spDone, spEstimate] = await Promise.all([
        invokeJiraOps({ action: 'bugs', sprintId }),
        invokeJiraOps({ action: 'throughput', sprintId }),
        invokeJiraOps({ action: 'spDone', sprintId }),
        invokeJiraOps({ action: 'spEstimate', sprintId }),
      ]);

      console.log('[ops] Jira metrics response', {
        sprintId,
        bugsTotal: (bugs as any)?.total,
        throughputTotal: (throughput as any)?.total,
        spDone: (spDone as any)?.sum,
        spEstimate: (spEstimate as any)?.sum,
        notEstimatedCount: (spEstimate as any)?.notEstimatedCount,
      });

      setOpsNotEstimatedCount(
        (spEstimate as any)?.notEstimatedCount == null || Number.isNaN(Number((spEstimate as any)?.notEstimatedCount))
          ? null
          : Number((spEstimate as any)?.notEstimatedCount),
      );
      setOpsNotEstimatedList(Array.isArray((spEstimate as any)?.notEstimatedIssues) ? (spEstimate as any).notEstimatedIssues : []);

      const defaultVelocity = computeDefaultVelocity();
      setNewOpsDraft((prev: any) => {
        const next = {
          ...(prev || {}),
          bugsVolume: Number(bugs?.total) || 0,
          throughput: Number(throughput?.total) || 0,
          spDone: (spDone as any)?.sum == null || Number.isNaN(Number((spDone as any)?.sum)) ? '' : Number((spDone as any)?.sum),
          spEstimate:
            (spEstimate as any)?.sum == null || Number.isNaN(Number((spEstimate as any)?.sum)) ? '' : Number((spEstimate as any)?.sum),
        } as any;
        const computedAccuracy = computeDeadlineAccuracy(next.deadlinesAgreed, next.deadlinesMet);
        if (computedAccuracy !== '') next.deadlineAccuracy = computedAccuracy;
        if ((next.velocity === '' || next.velocity == null) && defaultVelocity != null && !Number.isNaN(Number(defaultVelocity))) {
          next.velocity = Number(defaultVelocity);
        }
        return next;
      });

      setOpsCreatingMetricsLoaded(true);
    } catch (e) {
      console.error('Failed to load Jira sprint metrics:', e);
    } finally {
      setOpsJiraMetricsLoading(false);
    }
  };

  const opsRowsSorted = useMemo(() => {
    return [...(opsRows || [])].sort((a: any, b: any) => {
      const ta = new Date(String(a.date || '')).getTime() || 0;
      const tb = new Date(String(b.date || '')).getTime() || 0;
      return tb - ta;
    });
  }, [opsRows]);

  const updateOpsRow = (id: string, patch: any) => {
    setOpsRows((prev: any[]) =>
      prev.map((r: any) => {
        if (String(r.id) !== String(id)) return r;
        const computedPatch = typeof patch === 'function' ? patch(r) : patch;
        return { ...r, ...(computedPatch || {}) };
      }),
    );
  };

  const mockFetchSprintData = () => ({
    spEstimate: null,
    spDone: null,
    throughput: null,
    bugsVolume: null,
    deadlineAccuracy: null,
  });

  const opsChartData = useMemo(() => {
    return (opsRowsSorted || []).slice().reverse().map((r: any) => ({
      name: r.sprint,
      date: r.date,
      Velocity: Number(r.velocity) || 0,
      'SP Done': Number(r.spDone) || 0,
      'SP Estimate': Number(r.spEstimate) || 0,
    }));
  }, [opsRowsSorted]);

  const avgBugsPerSprint = useMemo(() => {
    const rows = (opsRows || []).filter((r: any) => r?.bugsVolume != null && !isNaN(Number(r.bugsVolume)));
    if (rows.length === 0) return null;
    return rows.reduce((acc: number, r: any) => acc + Number(r.bugsVolume), 0) / rows.length;
  }, [opsRows]);

  const avgDeadlineAccuracy = useMemo(() => {
    const rows = (opsRows || []).filter((r: any) => r?.deadlineAccuracy != null && !isNaN(Number(r.deadlineAccuracy)));
    if (rows.length === 0) return null;
    return rows.reduce((acc: number, r: any) => acc + Number(r.deadlineAccuracy), 0) / rows.length;
  }, [opsRows]);

  const parsePtBrNumber = (raw: string) => {
    const s = String(raw || '').trim();
    if (!s) return null;
    const normalized = s.replace(/\./g, '').replace(/,/g, '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  };

  const getLatestAccumulatedValue = (rows: any[], type: string) => {
    const latest = (rows || [])
      .filter((r: any) => r?.type === type && r?.totalValue != null && !isNaN(Number(r.totalValue)))
      .sort((a: any, b: any) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))[0];
    return latest ? Number(latest.totalValue) : 0;
  };

  const handleSaveNsmValue = async () => {
    if (!newNsmId || !newNsmDate || !newNsmValue) return;
    setNsmSaveError('');
    setIsSavingNsm(true);

    try {
      const selected = allNsms.find((n: any) => Number(n.id) === Number(newNsmId));
      const isNumeric = ['number', 'percentage', 'currency'].includes(selected?.type || 'number');

      const valueToSave = isNumeric
        ? (() => {
            const n = parsePtBrNumber(newNsmValue);
            if (n == null) throw new Error('Valor inválido. Use apenas números.');
            return String(n);
          })()
        : newNsmValue;

      await addCollectionNSM({
        nsmId: Number(newNsmId),
        date: newNsmDate,
        value: valueToSave
      });

      setIsNsmModalOpen(false);
      setNewNsmId('');
      setNewNsmValue('');
    } catch (e: any) {
      console.error('Failed to save NSM value:', e);
      setNsmSaveError(e?.message || 'Não foi possível salvar o valor da NSM.');
    } finally {
      setIsSavingNsm(false);
    }
  };

  const allNsms = useMemo(() => {
    const list: any[] = [];
    projects.forEach(p => {
      if (p.NSMs) p.NSMs.forEach(n => list.push({ ...n, projectName: p.name }));
    });
    return list;
  }, [projects]);

  const { okrs } = useAppContext();
  const allOkrs = useMemo(() => okrs || [], [okrs]);

  const availablePeYears = useMemo(() => {
    const years = new Set<number>();
    allOkrs.forEach((o: any) => {
      const y = Number(o.baseYear);
      if (!Number.isNaN(y) && y > 0) years.add(y);
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [allOkrs]);

  useEffect(() => {
    if (!availablePeYears.includes(peYear) && availablePeYears.length > 0) {
      setPeYear(availablePeYears[0]);
    }
  }, [availablePeYears, peYear]);

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
        <button
          onClick={() => setActiveTab('pe')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'pe' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
          }`}
        >
          Indicadores do Planejamento (PE)
        </button>
        <button
          onClick={() => setActiveTab('ops')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'ops' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
          }`}
        >
          Indicadores Operacionais
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

      {activeTab === 'ops' && (
        <>
          <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Indicadores Operacionais</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpsCreatingOpen(true);
                  setNewOpsDraft({
                    date: new Date().toISOString().split('T')[0],
                    sprint: '',
                    sprintId: '',
                    spEstimate: '',
                    spDone: '',
                    throughput: '',
                    bugsVolume: '',
                    deadlinesAgreed: '',
                    deadlinesMet: '',
                    deadlineAccuracy: '',
                    velocity: '',
                  });
                  setOpsNotEstimatedCount(null);
                  setOpsNotEstimatedList([]);
                  setOpsCreatingMetricsLoaded(false);
                  setSelectedOpsId('');
                  setEditingOpsId('new');
                  loadOpsJiraSprints();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors"
              >
                + Nova Sprint
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
            <div className="glass-card rounded-xl p-4 sm:p-[18px_20px] lg:col-span-2">
              <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-4">Evolução por Sprint</div>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[360px]">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={opsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} width={42} />
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-dim)' }} />
                      <Line type="monotone" dataKey="Velocity" stroke="var(--blue)" strokeWidth={2} dot={{ fill: 'var(--blue)', r: 3 }} />
                      <Line type="monotone" dataKey="SP Done" stroke="var(--green)" strokeWidth={2} dot={{ fill: 'var(--green)', r: 3 }} />
                      <Line type="monotone" dataKey="SP Estimate" stroke="var(--yellow)" strokeWidth={2} dot={{ fill: 'var(--yellow)', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[14px]">
              <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
                <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-2">Média de novos bugs / sprint</div>
                <div className="text-[22px] font-extrabold leading-none" style={{ color: 'var(--red)' }}>
                  {avgBugsPerSprint == null ? '—' : avgBugsPerSprint.toFixed(1).replace('.', ',')}
                </div>
                <div className="text-[11px] text-[var(--text-dim)] mt-1.5">Volume médio de bugs reportados por sprint.</div>
              </div>

              <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
                <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-2">Média de assertividade de prazos</div>
                <div className="text-[22px] font-extrabold leading-none" style={{ color: 'var(--green)' }}>
                  {avgDeadlineAccuracy == null ? '—' : `${(avgDeadlineAccuracy * 100).toFixed(1).replace('.', ',')}%`}
                </div>
                <div className="text-[11px] text-[var(--text-dim)] mt-1.5">Percentual médio de assertividade de prazos por sprint.</div>
              </div>

            </div>

            <div className="lg:col-span-3">
              {opsDbError && <div className="text-[12px] text-[var(--red)] mb-3">{opsDbError}</div>}
              {opsDbLoading ? (
                <div className="glass-card rounded-xl p-8 text-[13px] text-[var(--text-dim)] text-center">Carregando sprints…</div>
              ) : (
                <div className="flex flex-col gap-[14px]">
                  {opsRowsSorted.map((r: any) => {
                    const isExpanded = expandedOpsIds.includes(String(r.id));
                    const isSelected = selectedOpsId === String(r.id);
                    const isEditing = editingOpsId === String(r.id);
                    return (
                      <div
                        key={String(r.id)}
                        className={`glass-card rounded-xl p-4 sm:p-[18px_20px] border transition-colors ${
                          isSelected
                            ? 'border-[rgba(56,189,248,0.55)] bg-[rgba(56,189,248,0.12)] ring-2 ring-[rgba(56,189,248,0.35)]'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOpsId(String(r.id));
                              setExpandedOpsIds((prev) =>
                                prev.includes(String(r.id)) ? prev.filter((x) => x !== String(r.id)) : [String(r.id), ...prev],
                              );
                            }}
                            className="min-w-0 text-left flex-1"
                          >
                            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">{r.sprint}</div>
                            <div className="text-[12px] text-[var(--text-dim)] mt-1">
                              {r.date} · SP {r.sp_done ?? r.spDone ?? '—'}/{r.sp_estimate ?? r.spEstimate ?? '—'} · Bugs {r.bugs_volume ?? r.bugsVolume ?? '—'} · Throughput {r.throughput ?? '—'}
                            </div>
                          </button>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setOpsDraftById((prev) => ({ ...(prev || {}), [String(r.id)]: { ...r } }));
                                setSelectedOpsId(String(r.id));
                                setEditingOpsId(String(r.id));
                                setExpandedOpsIds((prev) => (prev.includes(String(r.id)) ? prev : [String(r.id), ...prev]));
                              }}
                              className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Excluir esta sprint?')) return;
                                try {
                                  await deleteOpsSprint(String(r.id));
                                  setOpsRows((prev: any[]) => (prev || []).filter((x: any) => String(x.id) !== String(r.id)));
                                  setExpandedOpsIds((prev) => prev.filter((x) => x !== String(r.id)));
                                  if (selectedOpsId === String(r.id)) setSelectedOpsId('');
                                } catch (e) {
                                  console.error('Failed to delete ops sprint:', e);
                                }
                              }}
                              className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--red)] hover:text-[var(--text)] transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {[
                                { label: 'Data', key: 'date', type: 'date', dbKey: 'date' },
                                { label: 'Sprint', key: 'sprint', type: 'text', dbKey: 'sprint' },
                                { label: 'SP Estimate', key: 'spEstimate', type: 'number', dbKey: 'sp_estimate' },
                                { label: 'SP Done', key: 'spDone', type: 'number', dbKey: 'sp_done' },
                                { label: 'Throuput', key: 'throughput', type: 'number', dbKey: 'throughput' },
                                { label: 'Volume Bugs', key: 'bugsVolume', type: 'number', dbKey: 'bugs_volume' },
                                { label: 'Quantidade Prazos Combinados', key: 'deadlinesAgreed', type: 'number', dbKey: 'deadlines_agreed' },
                                { label: 'Quantidade de Prazos Cumpridos', key: 'deadlinesMet', type: 'number', dbKey: 'deadlines_met' },
                                { label: 'Assertividade de Prazos', key: 'deadlineAccuracy', type: 'number', dbKey: 'deadline_accuracy', readonly: true },
                                { label: 'Velocity', key: 'velocity', type: 'number', dbKey: 'velocity', isVelocity: true },
                              ].map((f) => (
                                <div key={f.key} className="space-y-1.5">
                                  <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">{f.label}</label>
                                  <input
                                    type={f.type}
                                    value={(r as any)[f.dbKey] ?? (r as any)[f.key] ?? ''}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      updateOpsRow(String(r.id), (prev: any) => {
                                        const nextPatch: any = {
                                          [f.dbKey]: f.type === 'number' ? (raw === '' ? '' : Number(raw)) : raw,
                                        };
                                        const agreed = f.dbKey === 'deadlines_agreed' ? nextPatch[f.dbKey] : (prev as any)?.deadlines_agreed;
                                        const met = f.dbKey === 'deadlines_met' ? nextPatch[f.dbKey] : (prev as any)?.deadlines_met;
                                        if (f.dbKey === 'deadlines_agreed' || f.dbKey === 'deadlines_met') {
                                          nextPatch.deadline_accuracy = computeDeadlineAccuracy(agreed, met);
                                        }
                                        return nextPatch;
                                      });
                                    }}
                                    className={`w-full border text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans outline-none transition-colors ${
                                      (f as any).isVelocity
                                        ? 'bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.35)] focus:border-[rgba(245,158,11,0.6)]'
                                        : 'bg-[var(--bg4)] border-[var(--border2)] focus:border-[var(--accent)]'
                                    }`}
                                    disabled={!isEditing || !!(f as any).readonly}
                                  />
                                </div>
                              ))}
                            </div>

                            {isEditing && (
                              <div className="mt-4 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const updated = await updateOpsSprint(String(r.id), {
                                        sprintId: (r as any).sprint_id ?? (r as any).sprintId,
                                        sprint: (r as any).sprint,
                                        date: (r as any).date,
                                        spEstimate: (r as any).sp_estimate ?? (r as any).spEstimate,
                                        spDone: (r as any).sp_done ?? (r as any).spDone,
                                        throughput: (r as any).throughput,
                                        bugsVolume: (r as any).bugs_volume ?? (r as any).bugsVolume,
                                        deadlinesAgreed: (r as any).deadlines_agreed ?? (r as any).deadlinesAgreed,
                                        deadlinesMet: (r as any).deadlines_met ?? (r as any).deadlinesMet,
                                        deadlineAccuracy: (r as any).deadline_accuracy ?? (r as any).deadlineAccuracy,
                                        velocity: (r as any).velocity,
                                        notEstimatedCount: (r as any).not_estimated_count ?? (r as any).notEstimatedCount,
                                      });
                                      setOpsRows((prev: any[]) => (prev || []).map((x: any) => (String(x.id) === String(r.id) ? updated : x)));
                                      setEditingOpsId('');
                                    } catch (e) {
                                      console.error('Failed to update ops sprint:', e);
                                    }
                                  }}
                                  className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors"
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const snapshot = opsDraftById[String(r.id)];
                                    if (snapshot) updateOpsRow(String(r.id), snapshot);
                                    setEditingOpsId('');
                                  }}
                                  className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                  {opsRowsSorted.length === 0 && (
                    <div className="glass-card rounded-xl p-8 text-[13px] text-[var(--text-dim)] text-center">Nenhuma sprint cadastrada.</div>
                  )}
                </div>
              )}
            </div>

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

      {activeTab === 'pe' && (
        <>
          <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Indicadores do Planejamento (PE)</div>
                <div className="text-[12px] text-[var(--text-dim)] mt-1">Cadastre OKRs e acompanhe resultados-chaves com coletas ao longo do ano.</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
                <select
                  value={peYear}
                  onChange={(e) => setPeYear(Number(e.target.value))}
                  className="bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors w-full sm:w-auto"
                >
                  {availablePeYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button
                  onClick={() => setIsOkrModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors w-full sm:w-auto"
                >
                  <Plus size={14} />
                  Adicionar OKR
                </button>
              </div>
            </div>
          </div>

          {allOkrs.filter((o: any) => Number(o.baseYear) === peYear).length === 0 ? (
            <div className="glass-card rounded-xl text-center p-12 text-[var(--text-dim)]">
              <div className="text-[15px] text-[var(--text-mid)] font-semibold">Sem OKRs para {peYear}</div>
              <div className="text-[13px] mt-2">Clique em “Adicionar OKR” para começar.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-[14px]">
              {allOkrs
                .filter((o: any) => Number(o.baseYear) === peYear)
                .map((okr: any) => (
                  <ObjectiveCard
                    key={okr.id}
                    okr={okr}
                    onAddKr={async () => {
                      const name = prompt('Nome do Resultado-Chave');
                      if (!name) return;
                      await addOkrKeyResult({ okrId: okr.id, name });
                    }}
                    onDeleteObjective={async () => {
                      if (!confirm('Excluir este objetivo (OKR) e todos os seus KRs/coletas?')) return;
                      await deleteOKR(okr.id);
                    }}
                    onEditKr={(kr: any) => setEditingKr(kr)}
                    onCollectKr={(kr: any) => setCollectingKr(kr)}
                    onDeleteKr={async (kr: any) => {
                      if (!confirm('Excluir este Resultado-Chave (KR) e todas as coletas?')) return;
                      await deleteOkrKeyResult(kr.id);
                    }}
                    onDeleteKrCollection={async (collectionId: number) => {
                      if (!confirm('Excluir esta coleta?')) return;
                      await deleteCollectionOkrKeyResult(collectionId);
                    }}
                  />
                ))}
            </div>
          )}
        </>
      )}

      {isNsmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div>
                <h3 className="font-semibold text-[var(--text)]">Adicionar Valor NSM</h3>
                <div className="text-[12px] text-[var(--text-dim)] mt-0.5">Selecione uma NSM e registre o valor.</div>
              </div>
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
              {nsmSaveError && (
                <div className="text-[12px] text-[var(--red)]">{nsmSaveError}</div>
              )}
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setIsNsmModalOpen(false)} className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Cancelar</button>
                <button
                  disabled={isSavingNsm}
                  className={`px-4 py-2 rounded-md text-xs font-semibold text-white transition-opacity ${
                    isSavingNsm ? 'bg-[var(--accent)] opacity-60 cursor-not-allowed' : 'bg-[var(--accent)] hover:opacity-90'
                  }`}
                  onClick={handleSaveNsmValue}
                >
                  {isSavingNsm ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {opsNotEstimatedOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-[820px] overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div>
                <h3 className="font-semibold text-[var(--text)]">Itens sem estimativa</h3>
              </div>
              <button
                onClick={() => setOpsNotEstimatedOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-[12px] text-left">
                  <thead className="text-[var(--text-dim)] sticky top-0 bg-[var(--bg3)]">
                    <tr>
                      <th className="py-2 px-2 font-medium">Key</th>
                      <th className="py-2 px-2 font-medium">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(opsNotEstimatedList || []).map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 font-mono text-[var(--text)]">{String(it?.key || '—')}</td>
                        <td className="py-2 px-2 text-[var(--text-mid)]">{String(it?.summary || '—')}</td>
                      </tr>
                    ))}
                    {(opsNotEstimatedList || []).length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-6 text-center text-[var(--text-dim)]">
                          Nenhum item sem estimativa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setOpsNotEstimatedOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {opsCreatingOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-[920px] overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div>
                <h3 className="font-semibold text-[var(--text)]">Nova Sprint</h3>
                <div className="text-[12px] text-[var(--text-dim)] mt-0.5">Selecione a sprint para carregar os dados.</div>
              </div>
              <button
                onClick={() => {
                  setOpsCreatingOpen(false);
                  setEditingOpsId('');
                }}
                className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Sprint</label>
                <select
                  value={String(newOpsDraft?.sprintId ?? '')}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    const selected = (opsJiraSprints || []).find((s: any) => String(s?.id) === String(nextId));
                    setNewOpsDraft((prev: any) => ({
                      ...(prev || {}),
                      sprintId: nextId,
                      sprint: selected?.name ? String(selected.name) : '',
                    }));
                    setOpsCreatingMetricsLoaded(false);
                    const idNum = Number(nextId);
                    if (!Number.isNaN(idNum) && idNum > 0) {
                      loadOpsJiraMetricsForSprint(idNum);
                    }
                  }}
                  className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
                  disabled={opsJiraSprintsLoading || opsJiraMetricsLoading}
                >
                  <option value="">{opsJiraSprintsLoading ? 'Carregando…' : 'Selecione uma sprint…'}</option>
                  {(opsJiraSprints || []).map((s: any) => (
                    <option key={String(s?.id)} value={String(s?.id)}>
                      {String(s?.name || '')} | {String(s?.state || '')}
                    </option>
                  ))}
                </select>
                {opsJiraSprintsError && <div className="text-[12px] text-[var(--red)] mt-2">{opsJiraSprintsError}</div>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Data', key: 'date', type: 'date' },
                  { label: 'SP Estimate', key: 'spEstimate', type: 'number' },
                  { label: 'SP Done', key: 'spDone', type: 'number' },
                  { label: 'Throuput', key: 'throughput', type: 'number' },
                  { label: 'Volume Bugs', key: 'bugsVolume', type: 'number' },
                  { label: 'Quantidade Prazos Combinados', key: 'deadlinesAgreed', type: 'number' },
                  { label: 'Quantidade de Prazos Cumpridos', key: 'deadlinesMet', type: 'number' },
                  { label: 'Assertividade de Prazos', key: 'deadlineAccuracy', type: 'number', readonly: true },
                ].map((f: any) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">{f.label}</label>
                    <input
                      type={f.type}
                      value={newOpsDraft?.[f.key] ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setNewOpsDraft((prev: any) => {
                          const next = {
                            ...(prev || {}),
                            [f.key]: f.type === 'number' ? (raw === '' ? '' : Number(raw)) : raw,
                          } as any;
                          if (f.key === 'deadlinesAgreed' || f.key === 'deadlinesMet') {
                            next.deadlineAccuracy = computeDeadlineAccuracy(next.deadlinesAgreed, next.deadlinesMet);
                          }
                          return next;
                        });
                      }}
                      className={`w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors ${
                        f.readonly ? 'opacity-90' : ''
                      }`}
                      disabled={opsJiraMetricsLoading || !opsCreatingMetricsLoaded || !!f.readonly}
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Velocity</label>
                  <input
                    type="number"
                    value={newOpsDraft?.velocity ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setNewOpsDraft((prev: any) => ({
                        ...(prev || {}),
                        velocity: raw === '' ? '' : Number(raw),
                      }));
                    }}
                    className="w-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.35)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[rgba(245,158,11,0.6)] outline-none transition-colors"
                    disabled={opsJiraMetricsLoading || !opsCreatingMetricsLoaded}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpsNotEstimatedOpen(true)}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-[rgba(245,158,11,0.18)] text-[var(--yellow)] hover:bg-[rgba(245,158,11,0.24)] transition-colors"
                  disabled={!opsNotEstimatedCount || opsNotEstimatedCount <= 0}
                >
                  Total não estimado
                </button>
                <button
                  onClick={() => {
                    setOpsCreatingOpen(false);
                    setEditingOpsId('');
                  }}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={opsJiraMetricsLoading || !opsCreatingMetricsLoaded || !newOpsDraft?.sprintId}
                  className={`px-4 py-2 rounded-md text-xs font-semibold text-white transition-opacity ${
                    opsJiraMetricsLoading || !opsCreatingMetricsLoaded || !newOpsDraft?.sprintId
                      ? 'bg-[var(--accent)] opacity-60 cursor-not-allowed'
                      : 'bg-[var(--accent)] hover:opacity-90'
                  }`}
                  onClick={async () => {
                    try {
                      setOpsDbLoading(true);
                      const created = await insertOpsSprint(newOpsDraft);
                      setOpsRows((prev: any[]) => [created, ...(prev || [])]);
                      setOpsCreatingOpen(false);
                      setExpandedOpsIds((prev) => (prev.includes(String(created.id)) ? prev : [String(created.id), ...prev]));
                      setSelectedOpsId(String(created.id));
                      setEditingOpsId('');
                    } catch (e: any) {
                      console.error('Failed to create ops sprint:', e);
                      setOpsDbError(e?.message || 'Falha ao salvar a sprint.');
                    } finally {
                      setOpsDbLoading(false);
                    }
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOkrModalOpen && (
        <OkrCreateModal
          defaultYear={peYear}
          onClose={() => setIsOkrModalOpen(false)}
          onSave={async (payload) => {
            const okr = await addOKR(payload);
            for (const krName of payload.keyResults) {
              await addOkrKeyResult({ okrId: okr.id, name: krName });
            }
            setIsOkrModalOpen(false);
          }}
        />
      )}

      {editingKr && (
        <KeyResultEditModal
          kr={editingKr}
          onClose={() => setEditingKr(null)}
          onSave={async (data) => {
            await updateOkrKeyResult(editingKr.id, data);
            setEditingKr(null);
          }}
        />
      )}

      {collectingKr && (
        <KeyResultCollectModal
          kr={collectingKr}
          onClose={() => setCollectingKr(null)}
          onSave={async (data) => {
            await addCollectionOkrKeyResult({ okrKeyResultId: collectingKr.id, ...data });
            setCollectingKr(null);
          }}
        />
      )}

    </div>
  );
}

function OkrCreateModal({ defaultYear, onClose, onSave }: { defaultYear: number; onClose: () => void; onSave: (payload: any) => Promise<void> }) {
  const [objectiveName, setObjectiveName] = useState('');
  const [baseYear, setBaseYear] = useState<number>(defaultYear);
  const [keyResults, setKeyResults] = useState<string[]>(['']);

  const canSave = objectiveName.trim().length > 0 && keyResults.some(k => k.trim().length > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-[820px] overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--text)]">Novo OKR</h3>
            <div className="text-[12px] text-[var(--text-dim)] mt-0.5">Defina o objetivo e um ou mais resultados-chaves.</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Ano base</label>
            <input
              type="number"
              value={baseYear}
              onChange={(e) => setBaseYear(Number(e.target.value))}
              className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Nome do Objetivo</label>
            <input
              value={objectiveName}
              onChange={(e) => setObjectiveName(e.target.value)}
              className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
              placeholder="Ex: Aumentar eficiência operacional"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Resultados-Chaves</label>
              <button
                onClick={() => setKeyResults([...keyResults, ''])}
                className="text-xs font-semibold text-[var(--accent)] hover:opacity-80"
              >
                + Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {keyResults.map((kr, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={kr}
                    onChange={(e) => setKeyResults(keyResults.map((k, i) => i === idx ? e.target.value : k))}
                    className="flex-1 bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
                    placeholder={`KR ${idx + 1} (ex: Reduzir tempo de entrega em 20%)`}
                  />
                  <button
                    onClick={() => setKeyResults(keyResults.filter((_, i) => i !== idx))}
                    disabled={keyResults.length === 1}
                    className="px-3 py-2.5 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--red)] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Cancelar</button>
            <button
              disabled={!canSave}
              onClick={() => onSave({ baseYear, objectiveName, keyResults: keyResults.map(k => k.trim()).filter(Boolean) })}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${canSave ? 'bg-[var(--accent)] text-white hover:bg-[#33ddff]' : 'bg-[var(--bg4)] text-[var(--text-dim)] opacity-60 cursor-not-allowed'}`}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyResultEditModal({ kr, onClose, onSave }: { kr: any; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [name, setName] = useState(kr?.name || '');
  const [calcMemory, setCalcMemory] = useState(kr?.calcMemory || '');
  const [source, setSource] = useState(kr?.source || '');
  const [globalTarget, setGlobalTarget] = useState(kr?.globalTarget ?? '');

  const canSave = name.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-[820px] overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--text)]">Editar Resultado-Chave</h3>
            <div className="text-[12px] text-[var(--text-dim)] mt-0.5 truncate">{kr?.name}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Nome do Resultado-Chave</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Meta Global (final do ano)</label>
              <input type="number" value={globalTarget} onChange={(e) => setGlobalTarget(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Fonte da Informação</label>
              <input value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" placeholder="Ex: PowerBI, GA4, ERP" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Memória do Cálculo</label>
            <textarea value={calcMemory} onChange={(e) => setCalcMemory(e.target.value)} className="w-full min-h-[120px] bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" placeholder="Descreva como o indicador é calculado" />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Cancelar</button>
            <button
              disabled={!canSave}
              onClick={() => onSave({ name, calcMemory, source, globalTarget: globalTarget === '' ? null : Number(globalTarget) })}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${canSave ? 'bg-[var(--accent)] text-white hover:bg-[#33ddff]' : 'bg-[var(--bg4)] text-[var(--text-dim)] opacity-60 cursor-not-allowed'}`}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyResultCollectModal({ kr, onClose, onSave }: { kr: any; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetAtDate, setTargetAtDate] = useState('');
  const [valueObtained, setValueObtained] = useState('');
  const [observation, setObservation] = useState('');

  const canSave = date && targetAtDate !== '' && valueObtained !== '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-[820px] overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--text)]">Nova Coleta — Resultado-Chave</h3>
            <div className="text-[12px] text-[var(--text-dim)] mt-0.5 truncate">{kr?.name}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Data da Coleta</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Meta na Coleta</label>
              <input type="number" value={targetAtDate} onChange={(e) => setTargetAtDate(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Valor Obtido</label>
              <input type="number" value={valueObtained} onChange={(e) => setValueObtained(e.target.value)} className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Observação</label>
            <textarea value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full min-h-[110px] bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors" placeholder="Contexto, exceções, evidências, etc." />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Cancelar</button>
            <button
              disabled={!canSave}
              onClick={() => onSave({ date, targetAtDate: Number(targetAtDate), valueObtained: Number(valueObtained), observation })}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${canSave ? 'bg-[var(--accent)] text-white hover:bg-[#33ddff]' : 'bg-[var(--bg4)] text-[var(--text-dim)] opacity-60 cursor-not-allowed'}`}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ObjectiveCard({
  okr,
  onAddKr,
  onDeleteObjective,
  onEditKr,
  onCollectKr,
  onDeleteKr,
  onDeleteKrCollection
}: {
  okr: any;
  onAddKr: () => Promise<void>;
  onDeleteObjective: () => Promise<void>;
  onEditKr: (kr: any) => void;
  onCollectKr: (kr: any) => void;
  onDeleteKr: (kr: any) => Promise<void>;
  onDeleteKrCollection: (collectionId: number) => Promise<void>;
  key?: any;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const krCount = (okr?.KeyResults || []).length;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Objetivo</div>
          <div className="text-[15px] font-bold text-[var(--text)] mt-1 break-words">{okr.objectiveName}</div>
          <div className="text-[12px] text-[var(--text-dim)] mt-1">Ano base: {okr.baseYear} · {krCount} KR(s)</div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
          >
            {collapsed ? 'Expandir' : 'Recolher'}
          </button>
          <button
            onClick={onDeleteObjective}
            className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--red)] hover:opacity-80 transition-opacity"
          >
            Excluir
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mt-4 flex justify-end">
            <button
              className="bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans hover:opacity-80 transition-opacity"
              onClick={onAddKr}
            >
              <span className="inline-flex items-center gap-2"><Plus size={14} />Adicionar KR</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
            {(okr.KeyResults || []).map((kr: any) => (
              <KeyResultCard
                key={kr.id}
                kr={kr}
                onEdit={() => onEditKr(kr)}
                onCollect={() => onCollectKr(kr)}
                onDeleteKr={() => onDeleteKr(kr)}
                onDeleteCollection={onDeleteKrCollection}
              />
            ))}
            {(okr.KeyResults || []).length === 0 && (
              <div className="glass-card rounded-lg p-8 text-center text-[13px] text-[var(--text-dim)]">
                Nenhum resultado-chave ainda.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KeyResultCard({
  kr,
  onEdit,
  onCollect,
  onDeleteKr,
  onDeleteCollection
}: {
  kr: any;
  onEdit: () => void;
  onCollect: () => void;
  onDeleteKr?: () => void;
  onDeleteCollection?: (collectionId: number) => void;
  key?: any;
}) {
  const [expanded, setExpanded] = useState(true);
  const cols = kr?.Collections || [];
  const sortedDesc = [...cols].sort((a: any, b: any) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  const sortedAsc = [...cols].sort((a: any, b: any) => (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0));

  const chartData = sortedAsc.map((c: any) => ({
    date: c.date && !isNaN(new Date(c.date).getTime())
      ? format(new Date(c.date.split('T')[0] + 'T12:00:00Z'), 'dd/MM/yy', { locale: ptBR })
      : '-',
    Meta: Number(c.targetAtDate) || 0,
    Obtido: Number(c.valueObtained) || 0
  }));

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-[var(--text)] break-words">{kr?.name}</div>
          <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mt-1">Meta global: {kr?.globalTarget ?? '—'}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="px-2 py-1 bg-[var(--bg4)] border border-[var(--border2)] rounded-md text-[11px] font-medium text-[var(--text3)] hover:text-[var(--text2)]">
            {expanded ? 'Recolher' : 'Expandir'}
          </button>
          <button onClick={onEdit} className="px-2 py-1 bg-[var(--bg4)] border border-[var(--border2)] rounded-md text-[11px] font-medium text-[var(--accent)] hover:opacity-80">
            Editar
          </button>
          <button onClick={onCollect} className="px-2 py-1 bg-[var(--green)] text-white rounded-md text-[11px] font-bold hover:opacity-80">
            Coletar
          </button>
          {onDeleteKr && (
            <button onClick={onDeleteKr} className="px-2 py-1 bg-[var(--bg4)] border border-[var(--border2)] rounded-md text-[11px] font-medium text-[var(--red)] hover:opacity-80">
              Excluir
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="h-[180px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--text-dim)",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Line type="monotone" dataKey="Obtido" stroke="var(--green)" strokeWidth={2} dot={{fill:"var(--green)",r:3}}/>
                  <Line type="monotone" dataKey="Meta" stroke="var(--yellow)" strokeWidth={2} strokeDasharray="4 3" dot={{fill:"var(--yellow)",r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[11px] text-[var(--text-dim)]">Sem coletas</div>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border)]">
            <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-2">Analítico (mais recente primeiro)</div>
            {sortedDesc.length === 0 ? (
              <div className="text-[11px] text-[var(--text-dim)]">Nenhuma coleta registrada.</div>
            ) : (
              <div className="max-h-[160px] overflow-y-auto">
                <table className="w-full text-[10px] text-left">
                  <thead className="text-[var(--text-dim)] sticky top-0 bg-[var(--bg3)]">
                    <tr>
                      <th className="py-1 font-medium">Data</th>
                      <th className="py-1 font-medium text-right">Meta</th>
                      <th className="py-1 font-medium text-right">Obtido</th>
                      <th className="py-1 font-medium">Obs.</th>
                      <th className="py-1 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {sortedDesc.map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-1 text-[var(--text-mid)]">
                          {c.date && !isNaN(new Date(c.date.split('T')[0] + 'T12:00:00Z').getTime())
                            ? format(new Date(c.date.split('T')[0] + 'T12:00:00Z'), 'dd/MM/yy', { locale: ptBR })
                            : '-'}
                        </td>
                        <td className="py-1 text-right font-mono text-[var(--text)]">{Number(c.targetAtDate).toLocaleString()}</td>
                        <td className="py-1 text-right font-mono text-[var(--text)]">{Number(c.valueObtained).toLocaleString()}</td>
                        <td className="py-1 text-[var(--text-mid)] truncate max-w-[160px]" title={c.observation || ''}>{c.observation || '—'}</td>
                        <td className="py-1 text-right">
                          {onDeleteCollection && (
                            <button
                              type="button"
                              onClick={() => onDeleteCollection(c.id)}
                              className="text-[var(--red)] hover:opacity-80 transition-opacity"
                              title="Excluir coleta"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
