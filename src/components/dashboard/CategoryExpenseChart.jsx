// ==============================================================================
// SpendWise - Category Expense Breakdown Chart
// ==============================================================================
// Description:
// Interactive Doughnut chart rendering expense distribution by category
// using Chart.js & react-chartjs-2. Shows category amounts and proportions.
// ==============================================================================

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PieChart as PieIcon } from 'lucide-react';
import { formatCurrency } from '../transactions/TransactionList';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Attractive and accessible color palette for categories
const CATEGORY_COLORS = [
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#64748b', // Slate
];

const CategoryExpenseChart = ({ expenses = [], darkMode = false }) => {
  // Aggregate expenses by category
  const categoryTotals = expenses.reduce((acc, tx) => {
    const cat = tx.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Number(tx.amount || 0);
    return acc;
  }, {});

  const labels = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);
  const totalExpense = dataValues.reduce((sum, val) => sum + val, 0);

  if (labels.length === 0 || totalExpense === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem', border: 'none' }}>
        <div className="empty-state-icon" style={{ width: 44, height: 44 }}>
          <PieIcon size={22} />
        </div>
        <p className="empty-state-title" style={{ fontSize: '0.95rem' }}>
          No expenses this month
        </p>
        <p className="empty-state-desc" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
          Add your daily expenses to see a breakdown by category.
        </p>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: CATEGORY_COLORS.slice(0, labels.length),
        borderColor: darkMode ? '#1e293b' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#cbd5e1' : '#475569',
          font: {
            size: 11,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : 0;
            return ` ${label}: ${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '260px' }}>
      <Doughnut data={chartData} options={chartOptions} />
    </div>
  );
};

export default CategoryExpenseChart;
