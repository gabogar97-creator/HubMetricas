import React, { useMemo, useState } from 'react';

export function PrioritizationQueue() {
  const [queueListTab, setQueueListTab] = useState<'to_prioritize' | 'prioritized'>('to_prioritize');

  const fmtCurrency = (n: number | null) => n == null || isNaN(n) ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const mockQueueProjects = useMemo(() => {
    const list = [
      {
        id: 'IA-1001',
        jiraKey: 'IA-1001',
        title: 'Projeto de IA',
        bu: 'BU Varejo',
        sponsor: 'Diretoria BU',
        estimatedCost: 85000,
        estimatedRoi12m: 16000,
        calcMemory: 'Saving estimado via redução de horas manuais × custo hora.',
        effort: 'low' as const,
        roi: 'high' as const,
        status: 'to_prioritize' as const,
      },
      {
        id: 'IA-1020',
        jiraKey: 'IA-1020',
        title: 'Automação de triagem de tickets',
        bu: 'BU Serviços',
        sponsor: 'Operações',
        estimatedCost: 120000,
        estimatedRoi12m: 240000,
        calcMemory: 'Receita adicional por aumento de capacidade + redução de churn.',
        effort: 'high' as const,
        roi: 'high' as const,
        status: 'to_prioritize' as const,
      },
      {
        id: 'IA-1102',
        jiraKey: 'IA-1102',
        title: 'Copiloto para suporte interno',
        bu: 'BU Corporativo',
        sponsor: 'TI',
        estimatedCost: 65000,
        estimatedRoi12m: 9000,
        calcMemory: 'Saving por redução de tempo de atendimento e retrabalho.',
        effort: 'low' as const,
        roi: 'low' as const,
        status: 'to_prioritize' as const,
      },
      {
        id: 'IA-1150',
        jiraKey: 'IA-1150',
        title: 'Predição de demanda multi-produto',
        bu: 'BU Indústria',
        sponsor: 'Planejamento',
        estimatedCost: 220000,
        estimatedRoi12m: 12000,
        calcMemory: 'Receita via redução de ruptura e aumento de disponibilidade.',
        effort: 'high' as const,
        roi: 'low' as const,
        status: 'to_prioritize' as const,
      },
      {
        id: 'IA-1205',
        jiraKey: 'IA-1205',
        title: 'Classificação automática de documentos',
        bu: 'BU Backoffice',
        sponsor: 'Financeiro',
        estimatedCost: 90000,
        estimatedRoi12m: 180000,
        calcMemory: 'Saving por redução de terceirização e tempo operacional.',
        effort: 'low' as const,
        roi: 'high' as const,
        status: 'prioritized' as const,
      },
    ];
    return list;
  }, []);

  return (
    <div className="flex flex-col gap-[18px] animate-[fadeIn_0.2s_ease]">
      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-3">Metodologia de Priorização</div>
        <div className="text-[13px] text-[var(--text-mid)] leading-relaxed whitespace-pre-wrap">
          {`A área de IA da Zucchetti Brasil adota uma metodologia de priorização baseada em ROI estimado de 12 meses como critério único e objetivo de entrada no roadmap de desenvolvimento. Toda iniciativa de IA passa por um fluxo estruturado que começa na área de negócio: o solicitante submete a iniciativa com escopo, NSM — a métrica de negócio que o projeto vai mover — e a estimativa de retorno com memória de cálculo, classificada obrigatoriamente como saving ou receita. O time de IA recebe essa submissão, classifica o tipo de iniciativa, analisa viabilidade, refina as métricas junto ao solicitante e estima o esforço de desenvolvimento. Com especificação e métricas definidas, o projeto aguarda priorização — e só entra nessa fila se NSM e ROI estiverem devidamente preenchidos. O Diretor de BU revisa e assina o ROI mensalmente, transformando a estimativa em compromisso de negócio. A partir daí, o Hub de Métricas plota automaticamente todos os projetos elegíveis em uma matriz de Valor versus Esforço, classificando-os em Quick Wins, Big Bets ou projetos de menor prioridade, e gera a lista ordenada que o PO utiliza para puxar as demandas ao desenvolvimento — sem negociação, sem política. O roadmap é composto por 40% de Quick Wins, 40% de Big Bets e 20% de buffer para urgências. Em caso de empate, o desempate segue três critérios em sequência: maior ROI absoluto, relevância da BU para o faturamento da Zucchetti Brasil, e menor esforço estimado. Ao entrar em desenvolvimento, o Country Manager é notificado com o detalhamento das métricas aprovadas e, em caso de discordância, aciona o Diretor da BU com intermediação do Head de IA. O acompanhamento do projeto e o monitoramento de NSM e ROI real versus projetado ficam disponíveis sob demanda no AI Lab e no Hub de Métricas — sem relatórios periódicos intermediados pelo time de IA.`}
        </div>
      </div>

      <QuadrantMatrix projects={mockQueueProjects} fmtCurrency={fmtCurrency} />

      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="flex gap-1 bg-[var(--bg4)] p-1 rounded-lg w-fit flex-wrap mb-4">
          <button
            onClick={() => setQueueListTab('to_prioritize')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              queueListTab === 'to_prioritize' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
            }`}
          >
            Projetos para Priorização
          </button>
          <button
            onClick={() => setQueueListTab('prioritized')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              queueListTab === 'prioritized' ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
            }`}
          >
            Projetos Priorizados
          </button>
        </div>

        <QueueProjectsTable
          projects={mockQueueProjects.filter(p => p.status === queueListTab)}
          fmtCurrency={fmtCurrency}
        />
      </div>
    </div>
  );
}

function QuadrantMatrix({ projects, fmtCurrency }: { projects: any[]; fmtCurrency: (n: number | null) => string }) {
  const quadrantProjects = {
    quickWins: projects.filter(p => p.roi === 'high' && p.effort === 'low'),
    bigBets: projects.filter(p => p.roi === 'high' && p.effort === 'high'),
    fillQueue: projects.filter(p => p.roi === 'low' && p.effort === 'low'),
    dontEnter: projects.filter(p => p.roi === 'low' && p.effort === 'high'),
  };

  const ProjectLine = ({ p }: { p: any; key?: any }) => (
    <div className="text-[12px] text-[var(--text-mid)] truncate" title={`${p.jiraKey}: ${p.title} | ${fmtCurrency(p.estimatedRoi12m)}`}>
      <span className="font-mono text-[11px] text-[var(--text)]">{p.jiraKey}</span>
      <span className="text-[var(--text-dim)]">: </span>
      <span className="text-[var(--text)]">{p.title}</span>
      <span className="text-[var(--text-dim)]"> | </span>
      <span className="font-mono text-[11px] text-[var(--green)]">{fmtCurrency(p.estimatedRoi12m)}</span>
    </div>
  );

  const Quadrant = ({ title, desc, items, accent }: { title: string; desc: string; items: any[]; accent: string }) => (
    <div className="glass-card rounded-lg p-4 min-h-[220px] border border-[var(--border)]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: accent }}>{title}</div>
        <div className="text-[10px] text-[var(--text-dim)]">{items.length} projetos</div>
      </div>
      <div className="text-[12px] text-[var(--text-dim)] leading-relaxed mb-3">{desc}</div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-[12px] text-[var(--text-dim)]">Nenhum projeto neste quadrante.</div>
        ) : (
          items.map((p) => <ProjectLine key={p.id} p={p} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
      <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em] mb-4">Matriz Valor vs Esforço</div>

      <div className="relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[var(--text3)]">ROI ALTO</div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[var(--text3)]">ROI BAIXO</div>

        <div className="absolute top-1/2 -translate-y-1/2 -left-2 -rotate-90 origin-left text-[10px] font-bold text-[var(--text3)]">ESFORÇO BAIXO</div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-2 rotate-90 origin-right text-[10px] font-bold text-[var(--text3)]">ESFORÇO ALTO</div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
          <Quadrant
            title="Quick Wins"
            desc="Alto retorno, baixa complexidade, maior prioridade."
            items={quadrantProjects.quickWins}
            accent="var(--green)"
          />
          <Quadrant
            title="Big Bets"
            desc="Alto retorno, alta complexidade, entrará após os Quick Wins até completar a capacidade."
            items={quadrantProjects.bigBets}
            accent="var(--yellow)"
          />
          <Quadrant
            title="Preenche fila"
            desc="Entram somente se sobrar capacidade após Quick Wins e Big Bets."
            items={quadrantProjects.fillQueue}
            accent="var(--blue)"
          />
          <Quadrant
            title="Não entram"
            desc="Baixo retorno e alta complexidade, serão descartados ou reformulados."
            items={quadrantProjects.dontEnter}
            accent="var(--red)"
          />
        </div>
      </div>
    </div>
  );
}

function QueueProjectsTable({ projects, fmtCurrency }: { projects: any[]; fmtCurrency: (n: number | null) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {[
              'ID',
              'Título',
              'BU Origem',
              'Sponsor',
              'Custo Estimado',
              'ROI Estimado (12m)',
              'Memória do Cálculo',
            ].map(h => (
              <th
                key={h}
                className="p-[9px_12px] text-left bg-[var(--bg3)] text-[var(--text-dim)] font-bold text-[10px] uppercase tracking-[0.07em] border-b border-[var(--border)] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {projects.map((p: any) => (
            <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <td className="p-[10px_12px] font-mono text-[11px] text-[var(--text)] whitespace-nowrap">{p.jiraKey}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] whitespace-nowrap">{p.title}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] whitespace-nowrap">{p.bu}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] whitespace-nowrap">{p.sponsor}</td>
              <td className="p-[10px_12px] text-[var(--red)] whitespace-nowrap">{fmtCurrency(p.estimatedCost)}</td>
              <td className="p-[10px_12px] text-[var(--green)] font-semibold whitespace-nowrap">{fmtCurrency(p.estimatedRoi12m)}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] min-w-[320px]">{p.calcMemory}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-[13px] text-[var(--text-dim)]">
                Nenhum projeto nesta lista.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
