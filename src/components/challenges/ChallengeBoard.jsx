// src/components/challenges/ChallengeBoard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Target, CheckCircle2, Award, Clock, Plus, Flame, Activity } from 'lucide-react';
import { getDailyChallenges } from '../../data/challengesData';
import { getLevelData } from '../../utils/levelUtils';

const priorityMap = {
  'Easy': 10,
  'Medium': 30,
  'Hard': 50
};

const ChallengeBoard = ({ profile, updateProfileData, tasks, selectedDate, addTask, showSuccess, showError }) => {
  const challenges = useMemo(() => getDailyChallenges(selectedDate), [selectedDate]);
  
  const history = profile.challengeHistory || {};
  const todayHistory = history[selectedDate] || { completedIds: [], xpEarned: 0 };
  
  const [justAdded, setJustAdded] = useState(null);

  // Auto-complete challenges based on tasks
  useEffect(() => {
    let newlyCompleted = false;
    let newXpEarned = todayHistory.xpEarned || 0;
    let newCompletedIds = [...(todayHistory.completedIds || [])];
    let newXpProfile = profile.xp;
    
    challenges.forEach(challenge => {
      if (!newCompletedIds.includes(challenge.id)) {
        // Is it completed in tasks?
        const isTaskCompleted = tasks.some(t => t.name === challenge.title && t.currentStatus === 'Completed');
        if (isTaskCompleted) {
          newCompletedIds.push(challenge.id);
          // XP is actually awarded by useTasks when a task completes, 
          // but we track challenge-specific XP in history.
          newXpEarned += challenge.reward;
          newlyCompleted = true;
          showSuccess(`Challenge Completed: ${challenge.title}!`);
        }
      }
    });

    if (newlyCompleted) {
      updateProfileData({
        challengeHistory: {
          ...history,
          [selectedDate]: {
            completedIds: newCompletedIds,
            xpEarned: newXpEarned
          }
        }
      });
    }
  }, [tasks, challenges, selectedDate, todayHistory, profile.xp, history, updateProfileData, showSuccess]);

  const handleAddTask = async (challenge) => {
    try {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const nowTimeStr = `${currentHour}:${currentMinute}`;

      await addTask({
        name: challenge.title,
        date: selectedDate,
        startTime: nowTimeStr,
        endTime: '23:59',
        time: 0.5,
        priority: priorityMap[challenge.difficulty] || 20,
        category: 'Challenge',
        status: 'Not Started',
        notes: challenge.desc,
        recurrence: 'One Time',
        xpReward: challenge.reward // Will be awarded by useTasks.js
      });
      
      setJustAdded(challenge.id);
      setTimeout(() => setJustAdded(null), 2000);
    } catch (e) {
      console.error(e);
      showError("Failed to add challenge task.");
    }
  };

  const completedCount = todayHistory.completedIds?.length || 0;
  const pct = Math.round((completedCount / challenges.length) * 100);

  // Compute Weekly XP
  const weeklyXP = Object.keys(history).reduce((sum, date) => {
    // Simple 7-day lookback could go here
    return sum + (history[date].xpEarned || 0);
  }, 0);

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 blur-xl rounded-full"></div>
          <Target className="w-5 h-5 text-indigo-400 mb-2" />
          <span className="text-3xl font-black text-white">{completedCount}<span className="text-sm text-gray-500">/6</span></span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Today's Progress</span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-xl rounded-full"></div>
          <Award className="w-5 h-5 text-yellow-400 mb-2" />
          <span className="text-3xl font-black text-white">{todayHistory.xpEarned || 0}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">XP Earned Today</span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full"></div>
          <Activity className="w-5 h-5 text-emerald-400 mb-2" />
          <span className="text-3xl font-black text-white">{pct}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Completion Rate</span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 blur-xl rounded-full"></div>
          <Flame className="w-5 h-5 text-orange-400 mb-2" />
          <span className="text-3xl font-black text-white">{weeklyXP}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Total Lifetime XP</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-inner">
        <div className="flex justify-between items-center text-[10px] font-bold mb-2">
          <span className="text-gray-400 uppercase tracking-wider">Daily Challenge Progress</span>
          <span className="text-indigo-400">{pct}%</span>
        </div>
        <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden relative">
          <div className="h-2.5 rounded-full transition-all duration-1000 bg-gradient-to-r from-indigo-500 to-purple-500"
            style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map(challenge => {
          const isCompleted = todayHistory.completedIds?.includes(challenge.id);
          const isTaskAdded = tasks.some(t => t.name === challenge.title);
          
          let difficultyColor = 'text-green-400 border-green-400/20 bg-green-400/10';
          if (challenge.difficulty === 'Medium') difficultyColor = 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
          if (challenge.difficulty === 'Hard') difficultyColor = 'text-red-400 border-red-400/20 bg-red-400/10';

          return (
            <div key={challenge.id} className={`border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
              isCompleted 
                ? 'border-green-500/30 bg-green-900/10' 
                : 'border-gray-800 bg-gray-900 hover:border-indigo-500/50'
            }`}>
              
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${difficultyColor}`}>
                  {challenge.difficulty}
                </span>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider bg-indigo-900/30 px-2 py-1 rounded">
                  {challenge.category}
                </span>
              </div>

              <div>
                <h3 className={`text-lg font-black mb-1 flex items-center gap-2 ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                  {challenge.title} {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </h3>
                <p className="text-xs text-gray-400 font-medium mb-4">{challenge.desc}</p>
              </div>

              <div className="flex justify-between items-center mt-auto">
                <div className="flex items-center gap-1.5 text-yellow-400 font-black text-sm">
                  <Award className="w-4 h-4" /> +{challenge.reward} XP
                </div>
                
                {isCompleted ? (
                  <span className="text-[10px] font-bold text-green-400 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                ) : justAdded === challenge.id ? (
                  <span className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1 bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-3 h-3" /> Added to Tasks
                  </span>
                ) : isTaskAdded ? (
                  <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> In Planner
                  </span>
                ) : (
                  <button 
                    onClick={() => handleAddTask(challenge)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add To Tasks
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengeBoard;
