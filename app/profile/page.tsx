import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
    title: 'Company Profile - Marcan',
    description: 'View detailed company profile and capabilities.',
};

export default function ProfilePage() {
    return (
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
            <Header breadcrumb="Company Profile" />

            <div className="flex-1 overflow-y-auto p-8 relative">
                <Link
                    href="/directory"
                    className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                >
                    <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to
                    Directory
                </Link>

                <div className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <i className="fa-solid fa-industry text-9xl text-slate-500"></i>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-marcan-dark/90 to-transparent z-0"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-3xl font-black text-marcan-dark shadow-neon shrink-0">
                            NYP
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="font-heading text-3xl font-bold text-white">NorthYork Precision Ltd.</h1>
                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                    <i className="fa-solid fa-check-circle"></i> Verified Supplier
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4 flex items-center gap-4">
                                <span>
                                    <i className="fa-solid fa-location-dot mr-1 text-marcan-red"></i> Toronto, ON
                                </span>
                                <span>
                                    <i className="fa-solid fa-globe mr-1 text-slate-500"></i> www.nyp-mfg.ca
                                </span>
                            </p>
                            <div className="flex gap-2">
                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-xs text-slate-300">
                                    Precision Machining
                                </span>
                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-xs text-slate-300">
                                    Aerospace
                                </span>
                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-xs text-slate-300">
                                    Medical
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* About Us */}
                        <div className="glass-card p-8 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/5 pb-2">
                                About Us
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                NorthYork Precision has been a leader in high-tolerance CNC machining for over 25 years. We specialize
                                in complex components for the aerospace, medical, and defense sectors. Our facility in Toronto is
                                equipped with the latest 5-axis machining centers and CMM inspection capabilities.
                            </p>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                We pride ourselves on our "Made in Canada" quality and our ability to handle both rapid prototyping and
                                full-scale production runs with strict adherence to deadlines.
                            </p>
                        </div>

                        {/* Core Capabilities */}
                        <div className="glass-card p-8 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-lg text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-2">
                                Core Capabilities
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-crosshairs text-marcan-red mt-1"></i>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">5-Axis CNC Milling</h4>
                                        <p className="text-slate-500 text-xs">Complex geometries with single setup.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-microchip text-marcan-red mt-1"></i>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Wire EDM</h4>
                                        <p className="text-slate-500 text-xs">High precision cutting for hardened metals.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-ruler-combined text-marcan-red mt-1"></i>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">CMM Inspection</h4>
                                        <p className="text-slate-500 text-xs">Zeiss Contura G2 for quality assurance.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-rotate text-marcan-red mt-1"></i>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Swiss Turning</h4>
                                        <p className="text-slate-500 text-xs">High volume small parts production.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Materials Worked */}
                        <div className="glass-card p-8 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/5 pb-2">
                                Materials Worked
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Titanium (Grades 2, 5)',
                                    'Inconel 625/718',
                                    'Aluminum 6061/7075',
                                    'Stainless Steel 304/316',
                                    'PEEK Plastic',
                                ].map((material) => (
                                    <span
                                        key={material}
                                        className="bg-black/40 text-slate-300 px-3 py-1 rounded text-xs border border-white/5"
                                    >
                                        {material}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Information */}
                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Contact Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                                        <i className="fa-solid fa-phone"></i>
                                    </div>
                                    <span>+1 (416) 555-0199</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                                        <i className="fa-solid fa-envelope"></i>
                                    </div>
                                    <span>quotes@nyp-mfg.ca</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                                        <i className="fa-solid fa-location-dot"></i>
                                    </div>
                                    <span>
                                        45 Industrial Rd, Etobicoke
                                        <br />
                                        ON M9W 3V5
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Certifications */}
                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Certifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                                    <i className="fa-solid fa-certificate text-yellow-500"></i>
                                    <div>
                                        <div className="text-xs font-bold text-white">ISO 9001:2015</div>
                                        <div className="text-[10px] text-slate-500">Quality Management</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                                    <i className="fa-solid fa-plane text-blue-400"></i>
                                    <div>
                                        <div className="text-xs font-bold text-white">AS9100 Rev D</div>
                                        <div className="text-[10px] text-slate-500">Aerospace Quality</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                                    <i className="fa-solid fa-lock text-red-400"></i>
                                    <div>
                                        <div className="text-xs font-bold text-white">CGRP Registered</div>
                                        <div className="text-[10px] text-slate-500">Controlled Goods</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
