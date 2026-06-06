import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Droplet, Plus, History, Trophy, TrendingUp, Calendar as CalendarIcon, Minus, GlassWater } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';


const getColorTheme = (progress) => {
  if (progress >= 100) return { stroke: 'stroke-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]', icon: 'text-emerald-500' };
  if (progress >= 60) return { stroke: 'stroke-cyan-500', text: 'text-cyan-500', bg: 'bg-cyan-500', glow: 'drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]', icon: 'text-cyan-500' };
  if (progress >= 30) return { stroke: 'stroke-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500', glow: 'drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]', icon: 'text-yellow-500' };
  return { stroke: 'stroke-orange-500', text: 'text-orange-500', bg: 'bg-orange-500', glow: 'drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]', icon: 'text-orange-500' };
};

const PremiumLiquidRing = ({ progress, currentWater, dailyTarget, milestone, colorTheme }) => {
  const size = 280;
  const strokeWidth = 14; 
  const radius = (size - strokeWidth) / 2 - 4; 
  const circumference = radius * 2 * Math.PI;
  const safeProgress = Math.min(progress, 100);
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center w-[280px] h-[280px] mx-auto">
       {/* SVG Ring Background & Progress */}
       <svg className="absolute inset-0 transform -rotate-90 pointer-events-none" width={size} height={size}>
          <circle 
            cx={size / 2} cy={size / 2} r={radius} 
            className="stroke-gray-100 dark:stroke-gray-800" 
            strokeWidth={strokeWidth} fill="transparent" 
          />
          <circle 
            cx={size / 2} cy={size / 2} r={radius} 
            className={`${colorTheme.stroke} transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${colorTheme.glow}`}
            strokeWidth={strokeWidth} fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
       </svg>

       {/* Liquid Fill Visualization */}
       <div className="absolute inset-0 m-[18px] rounded-full overflow-hidden flex items-end justify-center pointer-events-none bg-gray-50/30 dark:bg-gray-800/30 backdrop-blur-sm">
          <div 
            className={`w-[250%] ${colorTheme.bg} opacity-30 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-10 flex items-start justify-center animate-[spin_8s_linear_infinite]`}
            style={{ 
               height: `${safeProgress + 15}%`, 
               borderRadius: '35% 45% 40% 45%', 
               bottom: `${safeProgress > 0 ? -10 : -100}%` 
            }}
          ></div>
       </div>

       {/* Center Content */}
       <div className="relative z-20 flex flex-col items-center justify-center">
          {milestone ? (
             <div className={`text-xl font-black ${colorTheme.text} animate-bounce drop-shadow-lg text-center px-4 leading-tight`}>
                {milestone}
             </div>
          ) : (
             <div className="flex flex-col items-center animate-fade-in">
                <Droplet className={`w-8 h-8 ${colorTheme.icon} mb-1 drop-shadow-md`} />
                <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter drop-shadow-sm">{currentWater}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">/ {dailyTarget} ml</span>
                <div className={`mt-3 px-4 py-1.5 rounded-full ${colorTheme.bg} bg-opacity-20 backdrop-blur-md`}>
                   <span className={`text-sm font-black ${colorTheme.text}`}>{Math.round(progress)}%</span>
                </div>
             </div>
          )}
       </div>
    </div>
  )
}

export default function WaterView({ user, waterLogs, setWaterLogs, macroGoals, db, appId, selectedDate, showToast, awardXP }) {
  const [customAmount, setCustomAmount] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  
  const dailyTarget = macroGoals.water || 3000;
  const currentWaterData = waterLogs[selectedDate] || { amount: 0, history: [] };
  const currentWater = currentWaterData.amount || 0;
  const historyLogs = currentWaterData.history || [];
  
  // Optimistic state for immediate UI feedback
  const [optimisticWater, setOptimisticWater] = useState(null);
  const [optimisticHistory, setOptimisticHistory] = useState(null);
  
  const displayWater = optimisticWater !== null ? optimisticWater : currentWater;
  const displayHistory = optimisticHistory !== null ? optimisticHistory : historyLogs;
  
  const calculateStreak = () => {
    let streak = 0;
    const sortedDates = Object.keys(waterLogs).sort((a,b) => new Date(b) - new Date(a));
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if streak is alive
    let dateObj = new Date();
    for (let i = 0; i < 365; i++) {
       const dStr = dateObj.toISOString().split('T')[0];
       if ((waterLogs[dStr]?.amount || 0) >= dailyTarget) {
          streak++;
          dateObj.setDate(dateObj.getDate() - 1);
       } else if (i === 0 && dStr === todayStr) {
          // It's today, streak might not be achieved yet, but it's alive if yesterday was met
          dateObj.setDate(dateObj.getDate() - 1);
       } else {
          break;
       }
    }
    return streak;
  };
  
  const streak = useMemo(calculateStreak, [waterLogs, dailyTarget]);
  
  const getAverage = (days) => {
    let total = 0;
    for (let i = 0; i < days; i++) {
       const d = new Date(); d.setDate(d.getDate() - i);
       const str = d.toISOString().split('T')[0];
       total += (waterLogs[str]?.amount || 0);
    }
    return Math.round(total / days);
  };
  
  const weeklyAvg = useMemo(() => getAverage(7), [waterLogs]);
  const monthlyAvg = useMemo(() => getAverage(30), [waterLogs]);

  const addWater = async (amount) => {
    const newTotal = Math.max(0, currentWater + amount);
    let newHistory = [...historyLogs];
    
    if (amount > 0) {
      newHistory.push({ amount, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    } else {
      // If undoing, you might pop the last entry, but for now we just change total
      // Or you can leave history as is and let the total drop.
    }
    
    // Optimistic Update
    setOptimisticWater(newTotal);
    setOptimisticHistory(newHistory);

    try {
      if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'water_logs', 'daily', selectedDate), { amount: newTotal, history: newHistory }, { merge: true });
      
      // Force local update regardless of Firebase success/failure
      if (setWaterLogs) {
        setWaterLogs(prev => ({
          ...prev,
          [selectedDate]: { amount: newTotal, history: newHistory }
        }));
      }

      if (currentWater < dailyTarget && newTotal >= dailyTarget) {
         awardXP(30, 'Hydration Goal Reached!');
      } else if (amount > 0) {
         awardXP(2, 'Logged Water');
      }
      showToast(amount > 0 ? `Added ${amount}ml water` : `Removed ${Math.abs(amount)}ml water`);
    } catch (e) {
      console.error(e);
      showToast('Error saving water log', 'error');
    } finally {
      // Clear optimistic state to rely on real Firebase data again
      setOptimisticWater(null);
      setOptimisticHistory(null);
    }
  };

  const handleCustomAdd = (e) => {
    e.preventDefault();
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      addWater(amount);
      setCustomAmount('');
    }
  };

  const QuickAddBtn = ({ amount, label }) => (
    <button 
      onClick={() => addWater(amount)}
      className="flex-1 flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 ${colorTheme.stroke.replace('stroke', 'hover:border')} rounded-2xl transition-all group"
    >
      <div className="w-12 h-12 ${colorTheme.bg.replace('bg-', 'bg-').replace('-500', '-500/20')} dark:${colorTheme.bg.replace('bg-', 'bg-').replace('-500', '-500/20')} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
        <GlassWater className={`w-6 h-6 ${colorTheme.text}`} />
      </div>
      <span className="font-black text-gray-900 dark:text-white text-sm">{label || `+${amount}ml`}</span>
    </button>
  );

  
  const progress = Math.min((displayWater / dailyTarget) * 100, 100);
  const colorTheme = getColorTheme(progress);

  const [milestone, setMilestone] = useState(null);
  const prevProgressRef = useRef(0);
  
  useEffect(() => {
     const prev = prevProgressRef.current;
     if (progress >= 100 && prev < 100 && prev > 0) { setMilestone('Hydration Goal Reached! 🏆'); }
     else if (progress >= 75 && prev < 75 && prev > 0) { setMilestone('75% Achieved! 🔥'); }
     else if (progress >= 50 && prev < 50 && prev > 0) { setMilestone('Halfway There! 💧'); }
     else if (progress >= 25 && prev < 25 && prev > 0) { setMilestone('25% Complete! 👏'); }
     
     if (progress !== prev) {
       prevProgressRef.current = progress;
     }
  }, [progress]);

  useEffect(() => {
     if (milestone) {
        const t = setTimeout(() => setMilestone(null), 3000);
        return () => clearTimeout(t);
     }
  }, [milestone]);


  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-0 pb-20 animate-fade-in">
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
        <div className="flex justify-between items-start mb-8">
           <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3"><Droplet className="w-6 h-6 text-cyan-500"/> Advanced Hydration</h3>
           <div className="flex gap-2">
             <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl font-bold text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4"/> {streak} Day Streak
             </div>
           </div>
        </div>

        {/* Main Tracker Dashboard Card */}
        <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
          
          <div className="flex-1 w-full flex justify-center lg:justify-start">
             <PremiumLiquidRing 
               progress={progress} 
               currentWater={displayWater} 
               dailyTarget={dailyTarget} 
               milestone={milestone}
               colorTheme={colorTheme}
             />
          </div>

          <div className="flex-1 w-full space-y-6">
            
            {/* Realtime Dashboard Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Remaining</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{Math.max(0, dailyTarget - displayWater)} ml</p>
               </div>
               <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Last Drink</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {displayHistory.length > 0 ? displayHistory[displayHistory.length - 1].time : '--:--'}
                  </p>
               </div>
            </div>
            <div>
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Add</h4>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <QuickAddBtn amount={250} label="Glass (250ml)" />
                 <QuickAddBtn amount={500} label="Bottle (500ml)" />
                 <QuickAddBtn amount={750} label="Large (750ml)" />
                 <QuickAddBtn amount={1000} label="Jug (1L)" />
               </div>
            </div>
            
            <form onSubmit={handleCustomAdd} className="flex gap-4 items-center p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
               <input 
                 type="number" 
                 placeholder="Custom amount (ml)..." 
                 className="flex-1 bg-transparent text-gray-900 dark:text-white font-bold outline-none placeholder-gray-400"
                 value={customAmount}
                 onChange={e => setCustomAmount(e.target.value)}
               />
               <button type="submit" className="p-2 ${colorTheme.bg.replace('bg-', 'bg-').replace('-500', '-500/20')} dark:${colorTheme.bg.replace('bg-', 'bg-').replace('-500', '-500/20')} text-cyan-600 dark:text-cyan-400 rounded-xl hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors font-bold text-sm px-4">
                 Add
               </button>
               <button type="button" onClick={() => addWater(-250)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Undo 250ml">
                 <Minus className="w-4 h-4"/>
               </button>
            </form>
          </div>
        </div>
      </div>

      {/* Hydration History */}
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-8 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3 mb-6"><History className="w-5 h-5 text-blue-500"/> Today's Log</h3>
        {displayHistory.length === 0 ? (
           <div className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-500 font-bold text-sm">
              No water logged today. Time for a glass!
           </div>
        ) : (
           <div className="space-y-3">
             {displayHistory.map((log, index) => (
               <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-cyan-200 dark:hover:border-cyan-800/50 transition-colors animate-fade-in">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 ${colorTheme.bg.replace('bg-', 'bg-').replace('-500', '-500/20')} dark:${colorTheme.bg.replace('bg-', 'bg-').replace('-500', '-500/20')} rounded-full flex items-center justify-center">
                      <Droplet className="w-5 h-5 text-cyan-500" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">+{log.amount}ml</span>
                 </div>
                 <span className="text-sm font-bold text-gray-400">{log.time}</span>
               </div>
             ))}
           </div>
        )}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
           { label: 'Weekly Average', val: `${weeklyAvg}ml`, icon: History, color: 'text-blue-500', bg: 'bg-blue-500/10' },
           { label: 'Monthly Average', val: `${monthlyAvg}ml`, icon: CalendarIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
           { label: 'Today Progress', val: `${Math.round(progress)}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
           { label: 'Streak', val: `${streak} Days`, icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
           <div key={i} className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                 <stat.icon className={`w-6 h-6 ${stat.color}`}/>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stat.val}</p>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}
