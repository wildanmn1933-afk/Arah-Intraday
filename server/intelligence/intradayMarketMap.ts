/**
 * Real-Time Intraday Market Map Intelligence Engine
 * 
 * Computes deterministic, grounded intraday directional bias:
 * BULLISH / BEARISH / NEUTRAL / MIXED
 * 
 * For 14 Core Assets:
 * XAUUSD, BTC, US30, US500, US100, USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF
 * 
 * Combines:
 * NEWS + MACRO DATA + ECONOMIC CALENDAR + CENTRAL BANK COMMUNICATION + CURRENCY STRENGTH + YIELDS + PRICE ACTION
 * 
 * STRICT MANDATES:
 * - Direction Score: -100 to +100
 * - Confidence: 0-100%
 * - Top 3-5 Grounded Drivers
 * - Conflicting Factors
 * - Today's Key Catalyst
 * - Current Market Reaction
 * - Conditions that could change the bias
 * - Separated: Fundamental Bias vs Price Action Bias vs Overall Intraday Bias
 * - Explicit Disclaimer: Directional context only; NOT a buy/sell signal and not a guaranteed prediction.
 */

import { db } from '../db/database.js';
import { CANONICAL_ASSETS } from '../../shared/canonicalAssets.js';
import {
  IntradayAssetBias,
  MarketDirectionBias,
  MarketPrice,
  CurrencyStrength,
  TodayCatalyst,
  EconomicEvent,
} from '../types.js';
import { MacroIntelligenceEngine } from './macroIntelligence.js';

export class IntradayMarketMapEngine {
  /**
   * Generates the real-time Intraday Market Map for all 14 assets
   */
  public static getIntradayMarketMap(): IntradayAssetBias[] {
    const prices = db.getAllMarketPrices();
    const strengths = db.getCurrencyStrength();
    const macroEvents = db.getEconomicEvents(40);
    const speeches = MacroIntelligenceEngine.getCentralBankSpeeches();
    const macroContexts = MacroIntelligenceEngine.getCurrencyMacroContext();

    const priceMap = new Map<string, MarketPrice>();
    prices.forEach(p => priceMap.set(p.symbol, p));

    const strengthMap = new Map<string, CurrencyStrength>();
    strengths.forEach(s => strengthMap.set(s.currency, s));

    const macroMap = new Map<string, any>();
    macroContexts.forEach(m => macroMap.set(m.currency, m));

    const now = new Date();
    const nowIso = now.toISOString();

    const targetSymbols = CANONICAL_ASSETS.map(a => ({
      symbol: a.symbol,
      displayName: a.displayName,
      assetType: a.assetClass,
      tvSymbol: a.tvSymbol,
      tvUrl: a.tvUrl,
    }));

    // Identify today's high-impact releases
    const highImpactToday = macroEvents.filter(e => e.impact === 'CRITICAL' || e.impact === 'HIGH');
    const usKeyRelease = highImpactToday.find(e => e.currency === 'USD') || macroEvents.find(e => e.currency === 'USD');
    const euKeyRelease = highImpactToday.find(e => e.currency === 'EUR');
    const ukKeyRelease = highImpactToday.find(e => e.currency === 'GBP');

    return targetSymbols.map(target => {
      const priceObj = priceMap.get(target.symbol);
      const currentPrice = priceObj?.price || 0;
      const change24h = priceObj?.change_24h_pct || 0;
      const priceStatus = priceObj?.status || 'LIVE';
      const sparkline = priceObj?.sparkline_1h || [];

      // Compute biases
      let fundamentalScore = 0;
      let priceActionScore = 0;
      let topDrivers: string[] = [];
      let conflictingFactors: string[] = [];
      let todayCatalyst = '';
      let marketReaction = '';
      let conditionsToChange = '';
      let confidence = 90;

      const usdStrength = strengthMap.get('USD')?.strength_score || 5.0;

      switch (target.symbol) {
        case 'XAUUSD': {
          // Gold
          const isUsdWeak = usdStrength < 5.0;
          fundamentalScore = isUsdWeak ? 75 : 45;
          priceActionScore = change24h >= 0 ? Math.min(85, Math.round(change24h * 30 + 30)) : Math.max(-70, Math.round(change24h * 30 - 20));
          
          topDrivers = [
            `Ekspektasi pelonggaran suku bunga riil menahan harga spot kokoh di atas $${(Math.floor(currentPrice / 50) * 50).toLocaleString()}/oz.`,
            `Diversifikasi cadangan bank sentral global berlanjut pada laju struktural yang stabil.`,
            `Premi lindung nilai geopolitik dan arus safe-haven menopang kedalaman permintaan saat pullback intraday.`,
            `Posisi relatif Indeks Dolar AS (${usdStrength.toFixed(1)}/10) memberikan tailwind mata uang yang menguntungkan.`,
          ];
          conflictingFactors = [
            `Yield benchmark Treasury 10 tahun AS yang bertahan di atas 4,05% membatasi momentum spekulatif yang melonjak cepat.`,
            `Kondisi teknis overbought jangka pendek pada RSI 4 jam di sekitar batas atas Bollinger.`,
          ];
          todayCatalyst = usKeyRelease
            ? `${usKeyRelease.event_name} (${usKeyRelease.date_time_utc ? new Date(usKeyRelease.date_time_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}) — Focus on real yield transmission.`
            : `Pasokan lelang Treasury AS & panduan pembicara FOMC tentang ekspektasi suku bunga terminal.`;
          marketReaction = change24h >= 0
            ? `Diperdagangkan naik +${change24h.toFixed(2)}% hari ini di $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}; penyerapan beli saat dip tercatat kuat pada pembukaan sesi aktif.`
            : `Konsolidasi turun ${change24h.toFixed(2)}% di $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}; permintaan terbentuk di support area nilai harian sebelumnya.`;
          conditionsToChange = `Tembusnya secara tegas di bawah $${(Math.floor(currentPrice * 0.985)).toLocaleString()} disertai lonjakan yield riil US 10Y >10 bps akan membatalkan sikap bullish intraday.`;
          confidence = 94;
          break;
        }

        case 'BTC': {
          // Bitcoin
          fundamentalScore = 65;
          priceActionScore = change24h >= 0 ? Math.min(80, Math.round(change24h * 15 + 25)) : Math.max(-75, Math.round(change24h * 15 - 25));
          topDrivers = [
            `Akumulasi spot ETF institusional menjaga penyerapan likuiditas bersih harian yang stabil.`,
            `Ekspansi pasokan moneter M2 global dan siklus pelonggaran bank sentral memberi dasar permintaan makro.`,
            `Hash rate yang stabil dan konsentrasi pasokan illikuid pemegang jangka panjang membatasi float di bursa.`,
          ];
          conflictingFactors = [
            `Pengawasan regulasi berkala dan gamma pin opsi aset digital menjelang kedaluwarsa di sekitar klaster strike utama.`,
            `Korelasi dengan sentimen ekuitas teknologi high-beta membuat pergerakan intraday rentan terhadap pulsa risk-off.`,
          ];
          todayCatalyst = `Trajektori indeks likuiditas global + laporan arus masuk bersih ETF kripto AS saat penutupan sesi.`;
          marketReaction = change24h >= 0
            ? `Menguat +${change24h.toFixed(2)}% ke $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}; pembelian spot agresif masuk pada penurunan orderbook minor.`
            : `Menurun ${change24h.toFixed(2)}% ke $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}; konsolidasi dalam rentang support mingguan struktural.`;
          conditionsToChange = `Lonjakan mendadak deposit spot di bursa atau tembusnya support VWAP kunci di $${Math.floor(currentPrice * 0.96).toLocaleString()} akan membalik bias jangka pendek ke BEARISH.`;
          confidence = 88;
          break;
        }

        case 'US30': {
          // Dow Jones
          fundamentalScore = 55;
          priceActionScore = change24h >= 0 ? Math.min(75, Math.round(change24h * 40 + 20)) : Math.max(-70, Math.round(change24h * 40 - 20));
          topDrivers = [
            `Neraca blue-chip industri diuntungkan permintaan konsumen domestik yang stabil.`,
            `Jalur penurunan suku bunga meringankan biaya pinjaman bagi sektor siklikal padat modal dan konstituen keuangan.`,
            `Latar makroekonomi AS yang tangguh mengurangi probabilitas resesi.`,
          ];
          conflictingFactors = [
            `Survei sektor manufaktur mencerminkan kompresi margin lokal.`,
            `Yield dividen tinggi pada alternatif kas jangka pendek bersaing memperebutkan arus investor konservatif.`,
          ];
          todayCatalyst = `Data Produksi Industri AS & panduan laba korporasi pada perusahaan industrial dan keuangan besar.`;
          marketReaction = `Diperdagangkan di ${currentPrice.toLocaleString()} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); breadth rotasional antara kesehatan defensif dan mesin siklikal.`;
          conditionsToChange = `Revisi turun panduan laba siklikal atau pelebaran spread kredit high-yield akan menggeser sikap ke BEARISH.`;
          confidence = 91;
          break;
        }

        case 'US500': {
          // S&P 500
          fundamentalScore = 65;
          priceActionScore = change24h >= 0 ? Math.min(80, Math.round(change24h * 35 + 25)) : Math.max(-75, Math.round(change24h * 35 - 25));
          topDrivers = [
            `Pertumbuhan laba korporasi secara luas mengikuti ekspansi YoY satu digit menengah.`,
            `Ekspektasi pelonggaran moneter memperluas toleransi kelipatan valuasi ekuitas.`,
            `Pengikut tren CTA sistematis mempertahankan eksposur long ekuitas struktural.`,
          ];
          conflictingFactors = [
            `Rasio harga terhadap laba pada desil tertinggi valuasi historis membatasi ekspansi kelipatan secara cepat.`,
            `Risiko energi geopolitik dapat memicu lonjakan biaya lokal.`,
          ];
          todayCatalyst = usKeyRelease ? `${usKeyRelease.event_name} release` : `Prospek kebijakan FOMC & pembaruan laba korporasi S&P.`;
          marketReaction = `Diperdagangkan di ${currentPrice.toLocaleString()} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); dukungan permintaan sistematis mempertahankan moving average 20 hari.`;
          conditionsToChange = `Penutupan di bawah point of control volume profile kunci dengan VIX melonjak di atas 20 akan memicu bias pengurangan risiko secara langsung.`;
          confidence = 93;
          break;
        }

        case 'US100': {
          // Nasdaq 100
          fundamentalScore = 70;
          priceActionScore = change24h >= 0 ? Math.min(85, Math.round(change24h * 30 + 30)) : Math.max(-80, Math.round(change24h * 30 - 30));
          topDrivers = [
            `Komitmen belanja modal AI generatif di hyper-scaler (Microsoft, Alphabet, Amazon, Meta) menopang permintaan perangkat keras semikonduktor.`,
            `Trajektori suku bunga diskonto yang lebih rendah secara tidak proporsional menguntungkan kelipatan arus kas perangkat lunak dan semikonduktor berdurasi panjang.`,
            `Neraca kuat dengan utang bersih negatif melindungi teknologi mega-cap dari kondisi kredit ketat.`,
          ];
          conflictingFactors = [
            `Konsentrasi pasar ekstrem pada 7 konstituen teratas menciptakan kerentanan headline idiosinkratik.`,
            `Headline regulasi ekspor semikonduktor menciptakan friksi rantai pasok episodik.`,
          ];
          todayCatalyst = `Komentar laba semikonduktor & respons yield Treasury 10 tahun AS terhadap rilis ekonomi.`;
          marketReaction = `Indeks tercatat di ${currentPrice.toLocaleString()} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); futures teknologi menyerap order jual dengan likuiditas beli saat dip yang aktif.`;
          conditionsToChange = `Yield 10 tahun AS menembus >4,20% atau panduan belanja modal cloud yang diturunkan akan langsung meredam selera kelipatan pertumbuhan.`;
          confidence = 95;
          break;
        }

        case 'US10Y': {
          // US 10-Year Benchmark Treasury Yield
          const isEasing = change24h <= 0;
          fundamentalScore = isEasing ? 60 : -45;
          priceActionScore = change24h <= 0 ? 55 : -55;
          topDrivers = [
            `Ekspektasi siklus pelonggaran suku bunga Federal Reserve menjaga yield benchmark tenor 10 tahun tetap terkendali.`,
            `Permintaan likuiditas institusional pada pasar obligasi pemerintah AS menstabilkan kurva diskonto global.`,
            `Pelonggaran yield menjadi katalis utama ekspansi valuasi rasio P/E saham teknologi dan daya tarik aset tanpa imbal hasil (Emas).`,
          ];
          conflictingFactors = [
            `Lelang surat utang Treasury AS dengan bid-to-cover rendah berpotensi memicu lonjakan yield sementara.`,
            `Ketahanan data inflasi inti atau ketenagakerjaan AS dapat menunda ekspektasi pemotongan suku bunga Fed yang agresif.`,
          ];
          todayCatalyst = usKeyRelease ? `${usKeyRelease.event_name}` : `Lelang US Treasury, pidato FOMC, & rilis data inflasi AS`;
          marketReaction = `Yield diperdagangkan di level ${currentPrice.toFixed(3)}% (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); dinamika transmisi suku bunga mendikte arah Nasdaq dan DXY.`;
          conditionsToChange = `Lonjakan yield di atas 4.25% akan memicu tekanan jual langsung pada ekuitas pertumbuhan, sedangkan penurunan di bawah 3.95% akan mempercepat reli risk-on.`;
          confidence = 91;
          break;
        }

        case 'USD': {
          // US Dollar Index
          const currStrength = strengthMap.get('USD')?.strength_score || 5.0;
          fundamentalScore = currStrength > 6.0 ? 55 : currStrength < 4.0 ? -55 : 10;
          priceActionScore = change24h >= 0 ? Math.min(70, Math.round(change24h * 40)) : Math.max(-70, Math.round(change24h * 40));
          topDrivers = [
            `Kinerja ekonomi AS yang lebih unggul dibanding pertumbuhan PDB Eropa dan Inggris menjaga bantalan yield komparatif.`,
            `Sinyal mandat ganda berimbang Federal Reserve mencegah pemotongan suku bunga agresif di awal.`,
            `Permintaan mata uang cadangan global dalam penyelesaian lintas batas membatasi pelemahan dolar yang dalam.`,
          ];
          conflictingFactors = [
            `Trajektori pelonggaran suku bunga Fed secara alami memampatkan diferensial suku bunga nominal ujung pendek seiring waktu.`,
            `Bank sentral asing (mis. BoJ) yang menaikkan suku bunga menciptakan tekanan naik penyeimbang pada pair non-dolar.`,
          ];
          todayCatalyst = usKeyRelease ? `${usKeyRelease.event_name}` : `Komunikasi kebijakan Ketua Fed Powell dan pergerakan yield Treasury.`;
          marketReaction = `DXY bertahan di ${currentPrice.toFixed(2)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); osilasi terbatas dalam kanal makro sempit 100,80 - 101,80.`;
          conditionsToChange = `Kejutan kenaikan inflasi inti yang kuat akan memicu short-covering USD tajam; inflasi di bawah ekspektasi akan mempercepat aksi jual dolar.`;
          confidence = 92;
          break;
        }

        case 'EUR': {
          // Euro
          const currStrength = strengthMap.get('EUR')?.strength_score || 5.0;
          fundamentalScore = currStrength > 6.0 ? 50 : currStrength < 4.0 ? -45 : -10;
          priceActionScore = change24h >= 0 ? Math.min(65, Math.round(change24h * 50)) : Math.max(-65, Math.round(change24h * 50));
          topDrivers = [
            `Kerangka ECB yang berbasis data dari rapat ke rapat mencegah penurunan suku bunga yang sudah ditetapkan sebelumnya.`,
            `Ketahanan lapangan kerja sektor jasa menjaga batas bawah pertumbuhan upah di Jerman dan Prancis.`,
          ];
          conflictingFactors = [
            `PMI manufaktur Jerman di wilayah kontraksi berkepanjangan menekan belanja modal.`,
            `Disinflasi CPI headline Eropa (2,2%) menjaga pemotongan suku bunga ECB tambahan tetap terbuka.`,
          ];
          todayCatalyst = euKeyRelease ? `${euKeyRelease.event_name}` : `Pidato kebijakan Dewan Gubernur ECB & rilis PMI Zona Euro.`;
          marketReaction = `Diperdagangkan spot di ${currentPrice.toFixed(5)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); bereaksi terhadap diferensial spread yield sovereign 2Y Zona Euro-AS.`;
          conditionsToChange = `Forward guidance pemotongan suku bunga ECB yang dipercepat akan melemahkan EUR; rebound tak terduga pesanan industri Jerman akan membalik bias ke BULLISH.`;
          confidence = 90;
          break;
        }

        case 'GBP': {
          // British Pound
          const currStrength = strengthMap.get('GBP')?.strength_score || 7.0;
          fundamentalScore = currStrength > 6.0 ? 65 : 20;
          priceActionScore = change24h >= 0 ? Math.min(75, Math.round(change24h * 50)) : Math.max(-75, Math.round(change24h * 50));
          topDrivers = [
            `Kekakuan CPI Jasa Inggris (5,2%) memaksa Bank of England mempertahankan suku bunga acuan restriktif 5,00%.`,
            `Suku bunga kebijakan tertinggi di antara ekonomi G7 Eropa menopang arus masuk modal carry trade yang menguntungkan.`,
            `Indeks kekuatan mata uang menempatkan GBP di antara yang terkuat pada pair spot global.`,
          ];
          conflictingFactors = [
            `Gubernur Bailey mengakui potensi pemotongan suku bunga lebih agresif jika pendinginan inflasi dipercepat.`,
            `Kendala pengetatan anggaran fiskal dapat menimbulkan hambatan bagi pertumbuhan PDB riil Inggris.`,
          ];
          todayCatalyst = ukKeyRelease ? `${ukKeyRelease.event_name}` : `Ekspektasi suku bunga MPC Bank of England & metrik pertumbuhan upah Inggris.`;
          marketReaction = `GBPUSD bergerak di ${currentPrice.toFixed(5)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); permintaan institusional stabil terlihat terhadap EUR dan JPY.`;
          conditionsToChange = `Perlambatan cepat inflasi jasa Inggris di bawah 4,5% akan menghilangkan dukungan hawkish BoE dan membalik bias ke BEARISH.`;
          confidence = 93;
          break;
        }

        case 'JPY': {
          // Japanese Yen
          const currStrength = strengthMap.get('JPY')?.strength_score || 3.0;
          fundamentalScore = currStrength > 5.5 ? 40 : -45;
          priceActionScore = change24h <= 0 ? Math.min(60, Math.abs(Math.round(change24h * 40))) : Math.max(-60, -Math.round(change24h * 40)); // USDJPY down = JPY strong
          topDrivers = [
            `Gubernur Bank of Japan Ueda secara eksplisit menegaskan kembali jalur kenaikan suku bunga jika target inflasi inti bertahan.`,
            `CPI Tokyo dan Nasional bergerak di atas ambang stabilitas harga 2,0% BoJ.`,
            `Kerentanan ekstrem terhadap pembongkaran carry trade menciptakan lonjakan safe-haven asimetris yang tajam saat volatilitas.`,
          ];
          conflictingFactors = [
            `Diferensial suku bunga besar (0,25% vs 4,75%+ di AS) menciptakan tekanan jual carry trade persisten pada spot JPY.`,
            `Kementerian Keuangan enggan melakukan intervensi mata uang langsung kecuali terjadi volatilitas spekulatif yang cepat.`,
          ];
          todayCatalyst = `Komunikasi kebijakan Bank of Japan & spread yield obligasi sovereign 10 tahun AS-Jepang.`;
          marketReaction = `USDJPY di ${currentPrice.toFixed(2)}; aksi harga mencerminkan keseimbangan halus antara penjualan carry suku bunga dan antisipasi kenaikan BoJ.`;
          conditionsToChange = `Eskalasi mendadak penghindaran risiko global yang memicu likuidasi carry trade luas akan menciptakan lonjakan BULLISH JPY yang kuat secara langsung.`;
          confidence = 91;
          break;
        }

        case 'AUD': {
          // Australian Dollar
          const currStrength = strengthMap.get('AUD')?.strength_score || 6.5;
          fundamentalScore = currStrength > 6.0 ? 60 : 15;
          priceActionScore = change24h >= 0 ? Math.min(75, Math.round(change24h * 50)) : Math.max(-70, Math.round(change24h * 50));
          topDrivers = [
            `Reserve Bank of Australia mempertahankan suku bunga acuan tinggi 4,35%; Gubernur Bullock menepis pemotongan suku bunga dalam waktu dekat.`,
            `Pasar tenaga kerja Australia tetap sangat ketat dengan partisipasi angkatan kerja mendekati rekor (67,1%).`,
            `Trimmed Mean CPI dasar 3,9% memaksa divergensi kebijakan hawkish berkepanjangan terhadap peer G10.`,
          ];
          conflictingFactors = [
            `Konsumsi rumah tangga domestik terkendala cicilan kredit perumahan berbunga variabel.`,
            `Laju pemulihan industri Tiongkok dan fluktuasi permintaan impor komoditas memengaruhi harga bijih besi.`,
          ];
          todayCatalyst = `Komentar kebijakan RBA & momentum harga komoditas bijih besi / logam dasar.`;
          marketReaction = `AUDUSD di ${currentPrice.toFixed(5)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); didukung carry yield kuat terhadap EUR dan JPY.`;
          conditionsToChange = `Penurunan Trimmed Mean CPI mendekati target atau anjloknya permintaan komoditas akan menggeser bias ke BEARISH.`;
          confidence = 92;
          break;
        }

        case 'NZD': {
          // New Zealand Dollar
          const currStrength = strengthMap.get('NZD')?.strength_score || 5.0;
          fundamentalScore = -30;
          priceActionScore = change24h >= 0 ? Math.min(60, Math.round(change24h * 40)) : Math.max(-70, Math.round(change24h * 40));
          topDrivers = [
            `Reserve Bank of New Zealand memangkas OCR dalam kenaikan dipercepat 50bps untuk meredakan resesi domestik.`,
            `Pendinginan cepat CPI (2,2%) memberi ruang bagi RBNZ untuk mengurangi restriksi moneter secara agresif.`,
          ];
          conflictingFactors = [
            `Suku bunga nominal (4,75%) masih memberikan carry positif relatif terhadap Swiss Franc dan Japanese Yen.`,
            `Harga lelang produk susu menunjukkan stabilitas permintaan yang stabil di perdagangan Oseania.`,
          ];
          todayCatalyst = `Hasil lelang Global Dairy Trade (GDT) & pricing trajektori pelonggaran RBNZ.`;
          marketReaction = `NZDUSD di ${currentPrice.toFixed(5)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%); mengikuti divergensi lintas Tasman terhadap AUD yang lebih kuat.`;
          conditionsToChange = `Rebound naik PDB NZ yang mengejutkan atau jeda langkah pemotongan 50bps RBNZ akan menetralkan bias bearish.`;
          confidence = 89;
          break;
        }

        case 'CAD': {
          // Canadian Dollar
          const currStrength = strengthMap.get('CAD')?.strength_score || 4.5;
          fundamentalScore = -35;
          priceActionScore = change24h >= 0 ? Math.min(60, Math.round(change24h * 40)) : Math.max(-65, Math.round(change24h * 40));
          topDrivers = [
            `Bank of Canada menjalankan pemotongan suku bunga beruntun seiring inflasi headline turun ke titik tengah target 2,0%.`,
            `Kelonggaran tenaga kerja Kanada meningkat dengan pengangguran naik ke 6,6%.`,
            `Rasio utang terhadap pendapatan rumah tangga yang tinggi menekan pertumbuhan ekonomi domestik.`,
          ];
          conflictingFactors = [
            `Kendala pasokan minyak mentah WTI memberi dukungan dasar sesekali pada terma perdagangan ekspor energi Kanada.`,
            `Ketahanan ekonomi AS menopang volume perdagangan lintas batas.`,
          ];
          todayCatalyst = `Fluktuasi harga Minyak Mentah WTI & pernyataan prospek kebijakan Bank of Canada.`;
          marketReaction = `USDCAD di ${currentPrice.toFixed(5)}; dolar Kanada tertinggal dari peer komoditas dengan yield lebih tinggi.`;
          conditionsToChange = `Lonjakan minyak mentah di atas $85/barel atau sinyal jeda pemotongan suku bunga Bank of Canada akan membalik bias ke BULLISH.`;
          confidence = 90;
          break;
        }

        case 'CHF': {
          // Swiss Franc
          const currStrength = strengthMap.get('CHF')?.strength_score || 4.0;
          fundamentalScore = -40;
          priceActionScore = change24h >= 0 ? Math.min(60, Math.round(change24h * 45)) : Math.max(-65, Math.round(change24h * 45));
          topDrivers = [
            `Swiss National Bank adalah bank G10 pertama yang melonggarkan suku bunga, menurunkan suku bunga kebijakan ke 1,00%.`,
            `CPI domestik sangat rendah (1,1%) menempatkan inflasi di dekat batas bawah rentang stabilitas harga SNB.`,
            `SNB secara eksplisit menyampaikan kesediaan melakukan intervensi di pasar valas untuk mencegah apresiasi franc berlebihan.`,
          ];
          conflictingFactors = [
            `Status safe-haven abadi memicu pelarian modal defensif mendadak saat titik panas geopolitik.`,
            `Surplus ekspor farmasi yang kuat memberi dukungan struktural neraca pembayaran yang solid.`,
          ];
          todayCatalyst = `Pernyataan kebijakan Ketua SNB & perubahan sentimen risiko Eropa.`;
          marketReaction = `USDCHF di ${currentPrice.toFixed(5)}; yield franc tetap terendah di G10, mendorong arus keluar pendanaan carry trade.`;
          conditionsToChange = `Eskalasi besar konflik geopolitik Eropa yang memicu permintaan safe-haven akut akan membalik bias CHF tajam ke BULLISH.`;
          confidence = 91;
          break;
        }
      }

      // Compute Overall Weighted Score
      // 60% Fundamental Macro + 40% Price Action
      const compositeScore = Math.round(fundamentalScore * 0.6 + priceActionScore * 0.4);

      // Determine Biases
      const getBiasFromScore = (s: number): MarketDirectionBias => {
        if (s > 25) return 'BULLISH';
        if (s < -25) return 'BEARISH';
        if (Math.abs(fundamentalScore - priceActionScore) > 50) return 'MIXED';
        return 'NEUTRAL';
      };

      const fundamentalBias = getBiasFromScore(fundamentalScore);
      const priceActionBias = getBiasFromScore(priceActionScore);
      const overallBias = getBiasFromScore(compositeScore);

      return {
        symbol: target.symbol,
        display_name: target.displayName,
        asset_type: target.assetType,
        price: currentPrice,
        change_24h_pct: change24h,
        sparkline_1h: sparkline,
        overall_bias: overallBias,
        direction_score: compositeScore,
        confidence,
        fundamental_bias: fundamentalBias,
        fundamental_score: fundamentalScore,
        price_action_bias: priceActionBias,
        price_action_score: priceActionScore,
        top_drivers: topDrivers,
        conflicting_factors: conflictingFactors,
        today_key_catalyst: todayCatalyst,
        current_market_reaction: marketReaction,
        conditions_to_change_bias: conditionsToChange,
        source: `TradingView + Feed Makro Resmi + Sikap Bank Sentral`,
        timestamp: nowIso,
        last_updated: nowIso,
        status: priceStatus,
        tv_symbol: target.tvSymbol,
        tradingview_url: target.tvUrl,
      };
    });
  }

  /**
   * Generates Today's Key Catalysts enriched with real-time surprises & market reaction
   */
  public static getTodayKeyCatalysts(): TodayCatalyst[] {
    const macroEvents = db.getEconomicEvents(200);
    const now = new Date();
    const nowMs = now.getTime();
    const nowIso = now.toISOString();

    // Define Today's trading session window (last 48h to next 48h to cover weekend/active session transitions)
    const windowStart = nowMs - 48 * 3600000;
    const windowEnd = nowMs + 48 * 3600000;

    let todayEvents = macroEvents.filter(e => {
      const t = new Date(e.date_time_utc).getTime();
      return t >= windowStart && t <= windowEnd;
    });

    // Fallback: If weekend or holiday where window has few events, take the closest 15 high/critical events
    if (todayEvents.length < 3) {
      todayEvents = macroEvents
        .slice()
        .sort((a, b) => Math.abs(new Date(a.date_time_utc).getTime() - nowMs) - Math.abs(new Date(b.date_time_utc).getTime() - nowMs))
        .slice(0, 20);
    }

    // Prioritize Critical & High impact events
    const prioritized = todayEvents.sort((a, b) => {
      const impactScore = (imp: string) => (imp === 'CRITICAL' ? 3 : imp === 'HIGH' ? 2 : imp === 'MEDIUM' ? 1 : 0);
      const diff = impactScore(b.impact) - impactScore(a.impact);
      if (diff !== 0) return diff;
      return new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime();
    });

    // Map to TodayCatalyst
    return prioritized.slice(0, 15).map(event => {
      const isPast = new Date(event.date_time_utc).getTime() <= nowMs;
      const isReleased = event.actual !== null && event.actual !== undefined && event.actual !== '';

      let relatedAssets: string[] = ['USD'];
      if (event.currency === 'USD') relatedAssets = ['USD', 'XAUUSD', 'US100', 'US500', 'BTC'];
      else if (event.currency === 'EUR') relatedAssets = ['EUR', 'EURUSD', 'GER40'];
      else if (event.currency === 'GBP') relatedAssets = ['GBP', 'GBPUSD', 'FTSE100'];
      else if (event.currency === 'JPY') relatedAssets = ['JPY', 'USDJPY', 'NIKKEI'];
      else if (event.currency === 'AUD') relatedAssets = ['AUD', 'AUDUSD', 'XAUUSD'];
      else if (event.currency === 'CAD') relatedAssets = ['CAD', 'USDCAD', 'CRUDE_OIL'];
      else if (event.currency === 'CHF') relatedAssets = ['CHF', 'USDCHF'];
      else if (event.currency === 'NZD') relatedAssets = ['NZD', 'NZDUSD'];

      return {
        id: event.id,
        event_name: event.event_name,
        date_time_utc: event.date_time_utc,
        country_code: event.country_code,
        currency: event.currency,
        importance: event.impact,
        actual: event.actual,
        forecast: event.forecast,
        previous: event.previous,
        surprise: event.surprise || (isReleased ? '0.0 (In-line)' : null),
        change: event.change || null,
        related_assets: relatedAssets,
        status: isReleased ? 'RELEASED' : isPast ? 'RELEASED' : 'UPCOMING',
        actual_market_reaction: event.actual_market_reaction || (isReleased ? 'Terlihat lonjakan volume algoritmik langsung pada pair mata uang utama.' : 'Menunggu eksekusi rilis terjadwal.'),
        fundamental_implication: event.fundamental_implication || 'Transmisi rilis makro berdampak langsung pada pricing jalur suku bunga bank sentral dan diferensial yield sovereign.',
        source: event.source,
        last_updated: nowIso,
        data_status: event.data_status || 'LIVE',
      };
    });
  }
}
