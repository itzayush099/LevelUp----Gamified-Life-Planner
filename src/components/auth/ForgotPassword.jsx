import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-12 hover:rotate-0 transition-transform duration-500">
            <Target className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-black text-white tracking-tight">
          Reset password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400 font-medium">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-3xl sm:px-10 border border-gray-800 relative overflow-hidden">
          
          <div className="absolute -top-32 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-green-200">
                  Password reset email sent! Check your inbox.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-300">
                Email address
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-medium"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                   <span className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Sending...
                   </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
