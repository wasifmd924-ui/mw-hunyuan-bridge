import { useState } from 'react';
import { Converter } from './components/Converter';
import { Header, type NavTab } from './components/Header';
import { About } from './pages/About';
import { Home } from './pages/Home';
import { HowItWorks } from './pages/HowItWorks';
import { SupportedFormats } from './pages/SupportedFormats';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  const handleNavigate = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090B10] text-[#F5F7FA]">
      <Header activeTab={activeTab} onNavigate={handleNavigate} />

      <main className="flex-1">
        {activeTab === 'home' && (
          <Home onHowItWorks={() => handleNavigate('how-it-works')} />
        )}
        {activeTab === 'converter' && <Converter />}
        {activeTab === 'how-it-works' && <HowItWorks />}
        {activeTab === 'formats' && <SupportedFormats />}
        {activeTab === 'about' && <About />}
      </main>

      <footer className="border-t border-white/8 bg-[#090B10] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-[#929BAA] sm:flex-row sm:px-6 sm:text-left">
          <div>
            <span className="font-semibold text-[#F5F7FA]">MW HUNYUAN BRIDGE</span> — Developed by{' '}
            <span className="text-[#6B9FFF]">MW Studio</span>
          </div>
          <div>
            100% Client-Side Browser Conversion • Zero Server Uploads • COLLADA 1.4.1
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

