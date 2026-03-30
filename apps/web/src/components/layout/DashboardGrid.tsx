import { type ReactNode, useMemo } from 'react';
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  children: ReactNode;
  layouts?: Layouts;
  onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
}

const defaultLayouts: Layouts = {
  lg: [
    { i: 'chart', x: 0, y: 0, w: 8, h: 6, minW: 4, minH: 3 },
    { i: 'watchlist', x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 3 },
    { i: 'news', x: 0, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'correlation', x: 4, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'seasonal', x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
  ],
  md: [
    { i: 'chart', x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'watchlist', x: 6, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
    { i: 'news', x: 0, y: 5, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'correlation', x: 5, y: 5, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'seasonal', x: 0, y: 9, w: 5, h: 4, minW: 3, minH: 3 },
  ],
  sm: [
    { i: 'chart', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'watchlist', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'news', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'correlation', x: 0, y: 12, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'seasonal', x: 0, y: 16, w: 6, h: 4, minW: 3, minH: 3 },
  ],
};

export function DashboardGrid({
  children,
  layouts,
  onLayoutChange,
}: DashboardGridProps) {
  const activeLayouts = useMemo(() => layouts ?? defaultLayouts, [layouts]);

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={activeLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 480 }}
      cols={{ lg: 12, md: 10, sm: 6 }}
      rowHeight={60}
      margin={[8, 8]}
      containerPadding={[8, 8]}
      draggableHandle=".drag-handle"
      onLayoutChange={onLayoutChange}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
