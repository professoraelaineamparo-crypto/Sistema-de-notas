import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TableProperties,
  CheckSquare,
  BookOpenCheck,
  UserCheck,
  Users,
  ShieldAlert,
  Lock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  ChevronDown,
  Check
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'grade-map'
  | 'attendance'
  | 'lessons'
  | 'student-list'
  | 'incidents'
  | 'reports'
  | 'management';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  studentCount: number;
  incidentCount?: number;
  isAdmin?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  studentCount,
  incidentCount,
  isAdmin = false
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'overview',
      label: 'Visão Geral & Gráficos',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />
    },
    {
      id: 'grade-map',
      label: 'Mapa de Notas',
      icon: <TableProperties className="w-4 h-4 shrink-0" />,
      badge: `${studentCount} alunos`
    },
    {
      id: 'attendance',
      label: 'Chamada Diária',
      icon: <CheckSquare className="w-4 h-4 shrink-0" />
    },
    {
      id: 'lessons',
      label: 'Diário de Conteúdos',
      icon: <BookOpenCheck className="w-4 h-4 shrink-0" />
    },
    {
      id: 'student-list',
      label: 'Lista da Turma',
      icon: <Users className="w-4 h-4 shrink-0" />
    },
    {
      id: 'incidents',
      label: 'Ocorrências',
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
      badge: incidentCount && incidentCount > 0 ? incidentCount : undefined
    },
    {
      id: 'reports',
      label: 'Boletim Individual',
      icon: <UserCheck className="w-4 h-4 shrink-0" />
    },
    {
      id: 'management',
      label: isAdmin ? 'Cadastros (Admin)' : 'Cadastros',
      icon: isAdmin ? <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" /> : <Lock className="w-4 h-4 text-slate-400 shrink-0" />,
      badge: isAdmin ? 'Admin' : 'Restrito'
    }
  ];

  // Check scroll boundary to show/hide arrows and gradients
  const checkScrollState = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    checkScrollState();

    const handleResize = () => checkScrollState();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScrollState]);

  // Smooth scroll active tab into view when selected
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    const activeEl = el.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      const containerRect = el.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      // If outside visible bounds, scroll smoothly
      if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
    // Re-check after potential scroll animation
    setTimeout(checkScrollState, 300);
  }, [activeTab, checkScrollState]);

  // Click handler for left/right scroll arrows
  const handleScroll = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const distance = 260;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
    setTimeout(checkScrollState, 250);
  };

  // Enable mouse wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = tabsContainerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      checkScrollState();
    }
  };

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <nav className="bg-white border-b border-slate-200/90 shadow-2xs relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative flex items-center">
        {/* Left Arrow for horizontal scrolling */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            title="Rolar abas para a esquerda"
            aria-label="Rolar abas para a esquerda"
            className="absolute left-1 sm:left-2 z-20 p-1.5 rounded-full bg-white/95 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 shadow-md border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Left Gradient Fade indicator */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-white to-transparent z-10 transition-opacity duration-200 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Main Tabs Container */}
        <div
          ref={tabsContainerRef}
          onScroll={checkScrollState}
          onWheel={handleWheel}
          className="flex-1 flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto thin-scrollbar py-2 px-1 sm:px-2 scroll-smooth"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => {
                  onSelectTab(tab.id);
                  setIsQuickMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-200/80 font-bold ring-1 ring-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-200/60 text-indigo-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          {/* Right end padding so the last item is never cropped against the margin */}
          <div className="w-6 shrink-0" aria-hidden="true" />
        </div>

        {/* Right Gradient Fade indicator */}
        <div
          className={`pointer-events-none absolute right-12 sm:right-14 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white to-transparent z-10 transition-opacity duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Right Arrow for horizontal scrolling */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            title="Rolar abas para a direita"
            aria-label="Rolar abas para a direita"
            className="absolute right-12 sm:right-14 z-20 p-1.5 rounded-full bg-white/95 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 shadow-md border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Quick Menu / All Tabs Dropdown Button */}
        <div className="relative shrink-0 ml-1 sm:ml-2">
          <button
            type="button"
            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
            title="Menu de todas as abas"
            aria-label="Abrir menu com todas as opções"
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isQuickMenuOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Menu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Menu</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isQuickMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick Menu Dropdown Panel */}
          {isQuickMenuOpen && (
            <>
              {/* Overlay Backdrop to close on click outside */}
              <div
                className="fixed inset-0 z-40 bg-black/10"
                onClick={() => setIsQuickMenuOpen(false)}
              />

              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 py-2.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Navegação do Diário
                  </span>
                </div>

                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(tab.id);
                        setIsQuickMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                          {tab.icon}
                        </span>
                        <span className="truncate">{tab.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {tab.badge !== undefined && (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-indigo-200 text-indigo-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                        {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
