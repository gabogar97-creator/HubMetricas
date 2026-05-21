import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

export function InvestmentMap() {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<'roi' | 'receita' | 'saving' | 'custo_evitado' | 'investimento'>('roi');

  const fmtCurrency = (n: number | null) => n == null || isNaN(n) ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

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

    const children = areas
      .map((a) => ({
        id: a.id,
        name: a.name,
        value: Math.max(0, getValue(a)),
        investment: a.investment,
        roiTotal: a.roiTotal,
        receita: a.receita,
        saving: a.saving,
        custoEvitado: a.custoEvitado,
      }))
      .sort((x, y) => (y.value || 0) - (x.value || 0));

    return [{ name: 'Mapa de Investimento', children }];
  }, [areas, metric]);

  return (
    <div className="flex flex-col gap-[18px] animate-[fadeIn_0.2s_ease]">
      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Mapa de Investimento</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">Treemap por área · selecione a métrica para recalcular o mapa.</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/queue')}
            className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
          >
            Abrir Fila de Priorização
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
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
                onClick={(node: any) => {
                  if (node?.id) navigate('/queue');
                }}
              />
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[11px] text-[var(--text-dim)]">Dica: clique em qualquer área do Treemap para abrir a Fila de Priorização.</div>
        </div>

        <Tooltip
          content={({ active, payload }: any) => {
            if (!active || !payload || payload.length === 0) return null;
            const p = payload[0]?.payload;
            if (!p || !p.name) return null;
            const value = Number(p.value) || 0;

            return (
              <div className="glass-card rounded-xl p-3" style={{ border: '1px solid rgba(56,189,248,0.32)', boxShadow: '0 26px 80px rgba(0,0,0,0.65)' }}>
                <div className="text-[10px] text-[rgba(56,189,248,0.95)] font-bold uppercase tracking-[0.07em]">{p.name}</div>
                <div className="mt-2 text-[12px] text-[var(--text)] font-extrabold">{metricLabel}: <span className="text-[rgba(56,189,248,0.95)]">{fmtCurrency(value)}</span></div>
                <div className="mt-2 text-[11px] text-[var(--text-dim)]">
                  Investimento: <span className="font-bold" style={{ color: 'var(--red)' }}>{fmtCurrency(Number(p.investment) || 0)}</span>
                  <br />
                  ROI: <span className="font-bold" style={{ color: 'var(--green)' }}>{fmtCurrency(Number(p.roiTotal) || 0)}</span>
                  <br />
                  Receita: <span className="font-bold" style={{ color: 'var(--receita)' }}>{fmtCurrency(Number(p.receita) || 0)}</span>
                  <br />
                  Saving: <span className="font-bold" style={{ color: 'var(--saving)' }}>{fmtCurrency(Number(p.saving) || 0)}</span>
                  <br />
                  Custo Evitado: <span className="font-bold" style={{ color: 'var(--custo-evitado)' }}>{fmtCurrency(Number(p.custoEvitado) || 0)}</span>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
