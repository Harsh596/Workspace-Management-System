import React, { useState } from 'react';
import { LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup
} from '../firebase';
import './Auth.css';

export default function Authentication() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    // Safety Catch: Clear any lingering deletion flags before a fresh login
    localStorage.removeItem('wms_pending_deletion');
    
    try {
      console.log("Initiating standard Google Auth popup...");
      await signInWithPopup(auth, googleProvider);
      // App.jsx will handle navigation to /dashboard via onAuthStateChanged
    } catch (err) {
      console.error("Popup Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else {
        setError('Authentication failed. Please check your connection or try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Dynamic Background Elements */}
      <div className="auth-bg-blob blob-1"></div>
      <div className="auth-bg-blob blob-2"></div>
      
      <div className="auth-card">
        <div className="auth-header text-center">
          <div className="logo-box mx-auto">
            <ShieldCheck size={36} className="text-accent-ai" />
          </div>
          <h1>System Login</h1>
          <p>
            Welcome back, Creator. Initialize your session to access the orchestration dashboard.
          </p>
        </div>

        <div className="auth-content">
          {error && (
            <div className="auth-error flex items-center gap-2 mb-8">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-actions">
            <button 
              onClick={handleGoogleSignIn} 
              className="btn-google-auth"
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                 <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                 <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                 <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                 <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{loading ? 'Initializing...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="auth-footer text-center mt-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-50">
              Encrypted Session Protocol
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

