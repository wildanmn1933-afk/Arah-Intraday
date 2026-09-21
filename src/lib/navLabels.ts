/**
 * Label navigasi kanonik — sumber tunggal untuk Sidebar dan Header.
 *
 * Sebelumnya nama menu ditulis dua kali (Sidebar.tsx dan Header.tsx) sehingga
 * mudah menyimpang; Header bahkan belum punya entri untuk `arah_market`,
 * `intermarket`, dan `history` sehingga judulnya menampilkan id mentah.
 *
 * Istilah ditulis konsisten dalam bahasa Indonesia; singkatan teknis yang lazim
 * (G8, AI, DXY) dan istilah domain (Intermarket, Makro) dipertahankan apa adanya.
 */

export type NavTabId =
  | 'terminal'
  | 'arah_market'
  | 'intraday_map'
  | 'today_catalysts'
  | 'markets'
  | 'intermarket'
  | 'currency'
  | 'history'
  | 'macro'
  | 'events'
  | 'intelligence'
  | 'watchlist'
  | 'admin';

export const NAV_LABELS: Record<NavTabId, string> = {
  terminal: 'Dashboard Ikhtisar',
  arah_market: 'Arah Market Hari Ini',
  intraday_map: 'Peta Pasar Hari Ini',
  today_catalysts: 'Katalis Hari Ini',
  markets: 'Pengawasan Pasar',
  intermarket: 'Matriks Intermarket',
  currency: 'Kekuatan Mata Uang (G8)',
  history: 'Riwayat & Memori Pasar',
  macro: 'Kalender Makro',
  events: 'Berita Kanonik',
  intelligence: 'Intelijen Pasar AI',
  watchlist: 'Daftar Pantau Saya',
  admin: 'Feed & Kesehatan Sistem',
};

export function getNavLabel(tab: NavTabId): string {
  return NAV_LABELS[tab] ?? tab;
}
