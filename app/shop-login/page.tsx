'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchAccountRoleFromApi } from '@/lib/accountRole';

export default function ShopLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const { login } = useAuth();
    const { t } = useI18n();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Derive names from displayName/email (matches app/login behavior)
            let firstName = 'User';
            let lastName = 'User';

            if (firebaseUser.displayName) {
                const nameParts = firebaseUser.displayName.split(' ');
                firstName = nameParts[0] || 'User';
                lastName = nameParts.slice(1).join(' ') || 'User';
            } else {
                const emailParts = email.split('@')[0].split('.');
                firstName = emailParts[0] || 'User';
                lastName = emailParts[1] || 'User';
            }

            const storedUserData =
                typeof window !== 'undefined' ? localStorage.getItem('marcan_user') : null;

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
            router.push('/shop');
        } catch (err: any) {
            let errorMessage = t('storefrontLogin.errors.generic');

            if (err.code === 'auth/invalid-credential') {
                errorMessage = t('storefrontLogin.errors.invalidCredential');
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = t('storefrontLogin.errors.userNotFound');
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = t('storefrontLogin.errors.wrongPassword');
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = t('storefrontLogin.errors.invalidEmail');
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = t('storefrontLogin.errors.userDisabled');
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = t('storefrontLogin.errors.tooManyRequests');
            } else if (err.code === 'auth/network-request-failed') {
                errorMessage = t('storefrontLogin.errors.networkRequestFailed');
            } else if (err.message) {
                errorMessage = err.message;
            }

            console.error('Firebase shop login error:', err.code, err.message);
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
            alert(t('storefrontLogin.forgotPasswordSentAlert'));
            setShowForgotPassword(false);
            setResetEmail('');
        } catch (err: any) {
            let errorMessage = t('storefrontLogin.forgotPasswordErrors.generic');

            if (err.code === 'auth/user-not-found') {
                errorMessage = t('storefrontLogin.forgotPasswordErrors.userNotFound');
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = t('storefrontLogin.forgotPasswordErrors.invalidEmail');
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
            <Header breadcrumb="Industrial Storefront Login" />

            <div className="flex-1 overflow-y-auto page-scroll relative">
                <div className="flex items-center justify-center h-full min-h-[500px]">
                    <div className="glass-card p-10 rounded-3xl w-full max-w-md relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.5),_0_0_20px_rgba(249,115,22,0.3)]"
                        />

                        <div className="text-center mb-8">
                            <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">
                                {t('storefrontLogin.title')}
                            </h2>

                        </div>

                        {error && (
                            <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest ml-1">
                                    {t('storefrontLogin.credentialsLabel')}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('storefrontLogin.emailPlaceholder')}
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500 mb-4"
                                />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('storefrontLogin.passwordPlaceholder')}
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
                                    {t('storefrontLogin.rememberMe')}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="hover:text-white transition-colors"
                                >
                                    {t('storefrontLogin.forgotPassword')}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span>
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> {t('storefrontLogin.loggingIn')}
                                    </span>
                                ) : (
                                    t('storefrontLogin.loginButton')
                                )}
                            </button>
                        </form>

                        {showForgotPassword && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="glass-card p-8 rounded-2xl w-full max-w-md relative">
                                    <button
                                        onClick={() => setShowForgotPassword(false)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                                        type="button"
                                    >
                                        <i className="fa-solid fa-times text-xl"></i>
                                    </button>
                                    <h3 className="font-heading text-xl font-bold text-white mb-4">{t('storefrontLogin.resetPasswordTitle')}</h3>
                                    <p className="text-sm text-slate-400 mb-6">
                                        {t('storefrontLogin.resetPasswordBody')}
                                    </p>

                                    <form onSubmit={handleForgotPassword} className="space-y-4">
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder={t('storefrontLogin.emailAddressPlaceholder')}
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                                        />
                                        <button
                                            type="submit"
                                            className="w-full bg-marcan-red text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon transition-all"
                                            disabled={isLoading}
                                        >
                                            {t('storefrontLogin.sendResetLink')}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="text-center mt-6 text-xs text-slate-500">
                            {t('storefrontLogin.createProfilePromptPrefix')}{' '}
                            <Link
                                href="/become-supplier?step=0"
                                className="text-orange-400 font-bold hover:text-orange-300"
                            >
                                {t('storefrontLogin.createProfilePromptLink')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

