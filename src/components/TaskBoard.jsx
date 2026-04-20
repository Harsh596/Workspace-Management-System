import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Folder, CheckCircle2, Clock, List, Trash2, Edit3, X } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import StatusNotice from './StatusNotice';
import './TaskBoard.css';

const COLUMNS = [
  { id: 'all', label: 'All Tasks', icon: <List size={16}/>, color: '#6e56cf' },
  { id: 'pending', label: 'Pending', icon: <Clock size={16}/>, color: '#f59e0b' },
  { id: 'doing', label: 'Doing', icon: <CheckCircle2 size={16}/>, color: '#0070f3' },
  { id: 'later', label: 'Later', icon: <X size={16}/>, color: '#747474' }
];

export default function TaskBoard({ tasks, userId }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedWS, setSelectedWS] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState(null);
  const [draggedOverCol, setDraggedOverCol] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'workspaces'), where('ownerId', '==', userId));
    const unsub = onSnapshot(q, (snap) => {
      setWorkspaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userId]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        status: 'all',
        workspaceId: selectedWS || null,
        userId,
        createdAt: serverTimestamp()
      });
      setNewTaskTitle('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = async (taskId) => {
    if (!editingTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'tasks', taskId), { title: editingTitle });
      setEditingTaskId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  return (
    <div className="task-board-view px-12 py-10">
      <header className="page-header mb-10">
        <h1 className="text-4xl font-black tracking-tight">Mission Control</h1>
        <p className="text-muted mt-2">Strategic task orchestration across all hubs.</p>
      </header>

      <form onSubmit={handleAddTask} className="task-entry-form flex gap-4 mb-12 bg-secondary/10 p-6 rounded-2xl border border-color">
         <input 
            className="flex-1 bg-surface border-none p-4 rounded-xl text-sm font-bold" 
            placeholder="Initialize new objective..."
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
         />
         <select 
            className="ws-select px-6 py-4 rounded-xl bg-surface border-none text-xs font-black uppercase tracking-widest"
            value={selectedWS}
            onChange={e => setSelectedWS(e.target.value)}
          >
           <option value="">No Hub</option>
           {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
         </select>
         <button className="btn-primary px-8 rounded-xl font-black uppercase tracking-widest">Deploy</button>
      </form>

      <div className="kanban-scroll-container">
        <div className="kanban-columns-grid">
          {COLUMNS.map(col => (
            <div 
              key={col.id} 
              className={`kanban-column ${draggedOverCol === col.id ? 'drag-over' : ''}`}
              onDragOver={e => e.preventDefault()}
              onDragEnter={() => setDraggedOverCol(col.id)}
              onDragLeave={() => setDraggedOverCol(null)}
              onDrop={e => {
                const taskId = e.dataTransfer.getData('taskId');
                handleUpdateStatus(taskId, col.id);
                setDraggedOverCol(null);
              }}
            >
              <div className="column-header mb-6 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg" style={{ background: `${col.color}20`, color: col.color }}>{col.icon}</div>
                   <h3 className="text-xs font-black uppercase tracking-widest">{col.label}</h3>
                 </div>
                 <span className="text-[10px] font-black opacity-20 bg-muted px-2 py-1 rounded-full">{tasks.filter(t => t.status === col.id).length}</span>
              </div>

              <div className="task-cards-stack flex-col gap-4">
                {tasks.filter(t => t.status === col.id).map(task => {
                  const ws = workspaces.find(w => w.id === task.workspaceId);
                  return (
                    <div 
                      key={task.id} 
                      className="task-card bento-card p-4 group"
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        {editingTaskId === task.id ? (
                          <input 
                             autoFocus
                             className="task-edit-input"
                             value={editingTitle}
                             onChange={e => setEditingTitle(e.target.value)}
                             onBlur={() => saveEdit(task.id)}
                             onKeyDown={e => e.key === 'Enter' && saveEdit(task.id)}
                          />
                        ) : (
                          <h4 className="text-sm font-bold leading-snug">{task.title}</h4>
                        )}
                        <button className="icon-btn-small opacity-0 group-hover:opacity-100" onClick={() => startEdit(task)}><Edit3 size={12}/></button>
                      </div>
                      
                      {ws && (
                        <div className="flex items-center gap-1.5 mt-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ws.color }}></div>
                           <span className="text-[9px] font-black uppercase tracking-tighter text-muted">Hub: {ws.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <StatusNotice message={error} onClose={() => setError(null)} />
    </div>
  );
}
