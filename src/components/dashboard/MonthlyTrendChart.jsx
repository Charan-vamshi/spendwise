// ==============================================================================
// SpendWise - Monthly Income vs Expense Trend Chart
// ==============================================================================
// Description:
// Bar chart comparing total income (green) and total expenses (red) across
// recent months using Chart.js & react-chartjs-2.
// ==============================================================================

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../transactions/TransactionList';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyTrendChart = ({ allTransactions = [], darkMode = false }) => {
  // Generate the last 6 months keys: ['2026-05', '2026-06', ..., '2026-10']
  const monthMap = {};
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap[key] = { label, income: 0, expense: 0 };
  }

  // Populate data from user transactions
  allTransactions.forEach((tx) => {
    if (!tx.date) return;
    const key = tx.date.substring(0, 7); // YYYY-MM
    if (monthMap[key]) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        monthMap[key].income += amt;
      } else if (tx.type === 'expense') {
        monthMap[key].expense += amt;
      }
    }
  });

  const monthKeys = Object.keys(monthMap);
  const labels = monthKeys.map((k) => monthMap[k].label);
  const incomeData = monthKeys.map((k) => monthMap[k].income);
  const expenseData = monthKeys.map((k) => monthMap[k].expense);

  const hasData = incomeData.some((v) => v > 0) || expenseData.some((v) => v > 0);

  if (!hasData) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem', border: 'none' }}>
        <div className="empty-state-icon" style={{ width: 44, height: 44 }}>
          <TrendingUp size={22} />
        </div>
        <p className="empty-state-title" style={{ fontSize: '0.95rem' }}>
          No trend data yet
        </p>
        <p className="empty-state-desc" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
          Record income and expenses across months to view your financial growth.
        </p>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        backgroundColor: '#10b981', // Emerald green
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Expenses',
        data: expenseData,
        backgroundColor: '#ef4444', // Red
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: darkMode ? '#cbd5e1' : '#475569',
          font: {
            size: 11,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return ` ${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
        },
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b',
          font: {
            size: 11,
          },
          callback: (value) => {
            if (value >= 1000) {
              return `₹${value / 1000}k`;
            }
            return `₹${value}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '260px' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default MonthlyTrendChart;
