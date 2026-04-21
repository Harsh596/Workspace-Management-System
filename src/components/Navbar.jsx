import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Settings, Sparkles, LogOut, Folder, Network, Bell } from 'lucide-react';
import { auth, signOut } from '../firebase';
import './Navbar.css';

export default function Navbar() {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'workspaces', label: 'Hubs', icon: Folder, path: '/workspaces' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { id: 'assistant', label: 'Assistant', icon: Sparkles, path: '/assistant' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <nav className="top-navbar bg-surface-container-lowest">
      <div className="navbar-logo flex items-center gap-4">
        <h2 className="font-['Inter'] font-black text-xl uppercase tracking-widest text-primary">WMS</h2>
      </div>

      <div className="navbar-links flex items-center gap-2">
        {menuItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="navbar-actions flex items-center gap-6">
        <div className="flex gap-4 border-l border-color pl-6 h-full items-center">
          <button className="icon-btn text-primary border-none p-2 hover:bg-surface-container transition-colors" title="Notifications">
            <Bell size={18} />
          </button>
          <button className="icon-btn text-danger border-none p-2 hover:bg-surface-container transition-colors" title="Logout" onClick={() => signOut(auth)}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
