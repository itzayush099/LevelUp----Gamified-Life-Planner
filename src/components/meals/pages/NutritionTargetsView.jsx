import React, { useState, useEffect } from 'react';
import { Target, Calculator, Save, RefreshCw, Bookmark, Plus, Trash2, Flame, Droplets, Beef, Wheat, Activity } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const InputField = ({ label, icon: Icon, value, onChange, unit, color }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="flex items-baseline gap-1 mt-1">
        <input 
          type="number" 
          value={value === 0 && value !== '' ? 0 : value} 
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full bg-transparent text-2xl font-black text-gray-900 dark:text-white outline-none p-0"
        />
        <span className="text-sm font-bold text-gray-400">{unit}</span>
      </div>
    </div>
  </div>
);

export default function NutritionTargetsView({ user, db, appId, macroGoals, dietProfile, showToast, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState({
    calories: 2500, protein: 150, carbs: 300, fat: 75, water: 3000, fiber: 30, ...macroGoals
  });
  
  const [profiles, setProfiles] = useState({});
  const [activeProfileId, setActiveProfileId] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  
  const [showAutoCalc, setShowAutoCalc] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcInputs, setCalcInputs] = useState({
    weight: dietProfile?.weight || 75,
    height: dietProfile?.height || 175,
    age: dietProfile?.age || 30,
    gender: dietProfile?.gender || 'male',
    activity: dietProfile?.activity || 'moderate', 
    goal: 'maintenance'
  });

  useEffect(() => {
    // Reset draft when macroGoals update externally (unless user is editing heavily)
    setDraft(prev => ({ ...prev, ...macroGoals }));
  }, [macroGoals]);

  useEffect(() => {
    // Fetch saved profiles
    const fetchProfiles = async () => {
      if (!db || !user?.uid) return;
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'profiles');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfiles(snap.data().saved || {});
      }
    };
    fetchProfiles();
  }, [db, user, appId]);

  const handleSaveTargets = async () => {
    // Sanitize draft before saving (convert any empty strings to 0)
    const sanitizedDraft = { ...draft };
    Object.keys(sanitizedDraft).forEach(key => {
      if (sanitizedDraft[key] === '') sanitizedDraft[key] = 0;
    });

    if (sanitizedDraft.calories < 500) return showToast('Calories must be at least 500', 'error');
    if (sanitizedDraft.protein < 0 || sanitizedDraft.carbs < 0 || sanitizedDraft.fat < 0 || sanitizedDraft.water < 0) return showToast('Targets cannot be negative', 'error');
    
    setIsSaving(true);
    try {
      if (db && appId && user?.uid) {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'goals'), sanitizedDraft, { merge: true });
      }
      if (onSave) onSave(sanitizedDraft);
      showToast('Nutrition targets saved successfully!');
    } catch (e) {
      console.error('Save targets failed:', e);
      showToast(e.message || 'Error saving targets', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!newProfileName) return;
    const newProfiles = { ...profiles, [newProfileName]: { ...draft } };
    setProfiles(newProfiles);
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'profiles'), { saved: newProfiles }, { merge: true });
    setActiveProfileId(newProfileName);
    setNewProfileName('');
    showToast(`Profile "${newProfileName}" saved`);
  };

  const loadProfile = (name) => {
    if (profiles[name]) {
      setDraft(profiles[name]);
      setActiveProfileId(name);
      showToast(`Loaded profile: ${name}`);
    }
  };

  const deleteProfile = async (name) => {
    const newProfiles = { ...profiles };
    delete newProfiles[name];
    setProfiles(newProfiles);
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'profiles'), { saved: newProfiles });
    if (activeProfileId === name) setActiveProfileId('');
    showToast(`Deleted profile: ${name}`);
  };

  const calculateMacros = () => {
    if (!calcInputs.weight || !calcInputs.height || !calcInputs.age) {
       return showToast('Please enter weight, height, and age', 'error');
    }

    setIsCalculating(true);
    
    setTimeout(() => {
      const weight = Number(calcInputs.weight);
      const height = Number(calcInputs.height);
      const age = Number(calcInputs.age);

      // Mifflin-St Jeor Equation
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      bmr += (calcInputs.gender === 'male' ? 5 : -161);
      
      const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
      let tdee = bmr * (activityMultipliers[calcInputs.activity] || 1.2);
      
      let targetCalories = tdee;
      if (calcInputs.goal === 'cutting') targetCalories -= 400; // -300 to 500
      if (calcInputs.goal === 'lean_bulk') targetCalories += 250;
      if (calcInputs.goal === 'aggressive_bulk') targetCalories += 500;
      if (calcInputs.goal === 'recomp') targetCalories -= 100;
      
      // Macro split
      // Protein: ~2g per kg of bodyweight
      const targetProtein = Math.round(weight * 2.0);
      // Fat: ~25% of calories
      const targetFat = Math.round((targetCalories * 0.25) / 9);
      // Carbs: Remaining calories
      const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);
      
      setDraft({
        ...draft,
        calories: Math.round(targetCalories),
        protein: targetProtein,
        carbs: targetCarbs,
        fat: targetFat,
        water: Math.round(weight * 40) // ~40ml per kg
      });
      
      setIsCalculating(false);
      setShowAutoCalc(false);
      showToast('Targets generated successfully');
    }, 500); // UI loading state
  };

  const resetCalculator = () => {
    setCalcInputs({ weight: 75, height: 175, age: 30, gender: 'male', activity: 'sedentary', goal: 'maintenance' });
  };

  // InputField was moved outside the component to prevent unmounting on every keystroke

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-0 pb-20 animate-fade-in">
      
      {/* Top Action Bar */}
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
               <Target className="w-8 h-8 text-emerald-500"/>
            </div>
            <div>
               <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Nutrition Targets</h2>
               <p className="text-sm font-bold text-gray-500 mt-1">Set the foundation for your dashboard and daily tracking.</p>
            </div>
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setShowAutoCalc(!showAutoCalc)} className="flex-1 md:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
               <Calculator className="w-4 h-4"/> Auto Calc
            </button>
            <button onClick={handleSaveTargets} disabled={isSaving} className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50">
               <Save className="w-4 h-4"/> {isSaving ? 'Saving...' : 'Save Targets'}
            </button>
         </div>
      </div>

      {/* Auto Calculator Modal/Drawer */}
      {showAutoCalc && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-[2rem] p-6 sm:p-8 shadow-sm animate-fade-in relative overflow-hidden">
           <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
           <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-400 flex items-center gap-2 mb-6"><Calculator className="w-5 h-5"/> Smart Target Calculator</h3>
           
           <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-indigo-500 uppercase">Weight (kg)</label>
                 <input type="number" value={calcInputs.weight === 0 && calcInputs.weight !== '' ? 0 : calcInputs.weight} onChange={e => setCalcInputs({...calcInputs, weight: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-indigo-500 uppercase">Height (cm)</label>
                 <input type="number" value={calcInputs.height === 0 && calcInputs.height !== '' ? 0 : calcInputs.height} onChange={e => setCalcInputs({...calcInputs, height: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-indigo-500 uppercase">Age</label>
                 <input type="number" value={calcInputs.age === 0 && calcInputs.age !== '' ? 0 : calcInputs.age} onChange={e => setCalcInputs({...calcInputs, age: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-indigo-500 uppercase">Gender</label>
                 <select value={calcInputs.gender} onChange={e => setCalcInputs({...calcInputs, gender: e.target.value})} className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:border-indigo-500">
                    <option value="male">Male</option><option value="female">Female</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-indigo-500 uppercase">Activity</label>
                 <select value={calcInputs.activity} onChange={e => setCalcInputs({...calcInputs, activity: e.target.value})} className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:border-indigo-500">
                    <option value="sedentary">Sedentary</option><option value="light">Lightly Active</option>
                    <option value="moderate">Moderately Active</option><option value="active">Very Active</option>
                    <option value="athlete">Athlete</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-indigo-500 uppercase">Goal</label>
                 <select value={calcInputs.goal} onChange={e => setCalcInputs({...calcInputs, goal: e.target.value})} className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:border-indigo-500">
                    <option value="cutting">Cutting</option><option value="lean_bulk">Lean Bulk</option>
                    <option value="aggressive_bulk">Aggressive Bulk</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="recomp">Recomp</option>
                 </select>
              </div>
           </div>
           <div className="mt-6 flex justify-end gap-3">
              <button onClick={resetCalculator} className="px-6 py-2 bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Reset</button>
              <button onClick={calculateMacros} disabled={isCalculating} className="px-6 py-2 bg-indigo-500 text-white rounded-xl font-bold shadow-md hover:bg-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                {isCalculating ? 'Calculating...' : 'Generate Targets'}
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Editable Targets */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
               <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-6"><Target className="w-5 h-5 text-emerald-500"/> Core Targets</h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Daily Calories" icon={Flame} value={draft.calories} onChange={v => setDraft({...draft, calories: v})} unit="kcal" color="bg-orange-100 text-orange-500 dark:bg-orange-900/30" />
                  <InputField label="Protein Target" icon={Beef} value={draft.protein} onChange={v => setDraft({...draft, protein: v})} unit="g" color="bg-red-100 text-red-500 dark:bg-red-900/30" />
                  <InputField label="Carbs Target" icon={Wheat} value={draft.carbs} onChange={v => setDraft({...draft, carbs: v})} unit="g" color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" />
                  <InputField label="Fat Target" icon={Activity} value={draft.fat} onChange={v => setDraft({...draft, fat: v})} unit="g" color="bg-blue-100 text-blue-500 dark:bg-blue-900/30" />
                  <InputField label="Water Goal" icon={Droplets} value={draft.water} onChange={v => setDraft({...draft, water: v})} unit="ml" color="bg-cyan-100 text-cyan-500 dark:bg-cyan-900/30" />
                  <InputField label="Fiber Goal" icon={Target} value={draft.fiber} onChange={v => setDraft({...draft, fiber: v})} unit="g" color="bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30" />
               </div>
               
               {/* Macro Preview Bar */}
               <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                 <div className="flex justify-between items-end mb-3">
                   <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Macro Split Preview</span>
                   <span className="text-lg font-black text-gray-900 dark:text-white">
                      {(draft.protein * 4) + (draft.carbs * 4) + (draft.fat * 9)} <span className="text-xs text-gray-400">kcal calculated from macros</span>
                   </span>
                 </div>
                 
                 <div className="w-full h-4 rounded-full overflow-hidden flex shadow-inner">
                    <div className="bg-red-500 transition-all duration-500" style={{ width: `${(draft.protein * 4 / ((draft.protein * 4) + (draft.carbs * 4) + (draft.fat * 9))) * 100}%` }}></div>
                    <div className="bg-yellow-400 transition-all duration-500" style={{ width: `${(draft.carbs * 4 / ((draft.protein * 4) + (draft.carbs * 4) + (draft.fat * 9))) * 100}%` }}></div>
                    <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(draft.fat * 9 / ((draft.protein * 4) + (draft.carbs * 4) + (draft.fat * 9))) * 100}%` }}></div>
                 </div>
                 <div className="flex justify-between mt-3 text-xs font-bold text-gray-500">
                    <span className="text-red-500">{Math.round((draft.protein * 4 / ((draft.protein * 4) + (draft.carbs * 4) + (draft.fat * 9))) * 100)}% Pro</span>
                    <span className="text-yellow-500">{Math.round((draft.carbs * 4 / ((draft.protein * 4) + (draft.carbs * 4) + (draft.fat * 9))) * 100)}% Carb</span>
                    <span className="text-blue-500">{Math.round((draft.fat * 9 / ((draft.protein * 4) + (draft.carbs * 4) + (draft.fat * 9))) * 100)}% Fat</span>
                 </div>
               </div>
            </div>
         </div>

         {/* Nutrition Profiles Sidebar */}
         <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm">
               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Bookmark className="w-4 h-4 text-emerald-500"/> Nutrition Profiles</h3>
               
               {/* Save New Profile */}
               <div className="flex items-center gap-2 mb-6">
                  <input 
                     type="text" 
                     placeholder="Profile Name (e.g. Cut Phase)" 
                     value={newProfileName}
                     onChange={e => setNewProfileName(e.target.value)}
                     className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-emerald-500"
                  />
                  <button onClick={handleSaveProfile} className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 transition-colors">
                     <Plus className="w-5 h-5"/>
                  </button>
               </div>

               {/* Profile List */}
               <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.keys(profiles).length === 0 ? (
                     <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-500 font-bold text-sm">
                        No saved profiles. Set your targets and save one!
                     </div>
                  ) : (
                     Object.entries(profiles).map(([name, p]) => (
                        <div key={name} className={`p-4 rounded-2xl border transition-all group cursor-pointer ${activeProfileId === name ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50 hover:border-emerald-300'}`} onClick={() => loadProfile(name)}>
                           <div className="flex justify-between items-start mb-2">
                              <h4 className={`font-bold text-sm ${activeProfileId === name ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{name}</h4>
                              <button onClick={(e) => { e.stopPropagation(); deleteProfile(name); }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Trash2 className="w-4 h-4"/>
                              </button>
                           </div>
                           <p className="text-[10px] font-bold text-gray-500">{p.calories}kcal • {p.protein}P • {p.carbs}C • {p.fat}F</p>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
