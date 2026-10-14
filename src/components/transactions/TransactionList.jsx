// ==============================================================================
// SpendWise - Transaction List Component
// ==============================================================================
// Description:
// Fetches and displays all user transactions ordered by date descending.
// Formats amounts in Indian Rupees (₹), dates in DD/MM/YYYY, and displays
// color-coded badges for Income (green) and Expense (red). Supports editing
// and deleting with instant database synchronization.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  Pencil,
  Trash2,
  Plus,
  Repeat,
  Inbox,
  AlertCircle,
  Calendar,
  Tag,
  DollarSign,
} from 'lucide-react';
import '../../styles/transactions.css';

// Helper function to format numeric currency to Indian Rupees (₹)
export const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

// Helper function to format YYYY-MM-DD date strings to DD/MM/YYYY
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const TransactionList = ({
  onOpenAddModal,
  onEditTransaction,
  refreshTrigger,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Could not load transactions. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, refreshTrigger]);

  // Handle Deleting a Transaction
  const handleDelete = async (tx) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this ${tx.type} of ${formatCurrency(
        tx.amount
      )} (${tx.category})?`
    );

    if (!isConfirmed) return;

    setDeletingId(tx.id);
    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', tx.id);

      if (deleteError) throw deleteError;

      // Optimistically remove from state
      setTransactions((prev) => prev.filter((item) => item.id !== tx.id));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your transactions...</p>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      {/* Header bar */}
      <div className="transactions-header-bar">
        <div>
          <h2 className="transactions-header-title">Transactions</h2>
          <p className="transactions-subtitle">
            View, track, edit, and organize all your financial activities
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenAddModal}
        >
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={28} />
          </div>
          <h3 className="empty-state-title">No transactions yet</h3>
          <p className="empty-state-desc">
            Keep track of where your money goes. Add your first income or expense entry!
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddModal}
          >
            <Plus size={18} />
            <span>Add Your First Transaction</span>
          </button>
        </div>
      ) : (
        /* Transactions Table */
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note / Details</th>
                <th>Type</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id}>
                    {/* Date (DD/MM/YYYY) */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {formatDisplayDate(tx.date)}
                    </td>

                    {/* Category & Recurring Tag */}
                    <td>
                      <span className="category-pill">
                        {tx.category}
                      </span>
                      {tx.is_recurring && (
                        <span className="recurring-tag" title="Monthly recurring">
                          <Repeat size={12} />
                          <span>Monthly</span>
                        </span>
                      )}
                    </td>

                    {/* Note / Description */}
                    <td>
                      {tx.note ? (
                        <span>{tx.note}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td>
                      <span
                        className={`badge ${
                          isIncome ? 'badge-income' : 'badge-expense'
                        }`}
                      >
                        {isIncome ? 'Income' : 'Expense'}
                      </span>
                    </td>

                    {/* Amount formatted with ₹ */}
                    <td>
                      <span
                        className={`amount-text ${
                          isIncome ? 'amount-income' : 'amount-expense'
                        }`}
                      >
                        {isIncome ? '+ ' : '- '}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Action buttons (Edit & Delete) */}
                    <td style={{ textAlign: 'right' }}>
                      <div
                        className="action-buttons"
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => onEditTransaction(tx)}
                          title="Edit transaction"
                          aria-label="Edit transaction"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete-action"
                          onClick={() => handleDelete(tx)}
                          disabled={deletingId === tx.id}
                          title="Delete transaction"
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
