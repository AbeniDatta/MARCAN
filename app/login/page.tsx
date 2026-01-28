'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user's display name or extract from email
      let firstName = 'User';
      let lastName = 'User';
      
      if (firebaseUser.displayName) {
        const nameParts = firebaseUser.displayName.split(' ');
        firstName = nameParts[0] || 'User';
        lastName = nameParts.slice(1).join(' ') || 'User';
      } else {
        // Extract from email as fallback
        const emailParts = email.split('@')[0].split('.');
        firstName = emailParts[0] || 'User';
        lastName = emailParts[1] || 'User';
      }

      // Get additional user data from localStorage if available (from previous signup)
      const storedUserData = typeof window !== 'undefined' ? localStorage.getItem('marcan_user') : null;
      let userData: any = {
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        email: firebaseUser.email || email,
      };

      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          // Merge stored data with Firebase user data
          userData = { ...parsed, ...userData };
        } catch (e) {
          // If parsing fails, use the basic data
        }
      }

      // Update local auth state
      login(userData);
      
      router.push('/');
    } catch (err: any) {
      // Handle Firebase Auth errors
      let errorMessage = 'An error occurred during login.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert('Password reset email sent! Please check your inbox.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Login" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <div className="glass-card p-10 rounded-3xl w-full max-w-md relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500">Access your Marcan Dashboard</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest ml-1">
                  Credentials
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="WORK EMAIL"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500 mb-4"
                />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PASSWORD"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-marcan-red text-white py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="glass-card p-8 rounded-2xl w-full max-w-md relative">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                  >
                    <i className="fa-solid fa-times text-xl"></i>
                  </button>
                  <h3 className="font-heading text-xl font-bold text-white mb-4">Reset Password</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-marcan-red text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon transition-all"
                    >
                      Send Reset Link
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <Link href="/signup" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
