// ============================================================
// src/services/firebase.js
//
// Responsibilities:
//   1. Initialize Firebase app, Auth, and Firestore
//   2. Resolve appId from canvas environment or fallback
//   3. Export Firestore collection/document path builders
//      so every other service has one single source of truth
//      for all Firestore paths.
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, doc, connectFirestoreEmulator } from 'firebase/firestore';

// -----------------------------------------------------------
// Firebase Config
// Supports both the canvas-injected __firebase_config global
// and a local .env fallback for development.
// -----------------------------------------------------------
const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  return '';
};

let firebaseConfig =
  typeof __firebase_config !== 'undefined'
    ? (typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config)
    : {
        apiKey:            getEnvVar('VITE_FIREBASE_API_KEY'),
        authDomain:        getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId:         getEnvVar('VITE_FIREBASE_PROJECT_ID'),
        storageBucket:     getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId:             getEnvVar('VITE_FIREBASE_APP_ID'),
      };

const missingConfig = !firebaseConfig || !firebaseConfig.apiKey;

if (missingConfig) {
  console.warn("Firebase Config is missing. App will run in offline/localStorage mode.");
}

// -----------------------------------------------------------
// App ID
// Used as the top-level namespace in all Firestore paths.
// -----------------------------------------------------------
export const appId =
  typeof __app_id !== 'undefined' ? __app_id : 'life-planner-v1';

// -----------------------------------------------------------
// Core Firebase Instances
// -----------------------------------------------------------
export let auth = null;
export let db   = null;

try {
  if (!missingConfig) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db   = getFirestore(app);
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// -----------------------------------------------------------
// Firestore Path Builders
//
// Single source of truth for all collection/document paths.
// If the Firestore schema ever changes, only update here.
//
// Schema:
//   artifacts/{appId}/users/{userId}/tasks         ← collection
//   artifacts/{appId}/users/{userId}/profile/data  ← document
// -----------------------------------------------------------

/**
 * Returns the Firestore CollectionReference for a user's tasks.
 * @param {string} userId - Firebase Auth UID
 * @returns {import('firebase/firestore').CollectionReference}
 */
export const getTasksRef = (userId) =>
  collection(db, 'artifacts', appId, 'users', userId, 'tasks');

/**
 * Returns the Firestore DocumentReference for a single task.
 * @param {string} userId - Firebase Auth UID
 * @param {string} taskId - Task document ID
 * @returns {import('firebase/firestore').DocumentReference}
 */
export const getTaskDocRef = (userId, taskId) =>
  doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);

/**
 * Returns the Firestore DocumentReference for the user's profile.
 * @param {string} userId - Firebase Auth UID
 * @returns {import('firebase/firestore').DocumentReference}
 */
export const getProfileRef = (userId) =>
  doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
