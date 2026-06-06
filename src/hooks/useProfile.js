// src/hooks/useProfile.js

import { useState, useEffect } from 'react';
import {
  subscribeToProfile,
  updateProfile,
  updateXP,
  updateLevel,
  updateStreak,
  DEFAULT_PROFILE,
} from '../services/profileService';

/**
 * Profile state hook — subscribes to Firestore profile and
 * exposes update functions for XP, level, streak, maxHours.
 *
 * @param {Object|null} user - Firebase Auth user
 * @returns {{
 *   profile:           Object,
 *   updateMaxHours:    (val: number) => Promise<void>,
 *   updateProfileData: (updates: Object) => Promise<void>,
 *   updateProfileXP:   (newXp: number) => Promise<void>,
 *   updateProfileLevel:(newLevel: number) => Promise<void>,
 *   updateProfileStreak:(currentStreak: number, bestStreak: number, lastCompletedDate: string) => Promise<void>,
 * }}
 */
export const useProfile = (user) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProfile(user.uid, (data) => {
      setProfile(data);
    });
    return () => unsubscribe();
  }, [user]);

  const updateMaxHours = async (val) => {
    if (!user) return;
    await updateProfile(user.uid, { maxHours: Number(val) });
  };

  const updateProfileData = async (updates) => {
    if (!user) return;
    await updateProfile(user.uid, updates);
  };

  const updateProfileXP = async (newXp) => {
    if (!user) return;
    await updateXP(user.uid, newXp);
  };

  const updateProfileLevel = async (newLevel) => {
    if (!user) return;
    await updateLevel(user.uid, newLevel);
  };

  const updateProfileStreak = async (currentStreak, bestStreak, lastCompletedDate) => {
    if (!user) return;
    await updateStreak(user.uid, currentStreak, bestStreak, lastCompletedDate);
  };

  return {
    profile,
    updateMaxHours,
    updateProfileData,
    updateProfileXP,
    updateProfileLevel,
    updateProfileStreak,
  };
};
