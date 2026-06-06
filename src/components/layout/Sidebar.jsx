// src/components/layout/Sidebar.jsx

import { Activity, Dumbbell, Coffee, Target, Moon, Sun, Trash2, LogOut, User } from 'lucide-react';
import { logoutUser } from '../../services/authService';

const NAV_ITEMS = [
  { id: 'tasks',  label: 'Dashboard & Tasks', icon: Activity },
  { id: 'gym',    label: 'Gym Planner',       icon: Dumbbell },
  { id: 'meals',  label: 'Meal Planner',       icon: Coffee },
];

const Sidebar = ({ user, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, onResetData }) => (
  <div
    className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:relative lg:translate-x-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col`}
  >
    <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Life Planner</h1>
      </div>
      <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md">
        v1.9
      </span>
    </div>

    <div className="flex-1 overflow-y-auto py-4 flex flex-col justify-between">
      <nav className="space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 mt-8">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 mb-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Dev Tools</p>
          <button 
            onClick={onResetData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-semibold rounded-lg transition-colors duration-200 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Reset App Data
          </button>
        </div>

        {/* User Profile Menu */}
        {user && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 p-3 mb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                  {user.email || 'No email'}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await logoutUser();
                } catch (e) {
                  console.error('Failed to log out', e);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200/50 dark:bg-gray-900/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors duration-200 text-sm border border-gray-300 dark:border-gray-700"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default Sidebar;
