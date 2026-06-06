import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coffee, Activity, Calendar, ChevronRight, Plus, Trash2, X, Search, Edit2, CheckCircle, 
  Flame, Target, PieChart, Apple, Beef, Droplet, LayoutGrid, AlertTriangle, Settings,
  ShoppingCart, Copy, Droplets, Pill, RefreshCw, Zap, TrendingUp, Bell, ChefHat, BarChart3, Medal, Trophy, Star,
  ChevronLeft, Sparkles, Clock, Camera
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, increment } from 'firebase/firestore';
import { db, appId } from '../../services/firebase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WaterView from './pages/WaterView';
import SupplementsView from './pages/SupplementsView';
import GamificationView from './pages/GamificationView';
import TransformationView from './pages/TransformationView';
import NutritionTargetsView from './pages/NutritionTargetsView';

import { FOOD_CATEGORIES, MEAL_SECTIONS, MEAL_LABELS, DEFAULT_FOODS } from './constants';

// Premium Circular Progress (Apple Health Style)
const CircularProgress = ({ value, max, colorClass, size = 120, strokeWidth = 10, label, icon: Icon, showValue = true, glow = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(100, Math.max(0, ((value||0) / (max || 1)) * 100));
  const offset = circumference - (percent / 100) * circumference;
  const isOver = value > max;
  const actualColor = isOver ? 'text-red-500' : colorClass;
  
  return (
    <div className="relative flex flex-col items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 drop-shadow-2xl" width={size} height={size}>
        {glow && (
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        )}
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200/20 dark:text-gray-800/50" />
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          fill="transparent" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          className={`transition-all duration-1000 ease-out ${actualColor}`} 
          filter={glow ? `url(#glow-${label})` : undefined}
        />
      </svg>
      {showValue && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          {Icon && <Icon className={`w-5 h-5 mb-1 ${actualColor} drop-shadow-md`} />}
          <span className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{Math.round(value)}</span>
          {label && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</span>}
        </div>
      )}
    </div>
  );
};

const SortableWidget = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: transform ? 999 : 1, position: 'relative' };
  return (
    <div ref={setNodeRef} style={style} className="w-full mb-6 touch-none group relative">
      <div {...attributes} {...listeners} className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-gray-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing backdrop-blur-sm">
         <LayoutGrid className="w-4 h-4 text-gray-500"/>
      </div>
      {children}
    </div>
  );
};

const EditFoodModal = ({ food, onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({
    name: food.name || '',
    category: food.category || 'Other',
    calories: food.calories || 0,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
    fiber: food.fiber || 0,
    sugar: food.sugar || 0,
    sodium: food.sodium || 0,
    servingUnit: food.servingUnit || 'g',
    servingSize: food.servingSize || 1,
    notes: food.notes || ''
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return showToast('Food name is required', 'error');
    if (formData.calories < 0 || formData.protein < 0 || formData.carbs < 0 || formData.fat < 0) {
      return showToast('Macros cannot be negative', 'error');
    }
    if (formData.servingSize <= 0) return showToast('Invalid serving size', 'error');
    
    onSave(food.id, formData);
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-xl animate-fade-in">
      <div className="bg-white dark:bg-gray-950 w-full sm:max-w-4xl h-[95vh] sm:h-[85vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="font-black text-2xl text-gray-900 dark:text-white">Edit Food</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Modify Database Entry</p>
          </div>
          <button onClick={onClose} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-full transition-colors text-gray-600 dark:text-gray-300"><X className="w-6 h-6"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0 p-6 custom-scrollbar flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Food Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  {['Protein', 'Carbs', 'Fats', 'Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Beverages', 'Supplements', 'Meals', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Calories</label>
                <input type="number" name="calories" value={formData.calories} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Protein (g)</label>
                <input type="number" name="protein" value={formData.protein} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Carbs (g)</label>
                <input type="number" name="carbs" value={formData.carbs} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fat (g)</label>
                <input type="number" name="fat" value={formData.fat} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fiber (g)</label>
                <input type="number" name="fiber" value={formData.fiber} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              
              <div className="space-y-2 md:col-span-2 mt-4">
                <h4 className="font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">Serving Setup</h4>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Serving Unit</label>
                <select name="servingUnit" value={formData.servingUnit} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="g">Grams (g)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="Bowl">Bowl</option>
                  <option value="Cup">Cup</option>
                  <option value="Piece">Piece</option>
                  <option value="Slice">Slice</option>
                  <option value="Scoop">Scoop</option>
                  <option value="TBSP">Tablespoon</option>
                  <option value="TSP">Teaspoon</option>
                  <option value="Serving">Serving</option>
                  <option value="Count">Count</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Serving Size</label>
                <input type="number" name="servingSize" value={formData.servingSize} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
          
          <div className="lg:w-80 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Preview</h4>
            <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
               <div>
                  <h4 className="font-black text-gray-900 dark:text-white text-lg">{formData.name || 'Food Name'}</h4>
                  <span className="inline-block px-2 py-1 mt-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-md">{formData.category}</span>
               </div>
               <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 mt-4 mb-4 border border-gray-100 dark:border-gray-800">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Default Serving</span>
                    <span className="font-black text-gray-900 dark:text-white">{formData.servingSize} {formData.servingUnit}</span>
                 </div>
                 <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-800 pt-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Energy</span>
                    <div>
                      <span className="font-black text-emerald-500 text-lg">{formData.calories}</span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase ml-1">kcal</span>
                    </div>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                     <span className="block text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1">Pro</span>
                     <span className="font-black text-sm text-gray-900 dark:text-white">{formData.protein}g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                     <span className="block text-[9px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Carb</span>
                     <span className="font-black text-sm text-gray-900 dark:text-white">{formData.carbs}g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                     <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Fat</span>
                     <span className="font-black text-sm text-gray-900 dark:text-white">{formData.fat}g</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex gap-4 justify-end">
          <button onClick={onClose} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

const CreateFoodModal = ({ onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Protein',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    servingUnit: 'g',
    servingSize: 100,
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return showToast('Food name is required', 'error');
    if (formData.calories < 0 || formData.protein < 0 || formData.carbs < 0 || formData.fat < 0) {
      return showToast('Macros cannot be negative', 'error');
    }
    if (formData.servingSize <= 0) return showToast('Invalid serving size', 'error');
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-xl animate-fade-in">
      <div className="bg-white dark:bg-gray-950 w-full sm:max-w-4xl h-[95vh] sm:h-[85vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="font-black text-2xl text-gray-900 dark:text-white">Create Food</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Add New Database Entry</p>
          </div>
          <button onClick={onClose} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-full transition-colors text-gray-600 dark:text-gray-300"><X className="w-6 h-6"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0 p-6 custom-scrollbar flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Food Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., My Protein Shake" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  {['Protein', 'Carbs', 'Fats', 'Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Beverages', 'Supplements', 'Meals', 'Indian Foods', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Calories</label>
                <input type="number" name="calories" value={formData.calories} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Protein (g)</label>
                <input type="number" name="protein" value={formData.protein} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Carbs (g)</label>
                <input type="number" name="carbs" value={formData.carbs} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fat (g)</label>
                <input type="number" name="fat" value={formData.fat} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fiber (g)</label>
                <input type="number" name="fiber" value={formData.fiber} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              
              <div className="space-y-2 md:col-span-2 mt-4">
                <h4 className="font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">Serving Setup</h4>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Serving Unit</label>
                <select name="servingUnit" value={formData.servingUnit} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="g">Grams (g)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="Bowl">Bowl</option>
                  <option value="Cup">Cup</option>
                  <option value="Piece">Piece</option>
                  <option value="Slice">Slice</option>
                  <option value="Scoop">Scoop</option>
                  <option value="TBSP">Tablespoon</option>
                  <option value="TSP">Teaspoon</option>
                  <option value="Serving">Serving</option>
                  <option value="Count">Count</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Serving Size</label>
                <input type="number" name="servingSize" value={formData.servingSize} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
          
          <div className="lg:w-80 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Preview</h4>
            <div className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
               <div>
                  <h4 className="font-black text-gray-900 dark:text-white text-lg">{formData.name || 'Food Name'}</h4>
                  <span className="inline-block px-2 py-1 mt-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-md">{formData.category}</span>
               </div>
               <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 mt-4 mb-4 border border-gray-100 dark:border-gray-800">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Default Serving</span>
                    <span className="font-black text-gray-900 dark:text-white">{formData.servingSize} {formData.servingUnit}</span>
                 </div>
                 <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-800 pt-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Energy</span>
                    <div>
                      <span className="font-black text-emerald-500 text-lg">{formData.calories}</span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase ml-1">kcal</span>
                    </div>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                     <span className="block text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1">Pro</span>
                     <span className="font-black text-sm text-gray-900 dark:text-white">{formData.protein}g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                     <span className="block text-[9px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Carb</span>
                     <span className="font-black text-sm text-gray-900 dark:text-white">{formData.carbs}g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                     <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Fat</span>
                     <span className="font-black text-sm text-gray-900 dark:text-white">{formData.fat}g</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex gap-4 justify-end">
          <button onClick={onClose} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">Create Food</button>
        </div>
      </div>
    </div>
  );
};

export default function MealPlanner({ user }) {
  const [activeView, setActiveView] = useState('home');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [foodLibrary, setFoodLibrary] = useState([]);
  const [dailyLogs, setDailyLogs] = useState({});
  const [macroGoals, setMacroGoals] = useState({ calories: 2500, protein: 150, carbs: 300, fat: 75, water: 3000 });
  const [dietProfile, setDietProfile] = useState({ weight: 75, height: 175, age: 30, gender: 'male', activity: 'moderate', mode: 'maintenance' });
  const [waterLogs, setWaterLogs] = useState({});
  const [supplements, setSupplements] = useState([]);
  const [suppLogs, setSuppLogs] = useState({});
  const [groceryList, setGroceryList] = useState([]);
  
  // Gamification & Ecosystem
  const [nutritionXP, setNutritionXP] = useState(0);
  const [dashboardConfig, setDashboardConfig] = useState({ showCoaching: true, showCalories: true, showWater: true, showMacros: true, showGamification: true });
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeHistory, setChallengeHistory] = useState([]);
  const [widgetOrder, setWidgetOrder] = useState(['nutrition-summary', 'score-coach', 'today-meals']);
  
  const [gymLogs, setGymLogs] = useState({});
  const [recoveryLogs, setRecoveryLogs] = useState({});
  const [bodyProgress, setBodyProgress] = useState([]);

  // UI States
  const [foodForm, setFoodForm] = useState(null);
  const [recipeForm, setRecipeForm] = useState(null); 
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCatFilter, setFoodCatFilter] = useState('All');
  const [searchModal, setSearchModal] = useState({ isOpen: false, mealSection: null, targetDate: selectedDate, isRecipeMode: false });
  const [logSearch, setLogSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingLibraryFood, setEditingLibraryFood] = useState(null);
  const [isCreatingFood, setIsCreatingFood] = useState(false);

  const handleSaveFood = async (foodId, updatedData) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'foods', foodId), updatedData, { merge: true });
      showToast('Food updated successfully!');
      setEditingLibraryFood(null);
    } catch (e) {
      showToast('Failed to save food', 'error');
    }
  };

  const handleCreateFood = async (newFoodData) => {
    if (!db) return;
    try {
      const exists = foodLibrary.some(f => f.name.toLowerCase() === newFoodData.name.toLowerCase());
      if (exists) {
        if (!window.confirm("A food with this name already exists in your library. Create a copy anyway?")) return;
      }
      const newFoodId = 'food_' + Math.random().toString(36).substr(2, 9);
      const payload = {
         ...newFoodData,
         id: newFoodId,
         isCustom: true,
         isFavorite: false,
         createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'foods', newFoodId), payload);
      showToast('Food created successfully!');
      setIsCreatingFood(false);
    } catch (e) {
      showToast('Failed to create food', 'error');
    }
  };
  const [fabOpen, setFabOpen] = useState(false);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [manualGroceryModal, setManualGroceryModal] = useState(false);
  const [manualGroceryForm, setManualGroceryForm] = useState({ name: '', category: 'Produce', amount: 1, unit: 'pcs' });

  // Calendar / Analytics State
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(selectedDate); d.setDate(1); return d; });

  // Library View State
  const [libSearch, setLibSearch] = useState('');
  const [libCategory, setLibCategory] = useState('All');
  const [libFilter, setLibFilter] = useState('All');
  const [targetMealPrompt, setTargetMealPrompt] = useState(null);
  const [foodAmounts, setFoodAmounts] = useState({});

  useEffect(() => {
    if (!user || !db) return;
    const unsubFood = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'foods'), snap => {
      const needsMigration = snap.docs.length < 10 || snap.docs.some(d => d.data().name === 'Banana' && d.data().servingUnit === 'g');
      if (needsMigration) { 
        const batch = writeBatch(db); 
        snap.docs.forEach(d => batch.delete(d.ref));
        DEFAULT_FOODS.forEach(food => batch.set(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'foods')), { ...food, isCustom: false })); 
        batch.commit(); 
      }
      else setFoodLibrary(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'meal_logs'), snap => {
      const logs = {}; snap.docs.forEach(d => { logs[d.id] = d.data(); }); setDailyLogs(logs);
    });
    const unsubWater = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'water_logs', 'daily'), snap => {
      const logs = {}; snap.docs.forEach(d => { logs[d.id] = { amount: d.data().amount || 0, history: d.data().history || [] }; }); setWaterLogs(logs);
    });
    const unsubSupps = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'supplements'), snap => { setSupplements(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubSuppLogs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'supplement_logs', 'daily'), snap => {
      const logs = {}; snap.docs.forEach(d => { logs[d.id] = d.data().logs || []; }); setSuppLogs(logs);
    });
    const unsubGoals = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'goals'), docSnap => { if (docSnap.exists()) setMacroGoals(docSnap.data()); });
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'profile'), docSnap => { if (docSnap.exists()) setDietProfile(docSnap.data()); });
    const unsubGrocery = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'grocery_list'), snap => { setGroceryList(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    
    // XP & Settings
    const unsubXP = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), docSnap => {
       if (docSnap.exists()) { 
         setNutritionXP(docSnap.data().xp || 0); 
         setActiveChallenge(docSnap.data().challenge || null); 
         setChallengeHistory(docSnap.data().history || []);
       }
    });
    const unsubDash = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'dashboard_config'), docSnap => {
       if (docSnap.exists()) setDashboardConfig(docSnap.data());
    });
    const unsubOrder = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'dashboard_order'), docSnap => {
       if (docSnap.exists() && docSnap.data().order) setWidgetOrder(docSnap.data().order);
    });

    const unsubGym = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'gym_logs'), snap => { const g = {}; snap.docs.forEach(d => { g[d.id] = d.data(); }); setGymLogs(g); });
    const unsubRec = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'recovery_logs'), snap => { const r = {}; snap.docs.forEach(d => { r[d.id] = d.data(); }); setRecoveryLogs(r); });
    const unsubBody = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'body_progress'), snap => { setBodyProgress(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> new Date(b.date)-new Date(a.date))); });
    
    return () => { unsubFood(); unsubLogs(); unsubWater(); unsubSupps(); unsubSuppLogs(); unsubGoals(); unsubProfile(); unsubGrocery(); unsubXP(); unsubDash(); unsubOrder(); unsubGym(); unsubRec(); unsubBody(); };
  }, [user]);

  const showToast = (msg, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000); };
  const getLiveFood = (foodId, snapshot) => foodLibrary.find(f => f.id === foodId) || snapshot;
  const todayLog = useMemo(() => dailyLogs[selectedDate] || MEAL_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec]: [] }), {}), [dailyLogs, selectedDate]);

  const calculateTotals = (logObj) => {
    let c = 0, p = 0, ca = 0, f = 0, fib=0, sug=0, sod=0;
    if (!logObj) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
    
    const completed = logObj.completedMeals || [];
    
    MEAL_SECTIONS.forEach(sec => {
      if (logObj[sec] && completed.includes(sec)) {
        logObj[sec].forEach(item => {
            const live = getLiveFood(item.foodId, item);
            const fallbackSize = (item.servingUnit === 'g' || item.servingUnit === 'ml') ? 100 : 1;
            const ratio = item.amount / (item.servingSize || fallbackSize);
            c += (item.calories * ratio); p += (item.protein * ratio); ca += (item.carbs * ratio); f += (item.fat * ratio);
            fib += ((item.fiber||0) * ratio); sug += ((item.sugar||0) * ratio); sod += ((item.sodium||0) * ratio);
        });
      }
    });
    return { calories: Math.round(c), protein: Math.round(p), carbs: Math.round(ca), fat: Math.round(f), fiber: Math.round(fib), sugar: Math.round(sug), sodium: Math.round(sod) };
  };

  const totals = useMemo(() => calculateTotals(todayLog), [todayLog, foodLibrary]);
  const currentLevel = Math.floor(Math.sqrt(nutritionXP / 50)) + 1;
  const nextLevelXP = Math.pow(currentLevel, 2) * 50;
  const prevLevelXP = Math.pow(currentLevel - 1, 2) * 50;
  const levelProgress = ((nutritionXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

  // Gamification Challenge Engine
  useEffect(() => {
    if (!activeChallenge || activeChallenge.status !== 'In Progress') return;
    
    let currentStreak = 0;
    let failed = false;
    const { id, max, startDate } = activeChallenge;
    if (!startDate) return;

    const start = new Date(startDate);
    const end = new Date(todayStr);
    const daysElapsed = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysElapsed; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      
      let dayHit = false;
      if (id === 'hydration_7') {
        const amt = waterLogs[dStr]?.amount || 0;
        dayHit = amt >= macroGoals.water;
      } else if (id === 'protein_pro') {
        const t = calculateTotals(dailyLogs[dStr]);
        dayHit = t.protein >= macroGoals.protein;
      } else if (id === 'perfect_logger') {
        const l = dailyLogs[dStr];
        dayHit = l && l.breakfast?.length > 0 && l.lunch?.length > 0 && l.dinner?.length > 0;
      }
      
      if (dayHit) {
        currentStreak++;
      } else if (dStr !== todayStr) {
        failed = true;
        break;
      }
    }
    
    if (failed) {
      if (db) setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), { challenge: { ...activeChallenge, status: 'Failed' } }, { merge: true });
      showToast('Challenge Failed. You missed a day!', 'error');
    } else if (currentStreak !== activeChallenge.progress && currentStreak <= max) {
      if (db) setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), { challenge: { ...activeChallenge, progress: currentStreak } }, { merge: true });
      if (currentStreak >= max && activeChallenge.progress < max) {
         showToast(`Challenge Completed! +${activeChallenge.xp} XP`, 'success');
      }
    }
  }, [activeChallenge, dailyLogs, waterLogs, macroGoals, db, todayStr, foodLibrary]);

  const completeActiveChallenge = async () => {
    if (!activeChallenge || activeChallenge.progress < activeChallenge.max) return;
    const completedRecord = { ...activeChallenge, completedAt: new Date().toISOString() };
    if (db) {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), { 
        challenge: null,
        xp: increment(activeChallenge.xp),
        history: [completedRecord, ...challengeHistory]
      }, { merge: true });
    }
    showToast('Challenge Rewards Claimed!', 'success');
  };
  
  // Weekly Review Engine (Available on Sundays)
  const isSunday = new Date().getDay() === 0;
  const weeklyReview = useMemo(() => {
    if (!isSunday) return null;
    let totalCals = 0, daysLogged = 0, daysHitProtein = 0, daysHitWater = 0;
    for (let i=0; i<7; i++) {
       const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toISOString().split('T')[0];
       const t = calculateTotals(dailyLogs[dStr]);
       if (t.calories > 0) { totalCals += t.calories; daysLogged++; }
       if (t.protein >= macroGoals.protein * 0.9) daysHitProtein++;
       if ((waterLogs[dStr]?.amount||0) >= macroGoals.water) daysHitWater++;
    }
    return { avgCals: daysLogged ? Math.round(totalCals/daysLogged) : 0, proHitRate: Math.round((daysHitProtein/7)*100), waterHitRate: Math.round((daysHitWater/7)*100) };
  }, [dailyLogs, waterLogs, macroGoals, isSunday]);

  // --- Auto-Generated Grocery System ---
  const computedGroceryList = useMemo(() => {
     const itemsToAdd = {};
     for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const log = dailyLogs[dStr];
        if (log) {
           MEAL_SECTIONS.forEach(sec => {
              if (log[sec]) {
                 log[sec].forEach(item => {
                    const amt = item.amount || 1;
                    if (itemsToAdd[item.foodId]) itemsToAdd[item.foodId] += amt;
                    else itemsToAdd[item.foodId] = amt;
                 });
              }
           });
        }
     }
     
     const autoList = [];
     Object.keys(itemsToAdd).forEach(foodId => {
        const food = foodLibrary.find(f => f.id === foodId);
        if (food) {
           autoList.push({
              id: 'auto_' + foodId,
              foodId: food.id,
              name: food.name,
              category: food.category,
              amount: itemsToAdd[foodId],
              servingUnit: food.servingUnit,
              isChecked: false,
              isAuto: true
           });
        }
     });
     return autoList;
  }, [dailyLogs, foodLibrary]);

  const mergedGroceryList = useMemo(() => {
     const finalMap = {};
     groceryList.forEach(item => {
        finalMap[item.foodId] = { ...item, isAuto: false };
     });
     computedGroceryList.forEach(autoItem => {
        if (finalMap[autoItem.foodId]) {
           finalMap[autoItem.foodId].amount += autoItem.amount;
           finalMap[autoItem.foodId].isAutoMerged = true;
           finalMap[autoItem.foodId].servingUnit = autoItem.servingUnit;
        } else {
           finalMap[autoItem.foodId] = autoItem;
        }
     });
     return Object.values(finalMap);
  }, [groceryList, computedGroceryList]);

  const groupedList = useMemo(() => {
     const groups = {};
     mergedGroceryList.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
     });
     return groups;
  }, [mergedGroceryList]);

  const suggestions = useMemo(() => {
     const inListIds = new Set(mergedGroceryList.map(g => g.foodId));
     const candidates = foodLibrary.filter(f => f.isFavorite && !inListIds.has(f.id));
     return candidates.slice(0, 10);
  }, [foodLibrary, mergedGroceryList]);

  // AI Coaching Engine

  const aiInsights = useMemo(() => {
    const insights = [];
    if (gymLogs[selectedDate]?.exercises?.length > 3 && totals.carbs < macroGoals.carbs * 0.8) insights.push({ type: 'warning', icon: Zap, text: 'Heavy workout today! Add carbs pre-workout for energy.' });
    if (recoveryLogs[selectedDate]?.sleepHours < 6) insights.push({ type: 'info', icon: Droplets, text: 'Poor sleep detected. Increase hydration to aid central nervous system recovery.' });
    if (dietProfile.mode === 'cutting' && bodyProgress.length > 2) {
      if (bodyProgress[0].weight >= bodyProgress[Math.min(2, bodyProgress.length-1)].weight) {
         insights.push({ type: 'danger', icon: AlertTriangle, text: 'Weight stall detected over last 3 entries while cutting. AI suggests -100kcal adjustment.', action: 'adjust_macros_down' });
      }
    }
    if (insights.length === 0) insights.push({ type: 'success', icon: Target, text: 'Everything looks optimal. Keep crushing it.' });
    return insights;
  }, [gymLogs, recoveryLogs, selectedDate, totals, macroGoals, dietProfile, bodyProgress]);

  const activeReminders = useMemo(() => {
     const rems = []; const hour = new Date().getHours();
     if (hour < 10 && (waterLogs[todayStr]?.amount||0) < 500) rems.push('Morning Hydration: Drink 500ml water to kickstart metabolism.');
     if (gymLogs[todayStr] && hour > 18 && totals.protein < macroGoals.protein * 0.7) rems.push('Post-Workout: You are significantly under protein target today.');
     if (isSunday && hour > 10) rems.push("Sunday Routine: Weekly Review is ready! Plan next week's groceries.");
     return rems;
  }, [waterLogs, gymLogs, totals, macroGoals, todayStr, isSunday]);

  const awardXP = async (amount, reason) => {
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), { xp: increment(amount) }, { merge: true });
    showToast(`+${amount} XP: ${reason}`, 'success');
  };

  const applyAIAdjustment = async (action) => {
    if (action === 'adjust_macros_down') {
      const newGoals = { ...macroGoals, calories: macroGoals.calories - 100 };
      if (db) await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'goals'), newGoals);
      showToast('AI Macro Adjustment Applied (-100 kcal)');
      awardXP(50, 'Accepted AI Coach Recommendation');
    }
  };

  const saveDailyLog = async (dateStr, payload) => { 
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_logs', dateStr), payload);
  };
  
  const addWater = async (amount) => { 
    const currentData = waterLogs[selectedDate] || { amount: 0, history: [] };
    const newAmount = currentData.amount + amount;
    const newHistory = [...(currentData.history || []), { time: new Date().toISOString(), amount }];

    if (db) {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'water_logs', 'daily', selectedDate), { amount: newAmount, history: newHistory }, { merge: true }); 
    }
    
    // Always update local state immediately
    setWaterLogs(prev => ({
      ...prev,
      [selectedDate]: { amount: newAmount, history: newHistory }
    }));

    if (newAmount >= (macroGoals.water || 3000) && currentData.amount < (macroGoals.water || 3000)) awardXP(30, 'Hydration Goal Reached');
  };
  
  const toggleSupplement = async (suppId) => {
    const current = suppLogs[selectedDate] || [];
    const next = current.includes(suppId) ? current.filter(id => id !== suppId) : [...current, suppId];
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'supplement_logs', 'daily', selectedDate), { takenIds: next });
  };

  const copyYesterday = () => {
    const yest = new Date(selectedDate); yest.setDate(yest.getDate()-1);
    const yStr = yest.toISOString().split('T')[0];
    const sourceLog = dailyLogs[yStr];
    if (!sourceLog) return showToast('No logs yesterday to copy', 'error');
    const newLog = JSON.parse(JSON.stringify(sourceLog));
    MEAL_SECTIONS.forEach(sec => { if (newLog[sec]) newLog[sec].forEach(item => item.id = Math.random().toString(36).substr(2,9)); });
    saveDailyLog(selectedDate, newLog); showToast('Copied yesterday!'); awardXP(5, 'Smart Logging');
  };

  const toggleFavoriteFood = async (foodId, currentStatus) => {
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'foods', foodId), { isFavorite: !currentStatus }, { merge: true });
    showToast(currentStatus ? 'Removed from Favorites' : 'Added to Favorites');
  };

  const handleAddFoodToMeal = (food, section, dateStr = selectedDate, amountOverride = null) => {
    const finalAmount = amountOverride !== null ? amountOverride : food.servingSize;
    const log = dailyLogs[dateStr] || MEAL_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec]: [] }), {});
    const newLog = { ...log };
    if (!newLog[section]) newLog[section] = [];
    newLog[section].push({ id: Math.random().toString(36).substr(2, 9), foodId: food.id, name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, amount: finalAmount, servingUnit: food.servingUnit, servingSize: food.servingSize });
    saveDailyLog(dateStr, newLog); showToast(`Added to ${MEAL_LABELS[section]}`);
    setSearchModal({ isOpen: false, mealSection: null, targetDate: selectedDate, isRecipeMode: false });
    awardXP(5, 'Logged Meal');
  };

  const toggleMealComplete = async (section) => {
    const log = dailyLogs[selectedDate] || MEAL_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec]: [] }), {});
    const newLog = { ...log };
    const currentCompleted = newLog.completedMeals || [];
    if (currentCompleted.includes(section)) {
      newLog.completedMeals = currentCompleted.filter(s => s !== section);
      showToast(`${MEAL_LABELS[section]} marked incomplete`, 'info');
    } else {
      newLog.completedMeals = [...currentCompleted, section];
      showToast(`${MEAL_LABELS[section]} completed!`, 'success');
      awardXP(10, 'Meal Completed');
    }
    saveDailyLog(selectedDate, newLog);
  };

  const duplicateMeal = async (section) => {
    const yest = new Date(selectedDate); yest.setDate(yest.getDate()-1);
    const yStr = yest.toISOString().split('T')[0];
    const sourceLog = dailyLogs[yStr];
    if (!sourceLog || !sourceLog[section] || sourceLog[section].length === 0) return showToast(`No ${MEAL_LABELS[section]} logged yesterday`, 'error');
    
    const log = dailyLogs[selectedDate] || MEAL_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec]: [] }), {});
    const newLog = { ...log };
    const itemsToAdd = sourceLog[section].map(i => ({ ...i, id: Math.random().toString(36).substr(2,9) }));
    newLog[section] = [...(newLog[section] || []), ...itemsToAdd];
    saveDailyLog(selectedDate, newLog);
    showToast(`Copied yesterday's ${MEAL_LABELS[section]}!`);
    awardXP(5, 'Smart Duplication');
  };

  const calculateNutritionScore = (t, goals, secLogs) => {
    let score = 0;
    if (goals.calories > 0) {
      const calRatio = t.calories / goals.calories;
      if (calRatio >= 0.9 && calRatio <= 1.1) score += 40;
      else if (calRatio >= 0.8 && calRatio <= 1.2) score += 20;
    }
    if (goals.protein > 0) {
      const proRatio = t.protein / goals.protein;
      if (proRatio >= 0.9) score += 30;
      else if (proRatio >= 0.75) score += 15;
    }
    if (goals.water > 0) {
      const w = waterLogs[selectedDate]?.amount || 0;
      const wRatio = w / goals.water;
      if (wRatio >= 1) score += 20;
      else if (wRatio >= 0.5) score += 10;
    }
    let loggedCount = 0;
    MEAL_SECTIONS.forEach(sec => {
      if (secLogs && secLogs[sec] && secLogs[sec].length > 0) loggedCount++;
    });
    if (loggedCount >= 3) score += 10;
    else if (loggedCount > 0) score += 5;
    return score;
  };

  const nutritionScore = useMemo(() => calculateNutritionScore(totals, macroGoals, todayLog), [totals, macroGoals, todayLog, waterLogs, selectedDate]);
  
  const getScoreStatus = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (score >= 75) return { text: 'Good', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (score >= 60) return { text: 'Average', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { text: 'Needs Improvement', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const toggleDashboardWidget = async (widget) => {
    const newConfig = { ...dashboardConfig, [widget]: !dashboardConfig[widget] };
    setDashboardConfig(newConfig);
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'dashboard_config'), newConfig);
  };

  const joinChallenge = async () => {
    const newChallenge = { id: 'hydration_7', name: '7-Day Hydration', progress: 0, max: 7 };
    if (db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'gamification'), { challenge: newChallenge }, { merge: true });
    showToast('Challenge Accepted!');
  };

  const toggleGroceryItem = async (item) => {
     if (!db) return;
     if (item.isAuto && !item.isAutoMerged) {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'grocery_list'), { 
           foodId: item.foodId, name: item.name, category: item.category, amount: 0, isChecked: true 
        });
     } else {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'grocery_list', item.id), { isChecked: !item.isChecked }, { merge: true });
     }
  };
  
  const addGroceryItem = async (food) => {
     if (!db) return;
     const exists = groceryList.find(g => g.foodId === food.id);
     if (exists) {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'grocery_list', exists.id), { amount: exists.amount + 1, isChecked: false }, { merge: true });
     } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'grocery_list'), { 
           foodId: food.id, name: food.name, category: food.category, amount: 1, isChecked: false 
        });
     }
     showToast(`Added ${food.name} to Groceries`);
  };

  const removeGroceryItem = async (itemId) => {
     if (db) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'grocery_list', itemId));
  };
  
  const addManualGroceryItem = async () => {
     if (!db || !manualGroceryForm.name.trim()) return;
     await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'grocery_list'), {
        foodId: 'manual_' + Date.now(),
        name: manualGroceryForm.name.trim(),
        category: manualGroceryForm.category,
        amount: Number(manualGroceryForm.amount) || 1,
        servingUnit: manualGroceryForm.unit,
        isChecked: false,
        isManual: true,
     });
     showToast(`Added "${manualGroceryForm.name.trim()}" to groceries`);
     setManualGroceryForm({ name: '', category: 'Produce', amount: 1, unit: 'pcs' });
     setManualGroceryModal(false);
  };

  const clearCheckedGroceries = async () => {
     if (!db) return;
     const checked = groceryList.filter(g => g.isChecked);
     const batch = writeBatch(db);
     checked.forEach(g => {
        batch.delete(doc(db, 'artifacts', appId, 'users', user.uid, 'grocery_list', g.id));
     });
     await batch.commit();
     showToast('Cleared checked items');
  };


  // --- EXTRACTED HOOKS FOR INLINE COMPONENTS ---
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Trends: 30-day dataset — hoisted to MealPlanner scope so no hooks inside inner component

  
  // AnalyticsTrends uses thirtyDayData + trendSummary from outer scope (no hooks inside — prevents hooks-in-new-identity crash)

  const filteredFoods = useMemo(() => {
    let result = foodLibrary.filter(f => f.name.toLowerCase().includes(libSearch.toLowerCase()));
    if (libCategory !== 'All') result = result.filter(f => f.category === libCategory);
    if (libFilter === 'Favorites') result = result.filter(f => f.isFavorite);
    else if (libFilter === 'Custom') result = result.filter(f => f.isCustom);
    else if (libFilter === 'Recent') {
      const recentFreq = {};
      Object.values(dailyLogs).forEach(logObj => {
        MEAL_SECTIONS.forEach(sec => {
          if (logObj[sec]) logObj[sec].forEach(item => {
            recentFreq[item.foodId] = (recentFreq[item.foodId] || 0) + 1;
          });
        });
      });
      result = result.filter(f => recentFreq[f.id]).sort((a,b) => recentFreq[b.id] - recentFreq[a.id]);
    }
    return result;
  }, [foodLibrary, libSearch, libCategory, libFilter, dailyLogs]);


  const searchFiltered = useMemo(() => {
    return foodLibrary.filter(f => f.name.toLowerCase().includes(logSearch.toLowerCase()));
  }, [foodLibrary, logSearch]);


  // --- VIEWS ---
  
  const TopBar = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 max-w-7xl mx-auto px-4 lg:px-0 sticky top-0 z-40 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-xl py-4 border-b border-gray-200/50 dark:border-gray-800/50">
       <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Target className="text-white w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Nutrition</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Life Planner ecosystem</p>
          </div>
       </div>
       <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Segmented Date Picker */}
          <div className="flex items-center bg-gray-200/50 dark:bg-gray-900/50 backdrop-blur-md p-1 rounded-2xl border border-gray-300/50 dark:border-gray-800/50 flex-1 sm:flex-none justify-center">
            <button 
              onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} 
              className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="bg-transparent text-gray-900 dark:text-white font-black text-sm outline-none cursor-pointer text-center w-36 px-2"
            />
            <button 
              onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} 
              className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
          
          <button onClick={() => setShowSettings(true)} className="p-3 bg-gray-200/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-300/50 dark:border-gray-800/50 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-300 flex-shrink-0">
            <Settings className="w-5 h-5"/>
          </button>
          
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 bg-gray-200/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-300/50 dark:border-gray-800/50 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-300">
              <Bell className="w-5 h-5"/>
              {activeReminders.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-950 animate-pulse"></span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-5 z-50 animate-fade-in origin-top-right">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-gray-900 dark:text-white">Insights</h4>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">{activeReminders.length} New</span>
                </div>
                {activeReminders.length === 0 ? (
                  <p className="text-sm text-gray-500 font-medium text-center py-4">All caught up!</p>
                ) : (
                  <div className="space-y-3">
                    {activeReminders.map((r, i) => (
                      <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-700/50 flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                        <p>{r}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
       </div>
    </div>
  );

  const NavigationTabs = () => (
    <div className="flex max-w-7xl mx-auto px-4 lg:px-0 mb-8 overflow-x-auto custom-scrollbar">
      <div className="flex gap-2 p-1.5 bg-gray-200/50 dark:bg-gray-900/50 backdrop-blur-md rounded-3xl border border-gray-300/50 dark:border-gray-800/50 inline-flex">
        {[
          { id: 'home', icon: LayoutGrid, title: 'Home' },
          { id: 'water', icon: Droplet, title: 'Hydration' },
          { id: 'supplements', icon: Pill, title: 'Supps' },
          { id: 'targets', icon: Settings, title: 'Targets' },
          { id: 'gamification', icon: Medal, title: 'Levels' },
          { id: 'transformation', icon: Target, title: 'Transformation' },
          { id: 'library', icon: Search, title: 'Foods' },
          { id: 'grocery', icon: ShoppingCart, title: 'Groceries' }
        ].map(nav => (
          <button 
            key={nav.id} 
            onClick={() => setActiveView(nav.id)} 
            className={`px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeView === nav.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <nav.icon className={`w-4 h-4 ${activeView === nav.id ? 'text-emerald-500' : ''}`}/> {nav.title}
          </button>
        ))}
      </div>
    </div>
  );

  const HomeView = () => {
    const scoreStatus = getScoreStatus(nutritionScore);
    const completedMeals = todayLog.completedMeals || [];
    
    const handleDragEnd = (event) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
         setWidgetOrder(items => {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            if (db) setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'meal_settings', 'dashboard_order'), { order: newOrder }, { merge: true });
            return newOrder;
         });
      }
    };

    const widgets = {
       'nutrition-summary': (
         <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
           <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"><Activity className="w-6 h-6 text-emerald-500"/> Daily Nutrition</h3>
           
           <div className="flex flex-wrap lg:flex-nowrap items-center justify-around gap-6">
             <div className="flex flex-col items-center flex-1 min-w-[200px]">
                <CircularProgress value={totals.calories} max={macroGoals.calories} colorClass="text-emerald-500" size={180} strokeWidth={14} label="Calories" glow={true} />
                <p className="text-xs font-bold text-gray-500 mt-4 text-center">{totals.calories} / {macroGoals.calories} kcal</p>
             </div>
             
             <div className="w-px h-32 bg-gray-200/50 dark:bg-gray-800/50 hidden lg:block"></div>
             
             <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 flex-[2] min-w-[300px]">
               <div className="flex flex-col items-center">
                  <CircularProgress value={totals.protein} max={macroGoals.protein} colorClass="text-red-500" size={100} strokeWidth={8} label="Protein" glow={false} />
                  <p className="text-[10px] font-bold text-gray-500 mt-2">{totals.protein} / {macroGoals.protein}g</p>
               </div>
               <div className="flex flex-col items-center">
                  <CircularProgress value={totals.carbs} max={macroGoals.carbs} colorClass="text-yellow-500" size={100} strokeWidth={8} label="Carbs" glow={false} />
                  <p className="text-[10px] font-bold text-gray-500 mt-2">{totals.carbs} / {macroGoals.carbs}g</p>
               </div>
               <div className="flex flex-col items-center">
                  <CircularProgress value={totals.fat} max={macroGoals.fat} colorClass="text-blue-500" size={100} strokeWidth={8} label="Fat" glow={false} />
                  <p className="text-[10px] font-bold text-gray-500 mt-2">{totals.fat} / {macroGoals.fat}g</p>
               </div>
               <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform" onClick={() => addWater(500)}>
                  <CircularProgress value={waterLogs[selectedDate]?.amount || 0} max={macroGoals.water} colorClass="text-cyan-500" size={100} strokeWidth={8} label="Water" glow={true} />
                  <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-2 flex items-center gap-1"><Plus className="w-3 h-3"/> 500ml</p>
               </div>
             </div>
           </div>
         </div>
       ),
       'score-coach': (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
             <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-transform group-hover:scale-150 ${scoreStatus.bg.split('/')[0].replace('bg-', 'bg-')}`}></div>
             <div className="relative z-10 flex justify-between items-start mb-4">
               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500"/> Nutrition Score</h3>
               <span className={`px-3 py-1 rounded-full text-xs font-bold ${scoreStatus.bg} ${scoreStatus.color}`}>{scoreStatus.text}</span>
             </div>
             <div className="relative z-10 flex items-end gap-3 mt-4">
               <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">{nutritionScore}</span>
               <span className="text-xl font-bold text-gray-400 mb-2">/ 100</span>
             </div>
           </div>
           <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm flex flex-col overflow-hidden relative">
             <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/> Smart Coach</h3>
             <div className="flex-1 flex flex-col justify-center space-y-3 relative z-10">
               {aiInsights.slice(0, 2).map((rec, i) => (
                 <div key={i} className={`p-3 rounded-2xl flex items-start gap-3 border ${rec.type === 'danger' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/50 text-red-900 dark:text-red-200' : rec.type === 'warning' ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-800/50 text-yellow-900 dark:text-yellow-200' : rec.type === 'success' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/50 text-blue-900 dark:text-blue-200'}`}>
                   <rec.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${rec.type === 'danger' ? 'text-red-500' : rec.type === 'warning' ? 'text-yellow-500' : rec.type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`} />
                   <p className="text-xs font-bold leading-relaxed">{rec.text}</p>
                 </div>
               ))}
             </div>
           </div>
         </div>
       ),
       'today-meals': (
         <div className="space-y-6">
           <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight"><Clock className="w-6 h-6 text-gray-400"/> Today's Meals</h3>
           
           <div className="relative pl-4 sm:pl-8 border-l-2 border-gray-200 dark:border-gray-800 space-y-8">
             {MEAL_SECTIONS.map(section => {
               const items = todayLog[section] || [];
               const secTotals = calculateTotals({ [section]: items });
               const isCompleted = completedMeals.includes(section);
               
               return (
                 <div key={section} className="relative">
                   <div className={`absolute -left-[21px] sm:-left-[37px] top-6 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 bg-white dark:bg-gray-950 flex items-center justify-center transition-colors ${isCompleted ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                     {isCompleted && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                   </div>
                   
                   <div className={`bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300 ${isCompleted ? 'border-emerald-500/50 dark:border-emerald-500/30' : 'border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                     
                     <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100/50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/10">
                       <div>
                         <h3 className={`text-lg font-black capitalize flex items-center gap-2 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                           {MEAL_LABELS[section]}
                           {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-500"/>}
                         </h3>
                         {items.length > 0 && (
                           <div className="flex gap-3 mt-1.5 text-xs font-bold text-gray-500">
                             <span className="text-gray-900 dark:text-gray-300">{secTotals.calories} kcal</span>
                             <span>•</span>
                             <span className="text-red-500">{secTotals.protein}g Pro</span>
                             <span>•</span>
                             <span className="text-yellow-500">{secTotals.carbs}g Carb</span>
                             <span>•</span>
                             <span className="text-blue-500">{secTotals.fat}g Fat</span>
                           </div>
                         )}
                       </div>
                       <div className="flex items-center gap-2 w-full sm:w-auto">
                         <button onClick={() => { setSearchModal({ isOpen: true, mealSection: section, targetDate: selectedDate, isRecipeMode: false }); setLibCategory('All'); setLibSearch(''); }} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none">
                            <Plus className="w-4 h-4"/> Add
                         </button>
                         <button onClick={() => toggleMealComplete(section)} className={`px-4 py-2 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none ${isCompleted ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'}`}>
                            {isCompleted ? 'Undo' : 'Done'}
                         </button>
                         <button onClick={() => duplicateMeal(section)} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" title="Copy yesterday">
                            <Copy className="w-4 h-4"/>
                         </button>
                       </div>
                     </div>

                     {items.length > 0 ? (
                       <div className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                         {items.map((item, idx) => {
                           const live = getLiveFood(item.foodId, item);
                           const fallbackSize = (item.servingUnit === 'g' || item.servingUnit === 'ml') ? 100 : 1;
                           const r = item.amount / (item.servingSize || fallbackSize);
                           const isEd = editingItem?.id === item.id;
                           return (
                             <div key={item.id || idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                               <div>
                                 <h4 className={`font-bold text-sm sm:text-base ${isCompleted ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>{live.name}</h4>
                                 {isEd ? (
                                   <div className="flex items-center gap-2 mt-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg inline-flex">
                                     <input type="number" autoFocus className="w-16 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs font-black text-center outline-none" value={editingItem.amount} onChange={e => setEditingItem({ ...editingItem, amount: e.target.value })} />
                                     <span className="text-[10px] font-bold text-gray-500 uppercase">{live.servingUnit}</span>
                                     <button onClick={() => { const log = dailyLogs[selectedDate]; const nl={...log}; nl[section].find(i=>i.id===item.id).amount=Number(editingItem.amount); saveDailyLog(selectedDate, nl); setEditingItem(null); }} className="text-white bg-emerald-500 p-1 rounded hover:bg-emerald-600"><CheckCircle className="w-3 h-3"/></button>
                                   </div>
                                 ) : (
                                   <p className="text-xs font-bold text-gray-400 mt-1">{item.amount}{item.servingUnit || live.servingUnit} • {Math.round(item.calories * r)} kcal</p>
                                 )}
                               </div>
                               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => setEditingItem({ ...item, mealSection: section })} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
                                   <Edit2 className="w-4 h-4"/>
                                 </button>
                                 <button onClick={() => { const log = dailyLogs[selectedDate]; const nl={...log}; nl[section]=nl[section].filter(i=>i.id!==item.id); saveDailyLog(selectedDate, nl); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                   <Trash2 className="w-4 h-4"/>
                                 </button>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     ) : (
                       <div className="p-6 text-center text-sm font-bold text-gray-400">
                         No foods logged for {MEAL_LABELS[section].toLowerCase()}
                       </div>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
       )
    };

    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-0 pb-20 animate-fade-in">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">Your Dashboard</h2>
         </div>
         <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
               {widgetOrder.map(id => widgets[id] ? <SortableWidget key={id} id={id}>{widgets[id]}</SortableWidget> : null)}
            </SortableContext>
         </DndContext>
      </div>
    );
  };

  const SettingsModal = () => {
    if (!showSettings) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-fade-in">
        <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] overflow-hidden p-8 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-2xl text-gray-900 dark:text-white">Dashboard</h3>
            <button onClick={() => setShowSettings(false)} className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"><X className="w-5 h-5"/></button>
          </div>
          <div className="space-y-4">
            {Object.keys(dashboardConfig).map(key => (
              <div key={key} className="flex justify-between items-center p-5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => toggleDashboardWidget(key)}>
                <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{key.replace('show', '')} Widget</span>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${dashboardConfig[key] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${dashboardConfig[key] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };








  const LibraryView = () => {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-0 pb-32 animate-fade-in relative">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight"><Search className="text-emerald-500 w-6 h-6"/> Food Database</h3>
           <button onClick={() => setIsCreatingFood(true)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform flex items-center gap-2"><Plus className="w-4 h-4"/> Create</button>
        </div>

        {/* Search Bar & Filters */}
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm space-y-6">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
              <input 
                type="text" 
                placeholder="Search database..." 
                value={libSearch} 
                onChange={e => setLibSearch(e.target.value)} 
                className="w-full py-4 pl-12 pr-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-lg transition-shadow" 
              />
           </div>
           
           <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
             {['All', 'Favorites', 'Recent', 'Custom'].map(f => (
                <button key={f} onClick={() => setLibFilter(f)} className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${libFilter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {f === 'Favorites' && <Star className="w-3.5 h-3.5 fill-current"/>}
                  {f === 'Recent' && <Clock className="w-3.5 h-3.5"/>}
                  {f}
                </button>
             ))}
           </div>
           
           <div className="flex gap-2 overflow-x-auto custom-scrollbar pt-2 border-t border-gray-100 dark:border-gray-800/50">
             <button onClick={() => setLibCategory('All')} className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${libCategory === 'All' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}`}>All Categories</button>
             {FOOD_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setLibCategory(cat)} className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${libCategory === cat ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}`}>
                  {cat}
                </button>
             ))}
           </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFoods.length === 0 ? (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                <Search className="w-12 h-12 mb-4 opacity-20"/>
                <p className="font-bold text-lg">No foods found matching criteria</p>
             </div>
          ) : filteredFoods.map(food => {
             const amt = foodAmounts[food.id] !== undefined ? foodAmounts[food.id] : food.servingSize;
             const ratio = amt / (food.servingSize || 1);
             const isWeight = food.servingUnit === 'g' || food.servingUnit === 'ml';
             return (
             <div key={food.id} className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all group relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 dark:from-gray-800 to-transparent group-hover:from-emerald-400 transition-colors"></div>
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                       <h4 className="font-black text-gray-900 dark:text-white text-lg pr-8">{food.name}</h4>
                       <span className="inline-block px-2.5 py-1 mt-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-lg">{food.category}</span>
                     </div>
                     <button onClick={() => toggleFavoriteFood(food.id, food.isFavorite)} className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${food.isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' : 'text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                       <Star className={`w-5 h-5 ${food.isFavorite ? 'fill-current' : ''}`}/>
                     </button>
                  </div>
                  
                  <div className="bg-gray-50/50 dark:bg-gray-950/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-800/50">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center">
                          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden w-20">
                            <input 
                              type="number" min="0.1" step={isWeight ? "10" : "0.5"}
                              value={amt} 
                              onChange={e => setFoodAmounts({...foodAmounts, [food.id]: Number(e.target.value)})} 
                              className="w-full p-1.5 bg-transparent font-black text-center text-sm outline-none text-gray-900 dark:text-white"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{food.servingUnit}</span>
                       </div>
                       <div className="text-right">
                         <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{Math.round(food.calories * ratio)}</span>
                         <span className="text-[10px] font-bold text-emerald-500 uppercase ml-1">kcal</span>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                       <div className="bg-white dark:bg-gray-900 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                          <span className="block text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1">Pro</span>
                          <span className="font-black text-sm text-gray-900 dark:text-white">{Math.round(food.protein * ratio)}g</span>
                       </div>
                       <div className="bg-white dark:bg-gray-900 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                          <span className="block text-[9px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Carb</span>
                          <span className="font-black text-sm text-gray-900 dark:text-white">{Math.round(food.carbs * ratio)}g</span>
                       </div>
                       <div className="bg-white dark:bg-gray-900 rounded-xl p-2 text-center border border-gray-100 dark:border-gray-800">
                          <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Fat</span>
                          <span className="font-black text-sm text-gray-900 dark:text-white">{Math.round(food.fat * ratio)}g</span>
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                   <button onClick={() => setTargetMealPrompt({ ...food, amount: amt })} className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm py-3 rounded-xl shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4"/> Add
                   </button>
                   <button onClick={() => setEditingLibraryFood(food)} className="px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                      <Edit2 className="w-4 h-4"/>
                   </button>
                </div>
             </div>
          )})}
        </div>
        
        {/* Target Meal Popover / Modal */}
        {targetMealPrompt && (
           <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
             <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden p-6 sm:p-8 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 transform transition-transform translate-y-0 relative">
                <button onClick={() => setTargetMealPrompt(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Log Food</h3>
                <p className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2"><span className="text-emerald-500">{targetMealPrompt.name}</span></p>
                <div className="space-y-3">
                  {MEAL_SECTIONS.map(sec => (
                     <button 
                       key={sec} 
                       onClick={() => { handleAddFoodToMeal(targetMealPrompt, sec, selectedDate, targetMealPrompt.amount); setTargetMealPrompt(null); }}
                       className="w-full text-left px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold transition-colors border border-gray-100 dark:border-gray-700 flex justify-between items-center group"
                     >
                       <span className="capitalize">{MEAL_LABELS[sec]}</span>
                       <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                     </button>
                  ))}
                </div>
             </div>
           </div>
        )}
      </div>
    );
  };

  const GroceryView = () => {

    return (
      <>
      <div className={`space-y-6 max-w-7xl mx-auto px-4 lg:px-0 pb-32 animate-fade-in relative ${shoppingMode ? 'pt-8' : ''}`}>
         {shoppingMode && (
            <div className="flex justify-between items-center mb-6 sticky top-0 z-50 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md py-4 px-2 rounded-2xl">
               <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3"><ShoppingCart className="text-emerald-500 w-8 h-8"/> Shopping Mode</h2>
               <button onClick={() => setShoppingMode(false)} className="px-5 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-200 dark:border-red-800/50 hover:scale-105 transition-transform flex items-center gap-2 shadow-sm">
                  <X className="w-5 h-5"/> Exit
               </button>
            </div>
         )}
         
         {!shoppingMode && (
            <div className="flex flex-col gap-6 mb-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight"><ShoppingCart className="text-emerald-500 w-6 h-6"/> Groceries</h3>
                  <div className="flex items-center gap-3">
                     <button onClick={() => setManualGroceryModal(true)} className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 transition-all flex items-center gap-2 shadow-sm">
                        <Plus className="w-4 h-4 text-emerald-500"/> Add Manually
                     </button>
                     <button onClick={() => setShoppingMode(true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4"/> Start Shopping
                     </button>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm">
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Total Items</span>
                     <span className="text-2xl font-black text-gray-900 dark:text-white">{mergedGroceryList.length}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm">
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Purchased</span>
                     <span className="text-2xl font-black text-gray-900 dark:text-white">{mergedGroceryList.filter(g=>g.isChecked).length}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm">
                     <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1 block">Remaining</span>
                     <span className="text-2xl font-black text-gray-900 dark:text-white">{mergedGroceryList.filter(g=>!g.isChecked).length}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" style={{width: `${mergedGroceryList.length ? (mergedGroceryList.filter(g=>g.isChecked).length / mergedGroceryList.length) * 100 : 0}%`}}></div>
                     <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest mb-1 block">Completion</span>
                     <span className="text-2xl font-black text-gray-900 dark:text-white">{mergedGroceryList.length ? Math.round((mergedGroceryList.filter(g=>g.isChecked).length / mergedGroceryList.length) * 100) : 0}%</span>
                  </div>
               </div>
            </div>
         )}

         {!shoppingMode && suggestions.length > 0 && (
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] p-6 shadow-sm mb-6">
               <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500"/> Suggestions</h4>
               <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                  {suggestions.map(food => (
                     <div key={food.id} className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3 group">
                        <div>
                           <p className="font-bold text-sm text-gray-900 dark:text-white">{food.name}</p>
                           <p className="text-[10px] text-gray-500">{food.category}</p>
                        </div>
                        <button onClick={() => addGroceryItem(food)} className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">
                           <Plus className="w-4 h-4"/>
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         )}

         <div className="space-y-6">
            {Object.keys(groupedList).length === 0 ? (
               <div className="text-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-800">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4"/>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Your list is empty</h3>
                  <p className="text-sm font-bold text-gray-500 mt-2">Log meals to auto-generate your grocery list, or add items manually.</p>
               </div>
            ) : (
               Object.keys(groupedList).sort().map(category => (
                  <div key={category} className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2rem] overflow-hidden shadow-sm">
                     <div className="bg-gray-50/50 dark:bg-gray-800/30 px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest">{category}</h4>
                     </div>
                     <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                        {groupedList[category].map(item => (
                           <div key={item.id} className={`p-4 sm:p-6 flex items-center justify-between transition-colors ${item.isChecked ? 'bg-gray-50/50 dark:bg-gray-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleGroceryItem(item)}>
                                 <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${item.isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'}`}>
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5"/>
                                 </div>
                                 <div>
                                    <h5 className={`font-bold text-base sm:text-lg transition-all ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{item.name}</h5>
                                    {item.amount > 1 && <span className={`text-xs font-black ${item.isChecked ? 'text-gray-500' : 'text-emerald-500'}`}>Qty: {item.amount} {item.servingUnit}</span>}
                                 </div>
                              </div>
                              {!shoppingMode && (!item.isAuto || item.isAutoMerged) && (
                                 <button onClick={() => removeGroceryItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all ml-4">
                                    <Trash2 className="w-5 h-5"/>
                                 </button>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               ))
            )}
         </div>
         
         {groceryList.some(g=>g.isChecked) && (
            <div className="mt-8 flex justify-center pb-8">
               <button onClick={clearCheckedGroceries} className="px-6 py-3 bg-gray-200/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border border-gray-300/50 dark:border-gray-700/50">
                  <Trash2 className="w-4 h-4"/> Clear Checked Items
               </button>
            </div>
         )}
      </div>

      {/* Manual Grocery Add Modal */}
      {manualGroceryModal && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setManualGroceryModal(false); }}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-800/50 animate-fade-in">
               <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500"/>
               <div className="p-7">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-500"/> Add Item Manually</h3>
                     <button onClick={() => setManualGroceryModal(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"><X className="w-4 h-4"/></button>
                  </div>

                  <div className="space-y-4">
                     {/* Item Name */}
                     <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Item Name</label>
                        <input
                           autoFocus
                           type="text"
                           placeholder="e.g. Almond Milk, Brown Rice…"
                           value={manualGroceryForm.name}
                           onChange={e => setManualGroceryForm(f => ({ ...f, name: e.target.value }))}
                           onKeyDown={e => e.key === 'Enter' && addManualGroceryItem()}
                           className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400"
                        />
                     </div>

                     {/* Category */}
                     <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Category</label>
                        <select
                           value={manualGroceryForm.category}
                           onChange={e => setManualGroceryForm(f => ({ ...f, category: e.target.value }))}
                           className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                        >
                           {FOOD_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           <option value="Other">Other</option>
                        </select>
                     </div>

                     {/* Quantity + Unit */}
                     <div className="flex gap-3">
                        <div className="flex-1">
                           <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Qty</label>
                           <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={manualGroceryForm.amount}
                              onChange={e => setManualGroceryForm(f => ({ ...f, amount: e.target.value }))}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                           />
                        </div>
                        <div className="flex-1">
                           <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Unit</label>
                           <select
                              value={manualGroceryForm.unit}
                              onChange={e => setManualGroceryForm(f => ({ ...f, unit: e.target.value }))}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                           >
                              {['pcs', 'g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'pack', 'can', 'bottle'].map(u => <option key={u} value={u}>{u}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 mt-7">
                     <button onClick={() => setManualGroceryModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Cancel
                     </button>
                     <button
                        onClick={addManualGroceryItem}
                        disabled={!manualGroceryForm.name.trim()}
                        className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-100 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                     >
                        <Plus className="w-4 h-4"/> Add to Groceries
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
      </>
    );
  };

  const SearchModalView = () => {
    if (!searchModal.isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-xl animate-fade-in">
        <div className="bg-white dark:bg-gray-950 w-full sm:max-w-3xl h-[90vh] sm:h-[80vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
          
          <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
            <div>
              <h3 className="font-black text-2xl text-gray-900 dark:text-white">Add to {MEAL_LABELS[searchModal.mealSection]}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Search Food Library</p>
            </div>
            <button onClick={() => setSearchModal({ isOpen: false })} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-full transition-colors text-gray-600 dark:text-gray-300"><X className="w-6 h-6"/></button>
          </div>
          
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
              <input 
                autoFocus 
                type="text" 
                placeholder="Search chicken, oats, eggs..." 
                value={logSearch} 
                onChange={e => setLogSearch(e.target.value)} 
                className="w-full py-4 pl-12 pr-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-lg transition-shadow" 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-gray-50/30 dark:bg-gray-950/50 custom-scrollbar">
            {searchFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center"><Search className="w-8 h-8 opacity-50"/></div>
                <p className="font-medium text-lg">No foods found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchFiltered.map(food => {
                  const amt = foodAmounts[food.id] !== undefined ? foodAmounts[food.id] : food.servingSize;
                  const ratio = amt / (food.servingSize || 1);
                  const isWeight = food.servingUnit === 'g' || food.servingUnit === 'ml';
                  return (
                  <div key={food.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-2xl cursor-pointer group transition-all shadow-sm hover:shadow-md" onClick={() => handleAddFoodToMeal(food, searchModal.mealSection, searchModal.targetDate, amt)}>
                    <div className="mb-3 sm:mb-0 w-full sm:w-auto flex-1 pr-4">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{food.name}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                          <input 
                            type="number" min="0.1" step={isWeight ? "10" : "0.5"}
                            value={amt} 
                            onChange={e => setFoodAmounts({...foodAmounts, [food.id]: Number(e.target.value)})} 
                            className="w-16 p-1.5 bg-transparent font-black text-center text-sm outline-none text-gray-900 dark:text-white"
                          />
                          <span className="text-xs font-bold text-gray-500 uppercase pr-3">{food.servingUnit}</span>
                        </div>
                        <span className="font-black text-gray-700 dark:text-gray-300">{Math.round(food.calories * ratio)} kcal</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0">
                      <div className="flex gap-2">
                         <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-100 dark:border-red-900/50">{Math.round(food.protein * ratio)}g P</span>
                         <span className="px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg text-xs font-bold border border-yellow-100 dark:border-yellow-900/50">{Math.round(food.carbs * ratio)}g C</span>
                         <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50">{Math.round(food.fat * ratio)}g F</span>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm flex-shrink-0"><Plus className="w-5 h-5"/></button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FAB = () => {
    return (
      <div className="fixed bottom-8 right-8 z-[90] flex flex-col items-end">
        {fabOpen && (
          <div className="flex flex-col gap-3 mb-4 animate-fade-in items-end pr-2">
             <button onClick={() => { setFabOpen(false); showToast('Quick Meal templates coming soon', 'info'); }} className="flex items-center gap-3 group">
                <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Quick Meal</span>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-yellow-500 hover:scale-110 transition-transform"><Zap className="w-5 h-5"/></div>
             </button>
             <button onClick={() => { setFabOpen(false); showToast('Recipe Builder coming soon', 'info'); }} className="flex items-center gap-3 group">
                <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Create Recipe</span>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-orange-500 hover:scale-110 transition-transform"><ChefHat className="w-5 h-5"/></div>
             </button>
             <button onClick={() => { setFabOpen(false); showToast('Supplement view opening...', 'info'); }} className="flex items-center gap-3 group">
                <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Add Supplement</span>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-purple-500 hover:scale-110 transition-transform"><Pill className="w-5 h-5"/></div>
             </button>
             <button onClick={() => { setFabOpen(false); addWater(250); }} className="flex items-center gap-3 group">
                <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Add Water</span>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-blue-500 hover:scale-110 transition-transform"><Droplets className="w-5 h-5"/></div>
             </button>
             <button onClick={() => { setFabOpen(false); showToast('Camera Scanner opening...', 'info'); }} className="flex items-center gap-3 group">
                <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Scan Food</span>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-emerald-500 hover:scale-110 transition-transform"><Camera className="w-5 h-5"/></div>
             </button>
             <button onClick={() => { setFabOpen(false); setSearchModal({ isOpen: true, mealSection: 'snacks', targetDate: selectedDate, isRecipeMode: false }); }} className="flex items-center gap-3 group">
                <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Add Food</span>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-red-500 hover:scale-110 transition-transform"><Search className="w-5 h-5"/></div>
             </button>
          </div>
        )}
        <button onClick={() => setFabOpen(!fabOpen)} className={`w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center transition-all duration-300 ${fabOpen ? 'rotate-45 shadow-none' : 'hover:scale-110'}`}>
           <Plus className="w-8 h-8"/>
        </button>
      </div>
    );
  };

  return (
    <div className="w-full relative min-h-screen bg-gray-50 dark:bg-gray-950 font-sans selection:bg-emerald-500/30">
      {!shoppingMode && TopBar()}
      {!shoppingMode && NavigationTabs()}
      {SettingsModal()}
      
      {activeView === 'home' && HomeView()}
      {activeView === 'water' && <WaterView user={user} waterLogs={waterLogs} setWaterLogs={setWaterLogs} macroGoals={macroGoals} db={db} appId={appId} selectedDate={selectedDate} showToast={showToast} awardXP={awardXP} />}
      {activeView === 'supplements' && <SupplementsView user={user} supplements={supplements} setSupplements={setSupplements} suppLogs={suppLogs} setSuppLogs={setSuppLogs} db={db} appId={appId} selectedDate={selectedDate} showToast={showToast} awardXP={awardXP} />}
      {activeView === 'targets' && <NutritionTargetsView user={user} db={db} appId={appId} macroGoals={macroGoals} dietProfile={dietProfile} showToast={showToast} onSave={setMacroGoals} />}
      {activeView === 'gamification' && <GamificationView user={user} nutritionXP={nutritionXP} activeChallenge={activeChallenge} challengeHistory={challengeHistory} completeActiveChallenge={completeActiveChallenge} db={db} appId={appId} showToast={showToast} />}
      {activeView === 'transformation' && <TransformationView user={user} dietProfile={dietProfile} bodyProgress={bodyProgress} dailyLogs={dailyLogs} waterLogs={waterLogs} macroGoals={macroGoals} gymLogs={gymLogs} recoveryLogs={recoveryLogs} foodLibrary={foodLibrary} db={db} appId={appId} showToast={showToast} selectedDate={selectedDate} />}
      {activeView === 'library' && LibraryView()}
      {activeView === 'grocery' && GroceryView()}
      
      {SearchModalView()}
      {!shoppingMode && FAB()}

      {isCreatingFood && <CreateFoodModal onClose={() => setIsCreatingFood(false)} onSave={handleCreateFood} showToast={showToast} />}

      {editingLibraryFood && <EditFoodModal food={editingLibraryFood} onClose={() => setEditingLibraryFood(null)} onSave={handleSaveFood} showToast={showToast} />}
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[110] px-6 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-2xl animate-fade-in font-bold text-sm flex items-center gap-3 border border-gray-800 dark:border-gray-200">
          <CheckCircle className="w-5 h-5 text-emerald-500"/> {toast.msg}
        </div>
      )}
    </div>
  );
}
