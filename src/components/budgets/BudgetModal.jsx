// ==============================================================================
// SpendWise - Budget Modal Component (Create & Edit)
// ==============================================================================
// Description:
// Dialog enabling users to define or adjust a monthly spending cap for any
// of the standard expense categories. Automatically prevents duplicate categories.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { EXPENSE_CATEGORIES } from '../transactions/TransactionModal';
import { X, AlertCircle } from 'lucide-react';
import '../../styles/transactions.css';

const BudgetModal = ({
  isOpen,
  onClose,
  onSuccess,
  budgetToEdit = null,
  existingBudgetCategories = [],
}) => {
  const { user } = useAuth();
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (budgetToEdit) {
      setCategory(budgetToEdit.category);
      setLimit(budgetToEdit.monthly_limit ? budgetToEdit.monthly_limit.toString() : '');
    } else {
      // Pick first category that doesn't have a budget yet, or default
      const available = EXPENSE_CATEGORIES.find(
        (cat) => !existingBudgetCategories.includes(cat)
      );
      setCategory(available || EXPENSE_CATEGORIES[0]);
      setLimit('');
    }
    setError('');
  }, [budgetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericLimit = parseFloat(limit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      setError('Please enter a valid monthly limit greater than ₹0.');
      return;
    }

    // Check if category is already taken (when creating new)
    if (!budgetToEdit && existingBudgetCategories.includes(category)) {
      setError(`A monthly budget for "${category}" already exists. You can edit it instead.`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: user.id,
        category,
        monthly_limit: numericLimit,
      };

      if (budgetToEdit) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update(payload)
          .eq('id', budgetToEdit.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('budgets')
          .insert([payload]);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError(err.message || 'Failed to save budget limit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {budgetToEdit ? 'Edit Category Budget' : 'Set Category Budget'}
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
              <label className="form-label" htmlFor="budget-category">
                Expense Category *
              </label>
              <select
                id="budget-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={Boolean(budgetToEdit)}
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="budget-limit">
                Monthly Spending Limit (₹) *
              </label>
              <input
                id="budget-limit"
                type="number"
                step="1"
                min="1"
                className="form-control"
                placeholder="e.g. 5000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
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
                  <span>Saving...</span>
                </>
              ) : budgetToEdit ? (
                'Save Changes'
              ) : (
                'Set Budget'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
