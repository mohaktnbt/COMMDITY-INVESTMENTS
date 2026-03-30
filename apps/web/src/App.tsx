import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { StatusBar } from './components/layout/StatusBar';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-4">
            <AppRouter />
          </main>
          <StatusBar />
        </div>
      </div>
    </BrowserRouter>
  );
}
