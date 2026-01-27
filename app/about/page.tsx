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

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto text-center py-12">
          <i className="fa-solid fa-shield-halved text-6xl text-marcan-red mb-6 shadow-neon rounded-full p-4 bg-white/5"></i>
          <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-6">
            Trust & Authority
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed mb-12">
            Marcan is a project dedicated to revitalizing the Canadian industrial sector. We bridge the gap between
            small shops and large contracts through verification and transparency.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="glass-card p-8 rounded-2xl border-t-4 border-marcan-red">
              <h3 className="font-bold text-xl text-white mb-3 uppercase">Who We Are</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                We are a collective of engineers and supply chain experts. Marcan was built to solve the fragmentation
                in local manufacturing, making it easier to source "Made in Canada."
              </p>
            </div>
            <div className="glass-card p-8 rounded-2xl border-t-4 border-blue-500">
              <h3 className="font-bold text-xl text-white mb-3 uppercase">Our Sponsors</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Supported by leading industry bodies and government grants focused on digital transformation in the MSE
                sector.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
