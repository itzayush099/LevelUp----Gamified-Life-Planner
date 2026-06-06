// src/components/meals/pages/GamificationView.jsx
import React, { useMemo } from 'react';
import { Medal, Trophy, Target, Star, Zap, Activity, Droplets, CheckCircle, Clock, Play, Trash2, CheckCircle2, History, Award } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';

const LEVEL_NAMES = [
  'Nutrition Seed', 'Sprout', 'Seedling', 'Sapling', 'Growing Plant',
  'Sturdy Branch', 'Strong Tree', 'Mighty Oak', 'Forest Guardian', 'Nutrition Master'
];

export default function GamificationView({ user, nutritionXP, activeChallenge, challengeHistory = [], completeActiveChallenge, db, appId, showToast }) {
  
  const calculateLevel = (xp) => {
    let level = 1;
    let req = 100;
    let currentXP = xp;
    while (currentXP >= req && level < 50) {
       currentXP -= req;
       level++;
       req = Math.floor(req * 1.15); 
    }
    return { level, currentXP, nextReq: req };
  };

  const { level, currentXP, nextReq } = useMemo(() => calculateLevel(nutritionXP), [nutritionXP]);
  
  const getBadgeName = (lvl) => {
    const idx = Math.min(Math.floor((lvl - 1) / 5), LEVEL_NAMES.length - 1);
    return LEVEL_NAMES[idx];
  };

  const badgeName = getBadgeName(level);
  const progress = Math.min((currentXP / nextReq) * 100, 100);

  const CHALLENGES = [
    { id: 'hydration_7', name: '7-Day Hydration', desc: 'Hit your water target for 7 consecutive days.', max: 7, xp: 500, icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-500/10', category: 'Hydration', difficulty: 'Hard' },
    { id: 'protein_pro', name: 'Protein Pro', desc: 'Hit your protein goal 3 days in a row.', max: 3, xp: 250, icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10', category: 'Nutrition', difficulty: 'Medium' },
    { id: 'perfect_logger', name: 'Perfect Logger', desc: 'Log all 3 main meals for 5 days.', max: 5, xp: 300, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', category: 'Nutrition', difficulty: 'Medium' },
  ];

  const acceptChallenge = async (ch) => {
    if (activeChallenge) {
       if (!window.confirm('You already have an active challenge. Do you want to replace it? Progress will be lost.')) return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Do NOT save the Lucide icon component to Firestore, it will crash
    const { icon, ...challengeData } = ch;
    
    try {
      if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), { 
        challenge: { ...challengeData, progress: 0, startDate: todayStr, status: 'In Progress' } 
      }, { merge: true });
      showToast(`Started Challenge: ${ch.name}`);
    } catch (e) {
      console.error(e);
      showToast("Error starting challenge", "error");
    }
  };

  const abandonChallenge = async () => {
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), { challenge: null }, { merge: true });
    showToast('Challenge abandoned');
  };

  const isCompleted = activeChallenge && activeChallenge.progress >= activeChallenge.max;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-0 pb-20 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Level Card & Active Challenge */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
               <div className="w-32 h-32 rounded-full border-4 border-amber-400 dark:border-amber-500/50 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 shadow-[0_0_30px_rgba(251,191,36,0.3)] shrink-0">
                  <div className="text-center">
                    <span className="text-4xl font-black text-amber-600 dark:text-amber-400">{level}</span>
                    <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest mt-1">Level</p>
                  </div>
               </div>
               
               <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                     <Medal className="w-6 h-6 text-amber-500"/>
                     <h3 className="text-2xl font-black text-gray-900 dark:text-white">{badgeName}</h3>
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-6">Earn XP by hitting nutrition goals, logging meals, and staying consistent.</p>
                  
                  <div className="space-y-2">
                     <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-900 dark:text-gray-300">{currentXP} XP</span>
                        <span className="text-gray-500 dark:text-gray-500">{nextReq} XP to Level {level + 1}</span>
                     </div>
                     <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Active Challenge */}
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3"><Target className="w-5 h-5 text-rose-500"/> Active Challenge</h3>
             </div>
             
             {activeChallenge ? (
               <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 border rounded-2xl relative overflow-hidden transition-all ${
                 activeChallenge.status === 'Failed' 
                  ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                  : isCompleted
                  ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  : 'bg-gray-50/50 dark:bg-gray-800/30 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.05)]'
               }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${activeChallenge.bg || 'bg-white dark:bg-gray-900'}`}>
                     <Target className={`w-8 h-8 ${activeChallenge.color || 'text-rose-500'}`}/>
                  </div>
                  <div className="flex-1 w-full">
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border text-indigo-400 border-indigo-400/20 bg-indigo-400/10">
                          {activeChallenge.category}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border text-yellow-400 border-yellow-400/20 bg-yellow-400/10">
                          {activeChallenge.difficulty}
                        </span>
                        {activeChallenge.status === 'Failed' && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border text-red-500 border-red-500/20 bg-red-500/10">
                            Failed
                          </span>
                        )}
                        {activeChallenge.status === 'In Progress' && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border text-blue-400 border-blue-400/20 bg-blue-400/10">
                            In Progress
                          </span>
                        )}
                     </div>
                     
                     <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        {activeChallenge.name} 
                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                     </h4>
                     <p className="text-xs font-medium text-gray-500 mt-1 mb-4">{activeChallenge.desc}</p>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                           <span className={activeChallenge.status === 'Failed' ? 'text-red-500' : isCompleted ? 'text-emerald-500' : 'text-rose-600 dark:text-rose-400'}>
                             Progress: {activeChallenge.progress} / {activeChallenge.max} Days
                           </span>
                           <span className="text-amber-500 flex items-center gap-1"><Star className="w-3 h-3"/> {activeChallenge.xp} XP Reward</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-500 ${activeChallenge.status === 'Failed' ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((activeChallenge.progress / activeChallenge.max) * 100, 100)}%` }}></div>
                        </div>
                     </div>
                     
                     <div className="flex gap-2 mt-6">
                        {isCompleted ? (
                           <button onClick={completeActiveChallenge} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-2 transition-colors">
                             <Award className="w-4 h-4" /> Claim Reward
                           </button>
                        ) : (
                           <>
                             <button onClick={abandonChallenge} className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center justify-center gap-2 transition-colors">
                               <Trash2 className="w-4 h-4" /> Abandon
                             </button>
                           </>
                        )}
                     </div>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/20">
                  <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
                  <h4 className="text-gray-900 dark:text-white font-bold mb-1">No Active Challenge</h4>
                  <p className="text-xs font-medium text-gray-500">Pick one from the board to start earning XP!</p>
               </div>
             )}
          </div>
          
          {/* Challenge History */}
          {challengeHistory.length > 0 && (
             <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4 text-indigo-500"/> Challenge History</h3>
                <div className="space-y-3">
                   {challengeHistory.slice(0, 5).map((historyItem, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-gray-900 dark:text-white">{historyItem.name}</p>
                               <p className="text-[10px] font-medium text-gray-500">{new Date(historyItem.completedAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="text-xs font-black text-amber-500 flex items-center gap-1">
                            +{historyItem.xp} XP
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
          
        </div>

        {/* Right Col: Challenge Board */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm">
             <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500"/> Challenge Board</h3>
             
             <div className="space-y-4">
               {CHALLENGES.map(ch => {
                 const isActive = activeChallenge?.id === ch.id;
                 return (
                   <div key={ch.id} className={`p-5 rounded-2xl border transition-all ${isActive ? 'bg-gray-50/50 dark:bg-gray-800/20 border-emerald-500/50' : 'bg-white dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-700/50 hover:shadow-md'}`}>
                      <div className="flex flex-col gap-4">
                         <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ch.bg}`}>
                               <ch.icon className={`w-5 h-5 ${ch.color}`}/>
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">{ch.name} {isActive && <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/>}</h4>
                               <p className="text-[10px] font-medium text-gray-500 mt-1 leading-relaxed">{ch.desc}</p>
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                               <Star className="w-3 h-3 fill-amber-500"/> +{ch.xp} XP
                            </div>
                            {isActive ? (
                               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                                 <Clock className="w-3 h-3" /> Active
                               </span>
                            ) : (
                               <button 
                                 onClick={() => acceptChallenge(ch)}
                                 className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-1"
                               >
                                 <Play className="w-3 h-3" /> Start Challenge
                               </button>
                            )}
                         </div>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
