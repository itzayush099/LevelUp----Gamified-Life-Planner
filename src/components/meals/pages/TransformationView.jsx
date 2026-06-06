import React, { useMemo, useState } from 'react';
import { Target, Activity, Flame, Dumbbell, HeartPulse, Trophy, ArrowRight, Zap, TrendingDown, TrendingUp, Settings2, X, Droplets, CalendarDays, ChevronLeft, BarChart3, CheckCircle, Moon, Wind, Sparkles } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { doc, setDoc } from 'firebase/firestore';

const MEAL_SECTIONS = ['breakfast', 'lunch', 'dinner', 'snacks', 'pre_workout', 'post_workout'];

const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: 'rgba(17,24,39,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff', fontWeight: 'bold', fontSize: 12 },
};

export default function TransformationView({ user, dietProfile, bodyProgress = [], dailyLogs = {}, waterLogs = {}, macroGoals = {}, gymLogs = {}, recoveryLogs = {}, foodLibrary = [], db, appId, showToast, selectedDate }) {
  
  const [goalModal, setGoalModal] = useState(false);
  const [goalType, setGoalType] = useState(dietProfile.goalType || 'Weight Loss');
  const [goalWeight, setGoalWeight] = useState(dietProfile.goalWeight || '');
  const [logWeightModal, setLogWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(dietProfile.weight || '');
  // null | 'weight' | 'diet' | 'gym' | 'recovery' | 'hydration'
  const [drilldown, setDrilldown] = useState(null);

  const calculateTotals = (logObj) => {
    let c = 0, p = 0;
    if (!logObj) return { calories: 0, protein: 0 };
    const completed = logObj.completedMeals || [];
    MEAL_SECTIONS.forEach(sec => {
      if (logObj[sec] && completed.includes(sec)) {
        logObj[sec].forEach(item => {
            const live = foodLibrary.find(f => f.id === item.foodId) || item;
            const ratio = item.amount / (live.servingSize || 1);
            c += (live.calories * ratio); p += (live.protein * ratio);
        });
      }
    });
    return { calories: Math.round(c), protein: Math.round(p) };
  };

  // ── 30-day metrics ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const todayDate = new Date();
    let nutHit = 0, nutTotal = 0;
    let workoutHit = 0, workoutTotal = 0;
    let recScoreSum = 0, recDays = 0;
    let waterHit = 0, waterTotal = 30;
    let sleepSum = 0, sleepDays = 0;
    let bodyLogsThisMonth = 0;
    
    for(let i = 0; i < 30; i++) {
      const d = new Date(todayDate); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      
      if (dailyLogs[dStr]) {
         nutTotal++;
         const t = calculateTotals(dailyLogs[dStr]);
         if (t.calories > 0 && t.protein >= (macroGoals.protein || 150) * 0.9) nutHit++;
      }
      if ((waterLogs[dStr]?.amount || 0) >= (macroGoals.water || 2500)) waterHit++;
      if (gymLogs[dStr]) {
         workoutTotal++;
         if (gymLogs[dStr].exercises && gymLogs[dStr].exercises.length > 0) workoutHit++;
      }
      if (recoveryLogs[dStr]) {
         recDays++;
         recScoreSum += (recoveryLogs[dStr].overallScore || 0);
         if (recoveryLogs[dStr].sleepHours) { sleepSum += recoveryLogs[dStr].sleepHours; sleepDays++; }
      }
      if (bodyProgress.some(bp => bp.date === dStr)) bodyLogsThisMonth++;
    }
    
    const nutCon    = nutTotal    > 0 ? Math.round((nutHit / nutTotal) * 100) : 0;
    const workAdh   = workoutTotal > 0 ? Math.round((workoutHit / workoutTotal) * 100) : 100;
    const recCon    = recDays     > 0 ? Math.round(recScoreSum / recDays) : 0;
    const watCon    = Math.round((waterHit / waterTotal) * 100);
    const bodyCon   = bodyLogsThisMonth >= 2 ? 100 : bodyLogsThisMonth === 1 ? 50 : 0;
    const avgSleep  = sleepDays   > 0 ? (sleepSum / sleepDays).toFixed(1) : '--';
    const score     = Math.round((nutCon * 0.3) + (workAdh * 0.3) + (recCon * 0.2) + (watCon * 0.1) + (bodyCon * 0.1));

    let startW = dietProfile.weight || 0, curW = dietProfile.weight || 0, wLost = 0;
    if (bodyProgress.length > 0) {
      curW = bodyProgress[0].weight;
      startW = bodyProgress[bodyProgress.length - 1].weight;
      wLost = (startW - curW).toFixed(1);
    }

    return { nutCon, workAdh, recCon, watCon, score, curW, startW, wLost, nutHit, nutTotal, workoutHit, workoutTotal, avgSleep, waterHit };
  }, [dailyLogs, waterLogs, gymLogs, recoveryLogs, bodyProgress, macroGoals, dietProfile]);

  const targetW = dietProfile.goalWeight || 0;
  
  const goalProgress = useMemo(() => {
    if (!targetW || !metrics.startW) return 0;
    const totalDiff = Math.abs(metrics.startW - targetW);
    const curDiff   = Math.abs(metrics.curW - targetW);
    if (totalDiff === 0) return 100;
    return Math.min(Math.max(((totalDiff - curDiff) / totalDiff) * 100, 0), 100);
  }, [targetW, metrics.curW, metrics.startW]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const weightChartData = useMemo(() => {
    let data = [...bodyProgress].reverse().map(bp => ({
      date: new Date(bp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: bp.weight,
    }));
    if (data.length === 1) data = [{ date: 'Start', weight: data[0].weight }, data[0]];
    return data;
  }, [bodyProgress]);

  // 30-day diet adherence trend (grouped by week)
  const dietTrendData = useMemo(() => {
    const weeks = [];
    for (let w = 0; w < 4; w++) {
      let hit = 0, total = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(); date.setDate(date.getDate() - (w * 7 + d));
        const dStr = date.toISOString().split('T')[0];
        if (dailyLogs[dStr]) { total++; const t = calculateTotals(dailyLogs[dStr]); if (t.calories > 0) hit++; }
      }
      const label = `W-${w === 0 ? 'Now' : w}`;
      weeks.unshift({ week: label, adherence: total > 0 ? Math.round((hit / total) * 100) : 0, days: hit });
    }
    return weeks;
  }, [dailyLogs]);

  // 30-day daily water intake
  const waterTrendData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const ml = (waterLogs[dStr]?.amount || 0);
      if (i % 5 === 0 || ml > 0) {
        data.push({ date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), ml, goal: macroGoals.water || 3000 });
      }
    }
    return data;
  }, [waterLogs, macroGoals]);

  // Gym: weekly consistency
  const gymTrendData = useMemo(() => {
    const weeks = [];
    for (let w = 0; w < 4; w++) {
      let done = 0, total = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(); date.setDate(date.getDate() - (w * 7 + d));
        const dStr = date.toISOString().split('T')[0];
        if (gymLogs[dStr]) { total++; if (gymLogs[dStr].exercises?.length > 0) done++; }
      }
      weeks.unshift({ week: `W-${w === 0 ? 'Now' : w}`, consistency: total > 0 ? Math.round((done / total) * 100) : 0, sessions: done });
    }
    return weeks;
  }, [gymLogs]);

  // Recovery: 14-day trend
  const recoveryTrendData = useMemo(() => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const rec = recoveryLogs[dStr];
      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: rec?.overallScore || null,
        sleep: rec?.sleepHours  || null,
      });
    }
    return data;
  }, [recoveryLogs]);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const handleSaveGoal = async () => {
    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'profile'), { goalType, goalWeight: Number(goalWeight) }, { merge: true });
        showToast('Transformation Goal Updated!');
        setGoalModal(false);
      } catch (e) { showToast('Error updating goal', 'error'); }
    }
  };

  const handleLogWeight = async () => {
    if (!newWeight || !db) return;
    try {
      const w = Number(newWeight);
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'body_progress', selectedDate), { date: selectedDate, weight: w, timestamp: new Date().toISOString() });
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'profile'), { weight: w }, { merge: true });
      showToast('Weight logged successfully!');
      setLogWeightModal(false);
    } catch (e) { showToast('Error logging weight', 'error'); }
  };

  // ── Sub-components ──────────────────────────────────────────────────────────

  const StatCard = ({ icon: Icon, title, val, unit, desc, color, bg, drillKey }) => (
    <div
      className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 hover:scale-[1.02] active:scale-100"
      onClick={() => setDrilldown(drillKey)}
      role="button"
      aria-label={`View ${title} details`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color}`}/>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors`}>
          <ArrowRight className={`w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors`}/>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{val}</span>
          {unit && <span className="text-sm font-bold text-gray-400">{unit}</span>}
        </div>
        {desc && <p className="text-[10px] font-medium text-gray-400 mt-2">{desc}</p>}
      </div>
    </div>
  );

  // ── Modal Shell ─────────────────────────────────────────────────────────────
  const DrilldownShell = ({ title, accentColor = 'from-emerald-400 to-teal-500', children }) => (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-0 sm:p-6 bg-gray-900/70 backdrop-blur-md animate-fade-in overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setDrilldown(null); }}>
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-3xl min-h-full sm:min-h-0 sm:rounded-[2.5rem] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 flex flex-col sm:my-auto">
        <div className={`h-1.5 w-full bg-gradient-to-r ${accentColor} sm:rounded-t-[2.5rem]`}/>
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setDrilldown(null)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5"/>
          </button>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
        </div>
        <div className="p-6 space-y-6 flex-1">{children}</div>
      </div>
    </div>
  );

  const StatRow = ({ label, value, unit = '', accent = 'text-gray-900 dark:text-white' }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm font-bold text-gray-500">{label}</span>
      <span className={`text-lg font-black ${accent}`}>{value}<span className="text-sm font-bold text-gray-400 ml-1">{unit}</span></span>
    </div>
  );

  const SectionCard = ({ title, icon: Icon, iconColor, children }) => (
    <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-5 shadow-sm">
      {title && <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`}/>}{title}
      </h3>}
      {children}
    </div>
  );

  // ── DRILLDOWN: Weight Change ─────────────────────────────────────────────────
  const WeightDrilldown = () => {
    const change = parseFloat(metrics.wLost);
    const direction = change > 0 ? 'Lost' : change < 0 ? 'Gained' : 'No Change';
    const changeColor = direction === 'Lost' ? 'text-emerald-500' : direction === 'Gained' ? 'text-red-500' : 'text-gray-500';

    // Weekly + monthly change
    const today = new Date();
    const weekAgoStr = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgoStr = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const weekAgo = bodyProgress.find(b => b.date <= weekAgoStr);
    const monthAgo = bodyProgress.find(b => b.date <= monthAgoStr);
    const weeklyChange  = weekAgo  ? (metrics.curW - weekAgo.weight).toFixed(1) : '--';
    const monthlyChange = monthAgo ? (metrics.curW - monthAgo.weight).toFixed(1) : '--';

    return (
      <DrilldownShell title="Weight Analytics" accentColor="from-emerald-400 to-teal-500">
        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Starting Weight', value: metrics.startW, unit: 'kg', color: 'text-gray-500' },
            { label: 'Current Weight',  value: metrics.curW,   unit: 'kg', color: 'text-gray-900 dark:text-white' },
            { label: 'Goal Weight',     value: targetW || '--', unit: targetW ? 'kg' : '', color: 'text-emerald-500' },
            { label: 'Total Change',    value: `${change > 0 ? '-' : change < 0 ? '+' : ''}${Math.abs(change)}`, unit: 'kg', color: changeColor },
          ].map(s => (
            <div key={s.label} className="bg-white/80 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}<span className="text-sm text-gray-400 ml-1">{s.unit}</span></p>
            </div>
          ))}
        </div>

        {/* Weight Trend Chart */}
        <SectionCard title="Weight Trajectory" icon={TrendingDown} iconColor="text-emerald-500">
          {weightChartData.length >= 2 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.2)"/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={8}/>
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}/>
                  {targetW > 0 && <ReferenceLine y={targetW} stroke="#10b981" strokeDasharray="6 4" strokeOpacity={0.6} label={{ value: 'Goal', position: 'right', fontSize: 10, fill: '#10b981' }}/>}
                  <RechartsTooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`${v} kg`, 'Weight']}/>
                  <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#wGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Log at least 2 weight entries to see your trajectory."/>
          )}
        </SectionCard>

        {/* More stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SectionCard title="Change Breakdown" icon={BarChart3} iconColor="text-indigo-500">
            <StatRow label="Weekly Change"  value={weeklyChange !== '--' ? weeklyChange : '--'} unit={weeklyChange !== '--' ? 'kg' : ''}/>
            <StatRow label="Monthly Change" value={monthlyChange !== '--' ? monthlyChange : '--'} unit={monthlyChange !== '--' ? 'kg' : ''}/>
            <StatRow label="Total Logged Entries" value={bodyProgress.length} accent="text-indigo-500"/>
          </SectionCard>
          <SectionCard title="Goal Progress" icon={Trophy} iconColor="text-yellow-500">
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{Math.round(goalProgress)}<span className="text-2xl text-gray-400">%</span></span>
              <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Goal Achieved</p>
              <div className="w-full mt-4 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: `${goalProgress}%` }}/>
              </div>
              <div className="flex justify-between w-full mt-1.5 text-[10px] font-bold text-gray-400">
                <span>{metrics.startW} kg start</span>
                <span>{targetW || '--'} kg goal</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Timeline */}
        <SectionCard title="Weight Timeline" icon={CalendarDays} iconColor="text-indigo-500">
          {bodyProgress.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {bodyProgress.map((bp, i) => (
                <div key={bp.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${i === 0 ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50'}`}>
                  <div className="text-center w-10 shrink-0">
                    <span className="text-xs font-black text-gray-900 dark:text-white block">{new Date(bp.date).toLocaleDateString(undefined, { day: 'numeric' })}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(bp.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"/>
                  <span className={`text-lg font-black ${i === 0 ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>{bp.weight} kg</span>
                  {i === 0 && <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Latest</span>}
                  {i === bodyProgress.length - 1 && bodyProgress.length > 1 && <span className="ml-auto text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded">Start</span>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No weight entries found. Log your weight to start tracking."/>
          )}
        </SectionCard>
      </DrilldownShell>
    );
  };

  // ── DRILLDOWN: Diet Adherence ───────────────────────────────────────────────
  const DietDrilldown = () => {
    // Calculate per-day for 30 days
    const dailyData = useMemo(() => {
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const log = dailyLogs[dStr];
        const t = calculateTotals(log);
        const calHit = t.calories > 0 && Math.abs(t.calories - (macroGoals.calories || 2500)) / (macroGoals.calories || 2500) <= 0.15;
        const proHit = t.protein >= (macroGoals.protein || 150) * 0.9;
        const watHit = (waterLogs[dStr]?.amount || 0) >= (macroGoals.water || 3000);
        if (t.calories > 0 || watHit) {
          data.push({ date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), score: t.calories > 0 ? Math.round((calHit ? 40 : 10) + (proHit ? 30 : 0) + (watHit ? 20 : 0)) : 0, dStr });
        }
      }
      return data;
    }, []);

    // Weekly adherence
    const weeklyAdherence = dietTrendData.map(w => w.adherence);
    const bestWeek = Math.max(...weeklyAdherence, 0);
    const worstWeek = weeklyAdherence.some(w => w > 0) ? Math.min(...weeklyAdherence.filter(w => w > 0)) : 0;

    // Days protein hit
    let proHitCount = 0, watHitCount = 0, calHitCount = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const t = calculateTotals(dailyLogs[dStr]);
      if (t.protein >= (macroGoals.protein || 150) * 0.9) proHitCount++;
      if ((waterLogs[dStr]?.amount || 0) >= (macroGoals.water || 3000)) watHitCount++;
      if (t.calories > (macroGoals.calories || 2500) * 0.85) calHitCount++;
    }

    return (
      <DrilldownShell title="Diet Adherence Analytics" accentColor="from-amber-400 to-orange-500">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Days Calories Hit', value: calHitCount, unit: '/ 30', color: 'text-amber-500' },
            { label: 'Days Protein Hit',  value: proHitCount, unit: '/ 30', color: 'text-red-500' },
            { label: 'Days Water Hit',    value: watHitCount, unit: '/ 30', color: 'text-cyan-500' },
            { label: 'Monthly Adherence', value: `${metrics.nutCon}`, unit: '%', color: 'text-amber-500' },
            { label: 'Best Week',         value: `${bestWeek}`, unit: '%', color: 'text-emerald-500' },
            { label: 'Worst Week',        value: `${worstWeek}`, unit: '%', color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white/80 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}<span className="text-sm text-gray-400 ml-1">{s.unit}</span></p>
            </div>
          ))}
        </div>

        <SectionCard title="Weekly Adherence Trend" icon={BarChart3} iconColor="text-amber-500">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dietTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)"/>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={8}/>
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }}/>
                <RechartsTooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Adherence']}/>
                <Bar dataKey="adherence" fill="#f59e0b" radius={[8, 8, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="30-Day Nutrition Score" icon={Activity} iconColor="text-orange-500">
          {dailyData.length >= 2 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)"/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={8} interval="preserveStartEnd"/>
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }}/>
                  <RechartsTooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`${v}`, 'Score']}/>
                  <Area type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#dGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Log more meals to build your nutrition score trend."/>
          )}
        </SectionCard>
      </DrilldownShell>
    );
  };

  // ── DRILLDOWN: Gym Consistency ──────────────────────────────────────────────
  const GymDrilldown = () => {
    // Workout streak
    let streak = 0, bestStreak = 0, cur = 0;
    const sortedGymDates = Object.keys(gymLogs).filter(d => gymLogs[d]?.exercises?.length > 0).sort().reverse();
    sortedGymDates.forEach((d, i) => {
      if (i === 0) { cur = 1; } else {
        const diff = (new Date(sortedGymDates[i-1]) - new Date(d)) / 86400000;
        if (diff <= 2) cur++; else cur = 1;
      }
      if (cur > bestStreak) bestStreak = cur;
    });
    if (sortedGymDates[0]) {
      const daysSince = (new Date() - new Date(sortedGymDates[0])) / 86400000;
      streak = daysSince <= 2 ? cur : 0;
    }

    // Last 10 sessions
    const recentSessions = sortedGymDates.slice(0, 10).map(d => ({
      date: new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      exercises: gymLogs[d]?.exercises?.length || 0,
      done: gymLogs[d]?.exercises?.length > 0,
    }));

    return (
      <DrilldownShell title="Gym Consistency Analytics" accentColor="from-rose-400 to-pink-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Completed',     value: metrics.workoutHit,   unit: 'sessions', color: 'text-emerald-500' },
            { label: 'Scheduled',     value: metrics.workoutTotal,  unit: 'sessions', color: 'text-gray-900 dark:text-white' },
            { label: 'Current Streak',value: streak,               unit: 'days',    color: 'text-orange-500' },
            { label: 'Best Streak',   value: bestStreak,           unit: 'days',    color: 'text-yellow-500' },
          ].map(s => (
            <div key={s.label} className="bg-white/80 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}<span className="text-sm text-gray-400 ml-1">{s.unit}</span></p>
            </div>
          ))}
        </div>

        {/* Monthly/Weekly % */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SectionCard title="Consistency Rate" icon={Target} iconColor="text-rose-500">
            <StatRow label="Weekly Consistency"   value={gymTrendData[gymTrendData.length-1]?.consistency || 0} unit="%"/>
            <StatRow label="Monthly Consistency"  value={metrics.workAdh} unit="%" accent="text-rose-500"/>
            <StatRow label="Missed Workouts"      value={metrics.workoutTotal - metrics.workoutHit} accent="text-red-400"/>
          </SectionCard>
          <SectionCard title="Completion Chart" icon={BarChart3} iconColor="text-rose-500">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gymTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)"/>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={6}/>
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }}/>
                  <RechartsTooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Consistency']}/>
                  <Bar dataKey="consistency" fill="#f43f5e" radius={[6, 6, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Workout history */}
        <SectionCard title="Recent Sessions" icon={CalendarDays} iconColor="text-rose-500">
          {recentSessions.length > 0 ? (
            <div className="space-y-2">
              {recentSessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.done ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {s.done ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <X className="w-4 h-4 text-gray-400"/>}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{s.date}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{s.exercises} exercises</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No gym sessions logged yet."/>
          )}
        </SectionCard>
      </DrilldownShell>
    );
  };

  // ── DRILLDOWN: Recovery Score ───────────────────────────────────────────────
  const RecoveryDrilldown = () => {
    // Detailed recovery averages
    let avgEnergy = 0, avgStress = 0, energyDays = 0, stressDays = 0;
    Object.values(recoveryLogs).forEach(r => {
      if (r.energyLevel !== undefined) { avgEnergy += r.energyLevel; energyDays++; }
      if (r.stressLevel !== undefined) { avgStress += r.stressLevel; stressDays++; }
    });
    avgEnergy = energyDays > 0 ? (avgEnergy / energyDays).toFixed(1) : '--';
    avgStress = stressDays > 0 ? (avgStress / stressDays).toFixed(1) : '--';

    // Weekly breakdown (last 4 weeks)
    const weeklyRec = [];
    for (let w = 0; w < 4; w++) {
      let scoreSum = 0, scoreDays = 0, sleepSum2 = 0, sleepDays2 = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(); date.setDate(date.getDate() - (w * 7 + d));
        const dStr = date.toISOString().split('T')[0];
        if (recoveryLogs[dStr]) {
          scoreSum += (recoveryLogs[dStr].overallScore || 0); scoreDays++;
          if (recoveryLogs[dStr].sleepHours) { sleepSum2 += recoveryLogs[dStr].sleepHours; sleepDays2++; }
        }
      }
      weeklyRec.unshift({ week: `W-${w === 0 ? 'Now' : w}`, score: scoreDays > 0 ? Math.round(scoreSum / scoreDays) : 0, sleep: sleepDays2 > 0 ? (sleepSum2 / sleepDays2).toFixed(1) : 0 });
    }

    return (
      <DrilldownShell title="Recovery Analytics" accentColor="from-purple-400 to-violet-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Avg Recovery Score', value: metrics.recCon, unit: '/ 100', color: 'text-purple-500' },
            { label: 'Avg Sleep',          value: metrics.avgSleep, unit: 'hrs', color: 'text-indigo-500' },
            { label: 'Avg Energy',         value: avgEnergy, unit: energyDays > 0 ? '/ 10' : '', color: 'text-amber-500' },
            { label: 'Avg Stress',         value: avgStress, unit: stressDays > 0 ? '/ 10' : '', color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white/80 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}<span className="text-sm text-gray-400 ml-1">{s.unit}</span></p>
            </div>
          ))}
        </div>

        {/* Recovery Trend Chart */}
        <SectionCard title="14-Day Recovery Trend" icon={BarChart3} iconColor="text-purple-500">
          {recoveryTrendData.some(d => d.score !== null) ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recoveryTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)"/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={8} interval="preserveStartEnd"/>
                  <YAxis yAxisId="score" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }}/>
                  <YAxis yAxisId="sleep" orientation="right" domain={[0, 12]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }}/>
                  <RechartsTooltip {...CHART_TOOLTIP_STYLE}/>
                  <Line yAxisId="score" type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} dot={false} connectNulls/>
                  <Line yAxisId="sleep" type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls/>
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400"><span className="inline-block w-4 h-0.5 bg-purple-500 rounded"/><span>Recovery Score</span></span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400"><span className="inline-block w-4 h-0.5 bg-indigo-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#6366f1 0,#6366f1 4px,transparent 4px,transparent 7px)'}}/><span>Sleep (hrs)</span></span>
              </div>
            </div>
          ) : (
            <EmptyState text="Log recovery data to see your trend."/>
          )}
        </SectionCard>

        {/* Weekly Breakdown */}
        <SectionCard title="Weekly Recovery Breakdown" icon={Moon} iconColor="text-indigo-500">
          <div className="space-y-3">
            {weeklyRec.map((w, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs font-black text-gray-500 w-12">{w.week}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${w.score >= 70 ? 'bg-emerald-500' : w.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${w.score}%` }}/>
                </div>
                <span className="text-xs font-black text-gray-900 dark:text-white w-14 text-right">{w.score > 0 ? `${w.score}/100` : '--'}</span>
                <span className="text-xs font-bold text-indigo-400 w-14">{w.sleep > 0 ? `${w.sleep}h sleep` : ''}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </DrilldownShell>
    );
  };

  // ── DRILLDOWN: Hydration ────────────────────────────────────────────────────
  const HydrationDrilldown = () => {
    const goal = macroGoals.water || 3000;

    // Hydration streak
    let hStreak = 0, hBestStreak = 0, hCur = 0;
    let lastHit = true;
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const hit = (waterLogs[dStr]?.amount || 0) >= goal;
      if (i === 0) { hCur = hit ? 1 : 0; if (!hit) lastHit = false; }
      else {
        if (hit && lastHit) { hCur++; }
        else if (!hit) { lastHit = false; hCur = 0; }
      }
      if (hCur > hBestStreak) hBestStreak = hCur;
    }
    hStreak = lastHit ? hCur : 0;

    // Average daily ml (over days with any data)
    const daysWithData = Object.values(waterLogs).filter(w => w.amount > 0);
    const avgMl = daysWithData.length > 0 ? Math.round(daysWithData.reduce((s, w) => s + w.amount, 0) / daysWithData.length) : 0;

    // Weekly hydration
    const weeklyHyd = [];
    for (let w = 0; w < 4; w++) {
      let hit = 0, total = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(); date.setDate(date.getDate() - (w * 7 + d));
        const dStr = date.toISOString().split('T')[0];
        total++;
        if ((waterLogs[dStr]?.amount || 0) >= goal) hit++;
      }
      weeklyHyd.unshift({ week: `W-${w === 0 ? 'Now' : w}`, rate: Math.round((hit / total) * 100), hit });
    }

    // Last 14 days history
    const hydHistory = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const ml = waterLogs[dStr]?.amount || 0;
      hydHistory.push({ date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), ml, dStr });
    }

    return (
      <DrilldownShell title="Hydration Analytics" accentColor="from-cyan-400 to-blue-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Avg Daily Water', value: avgMl >= 1000 ? (avgMl / 1000).toFixed(1) : avgMl, unit: avgMl >= 1000 ? 'L' : 'ml', color: 'text-cyan-500' },
            { label: 'Goal Hit Rate',   value: metrics.watCon, unit: '%',      color: 'text-blue-500' },
            { label: 'Current Streak',  value: hStreak,         unit: 'days',  color: 'text-emerald-500' },
            { label: 'Days Goal Hit',   value: metrics.waterHit, unit: '/ 30', color: 'text-cyan-500' },
          ].map(s => (
            <div key={s.label} className="bg-white/80 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}<span className="text-sm text-gray-400 ml-1">{s.unit}</span></p>
            </div>
          ))}
        </div>

        {/* Water Trend */}
        <SectionCard title="14-Day Water Trend" icon={BarChart3} iconColor="text-cyan-500">
          {hydHistory.some(h => h.ml > 0) ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hydHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)"/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold' }} dy={8} interval="preserveStartEnd"/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}L` : `${v}`}/>
                  <ReferenceLine y={goal} stroke="#06b6d4" strokeDasharray="6 4" strokeOpacity={0.6} label={{ value: 'Goal', position: 'right', fontSize: 10, fill: '#06b6d4' }}/>
                  <RechartsTooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`${v} ml`, 'Water']}/>
                  <Bar dataKey="ml" fill="#06b6d4" radius={[6, 6, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="No hydration data yet. Use the Water Tracker to log daily intake."/>
          )}
        </SectionCard>

        {/* Weekly hydration + daily history */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SectionCard title="Weekly Hydration" icon={Droplets} iconColor="text-cyan-500">
            <div className="space-y-3">
              {weeklyHyd.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-500 w-12">{w.week}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${w.rate}%` }}/>
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white w-10 text-right">{w.rate}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Daily History (14d)" icon={CalendarDays} iconColor="text-blue-500">
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {hydHistory.filter(h => h.ml > 0).map((h, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-xl border ${h.ml >= goal ? 'bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-500/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/50'}`}>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{h.date}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black ${h.ml >= goal ? 'text-cyan-500' : 'text-gray-900 dark:text-white'}`}>{h.ml >= 1000 ? `${(h.ml/1000).toFixed(1)}L` : `${h.ml}ml`}</span>
                    {h.ml >= goal && <CheckCircle className="w-3.5 h-3.5 text-cyan-500"/>}
                  </div>
                </div>
              ))}
              {hydHistory.every(h => h.ml === 0) && <EmptyState text="No hydration logged in the last 14 days."/>}
            </div>
          </SectionCard>
        </div>
      </DrilldownShell>
    );
  };

  // ── Empty state helper ──────────────────────────────────────────────────────
  const EmptyState = ({ text }) => (
    <div className="text-center py-8 text-gray-400">
      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30"/>
      <p className="text-sm font-bold">{text}</p>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-0 pb-20 animate-fade-in relative">
      
      {/* Hero Section */}
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-8 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"/>
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"/>
        
        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/50">
              <Trophy className="w-4 h-4"/> Score: {metrics.score}/100
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Your Body <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Transformation</span></h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto md:mx-0">Track your weight journey and consistency metrics powered by your real daily habits. <span className="text-emerald-500 font-bold">Click any card to dive deeper →</span></p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mx-auto md:mx-0 w-max">
              <button onClick={() => setLogWeightModal(true)} className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
                <TrendingDown className="w-4 h-4"/> Log Today's Weight
              </button>
              <button onClick={() => setGoalModal(true)} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gray-900/20 dark:shadow-white/10">
                <Settings2 className="w-4 h-4"/> Adjust Goal
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center gap-8 w-full max-w-md">
            <div className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{metrics.curW}<span className="text-lg text-gray-400 ml-1">kg</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target</p>
                  <p className="text-3xl font-black text-emerald-500">{targetW || '--'}<span className="text-lg text-emerald-500/50 ml-1">{targetW ? 'kg' : ''}</span></p>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative mb-2">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out" style={{ width: `${goalProgress}%` }}/>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>{metrics.startW}kg Start</span>
                <span>{Math.round(goalProgress)}% Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid — all cards are clickable */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <StatCard icon={dietProfile.goalType === 'Weight Gain' || dietProfile.goalType === 'Muscle Gain' ? TrendingUp : TrendingDown} title="Weight Change"   val={Math.abs(metrics.wLost)}  unit="kg"    desc="Since first log"          color="text-emerald-500" bg="bg-emerald-500/10" drillKey="weight"   />
        <StatCard icon={Activity}   title="Diet Adherence"  val={metrics.nutCon}            unit="%"    desc={`${metrics.nutHit}/${metrics.nutTotal} days hit`} color="text-amber-500"  bg="bg-amber-500/10"  drillKey="diet"     />
        <StatCard icon={Dumbbell}   title="Gym Consistency" val={metrics.workAdh}           unit="%"    desc={`${metrics.workoutHit}/${metrics.workoutTotal} sessions`} color="text-rose-500"   bg="bg-rose-500/10"   drillKey="gym"      />
        <StatCard icon={HeartPulse} title="Recovery Score"  val={metrics.recCon}            unit="/ 100" desc="Avg 30-Day Recovery"       color="text-purple-500" bg="bg-purple-500/10" drillKey="recovery" />
        <StatCard icon={Droplets}   title="Hydration"       val={metrics.watCon}            unit="%"    desc="Water goal hit rate"        color="text-cyan-500"   bg="bg-cyan-500/10"   drillKey="hydration"/>
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500"/> Weight Trajectory</h3>
            <button onClick={() => setDrilldown('weight')} className="text-xs font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 transition-colors">View Details <ArrowRight className="w-3 h-3"/></button>
          </div>
          <div className="h-72 w-full">
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)"/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={10}/>
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}/>
                  <RechartsTooltip {...CHART_TOOLTIP_STYLE} itemStyle={{ color: '#10b981' }}/>
                  <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                <TrendingDown className="w-8 h-8 mb-2 opacity-50"/>
                <span className="font-bold">Not enough data for chart</span>
                <span className="text-xs">Log your weight to see your trajectory</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-indigo-500"/> Transformation Log</h3>
          </div>
          <div className="space-y-4 max-h-72 overflow-y-auto custom-scrollbar pr-2">
            {bodyProgress.length > 0 ? bodyProgress.map((bp, i) => {
              const isLatest = i === 0;
              const isFirst  = i === bodyProgress.length - 1;
              return (
                <div key={bp.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isLatest ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50'}`}>
                  <div className="text-center w-12 shrink-0">
                    <span className="text-xs font-black text-gray-900 dark:text-white block">{new Date(bp.date).toLocaleDateString(undefined, { day: 'numeric' })}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(bp.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                  </div>
                  <div className="h-10 w-px bg-gray-200 dark:bg-gray-700"/>
                  <div>
                    <span className={`text-xl font-black ${isLatest ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>{bp.weight} kg</span>
                    {isFirst  && <span className="ml-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">Start Point</span>}
                    {isLatest && !isFirst && <span className="ml-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Latest</span>}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center p-8 text-gray-500 font-bold">No entries found</div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Modal */}
      {goalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-2xl text-gray-900 dark:text-white">Transformation Goal</h3>
              <button onClick={() => setGoalModal(false)} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full transition-colors text-gray-600 dark:text-gray-300"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Goal Type</label>
                <select value={goalType} onChange={e => setGoalType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow">
                  <option>Weight Loss</option><option>Weight Gain</option><option>Muscle Gain</option><option>Body Fat</option><option>Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target Weight (kg)</label>
                <input type="number" step="0.1" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} placeholder="e.g. 75" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-black text-xl rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"/>
              </div>
              <button onClick={handleSaveGoal} className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">Save Goal</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Weight Modal */}
      {logWeightModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-2xl text-gray-900 dark:text-white">Log Weight</h3>
              <button onClick={() => setLogWeightModal(false)} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full transition-colors text-gray-600 dark:text-gray-300"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current Weight (kg)</label>
                <input type="number" step="0.1" autoFocus value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="e.g. 75.5" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-black text-3xl rounded-xl px-4 py-4 text-center outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"/>
              </div>
              <button onClick={handleLogWeight} className="w-full py-4 mt-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all hover:scale-[1.02]">Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Modals */}
      {drilldown === 'weight'    && <WeightDrilldown/>}
      {drilldown === 'diet'      && <DietDrilldown/>}
      {drilldown === 'gym'       && <GymDrilldown/>}
      {drilldown === 'recovery'  && <RecoveryDrilldown/>}
      {drilldown === 'hydration' && <HydrationDrilldown/>}
    </div>
  );
}
