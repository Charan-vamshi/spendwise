// ==============================================================================
// SpendWise - Budgets Page Component
// ==============================================================================
// Description:
// Displays all category budgets alongside real-time spending for the current
// month. Provides visual progress indicators, color-coded threshold alerts
// (Normal: green, Warning: orange >80%, Overspent: red >=100%), and budget CRUD.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import BudgetModal from './BudgetModal';
import {
  PieChart as PieIcon,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../transactions/TransactionList';
import '../../styles/budgets-goals.css';

const BudgetsPage = ({ refreshTrigger, onRefresh }) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(null);

  // Fetch budgets and current month transactions
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch user's budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true });

      if (budgetError) throw budgetError;

      // 2. Fetch current month's expenses to compute category spending
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', `${currentMonthKey}-01`)
        .lte('date', `${currentMonthKey}-31`);

      if (txError) throw txError;

      // Aggregate spend per category
      const spendMap = {};
      (txData || []).forEach((tx) => {
        const cat = tx.category;
        spendMap[cat] = (spendMap[cat] || 0) + Number(tx.amount || 0);
      });

      setBudgets(budgetData || []);
      setCurrentMonthExpenses(spendMap);
    } catch (err) {
      console.error('Error fetching budgets data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, refreshTrigger]);

  // Handle Delete
  const handleDeleteBudget = async (budget) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to remove the monthly budget for "${budget.category}"?`
    );
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budget.id);

      if (error) throw error;
      setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert('Failed to delete budget.');
    }
  };

  const existingCategories = useMemo(
    () => budgets.map((b) => b.category),
    [budgets]
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading monthly budgets...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div className="page-header-bar">
        <div>
          <h2 className="page-header-title">Monthly Budgets</h2>
          <p className="page-header-desc">
            Set spending limits per category to prevent overspending this month
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setBudgetToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Empty State */}
      {budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <PieIcon size={28} />
          </div>
          <h3 className="empty-state-title">No category budgets yet</h3>
          <p className="empty-state-desc">
            Keep your expenses disciplined. Define a monthly limit for categories like Food, Travel, Shopping, etc.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setBudgetToEdit(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Set First Budget</span>
          </button>
        </div>
      ) : (
        /* Budgets Grid */
        <div className="budgets-grid">
          {budgets.map((b) => {
            const spent = currentMonthExpenses[b.category] || 0;
            const limit = Number(b.monthly_limit) || 1;
            const percentage = Math.round((spent / limit) * 100);
            const remaining = limit - spent;
            const isOverspent = spent > limit;
            const isWarning = !isOverspent && percentage >= 80;

            let statusClass = 'status-normal';
            let barClass = 'progress-bar-normal';
            let statusBadge = (
              <span className="badge badge-income">
                <CheckCircle size={12} /> On Track
              </span>
            );

            if (isOverspent) {
              statusClass = 'status-danger';
              barClass = 'progress-bar-danger';
              statusBadge = (
                <span className="badge badge-expense">
                  <AlertCircle size={12} /> Overspent
                </span>
              );
            } else if (isWarning) {
              statusClass = 'status-warning';
              barClass = 'progress-bar-warning';
              statusBadge = (
                <span
                  className="badge"
                  style={{
                    backgroundColor: 'var(--color-warning-light)',
                    color: 'var(--color-warning)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <AlertTriangle size={12} /> Caution
                </span>
              );
            }

            return (
              <div
                key={b.id}
                className={`budget-card ${
                  isOverspent ? 'is-overspent' : isWarning ? 'is-warning' : ''
                }`}
              >
                <div className="budget-card-header">
                  <div>
                    <h3 className="budget-card-title">{b.category}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Monthly Limit: {formatCurrency(b.monthly_limit)}
                    </span>
                  </div>
                  {statusBadge}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${barClass}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="budget-metrics">
                  <div>
                    <span className="budget-spent">{formatCurrency(spent)}</span>
                    <span className="budget-limit"> / {formatCurrency(limit)}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {percentage}%
                  </span>
                </div>

                {/* Warning / Status text */}
                <div className={`budget-status-text ${statusClass}`}>
                  {isOverspent ? (
                    <>
                      <AlertCircle size={14} />
                      <span>
                        Over budget by {formatCurrency(Math.abs(remaining))}!
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>{formatCurrency(remaining)} remaining this month</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.5rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn-icon-action"
                    onClick={() => {
                      setBudgetToEdit(b);
                      setIsModalOpen(true);
                    }}
                    title="Edit budget limit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-action delete-action"
                    onClick={() => handleDeleteBudget(b)}
                    title="Delete budget"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBudgetToEdit(null);
        }}
        onSuccess={() => {
          fetchData();
          if (onRefresh) onRefresh();
        }}
        budgetToEdit={budgetToEdit}
        existingBudgetCategories={existingCategories}
      />
    </div>
  );
};

export default BudgetsPage;
