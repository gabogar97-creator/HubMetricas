import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalReturn: 0,
    activeProjects: 0,
    avgPayback: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const projects = await res.json();
          let totalReturn = 0;
          let activeCount = 0;
          
          projects.forEach((p: any) => {
            if (p.status === 'Em andamento' || p.status === 'Concluído' || p.status === 'active') {
              activeCount++;
            }
            if (p.CollectionROIs) {
              p.CollectionROIs.forEach((roi: any) => {
                totalReturn += Number(roi.totalValue || 0);
              });
            }
          });

          setStats({
            totalReturn,
            activeProjects: activeCount,
            avgPayback: 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  const showToastMsg = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const translateError = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail antes de entrar.';
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    return msg;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Informe um e-mail válido para recuperar a senha.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      showToastMsg('Link de recuperação enviado para seu e-mail.', 'success');
      setIsForgotPassword(false);
    } catch (err: any) {
      setError(translateError(err.message || 'Erro ao processar requisição.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!name.trim()) {
        setError('Informe seu nome completo.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não conferem.');
        return;
      }
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });

        if (signUpError) throw signUpError;

        showToastMsg('Conta criada com sucesso! Faça login.', 'success');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        showToastMsg('Autenticado com sucesso!', 'success');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err: any) {
      setError(translateError(err.message || 'Erro ao processar requisição.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans bg-[var(--bg)] text-[var(--text)] overflow-hidden flex">
      {/* Grid BG */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)'
      }}></div>

      {/* Glow blobs */}
      <div className="fixed rounded-full blur-[120px] pointer-events-none z-0 w-[500px] h-[500px] -top-[120px] -left-[150px]" style={{ background: 'radial-gradient(circle, rgba(59,130,246,.18), transparent 70%)' }}></div>
      <div className="fixed rounded-full blur-[120px] pointer-events-none z-0 w-[400px] h-[400px] -bottom-[80px] -right-[100px]" style={{ background: 'radial-gradient(circle, rgba(63,185,80,.12), transparent 70%)' }}></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 w-full min-h-screen">
        {/* LEFT: branding */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>
          {/* Decorative glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2)_0%,transparent_50%)] pointer-events-none"></div>
          
          <div className="max-w-[480px] mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-16">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-mono text-lg font-bold tracking-tight text-[#0f172a] shadow-lg shrink-0">
                SH
              </div>
              <div className="leading-tight">
                <strong className="block text-xl font-bold text-white tracking-tight">Spot Hub</strong>
                <span className="text-sm text-blue-200">Inteligência para seus projetos</span>
              </div>
            </div>

            <h2 className="text-[42px] font-bold leading-[1.15] text-white mb-8">
              Centralize e calcule métricas reais dos seus projetos
            </h2>
            
            <p className="text-lg text-blue-100/80 leading-relaxed max-w-[400px]">
              ROI, NSM e dados operacionais em um único sistema, com fórmulas automatizadas e histórico completo por projeto.
            </p>
          </div>
        </div>

        {/* RIGHT: login form */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 bg-[var(--bg)] relative min-h-screen lg:min-h-0">
          {/* Mobile Branding - Only visible on small screens */}
          <div className="lg:hidden flex items-center gap-3 mb-8 sm:mb-10 w-full max-w-[380px]">
            <div className="w-[32px] h-[32px] rounded-[8px] bg-[var(--accent)] flex items-center justify-center font-mono text-xs font-bold tracking-[-0.5px] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] shrink-0">
              SH
            </div>
            <div className="leading-none">
              <strong className="block text-sm font-semibold tracking-[0.3px] text-[var(--text)]">Spot Hub</strong>
            </div>
          </div>

          <div className="w-full max-w-[380px] animate-[fadeUp_0.5s_0.1s_both]">
            {isForgotPassword ? (
              <>
                <div className="mb-8">
                  <button 
                    onClick={() => { setIsForgotPassword(false); setError(null); }}
                    className="flex items-center gap-2 text-[13px] text-[var(--text3)] hover:text-[var(--text)] transition-colors mb-4"
                  >
                    <ArrowLeft size={14} /> Voltar para o login
                  </button>
                  <h1 className="text-2xl font-semibold mb-1.5 text-[var(--text)]">Recuperar senha</h1>
                  <p className="text-sm text-[var(--text3)]">Informe seu e-mail para receber um link de recuperação</p>
                </div>
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-[18px]">
                    <label className="block text-[12px] font-medium tracking-[0.5px] uppercase text-[var(--text3)] mb-2">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none text-[var(--text)]" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seunome@empresa.com" 
                        autoComplete="email"
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg py-[11px] pr-[14px] pl-10 text-sm text-[var(--text)] font-sans outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] placeholder-[var(--text3)]"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="text-[13px] text-[var(--red)] mt-1.5 mb-4">{error}</div>
                  )}
                  <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-[var(--accent)] border-none rounded-lg p-3 text-sm font-semibold text-white cursor-pointer font-sans tracking-[0.3px] transition-all relative overflow-hidden hover:bg-[#1d4ed8] hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(59,130,246,0.35)] active:translate-y-0 ${loading ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-transparent"></div>
                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold mb-1.5 text-[var(--text)]">{isRegister ? 'Criar conta' : 'Entrar na plataforma'}</h1>
                  <p className="text-sm text-[var(--text3)]">{isRegister ? 'Preencha os dados para se cadastrar' : 'Acesse seu painel de ROI e projetos'}</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {isRegister && (
                    <div className="mb-[18px]">
                      <label className="block text-[12px] font-medium tracking-[0.5px] uppercase text-[var(--text3)] mb-2">Nome completo</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none text-[var(--text)]" />
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome" 
                          autoComplete="name"
                          className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg py-[11px] pr-[14px] pl-10 text-sm text-[var(--text)] font-sans outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] placeholder-[var(--text3)]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-[18px]">
                    <label className="block text-[12px] font-medium tracking-[0.5px] uppercase text-[var(--text3)] mb-2">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none text-[var(--text)]" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seunome@empresa.com" 
                        autoComplete="email"
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg py-[11px] pr-[14px] pl-10 text-sm text-[var(--text)] font-sans outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] placeholder-[var(--text3)]"
                      />
                    </div>
                  </div>

                  <div className="mb-[18px]">
                    <label className="block text-[12px] font-medium tracking-[0.5px] uppercase text-[var(--text3)] mb-2">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none text-[var(--text)]" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        autoComplete={isRegister ? "new-password" : "current-password"}
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg py-[11px] pr-[46px] pl-10 text-sm text-[var(--text)] font-sans outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] placeholder-[var(--text3)]"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg4)] transition-all"
                        aria-label="Mostrar senha"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {isRegister && (
                    <div className="mb-[18px]">
                      <label className="block text-[12px] font-medium tracking-[0.5px] uppercase text-[var(--text3)] mb-2">Confirmar senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none text-[var(--text)]" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••" 
                          autoComplete="new-password"
                          className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg py-[11px] pr-[14px] pl-10 text-sm text-[var(--text)] font-sans outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] placeholder-[var(--text3)]"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-[13px] text-[var(--red)] mt-1.5 mb-4">{error}</div>
                  )}

                  {!isRegister && (
                    <div className="flex items-center justify-between mb-6 mt-4">
                      <label className="flex items-center gap-2 text-[13px] text-[var(--text3)] cursor-pointer select-none group">
                        <div className="relative w-4 h-4 flex items-center justify-center">
                          <input type="checkbox" className="peer hidden" />
                          <div className="w-full h-full rounded border border-[var(--border)] bg-[var(--bg3)] transition-all peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)] flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold opacity-0 peer-checked:opacity-100">✓</span>
                          </div>
                        </div>
                        <span className="group-hover:text-[var(--text)] transition-colors">Manter conectado</span>
                      </label>
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(null); }} 
                        className="text-[13px] text-[var(--accent)] no-underline hover:underline font-medium"
                      >
                        Esqueci a senha
                      </a>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-[var(--accent)] border-none rounded-lg p-3 text-sm font-semibold text-white cursor-pointer font-sans tracking-[0.3px] transition-all relative overflow-hidden hover:bg-[#1d4ed8] hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(59,130,246,0.35)] active:translate-y-0 ${loading ? 'pointer-events-none opacity-70' : ''} ${isRegister ? 'mt-6' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-transparent"></div>
                    {loading ? (isRegister ? 'Criando conta…' : 'Autenticando…') : (isRegister ? 'Criar conta' : 'Entrar')}
                  </button>

                  <div className="text-center mt-5 text-[13px] text-[var(--text3)]">
                    {isRegister ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); setError(null); }} 
                      className="text-[var(--accent)] font-medium hover:underline"
                    >
                      {isRegister ? 'Entrar' : 'Criar conta'}
                    </a>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#161b22] border border-[#30363d] rounded-[10px] p-[12px_20px] text-[13px] text-[#e6edf3] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center gap-2.5 z-[99] transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
        <div className={`w-2 h-2 rounded-full ${toast?.type === 'error' ? 'bg-[#f85149]' : 'bg-[#3fb950]'}`}></div>
        <span>{toast?.msg}</span>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        
        /* Fix for browser autofill background */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #0d1117 inset !important;
            -webkit-text-fill-color: #e6edf3 !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
