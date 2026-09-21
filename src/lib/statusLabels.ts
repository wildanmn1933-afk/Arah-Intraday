/**
 * Terjemahan kode status internal (enum dari server) menjadi label tampilan
 * bahasa Indonesia. Nilai enum tetap dipakai untuk logika/filter; hanya
 * presentasi yang diterjemahkan lewat helper ini.
 */

export const STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'AKAN DATANG',
  RELEASED: 'TELAH RILIS',
  DELAYED: 'TERTUNDA',
  LIVE: 'LANGSUNG',
  CONNECTED: 'TERHUBUNG',
  RECONNECTING: 'MENGHUBUNGKAN ULANG',
  DISCONNECTED: 'TERPUTUS',
  ACTIVE: 'AKTIF',
  PENDING: 'MENUNGGU',
  STANDBY: 'SIAGA',
  SYNCED: 'TERSINKRON',
  SYNCING: 'SINKRONISASI',
  ERROR: 'ERROR',
  OK: 'NORMAL',
  STRONG: 'KUAT',
  WEAK: 'LEMAH',
  MIXED: 'CAMPURAN',
  BULLISH: 'BULLISH',
  BEARISH: 'BEARISH',
  NEUTRAL: 'NETRAL',
};

export const TONE_LABELS: Record<string, string> = {
  HAWKISH: 'HAWKISH',
  DOVISH: 'DOVISH',
  NEUTRAL: 'NETRAL',
  MIXED: 'CAMPURAN',
};

export function translateTone(tone: string | undefined | null): string {
  if (!tone) return '';
  return TONE_LABELS[tone.toUpperCase()] ?? tone;
}

export const ACTION_LABELS: Record<string, string> = {
  STRONG_BUY: 'BELI KUAT',
  BUY: 'BELI',
  NEUTRAL_CHOP: 'NETRAL/SIDEWAYS',
  NEUTRAL: 'NETRAL',
  SELL: 'JUAL',
  STRONG_SELL: 'JUAL KUAT',
};

export const BIAS_LABELS: Record<string, string> = {
  BULLISH: 'NAIK',
  BEARISH: 'TURUN',
  NEUTRAL: 'NETRAL',
  MIXED: 'CAMPURAN',
};

export function translateBias(value: string | undefined | null): string {
  if (!value) return '';
  return BIAS_LABELS[value.toUpperCase()] ?? value;
}

export function translateAction(value: string | undefined | null): string {
  if (!value) return '';
  return ACTION_LABELS[value.toUpperCase()] ?? value.replace('_', ' ');
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  COMMODITY: 'KOMODITAS',
  CRYPTO: 'KRIPTO',
  INDEX: 'INDEKS',
  FOREX: 'VALAS',
  BOND: 'OBLIGASI',
};

export function translateAssetType(value: string | undefined | null): string {
  if (!value) return '';
  return ASSET_TYPE_LABELS[value.toUpperCase()] ?? value;
}

export function translateStatus(status: string | undefined | null): string {
  if (!status) return '';
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

export const EVENT_TIMING_LABELS: Record<string, string> = {
  UPCOMING: 'AKAN DATANG',
  TODAY: 'HARI INI',
  TOMORROW: 'BESOK',
  RELEASED: 'TELAH RILIS',
  ALL: 'SEMUA',
};

export function translateTiming(timing: string): string {
  return EVENT_TIMING_LABELS[timing] ?? timing;
}

export const FILTER_LABELS: Record<string, string> = {
  ALL: 'SEMUA',
  'CRITICAL': 'KRITIS',
  HIGH: 'TINGGI',
  MEDIUM: 'SEDANG',
  LOW: 'RENDAH',
  COMMODITIES: 'KOMODITAS',
  CRYPTO: 'KRIPTO',
  INDICES: 'INDEKS',
  FOREX: 'VALAS',
  BONDS: 'OBLIGASI',
  CURRENCIES: 'MATA UANG',
  YIELDS: 'YIELD',
};

export function translateFilter(filter: string): string {
  return FILTER_LABELS[filter.toUpperCase()] ?? filter;
}

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'SEMUA',
  MACRO: 'MAKRO',
  CENTRAL_BANK: 'BANK SENTRAL',
  COMMODITIES: 'KOMODITAS',
  GEOPOLITICS: 'GEOPOLITIK',
  CRYPTO: 'KRIPTO',
  MARKET: 'PASAR',
  EARNINGS: 'LABA',
  COMMODITY: 'KOMODITAS',
  INDEX: 'INDEKS',
  FOREX: 'VALAS',
  BONDS: 'OBLIGASI',
  YIELD: 'YIELD',
  SPEECHES: 'PIDATO',
  CRYPTO_COMMODITY: 'KRIPTO & KOMODITAS',
};

export function translateCategory(category: string): string {
  return CATEGORY_LABELS[category.toUpperCase()] ?? category;
}
