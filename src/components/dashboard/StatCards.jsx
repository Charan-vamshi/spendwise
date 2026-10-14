// ==============================================================================
// SpendWise - StatCards Component
// ==============================================================================
// Description:
// Displays 3 primary financial metrics for the selected month:
// 1. Total Income (Green)
// 2. Total Expenses (Red)
// 3. Net Savings (Income - Expenses) with dynamic status and savings percentage.
// ==============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../transactions/TransactionList';

const StatCards = ({ totalIncome, totalExpenses, savings, incomeCount, expenseCount }) => {
  // Calculate savings percentage of income
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
  const isPositiveSavings = savings >= 0;

  return (
    <div className="stats-cards-grid">
      {/* 1. Total Income Card */}
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-label">Total Income</span>
          <div className="stat-icon-badge stat-icon-income">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
          {formatCurrency(totalIncome)}
        </div>
        <div className="stat-subtext">
          <span className="badge badge-income">
            <ArrowUpRight size={12} /> {incomeCount} {incomeCount === 1 ? 'entry' : 'entries'}
          </span>
          <span>received this month</span>
        </div>
      </div>

      {/* 2. Total Expenses Card */}
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-label">Total Expenses</span>
          <div className="stat-icon-badge stat-icon-expense">
            <TrendingDown size={20} />
          </div>
        </div>
        <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
          {formatCurrency(totalExpenses)}
        </div>
        <div className="stat-subtext">
          <span className="badge badge-expense">
            <ArrowDownRight size={12} /> {expenseCount} {expenseCount === 1 ? 'entry' : 'entries'}
          </span>
          <span>spent this month</span>
        </div>
      </div>

      {/* 3. Net Savings Card */}
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-label">Net Savings</span>
          <div className="stat-icon-badge stat-icon-savings">
            <PiggyBank size={20} />
          </div>
        </div>
        <div
          className="stat-value"
          style={{
            color: isPositiveSavings ? 'var(--color-primary)' : 'var(--color-danger)',
          }}
        >
          {isPositiveSavings ? '+ ' : ''}
          {formatCurrency(savings)}
        </div>
        <div className="stat-subtext">
          {totalIncome > 0 ? (
            <span
              className={`badge ${
                isPositiveSavings ? 'badge-income' : 'badge-expense'
              }`}
            >
              {savingsRate}% saved
            </span>
          ) : (
            <span className="badge badge-expense">0% saved</span>
          )}
          <span>
            {isPositiveSavings ? 'retained from income' : 'exceeded total income'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
