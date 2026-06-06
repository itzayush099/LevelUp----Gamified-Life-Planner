// src/components/capacity/CapacityTracker.jsx

import React from 'react';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const CapacityTracker = ({ scheduledHours, maxHours, onMaxHoursChange, selectedDate }) => {
  const isOverloaded = scheduledHours > maxHours;
  const barPercentage = Math.min((scheduledHours / maxHours) * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-fit self-start w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> Daily Capacity
        </h3>
        <input type="number" value={maxHours} onChange={(e) => onMaxHoursChange(e.target.value)}
          className="w-16 text-center text-sm px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
          title="Max Productive Hours" />
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Planned ({selectedDate})</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {scheduledHours} <span className="text-sm font-normal text-gray-500">/ {maxHours} hrs</span>
          </span>
        </div>

        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 mb-4 overflow-hidden relative">
          <div className={`h-4 rounded-full transition-all duration-500 ease-out ${isOverloaded ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${barPercentage}%` }}></div>
        </div>

        {isOverloaded ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-medium flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>You have scheduled {scheduledHours} hours. Consider reducing workload to avoid burnout.</p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-xl text-sm font-medium flex gap-2 items-center">
            <CheckCircle className="w-4 h-4" />
            <p>Capacity looks great!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapacityTracker;
