import React, { useState } from 'react';
import { User, Palette, Trash2, ShieldAlert, LogOut, Check } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { THEMES, applyTheme } from '../themes';
import './Settings.css';

export default function Settings({ userId, userSettings }) {
  const [activeTheme, setActiveTheme] = useState(userSettings?.theme || 'default');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleThemeChange = async (themeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    if (userId) {
      try {
        await updateDoc(doc(db, 'userSettings', userId), { theme: themeId });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete your account and all associated data. Continue?")) return;
    
    setLoading(true);
    try {
      // 1. Delete Firestore Data
      await deleteDoc(doc(db, 'userSettings', userId));
      
      // 2. Delete Auth User
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
      }
      window.location.reload();
    } catch (err) {
      setError("Deletion failed. You may need to re-authenticate first: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-view px-12 py-10 max-w-4xl mx-auto">
      <header className="page-header mb-12">
        <h1 className="text-4xl font-black tracking-tight">Preferences</h1>
        <p className="text-muted mt-2">Calibrate your system environment.</p>
      </header>

      <div className="flex flex-col gap-12">
        {/* Profile Section */}
        <section className="settings-section bento-card p-10 flex gap-10">
          <div className="section-info w-1/3">
            <div className="flex items-center gap-3 mb-4 text-accent-ai">
               <User size={20} />
               <h2 className="text-xs font-black uppercase tracking-widest">Profile</h2>
            </div>
            <p className="text-sm text-muted">Your public identity within the workspace ecosystem.</p>
          </div>
          <div className="section-content flex-1 flex-col gap-6">
            <div className="profile-badge flex items-center gap-6 p-6 bg-secondary/10 rounded-2xl border border-color">
               <div className="w-16 h-16 rounded-full bg-accent-ai flex items-center justify-center text-2xl font-black text-white">
                 {auth.currentUser?.displayName?.[0] || 'U'}
               </div>
               <div className="flex-col">
                 <h3 className="text-xl font-bold">{auth.currentUser?.displayName || 'User'}</h3>
                 <p className="text-sm text-muted">{auth.currentUser?.email}</p>
               </div>
            </div>
          </div>
        </section>

        {/* Theme Section */}
        <section className="settings-section bento-card p-10 flex gap-10">
          <div className="section-info w-1/3">
            <div className="flex items-center gap-3 mb-4 text-accent-ai">
               <Palette size={20} />
               <h2 className="text-xs font-black uppercase tracking-widest">Interface Theme</h2>
            </div>
            <p className="text-sm text-muted">Select a visual language that matches your focus.</p>
          </div>
          <div className="section-content flex-1">
            <div className="theme-grid grid grid-cols-2 gap-4">
              {Object.entries(THEMES).map(([id, theme]) => (
                <button 
                  key={id} 
                  className={`theme-preset-btn p-4 rounded-xl border flex items-center justify-between transition-all ${activeTheme === id ? 'border-accent-ai bg-accent-ai/5' : 'border-color hover:bg-secondary/10'}`}
                  onClick={() => handleThemeChange(id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: theme.accent }}></div>
                    <span className="text-xs font-bold">{theme.name}</span>
                  </div>
                  {activeTheme === id && <Check size={14} className="text-accent-ai" />}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section bento-card p-10 border-red-500/20 bg-red-500/5 flex gap-10">
          <div className="section-info w-1/3 text-red-500">
            <div className="flex items-center gap-3 mb-4">
               <ShieldAlert size={20} />
               <h2 className="text-xs font-black uppercase tracking-widest">Danger Zone</h2>
            </div>
            <p className="text-sm text-red-500/70">Irreversible actions for account management.</p>
          </div>
          <div className="section-content flex-1">
             <button 
                className="btn-danger w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
               <Trash2 size={18} />
               {loading ? 'Processing...' : 'TERMINATE ACCOUNT'}
             </button>
             {error && <p className="text-[10px] text-red-500 font-bold uppercase mt-4 text-center">{error}</p>}
          </div>
        </section>

        <div className="flex justify-center mt-6">
           <button className="flex items-center gap-2 text-muted hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest" onClick={() => auth.signOut()}>
             <LogOut size={16} /> Sign Out
           </button>
        </div>
      </div>
    </div>
  );
}
