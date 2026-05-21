import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function InvestmentMap() {
  const navigate = useNavigate();
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; floorId: string } | null>(null);

  const fmtCurrency = (n: number | null) => n == null || isNaN(n) ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const floors = useMemo(() => {
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

  const hoveredFloor = useMemo(() => floors.find((f) => f.id === hoveredFloorId) || null, [floors, hoveredFloorId]);

  return (
    <div className="flex flex-col gap-[18px] animate-[fadeIn_0.2s_ease]">
      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Mapa de Investimento</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">Passe o mouse sobre um andar para ver o investimento e a quebra do ROI.</div>
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
        <div className="relative flex justify-center py-10">
          <div
            className="relative w-full max-w-[640px]"
            onMouseLeave={() => {
              setHoveredFloorId(null);
              setTooltip(null);
            }}
          >
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-6 w-[88%] h-[32px] rounded-t-[20px]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
              }}
            />

            <div
              className="rounded-[22px] overflow-hidden"
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                boxShadow: '0 30px 110px rgba(0,0,0,0.55)',
              }}
            >
              <div className="h-[26px]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.08))' }} />

              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-2">
                  {[...floors].reverse().map((f, idx) => {
                    const isHovered = hoveredFloorId === f.id;
                    const isGround = idx === floors.length - 1;

                    return (
                      <div
                        key={f.id}
                        onMouseEnter={() => setHoveredFloorId(f.id)}
                        onMouseMove={(e) => {
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          setTooltip({ x, y, floorId: f.id });
                        }}
                        className="relative rounded-2xl transition-all duration-200"
                        style={{
                          background: isHovered
                            ? 'linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))'
                            : 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                          border: isHovered ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.10)',
                          boxShadow: isHovered ? '0 18px 44px rgba(56,189,248,0.12)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                          transform: isHovered ? 'translateY(-1px) scale(1.01)' : 'translateY(0px) scale(1)',
                        }}
                      >
                        <div className="absolute inset-y-0 left-0 w-[10px] rounded-l-2xl" style={{ background: isHovered ? 'rgba(56,189,248,0.60)' : 'rgba(255,255,255,0.06)' }} />

                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-[var(--text)] truncate">{f.name}</div>
                              <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Passe o mouse para ver os números</div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              <div
                                className="w-[42px] h-[10px] rounded-full"
                                style={{
                                  background: isHovered
                                    ? 'linear-gradient(90deg, rgba(56,189,248,0.95), rgba(147,197,253,0.15))'
                                    : 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-12 gap-2">
                            <div className="col-span-9">
                              <div className="grid grid-cols-6 gap-2">
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="rounded-md"
                                    style={{
                                      height: 16,
                                      background: isHovered
                                        ? 'linear-gradient(180deg, rgba(191,219,254,0.55), rgba(56,189,248,0.10))'
                                        : 'linear-gradient(180deg, rgba(255,255,255,0.11), rgba(0,0,0,0.14))',
                                      border: isHovered ? '1px solid rgba(56,189,248,0.22)' : '1px solid rgba(255,255,255,0.10)',
                                      boxShadow: isHovered ? '0 0 0 1px rgba(56,189,248,0.06) inset' : '0 0 0 1px rgba(0,0,0,0.15) inset',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="col-span-3">
                              <div className="h-full rounded-xl" style={{ background: 'rgba(0,0,0,0.16)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="h-[10px] rounded-t-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                <div className="p-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className="rounded-md"
                                        style={{
                                          height: 14,
                                          background: isHovered
                                            ? 'linear-gradient(180deg, rgba(56,189,248,0.35), rgba(56,189,248,0.05))'
                                            : 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.10))',
                                          border: isHovered ? '1px solid rgba(56,189,248,0.18)' : '1px solid rgba(255,255,255,0.08)',
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="h-[10px] flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }} />
                          </div>

                          {isGround && (
                            <div className="mt-3 flex items-end justify-between gap-3">
                              <div className="flex-1">
                                <div className="h-[18px] rounded-xl" style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)' }} />
                              </div>

                              <div
                                className="w-[108px] h-[48px] rounded-[14px] relative"
                                style={{
                                  background: isHovered
                                    ? 'linear-gradient(180deg, rgba(56,189,248,0.20), rgba(0,0,0,0.20))'
                                    : 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.20))',
                                  border: isHovered ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.10)',
                                }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center gap-2">
                                  <div className="w-[44px] h-[34px] rounded-[10px]" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                  <div className="w-[44px] h-[34px] rounded-[10px]" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                </div>
                                <div className="absolute right-[10px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ background: isHovered ? 'rgba(56,189,248,0.75)' : 'rgba(255,255,255,0.30)' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-[26px]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.28))' }} />
            </div>

            <div className="mt-5 flex items-center justify-center">
              <div className="w-[92%] h-[18px] rounded-full bg-[rgba(0,0,0,0.38)] blur-[12px]" />
            </div>

            {hoveredFloor && tooltip && hoveredFloor.id === tooltip.floorId && (
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  transform: `translate(${Math.min(Math.max(tooltip.x + 20, 10), 430)}px, ${Math.min(Math.max(tooltip.y + 20, 10), 520)}px)`,
                }}
              >
                <div
                  className="glass-card rounded-xl p-3 w-[300px]"
                  style={{
                    border: '1px solid rgba(56,189,248,0.32)',
                    boxShadow: '0 26px 80px rgba(0,0,0,0.65)',
                  }}
                >
                  <div className="text-[10px] text-[rgba(56,189,248,0.95)] font-bold uppercase tracking-[0.07em]">{hoveredFloor.name}</div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[rgba(0,0,0,0.18)] border border-[rgba(255,255,255,0.08)] p-2">
                      <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">Investimento</div>
                      <div className="text-[12px] font-extrabold text-[var(--red)] mt-0.5">{fmtCurrency(hoveredFloor.investment)}</div>
                    </div>
                    <div className="rounded-lg bg-[rgba(0,0,0,0.18)] border border-[rgba(255,255,255,0.08)] p-2">
                      <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase tracking-[0.07em]">ROI Total</div>
                      <div className="text-[12px] font-extrabold text-[var(--green)] mt-0.5">{fmtCurrency(hoveredFloor.roiTotal)}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-[var(--text-dim)]">
                    Receita: <span className="font-bold" style={{ color: 'var(--receita)' }}>{fmtCurrency(hoveredFloor.receita)}</span>
                    <br />
                    Saving: <span className="font-bold" style={{ color: 'var(--saving)' }}>{fmtCurrency(hoveredFloor.saving)}</span>
                    <br />
                    Custo Evitado: <span className="font-bold" style={{ color: 'var(--custo-evitado)' }}>{fmtCurrency(hoveredFloor.custoEvitado)}</span>
                  </div>

                  <div className="mt-3 text-[11px] text-[rgba(56,189,248,0.95)] font-bold underline">Acesse os projetos pela Fila de Priorização</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
