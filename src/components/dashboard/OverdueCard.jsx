// src/components/dashboard/OverdueCard.jsx

import React from 'react';
import { AlertTriangle } from 'lucide-react';

const OverdueCard = ({ overdueCount, selectedDate }) => {
  const hasOverdue = overdueCount > 0;
  return (
    <div
      className={`border rounded-2xl p-5 flex flex-col justify-center items-center shadow-sm transition-colors ${
        hasOverdue
          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'
          : 'bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800'
      }`}
    >
      <AlertTriangle
        className={`w-8 h-8 mb-2 ${
          hasOverdue ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
      <p
        className={`text-2xl font-bold ${
          hasOverdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'
        }`}
      >
        {overdueCount}
      </p>
      <p
        className={`text-xs font-medium mt-1 text-center ${
          hasOverdue ? 'text-red-600 dark:text-red-500' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        Overdue<br />({selectedDate})
      </p>
    </div>
  );
};

export default OverdueCard;
