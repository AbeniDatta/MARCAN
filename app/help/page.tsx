import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Help Center - Marcan',
  description: 'Guides, tutorials, and answers to your questions about Marcan.',
};

export default function HelpPage() {
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Help Center" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-marcan-red/10 border border-marcan-red/30 mb-6 shadow-neon">
              <i className="fa-solid fa-life-ring text-2xl text-marcan-red"></i>
            </div>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-4">
              Help Center
            </h2>
            <p className="text-slate-400 text-lg">Guides, tutorials, and answers to your questions.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Start Guide */}
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-8 rounded-2xl border border-white/5">
                <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-rocket text-marcan-red"></i> Getting Started
                </h3>

                <div className="relative pl-8 space-y-8">
                  {/* Vertical Line */}
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/10"></div>

                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-8 w-6 h-6 rounded-full bg-marcan-red flex items-center justify-center text-[10px] font-bold text-white shadow-neon">
                      1
                    </div>
                    <h4 className="text-white font-bold mb-2">Create Your Unified Account</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Sign up with your business email. Select your primary role (Buyer or Supplier), but
                      remember—one account gives you access to both features.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-8 w-6 h-6 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                      2
                    </div>
                    <h4 className="text-white font-bold mb-2">Complete Your Profile</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Suppliers: List your capabilities (CNC, Foundry, etc.) and certifications. Buyers: Add your
                      location to find local partners faster.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className="absolute -left-8 w-6 h-6 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                      3
                    </div>
                    <h4 className="text-white font-bold mb-2">Start Connecting</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Use the <strong>Directory</strong> to find shops, browse the <strong>Supplier Listings</strong>{' '}
                      for equipment, or check the <strong>Wishlist</strong> for active contracts.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="glass-card p-8 rounded-2xl border border-white/5">
                <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-clipboard-question text-marcan-red"></i> FAQ
                </h3>

                <div className="space-y-4">
                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      Is Marcan free to use?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      Yes, basic membership is free for all Canadian MSEs. We offer premium tiers for advanced
                      analytics and priority listing placement.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      How does verification work?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      To maintain trust, we manually verify business registration numbers (BN) and certifications
                      (ISO, etc.) before a supplier profile goes live.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      Can I be both a buyer and a supplier?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      Absolutely. Marcan uses a Unified Account system. You can list surplus equipment in the
                      Supplier Listings while simultaneously posting RFQs for raw materials.
                    </p>
                  </details>
                </div>
              </div>
            </div>

            {/* Side Widgets */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl text-center">
                <i className="fa-solid fa-headset text-3xl text-marcan-red mb-4"></i>
                <h4 className="font-bold text-white mb-2">Need Live Support?</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Our Canadian support team is available Mon-Fri, 9am-5pm EST.
                </p>
                <Link
                  href="/contact"
                  className="w-full bg-white/5 border border-white/10 text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-marcan-red hover:border-marcan-red transition-all block"
                >
                  Contact Us
                </Link>
              </div>

              <div className="glass-card p-6 rounded-2xl">
                <h4 className="font-bold text-white mb-4 text-sm uppercase">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#"
                      className="text-slate-400 text-sm hover:text-marcan-red flex items-center gap-2"
                    >
                      <i className="fa-regular fa-file-pdf"></i> User Manual (PDF)
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-400 text-sm hover:text-marcan-red flex items-center gap-2"
                    >
                      <i className="fa-solid fa-video"></i> Video Tutorials
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-400 text-sm hover:text-marcan-red flex items-center gap-2"
                    >
                      <i className="fa-solid fa-gavel"></i> Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
