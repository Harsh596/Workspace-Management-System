import React, { useState, useEffect } from 'react';
import { Plus, Folder, Edit3, Trash2, Check, Palette, X } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import WorkspaceDetails from './WorkspaceDetails';
import StatusNotice from './StatusNotice';
import './Workspaces.css';

const COLOR_PRESETS = [
  '#6e56cf', '#ff007f', '#0070f3', '#10b981', 
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
];

export default function Workspaces({ userId, userSettings }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceColor, setNewSpaceColor] = useState('#6e56cf');
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'workspaces'), where('ownerId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWorkspaces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [userId]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    try {
      if (editingWorkspace) {
        await updateDoc(doc(db, 'workspaces', editingWorkspace.id), {
          name: newSpaceName,
          color: newSpaceColor
        });
      } else {
        await addDoc(collection(db, 'workspaces'), {
          ownerId: userId,
          name: newSpaceName,
          color: newSpaceColor,
          createdAt: serverTimestamp()
        });
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      await deleteDoc(doc(db, 'workspaces', id));
    } catch (err) {
      setError(err.message);
    }
  };

  const openEdit = (ws, e) => {
    e.stopPropagation();
    setEditingWorkspace(ws);
    setNewSpaceName(ws.name);
    setNewSpaceColor(ws.color);
    setIsCreating(true);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingWorkspace(null);
    setNewSpaceName('');
    setNewSpaceColor('#6e56cf');
  };

  if (activeWorkspace) {
    return (
      <WorkspaceDetails 
        workspace={activeWorkspace} 
        onBack={() => setActiveWorkspace(null)} 
        userId={userId} 
      />
    );
  }

  return (
    <div className="workspaces-page">
      <header className="page-header flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-accent-ai rounded-full"></div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Hubs</h1>
            <p className="text-muted text-sm mt-1">Your dedicated command centers for deep work.</p>
          </div>
        </div>
        <button className="btn-create-workspace flex items-center gap-2 group" onClick={() => setIsCreating(true)}>
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>New Workspace</span>
        </button>
      </header>

      {isCreating && (
        <div className="workspace-modal-overlay" onClick={closeModal}>
          <div className="workspace-modal-content bento-card animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">{editingWorkspace ? 'Refactor Hub' : 'Initialize Hub'}</h2>
              <button className="icon-btn" onClick={closeModal}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="flex-col gap-8">
              <div className="input-field">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 block">System Designation</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. PROJECT X, NEURAL NET..." 
                  value={newSpaceName} 
                  onChange={e => setNewSpaceName(e.target.value)}
                  className="workspace-input"
                />
              </div>

              <div className="color-selection-area">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 block">Visual Signature</label>
                <div className="color-grid">
                  {COLOR_PRESETS.map(color => (
                    <button 
                      key={color}
                      type="button"
                      onClick={() => setNewSpaceColor(color)}
                      className={`color-preset-square ${newSpaceColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                    >
                      {newSpaceColor === color && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                  <div className="color-wheel-wrapper">
                    <input 
                      type="color" 
                      value={newSpaceColor} 
                      onChange={e => setNewSpaceColor(e.target.value)}
                      className="custom-color-wheel"
                    />
                    <Palette size={16} className="wheel-icon pointer-events-none" />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-finalize w-full py-4 mt-4">
                {editingWorkspace ? 'Commit Changes' : 'Launch Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="workspaces-grid">
        {workspaces.map(ws => (
          <div 
            key={ws.id} 
            className="workspace-card group" 
            style={{ '--ws-color': ws.color }}
            onClick={() => setActiveWorkspace(ws)}
          >
            <div className="card-top flex justify-between items-start">
              <div className="ws-indicator" style={{ backgroundColor: ws.color }}></div>
              <div className="card-actions opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="icon-btn-small" onClick={(e) => openEdit(ws, e)}><Edit3 size={14}/></button>
                <button className="icon-btn-small hover:bg-red-500/10 hover:text-red-500" onClick={(e) => handleDelete(ws.id, e)}><Trash2 size={14}/></button>
              </div>
            </div>
            
            <div className="card-bottom mt-auto">
              <h2 className="ws-name-large">{ws.name}</h2>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-secondary/50 rounded-full text-muted">ID: {ws.id.slice(0, 4)}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted">Active Hub</span>
              </div>
            </div>
          </div>
        ))}

        {workspaces.length === 0 && !isCreating && (
          <div className="empty-state-card col-span-full">
            <Folder size={48} className="opacity-10 mb-4" />
            <p className="text-muted font-bold uppercase tracking-widest text-xs">No active stations found</p>
          </div>
        )}
      </div>
      <StatusNotice message={error} onClose={() => setError(null)} />
    </div>
  );
}
