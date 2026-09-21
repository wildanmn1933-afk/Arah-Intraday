/**
 * Engine Arah Market Hari Ini (Intraday Triple-Confluence Synthesis)
 * 
 * Mengintegrasikan 3 Pilar Intraday:
 * 1. FUNDAMENTAL (Katalis rilis makro, inflasi CPI, tensi bank sentral)
 * 2. INTERMARKET (Yields US02Y, US10Y, Spread US-DE/US-JP, DXY vs Session Open, Gold vs Real Yields)
 * 3. PRICE ACTION (Posisi harga terhadap range sesi, retest support/resisten, breakout)
 * 
 * Menghasilkan konfluensi yang fleksibel (tidak kaku):
 * - HIGH_CONVICTION (3/3 sepakat)
 * - MODERATE (2/3 sepakat)
 * - CAUTION_TRAP (1/3 anomali / fakeout warning)
 * - NEUTRAL_CHOP (konsolidasi tanpa arah)
 */

import { db } from '../db/database.js';
import { findAsset } from '../../shared/canonicalAssets.js';
import {
  ArahMarketTodayData,
  IntradayPairConfluence,
  IntermarketSpreadItem,
  TradingSessionName,
  MarketPrice,
  CurrencyStrength,
} from '../types.js';

export class ArahMarketEngine {
  /**
   * Menghasilkan sintesis real-time terpadu untuk segmen Arah Market Hari Ini
   */
  public static getArahMarketToday(): ArahMarketTodayData {
    const prices = db.getAllMarketPrices();
    const strengths = db.getCurrencyStrength();
    const events = db.getAllEvents(30);
    const macroCalendar = db.getEconomicEvents(30);

    const priceMap = new Map<string, MarketPrice>();
    prices.forEach(p => priceMap.set(p.symbol, p));

    const strengthMap = new Map<string, CurrencyStrength>();
    strengths.forEach(s => strengthMap.set(s.currency, s));

    // 1. Tentukan Sesi Aktif Berdasarkan Jam UTC
    const now = new Date();
    const utcHour = now.getUTCHours();
    let activeSession: TradingSessionName = 'LONDON';
    let sessionStatusText = 'Sesi London Aktif (Likuiditas Valuta Eropa & Komoditas)';

    if (utcHour >= 13 && utcHour < 16) {
      activeSession = 'OVERLAP';
      sessionStatusText = 'London - New York Overlap (Puncak Likuiditas & Volatilitas Global)';
    } else if (utcHour >= 16 && utcHour < 21) {
      activeSession = 'NEW_YORK';
      sessionStatusText = 'Sesi New York Aktif (Fokus Data AS, Wall Street & Obligasi)';
    } else if (utcHour >= 21 || utcHour < 0) {
      activeSession = 'SYDNEY';
      sessionStatusText = 'Sesi Pasifik / Sydney (Likuiditas Awal Pasifik)';
    } else if (utcHour >= 0 && utcHour < 8) {
      activeSession = 'TOKYO';
      sessionStatusText = 'Sesi Asia / Tokyo Aktif (Fokus BoJ, Yen & Sentimen Regional)';
    }

    // 2. Barometer Intermarket Kunci
    const dxyPrice = priceMap.get('USD')?.price || 103.8;
    const dxyChange = priceMap.get('USD')?.change_24h_pct || 0;
    const us10yPrice = priceMap.get('US10Y')?.price || 4.25;
    const us10yChange = priceMap.get('US10Y')?.change_24h_pct || 0;
    const sp500Change = priceMap.get('US500')?.change_24h_pct || 0;
    const goldChange = priceMap.get('XAUUSD')?.change_24h_pct || 0;

    const dxyBiasVsOpen: 'ABOVE_OPEN' | 'BELOW_OPEN' | 'AT_OPEN' =
      dxyChange > 0.05 ? 'ABOVE_OPEN' : dxyChange < -0.05 ? 'BELOW_OPEN' : 'AT_OPEN';

    // Estimasi Yield Spreads & Differential
    // US10Y - US02Y (Curve Slope: US02Y proksi bergerak sensitif terhadap The Fed)
    const us02yEstimated = us10yPrice - (dxyChange > 0 ? -0.15 : 0.20);
    const us10yMinusUs02y = Number((us10yPrice - us02yEstimated).toFixed(2));

    // US10Y vs Bund Jerman 10Y (Proksi Jerman ~ 2.45%)
    const bund10yEstimated = 2.42;
    const usDeSpread = Number((us10yPrice - bund10yEstimated).toFixed(2));

    // US10Y vs JGB Jepang 10Y (Proksi Jepang ~ 0.95%)
    const jgb10yEstimated = 0.98;
    const usJpSpread = Number((us10yPrice - jgb10yEstimated).toFixed(2));

    // US 10Y Real Yields (Nominal 10Y - Breakeven 2.25%)
    const realYield10y = Number((us10yPrice - 2.25).toFixed(2));

    const intermarketSpreads: IntermarketSpreadItem[] = [
      {
        id: 'spread-us10y-us02y',
        name: 'US Yield Curve Slope',
        formulaLabel: 'US10Y - US02Y',
        currentValue: us10yMinusUs02y,
        unit: '%',
        changeSessionBps: dxyChange > 0 ? +3.2 : -2.5,
        trend: dxyChange > 0 ? 'WIDENING' : 'NARROWING',
        targetPair: 'US500',
        interpretation:
          us10yMinusUs02y > 0
            ? 'Kurva yield normal (disinflasi bertahap, sentimen pasar saham relatif stabil).'
            : 'Kurva flat/inversi (tekanan pengetatan likuiditas The Fed jangka pendek masih aktif).',
      },
      {
        id: 'spread-us-de',
        name: 'Transatlantic Rate Differential',
        formulaLabel: 'US10Y - Bund 10Y',
        currentValue: usDeSpread,
        unit: '%',
        changeSessionBps: us10yChange > 0 ? +4.5 : -3.0,
        trend: us10yChange > 0 ? 'WIDENING' : 'NARROWING',
        targetPair: 'EURUSD',
        interpretation:
          usDeSpread > 1.7
            ? 'Spread melebar untuk keunggulan US Dollar (Gravitasi EUR/USD cenderung tertahan/tertekan).'
            : 'Spread menyempit (membuka ruang penguatan bagi mata uang Euro).',
      },
      {
        id: 'spread-us-jp',
        name: 'Carry Trade Yield Engine',
        formulaLabel: 'US10Y - JGB 10Y',
        currentValue: usJpSpread,
        unit: '%',
        changeSessionBps: us10yChange > 0 ? +5.1 : -4.2,
        trend: us10yChange > 0 ? 'WIDENING' : 'NARROWING',
        targetPair: 'USDJPY',
        interpretation:
          usJpSpread > 3.0
            ? 'Selisih suku bunga AS-Jepang sangat lebar (Bahan bakar utama kenaikan USD/JPY / Carry Trade long USD).'
            : 'Selisih bunga melandai (waspada pembalikan penguatan Yen / aksi unwinding).',
      },
      {
        id: 'spread-real-yield',
        name: 'US 10Y Real Yield (TIPS)',
        formulaLabel: 'Nominal 10Y - Inflation Exp',
        currentValue: realYield10y,
        unit: '%',
        changeSessionBps: us10yChange > 0 ? +2.8 : -1.9,
        trend: us10yChange > 0 ? 'WIDENING' : 'NARROWING',
        targetPair: 'XAUUSD',
        interpretation:
          realYield10y > 1.9
            ? 'Real yield tinggi menaikkan opportunity cost emas (XAU/USD rentan menghadapi resistensi saat reli).'
            : 'Real yield melandai di bawah 1.8% (Katalis positif bagi reli safe-haven Emas).',
      },
    ];

    // 3. Klasifikasi Rezim Pasar Global
    let regimeTitle = 'BALANCED ROTATIONAL REGIME';
    let regimeBadgeColor = 'bg-cyan-950 text-cyan-300 border-cyan-800';
    let riskScore = 15;
    let summaryNarrative =
      'Aliran modal intraday berputar seimbang antar kelas aset. Tidak ada dominasi kepanikan atau euforia berlebih menjelang rilis data utama sesi berikutnya.';

    if (us10yChange > 0.4 && dxyChange > 0.2) {
      regimeTitle = 'HAWKISH YIELD PRESSURE';
      regimeBadgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
      riskScore = -45;
      summaryNarrative =
        'Kenaikan imbal hasil obligasi AS dan penguatan DXY di atas harga buka sesi mendominasi arah pasar. Pasangan valuta non-USD dan aset berimbal hasil rendah tertekan.';
    } else if (sp500Change > 0.4 && dxyChange < -0.15) {
      regimeTitle = 'RISK-ON EXPANSION';
      regimeBadgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
      riskScore = +65;
      summaryNarrative =
        'Sentimen selera risiko tinggi. Dolar melemah seiring masuknya modal global ke pasar saham dan mata uang komoditas (AUD, CAD, NZD).';
    } else if (sp500Change < -0.5 && goldChange > 0.3) {
      regimeTitle = 'GLOBAL FLIGHT TO SAFETY';
      regimeBadgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
      riskScore = -75;
      summaryNarrative =
        'Kekhawatiran geopolitik atau perlambatan makro memicu aksi jual saham dan perburuan aset safe-haven (Emas & Swiss Franc).';
    } else if (dxyChange < -0.3 && us10yChange < -0.5) {
      regimeTitle = 'DOVISH LIQUIDITY EASING';
      regimeBadgeColor = 'bg-indigo-950 text-indigo-300 border-indigo-800';
      riskScore = +35;
      summaryNarrative =
        'Pelemahan tajam imbal hasil obligasi AS dan Dolar membebaskan tekanan likuiditas global, memicu rebound pada Emas dan Valuta Mayor.';
    }

    // Ambil berita terbaru yang berdampak
    const topCatalyst = events.find(e => e.impact_level === 'CRITICAL' || e.impact_level === 'HIGH');

    // 4. Deteksi Peringatan Anomali / Divergensi
    const anomalyAlerts: ArahMarketTodayData['anomalyAlerts'] = [];

    // Deteksi Anomali Emas vs DXY
    if (dxyChange < -0.15 && goldChange < -0.1) {
      anomalyAlerts.push({
        id: 'anomaly-gold-dxy',
        severity: 'WARNING',
        title: 'Anomali XAU/USD: Emas Gagal Naik Saat Dolar Melemah',
        description:
          'DXY mengalami pelemahan intraday, namun XAU/USD tidak mampu memanfaatkan pelemahan ini dan justru terkonsolidasi/melemah. Mengindikasikan tekanan jual internal atau real yield yang masih kaku.',
        affectedPairs: ['XAUUSD', 'EURUSD'],
        actionAdvice: 'Waspadai aksi jebakan beli (bull trap) pada Emas. Jangan buru-buru Buy sebelum harga menembus resisten kunci sesi.',
      });
    }

    // Deteksi Anomali USD/JPY vs Spread
    if (usJpSpread > 3.2 && (priceMap.get('JPY')?.change_24h_pct || 0) < -0.3) {
      anomalyAlerts.push({
        id: 'anomaly-usdjpy-intervention',
        severity: 'WARNING',
        title: 'USD/JPY Overextended vs Spread (Zona Sensitif Intervensi)',
        description:
          'Meskipun spread imbal hasil mendukung kenaikan, level harga saat ini berada di area intervensi verbal Kementerian Keuangan Jepang (MoF/BoJ).',
        affectedPairs: ['USDJPY'],
        actionAdvice: 'Batasi eksposur Buy panjang; siapkan stop loss ketat karena potensi ayunan intervensi sewaktu-waktu.',
      });
    }

    // Jika tidak ada anomali negatif, beri kabar konfirmasi positif
    if (anomalyAlerts.length === 0) {
      anomalyAlerts.push({
        id: 'confluence-alignment-ok',
        severity: 'OPPORTUNITY',
        title: 'Konfirmasi Intermarket Selaras Normal',
        description:
          'Hubungan transmisi antara Dolar, Yields Obligasi AS, dan Valuta Mayor saat ini berjalan seirama tanpa anomali struktural.',
        affectedPairs: ['EURUSD', 'USDJPY', 'XAUUSD'],
        actionAdvice: 'Fokus pada strategi trend-following searah dengan pembukaan sesi saat ini.',
      });
    }

    // 5. Matriks Pasangan Intraday (Triple-Confluence Synthesis)
    // Hanya aset yang relevan untuk arah intraday; detail nama/TV symbol tetap
    // diambil dari registry kanonik agar tidak ada duplikasi data.
    const ARAH_MARKET_SYMBOLS = ['XAUUSD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'US500', 'US100', 'US30', 'BTC'];

    const targetPairs = ARAH_MARKET_SYMBOLS.map(symbol => {
      const asset = findAsset(symbol);
      if (!asset) throw new Error(`Aset '${symbol}' tidak terdaftar di CANONICAL_ASSETS`);
      return {
        pair: asset.pair || asset.symbol,
        name: asset.displayName,
        tv: asset.tvSymbol,
        priceSymbol: asset.symbol,
      };
    });

    const pairs: IntradayPairConfluence[] = targetPairs.map(tp => {
      // FX dikuotasi di feed sebagai kode mata uang tunggal (EUR, GBP, JPY, dst),
      // sedangkan kartu menampilkan nama pasangan (EURUSD, GBPUSD, dst).
      const pObj = priceMap.get(tp.priceSymbol || tp.pair);
      const curPrice = pObj?.price || 0;
      const chg = pObj?.change_24h_pct || 0;
      const usdScore = strengthMap.get('USD')?.strength_score || 5.0;

      // Hitung 3 Pilar per Pair
      let fundBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      let fundDriver = 'Data ekonomi AS memandu ekspektasi suku bunga The Fed';
      let fundScore = 0;

      let interBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      let interSymptom = 'DXY bergerak moderat di sekitar harga buka sesi';
      let interScore = 0;

      let paBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      let paStructure: 'SESSION_BREAKOUT' | 'RETEST_SUPPORT' | 'RETEST_RESISTANCE' | 'CHOP_RANGE' = 'CHOP_RANGE';
      let actionableZone = 'Amati batas support/resisten sesi';
      let paScore = 0;

      let recommendedAction: 'LOOK_FOR_BUY' | 'LOOK_FOR_SELL' | 'WAIT_ON_SUPPORT' | 'CAUTION_NO_TRADE' = 'WAIT_ON_SUPPORT';
      let invalidation = 'Penutupan candle H1 di luar level acuan';

      if (tp.pair === 'XAUUSD') {
        fundBias = usdScore > 5.2 ? 'BEARISH' : usdScore < 4.8 ? 'BULLISH' : 'NEUTRAL';
        fundDriver = 'Ekspektasi kebijakan suku bunga The Fed & premi lindung nilai geopolitik';
        fundScore = fundBias === 'BULLISH' ? 45 : fundBias === 'BEARISH' ? -40 : 0;

        interBias = realYield10y > 1.9 ? 'BEARISH' : 'BULLISH';
        interSymptom = realYield10y > 1.9 ? 'Yield riil AS bertahan tinggi menekan emas' : 'Yield melandai membuka reli safe-haven';
        interScore = interBias === 'BULLISH' ? 40 : -40;

        paBias = chg > 0.2 ? 'BULLISH' : chg < -0.2 ? 'BEARISH' : 'NEUTRAL';
        paStructure = chg > 0.3 ? 'SESSION_BREAKOUT' : chg < -0.3 ? 'RETEST_SUPPORT' : 'CHOP_RANGE';
        actionableZone = chg > 0 ? 'Pullback ke demand sesi terdekat' : 'Uji area support sesi bawah';
        paScore = chg > 0.2 ? 35 : chg < -0.2 ? -35 : 0;

        if (fundBias === 'BULLISH' && interBias === 'BULLISH') {
          recommendedAction = 'LOOK_FOR_BUY';
          invalidation = 'Jika DXY breakout kuat ke atas session high';
        } else if (fundBias === 'BEARISH' && interBias === 'BEARISH') {
          recommendedAction = 'LOOK_FOR_SELL';
          invalidation = 'Jika yield US10Y anjlok di bawah level support intraday';
        } else {
          recommendedAction = 'WAIT_ON_SUPPORT';
          invalidation = 'Menunggu konfirmasi breakout sesi';
        }
      } else if (tp.pair === 'EURUSD') {
        const eurScore = strengthMap.get('EUR')?.strength_score || 5.0;
        fundBias = eurScore > usdScore ? 'BULLISH' : 'BEARISH';
        fundDriver = 'Divergensi prospek moneter Bank Sentral Eropa (ECB) vs The Fed';
        fundScore = fundBias === 'BULLISH' ? 40 : -45;

        interBias = dxyBiasVsOpen === 'ABOVE_OPEN' ? 'BEARISH' : 'BULLISH';
        interSymptom = `Spread US-DE di ${usDeSpread}% ${usDeSpread > 1.7 ? 'mendukung Dolar' : 'kondusif bagi Euro'}`;
        interScore = interBias === 'BULLISH' ? 40 : -50;

        paBias = chg > 0.1 ? 'BULLISH' : chg < -0.1 ? 'BEARISH' : 'NEUTRAL';
        paStructure = chg < -0.2 ? 'SESSION_BREAKOUT' : 'CHOP_RANGE';
        actionableZone = chg < 0 ? 'Sell on rally di resisten terdekat' : 'Buy on dip di support sesi';
        paScore = chg > 0.1 ? 30 : -35;

        recommendedAction = interBias === 'BEARISH' ? 'LOOK_FOR_SELL' : 'LOOK_FOR_BUY';
        invalidation = 'Breakout berlawanan pada DXY melintasi Session Open';
      } else if (tp.pair === 'USDJPY') {
        fundBias = 'BULLISH';
        fundDriver = 'Kesenjangan suku bunga ekstrim The Fed vs suku bunga rendah Bank of Japan';
        fundScore = +60;

        interBias = usJpSpread > 3.0 ? 'BULLISH' : 'NEUTRAL';
        interSymptom = `Yield spread AS-Jepang sangat lebar (${usJpSpread}%) memicu insentif carry trade`;
        interScore = +55;

        paBias = chg > 0 ? 'BULLISH' : 'NEUTRAL';
        paStructure = chg > 0.2 ? 'SESSION_BREAKOUT' : 'RETEST_RESISTANCE';
        actionableZone = 'Pantau reaksi harga di dekat level psikologis';
        paScore = chg > 0 ? 40 : -10;

        recommendedAction = 'LOOK_FOR_BUY';
        invalidation = 'Sinyal intervensi verbal pejabat MoF/BoJ';
      } else if (tp.pair === 'US100' || tp.pair === 'US30') {
        // Indeks saham AS: sensitif terhadap ekspektasi suku bunga (yield) & selera risiko,
        // dengan Nasdaq (US100) jauh lebih sensitif terhadap yield dibanding Dow (US30).
        const isTechIndex = tp.pair === 'US100';
        const peerSymbol = isTechIndex ? 'US30' : 'US100';
        const peerChange = priceMap.get(peerSymbol)?.change_24h_pct || 0;
        const rotationGap = Number((chg - peerChange).toFixed(2));

        fundBias = chg > 0.3 ? 'BULLISH' : chg < -0.3 ? 'BEARISH' : 'NEUTRAL';
        fundDriver = isTechIndex
          ? 'Ekspektasi suku bunga The Fed & sensitivitas tinggi yield terhadap saham pertumbuhan'
          : 'Ekspektasi suku bunga The Fed & rotasi modal ke sektor industri siklikal';
        fundScore = fundBias === 'BULLISH' ? 40 : fundBias === 'BEARISH' ? -40 : 0;

        // Yield naik menekan indeks (Nasdaq lebih tertekan), yield turun menjadi bahan bakar reli
        const yieldThreshold = isTechIndex ? 0.05 : 0.15;
        interBias = us10yChange > yieldThreshold ? 'BEARISH' : dxyBiasVsOpen === 'BELOW_OPEN' ? 'BULLISH' : 'NEUTRAL';
        interSymptom = us10yChange > yieldThreshold
          ? `Yield US10Y naik ${us10yChange.toFixed(2)}% menekan valuasi ${isTechIndex ? 'saham teknologi' : 'indeks saham'}`
          : `DXY ${dxyBiasVsOpen === 'ABOVE_OPEN' ? 'di atas' : 'di bawah'} harga buka sesi`;
        interScore = interBias === 'BULLISH' ? 35 : interBias === 'BEARISH' ? -35 : 0;

        paBias = chg > 0.15 ? 'BULLISH' : chg < -0.15 ? 'BEARISH' : 'NEUTRAL';
        paStructure = chg > 0.4 ? 'SESSION_BREAKOUT' : chg < -0.4 ? 'RETEST_SUPPORT' : 'CHOP_RANGE';
        actionableZone = chg > 0 ? 'Buy on pullback ke demand sesi' : 'Tunggu retest supply sebelum sell';
        paScore = chg > 0.15 ? 35 : chg < -0.15 ? -35 : 0;

        // Cross-reference rotasi antar indeks sebagai konfirmasi tambahan
        const rotationNote = isTechIndex
          ? rotationGap > 0.2
            ? ' | Rotasi gap vs Dow +' + rotationGap + '%: growth memimpin.'
            : rotationGap < -0.2
              ? ' | Rotasi gap vs Dow ' + rotationGap + '%: value siklikal lebih kuat dari teknologi.'
              : ''
          : rotationGap > 0.2
            ? ' | Rotasi gap vs Nasdaq +' + rotationGap + '%: industrials melampaui teknologi (rotasi ke value).'
            : rotationGap < -0.2
              ? ' | Rotasi gap vs Nasdaq ' + rotationGap + '%: teknologi memimpin, Dow tertinggal.'
              : '';
        if (rotationNote) interSymptom += rotationNote;

        recommendedAction = fundBias === 'BULLISH' && interBias === 'BULLISH' ? 'LOOK_FOR_BUY'
          : fundBias === 'BEARISH' && interBias === 'BEARISH' ? 'LOOK_FOR_SELL'
          : chg > 0.15 && interBias !== 'BEARISH' ? 'LOOK_FOR_BUY'
          : chg < -0.15 && interBias !== 'BULLISH' ? 'LOOK_FOR_SELL'
          : 'WAIT_ON_SUPPORT';
        invalidation = 'Pembalikan arah menembus level pembukaan sesi atau lonjakan yield AS';
      } else {
        // Generic asset mapping
        const isUp = chg > 0.1;
        const isDown = chg < -0.1;

        fundBias = isUp ? 'BULLISH' : isDown ? 'BEARISH' : 'NEUTRAL';
        fundDriver = 'Sentimen likuiditas global dan sentimen selera risiko harian';
        fundScore = isUp ? 35 : isDown ? -35 : 0;

        interBias = dxyBiasVsOpen === 'BELOW_OPEN' ? 'BULLISH' : 'BEARISH';
        interSymptom = `DXY berada ${dxyBiasVsOpen === 'ABOVE_OPEN' ? 'di atas' : 'di bawah'} harga buka sesi`;
        interScore = interBias === 'BULLISH' ? 30 : -30;

        paBias = isUp ? 'BULLISH' : isDown ? 'BEARISH' : 'NEUTRAL';
        paStructure = isUp ? 'SESSION_BREAKOUT' : isDown ? 'RETEST_SUPPORT' : 'CHOP_RANGE';
        actionableZone = isUp ? 'Area pullback demand' : 'Area retracement supply';
        paScore = isUp ? 30 : isDown ? -30 : 0;

        recommendedAction = isUp && interBias === 'BULLISH' ? 'LOOK_FOR_BUY' : isDown && interBias === 'BEARISH' ? 'LOOK_FOR_SELL' : 'WAIT_ON_SUPPORT';
        invalidation = 'Pembalikan arah harga menembus level pembukaan sesi';
      }

      // Hitung Confluence Status & Conviction Score
      const biases = [fundBias, interBias, paBias];
      const bullishCount = biases.filter(b => b === 'BULLISH').length;
      const bearishCount = biases.filter(b => b === 'BEARISH').length;

      let directionalBias: IntradayPairConfluence['directionalBias'] = 'NEUTRAL';
      let confluenceStatus: IntradayPairConfluence['confluenceStatus'] = 'NEUTRAL_CHOP';
      let convictionScore = 50;

      if (bullishCount === 3) {
        directionalBias = 'STRONG_BULLISH';
        confluenceStatus = 'HIGH_CONVICTION';
        convictionScore = 92;
      } else if (bearishCount === 3) {
        directionalBias = 'STRONG_BEARISH';
        confluenceStatus = 'HIGH_CONVICTION';
        convictionScore = 92;
      } else if (bullishCount === 2) {
        directionalBias = 'BULLISH';
        confluenceStatus = 'MODERATE';
        convictionScore = 75;
      } else if (bearishCount === 2) {
        directionalBias = 'BEARISH';
        confluenceStatus = 'MODERATE';
        convictionScore = 75;
      } else if (paBias !== 'NEUTRAL' && (fundBias !== paBias && interBias !== paBias)) {
        // Price action melawan fundamental & intermarket
        directionalBias = paBias === 'BULLISH' ? 'BULLISH' : 'BEARISH';
        confluenceStatus = 'CAUTION_TRAP';
        convictionScore = 45;
        recommendedAction = 'CAUTION_NO_TRADE';
      } else {
        directionalBias = 'NEUTRAL';
        confluenceStatus = 'NEUTRAL_CHOP';
        convictionScore = 50;
      }

      return {
        pair: tp.pair,
        displayName: tp.name,
        currentPrice: curPrice,
        change24hPct: chg,
        directionalBias,
        confluenceStatus,
        convictionScore,
        fundamental: {
          bias: fundBias,
          keyDriver: fundDriver,
          score: fundScore,
        },
        intermarket: {
          bias: interBias,
          primarySymptom: interSymptom,
          score: interScore,
        },
        priceAction: {
          bias: paBias,
          structure: paStructure,
          actionableZone,
          score: paScore,
        },
        intradayPlan: {
          recommendedAction,
          invalidationTrigger: invalidation,
          warningNote: confluenceStatus === 'CAUTION_TRAP' ? 'Waspadai jebakan likuiditas; pergerakan harga tidak didukung pilar makro/intermarket.' : undefined,
        },
        tvSymbol: tp.tv,
      };
    });

    return {
      activeSession,
      sessionStatusText,
      globalRegime: {
        title: regimeTitle,
        badgeColor: regimeBadgeColor,
        riskScore,
        dxyBiasVsOpen,
        summaryNarrative,
        topCatalystHeadline: topCatalyst?.title,
      },
      intermarketSpreads,
      anomalyAlerts,
      pairs,
      generatedAt: now.toISOString(),
    };
  }
}
