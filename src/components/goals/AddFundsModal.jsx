// ==============================================================================
// SpendWise - Add Funds to Savings Goal Modal
// ==============================================================================
// Description:
// Quick modal enabling users to log an incremental deposit towards a savings goal.
// Handles schema detection gracefully.
// ==============================================================================

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../transactions/TransactionList';
import '../../styles/transactions.css';

const AddFundsModal = ({ isOpen, onClose, onSuccess, goal }) => {
  const [amountToAdd, setAmountToAdd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericAdd = parseFloat(amountToAdd);
    if (isNaN(numericAdd) || numericAdd <= 0) {
      setError('Please enter an amount greater than ₹0.');
      return;
    }

    setLoading(true);

    try {
      const newTotal = Number(goal.current_amount || 0) + numericAdd;
      const { error: updateError } = await supabase
        .from('goals')
        .update({ current_amount: newTotal })
        .eq('id', goal.id);

      if (updateError) {
        if (updateError.message?.includes('current_amount')) {
          setError(
            'To enable per-goal fund deposits, please run this 1-line SQL in your Supabase SQL Editor: ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;'
          );
          setLoading(false);
          return;
        }
        throw updateError;
      }

      onSuccess();
      onClose();
      setAmountToAdd('');
    } catch (err) {
      console.error('Error adding funds to goal:', err);
      setError(err.message || 'Failed to update goal funds.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Funds to "{goal.title}"</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert" style={{ whiteSpace: 'pre-wrap' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Target: <strong>{formatCurrency(goal.target_amount)}</strong>.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="fund-amount">
                Amount to Add (₹) *
              </label>
              <input
                id="fund-amount"
                type="number"
                step="1"
                min="1"
                className="form-control"
                placeholder="e.g. 2000"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Updating...</span>
                </>
              ) : (
                'Add to Goal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFundsModal;
