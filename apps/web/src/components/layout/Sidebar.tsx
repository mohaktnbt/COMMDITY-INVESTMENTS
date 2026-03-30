import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Flame,
  Gem,
  Hexagon,
  Wheat,
  Coffee,
  Beef,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Flag,
} from 'lucide-react';
import clsx from 'clsx';
import type { CommodityCategory } from '@commodity-monitor/shared';

interface CategoryItem {
  key: CommodityCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categories: CategoryItem[] = [
  { key: 'energy', label: 'Energy', icon: Flame },
  { key: 'precious_metals', label: 'Precious Metals', icon: Gem },
  { key: 'base_metals', label: 'Base Metals', icon: Hexagon },
  { key: 'agriculture', label: 'Agriculture', icon: Wheat },
  { key: 'softs', label: 'Softs', icon: Coffee },
  { key: 'livestock', label: 'Livestock', icon: Beef },
  { key: 'indices', label: 'Indices', icon: BarChart3 },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommodityCategory | null>(null);
  const location = useLocation();
  const onCategoryChange = setActiveCategory;

  return (
    <aside
      className={clsx(
        'flex flex-col h-full border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[var(--border-color)]">
        {!collapsed && (
          <span className="text-sm font-semibold text-[var(--accent-cyan)] tracking-wide uppercase">
            Categories
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded hover:bg-[var(--bg-panel-hover)] text-[var(--text-secondary)]"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Category list */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {categories.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={clsx(
              'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors',
              activeCategory === key
                ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-r-2 border-[var(--accent-cyan)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)]',
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-[var(--border-color)] py-2">
        <Link
          to="/india"
          className={clsx(
            'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
            location.pathname === '/india'
              ? 'text-[var(--accent-cyan)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)]',
          )}
        >
          <Flag className="w-5 h-5 shrink-0" />
          {!collapsed && <span>India</span>}
        </Link>
        <Link
          to="/map"
          className={clsx(
            'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
            location.pathname === '/map'
              ? 'text-[var(--accent-cyan)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)]',
          )}
        >
          <MapPin className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Map</span>}
        </Link>
      </div>
    </aside>
  );
}
