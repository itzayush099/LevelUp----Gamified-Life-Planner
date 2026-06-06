// src/components/layout/Header.jsx

// ============================================================
// Mobile header bar — exact v1.9 layout.
// Visible on small screens only (lg:hidden).
// ============================================================

import React from 'react';
import { Target, Menu, XCircle } from 'lucide-react';

const Header = ({ isSidebarOpen, setIsSidebarOpen }) => (
  <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-40">
    <div className="flex items-center gap-2 font-bold text-lg">
      <Target className="w-5 h-5 text-indigo-600" /> Life Planner
    </div>
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
    >
      {isSidebarOpen ? <XCircle className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5" />}
    </button>
  </div>
);

export default Header;
