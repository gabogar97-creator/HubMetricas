import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Camera, Save, User, Loader2 } from 'lucide-react';

export function Profile() {
  const { profile, user } = useAuth();
  const { logAction } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setRole(profile.role || 'viewer');
      setPhotoUrl(profile.avatar_url || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, avatar_url: photoUrl })
        .eq('id', user.id);

      if (error) throw error;
      
      await logAction('UPDATE', 'Profile', user.id, profile, { name, avatar_url: photoUrl });
      
      setToast('Perfil atualizado com sucesso!');
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setToast('Erro ao atualizar perfil.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fadeIn_0.2s_ease]">
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text)]">Configurações de Perfil</h2>
          <p className="text-sm text-[var(--text-dim)] mt-1">Atualize suas informações pessoais e foto de perfil.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--bg4)] border-2 border-[var(--border2)] flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-[var(--text-dim)]" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[var(--accent)] text-white rounded-full flex items-center justify-center hover:bg-[#33ddff] transition-colors shadow-lg"
                title="Alterar foto"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-semibold text-[var(--text)]">{name || 'Usuário'}</h3>
              <p className="text-sm text-[var(--text-dim)] capitalize">{role}</p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-[var(--border)]">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Nome Completo</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Email</label>
              <input 
                type="email" 
                value={email} 
                disabled
                className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans outline-none opacity-70 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Cargo / Função</label>
              <input 
                type="text" 
                value={role} 
                disabled
                className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans outline-none opacity-70 cursor-not-allowed capitalize"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md text-[13px] font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#161b22] border border-[#30363d] rounded-[10px] p-[12px_20px] text-[13px] text-[#e6edf3] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center gap-2.5 z-[99] transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
        <div className={`w-2 h-2 rounded-full ${toast?.includes('Erro') ? 'bg-red-500' : 'bg-[#3fb950]'}`}></div>
        <span>{toast}</span>
      </div>
    </div>
  );
}
