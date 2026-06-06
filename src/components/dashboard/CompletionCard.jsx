// src/components/dashboard/CompletionCard.jsx

import React from 'react';
import { PieChart } from 'lucide-react';

const CompletionCard = ({ completionRate, selectedDate }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col justify-center items-center shadow-sm">
    <PieChart className="w-8 h-8 mb-2 text-blue-500" />
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{completionRate}%</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 text-center">
      Completion<br />({selectedDate})
    </p>
  </div>
);

export default CompletionCard;
