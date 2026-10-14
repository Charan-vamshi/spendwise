// ==============================================================================
// SpendWise - Navigation Bar Component
// ==============================================================================
// Description:
// Top navigation bar containing app branding, section tab navigation
// (Dashboard, Transactions, Budgets, Goals), theme switcher (Light/Dark),
// quick "+ Add Transaction" action button, and user session controls (Logout).
// ==============================================================================

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Plus,
  LogOut,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import '../../styles/navbar.css';

const Navbar = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  darkMode,
  toggleDarkMode,
}) => {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <div className="navbar-brand" onClick={() => setActiveTab('dashboard')}>
          <div className="brand-icon">₹</div>
          <div className="brand-title">
            <span className="brand-name">SpendWise</span>
            <span className="brand-subtitle">Finance Tracker</span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav>
          <ul className="navbar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Action Buttons */}
        <div className="navbar-actions">
          {/* Prominent Always-Visible "+ Add Transaction" Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddModal}
            title="Add a new income or expense transaction"
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            type="button"
            className="btn-icon-theme"
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Profile Email Indicator */}
          {user && (
            <div className="user-profile-badge" title={user.email}>
              <User size={14} />
              <span className="user-email-text">{user.email}</span>
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={signOut}
            title="Sign out of your account"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
