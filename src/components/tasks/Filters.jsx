// src/components/tasks/Filters.jsx

import React from 'react';
import { Filter, Search } from 'lucide-react';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Skipped'];

const Filters = ({
  searchQuery,     setSearchQuery,
  filterStatus,    setFilterStatus,
  filterPriority,  setFilterPriority,
  filterCategory,  setFilterCategory,
}) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
      <Filter className="w-4 h-4" /> Filter List
    </h3>
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none">
        <option value="All">All Statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none">
        <option value="All">All Priorities</option>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none col-span-2">
        <option value="All">All Categories</option>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  </div>
);

export default Filters;
