'use client';

import Header from '@/components/Header';

export default function ContactPage() {
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Contact Us" />

      <div className="flex-1 overflow-hidden p-6 relative">
        <div className="max-w-4xl mx-auto py-6">
          <div className="text-center mb-8">
            <i className="fa-solid fa-paper-plane text-5xl text-marcan-red mb-4 shadow-neon rounded-full p-4 bg-white/5"></i>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-3">
              Get in Touch
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Have questions about joining the network? Need support with a trade? Our team is ready to help Canadian
              manufacturers succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Contact Form */}
            <div className="glass-card p-8 rounded-2xl flex flex-col h-full">
              <h3 className="font-bold text-xl text-white mb-4 uppercase">Send us a message</h3>
              <form className="space-y-3 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                />
                <textarea
                  placeholder="How can we help?"
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-marcan-red text-white py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-auto"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-6 h-full">
              <div className="glass-card p-6 rounded-2xl flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-marcan-red/20 flex items-center justify-center text-marcan-red shrink-0">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase mb-2 text-sm">Headquarters</h4>
                  <p className="text-slate-400 text-sm">
                    200 University Avenue West
                    <br />
                    Waterloo, ON N2L 3G1
                    <br />
                    Canada
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-marcan-red/20 flex items-center justify-center text-marcan-red shrink-0">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase mb-2 text-sm">Email Us</h4>
                  <p className="text-slate-400 text-sm">
                    marcan.initiative@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
