import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Help Center - Marcan',
  description: 'Find answers to your questions about Marcan.',
};

export default function HelpPage() {
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Support" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-marcan-red/10 border border-marcan-red/30 mb-6 shadow-neon">
              <i className="fa-solid fa-life-ring text-2xl text-marcan-red"></i>
            </div>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-4">
              Help Center
            </h2>
            <p className="text-slate-400 text-lg">Find answers to your questions.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
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
                      Yes, basic membership is free for all Canadian manufacturing enterprises. You can create an account, browse the directory, view supplier listings, and post sourcing requests at no cost.
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
                      Yes. Marcan uses a unified account system. You can operate as both a buyer (posting sourcing requests) and a supplier (creating listings and appearing in the directory) with a single account.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      How do I create a supplier listing?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      First, complete the "Become a Seller" registration process to set up your supplier profile. Once registered, go to the Supplier Listings page and click "Create Listing" to post equipment, materials, surplus parts, or production capacity for sale.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      What information do I need to complete my supplier profile?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      The registration wizard collects: company name, location, provinces served, manufacturing processes, materials, finishes, typical job sizes, lead times, certifications, industries served, and RFQ contact preferences.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      How do I contact other users on the platform?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      View company profiles in the Company Directory to see contact information (phone, email, website) if provided. Supplier listings and sourcing requests also display contact details for direct inquiries.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      What is the Sourcing Requests feature?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      The Sourcing Requests feature allows buyers to post requests for quotes (RFQs) for materials or services they need. Suppliers can browse these requests and contact buyers directly through the provided contact information.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      Can I edit or delete my listings and requests?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      Yes. Go to "My Account" → "My Posts" to manage your supplier listings and sourcing requests. You can delete items from there.
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      Who can use Marcan?
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      Marcan is designed for Canadian manufacturing enterprises. You need a valid Canadian business registration number to create a supplier profile and appear in the Company Directory.
                    </p>
                  </details>
                </div>
              </div>
            </div>

            {/* Side Widgets */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <h4 className="font-bold text-white mb-4 text-sm uppercase">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/terms"
                      className="text-slate-400 text-sm hover:text-marcan-red flex items-center gap-2"
                    >
                      <i className="fa-solid fa-gavel"></i> Terms of Service
                    </Link>
                  </li>
                  <li>
                    <span className="text-slate-400 text-sm flex items-center gap-2 opacity-60">
                      <i className="fa-solid fa-video"></i> Video Tutorials
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">Coming Soon</span>
                    </span>
                  </li>
                  <li>
                    <span className="text-slate-400 text-sm flex items-center gap-2 opacity-60">
                      <i className="fa-regular fa-file-pdf"></i> User Manual (PDF)
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">Coming Soon</span>
                    </span>
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
