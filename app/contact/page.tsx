'use client';

import { useState } from 'react';
import Header from '@/components/Header';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Please fill in your name, email, and message.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message. Please try again.');
      }

      setStatus({ type: 'success', text: 'Message sent! We’ll get back to you shortly.' });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Error sending contact message:', err);
      setStatus({ type: 'error', text: err.message || 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <h3 className="font-bold text-xl text-white mb-4 uppercase text-center">Send us a message</h3>
              {status && (
                <div
                  className={`mb-4 p-3 rounded-lg text-xs font-bold uppercase tracking-wider ${status.type === 'success'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                >
                  {status.text}
                </div>
              )}
              <form className="space-y-3 flex-1 flex flex-col" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                />
                <textarea
                  placeholder="How can we help?"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                ></textarea>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-marcan-red text-white py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-auto disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
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
