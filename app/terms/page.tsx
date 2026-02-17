import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Terms of Service - Marcan',
  description: 'Terms of Service for Marcan platform.',
};

export default function TermsPage() {
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Terms of Service" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-marcan-red/10 border border-marcan-red/30 mb-6 shadow-neon">
              <i className="fa-solid fa-gavel text-2xl text-marcan-red"></i>
            </div>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-4">
              Terms of Service
            </h2>
            <p className="text-slate-400 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-8">
            <section>
              <h3 className="font-bold text-xl text-white mb-4">1. Acceptance of Terms</h3>
              <p className="text-slate-400 leading-relaxed">
                By accessing or using the Marcan platform ("Platform", "Service"), you agree to be bound by these Terms of Service ("Terms").
                If you disagree with any part of these Terms, you may not access or use the Service. These Terms apply to all users of the
                Platform, including buyers, suppliers, and visitors.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">2. Description of Service</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Marcan is a business-to-business (B2B) marketplace platform designed to connect Canadian manufacturing enterprises.
                The Platform provides the following services:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>A Company Directory featuring verified supplier profiles</li>
                <li>A marketplace for suppliers to list equipment, materials, surplus parts, and production capacity</li>
                <li>A sourcing request system for buyers to post requests for quotes (RFQs)</li>
                <li>Tools to facilitate connections between Canadian manufacturing enterprises</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                Marcan acts as an intermediary platform and does not participate in, facilitate, or guarantee any transactions
                between users. All business transactions are conducted directly between users.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">3. Eligibility and Account Registration</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                To use the Platform, you must:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>Be a Canadian manufacturing enterprise or represent such an enterprise</li>
                <li>Be at least 18 years of age or have the authority to bind your organization</li>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                You are responsible for all activities that occur under your account. You agree to notify Marcan immediately
                of any unauthorized use of your account. Marcan reserves the right to refuse service, suspend, or terminate
                accounts at our sole discretion.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">4. Unified Account System</h3>
              <p className="text-slate-400 leading-relaxed">
                Marcan uses a unified account system that allows users to operate as both buyers and suppliers with a single account.
                By creating an account, you may access both buyer and supplier features. To create supplier listings or appear in the
                Company Directory, you must complete the supplier registration process and provide a valid Canadian business registration
                number.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">5. Supplier Verification</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Suppliers must complete a registration process that includes verification of:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>Canadian business registration number</li>
                <li>Company information and location</li>
                <li>Manufacturing capabilities and certifications (if applicable)</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                Marcan reserves the right to verify and validate all information provided. False, misleading, or incomplete
                information may result in account suspension or termination. Verification does not constitute an endorsement,
                guarantee, or warranty of any user's business practices, products, or services.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">6. Listings and Sourcing Requests</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                <strong>Supplier Listings:</strong> Suppliers may create listings for equipment, materials, surplus parts, or
                production capacity. You represent and warrant that:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>All information in your listings is accurate and truthful</li>
                <li>You have the legal right to offer the items or services listed</li>
                <li>Your listings comply with all applicable laws and regulations</li>
                <li>You will honor the terms and conditions stated in your listings</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4 mb-4">
                <strong>Sourcing Requests:</strong> Buyers may post requests for quotes (RFQs) for materials or services.
                You represent and warrant that:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>All information in your requests is accurate and truthful</li>
                <li>You have the authority and intent to purchase the requested items or services</li>
                <li>Your requests comply with all applicable laws and regulations</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                Marcan reserves the right to remove, edit, or refuse any listing or sourcing request that violates these Terms
                or applicable laws, or that we determine is inappropriate, misleading, or harmful.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">7. User Conduct and Prohibited Activities</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>Post false, misleading, or fraudulent information</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Use the Platform for any illegal purpose or in violation of any laws</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Interfere with or disrupt the Platform or servers</li>
                <li>Attempt to gain unauthorized access to any portion of the Platform</li>
                <li>Copy, modify, or create derivative works of the Platform</li>
                <li>Use automated systems to access the Platform without authorization</li>
                <li>Collect or harvest information about other users without their consent</li>
                <li>Post spam, unsolicited communications, or advertisements</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">8. Transactions Between Users</h3>
              <p className="text-slate-400 leading-relaxed">
                Marcan provides a platform for users to connect and share information. All transactions, negotiations, and
                agreements are conducted directly between users. Marcan is not a party to any transaction and does not:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mt-4">
                <li>Guarantee the quality, safety, or legality of any listed items or services</li>
                <li>Verify the accuracy of user-provided information</li>
                <li>Process payments or handle funds between users</li>
                <li>Provide escrow services or dispute resolution</li>
                <li>Warrant that users will complete transactions</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                Users are solely responsible for verifying the identity, credentials, and reliability of other users before
                entering into any transaction. You acknowledge that you assume all risks associated with transactions with
                other users.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">9. Intellectual Property</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                The Platform, including its design, features, functionality, and content (excluding user-generated content),
                is owned by Marcan and protected by Canadian and international copyright, trademark, and other intellectual
                property laws.
              </p>
              <p className="text-slate-400 leading-relaxed">
                By posting content on the Platform, you grant Marcan a non-exclusive, worldwide, royalty-free license to
                use, display, and distribute your content on the Platform. You retain ownership of your content and are
                responsible for ensuring you have the right to post it.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">10. Privacy and Data Protection</h3>
              <p className="text-slate-400 leading-relaxed">
                Your use of the Platform is also governed by our Privacy Policy. By using the Platform, you consent to
                the collection, use, and disclosure of your information as described in the Privacy Policy. You acknowledge
                that information you post on the Platform, including contact information, may be visible to other users.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">11. Disclaimers</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                <li>Warranties that the Platform will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the accuracy, reliability, or quality of any information on the Platform</li>
                <li>Warranties regarding the conduct of other users</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                Marcan does not endorse, verify, or guarantee the accuracy, completeness, or reliability of any user-generated
                content, listings, or sourcing requests.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">12. Limitation of Liability</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, MARCAN AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS
                SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Damages arising from transactions between users</li>
                <li>Damages arising from your use or inability to use the Platform</li>
                <li>Damages arising from unauthorized access to or alteration of your data</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                In no event shall Marcan's total liability exceed the amount you paid to Marcan (if any) in the twelve (12)
                months preceding the claim, or one hundred Canadian dollars (CAD $100), whichever is greater.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">13. Indemnification</h3>
              <p className="text-slate-400 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Marcan and its affiliates, officers, directors, employees,
                and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any rights of another
                user or third party; (d) your content, listings, or sourcing requests; or (e) any transaction between you and
                another user.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">14. Termination</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                You may terminate your account at any time by contacting Marcan or using account deletion features (if available).
                Marcan may suspend or terminate your account immediately, without prior notice, if:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>You violate these Terms</li>
                <li>You engage in fraudulent, illegal, or harmful activities</li>
                <li>You provide false or misleading information</li>
                <li>Required by law or requested by law enforcement</li>
              </ul>
              <p className="text-slate-400 leading-relaxed mt-4">
                Upon termination, your right to use the Platform will immediately cease. Sections of these Terms that by their
                nature should survive termination will survive, including but not limited to disclaimers, limitations of
                liability, and indemnification.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">15. Changes to Terms</h3>
              <p className="text-slate-400 leading-relaxed">
                Marcan reserves the right to modify these Terms at any time. We will notify users of material changes by posting
                the updated Terms on the Platform and updating the "Last updated" date. Your continued use of the Platform after
                such changes constitutes acceptance of the modified Terms. If you do not agree to the modified Terms, you must
                stop using the Platform.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">16. Governing Law and Dispute Resolution</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                These Terms are governed by and construed in accordance with the laws of the Province of Ontario, Canada, and the
                federal laws of Canada applicable therein, without regard to conflict of law principles.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Any disputes arising from or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction
                of the courts of Ontario, Canada. You agree to submit to the personal jurisdiction of such courts.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-xl text-white mb-4">17. General Provisions</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                <strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement
                between you and Marcan regarding the Platform.
              </p>
              <p className="text-slate-400 leading-relaxed mb-4">
                <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid, that
                provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain
                in full force and effect.
              </p>
              <p className="text-slate-400 leading-relaxed mb-4">
                <strong>Waiver:</strong> No waiver of any term of these Terms shall be deemed a further or continuing waiver of
                such term or any other term.
              </p>
              <p className="text-slate-400 leading-relaxed">
                <strong>Contact:</strong> If you have questions about these Terms, please contact us through the Platform's
                contact page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
