'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useI18n } from '@/contexts/I18nContext';
import { fetchAccountRoleFromApi } from '@/lib/accountRole';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const { t, translateText } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const deriveNameFromEmail = (emailValue: string) => {
        const safeEmail = (emailValue || '').trim();
        if (!safeEmail) return { firstName: 'There', lastName: '' };
        const local = safeEmail.split('@')[0] || '';
        const token = (local.split(/[._-]+/).find(Boolean) || local).trim();
        const firstName = token ? token.charAt(0).toUpperCase() + token.slice(1) : 'There';
        return { firstName, lastName: '' };
      };

      let firstName = 'There';
      let lastName = '';

      if (firebaseUser.displayName) {
        const nameParts = firebaseUser.displayName.split(/\s+/).filter(Boolean);
        firstName = nameParts[0] || firstName;
        lastName = nameParts.slice(1).join(' ') || lastName;
      } else {
        const derived = deriveNameFromEmail(email);
        firstName = derived.firstName;
        lastName = derived.lastName;
      }

      const storedUserData = typeof window !== 'undefined' ? localStorage.getItem('marcan_user') : null;
      let userData: any = {
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        email: firebaseUser.email || email,
      };

      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          userData = { ...parsed, ...userData };
        } catch {
          // ignore
        }
      }

      const apiRole = await fetchAccountRoleFromApi(userData.email);
      if (apiRole) {
        userData = { ...userData, role: apiRole };
      }

      login(userData);

      router.push('/');
    } catch (err: any) {
      let errorMessage = t('login.errGeneric');

      if (err.code === 'auth/invalid-credential') {
        errorMessage = t('login.errInvalidCredential');
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = t('login.errUserNotFound');
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = t('login.errWrongPassword');
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t('login.errInvalidEmail');
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = t('login.errUserDisabled');
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = t('login.errTooManyRequests');
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = t('login.errNetwork');
      } else if (err.message) {
        errorMessage = err.message;
      }

      console.error('Firebase login error:', err.code, err.message);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccessMessage(t('login.resetSent'));
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      let errorMessage = t('login.errResetFailed');

      if (err.code === 'auth/user-not-found') {
        errorMessage = t('login.errUserNotFound');
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t('login.errInvalidEmail');
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
      <Header breadcrumb={translateText('Login')} />

      <div className="flex-1 overflow-y-auto page-scroll relative">
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <div className="glass-card p-6 sm:p-10 rounded-3xl w-full max-w-md relative overflow-hidden mx-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">{t('login.title')}</h2>
              <p className="text-xs text-slate-500">{t('login.accessHint')}</p>
            </div>

            {error && (
              <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="text-xs font-semibold mb-4 text-center text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest ml-1">{t('login.credentialsLabel')}</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500 mb-4"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pr-12 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-4 text-slate-400"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                  />
                  {t('login.rememberMe')}
                </label>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="hover:text-white transition-colors">
                  {t('login.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-marcan-red text-white py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> {t('login.signingIn')}
                  </span>
                ) : (
                  t('login.loginButton')
                )}
              </button>
            </form>

            {showForgotPassword && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02030a]/85">
                <div className="p-8 rounded-2xl w-full max-w-md relative border border-slate-700 bg-[#0b1220] shadow-[0_20px_80px_rgba(0,0,0,0.65)]">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                  >
                    <i className="fa-solid fa-times text-xl"></i>
                  </button>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">{t('login.resetTitle')}</h3>
                  <p className="text-sm text-slate-300 mb-6 leading-relaxed">{t('login.resetBody')}</p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder={t('login.emailLabel')}
                      required
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-marcan-red text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span>
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i> {t('login.sendResetLink')}
                        </span>
                      ) : (
                        t('login.sendResetLink')
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                {t('login.noAccount')}{' '}
                <Link href="/signup" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                  {t('login.signUpLink')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
