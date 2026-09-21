import React, { useState, useMemo } from 'react';
import { translateCategory, translateFilter, translateStatus } from '../lib/statusLabels';
import {
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  Radio,
  RefreshCw,
  Sparkles,
  Flame,
  Clock,
  ChevronRight,
  LineChart,
  Newspaper,
  Target,
} from 'lucide-react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  IntradayAssetBias,
  TodayCatalyst,
} from '../types';
import { CurrencyStrengthWidget } from './CurrencyStrengthWidget';
import { MarketDataGrid } from './MarketDataGrid';
import { ExecutiveMarketBrief } from './ExecutiveMarketBrief';
import { NavTabId } from './Sidebar';
import { CATEGORY_HERO_IMAGES, getCurrencyFlagUrl } from '../lib/assets';

interface OverviewDashboardProps {
  intradayMap: IntradayAssetBias[];
  todayCatalysts: TodayCatalyst[];
  prices: MarketPrice[];
  strengths: CurrencyStrength[];
  events: MarketEvent[];
  calendar: EconomicEvent[];
  overview: AIAnalysis | null;
  watchlistSymbols: string[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string | null) => void;
  onNavigateTab: (tab: NavTabId) => void;
  onToggleWatchlist: (symbol: string, assetType: string) => void;
  onOpenChart: (symbol: string) => void;
  onSelectEvent: (eventId: string) => void;
  onRefreshPrices: () => Promise<void>;
  isRefreshingPrices: boolean;
  onRefreshCS: () => Promise<void>;
  isRefreshingCS: boolean;
  onSyncWire: () => Promise<void>;
  isSyncingWire: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  intradayMap,
  todayCatalysts,
  prices,
  strengths,
  events,
  calendar,
  overview,
  watchlistSymbols,
  selectedSymbol,
  onSelectSymbol,
  onNavigateTab,
  onToggleWatchlist,
  onOpenChart,
  onSelectEvent,
  onRefreshPrices,
  isRefreshingPrices,
  onRefreshCS,
  isRefreshingCS,
  onSyncWire,
  isSyncingWire,
}) => {
  // Top News wire toggle: News wire vs Economic calendar
  const [newsFeedTab, setNewsFeedTab] = useState<'news' | 'calendar'>('news');
  // News impact filter: default to HIGH impact so traders see accurate pair impacts
  const [wireImpactFilter, setWireImpactFilter] = useState<'HIGH' | 'ALL'>('HIGH');

  // High impact filtered events (CRITICAL + HIGH)
  const highImpactEvents = useMemo(() => {
    return events.filter(e => e.impact_level === 'CRITICAL' || e.impact_level === 'HIGH');
  }, [events]);

  const wireDisplayEvents = useMemo(() => {
    if (wireImpactFilter === 'HIGH') {
      return highImpactEvents;
    }
    return events;
  }, [wireImpactFilter, highImpactEvents, events]);

  // Executive KPI calculations
  const kpiStats = useMemo(() => {
    let strongest: CurrencyStrength | null = null;
    let weakest: CurrencyStrength | null = null;
    if (strengths && strengths.length > 0) {
      const sorted = [...strengths].sort((a, b) => b.strength_score - a.strength_score);
      strongest = sorted[0];
      weakest = sorted[sorted.length - 1];
    }

    const bullishCount = intradayMap.filter(a => a.overall_bias === 'BULLISH').length;
    const bearishCount = intradayMap.filter(a => a.overall_bias === 'BEARISH').length;

    let overallRegime = 'BALANCED / ROTATIONAL';
    let regimeColor = 'text-amber-300';
    let regimeBadge = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    if (bullishCount >= 7) {
      overallRegime = 'RISK-ON DOMINAN';
      regimeColor = 'text-emerald-400';
      regimeBadge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
    } else if (bearishCount >= 7) {
      overallRegime = 'DEFENSIVE / RISK-OFF';
      regimeColor = 'text-rose-400';
      regimeBadge = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
    }

    const upcomingHigh = calendar.find(
      c => c.status === 'UPCOMING' && (c.impact === 'CRITICAL' || c.impact === 'HIGH')
    );

    return {
      strongest,
      weakest,
      bullishCount,
      bearishCount,
      overallRegime,
      regimeColor,
      regimeBadge,
      upcomingHigh,
    };
  }, [strengths, intradayMap, calendar]);

  return (
    <div className="space-y-3.5" id="terminal-overview-dashboard">
      {/* ======================================================== */}
      {/* 0. PROFESSIONAL WELCOME & MACRO SURVEILLANCE HERO BANNER */}
      {/* ======================================================== */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
        {/* Latar grid teknikal + glow, konsisten dengan halaman publik */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }}
          />
          <div className="absolute -top-20 -right-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/85 to-slate-900/70" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Banner Content Container */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left Content Column */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-[11px] font-medium font-sans">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Pengawasan Pasar Live
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[11px] font-medium font-sans">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Telemetri Makro Aktif
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Portal Intelijen & Analisis Makro Pasar Finansial
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Pantau disparitas mata uang G8, arah bias 14 instrumen utama hari ini, dan transmisi intermarket obligasi, emas, saham, serta minyak secara real-time.
            </p>

            {/* Quick Navigation Action Pills */}
            <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => onNavigateTab('arah_market')}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black transition shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer border border-cyan-400/40"
              >
                <Target className="w-3.5 h-3.5" />
                <span>ARAH MARKET HARI INI</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-950 text-cyan-300 font-mono font-bold">BARU</span>
              </button>
              <button
                onClick={() => onNavigateTab('terminal')}
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Peta Pasar 14 Aset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('currency')}
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kekuatan G8</span>
              </button>
              <button
                onClick={() => onNavigateTab('intermarket')}
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Aliran Intermarket</span>
              </button>
            </div>
          </div>

          {/* Right Highlight Box: Top Currency Winner & Loser at a Glance */}
          <div className="shrink-0 bg-slate-950/80 backdrop-blur-xs border border-slate-800 rounded-xl p-4 space-y-3 min-w-[260px]">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-850">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Disparitas Sesi Ini
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">PEMBARUAN LIVE</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-2">
                  {kpiStats.strongest && (
                    <img
                      src={getCurrencyFlagUrl(kpiStats.strongest.currency)}
                      alt={kpiStats.strongest.currency}
                      referrerPolicy="no-referrer"
                      className="w-5 h-3.5 object-cover rounded-xs"
                    />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-100">{kpiStats.strongest?.currency || 'USD'}</span>
                    <span className="text-[10px] text-slate-400 block font-sans">Terkuat (Lead)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  +{kpiStats.strongest?.strength_score.toFixed(1) || '0.0'} pts
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-2">
                  {kpiStats.weakest && (
                    <img
                      src={getCurrencyFlagUrl(kpiStats.weakest.currency)}
                      alt={kpiStats.weakest.currency}
                      referrerPolicy="no-referrer"
                      className="w-5 h-3.5 object-cover rounded-xs"
                    />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-100">{kpiStats.weakest?.currency || 'JPY'}</span>
                    <span className="text-[10px] text-slate-400 block font-sans">Terlemah (Lag)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  {kpiStats.weakest?.strength_score.toFixed(1) || '0.0'} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP EXECUTIVE KPI TELEMETRY STRIP (BLOOMBERG HEADER)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Macro Market Regime */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-cyan-400" />
              <span>REZIM PASAR</span>
            </span>
            <div className={`text-xs font-mono font-bold ${kpiStats.regimeColor}`}>
              {kpiStats.overallRegime}
            </div>
          </div>
          <div className="text-right font-mono text-[10px]">
            <span className={`px-2 py-0.5 rounded font-bold border ${kpiStats.regimeBadge}`}>
              {kpiStats.bullishCount}B / {kpiStats.bearishCount}S
            </span>
          </div>
        </div>

        {/* KPI 2: G8 Divergence Lead */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>G8 LEAD VS LAG</span>
            </span>
            <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-2">
              <span className="text-emerald-400">
                {kpiStats.strongest?.currency || '—'}{' '}
                <span className="text-[11px]">({kpiStats.strongest?.strength_score.toFixed(0)}pt)</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-rose-400">
                {kpiStats.weakest?.currency || '—'}{' '}
                <span className="text-[11px]">({kpiStats.weakest?.strength_score.toFixed(0)}pt)</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('currency')}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-slate-950 border border-slate-800 transition cursor-pointer"
          >
            Matriks →
          </button>
        </div>

        {/* KPI 3: Next Key Catalyst */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5 truncate pr-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>KATALIS TERDEKAT</span>
            </span>
            <div className="text-xs font-mono font-bold text-slate-200 truncate">
              {kpiStats.upcomingHigh ? (
                <span className="flex items-center gap-1.5 truncate">
                  <span className="px-1 py-0.2 rounded bg-slate-800 text-cyan-300 text-[10px]">
                    {kpiStats.upcomingHigh.currency}
                  </span>
                  <span className="truncate">{kpiStats.upcomingHigh.event_name}</span>
                </span>
              ) : (
                <span className="text-slate-400">Tidak ada rilis terdekat</span>
              )}
            </div>
          </div>
          {kpiStats.upcomingHigh && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0 font-semibold">
              {new Date(kpiStats.upcomingHigh.date_time_utc).toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </span>
          )}
        </div>

        {/* KPI 4: Active Intermarket Flow */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>TRANSMISI LINTAS ASET</span>
            </span>
            <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
              <span className="text-indigo-400 font-mono">DXY • XAU • US10Y • SPX</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('intermarket')}
            className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-800/80 transition cursor-pointer"
          >
            Intermarket →
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1.5 CALLOUT BANNER: ARAH MARKET HARI INI                 */}
      {/* ======================================================== */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-cyan-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-mono text-white tracking-wide">
                SEGMEN BARU: ARAH MARKET HARI INI
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950">
                KONFLUENSI TRIPEL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sintesis pilar Fundamental + Intermarket (Yields & DXY) + Price Action tanpa logika kaku.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('arah_market')}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
        >
          <span>Buka Arah Market</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. EXECUTIVE MARKET SYNTHESIS & TRADE ENTRY SIGNALS       */}
      {/*    (KESIMPULAN PASAR HARI INI & SARAN ENTRY PAIR)        */}
      {/* ======================================================== */}
      <ExecutiveMarketBrief
        strengths={strengths}
        intradayMap={intradayMap}
        todayCatalysts={todayCatalysts}
        prices={prices}
        calendar={calendar}
        onOpenChart={onOpenChart}
        onSelectSymbol={onSelectSymbol}
      />

      {/* ======================================================== */}
      {/* 3. TOP SECTION: KABAR TERKINI & MACRO RADAR         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT COLUMN: LIVE FLASH NEWS WIRE (8 COLS) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              {/* Wire Mode Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => setNewsFeedTab('news')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition cursor-pointer ${
                      newsFeedTab === 'news'
                        ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>KABAR TERKINI</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400">
                      {events.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setNewsFeedTab('calendar')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition cursor-pointer ${
                      newsFeedTab === 'calendar'
                        ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>KALENDER EKONOMI</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400">
                      {calendar.length}
                    </span>
                  </button>
                </div>

                {/* News Impact Filter: High Impact Focus vs All */}
                {newsFeedTab === 'news' && (
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                    <button
                      onClick={() => setWireImpactFilter('HIGH')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition cursor-pointer ${
                        wireImpactFilter === 'HIGH'
                          ? 'bg-rose-950/90 text-rose-300 font-bold border border-rose-800/80 shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Saring hanya berita berdampak tinggi (High & Critical) agar korelasi pair akurat"
                    >
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>HANYA DAMPAK TINGGI</span>
                      <span className="text-[8.5px] px-1 rounded bg-rose-900/60 text-rose-200 font-extrabold">
                        {highImpactEvents.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setWireImpactFilter('ALL')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                        wireImpactFilter === 'ALL'
                          ? 'bg-slate-800 text-slate-200 font-bold border border-slate-700'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Tampilkan semua berita tanpa filter dampak"
                    >
                      <span>SEMUA ({events.length})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {newsFeedTab === 'news' ? (
                  <>
                    <button
                      onClick={onSyncWire}
                      disabled={isSyncingWire}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-cyan-300 px-2 py-1 rounded bg-slate-950 border border-slate-800 transition disabled:opacity-50 cursor-pointer"
                      title="Sinkronkan Arus Berita"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingWire ? 'animate-spin text-cyan-400' : ''}`} />
                      <span className="hidden sm:inline">Sinkron</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('events')}
                      className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded bg-slate-950 border border-slate-800 transition cursor-pointer"
                    >
                      <span>Kabar Penuh</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onNavigateTab('macro')}
                    className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded bg-slate-950 border border-slate-800 transition cursor-pointer"
                  >
                    <span>Kalender Penuh</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* HIGH-DENSITY BLOOMBERG WIRE STREAM (5 Rows Max, Instant Scan) */}
            {newsFeedTab === 'news' ? (
               wireDisplayEvents.length === 0 ? (
                 <div className="py-8 px-4 text-center space-y-2 border border-dashed border-slate-800 rounded-lg">
                   <Flame className="w-6 h-6 text-rose-400/60 mx-auto" />
                   <p className="text-xs font-mono text-slate-300">
                     Tidak ada berita {wireImpactFilter === 'HIGH' ? 'High Impact' : ''} saat ini.
                   </p>
                   {wireImpactFilter === 'HIGH' && (
                     <button
                       onClick={() => setWireImpactFilter('ALL')}
                       className="text-xs font-mono text-cyan-400 underline hover:text-cyan-300 cursor-pointer"
                     >
                       Lihat semua berita ({events.length})
                     </button>
                   )}
                 </div>
               ) : (
                 <div className="divide-y divide-slate-800/60 font-mono text-xs">
                   {wireDisplayEvents.slice(0, 5).map(event => {
                     const eventDate = new Date(event.last_updated_at || event.first_detected_at);
                     const eventTime = isNaN(eventDate.getTime())
                       ? 'LIVE'
                       : eventDate.toLocaleTimeString('id-ID', {
                           timeZone: 'Asia/Jakarta',
                           hour12: false,
                           hour: '2-digit',
                           minute: '2-digit',
                         });

                     const isCritical = event.impact_level === 'CRITICAL';
                     const isHigh = event.impact_level === 'HIGH';

                     // Sort pair impacts so that high-confidence directional impacts appear first
                     const sortedPairs = (event.pair_impacts || []).slice().sort((a, b) => {
                       if (a.bias !== 'NEUTRAL' && b.bias === 'NEUTRAL') return -1;
                       if (a.bias === 'NEUTRAL' && b.bias !== 'NEUTRAL') return 1;
                       return 0;
                     });

                     return (
                       <div
                         key={event.id}
                         onClick={() => onSelectEvent(event.id)}
                         className={`py-2.5 px-2 hover:bg-slate-800/50 rounded transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                           isCritical ? 'bg-rose-950/15' : isHigh ? 'bg-amber-950/10' : ''
                         }`}
                       >
                         <div className="flex items-center gap-2 min-w-0">
                           <span className="text-[10px] text-slate-400 font-bold shrink-0">
                             {eventTime}
                           </span>
                           <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                             {event.source_names?.[0] || 'WIRE'}
                           </span>
                           <p className="text-slate-200 font-sans text-xs font-medium truncate" title={event.title}>
                             {event.title}
                           </p>
                         </div>

                         <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                           {/* Correlated Pair Impacts & Directional Bias Badges */}
                           {sortedPairs.slice(0, 2).map(pi => (
                             <span
                               key={pi.pair}
                               className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold border font-mono flex items-center gap-1 ${
                                 pi.bias === 'BULLISH'
                                   ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 shadow-xs'
                                   : pi.bias === 'BEARISH'
                                   ? 'bg-rose-950/90 text-rose-300 border-rose-700/80 shadow-xs'
                                   : 'bg-slate-800 text-slate-400 border-slate-700'
                               }`}
                               title={`${pi.displayName || pi.pair}: ${pi.bias} - ${pi.mechanism || pi.rationale}`}
                             >
                               <span>{pi.pair}</span>
                               <span className="font-extrabold">
                                 {pi.bias === 'BULLISH' ? '▲' : pi.bias === 'BEARISH' ? '▼' : '●'}
                               </span>
                             </span>
                           ))}

                           {/* Category */}
                           <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                             {translateCategory(event.primary_category)}
                           </span>

                           {/* Impact Level Badge */}
                           <span
                             className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold border flex items-center gap-1 ${
                               isCritical
                                 ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-xs shadow-rose-950/50'
                                 : isHigh
                                 ? 'bg-amber-950 text-amber-300 border-amber-700'
                                 : 'bg-slate-800 text-slate-400 border-slate-700'
                             }`}
                           >
                             {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
                             {isCritical ? '⚡ KRITIS' : isHigh ? '🔥 TINGGI' : translateFilter(event.impact_level)}
                           </span>

                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               onSelectEvent(event.id);
                             }}
                             className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1 cursor-pointer"
                           >
                             Periksa
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )
            ) : (
              /* High-density Calendar rows */
              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {calendar.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="py-2.5 px-2 hover:bg-slate-800/50 rounded transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold text-[10px] shrink-0">
                        {item.currency}
                      </span>
                      <span className="text-slate-200 truncate font-sans text-xs">{item.event_name}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                      <span className="text-cyan-400 font-bold">
                        {new Date(item.date_time_utc).toLocaleTimeString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                      <span
                        className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold border ${
                          item.impact === 'CRITICAL' || item.impact === 'HIGH'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {translateFilter(item.impact)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RADAR MAKRO HARI INI & AI SYNTHESIS (4 COLS) */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Today's Key Catalysts (Compact 3 items) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                  RADAR MAKRO HARI INI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('today_catalysts')}
                className="text-[10px] font-mono text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Detail</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {todayCatalysts.slice(0, 3).map(cat => (
                <div
                  key={cat.id}
                  className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[9px] text-cyan-300 px-1 py-0.2 rounded bg-slate-800">
                        {cat.currency}
                      </span>
                      <span className="text-[10px] font-bold text-slate-200 truncate max-w-[140px]">
                        {cat.event_name}
                      </span>
                    </div>
                    <span
                      className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                        cat.status === 'RELEASED'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {translateStatus(cat.status)}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-sans line-clamp-1">
                    <span className="text-cyan-400 font-mono font-semibold text-[9px] mr-1">HASIL:</span>
                    {cat.actual_market_reaction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Macro Synthesis Digest */}
          {overview && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SINTESIS MAKRO AI</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('intelligence')}
                  className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 cursor-pointer"
                >
                  Deep Analysis →
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed line-clamp-2">
                {overview.summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. LOWER SECTION: MARKET SURVEILLANCE & G8 CURRENCY FLOW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT COLUMN: PENGAWASAN PASAR LIVE (8 COLS) */}
        <div className="lg:col-span-8">
          <MarketDataGrid
            prices={prices}
            watchlistSymbols={watchlistSymbols}
            intradayMap={intradayMap}
            onToggleWatchlist={onToggleWatchlist}
            onRefresh={onRefreshPrices}
            isRefreshing={isRefreshingPrices}
            onSelectSymbol={onSelectSymbol}
            onOpenChart={onOpenChart}
          />
        </div>

        {/* RIGHT COLUMN: G8 CURRENCY STRENGTH WITH AUTHENTIC TREND GRAPH (4 COLS) */}
        <div className="lg:col-span-4">
          <CurrencyStrengthWidget
            strengths={strengths}
            onRefresh={onRefreshCS}
            isRefreshing={isRefreshingCS}
            onSelectCurrency={(cur) => onSelectSymbol(cur === selectedSymbol ? null : cur)}
            initialTab="CHART"
          />
        </div>
      </div>
    </div>
  );
};
