import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  AlertCircle,
  ExternalLink,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Radio,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarketEvent } from '../types';

export interface TriggeredNewsAlert {
  id: string;
  event: MarketEvent;
  newsTitle?: string;
  newsContent?: string;
  sourceName?: string;
  sourceUrl?: string;
  triggeredAt: Date;
}

interface BreakingNewsAlertPopupProps {
  alerts: TriggeredNewsAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onOpenEventDetail: (event: MarketEvent) => void;
  onOpenChart?: (symbol: string) => void;
  onOpenTriggerModal?: () => void;
}

export const BreakingNewsAlertPopup: React.FC<BreakingNewsAlertPopupProps> = ({
  alerts,
  onDismiss,
  onDismissAll,
  onOpenEventDetail,
  onOpenChart,
  onOpenTriggerModal,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Strictly 1 news = 1 popup (only the newest alert is displayed)
  const activeAlert = alerts[0] || null;

  // Auto-dismiss countdown timer (10 seconds) cleanly scheduled via setTimeout
  useEffect(() => {
    if (!activeAlert || isHovered) return;

    const timer = setTimeout(() => {
      onDismiss(activeAlert.id);
    }, 10000);

    return () => clearTimeout(timer);
  }, [activeAlert?.id, isHovered, onDismiss]);

  if (!activeAlert) return null;

  const { event, sourceName } = activeAlert;
  const isCritical = event.impact_level === 'CRITICAL';
  const isHigh = event.impact_level === 'HIGH';

  const primaryAsset = event.affected_assets?.[0] || event.affected_currencies?.[0] || 'FX';

  return (
    <div
      className="fixed top-16 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 pointer-events-auto font-mono"
      id="breaking-news-alert-popup"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        key={activeAlert.id}
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.95 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className={`relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md text-slate-100 ${
          isCritical
            ? 'bg-slate-950/95 border-rose-500/80 shadow-rose-950/50 ring-1 ring-rose-500/30'
            : isHigh
            ? 'bg-slate-950/95 border-amber-500/80 shadow-amber-950/50 ring-1 ring-amber-500/30'
            : 'bg-slate-950/95 border-cyan-500/70 shadow-cyan-950/50 ring-1 ring-cyan-500/30'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCritical ? 'bg-rose-400' : isHigh ? 'bg-amber-400' : 'bg-cyan-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-cyan-500'
              }`} />
            </span>
            <span className="text-[10px] font-extrabold tracking-wider text-slate-200">
              TRIGER BERITA OTOMATIS
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Impact Badge */}
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider border ${
                isCritical
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : isHigh
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}
            >
              {event.impact_level || 'HIGH'} IMPACT
            </span>

            {/* Close Button */}
            <button
              onClick={() => onDismiss(activeAlert.id)}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Alert"
              id="close-alert-toast-btn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 space-y-2.5">
          {/* Category & Source Metadata */}
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
              {event.primary_category || 'MACRO'}
            </span>
            <div className="flex items-center gap-1.5 truncate max-w-[210px]">
              {(sourceName?.toLowerCase().includes('telegram') || sourceName?.toLowerCase().includes('wire')) ? (
                <span className="flex items-center gap-1 text-sky-400 font-semibold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50 truncate">
                  <Send className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                  <span className="truncate">{sourceName || 'Telegram Wire'}</span>
                </span>
              ) : (
                <span className="truncate text-slate-400">
                  {sourceName || event.source_names?.[0] || 'Terminal Wire'}
                </span>
              )}
              {activeAlert.sourceUrl && (
                <a
                  href={activeAlert.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-sky-300 transition shrink-0 p-0.5"
                  title="Lihat pesan asli di Telegram"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <span className="text-slate-500 shrink-0">• Baru saja</span>
            </div>
          </div>

          {/* News Headline */}
          <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug line-clamp-2 hover:text-cyan-300 transition cursor-pointer"
              onClick={() => onOpenEventDetail(event)}>
            {event.title}
          </h4>

          {/* News Summary Snippet */}
          {event.summary && (
            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
              {event.summary}
            </p>
          )}

          {/* Affected Pairs & Currencies Pills */}
          {((event.affected_assets && event.affected_assets.length > 0) ||
            (event.affected_currencies && event.affected_currencies.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[9px] font-semibold text-slate-400">PASANGAN/ASET:</span>
              {event.affected_assets?.slice(0, 4).map(asset => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => onOpenChart?.(asset)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 hover:bg-cyan-950/80 text-cyan-300 border border-slate-700 hover:border-cyan-500/60 transition cursor-pointer flex items-center gap-0.5"
                  title={`Buka Grafik TV ${asset}`}
                >
                  <span>{asset}</span>
                  <BarChart2 className="w-2.5 h-2.5 opacity-70" />
                </button>
              ))}

              {event.affected_currencies?.slice(0, 3).map(curr => (
                <span
                  key={curr}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-300 border border-slate-800"
                >
                  {curr}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                onOpenEventDetail(event);
                onDismiss(activeAlert.id);
              }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30"
              id="alert-view-detail-btn"
            >
              <span>Buka Analisis Detail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {activeAlert.sourceUrl && (
              <a
                href={activeAlert.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/70 font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                title="Buka postingan asli di Telegram"
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline text-[11px]">Telegram</span>
              </a>
            )}

            {primaryAsset && onOpenChart && (
              <button
                type="button"
                onClick={() => {
                  onOpenChart(primaryAsset);
                  onDismiss(activeAlert.id);
                }}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                title={`Buka Chart ${primaryAsset}`}
                id="alert-view-chart-btn"
              >
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Chart</span>
              </button>
            )}

            {onOpenTriggerModal && (
              <button
                type="button"
                onClick={onOpenTriggerModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 border border-slate-700 transition cursor-pointer"
                title="Buka Pengaturan Auto-Trigger"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dismiss Progress Bar */}
        <div className="h-1 w-full bg-slate-900 overflow-hidden">
          <motion.div
            key={activeAlert.id}
            initial={{ width: '100%' }}
            animate={{ width: isHovered ? undefined : '0%' }}
            transition={{ duration: 10, ease: 'linear' }}
            className={`h-full ${
              isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
        </div>
      </motion.div>
    </div>
  );
};
