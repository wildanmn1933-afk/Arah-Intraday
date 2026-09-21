import React, { useEffect } from 'react';
import {
  Activity,
  Layers,
  TrendingUp,
  Radio,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BarChart2,
  Globe2,
  Zap,
  Lock,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  Compass,
  LineChart,
} from 'lucide-react';
import { User } from '../types';
import { getCurrencyFlagUrl } from '../lib/assets';

/*
 * Banner visual untuk kartu fitur: grid + sparkline/batang sintetis yang menyerupai
 * panel data terminal, menggantikan foto stok agar tampilan terasa seperti produk asli.
 */
const BANNER_GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};

const SPARK_VIEWBOX = { w: 320, h: 110 };

const buildSparkline = (series: number[]): string => {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  return series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * SPARK_VIEWBOX.w;
      const y = SPARK_VIEWBOX.h - ((value - min) / span) * (SPARK_VIEWBOX.h - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

interface FeatureBannerProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  accent: { text: string; border: string; bg: string; stroke: string };
  series: number[];
  variant?: 'sparkline' | 'bars';
}

const FeatureBanner: React.FC<FeatureBannerProps> = ({
  id,
  label,
  icon,
  accent,
  series,
  variant = 'sparkline',
}) => {
  const max = Math.max(...series);
  const barWidth = SPARK_VIEWBOX.w / series.length;

  return (
    <div className="relative h-36 w-full overflow-hidden bg-slate-950">
      <div className="absolute inset-0" style={BANNER_GRID_STYLE} />
      <svg
        viewBox={`0 0 ${SPARK_VIEWBOX.w} ${SPARK_VIEWBOX.h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`banner-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent.stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent.stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {variant === 'sparkline' ? (
          <>
            <polygon
              points={`0,${SPARK_VIEWBOX.h} ${buildSparkline(series)} ${SPARK_VIEWBOX.w},${SPARK_VIEWBOX.h}`}
              fill={`url(#banner-fill-${id})`}
            />
            <polyline
              points={buildSparkline(series)}
              fill="none"
              stroke={accent.stroke}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          series.map((value, index) => {
            const height = (value / max) * (SPARK_VIEWBOX.h - 24);
            return (
              <rect
                key={index}
                x={index * barWidth + barWidth * 0.22}
                y={SPARK_VIEWBOX.h - height}
                width={barWidth * 0.56}
                height={height}
                rx="1.5"
                fill={accent.stroke}
                opacity={0.3 + (value / max) * 0.6}
              />
            );
          })
        )}
      </svg>
      <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/30 to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${accent.bg} ${accent.border} ${accent.text}`}
        >
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-100">{label}</span>
      </div>
    </div>
  );
};

interface PublicLandingPageProps {
  currentPath: string;
  onNavigate: (to: string) => void;
  user?: User | null;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  currentPath,
  onNavigate,
  user,
}) => {
  // Auto-scroll to specific section when path is /features
  useEffect(() => {
    if (currentPath === '/features') {
      const el = document.getElementById('features-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Public Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo / Brand */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider font-mono text-slate-100 flex items-center gap-1.5">
                ARAH <span className="text-cyan-400">MARKET</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">
                Macro Intelligence
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              onClick={() => onNavigate('/features')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                currentPath === '/features'
                  ? 'text-cyan-400 bg-slate-900 border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fitur Utama
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('markets-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 transition cursor-pointer font-medium"
            >
              Pasar & Instrumen
            </button>
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-3 py-1.5 rounded-md text-cyan-400 hover:text-cyan-300 transition cursor-pointer font-medium flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Terminal Live</span>
            </button>
          </nav>
        </div>

        {/* Auth Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/login')}
            className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/60 rounded-lg transition cursor-pointer font-medium"
            id="landing-login-btn"
          >
            Masuk
          </button>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="px-4 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition cursor-pointer shadow-sm shadow-cyan-500/25 flex items-center gap-1.5"
            id="landing-register-btn"
          >
            <span>Buka Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section with Photographic Atmosphere */}
      <section className="relative px-4 sm:px-8 pt-12 sm:pt-16 pb-20 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        {/* Latar grid teknikal + glow, bukan foto stok */}
        <div
          className="absolute inset-0 max-h-[520px] overflow-hidden pointer-events-none -z-10"
          style={BANNER_GRID_STYLE}
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/20 via-slate-950/70 to-slate-950" />
        </div>

        {/* Professional Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/70 text-cyan-300 text-xs font-sans mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wide text-xs">
            Portal Surveilans & Intelijen Makro Finansial
          </span>
        </div>

        {/* Clear Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-tight">
          Analisis Makro & Arah Pasar Real-Time yang Bersih, Jelas, & Profesional
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
          Dapatkan keunggulan analisa dari disparitas mata uang G8, bias instrumen intraday, korelasi intermarket, serta klasifikasi berita ekonomi berdampak tinggi tanpa kebingungan.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="w-full sm:w-auto px-7 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Jelajahi Dashboard Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('features-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 text-slate-200 border border-slate-750 hover:border-slate-600 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LineChart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lihat Fitur & Data</span>
          </button>
        </div>

        {/* Trust Points */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Kekuatan 8 Mata Uang Utama (G8)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Bias Intraday 14 Aset Terkini</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Pemantauan Bank Sentral (Fed, ECB, BoE, BoJ)</span>
          </div>
        </div>

        {/* Interactive Platform Preview Showcase */}
        <div className="mt-12 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden text-left">
          {/* Top Window Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-slate-200 font-bold ml-2">ARAH MARKET — EXECUTIVE INTELLIGENCE</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                DATA STREAM AKTIF
              </span>
            </div>
          </div>

          {/* Preview Content Grid */}
          <div className="p-4 sm:p-6 bg-slate-950/95 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Radar Bias Intraday with Flags */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-cyan-400">
                  <Activity className="w-3.5 h-3.5" />
                  BIAS 13 ASET INTRADAY
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">PEMBARUAN LIVE</span>
              </div>
              <div className="space-y-2 text-xs">
                {/* GBPJPY */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-1 shrink-0">
                      <img
                        src={getCurrencyFlagUrl('GBP')}
                        alt="GBP"
                        referrerPolicy="no-referrer"
                        className="w-4 h-3 object-cover rounded-xs border border-slate-900"
                      />
                      <img
                        src={getCurrencyFlagUrl('JPY')}
                        alt="JPY"
                        referrerPolicy="no-referrer"
                        className="w-4 h-3 object-cover rounded-xs border border-slate-900"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 font-mono">GBPJPY</span>
                      <span className="text-[10px] text-slate-400 block font-sans">BoE tahan vs pelonggaran BoJ</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    STRONG BUY
                  </span>
                </div>

                {/* XAUUSD */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-5 h-4 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold flex items-center justify-center">Au</span>
                      <img
                        src={getCurrencyFlagUrl('USD')}
                        alt="USD"
                        referrerPolicy="no-referrer"
                        className="w-4 h-3 object-cover rounded-xs border border-slate-900"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 font-mono">XAUUSD</span>
                      <span className="text-[10px] text-slate-400 block font-sans">Momentum safe-haven emas</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    NAIK
                  </span>
                </div>

                {/* EURUSD */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-1 shrink-0">
                      <img
                        src={getCurrencyFlagUrl('EUR')}
                        alt="EUR"
                        referrerPolicy="no-referrer"
                        className="w-4 h-3 object-cover rounded-xs border border-slate-900"
                      />
                      <img
                        src={getCurrencyFlagUrl('USD')}
                        alt="USD"
                        referrerPolicy="no-referrer"
                        className="w-4 h-3 object-cover rounded-xs border border-slate-900"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 font-mono">EURUSD</span>
                      <span className="text-[10px] text-slate-400 block font-sans">Sikap ECB vs Fed</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    NETRAL
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Currency Strength Dispersion Matrix */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  KORELASI KEKUATAN G8
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SKOR 0 - 10</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      <img
                        src={getCurrencyFlagUrl('GBP')}
                        alt="GBP"
                        referrerPolicy="no-referrer"
                        className="w-3.5 h-2.5 object-cover rounded-xs"
                      />
                      GBP (Rank #1)
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">8.2 / 10.0</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-emerald-400 w-[82%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      <img
                        src={getCurrencyFlagUrl('AUD')}
                        alt="AUD"
                        referrerPolicy="no-referrer"
                        className="w-3.5 h-2.5 object-cover rounded-xs"
                      />
                      AUD (Rank #2)
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">7.4 / 10.0</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-emerald-400 w-[74%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      <img
                        src={getCurrencyFlagUrl('JPY')}
                        alt="JPY"
                        referrerPolicy="no-referrer"
                        className="w-3.5 h-2.5 object-cover rounded-xs"
                      />
                      JPY (Rank #8)
                    </span>
                    <span className="text-rose-400 font-bold font-mono">2.1 / 10.0</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-rose-400 w-[21%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Macro & Breaking Wire Preview with Thumbnail */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-purple-400">
                  <Brain className="w-3.5 h-3.5" />
                  BERITA MAKRO KANONIKAL
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">TERKLASIFIKASI</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-800/80 text-[9px] font-mono font-bold">
                    DAMPAK TINGGI • FOMC
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">2 mnt lalu</span>
                </div>
                <div className="text-xs font-bold text-slate-100 leading-snug">
                  Kebijakan Suku Bunga Federal Reserve & Yield Obligasi AS
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Yield US 10-Year melandai ke 4.12% pasca pernyataan inflasi; memicu pelemahan DXY dan reli penguatan pada pasangan valuta EUR/USD dan Emas.
                </p>
                <div className="pt-1.5 border-t border-slate-900 flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">EUR/USD ▲ NAIK</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/80 font-bold">USD/JPY ▼ TURUN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar inside Showcase */}
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Arah Market — Dirancang untuk trader independen maupun institusi.</span>
            <button
              onClick={() => onNavigate('/dashboard')}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Terminal Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Key Features Section with Curated Photography */}
      <section id="features-section" className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              KEUNGGULAN UTAMA
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Fitur Lengkap Dirancang untuk Keputusan Trading Terarah
            </h2>
            <p className="text-sm text-slate-400 mt-2 font-sans">
              Menghilangkan distraksi dan kebisingan dengan menyajikan data analitis yang langsung dapat ditindaklanjuti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: G8 Matrix with Visual Photography */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col group shadow-lg">
              <FeatureBanner
                id="g8"
                label="Kekuatan Mata Uang (G8)"
                icon={<TrendingUp className="w-4 h-4" />}
                accent={{ text: 'text-cyan-400', border: 'border-cyan-800', bg: 'bg-cyan-950/90', stroke: '#22d3ee' }}
                series={[46, 52, 49, 58, 55, 63, 60, 68, 72, 66, 74, 79]}
              />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Perhitungan matematis across 28 pair mata uang dunia. Menyoroti divergensi mata uang terkuat vs terlemah untuk setup trend-following dengan probabilitas tinggi.
                </p>
                <div className="pt-2 text-[11px] text-cyan-400 font-medium flex items-center gap-1">
                  <span>Pantau skor real-time</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Feature 2: Intraday Market Mapping with Visual Photography */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col group shadow-lg">
              <FeatureBanner
                id="intraday"
                label="Peta Pasar Hari Ini"
                icon={<Activity className="w-4 h-4" />}
                accent={{ text: 'text-emerald-400', border: 'border-emerald-800', bg: 'bg-emerald-950/90', stroke: '#34d399' }}
                series={[20, 24, 22, 30, 27, 26, 34, 38, 35, 44, 41, 48]}
                variant="bars"
              />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Memetakan arah bias harian pada 14 aset likuid mencakup Forex, Emas (XAUUSD), Minyak Brent, Indeks Saham (S&P 500, Nasdaq 100, Dow Jones 30), Bitcoin, dan US10Y.
                </p>
                <div className="pt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span>Dilengkapi alert pulsa harga</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Feature 3: Canonical News Wire with Photography */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col group shadow-lg">
              <FeatureBanner
                id="wire"
                label="Berita Kanonik & Analisis Dampak"
                icon={<Radio className="w-4 h-4" />}
                accent={{ text: 'text-purple-400', border: 'border-purple-800', bg: 'bg-purple-950/90', stroke: '#c084fc' }}
                series={[12, 30, 18, 42, 26, 55, 34, 62, 40, 70, 48, 66]}
                variant="bars"
              />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Agregasi berita keuangan kanonikal dari sumber terpercaya tanpa duplikasi. Menganalisis sentimen dampak langsung terhadap mata uang dan instrumen terkait.
                </p>
                <div className="pt-2 text-[11px] text-purple-400 font-medium flex items-center gap-1">
                  <span>Filter dampak Tinggi & Kritis</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Feature 4: Central Bank Telemetry with Architecture Photo */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col group shadow-lg">
              <FeatureBanner
                id="cb"
                label="Katalis Hari Ini & Bank Sentral"
                icon={<Brain className="w-4 h-4" />}
                accent={{ text: 'text-amber-400', border: 'border-amber-800', bg: 'bg-amber-950/90', stroke: '#fbbf24' }}
                series={[62, 60, 58, 59, 56, 54, 55, 52, 50, 51, 48, 47]}
              />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Lacak arah kebijakan suku bunga Fed (FOMC), ECB, BoE, dan Bank of Japan, lengkap dengan pidato pejabat penting dan indikator pergeseran hawkish/dovish.
                </p>
                <div className="pt-2 text-[11px] text-amber-400 font-medium flex items-center gap-1">
                  <span>Pantau ekspektasi suku bunga</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Feature 5: Intermarket Flow with Global Macro Photo */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col group shadow-lg">
              <FeatureBanner
                id="intermarket"
                label="Matriks Intermarket"
                icon={<Zap className="w-4 h-4" />}
                accent={{ text: 'text-indigo-400', border: 'border-indigo-800', bg: 'bg-indigo-950/90', stroke: '#818cf8' }}
                series={[40, 44, 38, 47, 42, 51, 45, 55, 48, 58, 52, 61]}
              />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Membedah relasi dinamis antara DXY (indeks dolar), US10Y (yield obligasi AS), Emas, dan Indeks Saham untuk konfirmasi bias yang kuat sebelum mengambil posisi.
                </p>
                <div className="pt-2 text-[11px] text-indigo-400 font-medium flex items-center gap-1">
                  <span>Lihat transmisi lintas aset</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Feature 6: Economic Calendar & Data Visualization */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col group shadow-lg">
              <FeatureBanner
                id="cal"
                label="Kalender Makro"
                icon={<Clock className="w-4 h-4" />}
                accent={{ text: 'text-blue-400', border: 'border-blue-800', bg: 'bg-blue-950/90', stroke: '#60a5fa' }}
                series={[25, 0, 40, 0, 65, 0, 35, 0, 80, 0, 50, 0]}
                variant="bars"
              />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Jadwal rilis CPI, NFP, GDP, dan data manufaktur dengan konversi otomatis waktu lokal WIB/Jakarta, deviasi aktual vs konsensus, dan riwayat historis.
                </p>
                <div className="pt-2 text-[11px] text-blue-400 font-medium flex items-center gap-1">
                  <span>Waktu tersinkronisasi WIB</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Markets Section with Country Flags & Visual Cards */}
      <section id="markets-section" className="py-16 px-4 sm:px-8 border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              CAKUPAN ASET GLOBAL
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Instrumen & Kelas Aset yang Didukung
            </h2>
            <p className="text-sm text-slate-400 mt-2 font-sans">
              Data harga live, katalis penggerak, serta analisa sentimen di seluruh pasar finansial utama.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Asset Class 1: FX Majors */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Foreign Exchange (G8)</span>
                <span className="text-slate-400 text-[10px]">7 Pasangan</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <img src={getCurrencyFlagUrl('EUR')} alt="EUR" className="w-3.5 h-2.5 object-cover rounded-xs" />
                    <span className="font-bold text-slate-100 font-mono">EUR/USD</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Euro / Dolar</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <img src={getCurrencyFlagUrl('GBP')} alt="GBP" className="w-3.5 h-2.5 object-cover rounded-xs" />
                    <span className="font-bold text-slate-100 font-mono">GBP/USD</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Cable</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <img src={getCurrencyFlagUrl('JPY')} alt="JPY" className="w-3.5 h-2.5 object-cover rounded-xs" />
                    <span className="font-bold text-slate-100 font-mono">USD/JPY</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Dolar / Yen</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <img src={getCurrencyFlagUrl('AUD')} alt="AUD" className="w-3.5 h-2.5 object-cover rounded-xs" />
                    <span className="font-bold text-slate-100 font-mono">AUD/USD</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Aussie</span>
                </div>
              </div>
            </div>

            {/* Asset Class 2: Commodities */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Komoditas & Energi</span>
                <span className="text-slate-400 text-[10px]">Logam & Minyak</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-3 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center justify-center">Au</span>
                    <span className="font-bold text-slate-100 font-mono">XAU/USD</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Emas Spot</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-3 rounded bg-orange-500/20 text-orange-300 text-[9px] font-bold flex items-center justify-center">Minyak</span>
                    <span className="font-bold text-slate-100 font-mono">BRENT</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Minyak Mentah</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-3 rounded bg-slate-500/20 text-slate-300 text-[9px] font-bold flex items-center justify-center">Ag</span>
                    <span className="font-bold text-slate-100 font-mono">XAG/USD</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Perak Spot</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-3 rounded bg-orange-500/20 text-orange-300 text-[9px] font-bold flex items-center justify-center">WTI</span>
                    <span className="font-bold text-slate-100 font-mono">WTI MENTAH</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Minyak AS</span>
                </div>
              </div>
            </div>

            {/* Asset Class 3: Equities & Indices */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-purple-400 font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Indeks Saham Global</span>
                <span className="text-slate-400 text-[10px]">Benchmark</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-slate-100 font-mono">US500</span>
                  <span className="text-slate-400 text-[11px]">Indeks S&P 500</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-slate-100 font-mono">NAS100</span>
                  <span className="text-slate-400 text-[11px]">Nasdaq Tech</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-slate-100 font-mono">US30</span>
                  <span className="text-slate-400 text-[11px]">Dow Jones</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-slate-100 font-mono">GER40</span>
                  <span className="text-slate-400 text-[11px]">DAX Jerman</span>
                </div>
              </div>
            </div>

            {/* Asset Class 4: Crypto & Treasury Rates */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Yield & Aset Digital</span>
                <span className="text-slate-400 text-[10px]">Benchmark Makro</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <img src={getCurrencyFlagUrl('USD')} alt="USD" className="w-3.5 h-2.5 object-cover rounded-xs" />
                    <span className="font-bold text-slate-100 font-mono">DXY</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Indeks Dolar</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-slate-100 font-mono">US10Y</span>
                  <span className="text-slate-400 text-[11px]">10-Yr US Yield</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">₿</span>
                    <span className="font-bold text-slate-100 font-mono">BTC/USD</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Bitcoin Core</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-slate-100 font-mono">ETH/USD</span>
                  <span className="text-slate-400 text-[11px]">Ethereum</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 px-4 sm:px-8 border-t border-slate-800 bg-linear-to-b from-slate-950 to-slate-900 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-cyan-500/20">
            <Compass className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Siap Mengambil Keputusan Pasar dengan Lebih Percaya Diri?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
            Akses langsung dashboard pemantauan tanpa biaya evaluasi. Semua data makro, korelasi antar pasar, dan kalender penting siap dalam satu layar terpadu.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
            >
              <span>Buka Terminal Live Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 px-4 sm:px-8 py-8 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              A
            </div>
            <span className="font-bold text-slate-200 tracking-wide font-mono">ARAH MARKET</span>
            <span className="text-slate-400">• Portal Intelijen Makro Pasar Finansial</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <button onClick={() => onNavigate('/')} className="hover:text-slate-200 transition cursor-pointer">
              Beranda
            </button>
            <button onClick={() => onNavigate('/features')} className="hover:text-slate-200 transition cursor-pointer">
              Fitur
            </button>
            <button onClick={() => onNavigate('/dashboard')} className="hover:text-cyan-400 transition cursor-pointer font-semibold">
              Terminal Live
            </button>
            <button onClick={() => onNavigate('/login')} className="hover:text-slate-200 transition cursor-pointer">
              Masuk
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Arah Market Systems. Hak cipta dilindungi.
          </div>
          <div>
            Platform analitis intelijen pasar untuk tujuan edukasi dan surveilans finansial.
          </div>
        </div>
      </footer>
    </div>
  );
};
