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

      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="max-w-5xl mx-auto py-6">
          <div className="text-center mb-8">
            <i className="fa-solid fa-life-ring text-5xl text-marcan-red mb-4 shadow-neon rounded-full p-4 bg-white/5"></i>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-3">
              Help Center
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">Browse our FAQs and helpful resources to find answers to your questions.</p>
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
                      Yes. Marcan is 100% free to use for Canadian manufacturing enterprises. You can create an account, appear in the Company Directory, browse supplier listings, and post sourcing requests with no subscriptions, commissions, or paywalls.
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
                      You can participate on both sides of the marketplace, but buyer accounts and supplier company profiles are created and managed separately. In practice, that means you&apos;ll have one account for posting sourcing requests as a buyer, and a separate seller profile (with its own onboarding) if you want your company to appear in the Company Directory and Supplier Listings.
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
                      First, complete the <span className="font-semibold">"Become a Seller"</span> onboarding to set up your supplier company profile. You can start this from the main navigation or from prompts on the Supplier Listings page, and you can either import your existing website for a fast AI-powered setup or fill out the form manually. Once your profile is saved, go to the <span className="font-semibold">Supplier Listings</span> page and click <span className="font-semibold">"Create Listing"</span> to publish equipment, materials, surplus parts, or production capacity for sale.
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
                      The registration wizard collects company basics (legal name, city, province, provinces served, website, and company type), core manufacturing capabilities (processes, materials, and optional finishes), production profile (typical job sizes, lead times, and optional max part sizes), trust and discovery details (certifications, industries served, and industry hubs), and RFQ contact preferences (RFQ email plus optional phone and preferred contact method). If you start with website import, we use AI to pre-fill as much of this as possible and you just review and confirm.
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
                      View company profiles in the <span className="font-semibold">Company Directory</span> to see contact information (RFQ email, phone number, website) when provided. Supplier listings and sourcing requests also surface the contact details that companies choose to share, so you can reach out directly by email or phone—Marcan does not sit in the middle of your conversations.
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
                      Sourcing Requests let buyers post detailed RFQs for the parts, materials, or services they need. You can create a request from the <span className="font-semibold">Post Request</span> flow and then manage it from <span className="font-semibold">My Account → My Posts</span>. Suppliers who see your request can contact you directly using the RFQ email or other contact details you included.
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
                      You can manage your content from <span className="font-semibold">My Account → My Posts</span>. From there you can delete any sourcing request or supplier listing; to make changes, delete the old post and create a new one with the updated details.
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
                      Marcan is purpose-built for Canadian manufacturing and industrial enterprises&mdash;including job shops, contract manufacturers, distributors, and OEMs. Anyone can create a buyer account, but appearing in the Company Directory and Supplier Listings is intended for companies that actively operate and serve customers within Canada.
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
