// src/components/analytics/AnalyticsPanel.jsx

import React from 'react';
import { PieChart } from 'lucide-react';
import CategoryStats from './CategoryStats';

const AnalyticsPanel = ({ analytics, selectedDate, isPastDate }) => (
  <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 ${isPastDate ? 'opacity-80' : ''}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <PieChart className="w-5 h-5 text-indigo-500" /> Daily Analytics
      </h3>
      <span className="text-xs font-bold text-gray-500 uppercase">{selectedDate}</span>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 font-semibold uppercase">Total Tasks</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{analytics.total}</p>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800 text-center">
        <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">Completed</p>
        <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">{analytics.completed}</p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Pending</p>
        <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">{analytics.pending}</p>
      </div>
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center">
        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase">XP Earned</p>
        <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{analytics.xpEarnedToday}</p>
      </div>
    </div>

    <CategoryStats catStats={analytics.catStats} />
  </div>
);

export default AnalyticsPanel;
