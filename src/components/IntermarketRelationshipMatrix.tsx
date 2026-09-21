import { translateFilter } from '../lib/statusLabels';
import React, { useState, useMemo } from 'react';
import { MarketPrice, CurrencyStrength } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Layers,
  Sparkles,
  LineChart,
  RefreshCw,
  Compass,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Flame,
  Shield,
  Zap,
} from 'lucide-react';
import { Tooltip } from './Tooltip';

export interface IntermarketRelationshipMatrixProps {
  prices: MarketPrice[];
  strengths: CurrencyStrength[];
  onOpenChart?: (symbol: string) => void;
  onSelectSymbol?: (symbol: string) => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export type IntermarketAssetKey =
  | 'DXY'
  | 'US10Y'
  | 'XAUUSD'
  | 'US500'
  | 'US100'
  | 'EUR'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'BTC';

export interface IntermarketRelationship {
  source: IntermarketAssetKey;
  target: IntermarketAssetKey;
  sourceLabel: string;
  targetLabel: string;
  sourceCategory: 'CURRENCY' | 'YIELD' | 'COMMODITY' | 'EQUITY' | 'CRYPTO';
  targetCategory: 'CURRENCY' | 'YIELD' | 'COMMODITY' | 'EQUITY' | 'CRYPTO';
  historicalCorrelation: number; // -1.0 to 1.0
  correlationNature: 'STRONG_INVERSE' | 'MODERATE_INVERSE' | 'STRONG_POSITIVE' | 'MODERATE_POSITIVE' | 'NEUTRAL';
  transmissionMechanism: string;
  divergenceAlertRule?: string;
  primaryDriver: string;
}

// Canonical Intermarket Relationships (based on John J. Murphy & institutional macro frameworks)
const CANONICAL_RELATIONSHIPS: IntermarketRelationship[] = [
  {
    source: 'DXY',
    target: 'XAUUSD',
    sourceLabel: 'Dolar AS (DXY)',
    targetLabel: 'Emas (XAU/USD)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.78,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Likuiditas Valas Global & Unit Penetapan Harga Riil',
    transmissionMechanism:
      'Emas diinvois secara global dalam USD. Penguatan Dolar secara mekanis menaikkan biaya akuisisi bagi negara non-AS, menekan permintaan bullion spot kecuali premi risiko geopolitik mengalahkannya.',
    divergenceAlertRule:
      'ANOMALI: DXY dan Emas menguat bersamaan (> +0.3%). Menandakan ketakutan sistemik akut atau diversifikasi cadangan negara.',
  },
  {
    source: 'US10Y',
    target: 'XAUUSD',
    sourceLabel: 'Proksi Yield US 10Y',
    targetLabel: 'Emas (XAU/USD)',
    sourceCategory: 'YIELD',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.82,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Biaya Peluang & Yield Riil',
    transmissionMechanism:
      'Emas tidak menghasilkan arus kas atau yield nominal. Saat yield obligasi benchmark negara naik tanpa diimbangi percepatan inflasi, biaya peluang memegang bullion tanpa yield meningkat.',
    divergenceAlertRule:
      'DIVERGENSI BULLISH: Emas tetap tangguh meski yield 10 tahun melonjak, menandakan akumulasi struktural bank sentral atau penetapan harga stagflasi.',
  },
  {
    source: 'DXY',
    target: 'US500',
    sourceLabel: 'Dolar AS (DXY)',
    targetLabel: 'S&P 500 (US500)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.55,
    correlationNature: 'MODERATE_INVERSE',
    primaryDriver: 'Kondisi Finansial & EPS Perusahaan Multinasional',
    transmissionMechanism:
      'Dolar yang naik cepat memperketat kondisi kredit dolar global dan menurunkan nilai pendapatan luar negeri perusahaan multinasional S&P 500 yang mengonversi penjualan luar negeri kembali ke USD.',
  },
  {
    source: 'US10Y',
    target: 'US100',
    sourceLabel: 'Proksi Yield US 10Y',
    targetLabel: 'Nasdaq 100 (US100)',
    sourceCategory: 'YIELD',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.68,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Suku Diskonto atas Laba Berdurasi Panjang',
    transmissionMechanism:
      'Perusahaan pertumbuhan dan teknologi berkelipatan tinggi memiliki arus kas yang jauh di masa depan. Kenaikan suku diskonto (Yield 10Y) menekan kelipatan harga terhadap laba ke depan secara tidak proporsional.',
    divergenceAlertRule:
      'Teknologi yang unggul saat yield terus naik menandakan momentum laba atau tema belanja modal AI mengalahkan suku diskonto makro.',
  },
  {
    source: 'CAD',
    target: 'XAUUSD',
    sourceLabel: 'Dolar Kanada (CAD)',
    targetLabel: 'Beta Emas & Energi',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: 0.62,
    correlationNature: 'MODERATE_POSITIVE',
    primaryDriver: 'Term of Trade & Ekstraksi Sumber Daya',
    transmissionMechanism:
      'Kanada adalah eksportir neto utama energi mentah dan komoditas mineral. Lonjakan komoditas menaikkan term of trade nasional dan menopang daya beli CAD terhadap pair Eropa.',
  },
  {
    source: 'AUD',
    target: 'US500',
    sourceLabel: 'Dolar Australia (AUD)',
    targetLabel: 'Sikap Risiko S&P 500',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: 0.74,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Beta Pertumbuhan Global & Selera Pro-Siklikal',
    transmissionMechanism:
      'AUD berperan sebagai proksi valas G8 untuk ekspansi perdagangan global dan permintaan industri Tiongkok. Selera risiko ekuitas yang tinggi berkorelasi kuat dengan keunggulan AUD atas mata uang pendanaan defensif.',
  },
  {
    source: 'JPY',
    target: 'US500',
    sourceLabel: 'Yen Jepang (JPY)',
    targetLabel: 'Risiko Global / S&P 500',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.65,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Pembongkaran Carry Trade Global & Pelarian Likuiditas',
    transmissionMechanism:
      'Suku bunga Jepang yang rendah menjadikan Yen mata uang pendanaan global utama. Saat panik pasar atau deleveraging risk-off, carry trade global dilikuidasi dan memicu repatriasi Yen secara agresif.',
    divergenceAlertRule:
      'LONJAKAN YEN + EKUITAS TERJUAL: Ciri khas deleveraging sistemik. Perkirakan lonjakan volatilitas pada valas beta tinggi.',
  },
  {
    source: 'BTC',
    target: 'US100',
    sourceLabel: 'Bitcoin (BTC)',
    targetLabel: 'Nasdaq 100 (US100)',
    sourceCategory: 'CRYPTO',
    targetCategory: 'EQUITY',
    historicalCorrelation: 0.71,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Likuiditas M2 Global & Spekulatif Beta Tinggi',
    transmissionMechanism:
      'Bitcoin diperdagangkan sebagai likuiditas teknologi spekulatif berdaya tinggi. Pergeseran likuiditas neraca Fed dan selera risiko sektor teknologi cepat menular ke arus masuk modal kripto.',
  },
  {
    source: 'EUR',
    target: 'DXY',
    sourceLabel: 'Euro (EUR)',
    targetLabel: 'Dolar AS (DXY)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'CURRENCY',
    historicalCorrelation: -0.96,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Dominasi Bobot (EUR 57,6% dari DXY)',
    transmissionMechanism:
      'Karena EUR mewakili 57,6% dari keranjang mata uang DXY, kejutan ekonomi Zona Euro dan keputusan kebijakan ECB langsung tercermin pada pergerakan DXY dengan transmisi invers hampir sempurna.',
  },
];

const CORRELATION_LABELS: Record<string, string> = {
  STRONG_INVERSE: 'INVERS KUAT',
  MODERATE_INVERSE: 'INVERS MODERAT',
  STRONG_POSITIVE: 'POSITIF KUAT',
  MODERATE_POSITIVE: 'POSITIF MODERAT',
  NEUTRAL: 'NETRAL',
};

export const IntermarketRelationshipMatrix: React.FC<IntermarketRelationshipMatrixProps> = ({
  prices,
  strengths,
  onOpenChart,
  onSelectSymbol,
  onRefresh,
  isRefreshing = false,
}) => {
  const [selectedRelIndex, setSelectedRelIndex] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CURRENCIES' | 'COMMODITIES' | 'YIELDS'>('ALL');

  // Helper to extract asset price data
  const getPrice = (symbol: string): MarketPrice | undefined => {
    return prices.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
  };

  // Helper to extract currency strength score
  const getStrength = (code: string): CurrencyStrength | undefined => {
    return strengths.find(s => s.currency.toUpperCase() === code.toUpperCase());
  };

  // Derived yield proxy: estimated based on DXY momentum and relative interest rate environment
  const dxyPrice = getPrice('USD');
  const goldPrice = getPrice('XAUUSD');
  const sp500Price = getPrice('US500');
  const nasdaqPrice = getPrice('US100');
  const btcPrice = getPrice('BTC');

  const usdStrength = getStrength('USD');
  const jpyStrength = getStrength('JPY');
  const audStrength = getStrength('AUD');
  const cadStrength = getStrength('CAD');
  const eurStrength = getStrength('EUR');

  // Implied 10Y Yield benchmark proxy (using DXY rate differential and Fed policy indicators)
  const yieldProxyChangePct = useMemo(() => {
    // If DXY moved, yields generally move in positive lockstep (+65% sensitivity)
    const dxyChg = dxyPrice?.change_24h_pct ?? 0;
    const usdSc = (usdStrength?.strength_score ?? 50) - 50;
    return Number(((dxyChg * 0.75) + (usdSc * 0.02)).toFixed(2));
  }, [dxyPrice, usdStrength]);

  // Calculate live alignment status for each canonical relationship
  const relationshipTelemetry = useMemo(() => {
    return CANONICAL_RELATIONSHIPS.map((rel) => {
      let sourceChangePct = 0;
      let targetChangePct = 0;

      // Extract source change
      if (rel.source === 'DXY') {
        sourceChangePct = dxyPrice?.change_24h_pct ?? ((usdStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'US10Y') {
        sourceChangePct = yieldProxyChangePct;
      } else if (rel.source === 'CAD') {
        sourceChangePct = ((cadStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'AUD') {
        sourceChangePct = ((audStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'JPY') {
        sourceChangePct = ((jpyStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'EUR') {
        sourceChangePct = ((eurStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'BTC') {
        sourceChangePct = btcPrice?.change_24h_pct ?? 0;
      }

      // Extract target change
      if (rel.target === 'XAUUSD') {
        targetChangePct = goldPrice?.change_24h_pct ?? 0;
      } else if (rel.target === 'US500') {
        targetChangePct = sp500Price?.change_24h_pct ?? 0;
      } else if (rel.target === 'US100') {
        targetChangePct = nasdaqPrice?.change_24h_pct ?? 0;
      } else if (rel.target === 'DXY') {
        targetChangePct = dxyPrice?.change_24h_pct ?? 0;
      }

      // Compute observed intraday correlation alignment
      const isExpectedNegative = rel.historicalCorrelation < 0;
      const movedOpposite = (sourceChangePct > 0 && targetChangePct < 0) || (sourceChangePct < 0 && targetChangePct > 0);
      const movedTogether = (sourceChangePct > 0 && targetChangePct > 0) || (sourceChangePct < 0 && targetChangePct < 0);
      const isNegligible = Math.abs(sourceChangePct) < 0.05 && Math.abs(targetChangePct) < 0.05;

      let alignment: 'ALIGNED' | 'DIVERGENT' | 'NEUTRAL_QUIET' = 'ALIGNED';
      if (isNegligible) {
        alignment = 'NEUTRAL_QUIET';
      } else if (isExpectedNegative) {
        alignment = movedOpposite ? 'ALIGNED' : 'DIVERGENT';
      } else {
        alignment = movedTogether ? 'ALIGNED' : 'DIVERGENT';
      }

      return {
        ...rel,
        sourceChangePct,
        targetChangePct,
        alignment,
        isDivergenceRisk: alignment === 'DIVERGENT' && (Math.abs(sourceChangePct) > 0.25 || Math.abs(targetChangePct) > 0.25),
      };
    });
  }, [dxyPrice, goldPrice, sp500Price, nasdaqPrice, btcPrice, usdStrength, jpyStrength, audStrength, cadStrength, eurStrength, yieldProxyChangePct]);

  // Overall Intermarket Macro Regime
  const macroRegime = useMemo(() => {
    const dxyChg = dxyPrice?.change_24h_pct ?? 0;
    const goldChg = goldPrice?.change_24h_pct ?? 0;
    const spxChg = sp500Price?.change_24h_pct ?? 0;
    const jpyScore = jpyStrength?.strength_score ?? 50;
    const audScore = audStrength?.strength_score ?? 50;

    const riskBeta = spxChg + (audScore - jpyScore) * 0.03;

    if (riskBeta > 0.4 && dxyChg <= 0.1) {
      return {
        regime: 'PRO-SIKLIKAL RISK-ON',
        description: 'Ekspansi ekuitas & permintaan carry komoditas mendominasi; aset safe-haven tertekan.',
        badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60',
        sentiment: 'RISK_ON',
      };
    } else if (goldChg > 0.3 && dxyChg > 0.2) {
      return {
        regime: 'AKUMULASI SAFE-HAVEN NEGARA',
        description: 'Emas & Dolar AS melonjak bersamaan; menandakan ketegangan geopolitik akut atau kehati-hatian likuiditas sistemik.',
        badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-700/60',
        sentiment: 'DEFENSIVE_FLIGHT',
      };
    } else if (riskBeta < -0.3 || (jpyScore > 65 && spxChg < -0.2)) {
      return {
        regime: 'RISK-OFF DEFENSIF & DELEVERAGING',
        description: 'Modal mengalir ke JPY dan obligasi negara; aset risiko dan mata uang carry tertekan.',
        badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-700/60',
        sentiment: 'RISK_OFF',
      };
    } else if (dxyChg > 0.35 && goldChg < -0.3) {
      return {
        regime: 'PENEKANAN DOMINASI DOLAR',
        description: 'Yield lebih tinggi dan permintaan dolar menekan harga aset global dan arus pasar berkembang.',
        badgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60',
        sentiment: 'USD_DOMINANCE',
      };
    } else {
      return {
        regime: 'KONSOLIDASI / ARUS SEIMBANG',
        description: 'Arus silang intermarket netral; menunggu katalis pidato bank sentral atau data makro tier-1 mendatang.',
        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        sentiment: 'BALANCED',
      };
    }
  }, [dxyPrice, goldPrice, sp500Price, jpyStrength, audStrength]);

  const filteredRelationships = useMemo(() => {
    if (filterCategory === 'CURRENCIES') {
      return relationshipTelemetry.filter(r => r.sourceCategory === 'CURRENCY' || r.targetCategory === 'CURRENCY');
    }
    if (filterCategory === 'COMMODITIES') {
      return relationshipTelemetry.filter(r => r.sourceCategory === 'COMMODITY' || r.targetCategory === 'COMMODITY');
    }
    if (filterCategory === 'YIELDS') {
      return relationshipTelemetry.filter(r => r.sourceCategory === 'YIELD' || r.targetCategory === 'YIELD');
    }
    return relationshipTelemetry;
  }, [relationshipTelemetry, filterCategory]);

  const activeRel = relationshipTelemetry[selectedRelIndex] || relationshipTelemetry[0];

  return (
    <div className="space-y-4">
      {/* 1. HEADER & INTERREZIM PASAR BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Compass className="w-4 h-4" />
              </span>
              <h1 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
                Matriks Hubungan Intermarket
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                KERANGKA MURPHY
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Pemetaan saling ketergantungan lintas aset real-time: Mata Uang (DXY, G8), Komoditas (Emas, Minyak), Yield Benchmark (US10Y), dan Ekuitas (S&P 500, Nasdaq).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-2"
                title="Sinkronkan Feed Live Intermarket"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Sinkron Lintas Aset</span>
              </button>
            )}

            <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-right">
              <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                Rezim Intermarket Saat Ini
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`inline-block w-2 h-2 rounded-full ${macroRegime.sentiment === 'RISK_ON' ? 'bg-emerald-400' : macroRegime.sentiment === 'RISK_OFF' ? 'bg-rose-400' : 'bg-indigo-400'} animate-pulse`} />
                <span className="text-xs font-bold font-mono text-slate-200">
                  {macroRegime.regime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Cross-Asset Anchor Tickers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          {/* US Dollar (DXY) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Dolar AS (DXY)</span>
              <span className={`font-bold ${(dxyPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(dxyPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(dxyPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {dxyPrice?.price ? dxyPrice.price.toFixed(2) : (usdStrength?.strength_score ? `${usdStrength.strength_score} pts` : '103.80')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Likuiditas Utama</span>
              <span className="text-indigo-400 font-mono">DXY</span>
            </div>
          </div>

          {/* Gold (XAUUSD) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Emas (XAU/USD)</span>
              <span className={`font-bold ${(goldPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(goldPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(goldPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              ${goldPrice?.price ? goldPrice.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '2,685.4'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Penyimpan Safe-Haven</span>
              <span className="text-amber-400 font-mono">XAU</span>
            </div>
          </div>

          {/* S&P 500 (US500) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>S&P 500 (US500)</span>
              <span className={`font-bold ${(sp500Price?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(sp500Price?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(sp500Price?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {sp500Price?.price ? sp500Price.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '5,780'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Risiko Ekuitas Luas</span>
              <span className="text-cyan-400 font-mono">SPX</span>
            </div>
          </div>

          {/* Nasdaq 100 (US100) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Nasdaq 100 (US100)</span>
              <span className={`font-bold ${(nasdaqPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(nasdaqPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(nasdaqPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {nasdaqPrice?.price ? nasdaqPrice.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '20,410'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Beta Durasi Tinggi</span>
              <span className="text-purple-400 font-mono">NDX</span>
            </div>
          </div>

          {/* 10Y Yield Benchmark Proxy */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Yield US 10Y Tersirat</span>
              <span className={`font-bold ${yieldProxyChangePct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {yieldProxyChangePct >= 0 ? '+' : ''}
                {yieldProxyChangePct.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              Suku Bunga {yieldProxyChangePct >= 0 ? 'Menguat' : 'Melunak'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Biaya Diskon</span>
              <span className="text-amber-300 font-mono">US10Y</span>
            </div>
          </div>

          {/* Bitcoin (BTC) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Bitcoin (BTC)</span>
              <span className={`font-bold ${(btcPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(btcPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(btcPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              ${btcPrice?.price ? btcPrice.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '68,400'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Likuiditas Spekulatif</span>
              <span className="text-orange-400 font-mono">BTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: MATRIX GRID & DETAILED TRANSMISSION INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: INTERDEPENDENCY MATRIX (7 COLS) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Matriks Transmisi Kanonik
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                {(['ALL', 'CURRENCIES', 'COMMODITIES', 'YIELDS'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-1 rounded transition-colors ${
                      filterCategory === cat
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {translateFilter(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-2 mt-3">
              {filteredRelationships.map((item, idx) => {
                const isSelected = selectedRelIndex === idx;
                const isNegative = item.historicalCorrelation < 0;

                return (
                  <div
                    key={`${item.source}-${item.target}`}
                    onClick={() => setSelectedRelIndex(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/60 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 border border-slate-700">
                            {item.source}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 border border-slate-700">
                            {item.target}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          ({item.sourceLabel} vs {item.targetLabel})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Alignment Badge */}
                        {item.alignment === 'ALIGNED' ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            SELARAS
                          </span>
                        ) : item.alignment === 'DIVERGENT' ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            DIVERGEN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700">
                            SEPI
                          </span>
                        )}

                        {/* Benchmark Correlation Tag */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isNegative
                              ? 'bg-purple-950/40 text-purple-300 border-purple-800/50'
                              : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50'
                          }`}
                        >
                          r = {item.historicalCorrelation.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Intraday Realized Flow Comparison */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                      <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded">
                        <span className="text-[10px] text-slate-400">{item.source}:</span>
                        <span className={`font-bold ${item.sourceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.sourceChangePct >= 0 ? '+' : ''}
                          {item.sourceChangePct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded">
                        <span className="text-[10px] text-slate-400">{item.target}:</span>
                        <span className={`font-bold ${item.targetChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.targetChangePct >= 0 ? '+' : ''}
                          {item.targetChangePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Divergence warning banner if triggered */}
                    {item.isDivergenceRisk && item.divergenceAlertRule && (
                      <div className="mt-2 p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>{item.divergenceAlertRule}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DEEP-DIVE TRANSMISSION & TRADING PLAYBOOK (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Mekanika Transmisi Makro
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                PASANGAN: {activeRel.source} / {activeRel.target}
              </span>
            </div>

            {/* Selected Relationship Overview */}
            <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-500">
                  Pendorong Ekonomi Utama
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-400">
                  {CORRELATION_LABELS[activeRel.correlationNature] ?? activeRel.correlationNature}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {activeRel.primaryDriver}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                {activeRel.transmissionMechanism}
              </p>
            </div>

            {/* Causal Step-by-Step Flow */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                Rantai Transmisi Kausal
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">1. Aset Pemicu:</span>
                  <span className="font-bold text-indigo-300">{activeRel.sourceLabel}</span>
                </div>
                <div className="flex justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">2. Kanal Transmisi:</span>
                  <span className="font-bold text-amber-300">{activeRel.primaryDriver}</span>
                </div>
                <div className="flex justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">3. Aset Terdampak:</span>
                  <span className="font-bold text-cyan-300">{activeRel.targetLabel}</span>
                </div>
              </div>
            </div>

            {/* Trader Actionable Takeaway */}
            <div className="mt-4 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-indigo-300">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Implikasi Trading yang Dapat Ditindaklanjuti</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeRel.historicalCorrelation < 0
                  ? `Dengan hubungan invers (r = ${activeRel.historicalCorrelation}), saat ${activeRel.source} menunjukkan momentum breakout, cari setup penolakan yang kembali ke rata-rata pada ${activeRel.target}.`
                  : `Dengan pergerakan searah (r = +${activeRel.historicalCorrelation}), konfirmasi pada ${activeRel.source} memvalidasi setup kelanjutan tren pada ${activeRel.target}.`}
              </p>
            </div>

            {/* TradingView Chart Button */}
            {onOpenChart && (
              <button
                onClick={() => {
                  const sym = activeRel.target === 'XAUUSD' ? 'XAUUSD' : activeRel.source === 'DXY' ? 'USD' : activeRel.target;
                  onOpenChart(sym);
                }}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-mono font-bold text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <LineChart className="w-3.5 h-3.5 text-indigo-400" />
                <span>Buka Grafik TradingView untuk {activeRel.target}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
