import { FileText, Clock, ExternalLink, Sparkles } from 'lucide-react';

interface BriefSection {
  title: string;
  color: string;
  items: string[];
}

const SAMPLE_BRIEF: BriefSection[] = [
  {
    title: 'Energy',
    color: 'text-red-400',
    items: [
      'Brent crude fell 1.8% to $77.40/bbl as OPEC+ considers accelerating output hikes for May.',
      'US natural gas futures rose 3.2% on cooler-than-expected weather forecasts for the Midwest.',
      'India crude imports in February rose 4.6% YoY; Aramco OSP for April left unchanged.',
    ],
  },
  {
    title: 'Metals',
    color: 'text-amber-400',
    items: [
      'Gold rallied to $2,345/oz, posting its 5th consecutive weekly gain on rate cut expectations.',
      'Copper held above $4.10/lb; Codelco reports lower Q1 output due to water shortages in Chile.',
      'India gold imports surged 47% in March ahead of the wedding season.',
    ],
  },
  {
    title: 'Agriculture',
    color: 'text-emerald-400',
    items: [
      'Wheat procurement in Punjab off to a slow start; early arrivals show quality issues from untimely rain.',
      'Soybean meal exports from India rose 12% MoM as competitive pricing attracts Asian buyers.',
      'Cotton spot in Gujarat at Rs 7,050/qtl, 2% above MSP; USDA raises India production estimate.',
    ],
  },
  {
    title: 'Macro Signals',
    color: 'text-blue-400',
    items: [
      'RBI holds repo rate at 6.5%; signals shift to accommodative stance in next meeting.',
      'US PCE deflator due today -- consensus at 2.5% YoY, core at 2.8%.',
      'Chinese manufacturing PMI expanded for the 3rd month; base metals demand outlook brightens.',
    ],
  },
];

export function MorningBrief() {
  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto max-w-4xl">
      {/* Header */}
      <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <FileText className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Morning Brief</h1>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-500">March 30, 2026 -- 06:00 IST</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium">AI Generated</span>
          </div>
        </div>
      </div>

      {/* Brief sections */}
      {SAMPLE_BRIEF.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-5"
        >
          <h2 className={`text-lg font-semibold ${section.color} mb-3`}>{section.title}</h2>
          <ul className="space-y-2">
            {section.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-400">
                <span className="text-gray-600 mt-0.5">&#8226;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Footer */}
      <div className="rounded-xl border border-dashed border-white/10 bg-gray-900/30 p-6 text-center">
        <p className="text-sm text-gray-500">
          Compiled from 47 sources including Reuters, Bloomberg, DGCIS, and IMD.
        </p>
        <button className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
          <ExternalLink className="h-3 w-3" />
          View all sources
        </button>
      </div>
    </div>
  );
}
