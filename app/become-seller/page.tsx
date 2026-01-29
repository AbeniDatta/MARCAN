'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type WizardStep = 1 | 2;
type View = 'landing' | 'form';

export default function BecomeSellerPage() {
    const router = useRouter();
    const { login, user: currentUser, isAuthenticated, isMounted } = useAuth();
    const [currentView, setCurrentView] = useState<View>('landing');
    const [wizardStep, setWizardStep] = useState<WizardStep>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Seller wizard state
    const [sellerData, setSellerData] = useState({
        // Step 1: Company Profile
        jobTitle: '',
        companyName: '',
        businessNumber: '',
        website: '',
        city: '',
        province: '',
        aboutUs: '',
        // Step 2: Capabilities
        capabilities: [] as string[],
        certifications: [] as string[],
    });

    // Load current user data if authenticated
    useEffect(() => {
        if (isMounted && isAuthenticated && currentUser) {
            setSellerData({
                jobTitle: currentUser.jobTitle || '',
                companyName: currentUser.companyName || '',
                businessNumber: currentUser.businessNumber || '',
                website: currentUser.website || '',
                city: currentUser.city || '',
                province: currentUser.province || '',
                aboutUs: currentUser.aboutUs || '',
                capabilities: currentUser.capabilities || [],
                certifications: currentUser.certifications || [],
            });
        }
    }, [isMounted, isAuthenticated, currentUser]);

    // Redirect if not authenticated
    useEffect(() => {
        if (isMounted && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isMounted, isAuthenticated, router]);

    const nextWizardStep = () => {
        if (wizardStep < 2) {
            setWizardStep((prev) => (prev + 1) as WizardStep);
        }
    };

    const prevWizardStep = () => {
        if (wizardStep > 1) {
            setWizardStep((prev) => (prev - 1) as WizardStep);
        }
    };

    const handleSellerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        setIsLoading(true);

        try {
            // Update user data with seller information (using existing user data for name/email)
            const updatedUserData = {
                ...currentUser!,
                jobTitle: sellerData.jobTitle,
                companyName: sellerData.companyName,
                businessNumber: sellerData.businessNumber,
                website: sellerData.website,
                city: sellerData.city,
                province: sellerData.province,
                aboutUs: sellerData.aboutUs,
                capabilities: sellerData.capabilities,
                certifications: sellerData.certifications,
                role: 'both', // Update role to 'both' since they're now a seller too
            };

            // Update localStorage
            localStorage.setItem('marcan_user', JSON.stringify(updatedUserData));
            window.dispatchEvent(new Event('marcan-auth-change'));

            // Update auth state
            login(updatedUserData);

            // Redirect to home page
            router.push('/');
        } catch (err: any) {
            let errorMessage = 'An error occurred while updating your profile.';
            if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCapability = (cap: string) => {
        setSellerData((prev) => ({
            ...prev,
            capabilities: prev.capabilities.includes(cap)
                ? prev.capabilities.filter((c) => c !== cap)
                : [...prev.capabilities, cap],
        }));
    };

    const toggleCertification = (cert: string) => {
        setSellerData((prev) => ({
            ...prev,
            certifications: prev.certifications.includes(cert)
                ? prev.certifications.filter((c) => c !== cert)
                : [...prev.certifications, cert],
        }));
    };

    if (!isMounted) {
        return null; // Prevent flash of content before auth check
    }

    return (
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
            <Header breadcrumb="Become a Seller" />

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

                        {/* LANDING PAGE */}
                        {currentView === 'landing' && (
                            <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
                                <div className="glass-card p-12 rounded-3xl w-full max-w-3xl text-center relative overflow-hidden flex flex-col items-center justify-center border border-white/10">
                                    {/* Decor */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-marcan-red/10 rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                    <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-marcan-red to-red-900 shadow-neon text-white text-4xl animate-pulse-slow">
                                        <i className="fa-solid fa-handshake"></i>
                                    </div>

                                    <h2 className="font-heading text-4xl md:text-5xl font-black text-white uppercase tracking-widest mb-6 leading-tight">
                                        Welcome to the <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-marcan-red to-orange-500 text-glow">MARCAN Network</span>
                                    </h2>

                                    <p className="text-xl text-slate-300 leading-relaxed mb-10 max-w-xl mx-auto font-light">
                                        We're glad to have you join our network! <br />
                                        Marcan connects you with the partners you need to grow your business and strengthen the Canadian supply chain.
                                    </p>

                                    <button
                                        onClick={() => setCurrentView('form')}
                                        className="bg-marcan-red text-white px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-3"
                                    >
                                        Continue to Registration <i className="fa-solid fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SELLER WIZARD */}
                        {currentView === 'form' && (
                            <div>
                                <div className="flex justify-between items-center mb-8">
                                    <Link
                                        href="/"
                                        className="flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                                    >
                                        <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to Home
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1 w-8 rounded-full transition-all ${wizardStep >= 1 ? 'bg-marcan-red' : 'bg-white/10'}`}></div>
                                        <div className={`h-1 w-8 rounded-full transition-all ${wizardStep >= 2 ? 'bg-marcan-red' : 'bg-white/10'}`}></div>
                                    </div>
                                </div>

                                <form onSubmit={handleSellerSubmit} className="max-w-2xl mx-auto">
                                    {/* Slide 1: Company Profile */}
                                    <div
                                        className={`transition-all duration-300 ${wizardStep === 1 ? 'opacity-100 translate-x-0 block' : 'opacity-0 pointer-events-none translate-x-10 hidden'
                                            }`}
                                    >
                                        <div className="text-center mb-8">
                                            <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Company Profile</h2>
                                            <p className="text-xs text-slate-500">Step 1 of 2: Business Details</p>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Your Job Title</label>
                                                <input
                                                    type="text"
                                                    placeholder="Procurement Manager"
                                                    value={sellerData.jobTitle}
                                                    onChange={(e) => setSellerData({ ...sellerData, jobTitle: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Legal Company Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="NorthYork Precision Ltd."
                                                    value={sellerData.companyName}
                                                    onChange={(e) => setSellerData({ ...sellerData, companyName: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Business Number (BN)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="12345 6789 RT0001"
                                                        value={sellerData.businessNumber}
                                                        onChange={(e) => setSellerData({ ...sellerData, businessNumber: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Website</label>
                                                    <input
                                                        type="text"
                                                        placeholder="www.company.com"
                                                        value={sellerData.website}
                                                        onChange={(e) => setSellerData({ ...sellerData, website: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">City</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Toronto"
                                                        value={sellerData.city}
                                                        onChange={(e) => setSellerData({ ...sellerData, city: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Province</label>
                                                    <select
                                                        value={sellerData.province}
                                                        onChange={(e) => setSellerData({ ...sellerData, province: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-400 focus:border-marcan-red outline-none"
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="ON">Ontario</option>
                                                        <option value="QC">Quebec</option>
                                                        <option value="AB">Alberta</option>
                                                        <option value="BC">British Columbia</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">About Us</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Describe your company history, mission, and specialization..."
                                                    value={sellerData.aboutUs}
                                                    onChange={(e) => setSellerData({ ...sellerData, aboutUs: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                                ></textarea>
                                            </div>
                                        </div>
                                        <div className="mt-8 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={nextWizardStep}
                                                className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                                            >
                                                Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Slide 2: Capabilities */}
                                    <div
                                        className={`transition-all duration-300 ${wizardStep === 2 ? 'opacity-100 translate-x-0 block' : 'opacity-0 pointer-events-none translate-x-10 hidden'
                                            }`}
                                    >
                                        <div className="text-center mb-8">
                                            <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Capabilities</h2>
                                            <p className="text-xs text-slate-500">Step 2 of 2: Skill Tags</p>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex gap-4 items-center mb-6 p-4 rounded-lg bg-white/5 border border-white/5">
                                                <div className="w-16 h-16 rounded-lg bg-black/40 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-marcan-red transition">
                                                    <i className="fa-solid fa-camera"></i>
                                                    <span className="text-[8px] uppercase mt-1">Logo</span>
                                                </div>
                                                <div className="text-xs text-slate-400">Upload your company logo to stand out in the directory.</div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Primary Capabilities</label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {['CNC Machining', 'Casting', 'Fabrication', 'Finishing', 'Tooling', 'Assembly'].map((cap) => (
                                                        <label
                                                            key={cap}
                                                            className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={sellerData.capabilities.includes(cap)}
                                                                onChange={() => toggleCapability(cap)}
                                                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                                            />
                                                            <span className="text-[10px] font-bold text-white uppercase">{cap}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="+ Add custom capability..."
                                                    className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-xs text-white focus:border-marcan-red outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Certifications</label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {['ISO 9001', 'AS9100', 'CGRP'].map((cert) => (
                                                        <label
                                                            key={cert}
                                                            className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={sellerData.certifications.includes(cert)}
                                                                onChange={() => toggleCertification(cert)}
                                                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                                            />
                                                            <span className="text-[10px] font-bold text-white uppercase">{cert}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="+ Add custom certification..."
                                                    className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-xs text-white focus:border-marcan-red outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-8 flex justify-between">
                                            <button
                                                type="button"
                                                onClick={prevWizardStep}
                                                className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? (
                                                    <span>
                                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> Updating...
                                                    </span>
                                                ) : (
                                                    'Complete Seller Setup'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
