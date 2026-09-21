/**
 * Registry aset kanonik — sumber tunggal untuk seluruh aplikasi (server & frontend).
 *
 * Sebelumnya setiap modul mendefinisikan daftarnya sendiri (`intradayMarketMap.ts`,
 * `arahMarketEngine.ts`, `MarketHistoryView.tsx`) sehingga jumlah dan penamaan aset
 * mudah menyimpang (mis. "13 aset" padahal ada 14, atau pair hilang begitu saja).
 * Semua modul sekarang membaca dari sini.
 *
 * Catatan penting soal `pair`: feed harga pasar mengutip FX sebagai kode mata
 * uang tunggal (`EUR`, `JPY`, ...), sedangkan UI menampilkan nama pasangan (`EURUSD`).
 * `pair` menjadi jembatannya — jangan dihapus.
 */

export type AssetClass = 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'BOND' | 'FOREX';

export interface CanonicalAsset {
  /** Simbol internal yang dipakai untuk pencarian harga & penyimpanan. */
  symbol: string;
  /** Nama pasangan yang ditampilkan di UI, bila berbeda dari `symbol`. */
  pair?: string;
  displayName: string;
  assetClass: AssetClass;
  tvSymbol: string;
  tvUrl?: string;
}

const TV = (q: string) => `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(q)}`;

export const CANONICAL_ASSETS: readonly CanonicalAsset[] = [
  { symbol: 'XAUUSD', displayName: 'Emas / US Dollar', assetClass: 'COMMODITY', tvSymbol: 'TVC:GOLD', tvUrl: TV('TVC:GOLD') },
  { symbol: 'BTC', displayName: 'Bitcoin / US Dollar', assetClass: 'CRYPTO', tvSymbol: 'BITSTAMP:BTCUSD', tvUrl: 'https://www.tradingview.com/x/zRklu6Fj/' },
  { symbol: 'US30', displayName: 'Indeks Dow Jones 30', assetClass: 'INDEX', tvSymbol: 'FOREXCOM:US30', tvUrl: 'https://www.tradingview.com/x/McUWwa6F/' },
  { symbol: 'US500', displayName: 'Indeks S&P 500', assetClass: 'INDEX', tvSymbol: 'CAPITALCOM:SPX500', tvUrl: 'https://www.tradingview.com/x/mMOtpRJZ/' },
  { symbol: 'US100', displayName: 'Indeks Nasdaq 100', assetClass: 'INDEX', tvSymbol: 'SKILLING:US100', tvUrl: 'https://www.tradingview.com/x/pWHPW2sk/' },
  { symbol: 'US10Y', displayName: 'Yield Treasury AS 10 Tahun', assetClass: 'BOND', tvSymbol: 'TVC:US10Y', tvUrl: 'https://www.tradingview.com/symbols/TVC-US10Y/' },
  { symbol: 'USD', displayName: 'Indeks Dolar AS (DXY)', assetClass: 'FOREX', tvSymbol: 'TVC:DXY', tvUrl: 'https://www.tradingview.com/x/mxhFtDj9/' },
  { symbol: 'EUR', pair: 'EURUSD', displayName: 'Euro / Dolar AS', assetClass: 'FOREX', tvSymbol: 'FX:EURUSD', tvUrl: TV('FX:EURUSD') },
  { symbol: 'GBP', pair: 'GBPUSD', displayName: 'Pound Inggris / USD', assetClass: 'FOREX', tvSymbol: 'FX:GBPUSD', tvUrl: TV('FX:GBPUSD') },
  { symbol: 'JPY', pair: 'USDJPY', displayName: 'Dolar AS / Yen Jepang', assetClass: 'FOREX', tvSymbol: 'FX:USDJPY', tvUrl: TV('FX:USDJPY') },
  { symbol: 'AUD', pair: 'AUDUSD', displayName: 'Dolar Australia / USD', assetClass: 'FOREX', tvSymbol: 'FX:AUDUSD', tvUrl: TV('FX:AUDUSD') },
  { symbol: 'NZD', pair: 'NZDUSD', displayName: 'Dolar Selandia Baru / USD', assetClass: 'FOREX', tvSymbol: 'FX:NZDUSD', tvUrl: TV('FX:NZDUSD') },
  { symbol: 'CAD', pair: 'USDCAD', displayName: 'Dolar AS / Dolar Kanada', assetClass: 'FOREX', tvSymbol: 'FX:USDCAD', tvUrl: TV('FX:USDCAD') },
  { symbol: 'CHF', pair: 'USDCHF', displayName: 'Dolar AS / Franc Swiss', assetClass: 'FOREX', tvSymbol: 'FX:USDCHF', tvUrl: TV('FX:USDCHF') },
] as const;

/** Jumlah aset kanonik — dipakai UI agar label tidak pernah salah hitung. */
export const CANONICAL_ASSET_COUNT = CANONICAL_ASSETS.length;

const bySymbol = new Map(CANONICAL_ASSETS.map(a => [a.symbol, a]));
const byPair = new Map(
  CANONICAL_ASSETS.filter(a => a.pair).map(a => [a.pair as string, a])
);

/** Cari aset dari simbol internal (`EUR`) maupun nama pasangan (`EURUSD`). */
export function findAsset(symbolOrPair: string): CanonicalAsset | undefined {
  return bySymbol.get(symbolOrPair) || byPair.get(symbolOrPair);
}

const assetDisplayNames: Record<string, string> = Object.fromEntries(
  CANONICAL_ASSETS.map(a => [a.symbol, a.displayName])
);

/** Nama tampilan untuk simbol internal, dengan cadangan ke simbol itu sendiri. */
export function getAssetDisplayName(symbol: string): string {
  return assetDisplayNames[symbol] || symbol;
}

/** Kelompok aset untuk pengelompokan di UI riwayat pasar. */
export function getAssetCategory(symbol: string): 'METALS_CRYPTO' | 'INDICES' | 'BONDS' | 'FOREX' {
  if (symbol === 'XAUUSD' || symbol === 'BTC') return 'METALS_CRYPTO';
  if (symbol === 'US10Y') return 'BONDS';
  if (symbol.startsWith('US')) return 'INDICES';
  return 'FOREX';
}
