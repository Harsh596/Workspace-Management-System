import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db, getRedirectResult } from './firebase';
import { applyTheme } from './themes';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import Workspaces from './components/Workspaces';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import Authentication from './components/Authentication';
import { ShieldCheck } from 'lucide-react';
import './App.css';

// Protected Route Guard
const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo-container">
        <ShieldCheck size={48} className="loading-logo-spinner" />
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Layout for Protected Pages
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <Navbar />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [userSettings, setUserSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initialize Auth and handle any pending redirects from previous sessions
    const initializeAuth = async () => {
      try {
        await getRedirectResult(auth);
      } catch (err) {
        console.error("Initial Redirect Sync Error:", err);
      }
      
      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        console.log("Auth State Changed: ", currentUser?.email || 'Logged Out');
        setUser(currentUser);
        setLoading(false);
      });
      
      return unsubscribeAuth;
    };

    const unsubPromise = initializeAuth();
    return () => {
      unsubPromise.then(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  useEffect(() => {
    let unsubscribeTasks = () => {};
    let unsubscribeSettings = () => {};

    if (user) {
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(t => ({ id: t.id, ...t.data() }));
        tasksData.sort((a, b) => b.createdAt - a.createdAt);
        setTasks(tasksData);
      });

      unsubscribeSettings = onSnapshot(doc(db, 'userSettings', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const loadedSettings = docSnap.data();
          setUserSettings(loadedSettings);
          if (loadedSettings.theme) applyTheme(loadedSettings.theme);
        } else {
          setUserSettings(null);
          applyTheme("default");
        }
      });

      return () => {
        unsubscribeTasks();
        unsubscribeSettings();
      };
    }
  }, [user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo-container">
          <ShieldCheck size={48} className="loading-logo-spinner" />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container flex flex-col h-screen overflow-hidden">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Authentication />} 
          />

          {/* Protected Area */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <DashboardLayout>
                  <Dashboard tasks={tasks} userSettings={userSettings} userId={user?.uid} />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/workspaces" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <DashboardLayout>
                  <Workspaces userId={user?.uid} userSettings={userSettings} />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <DashboardLayout>
                  <TaskBoard tasks={tasks} userId={user?.uid} />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/assistant" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <DashboardLayout>
                  <AIAssistant 
                    tasks={tasks}
                    userSettings={userSettings}
                    userId={user?.uid}
                  />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <DashboardLayout>
                  <Settings userId={user?.uid} userSettings={userSettings} />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
