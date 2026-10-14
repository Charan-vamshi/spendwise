// ==============================================================================
// SpendWise - Main Application Component
// ==============================================================================
// Description:
// Root component managing user authentication state, global dark/light theme,
// active tab routing, and modal states for adding and editing transactions.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/dashboard/Dashboard';
import TransactionModal from './components/transactions/TransactionModal';
import TransactionList from './components/transactions/TransactionList';
import BudgetsPage from './components/budgets/BudgetsPage';
import GoalsPage from './components/goals/GoalsPage';
import {
  Database,
  PieChart,
  Target,
} from 'lucide-react';
import './App.css';

// Main Inner Shell (has access to Auth Context)
const MainAppShell = () => {
  const { user, loading, isConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard now that Step 3 is live!
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('spendwise_dark_mode') === 'true';
  });

  // Modal and transaction refresh states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Apply dark/light theme to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('spendwise_dark_mode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Trigger modal for adding a new transaction
  const handleOpenAddModal = () => {
    setTransactionToEdit(null);
    setIsModalOpen(true);
  };

  // Trigger modal for editing an existing transaction
  const handleOpenEditModal = (tx) => {
    setTransactionToEdit(tx);
    setIsModalOpen(true);
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  // Refresh list and dashboard when transactions are added, edited, or deleted
  const handleTransactionSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading SpendWise...</p>
      </div>
    );
  }

  // 2. Unauthenticated State -> Show Login / Sign Up Page
  if (!user) {
    return <AuthPage />;
  }

  // 3. Authenticated State -> Show Main App Layout
  return (
    <div className="app-wrapper">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="main-content">
        {/* Supabase Status Alert */}
        {!isConfigured && (
          <div className="alert alert-warning" role="alert">
            <Database size={20} />
            <div>
              <strong>Action Needed: Connect Your Supabase Keys</strong>
              <p style={{ marginTop: '0.25rem' }}>
                Open <code>.env</code> in the project root and add your real <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>. Then execute <code>supabase-schema.sql</code> in your Supabase SQL Editor.
              </p>
            </div>
          </div>
        )}

        {/* View Routing Based on activeTab */}
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddModal={handleOpenAddModal}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            darkMode={darkMode}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleOpenEditModal}
            refreshTrigger={refreshTrigger}
            onRefresh={handleTransactionSaved}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsPage
            refreshTrigger={refreshTrigger}
            onRefresh={handleTransactionSaved}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsPage
            refreshTrigger={refreshTrigger}
            onRefresh={handleTransactionSaved}
          />
        )}
      </main>

      {/* Global Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleTransactionSaved}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppShell />
    </AuthProvider>
  );
}
