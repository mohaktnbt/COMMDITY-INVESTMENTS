import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { CommodityDetail } from './pages/CommodityDetail';
import { IndiaHub } from './pages/IndiaHub';
import { GlobalMap } from './pages/GlobalMap';
import { Alerts } from './pages/Alerts';
import { Research } from './pages/Research';
import { Settings } from './pages/Settings';
import { MorningBrief } from './pages/MorningBrief';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/commodity/:symbol" element={<CommodityDetail />} />
      <Route path="/india" element={<IndiaHub />} />
      <Route path="/map" element={<GlobalMap />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/research" element={<Research />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/brief" element={<MorningBrief />} />
    </Routes>
  );
}
