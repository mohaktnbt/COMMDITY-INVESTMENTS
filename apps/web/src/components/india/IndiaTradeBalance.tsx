import { Scale } from 'lucide-react';

export function IndiaTradeBalance() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[300px] gap-4">
      <Scale className="h-12 w-12 text-violet-400/60" />
      <h2 className="text-lg font-semibold text-white">India Trade Balance</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Import/export balance for key commodities including crude oil, gold, and agricultural products. Coming soon.
      </p>
    </div>
  );
}
