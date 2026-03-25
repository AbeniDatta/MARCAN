import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'About Us - Marcan',
  description: 'Learn about Marcan, a premium B2B network built to revitalize Canadian manufacturing through fast, local connections.',
};

export default function AboutPage() {
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="About Us" />

      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="max-w-6xl mx-auto py-10 space-y-14">


          {/* Timeline / Story Flow */}
          <div className="relative">
            <div className="absolute left-5 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-marcan-red/60 via-white/10 to-transparent" />

            <div className="space-y-16 relative">
              {/* Why Marcan Exists */}
              <section className="relative pl-12 md:pl-14">
                <div className="absolute left-3 md:left-5 top-4 w-3 h-3 rounded-full bg-marcan-red shadow-neon" />
                <div className="glass-card rounded-2xl border border-white/5 p-8 bg-gradient-to-br from-marcan-red/10 to-transparent">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-heading font-black text-xs uppercase tracking-widest text-slate-500">
                      01
                    </span>
                    <h2 className="font-heading font-black text-2xl text-white uppercase tracking-tight">
                      Why Marcan Exists
                    </h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl">
                    Canadian industrial supply chains are fragmented. Marcan exists to connect buyers and
                    suppliers directly - so the right capabilities are easier to discover, faster to evaluate, and
                    simpler to reach.
                  </p>
                </div>
              </section>

              {/* What We Do */}
              <section className="relative pl-12 md:pl-14">
                <div className="absolute left-3 md:left-5 top-4 w-3 h-3 rounded-full bg-marcan-red shadow-neon" />

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-heading font-black text-xs uppercase tracking-widest text-slate-500">
                      02
                    </span>
                    <h2 className="font-heading font-black text-2xl text-white uppercase tracking-tight">
                      What We Do
                    </h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl">
                    A focused workflow for real-world manufacturing: find capacity, communicate clearly, and move
                    decisions forward.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-7 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="w-12 h-12 rounded-2xl bg-marcan-red/15 border border-marcan-red/30 flex items-center justify-center text-marcan-red shadow-neon mb-4">
                      <i className="fa-solid fa-magnifying-glass text-xl" />
                    </div>
                    <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight">
                      Discover Local Capability
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mt-3">
                      Browse verified suppliers and manufacturing capabilities - built for Canadian businesses.
                    </p>
                  </div>

                  <div className="glass-card p-7 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="w-12 h-12 rounded-2xl bg-marcan-red/15 border border-marcan-red/30 flex items-center justify-center text-marcan-red shadow-neon mb-4">
                      <i className="fa-solid fa-list-check text-xl" />
                    </div>
                    <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight">
                      List What You Can Build
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mt-3">
                      Publish equipment, materials, surplus parts, and capacity so buyers can find you faster.
                    </p>
                  </div>

                  <div className="glass-card p-7 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="w-12 h-12 rounded-2xl bg-marcan-red/15 border border-marcan-red/30 flex items-center justify-center text-marcan-red shadow-neon mb-4">
                      <i className="fa-solid fa-bolt text-xl" />
                    </div>
                    <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight">
                      Match Through RFQs
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mt-3">
                      Send targeted sourcing requests and connect directly - so conversations start on the right
                      spec.
                    </p>
                  </div>
                </div>
              </section>

              {/* Who We Are */}
              <section className="relative pl-12 md:pl-14">
                <div className="absolute left-3 md:left-5 top-4 w-3 h-3 rounded-full bg-marcan-red shadow-neon" />
                <div className="glass-card rounded-2xl border border-white/5 p-8 bg-gradient-to-br from-marcan-red/10 to-transparent">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-heading font-black text-xs uppercase tracking-widest text-slate-500">
                      03
                    </span>
                    <h2 className="font-heading font-black text-2xl text-white uppercase tracking-tight">
                      Who We Are
                    </h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl">
                    We're a team of engineering students and industry builders working from the University of
                    Waterloo. Our goal is simple: remove fragmentation and make local sourcing feel obvious for
                    Canadian manufacturers.
                  </p>
                </div>
              </section>

              {/* Supported By */}
              <section className="relative pl-12 md:pl-14">
                <div className="absolute left-3 md:left-5 top-4 w-3 h-3 rounded-full bg-marcan-red shadow-neon" />

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-heading font-black text-xs uppercase tracking-widest text-slate-500">
                      04
                    </span>
                    <h2 className="font-heading font-black text-2xl text-white uppercase tracking-tight">
                      Supported By
                    </h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl">
                    Credibility matters. Marcan is supported by institutions focused on strengthening
                    manufacturing talent and capability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4 overflow-hidden relative">
                    <div className="w-12 h-12 rounded-2xl bg-marcan-red/15 border border-marcan-red/30 flex items-center justify-center text-marcan-red shadow-neon shrink-0">
                      <i className="fa-solid fa-landmark text-xl" />
                    </div>
                    <div>
                      <div className="text-white font-heading font-black uppercase tracking-tight">
                        University of Waterloo
                      </div>
                      <div className="text-slate-400 text-sm leading-relaxed">
                        Faculty of Engineering
                      </div>
                    </div>
                    <div className="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-marcan-red/10 blur-xl" />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4 overflow-hidden relative">
                    <div className="w-12 h-12 rounded-2xl bg-marcan-red/15 border border-marcan-red/30 flex items-center justify-center text-marcan-red shadow-neon shrink-0">
                      <i className="fa-solid fa-gear text-xl" />
                    </div>
                    <div>
                      <div className="text-white font-heading font-black uppercase tracking-tight">
                        Next Generation Manufacturing Canada (NGEN)
                      </div>
                      <div className="text-slate-400 text-sm leading-relaxed">
                        Partner Support
                      </div>
                    </div>
                    <div className="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-marcan-red/10 blur-xl" />
                  </div>
                </div>
              </section>

              {/* Our Vision */}
              <section className="relative pl-12 md:pl-14">
                <div className="absolute left-3 md:left-5 top-4 w-3 h-3 rounded-full bg-marcan-red shadow-neon" />
                <div className="glass-card rounded-2xl border border-white/5 p-8 bg-gradient-to-br from-marcan-red/10 to-transparent">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-heading font-black text-xs uppercase tracking-widest text-slate-500">
                      05
                    </span>
                    <h2 className="font-heading font-black text-2xl text-white uppercase tracking-tight">
                      Our Vision
                    </h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl">
                    A future where Canadian manufacturing is easy to discover, easy to source, and easy to trust.
                    We're building Marcan to help the right shop win the right work - again and again.
                  </p>
                </div>
              </section>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-marcan-red/35 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.25)] opacity-80" />

          {/* CTA */}
          <section className="pt-2">
            <div className="glass-card rounded-3xl border border-white/5 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-marcan-red/20 via-transparent to-transparent opacity-80" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <i className="fa-solid fa-route text-marcan-red text-xl shadow-neon" />
                    <h3 className="font-heading font-black text-2xl text-white uppercase tracking-tight">
                      Ready to build the network?
                    </h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl">
                    Join Marcan to connect directly with Canadian manufacturers and move sourcing from "maybe later"
                    to "done."
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:shadow-neon hover:scale-[1.02] transition-all duration-300 inline-flex items-center justify-center"
                  >
                    Create Your Account <i className="fa-solid fa-user-plus ml-2" />
                  </Link>
                  <Link
                    href="/contact"
                    className="border border-white/15 bg-white/5 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-white/10 hover:border-marcan-red/40 hover:shadow-neon transition-all duration-300 inline-flex items-center justify-center"
                  >
                    Talk to Us
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
