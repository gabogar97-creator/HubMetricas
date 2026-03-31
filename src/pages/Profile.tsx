import React, { useState, useRef } from 'react';
import { useUI } from '../context/UIContext';
import { Camera, Save, User } from 'lucide-react';

export function Profile() {
  const { userProfile, updateUserProfile } = useUI();
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [role, setRole] = useState(userProfile.role);
  const [photoUrl, setPhotoUrl] = useState(userProfile.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateUserProfile({ name, email, role, photoUrl });
    alert('Perfil atualizado com sucesso!');
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
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
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
              <h3 className="text-base font-semibold text-[var(--text)]">{userProfile.name}</h3>
              <p className="text-sm text-[var(--text-dim)]">{userProfile.role}</p>
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
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[var(--text3)]">Cargo / Função</label>
              <input 
                type="text" 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                className="w-full bg-[var(--bg4)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-md text-[13px] font-sans focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              onClick={handleSave} 
              className="flex items-center gap-2 px-6 py-2.5 rounded-md text-[13px] font-semibold bg-[var(--accent)] text-white hover:bg-[#33ddff] transition-colors"
            >
              <Save size={16} />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
