import React, { useState, useEffect } from 'react';
import { User, Palette, Trash2, ShieldAlert, LogOut, Check } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { deleteUser, GoogleAuthProvider, reauthenticateWithRedirect, getRedirectResult } from 'firebase/auth';
import { THEMES, applyTheme } from '../themes';
import './Settings.css';

export default function Settings({ userId, userSettings }) {
  const [activeTheme, setActiveTheme] = useState(userSettings?.theme || 'default');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * THE RESILIENT WIPE (Best-Effort Purge)
   * Purges all user data across all collections.
   */
  const performFullWipe = async (uid) => {
    console.log("Resilient Wipe Starting for:", uid);
    const segments = [
      { name: 'Settings', run: async () => await deleteDoc(doc(db, 'userSettings', uid)) },
      { name: 'Resources', query: query(collection(db, 'globalResources'), where('userId', '==', uid)) },
      { name: 'Tasks', query: query(collection(db, 'tasks'), where('userId', '==', uid)) },
      { name: 'Workspaces', query: query(collection(db, 'workspaces'), where('ownerId', '==', uid)) }
    ];

    for (const segment of segments) {
      try {
        if (segment.run) {
          await segment.run();
        } else if (segment.query) {
          const snap = await getDocs(segment.query);
          if (snap.empty) continue;
          const batch = writeBatch(db);
          snap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (err) {
        console.warn(`⚠ Segment [${segment.name}] failed:`, err.message);
      }
    }
  };

  // RESTORED: Handle return from Redirect re-authentication
  useEffect(() => {
    const handleRedirectResult = async () => {
      const isPending = localStorage.getItem('wms_pending_deletion');
      if (!isPending) return;

      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        
        // If we have a result OR we know we just came back
        if (result || auth.currentUser) {
          const user = auth.currentUser;
          await performFullWipe(user.uid);
          await deleteUser(user);
          localStorage.removeItem('wms_pending_deletion');
          window.location.href = '/login';
        }
      } catch (err) {
        console.error("Post-Redirect Termination Error:", err);
        setError("Account verification failed. Please try again.");
        localStorage.removeItem('wms_pending_deletion');
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, [userId]);

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
    const confirmation = window.confirm(
      "CRITICAL: This will permanently delete your account and associated data. This action is IRREVERSIBLE. Proceed?"
    );
    if (!confirmation) return;
    
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");

      try {
        // 1. DATA PURGE
        await performFullWipe(user.uid);

        // 2. AUTH DELETE
        await deleteUser(user);
        window.location.href = '/login';
      } catch (authErr) {
        if (authErr.code === 'auth/requires-recent-login') {
          // SWITCHED BACK TO REDIRECT TO BYPASS POPUP BLOCKERS
          const provider = new GoogleAuthProvider();
          localStorage.setItem('wms_pending_deletion', 'true');
          await reauthenticateWithRedirect(user, provider);
          // Page will redirect now
        } else {
          throw authErr;
        }
      }
    } catch (err) {
      setError("Termination failed: " + err.message);
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
        <section className="settings-section bento-card p-10 danger-section flex gap-10">
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
