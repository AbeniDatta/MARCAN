'use client';

import Header from '@/components/Header';

export default function ContactPage() {
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Contact Us" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center mb-12">
            <i className="fa-solid fa-paper-plane text-6xl text-marcan-red mb-6 shadow-neon rounded-full p-4 bg-white/5"></i>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Have questions about joining the network? Need support with a trade? Our team is ready to help Canadian
              manufacturers succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="font-bold text-xl text-white mb-6 uppercase">Send us a message</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                />
                <textarea
                  placeholder="How can we help?"
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-marcan-red text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-marcan-red/20 flex items-center justify-center text-marcan-red shrink-0">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase mb-1">Headquarters</h4>
                  <p className="text-slate-400 text-sm">
                    200 University Avenue West
                    <br />
                    Waterloo, ON N2L 3G1
                    <br />
                    Canada
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-marcan-red/20 flex items-center justify-center text-marcan-red shrink-0">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase mb-1">Email Us</h4>
                  <p className="text-slate-400 text-sm">
                    marcan.initiative@gmail.com
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-marcan-red/20 flex items-center justify-center text-marcan-red shrink-0">
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase mb-1">Call Us</h4>
                  <p className="text-slate-400 text-sm">
                    +1 (519) 888-4885
                    <br />
                    Mon-Fri, 9am - 5pm EST
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
