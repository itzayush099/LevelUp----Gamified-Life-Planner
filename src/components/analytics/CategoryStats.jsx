// src/components/analytics/CategoryStats.jsx

import React from 'react';
import { CATEGORIES } from '../../constants/categories';

const CategoryStats = ({ catStats }) => (
  <div>
    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
      Category Performance
    </h4>
    <div className="space-y-3">
      {CATEGORIES.map((cat) => (
        <div key={cat} className="flex flex-col">
          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            <span>{cat}</span>
            <span>{catStats[cat] || 0}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${catStats[cat] || 0}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CategoryStats;
