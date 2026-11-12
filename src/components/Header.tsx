import { useState } from 'react';
import { Menu, ShieldCheck, X } from 'lucide-react';

export type NavTab = 'home' | 'converter' | 'how-it-works' | 'formats' | 'about';

interface HeaderProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'converter', label: 'Converter' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'formats', label: 'Supported Formats' },
  { id: 'about', label: 'About' },
];

export function Header({ activeTab, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (tab: NavTab) => {
    onNavigate(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090B10]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 text-left transition-opacity hover:opacity-90"
        >
          <img src="/logo.svg" alt="MW Studio Logo" className="h-9 w-9 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide text-[#F5F7FA] sm:text-base">
                MW HUNYUAN BRIDGE
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-wider text-[#929BAA] uppercase">
              MW Studio
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#4285FF]/15 text-[#6B9FFF]'
                    : 'text-[#929BAA] hover:bg-white/5 hover:text-[#F5F7FA]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 rounded-full border border-[#20C997]/25 bg-[#20C997]/10 px-3 py-1 text-xs font-medium text-[#20C997] lg:flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>100% Local Browser Processing</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg border border-white/10 p-2 text-[#929BAA] hover:text-[#F5F7FA] md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/8 bg-[#11151D] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#4285FF]/15 text-[#6B9FFF]'
                      : 'text-[#929BAA] hover:bg-white/5 hover:text-[#F5F7FA]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

