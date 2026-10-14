// ==============================================================================
// SpendWise - Transaction Modal Component (Add & Edit)
// ==============================================================================
// Description:
// Provides a unified popup dialog to create or update an existing transaction.
// Automatically switches category lists depending on whether the transaction
// type is 'expense' or 'income'. Handles Supabase persistence and form validation.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { X, AlertCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import '../../styles/transactions.css';

// Predefined categories as per project requirements
export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Rent',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Pocket Money',
  'Freelance',
  'Gift',
  'Other',
];

const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit = null,
}) => {
  const { user } = useAuth();

  // Form states
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate fields if editing an existing transaction
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'expense');
      setAmount(transactionToEdit.amount ? transactionToEdit.amount.toString() : '');
      setCategory(transactionToEdit.category || EXPENSE_CATEGORIES[0]);
      setDate(
        transactionToEdit.date || new Date().toISOString().split('T')[0]
      );
      setNote(transactionToEdit.note || '');
      setIsRecurring(Boolean(transactionToEdit.is_recurring));
    } else {
      // Default reset for Add mode
      setType('expense');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setIsRecurring(false);
    }
    setError('');
  }, [transactionToEdit, isOpen]);

  // When type changes, default category to the first item in the new type list
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(
      newType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]
    );
  };

  if (!isOpen) return null;

  // Handle Form Submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!category.trim()) {
      setError('Please select a valid category.');
      return;
    }

    if (!date) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: user.id,
        type,
        amount: numericAmount,
        category,
        date,
        note: note.trim() || null,
        is_recurring: isRecurring,
      };

      if (transactionToEdit) {
        // UPDATE existing record in Supabase
        const { error: updateError } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', transactionToEdit.id);

        if (updateError) throw updateError;
      } else {
        // INSERT new record into Supabase
        const { error: insertError } = await supabase
          .from('transactions')
          .insert([payload]);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError(err.message || 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
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

        {/* Body & Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Error Notification */}
            {error && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Type Toggle: Expense vs Income */}
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-toggle-btn ${
                  type === 'expense' ? 'active-expense' : ''
                }`}
                onClick={() => handleTypeChange('expense')}
              >
                <ArrowDownCircle size={18} />
                <span>Expense</span>
              </button>
              <button
                type="button"
                className={`type-toggle-btn ${
                  type === 'income' ? 'active-income' : ''
                }`}
                onClick={() => handleTypeChange('income')}
              >
                <ArrowUpCircle size={18} />
                <span>Income</span>
              </button>
            </div>

            {/* Amount Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-amount">
                Amount (₹) *
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Category Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-category">
                Category *
              </label>
              <select
                id="tx-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-date">
                Date *
              </label>
              <input
                id="tx-date"
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Optional Note */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-note">
                Note / Description (Optional)
              </label>
              <input
                id="tx-note"
                type="text"
                className="form-control"
                placeholder="e.g. Groceries at supermarket"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Recurring Checkbox */}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span>Mark as recurring (monthly bill/salary/subscription)</span>
            </label>
          </div>

          {/* Footer Buttons */}
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
              className={`btn ${
                type === 'expense' ? 'btn-danger' : 'btn-primary'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Saving...</span>
                </>
              ) : transactionToEdit ? (
                'Save Changes'
              ) : (
                'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
