// src/services/profileService.js

import { onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { getProfileRef, db } from './firebase';

/**
 * Default profile structure — exact v1.9 schema.
 */
export const DEFAULT_PROFILE = {
  xp:                0,
  level:             1,
  currentStreak:     0,
  bestStreak:        0,
  lastCompletedDate: null,
  maxHours:          10,
  claimedQuests:     [],
  streakDates:       [],
  challengeHistory:  {},
};

// -----------------------------------------------------------
// LocalStorage helpers for offline support
// -----------------------------------------------------------
const getLocalProfile = (userId) => {
  try {
    const data = localStorage.getItem(`profile_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

const saveLocalProfile = (userId, profile) => {
  localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
};

const notifyProfileUpdate = () => {
  window.dispatchEvent(new Event('local-profile-updated'));
};

/**
 * Subscribes to real-time updates of the user's profile document.
 * Falls back to LocalStorage if Firebase is offline.
 * @param {string} userId
 * @param {Function} callback - receives profile object
 * @returns {Function} unsubscribe
 */
export const subscribeToProfile = (userId, callback) => {
  if (!db) {
    let profile = getLocalProfile(userId);
    if (!profile) {
      profile = DEFAULT_PROFILE;
      saveLocalProfile(userId, profile);
    }
    callback(profile);

    const handleLocalUpdate = () => {
      callback(getLocalProfile(userId) || DEFAULT_PROFILE);
    };
    window.addEventListener('local-profile-updated', handleLocalUpdate);
    return () => window.removeEventListener('local-profile-updated', handleLocalUpdate);
  }

  return onSnapshot(getProfileRef(userId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      createDefaultProfile(userId);
    }
  });
};

/**
 * Creates the default profile document for a new user.
 * Falls back to LocalStorage if Firebase is offline.
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const createDefaultProfile = async (userId) => {
  if (!db) {
    saveLocalProfile(userId, DEFAULT_PROFILE);
    notifyProfileUpdate();
    return;
  }
  return setDoc(getProfileRef(userId), DEFAULT_PROFILE);
};

/**
 * Updates one or more fields on the profile document.
 * Falls back to LocalStorage if Firebase is offline.
 * @param {string} userId
 * @param {Object} updates - key/value pairs to merge
 * @returns {Promise<void>}
 */
export const updateProfile = async (userId, updates) => {
  if (!db) {
    const profile = getLocalProfile(userId) || { ...DEFAULT_PROFILE };
    const updated = { ...profile, ...updates };
    saveLocalProfile(userId, updated);
    notifyProfileUpdate();
    return;
  }
  return updateDoc(getProfileRef(userId), updates);
};

/**
 * Updates the XP field on the profile document.
 * @param {string} userId
 * @param {number} newXp
 * @returns {Promise<void>}
 */
export const updateXP = async (userId, newXp) => {
  return updateProfile(userId, { xp: newXp });
};

/**
 * Updates the level field on the profile document.
 * @param {string} userId
 * @param {number} newLevel
 * @returns {Promise<void>}
 */
export const updateLevel = async (userId, newLevel) => {
  return updateProfile(userId, { level: newLevel });
};

/**
 * Updates all streak-related fields on the profile document.
 * @param {string} userId
 * @param {number} currentStreak
 * @param {number} bestStreak
 * @param {string} lastCompletedDate - 'YYYY-MM-DD'
 * @returns {Promise<void>}
 */
export const updateStreak = async (userId, currentStreak, bestStreak, lastCompletedDate) => {
  return updateProfile(userId, {
    currentStreak,
    bestStreak,
    lastCompletedDate,
  });
};
