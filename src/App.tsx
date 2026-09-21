import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  User,
  UserWatchlist,
  IntradayAssetBias,
  TodayCatalyst,
  ArahMarketTodayData,
} from './types';
import { api, setAuthToken, getAuthToken } from './lib/api';
import { translateCategory } from './lib/statusLabels';
import { useSSE } from './lib/useSSE';

import { Sidebar, NavTabId } from './components/Sidebar';
import { Header } from './components/Header';
import { TickerBar } from './components/TickerBar';
import { EventCard } from './components/EventCard';
import { EventDetailModal } from './components/EventDetailModal';
import { CurrencyStrengthWidget } from './components/CurrencyStrengthWidget';
import { MarketDataGrid } from './components/MarketDataGrid';
import { MacroCalendarView } from './components/MacroCalendarView';
import { AIIntelligenceView } from './components/AIIntelligenceView';
import { AdminPanel } from './components/AdminPanel';
import { WatchlistView } from './components/WatchlistView';
import { TradingViewChartModal } from './components/TradingViewChartModal';
import { IntradayMarketMapView } from './components/IntradayMarketMapView';
import { TodayCatalystsView } from './components/TodayCatalystsView';
import { ArahMarketView } from './components/ArahMarketView';
import { CurrencyPairOpportunityMatrix } from './components/CurrencyPairOpportunityMatrix';
import { IntermarketRelationshipMatrix } from './components/IntermarketRelationshipMatrix';
import { MarketHistoryView } from './components/MarketHistoryView';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PublicLandingPage } from './components/PublicLandingPage';
import { AuthPage } from './components/AuthPage';
import { AutoTriggerNewsModal, AutoTriggerConfig } from './components/AutoTriggerNewsModal';
import { BreakingNewsAlertPopup, TriggeredNewsAlert } from './components/BreakingNewsAlertPopup';
import { soundManager } from './lib/sound';
import {
  useLocation,
  isPublicRoute,
  isPrivateRoute,
  routeToTab,
  tabToRoute,
} from './lib/router';
import { motion, AnimatePresence } from 'motion/react';

import {
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Radio,
  RefreshCw,
  Compass,
  Zap,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Activity,
  BarChart2,
  Flame,
  Filter,
} from 'lucide-react';

export default function App() {
  // Router Location
  const { path, navigate } = useLocation();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTabId>(() => routeToTab(path));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop compact
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartModalSymbol, setChartModalSymbol] = useState<string | null>(null);

  // Core Data Collections (Single Source of Truth)
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [strengths, setStrengths] = useState<CurrencyStrength[]>([]);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [calendar, setCalendar] = useState<EconomicEvent[]>([]);
  const [overview, setOverview] = useState<AIAnalysis | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [intradayMap, setIntradayMap] = useState<IntradayAssetBias[]>([]);
  const [todayCatalysts, setTodayCatalysts] = useState<TodayCatalyst[]>([]);
  const [arahMarketData, setArahMarketData] = useState<ArahMarketTodayData | null>(null);

  // User State
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<UserWatchlist[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  // News impact filter: default to HIGH so traders see high-impact news with accurate pair impacts
  const [impactFilter, setImpactFilter] = useState<'HIGH' | 'CRITICAL' | 'ALL'>('HIGH');

  // Loading & Sync States
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshingCS, setIsRefreshingCS] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isRefreshingMacro, setIsRefreshingMacro] = useState(false);
  const [isRefreshingIntraday, setIsRefreshingIntraday] = useState(false);
  const [isRefreshingCatalysts, setIsRefreshingCatalysts] = useState(false);
  const [isRefreshingArah, setIsRefreshingArah] = useState(false);

  // Auto-Trigger News Configuration & State
  const [autoTriggerConfig, setAutoTriggerConfig] = useState<AutoTriggerConfig>(() => {
    try {
      const saved = localStorage.getItem('arah_auto_trigger_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      enabled: false, // Default to false: rely on real-time Telegram SSE stream
      intervalSeconds: 60,
      minImpact: 'HIGH',
      soundEnabled: true,
      selectedCategory: 'ALL',
    };
  });

  const [isAutoTriggerModalOpen, setIsAutoTriggerModalOpen] = useState(false);
  const [autoTriggerSecondsRemaining, setAutoTriggerSecondsRemaining] = useState(autoTriggerConfig.intervalSeconds);
  const [totalTriggeredCount, setTotalTriggeredCount] = useState(0);
  const [newsAlerts, setNewsAlerts] = useState<TriggeredNewsAlert[]>([]);
  const [isTriggeringNews, setIsTriggeringNews] = useState(false);

  // Set of news and event keys that have ALREADY been shown in a popup
  // Ensures: "1 berita 1 popup saja, jangan terus2an tampilkan popup kalo berita sudah dikirim"
  const seenAlertKeysRef = useRef<Set<string>>(new Set<string>());

  const markAlertAsSeen = useCallback((key: string): boolean => {
    if (!key) return false;
    if (seenAlertKeysRef.current.has(key)) return false;
    seenAlertKeysRef.current.add(key);
    return true;
  }, []);

  // Sync autoTriggerConfig to localStorage
  const handleUpdateAutoTriggerConfig = useCallback((updates: Partial<AutoTriggerConfig>) => {
    setAutoTriggerConfig(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('arah_auto_trigger_config', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (updates.intervalSeconds !== undefined) {
      setAutoTriggerSecondsRemaining(updates.intervalSeconds);
    }
  }, []);

  // Trigger News Immediately (Action or Scheduled Interval)
  const handleTriggerNewsNow = useCallback(async (preset?: {
    category?: string;
    title?: string;
    content?: string;
    affected_assets?: string[];
    affected_currencies?: string[];
  }) => {
    try {
      setIsTriggeringNews(true);
      const res = await api.triggerNews(preset);
      // Only process if news is truly new and not already displayed
      if (res.success && res.event && res.isNew !== false) {
        const alertKey = String(res.news?.id || res.event.id || '');
        if (!markAlertAsSeen(alertKey)) {
          // News has already been shown in a popup. Do not show again!
          return;
        }

        setTotalTriggeredCount(prev => prev + 1);

        // Sound chime if enabled
        if (autoTriggerConfig.soundEnabled) {
          soundManager.playBreakingNewsChime();
        }

        // Single newest alert popup: 1 berita 1 popup saja!
        const newAlert: TriggeredNewsAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event: res.event,
          newsTitle: res.news?.title || res.event.title,
          newsContent: res.news?.content || res.event.summary,
          sourceName: res.news?.source_name || res.event.source_names?.[0],
          sourceUrl: res.news?.source_url,
          triggeredAt: new Date(),
        };

        setNewsAlerts([newAlert]);

        // Update events state
        setEvents(prev => [res.event, ...prev.filter(e => e.id !== res.event.id)]);
      }
    } catch (err) {
      console.error('[AutoTrigger] Error triggering news:', err);
    } finally {
      setIsTriggeringNews(false);
    }
  }, [autoTriggerConfig.soundEnabled, markAlertAsSeen]);

  const handleDismissAlert = useCallback((id: string) => {
    setNewsAlerts([]);
  }, []);

  const handleDismissAllAlerts = useCallback(() => {
    setNewsAlerts([]);
  }, []);

  // Tab change handler that updates route
  const handleTabChange = useCallback((newTab: NavTabId) => {
    setActiveTab(newTab);
    const targetRoute = tabToRoute(newTab);
    if (targetRoute !== path) {
      navigate(targetRoute);
    }
  }, [navigate, path]);

  // Server-Sent Events (SSE) Real-Time Hook - enabled for live stream
  const { status: sseStatus } = useSSE({
    enabled: true,
    onMarketPrices: (updatedPrices: MarketPrice[]) => {
      setPrices(updatedPrices);
      // Auto-recalculate Intraday Market Map on live price ticks
      api.getIntradayMarketMap().then(res => setIntradayMap(res.market_map)).catch(() => {});
    },
    onCurrencyStrength: (updatedStrengths: CurrencyStrength[]) => {
      setStrengths(updatedStrengths);
      api.getIntradayMarketMap().then(res => setIntradayMap(res.market_map)).catch(() => {});
    },
    onNewsIngested: (data: any) => {
      // Refresh event if newly ingested via pipeline
      if (data?.eventId) {
        const alertKey = String(data.news?.id || data.eventId || '');
        if (seenAlertKeysRef.current.has(alertKey)) {
          // Already sent and displayed in popup! Do not re-trigger popup!
          return;
        }

        api.getEventDetail(data.eventId).then(res => {
          if (res.event) {
            setEvents(prev => {
              if (prev.some(e => e.id === res.event.id)) return prev;
              return [res.event, ...prev];
            });

            if (!markAlertAsSeen(alertKey)) return;

            // Trigger popup if matches minimum impact setting or is fresh news
            if (
              autoTriggerConfig.minImpact === 'ALL' ||
              res.event.impact_level === 'CRITICAL' ||
              res.event.impact_level === 'HIGH' ||
              (autoTriggerConfig.minImpact !== 'CRITICAL' && res.event.impact_level === 'MEDIUM')
            ) {
              if (autoTriggerConfig.soundEnabled) {
                soundManager.playBreakingNewsChime();
              }
              const newAlert: TriggeredNewsAlert = {
                id: `alert_sse_${res.event.id}_${Date.now()}`,
                event: res.event,
                newsTitle: data.news?.title || res.event.title,
                newsContent: data.news?.content || res.event.summary,
                sourceName: data.news?.source_name || res.event.source_names?.[0],
                sourceUrl: data.news?.source_url,
                triggeredAt: new Date(),
              };
              // Exactly 1 popup for the latest news
              setNewsAlerts([newAlert]);
            }
          }
        }).catch(() => {});
      }
    },
    onEventUpdated: (updatedEvent: MarketEvent) => {
      // Keep canonical event data fresh in state, but do not generate duplicate popups!
      setEvents(prev => {
        const index = prev.findIndex(e => e.id === updatedEvent.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedEvent;
          return next;
        }
        return [updatedEvent, ...prev];
      });
    },
    onEconomicCalendar: (updatedCalendar: EconomicEvent[]) => {
      setCalendar(updatedCalendar);
      api.getTodayCatalysts().then(res => setTodayCatalysts(res.catalysts)).catch(() => {});
    },
  });

  // Automated Interval Countdown for News Auto-Trigger
  useEffect(() => {
    if (!autoTriggerConfig.enabled) return;

    setAutoTriggerSecondsRemaining(autoTriggerConfig.intervalSeconds);
    const interval = setInterval(() => {
      setAutoTriggerSecondsRemaining(prev => {
        if (prev <= 1) {
          handleTriggerNewsNow();
          return autoTriggerConfig.intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoTriggerConfig.enabled, autoTriggerConfig.intervalSeconds, user, handleTriggerNewsNow]);

  // Initial Data Load for Authenticated Dashboard
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const [mktRes, curRes, evtRes, calRes, sesRes, mapRes, catRes, arahRes] = await Promise.allSettled([
        api.getMarkets(),
        api.getCurrencyStrength(),
        api.getEvents(40),
        api.getEconomicCalendar(200),
        api.getMarketSessions(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
        api.getArahMarketToday(),
      ]);

      if (mktRes.status === 'fulfilled') setPrices(mktRes.value.prices);
      if (curRes.status === 'fulfilled') setStrengths(curRes.value.currency_strength);
      if (evtRes.status === 'fulfilled') setEvents(evtRes.value.events);
      if (calRes.status === 'fulfilled') setCalendar(calRes.value.calendar);
      if (sesRes.status === 'fulfilled') setSessions(sesRes.value.sessions);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
      if (arahRes.status === 'fulfilled' && arahRes.value?.data) setArahMarketData(arahRes.value.data);
    } catch (err) {
      console.warn('Initialization notice:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Check current user session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const meRes = await api.getMe();
          if (isMounted) {
            setUser(meRes.user);
            setWatchlist(meRes.watchlist || []);
            loadInitialData();
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
        setAuthToken(null);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [loadInitialData]);

  // Route enforcement & sync
  useEffect(() => {
    if (isAuthChecking) return;

    if (!user) {
      // Unauthenticated user attempting to access private route -> redirect to /login
      if (isPrivateRoute(path)) {
        navigate('/login', true);
      }
    } else {
      // Authenticated user
      if (path === '/' || path === '/login' || path === '/register') {
        navigate('/dashboard', true);
      } else if (isPrivateRoute(path)) {
        const expectedTab = routeToTab(path);
        if (expectedTab !== activeTab) {
          setActiveTab(expectedTab);
        }
      }
    }
  }, [user, path, isAuthChecking, navigate, activeTab]);

  // Global Ingestion Trigger
  const handleTriggerGlobalSync = async () => {
    try {
      setIsSyncing(true);
      await api.runGlobalIngest();
      // Refetch all active streams
      const [eRes, cRes, mRes, mapRes, catRes] = await Promise.allSettled([
        api.getEvents(40),
        api.getCurrencyStrength(),
        api.getMarkets(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
      ]);
      if (eRes.status === 'fulfilled') setEvents(eRes.value.events);
      if (cRes.status === 'fulfilled') setStrengths(cRes.value.currency_strength);
      if (mRes.status === 'fulfilled') setPrices(mRes.value.prices);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
    } catch (err) {
      console.error('Manual sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Watchlist Toggle
  const handleToggleWatchlist = async (symbol: string, assetType: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const exists = watchlist.some(w => w.symbol === symbol);
    if (exists) {
      await api.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    } else {
      const res = await api.addToWatchlist(symbol, assetType);
      if (res.item) setWatchlist(prev => [...prev, res.item]);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setWatchlist([]);
    navigate('/login');
  };

  const handleAuthSuccess = useCallback(async (u: User) => {
    setUser(u);
    try {
      const me = await api.getMe();
      setUser(me.user);
      setWatchlist(me.watchlist || []);
    } catch (err) {
      console.warn('Profile hydration notice:', err);
    }
    loadInitialData();
    navigate('/dashboard', true);
  }, [loadInitialData, navigate]);

  // Filtered Events for Wire - strictly newest first
  const filteredEvents = useMemo(() => {
    return events
      .filter(e => {
        if (impactFilter === 'HIGH' && e.impact_level !== 'CRITICAL' && e.impact_level !== 'HIGH') {
          return false;
        }
        if (impactFilter === 'CRITICAL' && e.impact_level !== 'CRITICAL') {
          return false;
        }
        if (categoryFilter !== 'ALL' && e.primary_category !== categoryFilter) return false;
        if (selectedSymbol && !e.affected_assets.includes(selectedSymbol) && !e.affected_currencies.includes(selectedSymbol)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchSummary = e.summary.toLowerCase().includes(q);
          const matchSources = e.source_names.some(s => s.toLowerCase().includes(q));
          const matchAssets = e.affected_assets.some(a => a.toLowerCase().includes(q));
          const matchCurrs = e.affected_currencies.some(c => c.toLowerCase().includes(q));
          return matchTitle || matchSummary || matchSources || matchAssets || matchCurrs;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.first_detected_at).getTime() || 0;
        const timeB = new Date(b.first_detected_at).getTime() || 0;
        return timeB - timeA;
      });
  }, [events, impactFilter, categoryFilter, selectedSymbol, searchQuery]);

  const watchlistSymbols = useMemo(() => watchlist.map(w => w.symbol), [watchlist]);

  // Screen 1: Session Verification
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20 animate-pulse">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-base font-bold tracking-wider text-slate-100">
            ARAH <span className="text-cyan-400">MARKET</span>
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Verifying encrypted terminal session...</span>
        </div>
      </div>
    );
  }

  // Screen 2: Unauthenticated Visitor Flow (Public Landing & Auth Pages)
  if (!user) {
    if (path === '/login') {
      return (
        <AuthPage
          mode="login"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/register') {
      return (
        <AuthPage
          mode="register"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/verify-email') {
      return (
        <AuthPage
          mode="verify-email"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/forgot-password') {
      return (
        <AuthPage
          mode="forgot-password"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/reset-password') {
      return (
        <AuthPage
          mode="reset-password"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/magic-link') {
      navigate('/login');
      return null;
    }

    if (path === '/pricing') {
      navigate('/');
      return null;
    }

    // Default Public View for '/', '/features'
    return (
      <PublicLandingPage
        currentPath={path}
        onNavigate={navigate}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Responsive Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        marketMapCount={intradayMap.length || 13}
        catalystsCount={todayCatalysts.length}
        user={user}
        onOpenAuth={() => navigate('/login')}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          sseStatus={sseStatus}
          sessions={sessions}
          onTriggerGlobalSync={handleTriggerGlobalSync}
          isSyncing={isSyncing}
          onToggleMobileMenu={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAutoTriggerModal={() => setIsAutoTriggerModalOpen(true)}
          isAutoTriggerActive={autoTriggerConfig.enabled}
          autoTriggerSecondsRemaining={autoTriggerSecondsRemaining}
        />

        {/* Real-time Ticker Bar */}
        <TickerBar
          prices={prices}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={(sym) => {
            setSelectedSymbol(sym === selectedSymbol ? null : sym);
            if (activeTab !== 'terminal') handleTabChange('terminal');
          }}
          onOpenChart={(sym) => setChartModalSymbol(sym)}
        />

        {/* Active Instrument Filter Strip */}
        {selectedSymbol && (
          <div className="bg-cyan-950/70 border-b border-cyan-800/60 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <span>FILTERED BY INSTRUMENT:</span>
              <strong className="text-white font-bold bg-cyan-900 px-2 py-0.5 rounded">{selectedSymbol}</strong>
              <span className="text-slate-400 hidden sm:inline">Menyoroti agenda dan korelasi makro</span>
            </div>
            <button
              onClick={() => setSelectedSymbol(null)}
              className="text-cyan-400 hover:text-white underline cursor-pointer"
            >
              Clear Filter ×
            </button>
          </div>
        )}

        {/* 3. Primary Views Workspace */}
        <main className="flex-1 p-3 sm:p-4 max-w-[1720px] w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full space-y-4"
            >
          {/* VIEW 1: TERMINAL / OVERVIEW DASHBOARD */}
          {activeTab === 'terminal' && (
            <OverviewDashboard
              intradayMap={intradayMap}
              todayCatalysts={todayCatalysts}
              prices={prices}
              strengths={strengths}
              events={filteredEvents}
              calendar={calendar}
              overview={overview}
              watchlistSymbols={watchlistSymbols}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              onNavigateTab={handleTabChange}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
              onSelectEvent={(id) => setSelectedEventId(id)}
              onRefreshPrices={async () => {
                setIsRefreshingPrices(true);
                await api.refreshMarkets();
                const res = await api.getMarkets();
                setPrices(res.prices);
                setIsRefreshingPrices(false);
              }}
              isRefreshingPrices={isRefreshingPrices}
              onRefreshCS={async () => {
                setIsRefreshingCS(true);
                const res = await api.refreshCurrencyStrength();
                setStrengths(res.currency_strength);
                setIsRefreshingCS(false);
              }}
              isRefreshingCS={isRefreshingCS}
              onSyncWire={async () => {
                setIsSyncing(true);
                const res = await api.getEvents(40);
                setEvents(res.events);
                setIsSyncing(false);
              }}
              isSyncingWire={isSyncing}
            />
          )}

          {/* VIEW 1.5: ARAH MARKET HARI INI (TRIPLE-CONFLUENCE INTRADAY) */}
          {activeTab === 'arah_market' && (
            <ArahMarketView
              data={arahMarketData}
              isLoading={initialLoading}
              onRefresh={async () => {
                setIsRefreshingArah(true);
                try {
                  const res = await api.getArahMarketToday();
                  if (res.data) setArahMarketData(res.data);
                } catch (e) {
                  console.error('Failed to refresh Arah Market:', e);
                } finally {
                  setIsRefreshingArah(false);
                }
              }}
              isRefreshing={isRefreshingArah}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 2: DEDICATED INTRADAY MARKET MAP (14 ASET) */}
          {activeTab === 'intraday_map' && (
            <IntradayMarketMapView
              data={intradayMap}
              prices={prices}
              onRefresh={async () => {
                setIsRefreshingIntraday(true);
                const res = await api.getIntradayMarketMap();
                setIntradayMap(res.market_map);
                setIsRefreshingIntraday(false);
              }}
              isRefreshing={isRefreshingIntraday}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 3: KATALIS UTAMA HARI INIS */}
          {activeTab === 'today_catalysts' && (
            <TodayCatalystsView
              catalysts={todayCatalysts}
              onRefresh={async () => {
                setIsRefreshingCatalysts(true);
                const res = await api.getTodayCatalysts();
                setTodayCatalysts(res.catalysts);
                setIsRefreshingCatalysts(false);
              }}
              isRefreshing={isRefreshingCatalysts}
              onSelectAsset={(sym) => setSelectedSymbol(sym)}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 4: PENGAWASAN PASAR LIVE GRID */}
          {activeTab === 'markets' && (
            <div className="space-y-4">
              <MarketDataGrid
                prices={prices}
                watchlistSymbols={watchlistSymbols}
                intradayMap={intradayMap}
                onToggleWatchlist={handleToggleWatchlist}
                onRefresh={async () => {
                  setIsRefreshingPrices(true);
                  await api.refreshMarkets();
                  const res = await api.getMarkets();
                  setPrices(res.prices);
                  setIsRefreshingPrices(false);
                }}
                isRefreshing={isRefreshingPrices}
                onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                onOpenChart={(sym) => setChartModalSymbol(sym)}
              />
            </div>
          )}

          {/* VIEW: INTERMARKET RELATIONSHIP MATRIX */}
          {activeTab === 'intermarket' && (
            <IntermarketRelationshipMatrix
              prices={prices}
              strengths={strengths}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
              onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
              onRefresh={async () => {
                setIsRefreshingPrices(true);
                setIsRefreshingCS(true);
                try {
                  const [mRes, csRes] = await Promise.all([
                    api.getMarkets(),
                    api.getCurrencyStrength(),
                  ]);
                  setPrices(mRes.prices);
                  setStrengths(csRes.currency_strength);
                } finally {
                  setIsRefreshingPrices(false);
                  setIsRefreshingCS(false);
                }
              }}
              isRefreshing={isRefreshingPrices || isRefreshingCS}
            />
          )}

          {/* VIEW 5: CURRENCY MATRIX */}
          {activeTab === 'currency' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <CurrencyStrengthWidget
                  strengths={strengths}
                  onRefresh={async () => {
                    setIsRefreshingCS(true);
                    const res = await api.refreshCurrencyStrength();
                    setStrengths(res.currency_strength);
                    setIsRefreshingCS(false);
                  }}
                  isRefreshing={isRefreshingCS}
                />
              </div>

              <div className="lg:col-span-7">
                <CurrencyPairOpportunityMatrix
                  strengths={strengths}
                  onOpenChart={(sym) => setChartModalSymbol(sym)}
                  onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                />
              </div>
            </div>
          )}

          {/* VIEW 6: MACRO CALENDAR */}
          {activeTab === 'macro' && (
            <MacroCalendarView
              events={calendar}
              onRefresh={async () => {
                setIsRefreshingMacro(true);
                await api.refreshEconomicCalendar();
                const res = await api.getEconomicCalendar();
                setCalendar(res.calendar);
                setIsRefreshingMacro(false);
              }}
              isRefreshing={isRefreshingMacro}
            />
          )}

          {/* VIEW 7: CANONICAL EVENT WIRE */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>ARUS ENGINE AGENDA TERDEDUPLIKASI</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ONE EVENT → ONE EVENT ID → MULTIPLE SOURCES → MULTIPLE ASET → ONE ANALYSIS
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setIsSyncing(true);
                        const res = await api.getEvents(50);
                        setEvents(res.events);
                        setIsSyncing(false);
                      }}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                      title="Sinkronkan arus berita dengan rilis sumber terbaru"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>Sync Wire</span>
                    </button>

                    <input
                      type="text"
                      placeholder="Cari berita, pair, aset..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono text-slate-200 outline-none w-48 sm:w-60 focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                {/* Filter Controls: Impact Level & Category */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
                  {/* Impact Filter Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold flex items-center gap-1 mr-1">
                      <Filter className="w-3 h-3 text-cyan-400" />
                      <span>Dampak:</span>
                    </span>

                    <button
                      onClick={() => setImpactFilter('HIGH')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        impactFilter === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-sm shadow-rose-950/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title="Tampilkan hanya berita High & Critical impact agar korelasi pair akurat"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>🔥 Dampak Tinggi (Default)</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-900/60 text-rose-200">
                        {events.filter(e => e.impact_level === 'CRITICAL' || e.impact_level === 'HIGH').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setImpactFilter('CRITICAL')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        impactFilter === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border-red-700 shadow-sm shadow-red-950/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title="Tampilkan hanya berita dampak kritis tertinggi (Fed rate, perang, krisis likuiditas)"
                    >
                      <Zap className="w-3.5 h-3.5 text-red-400" />
                      <span>⚡ Hanya Kritis</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-red-900/60 text-red-200">
                        {events.filter(e => e.impact_level === 'CRITICAL').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setImpactFilter('ALL')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium border transition cursor-pointer ${
                        impactFilter === 'ALL'
                          ? 'bg-slate-800 text-slate-100 border-slate-700'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <span>Semua Level ({events.length})</span>
                    </button>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
                    {['ALL', 'MACRO', 'CENTRAL_BANK', 'COMMODITIES', 'GEOPOLITICS', 'CRYPTO'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition cursor-pointer border ${
                          categoryFilter === cat
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {translateCategory(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Impact Mode Explanatory Banner */}
                {impactFilter !== 'ALL' && (
                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 flex items-center justify-between text-xs font-mono text-rose-200">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        <strong className="text-rose-300">Penyaringan High Impact Aktif:</strong> Menampilkan hanya berita katalis penggerak pasar utama (Kebijakan Suku Bunga, Inflasi, Geopolitik, Komoditas) untuk memastikan presisi efek transmisi terhadap pair (XAUUSD, Forex, Indeks).
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline ml-2">
                      {filteredEvents.length} dari {events.length} berita
                    </span>
                  </div>
                )}
              </div>

              {filteredEvents.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <Flame className="w-8 h-8 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300">Tidak ada berita yang cocok dengan filter</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tidak ditemukan berita {impactFilter !== 'ALL' ? `dengan dampak ${impactFilter}` : ''} pada kategori yang dipilih.
                  </p>
                  <button
                    onClick={() => {
                      setImpactFilter('ALL');
                      setCategoryFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono transition cursor-pointer"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEventId(event.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 8: AI INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <AIIntelligenceView
              initialOverview={overview}
              user={user}
            />
          )}

          {/* VIEW 8.5: MARKET HISTORY & PERMANENT MEMORY */}
          {activeTab === 'history' && (
            <MarketHistoryView
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 9: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              prices={prices}
              user={user}
              onOpenAuth={() => navigate('/login')}
              onRemove={async (symbol) => {
                await api.removeFromWatchlist(symbol);
                setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
              }}
              onAdd={async (symbol, assetType) => {
                try {
                  const res = await api.addToWatchlist(symbol, assetType);
                  if (res.item) setWatchlist(prev => [...prev, res.item]);
                } catch (err: any) {
                  alert(err.message || 'Gagal menambahkan ke daftar pantau');
                }
              }}
              onSelectSymbol={(sym) => {
                setSelectedSymbol(sym);
                handleTabChange('terminal');
              }}
            />
          )}

          {/* VIEW 10: ADMIN PANEL */}
          {activeTab === 'admin' && (
            user?.role === 'ADMIN' ? (
              <AdminPanel currentUser={user} />
            ) : (
              <div className="max-w-md mx-auto my-12 p-6 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Akses Dibatasi</h2>
                <p className="text-xs text-slate-400 mt-2">
                  Administrative Telemetry & Feed Orchestration is restricted to system administrators with verified authority.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => handleTabChange('terminal')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition cursor-pointer"
                  >
                    Return to Terminal
                  </button>
                </div>
              </div>
            )
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {/* 5. TradingView Interactive Candlestick Chart Modal */}
      {chartModalSymbol && (
        <TradingViewChartModal
          initialSymbol={chartModalSymbol}
          prices={prices}
          onClose={() => setChartModalSymbol(null)}
        />
      )}

      {/* 6. Real-time Breaking News Alert Popup (Floating Toast / Banner Alert) */}
      <BreakingNewsAlertPopup
        alerts={newsAlerts}
        onDismiss={handleDismissAlert}
        onDismissAll={handleDismissAllAlerts}
        onOpenEventDetail={(event) => setSelectedEventId(event.id)}
        onOpenChart={(sym) => setChartModalSymbol(sym)}
        onOpenTriggerModal={() => setIsAutoTriggerModalOpen(true)}
      />

      {/* 7. Auto-Trigger News Configuration & Action Modal */}
      <AutoTriggerNewsModal
        isOpen={isAutoTriggerModalOpen}
        onClose={() => setIsAutoTriggerModalOpen(false)}
        config={autoTriggerConfig}
        onUpdateConfig={handleUpdateAutoTriggerConfig}
        onTriggerNow={handleTriggerNewsNow}
        isTriggering={isTriggeringNews}
        secondsRemaining={autoTriggerSecondsRemaining}
        totalTriggeredCount={totalTriggeredCount}
      />
    </div>
  );
}
