import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
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

// Protected Route Component
const ProtectedRoute = ({ children, user, loading }) => {
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo-container">
        <ShieldCheck size={48} className="loading-logo-spinner" />
      </div>
    </div>
  );
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default function App() {
  const [showAI, setShowAI] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [userSettings, setUserSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
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
          {/* Public Login Route */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Authentication />} 
          />

          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute user={user} loading={loading}>
              <div className="flex flex-col h-full w-full">
                <Navbar showAI={showAI} setShowAI={setShowAI} />
                <main className="flex-1 overflow-hidden relative flex flex-col">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard tasks={tasks} userSettings={userSettings} userId={user?.uid} />} />
                    <Route path="/workspaces" element={<Workspaces userId={user?.uid} userSettings={userSettings} />} />
                    <Route path="/tasks" element={<TaskBoard tasks={tasks} userId={user?.uid} />} />
                    <Route path="/settings" element={<Settings userId={user?.uid} userSettings={userSettings} />} />
                  </Routes>
                </main>
                <AIAssistant 
                  isOpen={showAI} 
                  onClose={() => setShowAI(false)}
                  tasks={tasks}
                  userSettings={userSettings}
                  userId={user?.uid}
                />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}
