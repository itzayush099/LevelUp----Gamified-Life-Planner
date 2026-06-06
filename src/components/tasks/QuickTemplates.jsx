// src/components/tasks/QuickTemplates.jsx

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { QUICK_ADDS } from '../../constants/quickTemplates';
import { STUDY_OPTIONS } from '../../constants/studyTemplates';

const QuickTemplates = ({ onQuickAdd, onStudyAdd, showStudyMenu, setShowStudyMenu }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
      Quick Templates
    </h3>
    <div className="flex flex-col gap-2">
      <div className="relative">
        <button
          onClick={() => setShowStudyMenu(!showStudyMenu)}
          className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-400 transition-all"
        >
          <span className="flex items-center gap-1.5">📚 Study Session</span>
          <ChevronDown
            className={`w-4 h-4 transform transition-transform ${showStudyMenu ? 'rotate-180' : ''}`}
          />
        </button>
        {showStudyMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
            {STUDY_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                onClick={() => onStudyAdd(opt)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                {opt.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {QUICK_ADDS.map((template) => (
        <button
          key={template.name}
          onClick={() => onQuickAdd(template)}
          className="w-full flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-all"
        >
          <span>{template.icon}</span> {template.name}
        </button>
      ))}
    </div>
  </div>
);

export default QuickTemplates;
