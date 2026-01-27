import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Company Directory - Marcan',
  description: 'Browse verified Canadian manufacturing companies and suppliers.',
};

export default function DirectoryPage() {
  const companies = [
    {
      name: 'NorthYork Precision',
      location: 'Toronto, ON',
      description: 'Aerospace grade CNC machining. 5-Axis capabilities with ISO 9001 certification.',
      icon: 'fa-industry',
      tags: ['Aerospace', '5-Axis', 'CNC'],
    },
    {
      name: 'Hamilton Castings',
      location: 'Hamilton, ON',
      description: 'Heavy industrial iron and steel casting. Custom sand molds and rapid prototyping.',
      icon: 'fa-fire-burner',
      tags: ['Foundry', 'Iron/Steel', 'Molds'],
    },
    {
      name: 'WestCoast Finishers',
      location: 'Richmond, BC',
      description: 'Seeking anodizing chemicals and powder coating partners for marine applications.',
      icon: 'fa-flask',
      tags: ['Finishing', 'Anodizing', 'Chemicals'],
    },
  ];

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Company Directory" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">Explore</div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">Company Directory</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by industry..."
              className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-marcan-red outline-none w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company, index) => (
            <div
              key={index}
              className="glass-card p-6 rounded-2xl group hover:border-marcan-red/40 transition-all duration-300 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-marcan-red transition-colors">
                  <i className={`fa-solid ${company.icon}`}></i>
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg text-white mb-1">{company.name}</h3>
              <p className="text-xs text-slate-500 uppercase mb-4">
                <i className="fa-solid fa-location-dot"></i> {company.location}
              </p>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">{company.description}</p>

              {/* Industry Tags */}
              <div className="mt-auto flex flex-wrap gap-2 mb-4">
                {company.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href="/profile"
                className="w-full py-2 rounded bg-white/5 hover:bg-marcan-red hover:text-white hover:shadow-neon text-slate-300 text-xs font-bold uppercase tracking-wider transition-all text-center block"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
