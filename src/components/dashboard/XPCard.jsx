// src/components/dashboard/XPCard.jsx

import React from 'react';
import { Trophy } from 'lucide-react';

const XPCard = ({ level, xp, nextLevelXp, xpProgressPercentage }) => (
  <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
      <Trophy className="w-32 h-32" />
    </div>
    <div className="relative z-10 flex justify-between items-end mb-2">
      <div>
        <p className="text-indigo-100 font-medium text-sm mb-1">Global Level</p>
        <h3 className="text-3xl font-bold">Level {level}</h3>
      </div>
      <div className="text-right">
        <span className="text-2xl font-bold">{xp}</span>
        <span className="text-indigo-200 text-sm"> / {nextLevelXp} XP</span>
      </div>
    </div>
    <div className="w-full bg-black/20 rounded-full h-2 mt-2">
      <div
        className="bg-white h-2 rounded-full transition-all duration-500"
        style={{ width: `${xpProgressPercentage}%` }}
      ></div>
    </div>
  </div>
);

export default XPCard;
