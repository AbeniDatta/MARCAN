'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Buyer form state
  const [buyerData, setBuyerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    city: '',
    province: '',
  });

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!buyerData.firstName || !buyerData.lastName || !buyerData.email || !buyerData.password) {
      setError('Please fill in all required fields.');
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
        phone: buyerData.phone,
        city: buyerData.city,
        province: buyerData.province,
        role: 'buy',
      };

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
      <Header breadcrumb="Sign Up" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex items-center justify-center py-10">
          <div className="glass-card p-10 rounded-3xl w-full max-w-4xl relative overflow-visible transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

            {/* Error Message */}
            {error && (
              <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* BUYER FORM */}
            <div>
              <div className="text-center mb-10">
                <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Buyer Account</h2>
                <p className="text-xs text-slate-500">Create your procurement profile.</p>
              </div>

              <form onSubmit={handleBuyerSubmit} className="space-y-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">First Name</label>
                    <input
                      type="text"
                      placeholder="Jane"
                      value={buyerData.firstName}
                      onChange={(e) => setBuyerData({ ...buyerData, firstName: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
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
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
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
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Password</label>
                    <input
                      type="password"
                      placeholder="Create Password"
                      value={buyerData.password}
                      onChange={(e) => setBuyerData({ ...buyerData, password: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Repeat Password"
                      value={buyerData.confirmPassword}
                      onChange={(e) => setBuyerData({ ...buyerData, confirmPassword: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <label className="text-[10px] font-bold text-marcan-red uppercase mb-4 block tracking-widest">Profile Details</label>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company (Optional)</label>
                      <input
                        type="text"
                        placeholder="Organization you represent"
                        value={buyerData.company}
                        onChange={(e) => setBuyerData({ ...buyerData, company: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={buyerData.phone}
                        onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Location</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={buyerData.city}
                          onChange={(e) => setBuyerData({ ...buyerData, city: e.target.value })}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600"
                        />
                        <select
                          value={buyerData.province}
                          onChange={(e) => setBuyerData({ ...buyerData, province: e.target.value })}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-3 text-sm font-semibold text-slate-400 focus:border-marcan-red focus:shadow-neon outline-none"
                        >
                          <option value="" disabled>
                            Prov.
                          </option>
                          <option value="ON">ON</option>
                          <option value="QC">QC</option>
                          <option value="BC">BC</option>
                          <option value="AB">AB</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-marcan-red text-white py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i> Creating Account...
                    </span>
                  ) : (
                    'Create Buyer Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
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
