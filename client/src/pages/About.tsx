// client/src/pages/About.tsx
import AuthenticatedHeader from "@/components/AuthenticatedHeader";

const About = () => {
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AuthenticatedHeader />

      {/* Page Header */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter leading-tight">
            About MARCAN
          </h1>
          <p className="text-[25px] text-[#4A3F3F] font-inria-sans font-normal mb-8">
            Manufacturing and Resources Canada — an online marketplace for Canadian manufacturing
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto space-y-8">
          {/* Main About Card */}
          <div className="bg-white rounded-[20px] px-6 md:px-8 py-6 md:py-8 border border-gray-200">
            <h2 className="text-[22px] md:text-[26px] font-bold text-black font-inter mb-4">
              Project Information
            </h2>

            <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter leading-relaxed">
              This is a project developed by students at the University of Waterloo.
              If you have any questions, comments, or feedback, please email{" "}
              <a
                href="mailto:marcan.initiative@gmail.com"
                className="text-blue-600 underline hover:text-blue-800 font-inter"
              >
                marcan.initiative@gmail.com
              </a>
              .
            </p>

            <div className="mt-6 text-[14px] md:text-[16px] text-gray-600 font-inter leading-relaxed">
              Note: MARCAN is an educational project and is not an official Government of Canada service.
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-[20px] px-6 md:px-8 py-6 md:py-8 border border-gray-200">
            <h2 className="text-[22px] md:text-[26px] font-bold text-black font-inter mb-6">
              FAQ
            </h2>

            <div className="space-y-5">
              <div>
                <div className="text-[16px] md:text-[20px] font-bold text-black font-inter">
                  Is MARCAN an official Government of Canada service?
                </div>
                <div className="text-[15px] md:text-[18px] text-gray-700 font-inter mt-2 leading-relaxed">
                  No. This is a student-developed project and is not affiliated with the Government of Canada.
                </div>
              </div>

              <div>
                <div className="text-[16px] md:text-[20px] font-bold text-black font-inter">
                  What can I do on MARCAN?
                </div>
                <div className="text-[15px] md:text-[18px] text-gray-700 font-inter mt-2 leading-relaxed">
                  You can browse supplier listings, view supplier profiles, and contact suppliers directly.
                </div>
              </div>

              <div>
                <div className="text-[16px] md:text-[20px] font-bold text-black font-inter">
                  How do I report a bug or request a feature?
                </div>
                <div className="text-[15px] md:text-[18px] text-gray-700 font-inter mt-2 leading-relaxed">
                  Email{" "}
                  <a
                    href="mailto:marcan.initiative@gmail.com"
                    className="text-blue-600 underline hover:text-blue-800 font-inter"
                  >
                    marcan.initiative@gmail.com
                  </a>{" "}
                  and include as much detail as possible (steps to reproduce + screenshots if you can).
                </div>
              </div>

              <div>
                <div className="text-[16px] md:text-[20px] font-bold text-black font-inter">
                  How is supplier/company information added?
                </div>
                <div className="text-[15px] md:text-[18px] text-gray-700 font-inter mt-2 leading-relaxed">
                  Depending on the build, information may be user-submitted and/or sourced from publicly available data.
                </div>
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="bg-white rounded-[20px] px-6 md:px-8 py-6 md:py-8 border border-gray-200">
            <h2 className="text-[22px] md:text-[26px] font-bold text-black font-inter mb-4">
              Documentation
            </h2>

            <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter leading-relaxed">
              This page can also host documentation such as how listings work, how searching/filtering works,
              and any admin functionality notes.
            </p>

            <ul className="mt-4 list-disc pl-6 space-y-2 text-[15px] md:text-[18px] text-gray-700 font-inter">
              <li>Listings: creating, editing, and visibility</li>
              <li>Search & filters: categories, tags, location, and sorting</li>
              <li>Saved listings and contacting suppliers</li>
              <li>Admin tools (if enabled)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
