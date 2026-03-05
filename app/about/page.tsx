import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'About Us - Marcan',
  description: 'Learn about Marcan and our mission to revitalize the Canadian industrial sector.',
};

export default function AboutPage() {
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="About Us" />

      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="max-w-4xl mx-auto text-center py-6">
          <div className="mb-8">
            <i className="fa-solid fa-shield-halved text-5xl text-marcan-red mb-4 shadow-neon rounded-full p-4 bg-white/5"></i>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-3">
            Trust & Authority
          </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Marcan is a project dedicated to revitalizing the Canadian manufacturing sector.
          </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="glass-card p-8 rounded-2xl border-2 border-marcan-red/70 shadow-neon bg-gradient-to-br from-marcan-red/10 to-transparent">
              <h3 className="font-bold text-xl text-white mb-3 uppercase">Who We Are</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                We are a team of engineering students and professionals at the University of Waterloo, dedicated to solving the fragmentation in the Canadian manufacturing sector and making it easier to source locally.
              </p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-2 border-marcan-red/70 shadow-neon bg-gradient-to-br from-marcan-red/10 to-transparent">
              <h3 className="font-bold text-xl text-white mb-3 uppercase">Our Sponsors</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Supported by the University of Waterloo Faculty of Engineering and Next Generation Manufacturing Canada (NGEN).
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
