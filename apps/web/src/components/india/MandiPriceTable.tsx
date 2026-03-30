import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { MandiPrice } from '@commodity-monitor/shared';

interface MandiPriceTableProps {
  data: MandiPrice[];
}

type SortField = keyof MandiPrice;
type SortDir = 'asc' | 'desc';

export function MandiPriceTable({ data }: MandiPriceTableProps) {
  const [sortField, setSortField] = useState<SortField>('market');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return copy;
  }, [data, sortField, sortDir]);

  const columns: { key: SortField; label: string }[] = [
    { key: 'market', label: 'Market' },
    { key: 'commodity', label: 'Commodity' },
    { key: 'variety', label: 'Variety' },
    { key: 'minPrice', label: 'Min Price' },
    { key: 'maxPrice', label: 'Max Price' },
    { key: 'modalPrice', label: 'Modal Price' },
    { key: 'arrivalDate', label: 'Date' },
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ArrowUpDown className="h-3 w-3 text-gray-600" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-emerald-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-400" />
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 bg-gray-800/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    <SortIcon field={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No mandi price data available
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={`${row.market}-${row.commodity}-${row.arrivalDate}-${i}`}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{row.market}</td>
                  <td className="px-4 py-3 text-gray-300">{row.commodity}</td>
                  <td className="px-4 py-3 text-gray-400">{row.variety}</td>
                  <td className="px-4 py-3 text-red-400 font-mono">
                    {row.minPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-mono">
                    {row.maxPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-amber-400 font-mono font-semibold">
                    {row.modalPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{row.arrivalDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
