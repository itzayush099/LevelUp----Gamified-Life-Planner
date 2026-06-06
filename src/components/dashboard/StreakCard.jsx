// src/components/dashboard/StreakCard.jsx

import React, { useState } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const StreakCard = ({ currentStreak, bestStreak, streakDates = [] }) => {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based

  // Build a Set of 'YYYY-MM-DD' strings for O(1) lookup
  const flameSet = new Set(streakDates);
  const todayStr = today.toISOString().split('T')[0];

  // Navigate months
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Block navigation into the future
  const isCurrentOrFuture =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  // Calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-sm flex flex-col">
      {/* Header: streak count + navigation */}
      <div className="flex items-center justify-between mb-1.5">
        {/* Streak badge */}
        <div className="flex items-center gap-1">
          <Flame
            className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}`}
          />
          <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">
            {currentStreak}
            <span className="text-xs font-normal text-gray-400 ml-0.5">d</span>
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">best {bestStreak}</span>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          </button>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[64px] text-center">
            {MONTHS[viewMonth].slice(0, 3)} {viewYear !== today.getFullYear() ? viewYear : ''}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentOrFuture}
            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-semibold text-gray-400 dark:text-gray-600">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-0.5 flex-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;

          const mm   = String(viewMonth + 1).padStart(2, '0');
          const dd   = String(day).padStart(2, '0');
          const dateStr = `${viewYear}-${mm}-${dd}`;
          const isFlame = flameSet.has(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              title={isFlame ? `🔥 Completed on ${dateStr}` : dateStr}
              className={`flex items-center justify-center rounded-sm text-[10px] h-5 transition-colors ${
                isToday
                  ? 'ring-1 ring-indigo-500 ring-offset-0 font-bold'
                  : ''
              } ${
                isFlame
                  ? 'bg-orange-50 dark:bg-orange-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
              }`}
            >
              {isFlame ? (
                <Flame className="w-3 h-3 text-orange-500" />
              ) : (
                <span className={`${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-500'}`}>
                  {day}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakCard;
