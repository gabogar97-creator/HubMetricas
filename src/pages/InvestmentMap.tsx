import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, Treemap } from 'recharts';
import { supabase } from '../lib/supabase';

export function InvestmentMap() {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<'roi' | 'receita' | 'saving' | 'custo_evitado' | 'investimento'>('roi');
  const [selectedBu, setSelectedBu] = useState<string>('');
  const [availableBus, setAvailableBus] = useState<string[]>([]);

  const fmtCurrency = (n: number | null) => n == null || isNaN(n) ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const asText = (v: any, fallback = '—') => {
    if (v == null) return fallback;
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') {
      if (typeof (v as any).value === 'string') return (v as any).value;
      if (typeof (v as any).name === 'string') return (v as any).name;
      if (typeof (v as any).text === 'string') return (v as any).text;
      try {
        return JSON.stringify(v);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  useEffect(() => {
    let canceled = false;

    const loadBus = async () => {
      try {
        const envJiraEmail = import.meta.env.VITE_JIRA_EMAIL as string | undefined;
        const envJiraToken = import.meta.env.VITE_JIRA_API_TOKEN as string | undefined;

        const load = async (listType: 'to_prioritize' | 'prioritized') => {
          const { data, error } = await supabase.functions.invoke('jira-prioritization-epics', {
            body: {
              ...(envJiraEmail && envJiraToken ? { jiraEmail: envJiraEmail, jiraApiToken: envJiraToken } : {}),
              listType,
            },
          });
          if (error) throw new Error(error.message || 'Falha ao consultar Jira.');
          return ((data as any)?.issues || []) as any[];
        };

        const [toPrioritize, prioritized] = await Promise.all([
          load('to_prioritize'),
          load('prioritized'),
        ]);

        const bus = new Set<string>();
        [...toPrioritize, ...prioritized].forEach((i: any) => {
          const bu = asText(i?.customfield_10851, '');
          if (bu && bu !== '—') bus.add(bu);
        });

        const list = Array.from(bus).sort();
        if (!canceled) setAvailableBus(list);
      } catch {
        if (!canceled) setAvailableBus([]);
      }
    };

    loadBus();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedBu) return;
    if (availableBus.includes(selectedBu)) return;
    setSelectedBu('');
  }, [availableBus, selectedBu]);

  const areas = useMemo(() => {
    return [
      {
        id: 'dev_prod',
        name: 'Desenvolvimento / Produto',
        investment: 520000,
        roiTotal: 1130000,
        receita: 680000,
        saving: 260000,
        custoEvitado: 190000,
      },
      {
        id: 'marketing',
        name: 'Marketing',
        investment: 180000,
        roiTotal: 410000,
        receita: 320000,
        saving: 65000,
        custoEvitado: 25000,
      },
      {
        id: 'comercial',
        name: 'Comercial',
        investment: 240000,
        roiTotal: 860000,
        receita: 820000,
        saving: 25000,
        custoEvitado: 15000,
      },
      {
        id: 'cx_impl',
        name: 'Experiência do Cliente / Implantação',
        investment: 210000,
        roiTotal: 520000,
        receita: 120000,
        saving: 210000,
        custoEvitado: 190000,
      },
      {
        id: 'cs',
        name: 'Relacionamento e Saúde do Cliente',
        investment: 190000,
        roiTotal: 610000,
        receita: 240000,
        saving: 250000,
        custoEvitado: 120000,
      },
      {
        id: 'adm',
        name: 'Adminsitrativo',
        investment: 140000,
        roiTotal: 380000,
        receita: 70000,
        saving: 210000,
        custoEvitado: 100000,
      },
      {
        id: 'legal',
        name: 'Jurídico',
        investment: 90000,
        roiTotal: 220000,
        receita: 40000,
        saving: 120000,
        custoEvitado: 60000,
      },
      {
        id: 'rh',
        name: 'Recursos Humanos',
        investment: 110000,
        roiTotal: 260000,
        receita: 45000,
        saving: 170000,
        custoEvitado: 45000,
      },
      {
        id: 'infra',
        name: 'Infraestrutura',
        investment: 160000,
        roiTotal: 350000,
        receita: 55000,
        saving: 235000,
        custoEvitado: 60000,
      },
    ];
  }, []);

  const areasWithBu = useMemo(() => {
    if (!availableBus || availableBus.length === 0) return areas.map((a) => ({ ...a, bu: '' }));
    return areas.map((a, idx) => ({
      ...a,
      bu: availableBus[idx % availableBus.length],
    }));
  }, [areas, availableBus]);

  const metricLabel = useMemo(() => {
    if (metric === 'roi') return 'ROI geral';
    if (metric === 'receita') return 'Receita';
    if (metric === 'saving') return 'Saving';
    if (metric === 'custo_evitado') return 'Custo evitado';
    return 'Investimento alocado';
  }, [metric]);

  const treemapData = useMemo(() => {
    const getValue = (a: any) => {
      if (metric === 'roi') return Number(a.roiTotal) || 0;
      if (metric === 'receita') return Number(a.receita) || 0;
      if (metric === 'saving') return Number(a.saving) || 0;
      if (metric === 'custo_evitado') return Number(a.custoEvitado) || 0;
      return Number(a.investment) || 0;
    };

    const palette = [
      '#22c55e', // green
      '#16a34a', // green (variant)
      '#38bdf8', // blue
      '#60a5fa', // blue (variant)
      '#ef4444', // red
      '#dc2626', // red (variant)
      '#f59e0b', // yellow
      '#eab308', // yellow (variant)
      '#f97316', // orange
      '#fb923c', // orange (variant)
      '#a78bfa', // purple
      '#8b5cf6', // purple (variant)
      '#e879f9', // pink
      '#f472b6', // pink (variant)
      '#a16207', // brown
      '#854d0e', // brown (variant)
      '#14b8a6', // teal
      '#0ea5e9', // sky
    ];

    const base = selectedBu
      ? areasWithBu.filter((a: any) => String(a?.bu || '') === selectedBu)
      : areasWithBu;

    const children = base
      .map((a) => ({
        id: a.id,
        name: a.name,
        value: Math.max(0, getValue(a)),
        color: palette[Math.abs(String(a.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % palette.length],
        bu: a.bu,
        investment: a.investment,
        roiTotal: a.roiTotal,
        receita: a.receita,
        saving: a.saving,
        custoEvitado: a.custoEvitado,
      }))
      .sort((x, y) => (y.value || 0) - (x.value || 0));

    return [{ name: 'Mapa de Investimento', children }];
  }, [areasWithBu, metric, selectedBu]);

  const TreemapContent = ({ x, y, width, height, name, payload }: any) => {
    if (width <= 0 || height <= 0) return null;

    const c = payload?.color || 'rgba(56,189,248,0.25)';
    const showText = width > 90 && height > 54;
    const showLines = width > 140 && height > 86;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={14}
          ry={14}
          style={{
            fill: c,
            fillOpacity: 0.22,
            stroke: 'rgba(255,255,255,0.12)',
            strokeWidth: 1,
          }}
        />
        <rect
          x={x + 1}
          y={y + 1}
          width={Math.max(0, width - 2)}
          height={Math.max(0, height - 2)}
          rx={13}
          ry={13}
          style={{
            fill: 'rgba(0,0,0,0.10)',
            stroke: 'rgba(255,255,255,0.08)',
            strokeWidth: 1,
          }}
        />

        {showText && (
          <text x={x + 12} y={y + 20} fill="rgba(255,255,255,0.92)" fontSize={12} fontWeight={800}>
            {String(name || '').slice(0, 40)}
          </text>
        )}

        {showLines && (
          <>
            <text x={x + 12} y={y + 42} fill="rgba(255,255,255,0.85)" fontSize={11} fontWeight={700}>
              Inv: {fmtCurrency(Number(payload?.investment) || 0)}
            </text>
            <text x={x + 12} y={y + 60} fill="rgba(255,255,255,0.85)" fontSize={11} fontWeight={700}>
              ROI: {fmtCurrency(Number(payload?.roiTotal) || 0)}
            </text>
            <text x={x + 12} y={y + 78} fill="rgba(255,255,255,0.78)" fontSize={10} fontWeight={700}>
              Saving: {fmtCurrency(Number(payload?.saving) || 0)}
            </text>
            <text x={x + 12} y={y + 94} fill="rgba(255,255,255,0.78)" fontSize={10} fontWeight={700}>
              C. Evitado: {fmtCurrency(Number(payload?.custoEvitado) || 0)}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-[18px] animate-[fadeIn_0.2s_ease]">
      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Mapa de Investimento</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">Treemap por área · selecione a métrica para recalcular o mapa.</div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
          <div className="lg:col-span-2">
            <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em] mb-1">BU</div>
            <select
              value={selectedBu}
              onChange={(e) => setSelectedBu(e.target.value)}
              className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
            >
              <option value="">Todas</option>
              {availableBus.map((bu) => (
                <option key={bu} value={bu}>{bu}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="text-[11px] text-[var(--text-dim)]">Usa a mesma lista de BUs da Fila de Priorização (Jira).</div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Métrica</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">Visualizando: <span className="text-[var(--text)] font-bold">{metricLabel}</span></div>
          </div>
          <div className="flex gap-1 bg-[var(--bg4)] p-1 rounded-lg w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setMetric('roi')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                metric === 'roi' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
            >
              ROI geral
            </button>
            <button
              type="button"
              onClick={() => setMetric('receita')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                metric === 'receita' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setMetric('saving')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                metric === 'saving' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
            >
              Saving
            </button>
            <button
              type="button"
              onClick={() => setMetric('custo_evitado')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                metric === 'custo_evitado' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
            >
              Custo evitado
            </button>
            <button
              type="button"
              onClick={() => setMetric('investimento')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                metric === 'investimento' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
            >
              Investimento alocado
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.14))',
            boxShadow: '0 30px 110px rgba(0,0,0,0.45)',
          }}
        >
          <div className="h-[520px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="value"
                nameKey="name"
                stroke="rgba(255,255,255,0.10)"
                fill="rgba(56,189,248,0.18)"
                aspectRatio={4 / 3}
                animationDuration={350}
                animationEasing="ease"
                content={<TreemapContent />}
              />
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
