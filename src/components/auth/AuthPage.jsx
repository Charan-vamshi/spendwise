// ==============================================================================
// SpendWise - Authentication Component (Login & Sign Up)
// ==============================================================================
// Description:
// Renders the authentication interface supporting both login and registration
// using Supabase Auth (email + password). Handles client-side validation,
// loading states, and user-friendly error messages.
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import '../../styles/auth.css';

const AuthPage = () => {
  const { signIn, signUp, isConfigured } = useAuth();

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Switch between Login and Signup modes
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Basic Validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        const data = await signUp(email.trim(), password);
        // Supabase sign up notice
        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists. Try logging in.');
        } else {
          setSuccessMessage(
            'Account created successfully! You can now log in with your credentials.'
          );
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Format Supabase error messages cleanly
      if (err.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.message.includes('User already registered')) {
        setError('An account with this email already exists. Please log in.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">₹</div>
          <h1 className="auth-title">SpendWise</h1>
          <p className="auth-subtitle">
            Personal Finance Tracker • Monitor, Budget & Save
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('login')}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('signup')}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="alert alert-info" role="status">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-password">
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span>{mode === 'login' ? 'Logging in...' : 'Creating account...'}</span>
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        {/* Setup Helper Banner (visible if Supabase keys not set yet) */}
        {!isConfigured && (
          <div className="setup-helper-card">
            <h4>
              <AlertCircle size={16} /> Supabase Setup Required
            </h4>
            <p>
              To enable database storage & authentication, connect your Supabase project:
            </p>
            <ol>
              <li>Create a free project at <code>supabase.com</code>.</li>
              <li>Run the provided <code>supabase-schema.sql</code> in SQL Editor.</li>
              <li>Paste your Project URL & Anon Key into <code>.env</code> file.</li>
            </ol>
          </div>
        )}

        {/* Footer switch prompt */}
        <div className="auth-footer">
          {mode === 'login' ? (
            <p>
              Don't have an account?
              <button
                type="button"
                className="auth-footer-link"
                onClick={() => handleModeSwitch('signup')}
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?
              <button
                type="button"
                className="auth-footer-link"
                onClick={() => handleModeSwitch('login')}
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
