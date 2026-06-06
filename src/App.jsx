import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';

// Auth Wrapper component to protect routes
const AuthWrapper = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-indigo-200 font-medium animate-pulse">Loading Life Planner...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Wrapper (redirects to home if already logged in)
const PublicRoute = ({ children, user, loading }) => {
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not found, running local auth mock");
      const handleMockAuth = () => {
        setUser(JSON.parse(localStorage.getItem('mock_user') || 'null'));
      };
      handleMockAuth(); // Initial state
      window.addEventListener('mock-auth-changed', handleMockAuth);
      setLoading(false);
      return () => window.removeEventListener('mock-auth-changed', handleMockAuth);
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute user={user} loading={loading}>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute user={user} loading={loading}>
              <Signup />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute user={user} loading={loading}>
              <ForgotPassword />
            </PublicRoute>
          } 
        />
        <Route 
          path="/*" 
          element={
            <AuthWrapper user={user} loading={loading}>
              <Dashboard user={user} />
            </AuthWrapper>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
