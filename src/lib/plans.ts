/**
 * Centralized Plan Configuration & Entitlements Definition
 * Single source of truth for Plans, Pricing, Entitlements, and Usage Limits.
 */

export type SubscriptionPlanId = 'FREE' | 'PRO' | 'INSTITUTIONAL';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'none' | 'expired';

export type FeaturePermission =
  | 'MARKET_RADAR'              // Real-time Intraday Bias Radar (Core Assets)
  | 'CURRENCY_STRENGTH_MATRIX'  // G8 Currency Strength Matrix & Heatmap
  | 'MACRO_NEWS_WIRE'           // Curated Macro News Wire & RSS Ingestion
  | 'ECONOMIC_CALENDAR'         // Economic Calendar with Consensus & Actuals
  | 'TRADINGVIEW_CHARTS'        // TradingView Modals & Technical Integration
  | 'AI_OVERVIEW_REFRESH'       // AI-driven Macro Market Overview generation/refresh
  | 'AI_DEEP_ANALYSIS'          // Advanced AI causal chains & event reanalysis
  | 'SSE_PRIORITY_STREAM'       // Sub-second SSE real-time event updates
  | 'PERSISTENT_WATCHLIST'      // Cloud-synced Watchlist beyond single session
  | 'CUSTOM_TELEGRAM_SCRAPER'   // Telegram Scraping Control Panel & Feed Injector
  | 'ADMIN_SYSTEM_PANEL'        // System Health, Data Sources & Raw Deduplication
  | 'API_DATA_EXPORT';          // Direct raw data exports & telemetry access

export interface PlanLimits {
  watchlistLimit: number;           // Max items allowed in user watchlist (e.g. 5 vs 50 vs 500)
  aiGenerationsPerDay: number;      // Max Gemini AI overview refreshes / re-analyses per day
  streamRateHz: number;             // Real-time SSE frequency limit
  customTelegramChannels: number;   // Number of custom public Telegram feeds user can ingest
}

export interface PlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: 'USD';
  description: string;
  popular?: boolean;
  accentColor: 'slate' | 'cyan' | 'purple';
  features: string[];
  exclusiveFeatures: string[];
  permissions: FeaturePermission[];
  limits: PlanLimits;
}

export const PLANS: Record<SubscriptionPlanId, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    name: 'Tier Evaluasi',
    tagline: 'Pengawasan Pasar Dasar',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'USD',
    description: 'Radar pasar real-time dan kalender ekonomi untuk trader individu yang mengevaluasi intelijen terminal.',
    accentColor: 'slate',
    features: [
      'Radar Bias Intraday Real-Time (14 Aset Utama)',
      'Matriks & Heatmap Kekuatan Mata Uang G8',
      'Arus Berita Makro Terkurasi & Serapan RSS',
      'Kalender Ekonomi dengan Konsensus & Aktual',
      'Daftar Pantau Cloud Tanpa Batas (hingga 500 simbol)',
      'Modal Grafik TradingView & Snapshot Terverifikasi',
      'Stream Prioritas Data Live SSE Sub-detik',
      'Ringkasan Makro Berbasis AI & Logika Kausal',
      'Analisis Beat/Miss Katalis Hari Ini Real-Time',
      'Engine Nada Hawkish/Dovish Pidato Bank Sentral',
      'Akses Gratis Tanpa Batas (Tanpa Pembayaran)',
    ],
    exclusiveFeatures: [
      'Intelijen Makro Penuh & Pengawasan Real-Time',
      'Rantai Dampak Kausal Makro Otomatis',
    ],
    permissions: [
      'MARKET_RADAR',
      'CURRENCY_STRENGTH_MATRIX',
      'MACRO_NEWS_WIRE',
      'ECONOMIC_CALENDAR',
      'TRADINGVIEW_CHARTS',
      'AI_OVERVIEW_REFRESH',
      'AI_DEEP_ANALYSIS',
      'SSE_PRIORITY_STREAM',
      'PERSISTENT_WATCHLIST',
      'CUSTOM_TELEGRAM_SCRAPER',
      'ADMIN_SYSTEM_PANEL',
      'API_DATA_EXPORT',
    ],
    limits: {
      watchlistLimit: 500,
      aiGenerationsPerDay: 500,
      streamRateHz: 50,
      customTelegramChannels: 25,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Trader Pro',
    badge: 'AKSES GRATIS',
    tagline: 'Mesin Makro Institusional Penuh',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'USD',
    popular: true,
    description: 'Intelijen makro frekuensi tinggi, streaming sub-detik, daftar pantau cloud tanpa batas, dan uraian katalis AI.',
    accentColor: 'cyan',
    features: [
      'Semua yang ada di Tier Evaluasi',
      'Stream Prioritas Data Live SSE Sub-detik',
      'Ringkasan Makro Berbasis AI & Logika Kausal',
      'Analisis Beat/Miss Katalis Hari Ini Real-Time',
      'Engine Nada Hawkish/Dovish Pidato Bank Sentral',
      'Daftar Pantau Cloud Permanen (hingga 500 simbol)',
      'Modal TradingView Multi-Timeframe Lengkap',
      'Alert Ambang Harga Suara & Visual yang Dapat Dikonfigurasi',
    ],
    exclusiveFeatures: [
      'Alert agenda real-time sub-detik',
      'Rantai dampak kausal makro otomatis',
      'Pool koneksi WebSocket/SSE prioritas',
    ],
    permissions: [
      'MARKET_RADAR',
      'CURRENCY_STRENGTH_MATRIX',
      'MACRO_NEWS_WIRE',
      'ECONOMIC_CALENDAR',
      'TRADINGVIEW_CHARTS',
      'AI_OVERVIEW_REFRESH',
      'AI_DEEP_ANALYSIS',
      'SSE_PRIORITY_STREAM',
      'PERSISTENT_WATCHLIST',
      'CUSTOM_TELEGRAM_SCRAPER',
      'ADMIN_SYSTEM_PANEL',
      'API_DATA_EXPORT',
    ],
    limits: {
      watchlistLimit: 500,
      aiGenerationsPerDay: 500,
      streamRateHz: 50,
      customTelegramChannels: 25,
    },
  },
  INSTITUTIONAL: {
    id: 'INSTITUTIONAL',
    name: 'Desk & Institusional',
    badge: 'DESK & PROP',
    tagline: 'Telemetri Enterprise Multi-Seat',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'USD',
    description: 'Kontrol pipeline enterprise, engine scraping feed Telegram privat, webhook kustom, dan otoritas administratif multi-seat.',
    accentColor: 'purple',
    features: [
      'Semua yang ada di Trader Pro',
      'Panel Kontrol Scraper Serapan Feed Telegram',
      'Manajemen Sumber Kustom & Override Serapan',
      'Inspeksi Basis Data Relasional Mentah & Tampilan Admin',
      'Gateway Server-Sent Event Dedikasi Throughput Tinggi',
      'SLA Institusional & Jaminan Uptime 99,99%',
      'Akses API Langsung & Ekspor Dump Data',
      'Lisensi Multi-Seat & Kontrol Admin Tim',
    ],
    exclusiveFeatures: [
      'Akses penuh Panel Admin & Scraper Channel',
      'Telemetri diagnostik pipeline langsung',
      'Log audit kepatuhan dedikasi',
    ],
    permissions: [
      'MARKET_RADAR',
      'CURRENCY_STRENGTH_MATRIX',
      'MACRO_NEWS_WIRE',
      'ECONOMIC_CALENDAR',
      'TRADINGVIEW_CHARTS',
      'AI_OVERVIEW_REFRESH',
      'AI_DEEP_ANALYSIS',
      'SSE_PRIORITY_STREAM',
      'PERSISTENT_WATCHLIST',
      'CUSTOM_TELEGRAM_SCRAPER',
      'ADMIN_SYSTEM_PANEL',
      'API_DATA_EXPORT',
    ],
    limits: {
      watchlistLimit: 500,
      aiGenerationsPerDay: 500,
      streamRateHz: 50,
      customTelegramChannels: 25,
    },
  },
};

/**
 * Returns effective plan for a user
 * Note: An ADMIN role always possesses all permissions and maximum limits,
 * but their subscription plan is maintained separately.
 */
export function getEffectivePlan(planId?: SubscriptionPlanId): PlanDefinition {
  if (planId && PLANS[planId]) {
    return PLANS[planId];
  }
  return PLANS.FREE;
}

/**
 * Checks if a user has access to a specific feature permission
 */
export function hasPermission(
  user: { role?: string; plan?: SubscriptionPlanId; subscription_status?: string } | null | undefined,
  permission: FeaturePermission
): boolean {
  // All features unlocked
  return true;
}

/**
 * Returns effective limits for a user
 */
export function getUserLimits(
  user: { role?: string; plan?: SubscriptionPlanId } | null | undefined
): PlanLimits {
  // Grant generous institutional limits to all users
  return PLANS.INSTITUTIONAL.limits;
}
