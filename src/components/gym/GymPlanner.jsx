// src/components/gym/GymPlanner.jsx
// Adapted from GymPlannerCanvas for integration into Life Planner v1.9.
// Changes from original:
//   - Firebase init removed; db + appId imported from v1.9's firebase.js
//   - Auth removed; user received as prop from App.jsx
//   - Inner sidebar and inner mobile header removed (v1.9 layout handles these)
//   - Outer h-screen wrapper removed; content renders inside v1.9's scroll area

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dumbbell, Activity, Calendar, ChevronRight,
  Plus, Play, RotateCcw, Flame, Trophy, Target, History,
  Search, Edit2, Trash2, Save, X,
  Clock, CheckCircle, PlayCircle, Pause, StopCircle,
  Check, Zap, TrendingUp, Award, Ruler, ArrowLeft, Lock
} from 'lucide-react';

// ── v1.9 Firebase (shared instance) ───────────────────────────────────────────
import { db, appId } from '../../services/firebase';
import {
  collection, onSnapshot, doc, setDoc, addDoc,
  updateDoc, deleteDoc, writeBatch, query, orderBy
} from 'firebase/firestore';

// ── Constants ──────────────────────────────────────────────────────────────────
const MUSCLE_GROUPS    = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Full Body'];
const EQUIPMENT_TYPES  = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other'];
const DIFFICULTIES     = ['Beginner', 'Intermediate', 'Advanced'];

const COMPOUND_EXERCISES = [
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
  'Pull Ups', 'Barbell Row', 'T-Bar Row', 'Overhead Press',
  'Squat', 'Leg Press', 'Romanian Deadlift', 'Close Grip Bench Press',
];

const PREDEFINED_SPLITS = {
  'Push Pull Legs':  ['Push', 'Pull', 'Legs'],
  'Arnold Split':    ['Chest + Back', 'Shoulders + Arms', 'Legs'],
  'Upper Lower':     ['Upper', 'Lower'],
  'Bro Split':       ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
  'Full Body':       ['Full Body A', 'Full Body B', 'Full Body C'],
};

const DEFAULT_EXERCISES = [
  { name: 'Bench Press',         primaryMuscle: 'Chest',     equipment: 'Barbell',    difficulty: 'Intermediate', notes: '' },
  { name: 'Incline Bench Press', primaryMuscle: 'Chest',     equipment: 'Barbell',    difficulty: 'Intermediate', notes: '' },
  { name: 'Chest Fly',           primaryMuscle: 'Chest',     equipment: 'Dumbbell',   difficulty: 'Beginner',     notes: '' },
  { name: 'Pull Ups',            primaryMuscle: 'Back',      equipment: 'Bodyweight', difficulty: 'Intermediate', notes: '' },
  { name: 'Lat Pulldown',        primaryMuscle: 'Back',      equipment: 'Cable',      difficulty: 'Beginner',     notes: '' },
  { name: 'Barbell Row',         primaryMuscle: 'Back',      equipment: 'Barbell',    difficulty: 'Intermediate', notes: '' },
  { name: 'Overhead Press',      primaryMuscle: 'Shoulders', equipment: 'Barbell',    difficulty: 'Intermediate', notes: '' },
  { name: 'Lateral Raise',       primaryMuscle: 'Shoulders', equipment: 'Dumbbell',   difficulty: 'Beginner',     notes: '' },
  { name: 'Barbell Curl',        primaryMuscle: 'Biceps',    equipment: 'Barbell',    difficulty: 'Beginner',     notes: '' },
  { name: 'Pushdown',            primaryMuscle: 'Triceps',   equipment: 'Cable',      difficulty: 'Beginner',     notes: '' },
  { name: 'Squat',               primaryMuscle: 'Legs',      equipment: 'Barbell',    difficulty: 'Intermediate', notes: '' },
  { name: 'Leg Press',           primaryMuscle: 'Legs',      equipment: 'Machine',    difficulty: 'Beginner',     notes: '' },
  { name: 'Romanian Deadlift',   primaryMuscle: 'Legs',      equipment: 'Barbell',    difficulty: 'Intermediate', notes: '' },
  { name: 'Crunch',              primaryMuscle: 'Abs',       equipment: 'Bodyweight', difficulty: 'Beginner',     notes: '' },
  { name: 'Plank',               primaryMuscle: 'Abs',       equipment: 'Bodyweight', difficulty: 'Beginner',     notes: '' },
];

// ── Helper Functions ───────────────────────────────────────────────────────────
const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getLevelData = (totalXp) => {
  let level = 1; let currentBaseXp = 0; let nextLevelXp = 100; let step = 150;
  while (totalXp >= nextLevelXp) {
    level++; currentBaseXp = nextLevelXp;
    if (level === 2) step = 150;
    else if (level === 3) step = 250;
    else step += 100;
    nextLevelXp += step;
  }
  return { level, nextLevelXp, currentBaseXp };
};

const calculateReadiness = (sleep, energy, stress, soreness) => {
  const score = ((sleep / 10) * 40) + ((energy / 10) * 30) - ((stress / 10) * 15) - ((soreness / 10) * 15);
  const finalScore = Math.max(0, Math.min(100, 50 + score));
  if (finalScore >= 80) return { score: finalScore, label: 'Excellent', color: 'text-green-500', desc: 'Ready for heavy training.' };
  if (finalScore >= 60) return { score: finalScore, label: 'Good',      color: 'text-blue-500',  desc: 'Ready for normal volume.' };
  if (finalScore >= 40) return { score: finalScore, label: 'Moderate',  color: 'text-yellow-500',desc: 'Consider a lighter workout.' };
  return { score: finalScore, label: 'Poor', color: 'text-red-500', desc: 'Prioritize recovery today.' };
};

// ── Progress Chart Component ──────────────────────────────────────────────────
const ProgressChartCard = ({ title, dataKey, unit, sortedMeasures }) => {
  const chartData = sortedMeasures.filter(m => m[dataKey] && m[dataKey] !== '').slice(0, 10).reverse();
  const current = chartData[chartData.length - 1] ? Number(chartData[chartData.length - 1][dataKey]) : null;
  const previous = chartData[chartData.length - 2] ? Number(chartData[chartData.length - 2][dataKey]) : null;
  
  let changeIndicator = <span className="text-gray-500 font-bold text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded-full">- 0.0{unit}</span>;
  let summaryText = "No recent changes";

  if (current !== null && previous !== null) {
    const diff = current - previous;
    if (diff > 0) {
      changeIndicator = <span className="text-red-400 font-bold text-xs bg-red-900/30 border border-red-800/50 px-2 py-1 rounded-full">↑ +{diff.toFixed(1)}{unit}</span>;
      summaryText = `Up ${diff.toFixed(1)}${unit} recently`;
    } else if (diff < 0) {
      changeIndicator = <span className="text-green-400 font-bold text-xs bg-green-900/30 border border-green-800/50 px-2 py-1 rounded-full">↓ ${diff.toFixed(1)}{unit}</span>;
      summaryText = `Down ${Math.abs(diff).toFixed(1)}${unit} recently`;
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm flex flex-col h-full hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <p className="text-2xl font-black text-white mt-1">
            {current !== null ? `${current}${unit}` : '--'}
          </p>
        </div>
        {changeIndicator}
      </div>
      <p className="text-xs font-medium text-gray-500 mb-4">{summaryText}</p>
      
      <div className="flex-1 flex flex-col justify-end min-h-[160px]">
        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center flex-1 border-2 border-dashed border-gray-800 rounded-2xl text-center p-4 bg-gray-900/50">
            <TrendingUp className="w-6 h-6 text-gray-600 mb-2" />
            <p className="text-[11px] text-gray-500 font-medium">Add more progress entries to view trends.</p>
          </div>
        ) : (
          (() => {
            const maxW = Math.max(...chartData.map(d => Number(d[dataKey]))) + 2;
            const minW = Math.max(0, Math.min(...chartData.map(d => Number(d[dataKey]))) - 2);
            const range = maxW - minW || 1;

            const points = chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 100;
              const y = 100 - ((Number(d[dataKey]) - minW) / range) * 100;
              return { x, y, value: d[dataKey], date: d.date };
            });

            let path = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
              const p1 = points[i];
              const p2 = points[i+1];
              const cp1x = p1.x + (p2.x - p1.x) / 3;
              const cp1y = p1.y;
              const cp2x = p2.x - (p2.x - p1.x) / 3;
              const cp2y = p2.y;
              path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
            }
            const areaPath = `${path} L ${points[points.length-1].x} 100 L ${points[0].x} 100 Z`;

            return (
              <div className="relative h-32 w-[calc(100%-2rem)] ml-8 mt-2">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="0" x2="100" y2="0" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="100" x2="100" y2="100" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  
                  <path d={areaPath} fill={`url(#gradient-${dataKey})`} />
                  <path d={path} fill="none" stroke="#8b5cf6" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                
                <div className="absolute -left-3 top-0 -translate-x-full -translate-y-1/2 text-[10px] font-bold text-gray-500">{Math.round(maxW)}</div>
                <div className="absolute -left-3 top-1/2 -translate-x-full -translate-y-1/2 text-[10px] font-bold text-gray-500">{Math.round((maxW+minW)/2)}</div>
                <div className="absolute -left-3 top-full -translate-x-full -translate-y-1/2 text-[10px] font-bold text-gray-500">{Math.round(minW)}</div>

                {points.map((p, i) => (
                  <div 
                    key={i} 
                    className="absolute group z-10"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-3 h-3 bg-gray-900 border-2 border-purple-500 rounded-full cursor-pointer group-hover:bg-purple-500 group-hover:scale-125 transition-all duration-300" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none flex flex-col items-center">
                      <div className="bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-xl shadow-xl text-xs font-bold whitespace-nowrap">
                        {p.value} {unit}
                        <span className="block text-[10px] text-gray-400 font-normal">{p.date.substring(5)}</span>
                      </div>
                      <div className="w-2 h-2 bg-gray-800 border-r border-b border-gray-700 rotate-45 -mt-1" />
                    </div>
                  </div>
                ))}

                {points.map((p, i) => (
                  <div 
                    key={`label-${i}`} 
                    className="absolute top-full mt-3 text-[10px] font-bold text-gray-500 whitespace-nowrap"
                    style={{ left: `${p.x}%`, transform: 'translateX(-50%)' }}
                  >
                    {(i === 0 || i === points.length - 1) ? p.date.substring(5) : ''}
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function GymPlanner({ user }) {
  const [activeView, setActiveView] = useState('dashboard');

  // ── Scroll-to-top ref — resets parent scroll container on every view change ─
  const gymRootRef = useRef(null);

  // Date tracking
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  // Collections State
  const [exercises,     setExercises]     = useState([]);
  const [templates,     setTemplates]     = useState([]);
  const [schedules,     setSchedules]     = useState([]);
  const [sessions,      setSessions]      = useState([]);
  const [measurements,  setMeasurements]  = useState([]);
  const [recoveryLogs,  setRecoveryLogs]  = useState([]);
  const [gymSettings,   setGymSettings]   = useState({
    activeSplitName: 'Push Pull Legs',
    activeSplitDays: PREDEFINED_SPLITS['Push Pull Legs'],
  });

  // UI State
  const [toast,           setToast]          = useState({ show: false, msg: '', type: 'success' });
  const [summarySession,  setSummarySession]  = useState(null);
  const [profile,         setProfile]         = useState({ xp: 0, level: 1, currentStreak: 0, bestStreak: 0 });
  const [prs,             setPrs]             = useState({});

  // Exercise Library state
  const [libSearch,    setLibSearch]    = useState('');
  const [libForm,      setLibForm]      = useState(false);
  const [libFormData,  setLibFormData]  = useState({ name: '', primaryMuscle: 'Chest', equipment: 'Barbell', difficulty: 'Beginner', notes: '' });
  const [libEditId,    setLibEditId]    = useState(null);

  // Workout Builder state
  const [bldTemplate,  setBldTemplate]  = useState(null);
  const [bldName,      setBldName]      = useState('');
  const [bldExercises, setBldExercises] = useState([]);
  const [bldSearch,    setBldSearch]    = useState('');

  // Scheduler state
  const [schModalOpen, setSchModalOpen] = useState(false);
  const [schForm,      setSchForm]      = useState({ templateId: '', date: todayStr, startTime: '18:00', duration: 90 });

  // Split builder state
  const [splitDays, setSplitDays] = useState([]);
  const [splitName, setSplitName] = useState('');

  // Body / Recovery form state
  const [measureForm, setMeasureForm] = useState({ date: todayStr, weight: '', bodyFat: '', chest: '', waist: '', shoulders: '', leftArm: '', rightArm: '', leftThigh: '', rightThigh: '', notes: '' });
  const [recForm,     setRecForm]     = useState({ date: todayStr, sleep: 8, energy: 7, stress: 3, soreness: 3, hydration: 8, mood: 'Good', notes: '' });

  const calendarContainerRef = useRef(null);

  useEffect(() => {
    if (activeView === 'scheduler' && calendarContainerRef.current) {
      setTimeout(() => {
        const todayEl = document.getElementById('calendar-card-today');
        if (todayEl && calendarContainerRef.current) {
          const container = calendarContainerRef.current;
          const scrollPos = todayEl.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (todayEl.clientWidth / 2);
          container.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [activeView]);

  // ── 1-second timer loop ────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Firestore subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    
    if (!db) {
      try {
        const localSettings = JSON.parse(localStorage.getItem(`gym_settings_${user.uid}`));
        if (localSettings) setGymSettings(prev => ({ ...prev, ...localSettings }));
        
        let localExercises = JSON.parse(localStorage.getItem(`gym_exercises_${user.uid}`));
        if (!localExercises || localExercises.length === 0) {
          localExercises = DEFAULT_EXERCISES.map((ex, i) => ({ id: `default-${i}`, ...ex, isCustom: false }));
          localStorage.setItem(`gym_exercises_${user.uid}`, JSON.stringify(localExercises));
        }
        setExercises(localExercises);
        
        const localTpls = JSON.parse(localStorage.getItem(`gym_templates_${user.uid}`));
        if (localTpls) setTemplates(localTpls);
        
        const localSch = JSON.parse(localStorage.getItem(`gym_schedules_${user.uid}`));
        if (localSch) setSchedules(localSch);
        
        const localMeasures = JSON.parse(localStorage.getItem(`gym_measurements_${user.uid}`));
        if (localMeasures) setMeasurements(localMeasures);
        
        const localRecovery = JSON.parse(localStorage.getItem(`gym_recovery_${user.uid}`));
        if (localRecovery) setRecoveryLogs(localRecovery);
      } catch (e) {}
      return;
    }

    const sub = (col, setter) =>
      onSnapshot(
        collection(db, 'artifacts', appId, 'users', user.uid, col),
        snap => setter(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

    const uEx = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'exercises'),
      async (snap) => {
        if (snap.empty) {
          const batch = writeBatch(db);
          DEFAULT_EXERCISES.forEach(ex => {
            const docRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'exercises'));
            batch.set(docRef, { ...ex, isCustom: false });
          });
          await batch.commit();
        } else {
          setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      }
    );

    const uTpl = sub('gym_templates',    setTemplates);
    const uSch = sub('gym_schedules',    setSchedules);
    const uSes = sub('gym_sessions',     setSessions);
    const uMea = sub('gym_measurements', setMeasurements);
    const uRec = sub('gym_recovery',     setRecoveryLogs);

    const uSet = onSnapshot(
      doc(db, 'artifacts', appId, 'users', user.uid, 'gym_settings', 'main'),
      docSnap => { if (docSnap.exists()) setGymSettings(prev => ({ ...prev, ...docSnap.data() })); }
    );

    return () => { uEx(); uTpl(); uSch(); uSes(); uMea(); uRec(); uSet(); };
  }, [user]);

  // ── Progression calculation ────────────────────────────────────────────────
  useEffect(() => {
    const completed = sessions
      .filter(s => s.status === 'Completed')
      .sort((a, b) => a.endTime - b.endTime);

    let totalXp = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let lastDate = null;
    const calculatedPrs = {};

    completed.forEach(s => {
      totalXp += 50 + (s.completedExercises * 10);

      if (!lastDate) {
        currentStreak = 1;
        bestStreak = 1;
      } else {
        const diff = Math.floor((new Date(s.date) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (diff === 1) currentStreak++;
        else if (diff > 1) currentStreak = 1;
      }
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      lastDate = s.date;

      s.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          if (set.completed) {
            const w = Number(set.weight);
            if (!calculatedPrs[ex.name] || w > calculatedPrs[ex.name].weight) {
              calculatedPrs[ex.name] = { weight: w, date: s.date };
            }
          }
        });
      });
    });

    if (lastDate) {
      const daysSinceLast = Math.floor((new Date(todayStr) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceLast > 1) currentStreak = 0;
    }

    const { level } = getLevelData(totalXp);
    setProfile({ xp: totalXp, level, currentStreak, bestStreak });
    setPrs(calculatedPrs);
  }, [sessions, todayStr]);

  // ── Sync split builder when navigating to splits view ─────────────────────
  useEffect(() => {
    if (activeView === 'splits') {
      setSplitDays(gymSettings.activeSplitDays || []);
      setSplitName(gymSettings.activeSplitName || '');
    }
  }, [activeView, gymSettings]);

  // ── Scroll-to-top whenever the active view changes ─────────────────────────
  // PRIMARY NAV FIX: v1.9's overflow-y-auto container retains scroll position
  // when GymPlanner's internal view changes. Without this, clicking a module
  // card (which is below the fold) leaves the viewport scrolled past the new
  // view's content, making it appear as if the module "didn't open".
  useEffect(() => {
    if (gymRootRef.current) {
      gymRootRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [activeView]);

  // ── Guard for execution view — redirect to dashboard if no active session ──
  // Moved OUT of renderExecution (which called setActiveView during render —
  // a React anti-pattern that causes StrictMode warnings and render-loop bugs).
  useEffect(() => {
    if (activeView === 'execution') {
      const hasActive = sessions.some(s => s.status === 'Active' || s.status === 'Paused');
      if (!hasActive) setActiveView('dashboard');
    }
  }, [activeView, sessions]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  // ── Task Sync helpers (writes gym schedules into v1.9 tasks collection) ───
  const syncTask = async (schData) => {
    if (!user || !db) return;
    try {
      const [h, m] = schData.startTime.split(':').map(Number);
      const totalMins = h * 60 + m + schData.duration;
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', `gym_${schData.id}`), {
        name:           `Workout: ${schData.templateName}`,
        date:           schData.date,
        startTime:      schData.startTime,
        endTime,
        time:           parseFloat((schData.duration / 60).toFixed(2)),
        priority:       30,
        category:       'Gym',
        status:         schData.executionStatus === 'Completed' ? 'Completed' : 'Not Started',
        completed:      schData.executionStatus === 'Completed',
        recurrence:     'One Time',
        statusOverrides:{},
        timers:         {},
        createdAt:      new Date().toISOString(),
        isGymSync:      true,
      });
    } catch (e) { console.error('syncTask error:', e); }
  };

  const removeSyncedTask = async (id) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', `gym_${id}`));
    } catch (e) { console.error('removeSyncedTask error:', e); }
  };

  // ── Breadcrumb Component ───────────────────────────────────────────────────
  const Breadcrumb = ({ title }) => (
    <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-6 pb-4 border-b border-gray-800">
      <button
        onClick={() => setActiveView('dashboard')}
        className="hover:text-orange-500 transition-colors flex items-center gap-1"
      >
        <Activity className="w-4 h-4" /> Gym Hub
      </button>
      <ChevronRight className="w-4 h-4" />
      <span className="text-white">{title}</span>
    </div>
  );

  // ── renderDashboard ────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const activeSession = sessions.find(s => s.status === 'Active' || s.status === 'Paused');

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const schedThisWeek = schedules.filter(s => s.date >= todayStr && s.date <= nextWeekStr).length;

    const latestMeasures = [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentWeight  = latestMeasures[0]?.weight ? `${latestMeasures[0].weight} kg` : 'N/A';

    const latestRec = [...recoveryLogs].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const recScore  = latestRec
      ? `${Math.round(calculateReadiness(latestRec.sleep, latestRec.energy, latestRec.stress, latestRec.soreness).score)}/100`
      : 'N/A';

    const moduleCards = [
      { id: 'splits',    title: 'Workout Splits',   icon: RotateCcw,  desc: 'Create and manage training splits',         stat: `${gymSettings.activeSplitDays.length} active days` },
      { id: 'exercises', title: 'Exercise Library',  icon: Dumbbell,   desc: 'Manage exercises and categories',           stat: `${exercises.length} exercises` },
      { id: 'builder',   title: 'Workout Builder',   icon: Plus,       desc: 'Design custom workout templates',           stat: `${templates.length} templates` },
      { id: 'scheduler', title: 'Weekly Calendar',   icon: Calendar,   desc: 'Schedule and view training days',           stat: `${schedThisWeek} upcoming` },
      { id: 'history',   title: 'Workout History',   icon: History,    desc: 'Review completed sessions and volume',      stat: `${sessions.filter(s => s.status === 'Completed').length} completed` },
      { id: 'body',      title: 'Body Progress',     icon: Ruler,      desc: 'Track weight and body measurements',        stat: `Latest: ${currentWeight}` },
      { id: 'recovery',  title: 'Recovery Tracking', icon: Zap,        desc: 'Log sleep, recovery and readiness',         stat: `Score: ${recScore}` },
    ];

    return (
      <div className="space-y-8 max-w-6xl mx-auto pb-10">
        <div>
          <h2 className="text-3xl font-black text-white">Gym Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Your central command for fitness planning and tracking.</p>
        </div>

        {activeSession && (
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-orange-100">Workout In Progress</p>
                <h3 className="text-2xl font-bold">{activeSession.templateName}</h3>
              </div>
            </div>
            <button
              onClick={() => setActiveView('execution')}
              className="px-6 py-3 bg-white text-orange-600 font-black rounded-xl hover:bg-gray-100 shadow-sm w-full md:w-auto transition-colors"
            >
              Resume Workout
            </button>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Active Split',       value: gymSettings.activeSplitName, className: 'truncate', isStreak: false },
            { label: 'Scheduled (Week)',   value: `${schedThisWeek} Workouts`,  isStreak: false },
            { label: 'Total Exercises',    value: `${exercises.length} Items`,  isStreak: false },
            { label: 'Current Streak',     value: `${profile.currentStreak} Days`, isStreak: true },
            { label: 'Recovery Score',     value: recScore,   isStreak: false },
            { label: 'Current Weight',     value: currentWeight, isStreak: false },
          ].map((card, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 uppercase">{card.label}</p>
              <h4 className={`text-lg font-bold mt-1 ${card.isStreak ? 'text-orange-500' : 'text-white'} ${card.className || ''}`} title={card.value}>
                {card.isStreak && <Flame className="w-4 h-4 inline mr-1" />}
                {card.value}
              </h4>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActiveView('splits')} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"><RotateCcw className="w-4 h-4 text-orange-500" /> Create Split</button>
            <button onClick={() => { setActiveView('exercises'); setLibFormData({ name: '', primaryMuscle: 'Chest', equipment: 'Barbell', difficulty: 'Beginner', notes: '' }); setLibEditId(null); setLibForm(true); }} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"><Dumbbell className="w-4 h-4 text-orange-500" /> Add Exercise</button>
            <button onClick={() => { setActiveView('builder'); setBldName('New Workout'); setBldExercises([]); setBldTemplate('new'); }} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"><Plus className="w-4 h-4 text-orange-500" /> Build Workout</button>
            <button onClick={() => { setActiveView('scheduler'); setSchModalOpen(true); }} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"><Calendar className="w-4 h-4 text-orange-500" /> Schedule Workout</button>
            <button onClick={() => setActiveView('recovery')} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"><Zap className="w-4 h-4 text-orange-500" /> Log Recovery</button>
            <button onClick={() => setActiveView('body')} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"><Ruler className="w-4 h-4 text-orange-500" /> Add Measurement</button>
          </div>
        </div>

        {/* Module cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleCards.map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveView(mod.id)}
              className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 p-6 rounded-3xl flex flex-col items-start text-left transition-all group"
            >
              <div className="w-12 h-12 bg-gray-800 group-hover:bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <mod.icon className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{mod.title}</h3>
              <p className="text-sm text-gray-400 mb-4 h-10">{mod.desc}</p>
              <div className="mt-auto w-full flex items-center justify-between border-t border-gray-800 pt-4">
                <span className="text-xs font-bold text-gray-500 uppercase">{mod.stat}</span>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {/* Today's Schedule */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl mt-4">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-orange-500" /> Today's Schedule
          </h3>
          <div className="space-y-3">
            {schedules.filter(s => s.date === todayStr).length === 0 ? (
              <p className="text-sm text-gray-500 font-medium py-4 text-center border border-dashed border-gray-800 rounded-xl">
                No workouts scheduled for today.
              </p>
            ) : (
              schedules.filter(s => s.date === todayStr).map(sch => {
                const activeSession = sessions.find(s => s.status === 'Active' || s.status === 'Paused');
                return (
                  <div key={sch.id} className="p-4 bg-gray-800 border border-gray-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-orange-500">{sch.startTime} ({sch.duration} min)</p>
                      <h4 className="font-bold text-white text-lg">{sch.templateName}</h4>
                    </div>
                    {sch.executionStatus === 'Completed' ? (
                      <span className="bg-green-900/40 text-green-400 border border-green-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (activeSession) return showToast('Finish active workout first!', 'error');
                          const tpl = templates.find(t => t.id === sch.templateId);
                          if (!tpl || !tpl.exercises?.length) return showToast('Template is empty', 'error');
                          const sesData = {
                            scheduleId:     sch.id,
                            templateName:   sch.templateName,
                            targetDuration: sch.duration,
                            date:           todayStr,
                            startTime:      Date.now(),
                            status:         'Active',
                            elapsedMs:      0,
                            lastActiveTimestamp: Date.now(),
                            notes:          '',
                            exercises: tpl.exercises.map(ex => ({
                              id:           ex.id,
                              exerciseId:   ex.exerciseId,
                              name:         ex.name,
                              targetSets:   Number(ex.sets),
                              targetReps:   ex.reps,
                              targetWeight: Number(ex.weight),
                              completed:    false,
                              sets: Array.from({ length: Number(ex.sets) }).map(() => ({
                                weight: ex.weight, reps: ex.reps, completed: false,
                              })),
                            })),
                            createdAt: new Date().toISOString(),
                          };
                          addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'gym_sessions'), sesData)
                            .then(() => {
                              updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_schedules', sch.id), { executionStatus: 'In Progress' });
                              syncTask({ ...sch, executionStatus: 'In Progress' });
                              setActiveView('execution');
                              showToast('Workout Started!');
                            });
                        }}
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center transition-colors"
                      >
                        <Play className="w-4 h-4" /> Start Workout
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── renderBodyProgress ─────────────────────────────────────────────────────
  const renderBodyProgress = () => {
    const handleSaveMeasure = async () => {
      if (!measureForm.weight) return showToast('Weight required', 'error');
      try {
        const id = measureForm.date;
        const payload = { ...measureForm, createdAt: new Date().toISOString() };

        if (!db) {
          const localMeasures = JSON.parse(localStorage.getItem(`gym_measurements_${user.uid}`) || '[]');
          const index = localMeasures.findIndex(m => m.id === id);
          if (index >= 0) localMeasures[index] = { id, ...payload };
          else localMeasures.push({ id, ...payload });
          
          localStorage.setItem(`gym_measurements_${user.uid}`, JSON.stringify(localMeasures));
          setMeasurements(localMeasures);
          showToast('Measurement Logged (Offline)!');
        } else {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_measurements', id), payload);
          showToast('Measurement Logged!');
        }

        setMeasureForm({ date: todayStr, weight: '', bodyFat: '', chest: '', waist: '', shoulders: '', leftArm: '', rightArm: '', leftThigh: '', rightThigh: '', notes: '' });
      } catch (e) {
        console.error('Save measure error:', e);
        showToast('Error saving', 'error');
      }
    };

    const handleResetForm = () => {
      if (window.confirm("Clear all entered values?")) {
        setMeasureForm({ date: todayStr, weight: '', bodyFat: '', chest: '', waist: '', shoulders: '', leftArm: '', rightArm: '', leftThigh: '', rightThigh: '', notes: '' });
      }
    };

    const isSunday = new Date(todayStr).getDay() === 0;
    
    const nextSundayStr = (() => {
      const d = new Date(todayStr);
      const diff = d.getDay() === 0 ? 7 : 7 - d.getDay();
      d.setDate(d.getDate() + diff);
      return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    })();

    const sortedMeasures = [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestMeasure = sortedMeasures[0];
    const previousMeasure = sortedMeasures[1];

    // Helpers for metrics
    const getChange = (key) => {
      if (!latestMeasure?.[key] || !previousMeasure?.[key]) return { text: '0.0', type: 'neutral' };
      const diff = Number(latestMeasure[key]) - Number(previousMeasure[key]);
      if (diff > 0) return { text: `+${diff.toFixed(1)}`, type: 'negative' }; // 'negative' for red since increase in weight/fat is often considered red in standard dashboards. We can keep it generic, but let's assume weight/fat gain = red, loss = green for this context.
      if (diff < 0) return { text: diff.toFixed(1), type: 'positive' }; // 'positive' for green
      return { text: '0.0', type: 'neutral' };
    };

    const monthlyChangeWeight = getChange('weight');
    const weightColor = monthlyChangeWeight.type === 'positive' ? 'text-green-400' : (monthlyChangeWeight.type === 'negative' ? 'text-red-400' : 'text-gray-400');

    const lastUpdated = latestMeasure ? new Date(latestMeasure.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never';

    return (
      <div className="space-y-10 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
        <Breadcrumb title="Body Progress" />
        
        {/* 1. Body Overview Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-black text-white">Body Overview</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Weight</p>
              <h4 className="text-3xl font-black text-white mt-1">{latestMeasure?.weight || '--'} <span className="text-base font-medium text-gray-400">kg</span></h4>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold">
                 <span className={`${weightColor} bg-gray-800 px-2 py-1 rounded-md`}>{monthlyChangeWeight.text} kg</span>
                 <span className="text-gray-500 text-xs">vs last entry</span>
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Body Fat</p>
              <h4 className="text-3xl font-black text-white mt-1">{latestMeasure?.bodyFat || '--'} <span className="text-base font-medium text-gray-400">%</span></h4>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold">
                 {(() => {
                   const c = getChange('bodyFat');
                   const col = c.type === 'positive' ? 'text-green-400' : (c.type === 'negative' ? 'text-red-400' : 'text-gray-400');
                   return <span className={`${col} bg-gray-800 px-2 py-1 rounded-md`}>{c.text} %</span>;
                 })()}
                 <span className="text-gray-500 text-xs">vs last entry</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Goal</p>
              <h4 className="text-3xl font-black text-white mt-1">Maintenance</h4>
              <p className="text-sm font-medium text-gray-500 mt-2">Adjust diet & training</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</p>
              <h4 className="text-xl font-bold text-white mt-1">{lastUpdated}</h4>
              <p className="text-sm font-medium text-gray-500 mt-2">{sortedMeasures.length} total entries</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-10">
            {/* 3. Trend Analytics Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">Trend Analytics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Weight Trend',     dataKey: 'weight',     unit: 'kg' },
                  { title: 'Body Fat Trend',   dataKey: 'bodyFat',    unit: '%' },
                  { title: 'Chest Size',       dataKey: 'chest',      unit: 'cm' },
                  { title: 'Waist Size',       dataKey: 'waist',      unit: 'cm' },
                ].map(metric => (
                  <ProgressChartCard 
                    key={metric.dataKey} 
                    title={metric.title} 
                    dataKey={metric.dataKey} 
                    unit={metric.unit} 
                    sortedMeasures={sortedMeasures} 
                  />
                ))}
              </div>
            </section>
            
            {/* 4. Historical Entries Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">History</h2>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                {sortedMeasures.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-medium">No history entries found.</div>
                ) : (
                  <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {sortedMeasures.map((entry, idx) => (
                      <div key={idx} className="p-5 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                           <span className="text-sm font-bold text-white">{new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                           {entry.notes && <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-md">{entry.notes}</span>}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-y-3 gap-x-2 text-sm">
                           {['weight', 'bodyFat', 'chest', 'waist', 'shoulders', 'leftArm'].map(k => {
                             if (!entry[k]) return null;
                             const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                             const unit = (k === 'weight') ? 'kg' : (k === 'bodyFat' ? '%' : 'cm');
                             return (
                               <div key={k} className="flex flex-col">
                                 <span className="text-[10px] uppercase font-bold text-gray-500">{label}</span>
                                 <span className="font-bold text-gray-300">{entry[k]}{unit}</span>
                               </div>
                             );
                           })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* 2. Measurement Summary Cards (Current state in sidebar-like col) */}
            <section>
               <h2 className="text-xl font-black text-white mb-4">Current Stats</h2>
               <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
                 {[
                    { label: 'Chest', key: 'chest', unit: 'cm' },
                    { label: 'Waist', key: 'waist', unit: 'cm' },
                    { label: 'Shoulders', key: 'shoulders', unit: 'cm' },
                    { label: 'Arms (L/R)', custom: true, value: `${latestMeasure?.leftArm||'--'}/${latestMeasure?.rightArm||'--'} cm` },
                    { label: 'Thighs (L/R)', custom: true, value: `${latestMeasure?.leftThigh||'--'}/${latestMeasure?.rightThigh||'--'} cm` },
                 ].map((item, idx) => {
                   let val = item.custom ? item.value : (latestMeasure?.[item.key] ? `${latestMeasure[item.key]} ${item.unit}` : '--');
                   let c = item.custom ? null : getChange(item.key);
                   let trendStr = '';
                   let tCol = 'text-gray-500';
                   if (c && c.text !== '0.0') {
                      trendStr = c.text;
                      tCol = c.type === 'positive' ? 'text-green-400' : 'text-red-400';
                   }
                   return (
                     <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0 last:pb-0 transition-colors hover:bg-gray-800/20 -mx-2 px-2 rounded-lg">
                       <span className="text-sm font-bold text-gray-400">{item.label}</span>
                       <div className="text-right">
                          <div className="text-sm font-bold text-white">{val}</div>
                          {trendStr && <div className={`text-[10px] font-bold ${tCol}`}>{trendStr}</div>}
                       </div>
                     </div>
                   );
                 })}
               </div>
            </section>
            
            {/* Log Measurements Form as a styled card */}
            <section>
              <h2 className="text-xl font-black text-white mb-4">Log Entry</h2>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm hover:border-gray-700 transition-colors relative overflow-hidden">
                {!isSunday && (
                  <div className="absolute inset-0 z-10 bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                    <h3 className="text-white font-bold mb-2">Weekly check-in unlocks every Sunday.</h3>
                    <p className="text-sm text-gray-400">Next Check-In: <span className="font-bold text-gray-300">{nextSundayStr}</span></p>
                  </div>
                )}
                
                <div className={`space-y-4 ${!isSunday ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</label>
                    <input type="date" value={measureForm.date} onChange={e => setMeasureForm({ ...measureForm, date: e.target.value })} disabled={!isSunday} className="w-full p-2.5 text-sm bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'weight',     label: 'Weight (kg)*',  type: 'number' },
                      { key: 'bodyFat',    label: 'Body Fat (%)',   type: 'number' },
                      { key: 'chest',      label: 'Chest (cm)',     type: 'number' },
                      { key: 'waist',      label: 'Waist (cm)',     type: 'number' },
                      { key: 'shoulders',  label: 'Shoulders(cm)', type: 'number' },
                      { key: 'leftArm',    label: 'Left Arm(cm)',  type: 'number' },
                      { key: 'rightArm',   label: 'Right Arm(cm)', type: 'number' },
                      { key: 'leftThigh',  label: 'L Thigh(cm)',type: 'number' },
                      { key: 'rightThigh', label: 'R Thigh(cm)',type: 'number' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{field.label}</label>
                        <input type={field.type} value={measureForm[field.key]} onChange={e => setMeasureForm({ ...measureForm, [field.key]: e.target.value })} disabled={!isSunday} className="w-full p-2.5 text-sm bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors mt-1 placeholder-gray-700" placeholder="0.0" />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Notes</label>
                      <input type="text" value={measureForm.notes} onChange={e => setMeasureForm({ ...measureForm, notes: e.target.value })} disabled={!isSunday} className="w-full p-2.5 text-sm bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors mt-1 placeholder-gray-700" placeholder="Optional notes..." />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleResetForm} disabled={!isSunday} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm border border-gray-700">Clear</button>
                    <button onClick={handleSaveMeasure} disabled={!isSunday} className="flex-[2] py-3 bg-white hover:bg-gray-200 text-gray-900 font-black rounded-xl transition-colors text-sm shadow-sm">Save Entry</button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    );
  };


  // ── renderRecovery ─────────────────────────────────────────────────────────
  const renderRecovery = () => {
    const handleSaveRec = async () => {
      try {
        const id = `${recForm.date}_recovery`;
        const payload = { ...recForm, createdAt: new Date().toISOString() };
        
        if (!db) {
          const localRecs = JSON.parse(localStorage.getItem(`gym_recovery_${user.uid}`) || '[]');
          const idx = localRecs.findIndex(r => r.id === id);
          if (idx >= 0) localRecs[idx] = { id, ...payload };
          else localRecs.push({ id, ...payload });
          
          localStorage.setItem(`gym_recovery_${user.uid}`, JSON.stringify(localRecs));
          setRecoveryLogs(localRecs);
          showToast('Recovery Logged (Offline)!');
          return;
        }

        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_recovery', id), payload);
        showToast('Recovery Logged!');
      } catch (e) { 
        console.error('Recovery save error:', e);
        showToast('Error saving recovery data', 'error'); 
      }
    };

    const sortedLogs = [...recoveryLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestLog = sortedLogs[0];
    
    // Fallback to recForm or defaults if no history
    const currentReadiness = calculateReadiness(
      latestLog?.sleep || 8, 
      latestLog?.energy || 7, 
      latestLog?.stress || 3, 
      latestLog?.soreness || 3
    );

    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
        <Breadcrumb title="Recovery Tracking" />
        
        {/* 1. Recovery Overview Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-black text-white">Today's Overview</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors col-span-2 lg:col-span-2 relative overflow-hidden">
               <div className={`absolute top-0 left-0 w-1 h-full ${currentReadiness.color.replace('text-', 'bg-')}`} />
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recovery Score</p>
               <div className="flex items-end gap-3">
                 <h4 className={`text-4xl font-black ${currentReadiness.color}`}>{Math.round(currentReadiness.score)}</h4>
                 <span className={`text-sm font-bold mb-1 ${currentReadiness.color}`}>{currentReadiness.label}</span>
               </div>
               <p className="text-xs text-gray-400 mt-2 line-clamp-2">{currentReadiness.desc}</p>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sleep</p>
              <h4 className="text-2xl font-black text-white mt-1">{latestLog?.sleep || '--'} <span className="text-sm font-medium text-gray-400">hrs</span></h4>
              <div className="mt-2 text-xs font-bold text-blue-400">Rest</div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Energy</p>
              <h4 className="text-2xl font-black text-white mt-1">{latestLog?.energy || '--'}<span className="text-sm font-medium text-gray-400">/10</span></h4>
              <div className="mt-2 text-xs font-bold text-purple-400">Vitality</div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stress</p>
              <h4 className="text-2xl font-black text-white mt-1">{latestLog?.stress || '--'}<span className="text-sm font-medium text-gray-400">/10</span></h4>
              <div className="mt-2 text-xs font-bold text-red-400">Load</div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hydration</p>
              <h4 className="text-2xl font-black text-white mt-1">{latestLog?.hydration || '--'}<span className="text-sm font-medium text-gray-400">/10</span></h4>
              <div className="mt-2 text-xs font-bold text-cyan-400">Intake</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* 4. Recovery Trends Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">Recovery Trends</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProgressChartCard 
                  title="Sleep Trend" 
                  dataKey="sleep" 
                  unit="h" 
                  sortedMeasures={sortedLogs} 
                />
                <ProgressChartCard 
                  title="Energy Trend" 
                  dataKey="energy" 
                  unit="" 
                  sortedMeasures={sortedLogs} 
                />
              </div>
            </section>
            
            {/* 5. Historical Entries Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">Recovery History</h2>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                {sortedLogs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-medium">No recovery history found. Start logging!</div>
                ) : (
                  <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {sortedLogs.map((entry, idx) => {
                      const score = calculateReadiness(entry.sleep, entry.energy, entry.stress, entry.soreness);
                      return (
                        <div key={idx} className="p-5 hover:bg-gray-800/50 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex flex-col min-w-[120px]">
                            <span className="text-sm font-bold text-white">{new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                            <span className={`text-[10px] font-bold uppercase mt-1 ${score.color}`}>{score.label}</span>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-3 sm:grid-cols-5 gap-2 text-sm">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-500">Sleep</span>
                              <span className="font-bold text-gray-300">{entry.sleep}h</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-500">Energy</span>
                              <span className="font-bold text-gray-300">{entry.energy}/10</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-500">Stress</span>
                              <span className="font-bold text-gray-300">{entry.stress}/10</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-500">Soreness</span>
                              <span className="font-bold text-gray-300">{entry.soreness}/10</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-500">Mood</span>
                              <span className="font-bold text-gray-300">{entry.mood || '--'}</span>
                            </div>
                          </div>
                          
                          {entry.notes && (
                             <div className="text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg italic max-w-xs truncate">"{entry.notes}"</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* 2. Daily Recovery Form */}
            <section>
              <h2 className="text-xl font-black text-white mb-4">Log Daily Recovery</h2>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm hover:border-gray-700 transition-colors">
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</label>
                    <input type="date" value={recForm.date} onChange={e => setRecForm({ ...recForm, date: e.target.value })} className="w-full p-2.5 text-sm bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors mt-1" />
                  </div>
                  
                  {[
                    { label: 'Sleep (Hours)',       key: 'sleep',    min: 0,  max: 14, step: 0.5, unit: 'hrs', color: 'accent-blue-500' },
                    { label: 'Energy Level (1-10)', key: 'energy',   min: 1,  max: 10, step: 1,   unit: '', color: 'accent-purple-500' },
                    { label: 'Stress Level (1-10)', key: 'stress',   min: 1,  max: 10, step: 1,   unit: '', color: 'accent-red-500' },
                    { label: 'Muscle Soreness (1-10)', key: 'soreness', min: 1, max: 10, step: 1, unit: '', color: 'accent-orange-500' },
                    { label: 'Hydration (1-10)',    key: 'hydration',min: 1,  max: 10, step: 1,   unit: '', color: 'accent-cyan-500' },
                  ].map(field => (
                    <div key={field.key}>
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <label>{field.label}</label>
                        <span className="text-white">{recForm[field.key]} {field.unit}</span>
                      </div>
                      <input
                        type="range" min={field.min} max={field.max} step={field.step}
                        value={recForm[field.key]}
                        onChange={e => setRecForm({ ...recForm, [field.key]: Number(e.target.value) })}
                        className={`w-full ${field.color}`}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Mood</label>
                    <div className="flex flex-wrap gap-2">
                      {['Excellent', 'Good', 'Okay', 'Poor', 'Terrible'].map(mood => (
                        <button
                          key={mood}
                          onClick={() => setRecForm({ ...recForm, mood })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${recForm.mood === mood ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Notes (Optional)</label>
                    <input type="text" value={recForm.notes} onChange={e => setRecForm({ ...recForm, notes: e.target.value })} className="w-full p-2.5 text-sm bg-gray-950 border border-gray-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors placeholder-gray-700" placeholder="e.g., Felt very sluggish..." />
                  </div>

                  <button onClick={handleSaveRec} className="w-full py-3 bg-white hover:bg-gray-200 text-gray-900 font-black rounded-xl mt-2 transition-colors text-sm shadow-sm flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Save Recovery
                  </button>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>
    );
  };

  // ── renderSplits ───────────────────────────────────────────────────────────
  const renderSplits = () => {
    const handleSaveSplit = async () => {
      try {
        const payload = {
          activeSplitName: splitName || gymSettings.activeSplitName || 'Custom Split',
          activeSplitDays: (splitDays && splitDays.length > 0) 
            ? [...splitDays] 
            : (gymSettings.activeSplitDays ? [...gymSettings.activeSplitDays] : []),
        };

        if (!db) {
          localStorage.setItem(`gym_settings_${user.uid}`, JSON.stringify(payload));
          setGymSettings(prev => ({ ...prev, ...payload }));
          showToast('Split Configuration Saved (Offline)!');
          return;
        }

        await setDoc(
          doc(db, 'artifacts', appId, 'users', user.uid, 'gym_settings', 'main'),
          payload,
          { merge: true }
        );
        showToast('Split Configuration Saved!');
      } catch (e) {
        console.error('Save error:', e);
        showToast('Error saving: ' + e.message, 'error');
      }
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <Breadcrumb title="Workout Splits" />

        {/* Predefined splits */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-orange-500 mb-4 uppercase text-sm tracking-wider">Quick Predefined Splits</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(PREDEFINED_SPLITS).map(name => (
              <button
                key={name}
                onClick={() => { setSplitName(name); setSplitDays([...PREDEFINED_SPLITS[name]]); }}
                className={`p-4 rounded-xl border text-sm font-bold transition-all ${splitName === name ? 'bg-orange-900/20 border-orange-500 text-orange-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom builder */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white uppercase text-sm tracking-wider">Custom Builder</h3>
            <button
              onClick={() => setSplitDays([...splitDays, `Day ${splitDays.length + 1}`])}
              className="text-orange-400 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Day
            </button>
          </div>
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Split Name</label>
            <input
              type="text" value={splitName} onChange={e => setSplitName(e.target.value)}
              placeholder="e.g., Custom 4-Day"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white font-bold outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="space-y-3 mb-8">
            <label className="text-xs font-bold text-gray-500 uppercase block">Training Days</label>
            {splitDays.map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-xl text-sm font-bold text-gray-400">{idx + 1}</div>
                <input
                  type="text" value={day}
                  onChange={e => { const n = [...splitDays]; n[idx] = e.target.value; setSplitDays(n); }}
                  className="flex-1 p-4 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  onClick={() => { const n = [...splitDays]; n.splice(idx, 1); setSplitDays(n); }}
                  className="p-4 bg-gray-800 border border-gray-700 hover:border-red-500 hover:text-red-500 text-gray-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSaveSplit} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg">
            <Save className="w-5 h-5" /> Save Active Split
          </button>
        </div>
      </div>
    );
  };

  // ── renderLibrary ──────────────────────────────────────────────────────────
  const renderLibrary = () => {
    const handleSaveLib = async () => {
      if (!libFormData.name) return showToast('Name required', 'error');
      try {
        if (!db) {
          const localExercises = JSON.parse(localStorage.getItem(`gym_exercises_${user.uid}`) || '[]');
          if (libEditId) {
            const idx = localExercises.findIndex(e => e.id === libEditId);
            if (idx >= 0) localExercises[idx] = { ...localExercises[idx], ...libFormData };
          } else {
            localExercises.push({ id: Math.random().toString(36).substr(2, 9), ...libFormData, isCustom: true });
          }
          localStorage.setItem(`gym_exercises_${user.uid}`, JSON.stringify(localExercises));
          setExercises(localExercises);
          showToast('Exercise saved (Offline)!');
          setLibForm(false); setLibEditId(null);
          return;
        }

        if (libEditId) await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'exercises', libEditId), libFormData);
        else await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'exercises'), { ...libFormData, isCustom: true });
        showToast('Exercise saved!'); setLibForm(false); setLibEditId(null);
      } catch (e) { showToast('Error saving', 'error'); }
    };

    const filtered = exercises.filter(e => !libSearch || e.name.toLowerCase().includes(libSearch.toLowerCase()));

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <Breadcrumb title="Exercise Library" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Exercise Database</h2>
          <button
            onClick={() => { setLibFormData({ name: '', primaryMuscle: 'Chest', equipment: 'Barbell', difficulty: 'Beginner', notes: '' }); setLibEditId(null); setLibForm(true); }}
            className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Custom Exercise
          </button>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-500" />
          <input
            type="text" placeholder="Search exercises..." value={libSearch}
            onChange={e => setLibSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl text-white outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(ex => (
            <div key={ex.id} className="bg-gray-900 border border-gray-800 p-5 rounded-3xl flex flex-col hover:border-gray-700 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-white text-lg leading-tight pr-2">{ex.name}</h4>
                {ex.isCustom && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setLibFormData(ex); setLibEditId(ex.id); setLibForm(true); }} className="text-gray-500 hover:text-orange-500"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'exercises', ex.id))} className="text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-gray-800">
                <span className="text-[10px] uppercase font-bold bg-orange-900/20 text-orange-400 border border-orange-800/50 px-2 py-1 rounded-lg">{ex.primaryMuscle}</span>
                <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-400 border border-gray-700 px-2 py-1 rounded-lg">{ex.equipment}</span>
              </div>
            </div>
          ))}
        </div>

        {libForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-8 space-y-5">
              <h3 className="text-2xl font-black text-white">{libEditId ? 'Edit' : 'Add'} Exercise</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                <input type="text" value={libFormData.name} onChange={e => setLibFormData({ ...libFormData, name: e.target.value })} className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl outline-none text-white focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Muscle</label>
                  <select value={libFormData.primaryMuscle} onChange={e => setLibFormData({ ...libFormData, primaryMuscle: e.target.value })} className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl outline-none text-white">
                    {MUSCLE_GROUPS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Equipment</label>
                  <select value={libFormData.equipment} onChange={e => setLibFormData({ ...libFormData, equipment: e.target.value })} className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl outline-none text-white">
                    {EQUIPMENT_TYPES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setLibForm(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 font-bold rounded-xl text-white transition-colors">Cancel</button>
                <button onClick={handleSaveLib} className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── renderBuilder ──────────────────────────────────────────────────────────
  const renderBuilder = () => {
    const saveTpl = async () => {
      try {
        const payload = { name: bldName, exercises: bldExercises, updatedAt: new Date().toISOString() };
        
        if (!db) {
          const localTpls = JSON.parse(localStorage.getItem(`gym_templates_${user.uid}`) || '[]');
          if (bldTemplate === 'new') {
            localTpls.push({ id: Math.random().toString(36).substr(2, 9), ...payload });
          } else {
            const idx = localTpls.findIndex(t => t.id === bldTemplate);
            if (idx >= 0) localTpls[idx] = { ...localTpls[idx], ...payload };
          }
          localStorage.setItem(`gym_templates_${user.uid}`, JSON.stringify(localTpls));
          setTemplates(localTpls);
          showToast('Template Saved (Offline)!');
          setBldTemplate(null);
          return;
        }

        if (bldTemplate === 'new') await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'gym_templates'), payload);
        else await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_templates', bldTemplate), payload);
        showToast('Template Saved!'); setBldTemplate(null);
      } catch (e) { showToast('Error', 'error'); }
    };

    if (bldTemplate) {
      return (
        <div className="max-w-6xl mx-auto h-full flex flex-col pb-10">
          <Breadcrumb title="Template Builder" />
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
            {/* Exercise list */}
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 shrink-0 gap-4">
                <input
                  type="text" value={bldName} onChange={e => setBldName(e.target.value)}
                  className="text-3xl font-black text-white bg-transparent outline-none focus:border-b-2 border-orange-500 w-full max-w-sm pb-1"
                />
                <div className="flex gap-3">
                  <button onClick={() => setBldTemplate(null)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 font-bold rounded-xl text-white transition-colors">Cancel</button>
                  <button onClick={saveTpl} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {bldExercises.length === 0 && (
                  <div className="text-center text-gray-500 py-20 border border-dashed border-gray-800 rounded-2xl">
                    Select exercises from the library to build your workout.
                  </div>
                )}
                {bldExercises.map((ex, i) => (
                  <div key={ex.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-5 relative group">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-gray-500 font-bold text-lg w-6">{i + 1}.</div>
                        <h4 className="font-bold text-white text-lg">{ex.name}</h4>
                      </div>
                      <button onClick={() => { const n = [...bldExercises]; n.splice(i, 1); setBldExercises(n); }} className="text-gray-500 hover:text-red-500 transition-colors p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Target Sets', key: 'sets', type: 'number' },
                        { label: 'Target Reps', key: 'reps', type: 'text' },
                        { label: 'Weight (kg)', key: 'weight', type: 'number' },
                        { label: 'Rest (sec)',  key: 'rest',   type: 'number' },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{field.label}</label>
                          <input
                            type={field.type} value={ex[field.key]}
                            onChange={e => { const n = [...bldExercises]; n[i][field.key] = e.target.value; setBldExercises(n); }}
                            className="w-full p-3 bg-gray-900 border border-gray-700 text-white text-center font-bold rounded-xl outline-none focus:border-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise picker */}
            <div className="w-full lg:w-80 bg-gray-900 border border-gray-800 rounded-3xl p-5 flex flex-col shrink-0 h-full">
              <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Add Exercises</h3>
              <div className="relative mb-4 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input type="text" placeholder="Search..." value={bldSearch} onChange={e => setBldSearch(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-orange-500" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {exercises.filter(e => e.name.toLowerCase().includes(bldSearch.toLowerCase())).map(ex => (
                  <div
                    key={ex.id}
                    className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex justify-between items-center transition-colors group cursor-pointer"
                    onClick={() => setBldExercises([...bldExercises, {
                      exerciseId: ex.id, name: ex.name, sets: '3', reps: '10', weight: '0',
                      rest: COMPOUND_EXERCISES.includes(ex.name) ? '90' : '60',
                      id: Date.now().toString() + Math.random(),
                    }])}
                  >
                    <span className="text-sm font-bold text-gray-200">{ex.name}</span>
                    <button className="text-gray-500 group-hover:text-orange-500"><Plus className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <Breadcrumb title="Workout Templates" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-white">My Workouts</h2>
          <button onClick={() => { setBldName('New Workout'); setBldExercises([]); setBldTemplate('new'); }} className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> New Template</button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No templates created. Build your first workout routine!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => (
              <div key={t.id} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm flex flex-col hover:border-gray-700 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
                <p className="text-sm text-gray-400 mb-6">{t.exercises?.length || 0} Exercises Built</p>
                <div className="flex gap-3 mt-auto">
                  <button onClick={() => { setBldName(t.name); setBldExercises(t.exercises || []); setBldTemplate(t.id); }} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold rounded-xl transition-colors">Edit Plan</button>
                  <button onClick={() => { if (window.confirm('Delete this template?')) deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_templates', t.id)); }} className="p-2.5 bg-gray-800 hover:bg-red-900/30 hover:border-red-800 border border-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── renderScheduler ────────────────────────────────────────────────────────
  const renderScheduler = () => {
    const minD = new Date();
    minD.setDate(minD.getDate() - 15);
    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 15);

    schedules.forEach(s => {
      const d = new Date(s.date);
      if (d < minD) minD.setTime(d.getTime());
      if (d > maxD) maxD.setTime(d.getTime());
    });

    const dates = [];
    let cur = new Date(minD);
    while (cur <= maxD) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    const scrollTimeline = (dir) => {
      if (calendarContainerRef.current) {
        calendarContainerRef.current.scrollBy({ left: dir * 350, behavior: 'smooth' });
      }
    };
    
    const scrollToToday = () => {
      const todayEl = document.getElementById('calendar-card-today');
      if (todayEl && calendarContainerRef.current) {
        const container = calendarContainerRef.current;
        const scrollPos = todayEl.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (todayEl.clientWidth / 2);
        container.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    };

    const handleDeleteSchedule = async (id) => {
      if (!window.confirm('Delete this scheduled workout?')) return;
      try {
        if (!db) {
          const localSch = JSON.parse(localStorage.getItem(`gym_schedules_${user.uid}`) || '[]');
          const filtered = localSch.filter(s => s.id !== id);
          localStorage.setItem(`gym_schedules_${user.uid}`, JSON.stringify(filtered));
          setSchedules(filtered);
          showToast('Deleted (Offline)');
          return;
        }
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_schedules', id));
        await removeSyncedTask(id);
        showToast('Workout Deleted');
      } catch (e) { showToast('Error deleting', 'error'); }
    };

    const saveToHistoryIfCompleted = async (sch) => {
      if (sch.executionStatus !== 'Completed') return;
      const existing = sessions.find(s => s.scheduleId === sch.id);
      if (existing) return;

      let totalS = 0, totalR = 0, totalV = 0, compE = 0;
      const mappedExercises = (sch.exercises || []).map(e => {
        if (e.completed) {
          compE++;
          const sCount = Number(e.sets) || 0;
          const rCount = Number(e.reps) || 0;
          const wCount = Number(e.weight) || 0;
          totalS += sCount;
          totalR += (sCount * rCount);
          totalV += (sCount * rCount * wCount);
        }
        return {
          ...e,
          targetSets: Number(e.sets),
          targetReps: e.reps,
          targetWeight: Number(e.weight),
          sets: Array.from({ length: Number(e.sets) || 0 }).map(() => ({
            weight: e.weight, reps: e.reps, completed: e.completed
          }))
        };
      });

      const sessionPayload = {
        scheduleId: sch.id,
        templateId: sch.templateId,
        templateName: sch.templateName,
        date: sch.date,
        startTime: Date.now(),
        endTime: Date.now(),
        elapsedMs: (sch.duration || 60) * 60 * 1000,
        status: 'Completed',
        exercises: mappedExercises,
        totalSets: totalS,
        totalReps: totalR,
        totalVolume: totalV,
        completedExercises: compE,
        source: 'calendar_autocomplete',
        createdAt: new Date().toISOString()
      };

      if (!db) {
        const localSes = JSON.parse(localStorage.getItem(`gym_sessions_${user.uid}`) || '[]');
        const sId = Math.random().toString(36).substr(2, 9);
        localSes.push({ id: sId, ...sessionPayload });
        localStorage.setItem(`gym_sessions_${user.uid}`, JSON.stringify(localSes));
        setSessions(localSes);
        return;
      }
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'gym_sessions'), sessionPayload);
    };

    const markScheduleComplete = async (scheduleId) => {
      try {
        const schIndex = schedules.findIndex(s => s.id === scheduleId);
        if (schIndex === -1) return;
        
        const updatedSch = { ...schedules[schIndex], executionStatus: 'Completed' };
        if (updatedSch.exercises) {
          updatedSch.exercises = updatedSch.exercises.map(e => ({ ...e, completed: true }));
        }
        
        await saveToHistoryIfCompleted(updatedSch);

        if (!db) {
          const localSch = JSON.parse(localStorage.getItem(`gym_schedules_${user.uid}`) || '[]');
          const lIndex = localSch.findIndex(s => s.id === scheduleId);
          if (lIndex >= 0) {
            localSch[lIndex] = updatedSch;
            localStorage.setItem(`gym_schedules_${user.uid}`, JSON.stringify(localSch));
            setSchedules(localSch);
          }
          return;
        }

        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_schedules', scheduleId), {
          executionStatus: 'Completed',
          exercises: updatedSch.exercises || []
        });
      } catch (e) { showToast('Error completing', 'error'); }
    };

    const toggleScheduleExercise = async (scheduleId, exIndex) => {
      try {
        const schIndex = schedules.findIndex(s => s.id === scheduleId);
        if (schIndex === -1) return;
        
        const updatedSch = { ...schedules[schIndex] };
        let updatedExs = [...(updatedSch.exercises || [])];

        if (updatedExs.length === 0) {
          const tpl = templates.find(t => t.id === updatedSch.templateId);
          if (tpl) updatedExs = (tpl.exercises || []).map(e => ({ ...e, completed: false }));
        }
        
        if (!updatedExs[exIndex]) return;
        updatedExs[exIndex] = { ...updatedExs[exIndex], completed: !updatedExs[exIndex].completed };
        updatedSch.exercises = updatedExs;
        
        const allDone = updatedExs.length > 0 && updatedExs.every(e => e.completed);
        updatedSch.executionStatus = allDone ? 'Completed' : 'Scheduled';

        if (allDone) {
          await saveToHistoryIfCompleted(updatedSch);
        }

        if (!db) {
          const localSch = JSON.parse(localStorage.getItem(`gym_schedules_${user.uid}`) || '[]');
          const lIndex = localSch.findIndex(s => s.id === scheduleId);
          if (lIndex >= 0) {
            localSch[lIndex] = updatedSch;
            localStorage.setItem(`gym_schedules_${user.uid}`, JSON.stringify(localSch));
            setSchedules(localSch);
          }
          return;
        }

        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_schedules', scheduleId), {
          exercises: updatedExs,
          executionStatus: updatedSch.executionStatus
        });
      } catch (e) { showToast('Error updating status', 'error'); }
    };

    const handleSchedule = async () => {
      if (!schForm.templateId) return showToast('Select a template first', 'error');
      try {
        const tpl = templates.find(t => t.id === schForm.templateId);
        const mappedExs = (tpl.exercises || []).map(e => ({ ...e, completed: false }));
        const payload = {
          templateId:      tpl.id,
          templateName:    tpl.name,
          date:            schForm.date,
          startTime:       schForm.startTime,
          duration:        Number(schForm.duration),
          executionStatus: 'Scheduled',
          exercises:       mappedExs,
          createdAt:       new Date().toISOString(),
        };

        if (!db) {
          const localSch = JSON.parse(localStorage.getItem(`gym_schedules_${user.uid}`) || '[]');
          const id = Math.random().toString(36).substr(2, 9);
          localSch.push({ id, ...payload });
          localStorage.setItem(`gym_schedules_${user.uid}`, JSON.stringify(localSch));
          setSchedules(localSch);
          setSchModalOpen(false);
          showToast('Scheduled (Offline)!');
          return;
        }

        const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'gym_schedules'), payload);
        await syncTask({ ...payload, id: docRef.id });
        setSchModalOpen(false);
        showToast('Scheduled!');
      } catch (e) {
        console.error('Schedule error:', e);
        showToast('Error scheduling', 'error');
      }
    };

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <Breadcrumb title="Weekly Calendar" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Training Calendar</h2>
            <div className="hidden sm:flex items-center gap-2 bg-gray-900 rounded-xl p-1 border border-gray-800">
              <button onClick={() => scrollTimeline(-1)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">&larr;</button>
              <button onClick={scrollToToday} className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Today</button>
              <button onClick={() => scrollTimeline(1)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">&rarr;</button>
            </div>
          </div>
          <button onClick={() => setSchModalOpen(true)} className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0"><Calendar className="w-5 h-5" /> Schedule Workout</button>
        </div>

        <div 
          ref={calendarContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 gap-6 pt-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dates.map(d => {
            const isTdy = d === todayStr;
            const isPast = d < todayStr;
            const schs  = schedules.filter(s => s.date === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            const allDone = schs.length > 0 && schs.every(s => s.executionStatus === 'Completed');
            
            return (
              <div 
                key={d} 
                id={isTdy ? 'calendar-card-today' : undefined}
                className={`shrink-0 w-80 sm:w-96 snap-center rounded-3xl border flex flex-col min-h-[350px] overflow-hidden transition-all duration-300 hover:shadow-xl ${isPast ? 'opacity-60 hover:opacity-100' : ''} ${allDone ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : isTdy ? 'border-orange-500 bg-gray-900 shadow-[0_0_15px_rgba(249,115,22,0.1)] ring-1 ring-orange-500/50' : 'border-gray-800 bg-gray-900'}`}
              >
                <div className={`p-3.5 flex justify-between items-center border-b ${allDone ? 'bg-green-600 border-green-600 text-white' : isTdy ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-800 border-gray-800'}`}>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${allDone ? 'text-green-100' : isTdy ? 'text-orange-100' : 'text-gray-400'}`}>{new Date(d).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                    <p className="text-2xl font-black mt-0.5 leading-none">{new Date(d).getDate()}</p>
                  </div>
                  {allDone && <CheckCircle className="w-6 h-6 text-white opacity-80" />}
                </div>

                <div className="p-4 flex-1 flex flex-col gap-4">
                  {schs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 opacity-50">
                      <Calendar className="w-8 h-8 mb-2 text-gray-600" />
                      <p className="text-sm text-gray-400 font-bold">Rest Day</p>
                    </div>
                  ) : (
                    schs.map(s => {
                      let exs = s.exercises;
                      if (!exs || exs.length === 0) {
                        const tpl = templates.find(t => t.id === s.templateId);
                        exs = tpl ? (tpl.exercises || []).map(e => ({ ...e, completed: false })) : [];
                      }
                      
                      const completedExs = exs.filter(e => e.completed).length;
                      const progress = exs.length > 0 ? (completedExs / exs.length) * 100 : 0;
                      const isDone = s.executionStatus === 'Completed';

                      return (
                        <div key={s.id} className="flex flex-col group relative">
                          <div className="flex justify-between items-start mb-2.5">
                            <div>
                              <span className="text-[10px] font-bold text-orange-500 mb-0.5 block">{s.startTime} • {s.duration}m</span>
                              <span className={`text-lg font-black leading-tight ${isDone ? 'text-green-400' : 'text-white'}`}>{s.templateName}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity p-1.5 bg-gray-800 rounded-lg hover:bg-red-900/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {exs.length > 0 && (
                            <div className="space-y-1.5 mb-3">
                              {exs.map((ex, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 group/ex cursor-pointer" onClick={() => toggleScheduleExercise(s.id, idx)}>
                                  <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border-2 transition-colors ${ex.completed ? 'bg-green-500 border-green-500 text-black' : 'border-gray-600 group-hover/ex:border-gray-400'}`}>
                                    {ex.completed && <CheckCircle className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="flex flex-col">
                                    <p className={`text-sm font-bold transition-colors leading-tight ${ex.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{ex.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium leading-tight">{ex.sets} sets × {ex.reps} reps</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Progress</span>
                              <span className={`text-[10px] font-bold ${isDone ? 'text-green-400' : 'text-white'}`}>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden mb-2">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-orange-500'}`} 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            
                            {!isDone && (
                              <button
                                onClick={() => markScheduleComplete(s.id)}
                                className="w-full py-1.5 text-[10px] font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                          
                          {schs.length > 1 && schs.indexOf(s) < schs.length - 1 && (
                            <hr className="my-4 border-gray-800" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {schModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-8 space-y-5">
              <h3 className="text-2xl font-black text-white">Schedule Session</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Template</label>
                <select value={schForm.templateId} onChange={e => setSchForm({ ...schForm, templateId: e.target.value })} className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-orange-500">
                  <option value="" disabled>Select Template…</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date</label>
                <input type="date" value={schForm.date} onChange={e => setSchForm({ ...schForm, date: e.target.value })} className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Time</label>
                  <input type="time" value={schForm.startTime} onChange={e => setSchForm({ ...schForm, startTime: e.target.value })} className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Duration (min)</label>
                  <input type="number" value={schForm.duration} onChange={e => setSchForm({ ...schForm, duration: e.target.value })} className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setSchModalOpen(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 font-bold rounded-xl text-white transition-colors">Cancel</button>
                <button onClick={handleSchedule} className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors">Schedule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── renderExecution ────────────────────────────────────────────────────────
  const renderExecution = () => {
    const session = sessions.find(s => s.status === 'Active' || s.status === 'Paused');
    // Guard handled by useEffect — silently return null here to avoid render-time side effects
    if (!session) return null;

    const activeExIdx    = session.exercises.findIndex(e => !e.completed) === -1 ? 0 : session.exercises.findIndex(e => !e.completed);
    const activeEx       = session.exercises[activeExIdx];
    const currentTimer   = session.status === 'Active'
      ? session.elapsedMs + (currentTimeMs - session.lastActiveTimestamp)
      : session.elapsedMs;

    const handlePause = async () => {
      const isAct = session.status === 'Active';
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_sessions', session.id), {
        status: isAct ? 'Paused' : 'Active',
        elapsedMs: currentTimer,
        lastActiveTimestamp: currentTimeMs,
      });
    };

    const toggleSet = async (sIdx) => {
      const nEx = [...session.exercises];
      const s   = nEx[activeExIdx].sets[sIdx];
      s.completed = !s.completed;
      nEx[activeExIdx].completed = nEx[activeExIdx].sets.every(x => x.completed);
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_sessions', session.id), { exercises: nEx });
      if (s.completed && !nEx[activeExIdx].completed) showToast('Set Complete! Rest.', 'success');
    };

    const finishWork = async () => {
      if (!session.exercises.every(e => e.completed) && !window.confirm('Incomplete exercises remain. Finish anyway?')) return;
      let totalV = 0; let totalS = 0; let totalR = 0; let compE = 0;
      session.exercises.forEach(e => {
        if (e.completed) compE++;
        e.sets.forEach(s => {
          if (s.completed) { totalS++; totalR += Number(s.reps) || 0; totalV += (Number(s.reps) || 0) * (Number(s.weight) || 0); }
        });
      });
      const fT = session.status === 'Active'
        ? session.elapsedMs + (currentTimeMs - session.lastActiveTimestamp)
        : session.elapsedMs;
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_sessions', session.id), {
        status: 'Completed', elapsedMs: fT, endTime: Date.now(),
        totalSets: totalS, totalReps: totalR, totalVolume: totalV, completedExercises: compE,
      });
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_schedules', session.scheduleId), { executionStatus: 'Completed' });
      syncTask({ ...session, id: session.scheduleId, executionStatus: 'Completed', duration: session.targetDuration, startTime: new Date(session.startTime).toTimeString().slice(0, 5) });
      setSummarySession({ ...session, durationMs: fT, totalSets: totalS, totalReps: totalR, totalVolume: totalV, completedExercises: compE });
      setActiveView('summary');
    };

    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col pb-10">
        <Breadcrumb title="Active Session" />
        {/* Session header */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-white">{session.templateName}</h2>
            <span className="font-mono text-orange-500 font-bold text-lg mt-1 block">{formatDuration(Math.floor(currentTimer / 1000))}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePause} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
              {session.status === 'Active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {session.status === 'Active' ? 'Pause' : 'Resume'}
            </button>
            <button onClick={finishWork} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
              <StopCircle className="w-5 h-5" /> Finish
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Current exercise */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 text-center shadow-sm relative">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest absolute top-6 left-6">
              Ex {activeExIdx + 1} / {session.exercises.length}
            </p>
            <h3 className="text-4xl font-black text-white mt-4">{activeEx.name}</h3>
            {activeEx.completed && (
              <span className="text-xs text-green-400 border border-green-800 bg-green-900/30 px-3 py-1 rounded-full font-bold inline-block mt-4 uppercase tracking-wider">Completed</span>
            )}
          </div>

          {/* Sets table */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">
              <div className="col-span-2 text-center">Set</div>
              <div className="col-span-4 text-center">Weight</div>
              <div className="col-span-4 text-center">Reps</div>
              <div className="col-span-2 text-center">Done</div>
            </div>
            {activeEx.sets.map((set, sIdx) => (
              <div key={sIdx} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-2xl mb-3 border transition-colors ${set.completed ? 'bg-green-900/20 border-green-800/50' : 'bg-gray-800 border-gray-700'}`}>
                <div className="col-span-2 text-center font-black text-gray-400 text-lg">{sIdx + 1}</div>
                <div className="col-span-4">
                  <input
                    type="number" value={set.weight} disabled={set.completed}
                    onChange={e => { const n = [...session.exercises]; n[activeExIdx].sets[sIdx].weight = e.target.value; updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_sessions', session.id), { exercises: n }); }}
                    className="w-full text-center font-bold text-lg p-3 rounded-xl bg-gray-950 border border-gray-700 text-white outline-none focus:border-orange-500 disabled:bg-transparent disabled:border-transparent"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text" value={set.reps} disabled={set.completed}
                    onChange={e => { const n = [...session.exercises]; n[activeExIdx].sets[sIdx].reps = e.target.value; updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'gym_sessions', session.id), { exercises: n }); }}
                    className="w-full text-center font-bold text-lg p-3 rounded-xl bg-gray-950 border border-gray-700 text-white outline-none focus:border-orange-500 disabled:bg-transparent disabled:border-transparent"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => toggleSet(sIdx)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${set.completed ? 'bg-green-500 text-white scale-95' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── renderSummary ──────────────────────────────────────────────────────────
  const renderSummary = () => {
    if (!summarySession) return null;
    return (
      <div className="max-w-2xl mx-auto text-center pt-20 space-y-8">
        <Trophy className="w-24 h-24 text-orange-500 mx-auto animate-bounce" />
        <div>
          <h1 className="text-5xl font-black text-white mb-2">Workout Complete!</h1>
          <p className="text-gray-400 font-medium text-lg">XP has been awarded to your gym progression.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase mb-1">Duration</p><h3 className="text-3xl font-black text-white">{formatDuration(Math.floor(summarySession.durationMs / 1000))}</h3></div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase mb-1">Volume</p><h3 className="text-3xl font-black text-white">{summarySession.totalVolume} kg</h3></div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase mb-1">Sets Completed</p><h3 className="text-3xl font-black text-white">{summarySession.totalSets}</h3></div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase mb-1">XP Earned</p><h3 className="text-3xl font-black text-orange-500">+{50 + (summarySession.completedExercises * 10)}</h3></div>
        </div>
        <button
          onClick={() => { setSummarySession(null); setActiveView('dashboard'); }}
          className="w-full py-5 bg-white text-gray-900 hover:bg-gray-200 font-black rounded-2xl text-xl transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  // ── renderHistory ──────────────────────────────────────────────────────────
  const renderHistory = () => {
    const completed = sessions.filter(s => s.status === 'Completed').sort((a, b) => b.endTime - a.endTime);
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        <Breadcrumb title="Workout History" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Historical Logs</h2>
          <span className="bg-gray-800 text-gray-300 font-bold px-4 py-2 rounded-xl border border-gray-700">{completed.length} Sessions</span>
        </div>
        {completed.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl text-gray-500 font-medium">No completed workouts to display.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map(s => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{s.templateName}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">{new Date(s.endTime).toLocaleString()}</p>
                  </div>
                  <span className="bg-green-900/30 text-green-400 border border-green-800 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Logged
                  </span>
                </div>
                <div className="flex gap-4 border-t border-gray-800 pt-4 mt-auto">
                  <div className="flex-1"><p className="text-[10px] font-bold text-gray-500 uppercase">Volume</p><p className="font-bold text-white">{s.totalVolume} kg</p></div>
                  <div className="flex-1 border-l border-gray-800 pl-4"><p className="text-[10px] font-bold text-gray-500 uppercase">Sets</p><p className="font-bold text-white">{s.totalSets}</p></div>
                  <div className="flex-1 border-l border-gray-800 pl-4"><p className="text-[10px] font-bold text-gray-500 uppercase">Time</p><p className="font-bold text-white">{formatDuration(Math.floor(s.elapsedMs / 1000))}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Root render ────────────────────────────────────────────────────────────
  return (
    <div ref={gymRootRef} className="relative text-gray-100 font-sans selection:bg-orange-500/30">
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-20 lg:top-6 right-4 lg:right-8 z-50 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-fade-in border ${toast.type === 'error' ? 'bg-red-900/90 text-red-100 border-red-800' : 'bg-green-900/90 text-green-100 border-green-800'} backdrop-blur-md`}>
          <CheckCircle className="w-5 h-5" />
          <p className="font-bold">{toast.msg}</p>
        </div>
      )}

      {/* View router */}
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'splits'    && renderSplits()}
      {activeView === 'exercises' && renderLibrary()}
      {activeView === 'builder'   && renderBuilder()}
      {activeView === 'scheduler' && renderScheduler()}
      {activeView === 'execution' && renderExecution()}
      {activeView === 'summary'   && renderSummary()}
      {activeView === 'history'   && renderHistory()}
      {activeView === 'body'      && renderBodyProgress()}
      {activeView === 'recovery'  && renderRecovery()}
    </div>
  );
}
