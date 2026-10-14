// ==============================================================================
// SpendWise - Goals Page Component
// ==============================================================================
// Description:
// Displays all user savings goals with dynamic progress bars, target amounts,
// accumulated savings, completion percentages, and milestone celebrations.
// Automatically falls back to total net savings if the 'current_amount' column
// is not yet added to the Supabase goals table.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import GoalModal from './GoalModal';
import AddFundsModal from './AddFundsModal';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  PlusCircle,
  Trophy,
} from 'lucide-react';
import { formatCurrency } from '../transactions/TransactionList';
import '../../styles/budgets-goals.css';

const GoalsPage = ({ refreshTrigger, onRefresh }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [totalNetSavings, setTotalNetSavings] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState(null);

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [goalForFunds, setGoalForFunds] = useState(null);

  // Fetch all user savings goals and calculate total savings
  const fetchGoalsAndSavings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch user's savings goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // 2. Fetch total transactions to compute overall net savings (fallback)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id);

      if (txError) throw txError;

      let income = 0;
      let expenses = 0;
      (txData || []).forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') income += amt;
        else if (t.type === 'expense') expenses += amt;
      });

      setTotalNetSavings(Math.max(0, income - expenses));
      setGoals(goalsData || []);
    } catch (err) {
      console.error('Error fetching savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndSavings();
  }, [user, refreshTrigger]);

  // Handle Delete Goal
  const handleDeleteGoal = async (goal) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the goal "${goal.title}"?`
    );
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id);

      if (error) throw error;
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Failed to delete goal.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your savings goals...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div className="page-header-bar">
        <div>
          <h2 className="page-header-title">Savings Goals</h2>
          <p className="page-header-desc">
            Stay motivated by setting targets for vacations, emergency funds, or big purchases
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setGoalToEdit(null);
            setIsGoalModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Empty State */}
      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Target size={28} />
          </div>
          <h3 className="empty-state-title">No savings goals set yet</h3>
          <p className="empty-state-desc">
            Having clear targets makes saving fun and rewarding. Create a goal and watch your savings grow!
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setGoalToEdit(null);
              setIsGoalModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        /* Goals Grid */
        <div className="goals-grid">
          {goals.map((g) => {
            // If current_amount column is present in DB, use it; otherwise use overall net savings
            const hasDedicatedFund = g.current_amount !== undefined && g.current_amount !== null;
            const current = hasDedicatedFund ? Number(g.current_amount) : totalNetSavings;
            const target = Number(g.target_amount || 1);
            const percentage = Math.round((current / target) * 100);
            const isCompleted = percentage >= 100;
            const remaining = Math.max(0, target - current);

            return (
              <div
                key={g.id}
                className={`goal-card ${isCompleted ? 'goal-completed' : ''}`}
              >
                <div className="goal-card-header">
                  <h3 className="goal-title">{g.title}</h3>
                  {isCompleted ? (
                    <span className="badge badge-income">
                      <Trophy size={13} /> Completed!
                    </span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'var(--bg-card-subtle)' }}>
                      {percentage}%
                    </span>
                  )}
                </div>

                {/* Amounts */}
                <div className="goal-amounts">
                  <div>
                    <div className="goal-saved">{formatCurrency(current)}</div>
                    <div className="goal-target">
                      of {formatCurrency(target)} target
                      {!hasDedicatedFund && ' (from Net Savings)'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {isCompleted
                        ? 'Target achieved!'
                        : `${formatCurrency(remaining)} left to save`}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar-container" style={{ height: 12 }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      background: isCompleted
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #3b82f6, #10b981)',
                    }}
                  ></div>
                </div>

                {/* Footer Actions */}
                <div className="goal-footer-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setGoalForFunds(g);
                      setIsFundModalOpen(true);
                    }}
                    title="Add money to this goal"
                  >
                    <PlusCircle size={15} />
                    <span>Add Funds</span>
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={() => {
                        setGoalToEdit(g);
                        setIsGoalModalOpen(true);
                      }}
                      title="Edit goal"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action delete-action"
                      onClick={() => handleDeleteGoal(g)}
                      title="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Create / Edit Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        onSuccess={() => {
          fetchGoalsAndSavings();
          if (onRefresh) onRefresh();
        }}
        goalToEdit={goalToEdit}
      />

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={isFundModalOpen}
        onClose={() => {
          setIsFundModalOpen(false);
          setGoalForFunds(null);
        }}
        onSuccess={() => {
          fetchGoalsAndSavings();
          if (onRefresh) onRefresh();
        }}
        goal={goalForFunds}
      />
    </div>
  );
};

export default GoalsPage;
