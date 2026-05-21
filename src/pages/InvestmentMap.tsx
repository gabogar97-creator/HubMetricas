import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function InvestmentMap() {
  const navigate = useNavigate();
  const [selectedQuadrantId, setSelectedQuadrantId] = useState<string | null>(null);

  const fmtCurrency = (n: number | null) => n == null || isNaN(n) ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const quadrants = useMemo(() => {
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

  const selectedQuadrant = useMemo(
    () => quadrants.find((q) => q.id === selectedQuadrantId) || null,
    [quadrants, selectedQuadrantId]
  );

  return (
    <div className="flex flex-col gap-[18px] animate-[fadeIn_0.2s_ease]">
      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Mapa de Investimento</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">Clique em um quadrante para visualizar o investimento e a quebra do ROI.</div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 sm:p-[18px_20px] border border-[var(--border)]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Planta Arquitetural</div>
                <div className="text-[12px] text-[var(--text-dim)] mt-1">9 quadrantes · clique para selecionar</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuadrantId(null)}
                className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
              >
                Limpar seleção
              </button>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.14))',
                boxShadow: '0 30px 110px rgba(0,0,0,0.45)',
              }}
            >
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {quadrants.map((q) => {
                    const selected = q.id === selectedQuadrantId;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelectedQuadrantId(q.id)}
                        className="text-left rounded-2xl transition-all duration-200"
                        style={{
                          border: selected ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.10)',
                          background: selected
                            ? 'linear-gradient(180deg, rgba(56,189,248,0.18), rgba(56,189,248,0.06))'
                            : 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                          boxShadow: selected ? '0 18px 44px rgba(56,189,248,0.12)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                          transform: selected ? 'translateY(-1px) scale(1.01)' : 'translateY(0px) scale(1)',
                        }}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-[var(--text)] leading-snug line-clamp-2">{q.name}</div>
                              <div className="text-[10px] text-[var(--text-dim)] mt-1">Clique para ver detalhes</div>
                            </div>
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                              style={{ background: selected ? 'rgba(56,189,248,0.95)' : 'rgba(255,255,255,0.20)' }}
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div
                                key={i}
                                className="rounded-md"
                                style={{
                                  height: 14,
                                  background: selected
                                    ? 'linear-gradient(180deg, rgba(191,219,254,0.55), rgba(56,189,248,0.08))'
                                    : 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.12))',
                                  border: selected ? '1px solid rgba(56,189,248,0.18)' : '1px solid rgba(255,255,255,0.10)',
                                }}
                              />
                            ))}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div
                              className="h-[10px] flex-1 rounded-full"
                              style={{
                                background: selected
                                  ? 'linear-gradient(90deg, rgba(56,189,248,0.95), rgba(147,197,253,0.10))'
                                  : 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-[18px_20px] border border-[var(--border)]">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Detalhes do Quadrante</div>

            {!selectedQuadrant ? (
              <div className="mt-3 text-[13px] text-[var(--text-dim)]">
                Selecione um quadrante na planta para visualizar investimento e ROI.
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-[14px] font-extrabold text-[var(--text)]">{selectedQuadrant.name}</div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-3">
                    <div className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">Investimento Estimado</div>
                    <div className="text-[18px] font-extrabold text-[var(--red)] mt-1">{fmtCurrency(selectedQuadrant.investment)}</div>
                  </div>
                  <div className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-3">
                    <div className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">ROI Estimado (Total)</div>
                    <div className="text-[18px] font-extrabold text-[var(--green)] mt-1">{fmtCurrency(selectedQuadrant.roiTotal)}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-3">
                  <div className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">Quebra do ROI</div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-2">
                      <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">Receita</div>
                      <div className="text-[12px] font-extrabold mt-1" style={{ color: 'var(--receita)' }}>{fmtCurrency(selectedQuadrant.receita)}</div>
                    </div>
                    <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-2">
                      <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">Saving</div>
                      <div className="text-[12px] font-extrabold mt-1" style={{ color: 'var(--saving)' }}>{fmtCurrency(selectedQuadrant.saving)}</div>
                    </div>
                    <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-2">
                      <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">Custo Evitado</div>
                      <div className="text-[12px] font-extrabold mt-1" style={{ color: 'var(--custo-evitado)' }}>{fmtCurrency(selectedQuadrant.custoEvitado)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/queue')}
                    className="w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.07em] bg-[rgba(56,189,248,0.14)] text-[rgba(56,189,248,0.95)] border border-[rgba(56,189,248,0.25)] hover:bg-[rgba(56,189,248,0.18)] transition-colors"
                  >
                    Abrir projetos na Fila de Priorização
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
