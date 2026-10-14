// ==============================================================================
// SpendWise - Goal Modal Component (Create & Edit)
// ==============================================================================
// Description:
// Dialog for establishing or updating a savings goal.
// Includes automatic schema-fallback so it works seamlessly whether your
// Supabase goals table has the 'current_amount' column or only 'target_amount'.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { X, AlertCircle } from 'lucide-react';
import '../../styles/transactions.css';

const GoalModal = ({ isOpen, onClose, onSuccess, goalToEdit = null }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || '');
      setTargetAmount(goalToEdit.target_amount ? goalToEdit.target_amount.toString() : '');
      setCurrentAmount(
        goalToEdit.current_amount !== undefined && goalToEdit.current_amount !== null
          ? goalToEdit.current_amount.toString()
          : '0'
      );
    } else {
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
    }
    setError('');
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a goal title.');
      return;
    }

    const numericTarget = parseFloat(targetAmount);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      setError('Please enter a valid target amount greater than ₹0.');
      return;
    }

    const numericCurrent = parseFloat(currentAmount) || 0;
    if (numericCurrent < 0) {
      setError('Current saved amount cannot be negative.');
      return;
    }

    setLoading(true);

    try {
      const fullPayload = {
        user_id: user.id,
        title: title.trim(),
        target_amount: numericTarget,
        current_amount: numericCurrent,
      };

      const fallbackPayload = {
        user_id: user.id,
        title: title.trim(),
        target_amount: numericTarget,
      };

      if (goalToEdit) {
        // Try updating with current_amount first
        let { error: updateError } = await supabase
          .from('goals')
          .update(fullPayload)
          .eq('id', goalToEdit.id);

        // If current_amount column does not exist in Supabase, retry without it
        if (updateError && updateError.message?.includes('current_amount')) {
          const { error: retryError } = await supabase
            .from('goals')
            .update(fallbackPayload)
            .eq('id', goalToEdit.id);

          if (retryError) throw retryError;
        } else if (updateError) {
          throw updateError;
        }
      } else {
        // Try inserting with current_amount first
        let { error: insertError } = await supabase
          .from('goals')
          .insert([fullPayload]);

        // If current_amount column does not exist in Supabase, retry without it
        if (insertError && insertError.message?.includes('current_amount')) {
          const { error: retryError } = await supabase
            .from('goals')
            .insert([fallbackPayload]);

          if (retryError) throw retryError;
        } else if (insertError) {
          throw insertError;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving savings goal:', err);
      setError(err.message || 'Failed to save goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {goalToEdit ? 'Edit Savings Goal' : 'Create New Savings Goal'}
          </h2>
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
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="goal-title">
                Goal Title *
              </label>
              <input
                id="goal-title"
                type="text"
                className="form-control"
                placeholder="e.g. Emergency Fund, New Bike, Laptop"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="goal-target">
                Target Amount (₹) *
              </label>
              <input
                id="goal-target"
                type="number"
                step="1"
                min="1"
                className="form-control"
                placeholder="e.g. 50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="goal-current">
                Already Saved Amount (₹)
              </label>
              <input
                id="goal-current"
                type="number"
                step="1"
                min="0"
                className="form-control"
                placeholder="e.g. 5000"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
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
                  <span>Saving...</span>
                </>
              ) : goalToEdit ? (
                'Save Changes'
              ) : (
                'Create Goal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
