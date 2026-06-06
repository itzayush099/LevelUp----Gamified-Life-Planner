// src/components/tasks/Timeline.jsx

import React from 'react';
import { Clock, CheckCircle, Sparkles, Lock, Repeat } from 'lucide-react';
import { PRIORITIES, getPriorityTailwind } from '../../constants/priorities';
import { formatTimer } from '../../utils/timerUtils';

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Skipped'];

const Timeline = ({ tasks, selectedDate, todayStr, isPastDate, isFutureDate, onStatusChange }) => (
  <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <Clock className="w-5 h-5 text-indigo-500" /> Schedule for {selectedDate === todayStr ? 'Today' : selectedDate}
    </h3>

    {tasks.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 mt-4 animate-scale-in">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-full flex items-center justify-center mb-4 shadow-sm animate-pulse-glow">
          <Sparkles className="w-6 h-6 text-indigo-500" />
        </div>
        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          Your Schedule is Clear!
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          No quests or study sessions scheduled for this date. Use quick templates or create a custom task to start earning XP!
        </p>
      </div>
    ) : (
      <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-3 mt-4 space-y-6">
        {tasks.map((task) => (
          <div key={task.id} className="relative pl-6">
            <div
              className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                task.currentStatus === 'Completed'   ? 'bg-green-500' :
                task.currentStatus === 'In Progress' ? 'bg-blue-500 animate-pulse' :
                task.priority === 50 ? 'bg-red-500' :
                task.priority === 30 ? 'bg-orange-500' :
                'bg-gray-300 dark:bg-gray-600'
              }`}
            ></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {task.startTime} - {task.endTime}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">({task.time}h)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getPriorityTailwind(task.priority)}`}>
                    {PRIORITIES.find((p) => p.value === task.priority)?.label}
                  </span>
                  {task.xpReward && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/30">
                      +{task.xpReward} XP
                    </span>
                  )}
                  {task.recurrence !== 'One Time' && (
                    <Repeat className="w-3.5 h-3.5 text-gray-400" title={task.recurrence} />
                  )}
                </div>

                <h4 className={`font-medium ${
                  task.currentStatus === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'
                }`}>
                  {task.name}
                </h4>

                {/* Timer Progress Panel */}
                {task.timerActive && (
                  <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
                    <div className="flex justify-between text-xs font-bold mb-1.5 text-indigo-800 dark:text-indigo-300">
                      <span>Task Progress: {task.progressPercentage.toFixed(0)}%</span>
                      <span>Unlock At: 80%</span>
                    </div>
                    <div className="w-full bg-indigo-200/50 dark:bg-indigo-950 rounded-full h-2 mb-3 relative overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 absolute left-0 top-0 transition-all duration-1000"
                        style={{ width: `${task.progressPercentage}%` }}
                      ></div>
                      <div className="w-1 h-3 bg-red-500 absolute -top-0.5 z-10 rounded-full" style={{ left: '80%' }}></div>
                    </div>

                    {task.timerExpired ? (
                      <div className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5 bg-green-100/50 dark:bg-green-900/30 p-2 rounded-lg">
                        <Sparkles className="w-4 h-4" /> ⏰ Scheduled duration finished. You can mark Completed, Skip, or Continue.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold">
                          {task.isEligibleForCompletion ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> 80% reached! "Completed" button is now unlocked.
                            </span>
                          ) : (
                            <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 shrink-0" /> Complete at least 80% before marking finished. (Wait {formatTimer(task.remainingUnlockMs)})
                            </span>
                          )}
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg w-fit shadow-sm">
                          <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                            TOTAL REMAINING: <span className="text-blue-600 dark:text-blue-400">{formatTimer(task.remainingMs)}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isFutureDate ? (
                  <div className="text-xs font-bold px-3 py-2 rounded-xl border bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50 flex items-center gap-1.5 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">Available on Scheduled Date</span>
                    <span className="sm:hidden">Locked</span>
                  </div>
                ) : (
                  <select
                    value={task.currentStatus}
                    onChange={(e) => onStatusChange(task.id, task, e.target.value)}
                    disabled={isPastDate}
                    className={`text-xs font-bold px-2 py-1.5 rounded-lg border outline-none bg-white dark:bg-gray-900 ${
                      isPastDate ? 'opacity-70 cursor-not-allowed ' : 'cursor-pointer '
                    } ${
                      task.currentStatus === 'Completed'   ? 'text-green-600 border-green-200 dark:border-green-900' :
                      task.currentStatus === 'In Progress' ? 'text-blue-600 border-blue-200 dark:border-blue-900' :
                      'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}
                        disabled={s === 'Completed' && !task.isEligibleForCompletion && task.currentStatus !== 'Completed'}
                      >
                        {s}{s === 'Completed' && !task.isEligibleForCompletion && task.currentStatus !== 'Completed' ? ' 🔒' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default Timeline;
