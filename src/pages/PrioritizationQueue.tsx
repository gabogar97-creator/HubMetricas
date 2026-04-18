import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function PrioritizationQueue() {
  const [queueListTab, setQueueListTab] = useState<'to_prioritize' | 'prioritized'>('to_prioritize');
  const [isMethodologyCollapsed, setIsMethodologyCollapsed] = useState(true);
  const [isMatrixCollapsed, setIsMatrixCollapsed] = useState(true);
  const [filterBu, setFilterBu] = useState('');
  const [filterSponsor, setFilterSponsor] = useState('');
  const [filterId, setFilterId] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [scopeDraft, setScopeDraft] = useState<string>('');
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState<string>('');
  const [jiraProjects, setJiraProjects] = useState<any[]>([]);
  const [jiraCredsModalOpen, setJiraCredsModalOpen] = useState(false);
  const envJiraEmail = import.meta.env.VITE_JIRA_EMAIL as string | undefined;
  const envJiraToken = import.meta.env.VITE_JIRA_API_TOKEN as string | undefined;
  const [jiraEmailDraft, setJiraEmailDraft] = useState(envJiraEmail || 'gabriel.garcia@zucchetti.com');
  const [jiraTokenDraft, setJiraTokenDraft] = useState(envJiraToken || '');
  const [jiraCredSource, setJiraCredSource] = useState<string>('');

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

  const loadJiraEpics = async (opts?: { jiraEmail?: string; jiraApiToken?: string }) => {
    try {
      setJiraLoading(true);
      setJiraError('');

      const { data, error } = await supabase.functions.invoke('jira-prioritization-epics', {
        body: opts?.jiraEmail && opts?.jiraApiToken ? { jiraEmail: opts.jiraEmail, jiraApiToken: opts.jiraApiToken } : undefined,
      });
      if (error) {
        throw new Error(error.message || 'Falha ao consultar Jira.');
      }

      const issues = ((data as any)?.issues || []) as any[];
      setJiraCredSource(((data as any)?.meta?.credSource as string) || '');
      const mapped = issues.map((i: any) => {
          const storyPointsOrDays = i?.customfield_10016;
          const cost = storyPointsOrDays != null && !isNaN(Number(storyPointsOrDays))
            ? Number(storyPointsOrDays) * 433
            : null;

          return {
            id: i?.id,
            jiraKey: i?.key,
            title: i?.summary,
            bu: i?.customfield_10851 ?? '—',
            buArea: i?.customfield_10852 ?? '—',
            sponsor: i?.customfield_10853 ?? '—',
            estimatedRoi12m: i?.customfield_10848 != null && !isNaN(Number(i.customfield_10848)) ? Number(i.customfield_10848) : null,
            calcMemory: i?.customfield_10849 ?? '—',
            estimatedCost: cost,
            scope: i?.description || '',
            effort: 'low',
            roi: i?.customfield_10848 != null && Number(i.customfield_10848) >= 0 ? 'high' : 'low',
            status: 'to_prioritize',
          };
      });

      setJiraProjects(mapped);
    } catch (e: any) {
      console.error('Failed to load Jira epics:', e);
      const msg = e?.message || 'Falha ao consultar Jira.';
      setJiraError(msg);
      if (String(msg).toLowerCase().includes('missing jira credentials')) {
        setJiraCredsModalOpen(true);
      }
    } finally {
      setJiraLoading(false);
    }
  };

  useEffect(() => {
    loadJiraEpics(envJiraEmail && envJiraToken ? { jiraEmail: envJiraEmail, jiraApiToken: envJiraToken } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queueProjects = useMemo(() => {
    return jiraProjects.length > 0 ? jiraProjects : mockQueueProjects;
  }, [jiraProjects, mockQueueProjects]);

  const availableBus = useMemo(() => {
    const set = new Set<string>();
    queueProjects.forEach((p: any) => p?.bu && set.add(p.bu));
    return Array.from(set).sort();
  }, [queueProjects]);

  const availableSponsors = useMemo(() => {
    const set = new Set<string>();
    queueProjects.forEach((p: any) => p?.sponsor && set.add(p.sponsor));
    return Array.from(set).sort();
  }, [queueProjects]);

  const matchesFilters = (p: any) => {
    const buOk = !filterBu || String(p?.bu || '').toLowerCase() === filterBu.toLowerCase();
    const sponsorOk = !filterSponsor || String(p?.sponsor || '').toLowerCase() === filterSponsor.toLowerCase();
    const idOk = !filterId || String(p?.jiraKey || p?.id || '').toLowerCase().includes(filterId.toLowerCase());
    const titleOk = !filterTitle || String(p?.title || '').toLowerCase().includes(filterTitle.toLowerCase());
    return buOk && sponsorOk && idOk && titleOk;
  };

  const filteredProjects = useMemo(() => {
    const base = queueProjects.filter((p: any) => p.status === queueListTab).filter(matchesFilters);
    if (queueListTab === 'to_prioritize') {
      return [...base].sort((a: any, b: any) => (Number(b.estimatedRoi12m) || 0) - (Number(a.estimatedRoi12m) || 0));
    }
    return base;
  }, [queueProjects, queueListTab, filterBu, filterSponsor, filterId, filterTitle]);

  const filteredAllProjects = useMemo(() => {
    return queueProjects.filter(matchesFilters);
  }, [queueProjects, filterBu, filterSponsor, filterId, filterTitle]);

  const openProjectModal = (p: any) => {
    setSelectedProject(p);
    setScopeDraft(p?.scope || '');
  };

  return (
    <div className="flex flex-col gap-[18px] animate-[fadeIn_0.2s_ease]">
      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Metodologia de Priorização</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">Descrição do método adotado para entrada no roadmap.</div>
          </div>
          <button
            type="button"
            onClick={() => setIsMethodologyCollapsed(!isMethodologyCollapsed)}
            className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors shrink-0"
          >
            {isMethodologyCollapsed ? 'Expandir' : 'Recolher'}
          </button>
        </div>

        {(jiraLoading || jiraError) && (
          <div className="mt-3">
            {jiraLoading && (
              <div className="text-[12px] text-[var(--text-dim)]">Carregando itens do Jira…</div>
            )}
            {!jiraLoading && jiraError && (
              <div className="text-[12px] text-[var(--red)]">{jiraError} (usando dados mockados como fallback)</div>
            )}
          </div>
        )}

        <div className="mt-3 text-[11px] text-[var(--text-dim)]">
          Debug Jira (POC): VITE_JIRA_EMAIL={envJiraEmail ? 'OK' : 'NÃO'} · VITE_JIRA_API_TOKEN={envJiraToken ? 'OK' : 'NÃO'}{jiraCredSource ? ` · credSource=${jiraCredSource}` : ''}
        </div>

        {!isMethodologyCollapsed && (
          <div className="mt-4 text-[13px] text-[var(--text-mid)] leading-relaxed whitespace-pre-wrap">
            {`A área de IA da Zucchetti Brasil adota uma metodologia de priorização baseada em ROI estimado de 12 meses como critério único e objetivo de entrada no roadmap de desenvolvimento. Toda iniciativa de IA passa por um fluxo estruturado que começa na área de negócio: o solicitante submete a iniciativa com escopo, NSM — a métrica de negócio que o projeto vai mover — e a estimativa de retorno com memória de cálculo, classificada obrigatoriamente como saving ou receita. O time de IA recebe essa submissão, classifica o tipo de iniciativa, analisa viabilidade, refina as métricas junto ao solicitante e estima o esforço de desenvolvimento. Com especificação e métricas definidas, o projeto aguarda priorização — e só entra nessa fila se NSM e ROI estiverem devidamente preenchidos. O Diretor de BU revisa e assina o ROI mensalmente, transformando a estimativa em compromisso de negócio. A partir daí, o Hub de Métricas plota automaticamente todos os projetos elegíveis em uma matriz de Valor versus Esforço, classificando-os em Quick Wins, Big Bets ou projetos de menor prioridade, e gera a lista ordenada que o PO utiliza para puxar as demandas ao desenvolvimento — sem negociação, sem política. O roadmap é composto por 40% de Quick Wins, 40% de Big Bets e 20% de buffer para urgências. Em caso de empate, o desempate segue três critérios em sequência: maior ROI absoluto, relevância da BU para o faturamento da Zucchetti Brasil, e menor esforço estimado. Ao entrar em desenvolvimento, o Country Manager é notificado com o detalhamento das métricas aprovadas e, em caso de discordância, aciona o Diretor da BU com intermediação do Head de IA. O acompanhamento do projeto e o monitoramento de NSM e ROI real versus projetado ficam disponíveis sob demanda no AI Lab e no Hub de Métricas — sem relatórios periódicos intermediados pelo time de IA.`}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 sm:p-[18px_20px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Matriz Valor vs Esforço</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">Quick Wins, Big Bets, Preenche fila e Não entram.</div>
          </div>
          <button
            type="button"
            onClick={() => setIsMatrixCollapsed(!isMatrixCollapsed)}
            className="px-3 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors shrink-0"
          >
            {isMatrixCollapsed ? 'Expandir' : 'Recolher'}
          </button>
        </div>

        {!isMatrixCollapsed && (
          <div className="mt-4">
            <QuadrantMatrix projects={filteredAllProjects} fmtCurrency={fmtCurrency} onProjectClick={openProjectModal} />
          </div>
        )}
      </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">BU</div>
            <select
              value={filterBu}
              onChange={(e) => setFilterBu(e.target.value)}
              className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
            >
              <option value="">Todas</option>
              {availableBus.map((bu) => (
                <option key={bu} value={bu}>{bu}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Sponsor</div>
            <select
              value={filterSponsor}
              onChange={(e) => setFilterSponsor(e.target.value)}
              className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
            >
              <option value="">Todos</option>
              {availableSponsors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">ID</div>
            <input
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              placeholder="Ex: IA-1001"
              className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Título</div>
            <input
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              placeholder="Buscar por título"
              className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
        </div>

        {queueListTab === 'to_prioritize' && (
          <div className="text-[12px] text-[var(--text-dim)] mb-4">
            A lista ordena por padrão os projetos de maior prioridade no topo, considerando o maior ROI estimado.
          </div>
        )}

        <QueueProjectsTable
          projects={filteredProjects}
          fmtCurrency={fmtCurrency}
          onProjectClick={openProjectModal}
        />
      </div>

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          scope={scopeDraft}
          onChangeScope={setScopeDraft}
          fmtCurrency={fmtCurrency}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {jiraCredsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div>
                <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Conectar ao Jira (POC)</div>
                <div className="text-[12px] text-[var(--text-dim)] mt-1">Modo temporário: não persiste credenciais, mas expõe no tráfego do navegador.</div>
              </div>
              <button onClick={() => setJiraCredsModalOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Email</div>
                <input
                  value={jiraEmailDraft}
                  onChange={(e) => setJiraEmailDraft(e.target.value)}
                  className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">API Token</div>
                <input
                  type="password"
                  value={jiraTokenDraft}
                  onChange={(e) => setJiraTokenDraft(e.target.value)}
                  className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
                  placeholder="Cole o token do Atlassian"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                  onClick={() => setJiraCredsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  disabled={jiraLoading || !jiraEmailDraft || !jiraTokenDraft}
                  className={`px-4 py-2 rounded-md text-xs font-semibold text-white transition-opacity ${
                    jiraLoading || !jiraEmailDraft || !jiraTokenDraft
                      ? 'bg-[var(--accent)] opacity-60 cursor-not-allowed'
                      : 'bg-[var(--accent)] hover:opacity-90'
                  }`}
                  onClick={async () => {
                    setJiraCredsModalOpen(false);
                    await loadJiraEpics({ jiraEmail: jiraEmailDraft, jiraApiToken: jiraTokenDraft });
                  }}
                >
                  Conectar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuadrantMatrix({ projects, fmtCurrency, onProjectClick }: { projects: any[]; fmtCurrency: (n: number | null) => string; onProjectClick: (p: any) => void }) {
  const quadrantProjects = {
    quickWins: projects.filter(p => p.roi === 'high' && p.effort === 'low'),
    bigBets: projects.filter(p => p.roi === 'high' && p.effort === 'high'),
    fillQueue: projects.filter(p => p.roi === 'low' && p.effort === 'low'),
    dontEnter: projects.filter(p => p.roi === 'low' && p.effort === 'high'),
  };

  const ProjectLine = ({ p }: { p: any; key?: any }) => (
    <button
      type="button"
      onClick={() => onProjectClick(p)}
      className="w-full text-left text-[12px] text-[var(--text-mid)] truncate hover:opacity-80 transition-opacity"
      title={`${p.jiraKey}: ${p.title} | ${fmtCurrency(p.estimatedRoi12m)}`}
    >
      <span className="font-mono text-[11px] text-[var(--text)]">{p.jiraKey}</span>
      <span className="text-[var(--text-dim)]">: </span>
      <span className="text-[var(--text)]">{p.title}</span>
      <span className="text-[var(--text-dim)]"> | </span>
      <span className="font-mono text-[11px] text-[var(--green)]">{fmtCurrency(p.estimatedRoi12m)}</span>
    </button>
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

function QueueProjectsTable({
  projects,
  fmtCurrency,
  onProjectClick
}: {
  projects: any[];
  fmtCurrency: (n: number | null) => string;
  onProjectClick: (p: any) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {[
              'ID',
              'Título',
              'BU Origem',
              'Área da BU',
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
            <tr
              key={p.id}
              className="hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
              onClick={() => onProjectClick(p)}
            >
              <td className="p-[10px_12px] font-mono text-[11px] text-[var(--text)] whitespace-nowrap">{p.jiraKey}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] whitespace-nowrap">{p.title}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] whitespace-nowrap">{p.bu}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] whitespace-nowrap">{p.buArea || '—'}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] whitespace-nowrap">{p.sponsor}</td>
              <td className="p-[10px_12px] text-[var(--red)] whitespace-nowrap">{fmtCurrency(p.estimatedCost)}</td>
              <td className="p-[10px_12px] text-[var(--green)] font-semibold whitespace-nowrap">{fmtCurrency(p.estimatedRoi12m)}</td>
              <td className="p-[10px_12px] text-[var(--text-mid)] min-w-[320px]">{p.calcMemory}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-[13px] text-[var(--text-dim)]">
                Nenhum projeto nesta lista.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProjectDetailsModal({
  project,
  scope,
  onChangeScope,
  fmtCurrency,
  onClose
}: {
  project: any;
  scope: string;
  onChangeScope: (v: string) => void;
  fmtCurrency: (n: number | null) => string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-[820px] overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[10px] text-[var(--text-mid)] font-bold uppercase tracking-[0.07em]">Detalhes do Projeto</div>
            <div className="text-[14px] font-bold text-[var(--text)] mt-1">{project.jiraKey}: {project.title}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-lg p-3">
              <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">BU Origem</div>
              <div className="text-[13px] text-[var(--text)] mt-1">{project.bu}</div>
            </div>
            <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-lg p-3">
              <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Área da BU</div>
              <div className="text-[13px] text-[var(--text)] mt-1">{project.buArea || '—'}</div>
            </div>
            <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-lg p-3">
              <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Sponsor</div>
              <div className="text-[13px] text-[var(--text)] mt-1">{project.sponsor}</div>
            </div>
            <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-lg p-3">
              <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Custo Estimado</div>
              <div className="text-[13px] text-[var(--red)] font-semibold mt-1">{fmtCurrency(project.estimatedCost)}</div>
            </div>
            <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-lg p-3">
              <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">ROI Estimado (12m)</div>
              <div className="text-[13px] text-[var(--green)] font-semibold mt-1">{fmtCurrency(project.estimatedRoi12m)}</div>
            </div>
          </div>

          <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-lg p-3">
            <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Memória do Cálculo</div>
            <div className="text-[13px] text-[var(--text-mid)] mt-1 whitespace-pre-wrap">{project.calcMemory}</div>
          </div>

          <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-lg p-3">
            <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.07em]">Escopo (mock — futuramente Jira)</div>
            <textarea
              value={scope}
              onChange={(e) => onChangeScope(e.target.value)}
              className="w-full mt-2 min-h-[120px] bg-[var(--surface-high)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
              placeholder="Descreva o escopo (campo retornará do Jira no futuro)"
            />
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--bg4)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
