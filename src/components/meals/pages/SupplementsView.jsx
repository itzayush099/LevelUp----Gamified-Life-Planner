import React, { useState, useMemo } from 'react';
import { Pill, Plus, CheckCircle, Clock, Trash2, Shield, Zap, XCircle, History, Edit } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const TIMING_OPTIONS = ['Morning', 'Afternoon', 'Night', 'Pre-Workout', 'Post-Workout'];
const UNIT_OPTIONS = ['g', 'mg', 'mcg', 'scoop(s)', 'pill(s)', 'drop(s)', 'ml'];

export default function SupplementsView({ user, supplements, setSupplements, suppLogs, setSuppLogs, db, appId, selectedDate, showToast, awardXP }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSupp, setNewSupp] = useState({ name: '', dosage: '', unit: 'g', timing: 'Morning', notes: '' });
  
  // suppLogs[selectedDate] is now an array of objects: [{ id, status: 'Taken'|'Skipped', time: '09:00 AM' }]
  const todayLogs = suppLogs[selectedDate] || [];

  const handleAddSupp = async (e) => {
    e.preventDefault();
    if (!newSupp.name || !newSupp.dosage) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    const supp = { id, ...newSupp, createdAt: new Date().toISOString() };
    
    // Optimistic Update
    if (setSupplements) {
      setSupplements(prev => [...prev, supp]);
    }
    setIsAdding(false);
    setNewSupp({ name: '', dosage: '', unit: 'g', timing: 'Morning', notes: '' });

    try {
      if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'supplements', id), supp);
      showToast(`Added ${supp.name}`);
    } catch(err) {
      console.error(err);
      showToast('Error saving supplement', 'error');
    }
  };

  const removeSupp = async (id) => {
    if (setSupplements) {
      setSupplements(prev => prev.filter(s => s.id !== id));
    }
    try {
      if (db) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'supplements', id));
      showToast('Supplement removed');
    } catch(err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    let next = [...todayLogs];
    const existingIndex = next.findIndex(log => log.id === id);
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if (existingIndex >= 0) {
       if (next[existingIndex].status === status) {
          // Toggle off
          next.splice(existingIndex, 1);
       } else {
          // Change status
          next[existingIndex] = { id, status, time: timeStr };
       }
    } else {
       next.push({ id, status, time: timeStr });
    }
    
    // Optimistic Update
    if (setSuppLogs) {
       setSuppLogs(prev => ({
         ...prev,
         [selectedDate]: next
       }));
    }

    try {
      if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'supplement_logs', 'daily', selectedDate), { logs: next }, { merge: true });
      if (status === 'Taken' && existingIndex === -1) {
        awardXP(2, 'Supplement Taken');
        const takenCount = next.filter(l => l.status === 'Taken').length;
        if (takenCount === supplements.length && supplements.length > 0) {
          awardXP(10, 'All Daily Supplements Taken!');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAdherence = () => {
    if (supplements.length === 0) return 0;
    let takenCount = 0;
    for (let i = 0; i < 7; i++) {
       const d = new Date(); d.setDate(d.getDate() - i);
       const dStr = d.toISOString().split('T')[0];
       const logs = suppLogs[dStr] || [];
       takenCount += logs.filter(l => l.status === 'Taken').length;
    }
    const totalPossible = supplements.length * 7;
    return Math.round((takenCount / totalPossible) * 100);
  };

  const adherence = useMemo(getAdherence, [suppLogs, supplements]);
  const takenTodayCount = todayLogs.filter(l => l.status === 'Taken').length;
  const progress = supplements.length === 0 ? 0 : Math.round((takenTodayCount / supplements.length) * 100);

  const getTimingColor = (timing) => {
    switch (timing) {
      case 'Morning': return 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50';
      case 'Afternoon': return 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50';
      case 'Night': return 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50';
      case 'Pre-Workout': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50';
      case 'Post-Workout': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/50';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-0 pb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Main Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-purple-500/5 dark:shadow-purple-900/20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
             
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3"><Pill className="w-6 h-6 text-purple-500"/> Daily Stack</h3>
               <button onClick={() => setIsAdding(!isAdding)} className="px-5 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-sm flex items-center gap-2 hover:scale-105 hover:shadow-lg transition-all duration-300 active:scale-95">
                 <Plus className="w-4 h-4"/> Add Supplement
               </button>
             </div>

             {/* Add Form with Grid Layout */}
             {isAdding && (
               <form onSubmit={handleAddSupp} className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 animate-fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input required type="text" placeholder="Supplement Name (e.g. Creatine)" className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-xl px-4 py-3 font-bold outline-none hover:border-purple-300 dark:hover:border-purple-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 shadow-inner md:col-span-2" value={newSupp.name} onChange={e => setNewSupp({...newSupp, name: e.target.value})} />
                   
                   <div className="flex gap-2">
                     <input required type="number" placeholder="Dosage" className="flex-[2] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors" value={newSupp.dosage} onChange={e => setNewSupp({...newSupp, dosage: e.target.value})} />
                     <select className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-3 font-bold outline-none focus:border-purple-500 transition-colors" value={newSupp.unit} onChange={e => setNewSupp({...newSupp, unit: e.target.value})}>
                       {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                   </div>
                   
                   <select className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors" value={newSupp.timing} onChange={e => setNewSupp({...newSupp, timing: e.target.value})}>
                     {TIMING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>

                   <input type="text" placeholder="Notes (Optional)" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors md:col-span-2" value={newSupp.notes} onChange={e => setNewSupp({...newSupp, notes: e.target.value})} />
                 </div>
                 
                 <div className="mt-4 flex justify-end">
                    <button type="submit" className="bg-purple-500 text-white font-bold rounded-xl px-8 py-3 hover:bg-purple-600 transition-colors w-full md:w-auto shadow-sm">Save Supplement</button>
                 </div>
               </form>
             )}

             {/* Supplement List */}
             <div className="space-y-4">
               {supplements.length === 0 ? (
                 <div className="text-center p-12 text-gray-500 font-bold border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center">
                   <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-lg shadow-purple-500/10">
                     <Pill className="w-12 h-12 text-purple-500" />
                   </div>
                   <p className="text-lg text-gray-900 dark:text-white">No supplements added yet</p>
                   <p className="text-sm mt-1">Build your premium stack to get started.</p>
                   <button onClick={() => setIsAdding(true)} className="mt-6 px-6 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-500/20 transition-colors">Add Your First Supplement</button>
                 </div>
               ) : (
                 TIMING_OPTIONS.map(timing => {
                   const sectionSupps = supplements.filter(s => s.timing === timing);
                   if (sectionSupps.length === 0) return null;
                   
                   return (
                     <div key={timing} className="mb-8 last:mb-0">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> {timing}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sectionSupps.map(supp => {
                            const logEntry = todayLogs.find(l => l.id === supp.id);
                            const isTaken = logEntry?.status === 'Taken';
                            const isSkipped = logEntry?.status === 'Skipped';
                            const isPending = !isTaken && !isSkipped;
                            
                            return (
                              <div key={supp.id} className={`p-5 rounded-3xl border flex flex-col transition-all duration-500 group ${isTaken ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300/50 dark:border-emerald-700/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[0.98]' : isSkipped ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/50 opacity-70 grayscale-[30%]' : 'bg-white dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-400/50 dark:hover:border-purple-500/50'}`}>
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className={`font-black text-lg ${isTaken ? 'text-emerald-700 dark:text-emerald-400' : isSkipped ? 'text-red-700 dark:text-red-400 line-through decoration-red-300 dark:decoration-red-800' : 'text-gray-900 dark:text-white'}`}>{supp.name}</h4>
                                    <p className="text-sm font-bold text-gray-500 mt-0.5">{supp.dosage} {supp.unit}</p>
                                    {supp.notes && <p className="text-[10px] font-bold text-gray-400 mt-1 truncate max-w-[150px]">{supp.notes}</p>}
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => removeSupp(supp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 hidden md:block" title="Delete">
                                       <Trash2 className="w-4 h-4"/>
                                     </button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-auto">
                                   <button 
                                     onClick={() => updateStatus(supp.id, 'Taken')}
                                     className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 ${isTaken ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:border-emerald-800/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-md'}`}
                                   >
                                      <CheckCircle className="w-3.5 h-3.5"/> {isTaken ? 'Taken' : 'Take'}
                                   </button>
                                   <button 
                                     onClick={() => updateStatus(supp.id, 'Skipped')}
                                     className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 ${isSkipped ? 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg shadow-red-500/30' : 'bg-gray-50 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:border-red-800/50 hover:text-red-600 dark:hover:text-red-400 hover:shadow-md'}`}
                                   >
                                      <XCircle className="w-3.5 h-3.5"/> {isSkipped ? 'Skipped' : 'Skip'}
                                   </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
          
          {/* History Log */}
          {todayLogs.length > 0 && (
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4 text-purple-500"/> Today's History</h3>
               <div className="space-y-3">
                 {todayLogs.map((log, i) => {
                    const supp = supplements.find(s => s.id === log.id);
                    if (!supp) return null;
                    return (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.status === 'Taken' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                             {log.status === 'Taken' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                           </div>
                           <div>
                             <p className="font-bold text-gray-900 dark:text-white text-sm">{supp.name}</p>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{log.status}</p>
                           </div>
                        </div>
                        <span className="text-xs font-bold text-gray-400">{log.time}</span>
                      </div>
                    )
                 })}
               </div>
            </div>
          )}
        </div>

        {/* Right Col: Analytics */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm">
             <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Shield className="w-4 h-4 text-purple-500"/> Analytics</h3>
             
             <div className="flex flex-col items-center justify-center mb-8">
               <div className="w-32 h-32 rounded-full border-8 border-gray-100 dark:border-gray-800 relative flex items-center justify-center">
                 <div className="absolute inset-[-4px] rounded-full border-8 border-transparent transition-all duration-1000 ease-in-out" style={{ background: `linear-gradient(white, white) padding-box, linear-gradient(to right, #a855f7, #6366f1) border-box`, clipPath: `polygon(0 0, 100% 0, 100% ${adherence}%, 0 ${adherence}%)` }}></div>
                 <span className="text-3xl font-black text-gray-900 dark:text-white z-10">{adherence}%</span>
               </div>
               <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest text-center">7-Day Adherence</p>
             </div>

             <div className="space-y-4">
               <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900/40 rounded-2xl flex items-center justify-between border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-500"/></div>
                   <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">Today's Progress</span>
                 </div>
                 <span className="font-black text-gray-900 dark:text-white">{progress}%</span>
               </div>
               <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900/40 rounded-2xl flex items-center justify-between border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center"><Zap className="w-4 h-4 text-purple-500"/></div>
                   <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">Active Stack</span>
                 </div>
                 <span className="font-black text-gray-900 dark:text-white">{supplements.length} Items</span>
               </div>
               <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900/40 rounded-2xl flex items-center justify-between border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center"><Clock className="w-4 h-4 text-orange-500"/></div>
                   <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">Pending</span>
                 </div>
                 <span className="font-black text-gray-900 dark:text-white">
                   {supplements.length - todayLogs.length} Items
                 </span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
