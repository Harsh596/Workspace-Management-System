import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, CheckCircle2, Layout, 
  FileText, Link as LinkIcon, Video, 
  TrendingUp, BarChart3
} from 'lucide-react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './Dashboard.css';

export default function Dashboard({ tasks, userSettings, userId }) {
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [recentResources, setRecentResources] = useState([]);
  
  useEffect(() => {
    if (!userId) return;
    
    // Fetch workspaces count
    const qWorkspaces = query(collection(db, 'workspaces'), where('ownerId', '==', userId));
    const unsubWorkspaces = onSnapshot(qWorkspaces, (snap) => {
      setWorkspaceCount(snap.size);
    });

    // Fetch recent resources
    const qResources = query(collection(db, 'globalResources'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(5));
    const unsubResources = onSnapshot(qResources, (snap) => {
      setRecentResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubWorkspaces();
      unsubResources();
    };
  }, [userId]);

  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length || 1;
  const completionRate = Math.round((completedTasksCount / totalTasks) * 100);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-fade-in">
        <div className="welcome-banner">
          <h1 className="huge-greeting">{getGreeting()}, Creator</h1>
        </div>
      </header>

      <div className="dashboard-bento-grid">
        {/* Metric Cards */}
        <div className="bento-card metric-card animate-fade-in" style={{animationDelay: '0.1s'}}>
          <div className="metric-header">
            <div className="icon-wrapper bg-blue-500/10 text-blue-500"><Layout size={14} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Hubs</span>
          </div>
          <div className="metric-value">{workspaceCount}</div>
          <div className="metric-footer text-green flex items-center gap-1">
            <TrendingUp size={10} /> <span className="text-[10px] font-medium">Cloud Synced</span>
          </div>
        </div>

        <div className="bento-card metric-card animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="metric-header">
            <div className="icon-wrapper bg-purple-500/10 text-purple-500"><Activity size={14} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Due</span>
          </div>
          <div className="metric-value">{pendingTasks}</div>
          <div className="metric-footer text-accent flex items-center gap-1">
            <Clock size={10} /> <span className="text-[10px] font-medium">Sprint Active</span>
          </div>
        </div>

        <div className="bento-card metric-card animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="metric-header">
            <div className="icon-wrapper bg-green/10 text-green"><BarChart3 size={14} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Focus</span>
          </div>
          <div className="metric-value">{completionRate}%</div>
          <div className="metric-footer text-muted flex items-center gap-1">
             <CheckCircle2 size={10} /> <span className="text-[10px] font-medium">Verified</span>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bento-card col-span-2 row-span-2 flex-col animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="card-header pb-4 border-b border-color mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest">Recent Task Ledger</h3>
          </div>
          <div className="recent-list flex-col gap-3">
            {tasks.slice(0, 6).map(task => (
              <div key={task.id} className="list-item flex items-center justify-between p-3 rounded-xl border border-color bg-secondary/20 hover:bg-secondary/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`status-dot ${task.status === 'completed' ? 'bg-green' : 'bg-accent'}`}></div>
                  <span className="text-sm font-medium">{task.title}</span>
                </div>
                <span className="text-[10px] text-muted font-mono uppercase">Reference: {task.id.slice(0, 5)}</span>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="flex-col items-center justify-center py-12 text-muted">
                <FileText size={32} strokeWidth={1} className="mb-2 opacity-20" />
                <p className="text-xs">No active task ledger entries.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resources Widget */}
        <div className="bento-card col-span-1 row-span-2 animate-fade-in" style={{animationDelay: '0.5s'}}>
           <div className="card-header pb-4 border-b border-color mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest">Resource Vault</h3>
          </div>
          <div className="flex-col gap-4">
            {recentResources.map(res => (
              <div key={res.id} className="flex items-center gap-3 p-2 hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer group">
                <div className="p-2 rounded-lg bg-primary border border-color group-hover:border-accent transition-colors">
                  {res.type === 'pdf' ? <FileText size={14} className="text-red-500" /> : res.type === 'video' ? <Video size={14} className="text-blue-500" /> : <LinkIcon size={14} className="text-yellow-500" />}
                </div>
                <div className="flex-col overflow-hidden">
                  <span className="text-xs font-bold truncate">{res.title}</span>
                  <span className="text-[10px] text-muted uppercase tracking-tighter">{res.type} resource</span>
                </div>
              </div>
            ))}
            {recentResources.length === 0 && (
              <div className="flex-col items-center justify-center py-12 text-muted text-center">
                 <LinkIcon size={32} strokeWidth={1} className="mb-2 opacity-20" />
                 <p className="text-[10px] uppercase font-bold tracking-widest">Vault Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
