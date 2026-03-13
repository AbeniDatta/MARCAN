'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function BuyerSignupPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const initialEmail = searchParams.get('email') || '';

    const [buyerData, setBuyerData] = useState({
        firstName: '',
        lastName: '',
        email: initialEmail,
        password: '',
        confirmPassword: '',
        company: '',
        jobTitle: '',
    });

    const handleBuyerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!buyerData.firstName || !buyerData.lastName || !buyerData.email || !buyerData.password) {
            setError('Please fill in all required fields.');
            return;
        }

        // If company name is provided, job title is required
        if (buyerData.company.trim() && !buyerData.jobTitle.trim()) {
            setError('Please enter your role in the company.');
            return;
        }

        if (buyerData.password !== buyerData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (buyerData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, buyerData.email, buyerData.password);
            const firebaseUser = userCredential.user;

            await updateProfile(firebaseUser, {
                displayName: `${buyerData.firstName} ${buyerData.lastName}`,
            });

            const userData = {
                firstName: buyerData.firstName,
                lastName: buyerData.lastName,
                email: buyerData.email,
                companyName: buyerData.company,
                jobTitle: buyerData.jobTitle,
                role: 'buyer',
            };

            // Save to database
            try {
                const saveResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: buyerData.email,
                        firstName: buyerData.firstName,
                        lastName: buyerData.lastName,
                        email: buyerData.email,
                        companyName: buyerData.company || `${buyerData.firstName} ${buyerData.lastName}`.trim(),
                        jobTitle: buyerData.jobTitle || null,
                    }),
                });

                if (!saveResponse.ok) {
                    const errorData = await saveResponse.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('Failed to save user data to database:', errorData);
                    // Don't throw - allow user to continue, but log the error
                    // The profile can be created/updated later from My Account page
                } else {
                    const result = await saveResponse.json();
                    console.log('Profile created successfully:', result);
                }
            } catch (dbError: any) {
                console.error('Error saving to database:', dbError);
                // Don't throw - allow user to continue, but log the error
                // The profile can be created/updated later from My Account page
            }

            login(userData);
            router.push('/');
        } catch (err: any) {
            let errorMessage = 'An error occurred during signup.';
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Please login instead.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
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
            <Header breadcrumb="Become a Buyer" />

            <div className="flex-1 overflow-hidden p-3 relative">
                <div className="flex items-center justify-center py-2">
                    <div className="glass-card p-5 rounded-3xl w-full max-w-[52rem] relative overflow-visible transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                                {error}
                            </div>
                        )}

                        <div>
                            <div className="relative mb-3">
                                <button
                                    type="button"
                                    onClick={() => router.push('/signup')}
                                    className="absolute left-0 top-0 text-xs text-slate-500 hover:text-white font-bold uppercase tracking-widest flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-arrow-left"></i>
                                    Change Option
                                </button>
                                <div className="text-center mt-4">
                                    <h2 className="font-heading text-2xl md:text-2xl font-black text-white uppercase tracking-widest mb-2">
                                        Create Your Buyer Account
                                    </h2>
                                    <p className="text-xs md:text-xs text-slate-500">
                                        Create your procurement profile to start sourcing manufacturers.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleBuyerSubmit} className="space-y-4 max-w-2xl mx-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="Jane"
                                            value={buyerData.firstName}
                                            onChange={(e) => setBuyerData({ ...buyerData, firstName: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            value={buyerData.lastName}
                                            onChange={(e) => setBuyerData({ ...buyerData, lastName: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="jane.doe@example.com"
                                        value={buyerData.email}
                                        onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Password</label>
                                        <div className="relative">
                                        <input
                                                type={showPassword ? "text" : "password"}
                                            placeholder="Create Password"
                                            value={buyerData.password}
                                            onChange={(e) => setBuyerData({ ...buyerData, password: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pr-10 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                            required
                                        />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                            >
                                                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Confirm Password</label>
                                        <div className="relative">
                                        <input
                                                type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            value={buyerData.confirmPassword}
                                            onChange={(e) => setBuyerData({ ...buyerData, confirmPassword: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pr-10 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                            required
                                        />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                            >
                                                <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-1 border-t border-white/5">
                                    <div className="grid grid-cols-2 gap-4 mb-1">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Organization you represent"
                                                value={buyerData.company}
                                                onChange={(e) =>
                                                    setBuyerData({
                                                        ...buyerData,
                                                        company: e.target.value,
                                                        jobTitle: e.target.value.trim() ? buyerData.jobTitle : '',
                                                    })
                                                }
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                            />
                                        </div>
                                        {buyerData.company.trim() && (
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                                                    Role in Company *
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Procurement Manager, Buyer, Director"
                                                    value={buyerData.jobTitle}
                                                    onChange={(e) => setBuyerData({ ...buyerData, jobTitle: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-marcan-red text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span>
                                            <i className="fa-solid fa-spinner fa-spin mr-2"></i> Creating Account...
                                        </span>
                                    ) : (
                                        'Create Your Account'
                                    )}
                                </button>
                            </form>

                            <div className="mt-3 text-center">
                                <p className="text-xs text-slate-500">
                                    Already a member?{' '}
                                    <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                                        Login
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function BuyerSignupPage() {
    return (
        <Suspense
            fallback={
                <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
                    <Header breadcrumb="Become a Buyer" />
                    <div className="flex-1 overflow-hidden p-3 relative">
                        <div className="flex items-center justify-center py-2">
                            <div className="glass-card p-5 rounded-3xl w-full max-w-[52rem] relative overflow-visible">
                                <div className="text-center py-12">
                                    <p className="text-slate-400">Loading...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            }
        >
            <BuyerSignupPageContent />
        </Suspense>
    );
}