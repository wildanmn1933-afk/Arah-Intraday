import React, { useState, useMemo } from 'react';
import {
  ArahMarketTodayData,
  IntradayPairConfluence,
  TripleConfluenceStatus,
  IntermarketSpreadItem,
} from '../types';
import {
  Target,
  RefreshCw,
  Clock,
  Compass,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  GitMerge,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { getCurrencyFlagUrl } from '../lib/assets';

interface ArahMarketViewProps {
  data: ArahMarketTodayData | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onOpenChart: (symbol: string) => void;
}

export const ArahMarketView: React.FC<ArahMarketViewProps> = ({
  data,
  isLoading,
  onRefresh,
  isRefreshing,
  onOpenChart,
}) => {
  const [selectedPairFilter, setSelectedPairFilter] = useState<'ALL' | 'HIGH_CONVICTION' | 'MODERATE' | 'CAUTION'>('ALL');
  const [activeSpreadTab, setActiveSpreadTab] = useState<string>('all');
  const [selectedPairDetail, setSelectedPairDetail] = useState<IntradayPairConfluence | null>(null);

  // Filter pairs based on selector
  const filteredPairs = useMemo(() => {
    if (!data?.pairs) return [];
    if (selectedPairFilter === 'HIGH_CONVICTION') {
      return data.pairs.filter(p => p.confluenceStatus === 'HIGH_CONVICTION');
    }
    if (selectedPairFilter === 'MODERATE') {
      return data.pairs.filter(p => p.confluenceStatus === 'MODERATE');
    }
    if (selectedPairFilter === 'CAUTION') {
      return data.pairs.filter(p => p.confluenceStatus === 'CAUTION_TRAP' || p.confluenceStatus === 'NEUTRAL_CHOP');
    }
    return data.pairs;
  }, [data, selectedPairFilter]);

  if (isLoading && !data) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono">Memuat Sintesis Arah Market Hari Ini...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-800 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Data Arah Market Belum Tersedia</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Sistem sedang menyelaraskan pilar data fundamental, intermarket, dan harga sesi.
        </p>
        <button
          onClick={onRefresh}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  const { activeSession, sessionStatusText, globalRegime, intermarketSpreads, anomalyAlerts, pairs } = data;

  const getConfluenceBadge = (status: TripleConfluenceStatus) => {
    switch (status) {
      case 'HIGH_CONVICTION':
        return {
          label: '3/3 KEYAKINAN TINGGI',
          bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
          dot: 'bg-emerald-400',
        };
      case 'MODERATE':
        return {
          label: '2/3 KONFLUENSI SEDANG',
          bg: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80',
          dot: 'bg-cyan-400',
        };
      case 'CAUTION_TRAP':
        return {
          label: '1/3 WASPADA / POTENSI JEBAKAN',
          bg: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'NEUTRAL_CHOP':
      default:
        return {
          label: 'ARUS CAMPURAN / TANPA ARAH',
          bg: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & SESSION BAROMETER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>KONFLUENSI TRIPEL INTRADAY</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="font-bold text-white">{activeSession} SESI</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>ARAH MARKET HARI INI</span>
              <Target className="w-5 h-5 text-cyan-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {sessionStatusText} — Mengintegrasikan arah fundamental, transmisi intermarket (yields & DXY), serta struktur pergerakan harga sesi berjalan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono font-semibold text-slate-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>Sinkronkan Sesi</span>
            </button>
          </div>
        </div>

        {/* Global Regime Banner */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                  GLOBAL INTRADAY REGIME
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${globalRegime.badgeColor}`}>
                  {globalRegime.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {globalRegime.summaryNarrative}
              </p>
            </div>

            {globalRegime.topCatalystHeadline && (
              <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center gap-2 text-[11px] text-slate-400">
                <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  <strong className="text-slate-200">Katalis Penggerak:</strong> {globalRegime.topCatalystHeadline}
                </span>
              </div>
            )}
          </div>

          {/* DXY Session Open Position & Risk Gauge */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                <span className="uppercase font-bold">DXY vs Session Open:</span>
                <span className={`font-black px-1.5 py-0.2 rounded ${
                  globalRegime.dxyBiasVsOpen === 'ABOVE_OPEN'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {globalRegime.dxyBiasVsOpen === 'ABOVE_OPEN' ? '▲ DI ATAS OPEN (DOLLAR BULLISH)' : '▼ DI BAWAH OPEN (DOLLAR BEARISH)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Posisi DXY relatif terhadap harga pembukaan sesi menentukan arah tarikan gravitasi seluruh pasangan valuta mayor.
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Skor Selera Risiko:</span>
              <span className={`font-bold ${globalRegime.riskScore > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {globalRegime.riskScore > 0 ? `+${globalRegime.riskScore}` : globalRegime.riskScore} / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERMARKET SPREAD ENGINE & ANOMALY ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Anomaly Alerts Strip (1 col on large) */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>RADAR ANOMALI SESI</span>
            </div>
            {anomalyAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                  alert.severity === 'WARNING'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                }`}
              >
                <div className="font-bold text-[11px] leading-tight flex items-center gap-1">
                  <span>{alert.title}</span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90">
                  {alert.description}
                </p>
                <div className="pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-300">
                  <strong className="text-white">Panduan:</strong> {alert.actionAdvice}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1">
            *Deteksi anomali memfilter jebakan likuiditas (*fakeouts*).
          </div>
        </div>

        {/* 4 Intermarket Spreads Cards (3 cols on large) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {intermarketSpreads.map(spread => (
            <div
              key={spread.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="font-bold uppercase tracking-wider">{spread.formulaLabel}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                    {spread.targetPair}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-200 truncate mb-1.5" title={spread.name}>
                  {spread.name}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-mono font-black text-white">
                    {spread.currentValue > 0 ? `+${spread.currentValue}` : spread.currentValue}{spread.unit}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${spread.changeSessionBps >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {spread.changeSessionBps >= 0 ? `+${spread.changeSessionBps} bps` : `${spread.changeSessionBps} bps`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/70 text-[10px] text-slate-400 leading-snug">
                {spread.interpretation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PRIMARY CONFLUENCE PAIRS BOARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-lg">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Papan Konfluensi Pasangan Intraday</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredPairs.length} instrumen aktif)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Setiap aset dianalisis melalui 3 saringan: Fundamental, Intermarket, dan Struktur Price Action.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedPairFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition ${
                selectedPairFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Semua ({pairs.length})
            </button>
            <button
              onClick={() => setSelectedPairFilter('HIGH_CONVICTION')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition ${
                selectedPairFilter === 'HIGH_CONVICTION'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              3/3 Keyakinan Tinggi
            </button>
            <button
              onClick={() => setSelectedPairFilter('MODERATE')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition ${
                selectedPairFilter === 'MODERATE'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              2/3 Sedang
            </button>
            <button
              onClick={() => setSelectedPairFilter('CAUTION')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition ${
                selectedPairFilter === 'CAUTION'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Waspada / Jebakan
            </button>
          </div>
        </div>

        {/* Pair Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {filteredPairs.map(p => {
            const badge = getConfluenceBadge(p.confluenceStatus);
            const isBullish = p.directionalBias.includes('BULLISH');
            const isBearish = p.directionalBias.includes('BEARISH');

            // Flag URLs for dual currencies
            const c1 = p.pair.length === 6 ? p.pair.slice(0, 3) : null;
            const c2 = p.pair.length === 6 ? p.pair.slice(3, 6) : null;

            return (
              <div
                key={p.pair}
                className="rounded-xl border border-slate-800 bg-slate-950/90 hover:border-slate-700/80 transition-all duration-200 p-3.5 flex flex-col justify-between group shadow-sm hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Top Bar: Flags, Pair, & Bias Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {c1 && c2 && (
                        <div className="flex items-center -space-x-1 shrink-0">
                          <img
                            src={getCurrencyFlagUrl(c1)}
                            alt={c1}
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-2.5 object-cover rounded-xs border border-slate-900 shadow-xs"
                          />
                          <img
                            src={getCurrencyFlagUrl(c2)}
                            alt={c2}
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-2.5 object-cover rounded-xs border border-slate-900 shadow-xs"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-black font-mono text-white group-hover:text-cyan-300 transition">
                          {p.pair}
                        </h3>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {p.displayName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">
                        {p.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                      </div>
                      <div className={`text-[10px] font-mono font-bold ${p.change24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.change24hPct >= 0 ? `+${p.change24hPct.toFixed(2)}%` : `${p.change24hPct.toFixed(2)}%`}
                      </div>
                    </div>
                  </div>

                  {/* Confluence Status Banner */}
                  <div className={`mb-3 px-2 py-1 rounded-md border text-[10px] font-mono font-bold flex items-center justify-between ${badge.bg}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </div>
                    <span className="font-extrabold">{p.convictionScore}%</span>
                  </div>

                  {/* 3 Pillars Breakdown */}
                  <div className="space-y-1.5 mb-3 text-[11px] font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    {/* Fundamental */}
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-slate-400 text-[10px] shrink-0">1. FUNDAMENTAL:</span>
                      <span className={`text-[10px] font-bold text-right truncate ${
                        p.fundamental.bias === 'BULLISH' ? 'text-emerald-300' : p.fundamental.bias === 'BEARISH' ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {p.fundamental.bias}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight mb-1">
                      {p.fundamental.keyDriver}
                    </div>

                    {/* Intermarket */}
                    <div className="flex items-start justify-between gap-1 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 text-[10px] shrink-0">2. INTERMARKET:</span>
                      <span className={`text-[10px] font-bold text-right truncate ${
                        p.intermarket.bias === 'BULLISH' ? 'text-emerald-300' : p.intermarket.bias === 'BEARISH' ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {p.intermarket.bias}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight mb-1">
                      {p.intermarket.primarySymptom}
                    </div>

                    {/* Price Action */}
                    <div className="flex items-start justify-between gap-1 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 text-[10px] shrink-0">3. AKSI HARGA:</span>
                      <span className={`text-[10px] font-bold text-right truncate ${
                        p.priceAction.bias === 'BULLISH' ? 'text-emerald-300' : p.priceAction.bias === 'BEARISH' ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {p.priceAction.bias}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                      {p.priceAction.actionableZone}
                    </div>
                  </div>
                </div>

                {/* Bottom Gameplan & Actions */}
                <div className="pt-2 border-t border-slate-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Rencana Intraday:</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      p.intradayPlan.recommendedAction === 'LOOK_FOR_BUY'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : p.intradayPlan.recommendedAction === 'LOOK_FOR_SELL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {p.intradayPlan.recommendedAction.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChart(p.tvSymbol || p.pair)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-700/60 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Buka Chart</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
