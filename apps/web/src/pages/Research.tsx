import { useState } from 'react';
import { Brain, Send, FileText, Sparkles } from 'lucide-react';

function MorningBriefPanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Latest Morning Brief</h3>
        <span className="text-xs text-gray-600 ml-auto">Today, 06:00 IST</span>
      </div>
      <div className="space-y-3 text-sm text-gray-400">
        <p>
          <span className="text-amber-400 font-medium">Gold</span> extended gains overnight, trading
          near session highs on safe-haven demand ahead of US PCE data release.
        </p>
        <p>
          <span className="text-red-400 font-medium">Crude</span> pulled back 1.2% as OPEC+ signals
          willingness to increase output in Q2.
        </p>
        <p>
          <span className="text-emerald-400 font-medium">Wheat</span> futures firmer on dryness
          concerns in the US Southern Plains; India procurement season underway.
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-white/5">
        <span className="text-xs text-gray-600">AI-generated summary from 47 sources</span>
      </div>
    </div>
  );
}

export function Research() {
  const [query, setQuery] = useState('');

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Research</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about commodities, markets, and macro trends
        </p>
      </div>

      {/* Morning brief */}
      <MorningBriefPanel />

      {/* AI Question area */}
      <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Ask AI</h3>
        </div>

        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What is the correlation between monsoon rainfall and soybean prices in India?"
            className="w-full rounded-lg border border-white/10 bg-gray-800/60 px-4 py-3 pr-12 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            rows={4}
          />
          <button
            className="absolute bottom-3 right-3 rounded-lg bg-purple-500/20 border border-purple-500/30 p-2 text-purple-400 hover:bg-purple-500/30 transition-colors"
            title="Send query"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Placeholder response area */}
        <div className="mt-4 rounded-lg border border-dashed border-white/10 bg-gray-900/30 p-6 text-center">
          <Sparkles className="h-8 w-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            AI-powered research assistant coming soon. Will support commodity analysis, correlation
            studies, and macro event interpretation.
          </p>
        </div>
      </div>
    </div>
  );
}
