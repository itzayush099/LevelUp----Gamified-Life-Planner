// src/components/dashboard/FocusCard.jsx

import React, { useState, useEffect } from 'react';
import { Compass, Lightbulb, Trophy } from 'lucide-react';

const TIPS = [
  "Complete Critical tasks first thing in the morning to capture high XP early.",
  "Avoid scheduling more than 8 hours daily to prevent cognitive fatigue and burnout.",
  "Break large tasks into 50-minute focused blocks followed by a 10-minute active break.",
  "Completing tasks at 80% duration is the threshold to claim your XP reward.",
  "Consistent daily scheduling preserves your quest streak. Keep the fire burning!"
];

const FocusCard = ({ currentStreak, tasks = [] }) => {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIdx((prev) => (prev + 1) % TIPS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const hasTasks = tasks.length > 0;
  const hasCompletedCritical = tasks.some(t => t.priority === 50 && t.currentStatus === 'Completed');
  const allTasksCompleted = hasTasks && tasks.every(t => t.currentStatus === 'Completed');

  const ACHIEVEMENTS = [
    { id: 'start', label: 'Quest Starter', desc: 'Create your first task today', done: hasTasks },
    { id: 'critical', label: 'Overcoming Giants', desc: 'Complete a Critical priority task', done: hasCompletedCritical },
    { id: 'allCompleted', label: 'Daily Champion', desc: 'Complete all scheduled tasks today', done: allTasksCompleted },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 h-fit w-full">
      {/* Header */}
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Compass className="w-4 h-4 text-indigo-500 animate-spin-slow" /> Adventure Guide
      </h3>

      {/* Tip of the day */}
      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3.5 flex gap-3 items-start">
        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">Focus Tip</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed transition-all duration-500">
            {TIPS[tipIdx]}
          </p>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Quest Achievements
        </h4>
        <div className="space-y-2">
          {ACHIEVEMENTS.map((ach) => {
            const isDone = ach.done;
            return (
              <div key={ach.id} className="flex items-start gap-3 p-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  isDone 
                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                    : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                }`}>
                  {isDone ? '✓' : '⚡'}
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${isDone ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                    {ach.label}
                  </h5>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FocusCard;
