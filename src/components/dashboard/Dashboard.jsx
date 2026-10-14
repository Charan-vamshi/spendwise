// ==============================================================================
// SpendWise - Dashboard Page Component
// ==============================================================================
// Description:
// Central overview page featuring:
// 1. Month selector for granular period filtering.
// 2. Summary cards (Total Income, Total Expenses, Net Savings, Savings Rate).
// 3. Category Expense Doughnut Chart.
// 4. Monthly Income vs Expenses Trend Bar Chart.
// 5. Recent transactions quick list with action buttons.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import StatCards from './StatCards';
import CategoryExpenseChart from './CategoryExpenseChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import {
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  formatCurrency,
  formatDisplayDate,
} from '../transactions/TransactionList';
import '../../styles/dashboard.css';

const Dashboard = ({
  onOpenAddModal,
  onNavigateToTransactions,
  darkMode,
  refreshTrigger,
}) => {
  const { user } = useAuth();
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default selected month to current month YYYY-MM
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Fetch all transactions for the user
  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllTransactions(data || []);
    } catch (err) {
      console.error('Error fetching dashboard transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, refreshTrigger]);

  // Extract all distinct months available in transactions, ensuring currentMonthKey is included
  const monthOptions = useMemo(() => {
    const monthsSet = new Set([currentMonthKey]);
    allTransactions.forEach((tx) => {
      if (tx.date) {
        monthsSet.add(tx.date.substring(0, 7));
      }
    });

    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [year, month] = key.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        return { key, label };
      });
  }, [allTransactions, currentMonthKey]);

  // Filter transactions for the selected month
  const monthlyTransactions = useMemo(() => {
    return allTransactions.filter(
      (tx) => tx.date && tx.date.startsWith(selectedMonth)
    );
  }, [allTransactions, selectedMonth]);

  // Separate monthly income and expenses
  const monthlyIncome = useMemo(
    () => monthlyTransactions.filter((tx) => tx.type === 'income'),
    [monthlyTransactions]
  );

  const monthlyExpenses = useMemo(
    () => monthlyTransactions.filter((tx) => tx.type === 'expense'),
    [monthlyTransactions]
  );

  // Totals calculations
  const totalIncome = useMemo(
    () => monthlyIncome.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    [monthlyIncome]
  );

  const totalExpenses = useMemo(
    () => monthlyExpenses.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    [monthlyExpenses]
  );

  const savings = totalIncome - totalExpenses;

  // Selected month readable label
  const selectedMonthLabel = useMemo(() => {
    const found = monthOptions.find((m) => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [monthOptions, selectedMonth]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* 1. Header with Title and Month Filter Dropdown */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-group">
          <h2>Financial Overview</h2>
          <p>
            Insights and performance summary for <strong>{selectedMonthLabel}</strong>
          </p>
        </div>

        <div className="month-selector-wrapper">
          <label htmlFor="dashboard-month-select">
            <Calendar size={16} />
            <span>Month:</span>
          </label>
          <select
            id="dashboard-month-select"
            className="month-select-dropdown"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Top Metric Cards (Income, Expense, Net Savings) */}
      <StatCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        savings={savings}
        incomeCount={monthlyIncome.length}
        expenseCount={monthlyExpenses.length}
      />

      {/* 3. Interactive Charts Grid */}
      <div className="charts-grid">
        {/* Doughnut Chart: Expense by Category */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Expenses by Category</h3>
            <span className="badge badge-expense">
              {formatCurrency(totalExpenses)} total
            </span>
          </div>
          <div className="chart-content-wrapper">
            <CategoryExpenseChart
              expenses={monthlyExpenses}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Bar Chart: Income vs Expense Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Income vs. Expenses Trend</h3>
            <span className="badge badge-income">Last 6 Months</span>
          </div>
          <div className="chart-content-wrapper">
            <MonthlyTrendChart
              allTransactions={allTransactions}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* 4. Recent Transactions Section */}
      <div className="recent-activity-card">
        <div className="recent-activity-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
              Recent Transactions
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Latest entries recorded in your account
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToTransactions}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {allTransactions.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p className="empty-state-title" style={{ fontSize: '1rem' }}>
              No transactions recorded yet
            </p>
            <p className="empty-state-desc" style={{ fontSize: '0.85rem' }}>
              Start adding transactions to see your dashboard come alive.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenAddModal}
            >
              <Plus size={16} />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          <div className="recent-list">
            {allTransactions.slice(0, 5).map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div key={tx.id} className="recent-item">
                  <div className="recent-item-left">
                    <span
                      className={`badge ${
                        isIncome ? 'badge-income' : 'badge-expense'
                      }`}
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      {tx.category}
                    </span>
                    <div className="recent-item-info">
                      <span className="recent-item-title">
                        {tx.note || tx.category}
                      </span>
                      <span className="recent-item-date">
                        {formatDisplayDate(tx.date)}
                        {tx.is_recurring && ' • Monthly'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`amount-text ${
                      isIncome ? 'amount-income' : 'amount-expense'
                    }`}
                    style={{ fontSize: '0.95rem' }}
                  >
                    {isIncome ? '+ ' : '- '}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
