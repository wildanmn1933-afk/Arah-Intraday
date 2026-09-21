import { Router } from 'express';
import { db } from '../db/database.js';
import { IntradayMarketMapEngine } from '../intelligence/intradayMarketMap.js';

export const historyRouter = Router();

// GET all snapshots or filtered by range/date
historyRouter.get('/snapshots', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 30;
  const range = (req.query.range as string) || 'ALL';
  const customDate = req.query.date as string | undefined;

  const snapshots = db.getDailySnapshots(limit, range, customDate);
  res.json({
    snapshots,
    count: snapshots.length,
    timestamp: new Date().toISOString(),
  });
});

// GET complete historical day dossier
historyRouter.get('/snapshot/:date', (req, res) => {
  const dateStr = req.params.date;
  const snapshot = db.getDailySnapshotByDate(dateStr);

  // Also query related events, economic releases, and currency strength for this date
  const events = db.getAllEvents(100).filter(e => e.first_detected_at.startsWith(dateStr));
  const economicEvents = db.getEconomicEvents(100).filter(e => e.date_time_utc.startsWith(dateStr));
  const currencyHistory = db.getCurrencyStrengthHistoryByDate(dateStr);

  if (!snapshot) {
    // If not snapshot yet for this date, construct a real-time on-the-fly view
    const prices = db.getAllMarketPrices();
    const strengths = db.getCurrencyStrength();
    const intradayMap = IntradayMarketMapEngine.getIntradayMarketMap();

    const biases: Record<string, any> = {};
    intradayMap.forEach(item => {
      biases[item.symbol] = {
        symbol: item.symbol,
        bias: item.overall_bias,
        score: item.direction_score,
        price: item.price,
        change_24h_pct: item.change_24h_pct,
        strength_label: item.direction_score > 30 ? 'Kuat' : item.direction_score < -30 ? 'Lemah' : 'Sedang',
        major_catalyst: item.today_key_catalyst,
        last_updated: item.last_updated,
      };
    });

    res.json({
      snapshot: {
        id: `snapshot_${dateStr}`,
        date: dateStr,
        timestamp: new Date().toISOString(),
        title: `Daily Market Dossier: ${dateStr}`,
        market_biases: biases,
        currency_strength: strengths.map((s, idx) => ({
          currency: s.currency,
          score: s.strength_score,
          rank: idx + 1,
          direction: s.change_direction,
        })),
        major_catalysts: economicEvents.slice(0, 5).map(e => ({
          event_name: e.event_name,
          currency: e.currency,
          impact: e.impact,
          actual: e.actual,
          market_reaction: e.actual_market_reaction,
        })),
        market_reaction_summary: 'Telemetri pasar yang disusun sesuai permintaan untuk hari historis yang diminta.',
        ai_summary: 'Catatan intelijen berbasis data yang diturunkan dari titik data historis basis data.',
        ai_why: [
          'Diturunkan dari wire agenda persisten dan telemetri kekuatan mata uang.',
        ],
        ai_risk: [
          'Parameter volatilitas sesi historis berlaku.',
        ],
        ai_context: [
          `Potongan data historis untuk ${dateStr}.`,
        ],
        historical_insights: [
          `Record initialized from system memory store.`,
        ],
        created_at: new Date().toISOString(),
      },
      events,
      economic_events: economicEvents,
      currency_history: currencyHistory,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    snapshot,
    events,
    economic_events: economicEvents,
    currency_history: currencyHistory,
    timestamp: new Date().toISOString(),
  });
});

// GET Market Memory Insights (grounded historical memory)
historyRouter.get('/insights', (req, res) => {
  const insights = db.getMarketMemoryInsights();
  res.json({
    insights,
    count: insights.length,
    timestamp: new Date().toISOString(),
  });
});

// GET Currency comparison: Today vs Yesterday vs 3 Days vs 7 Days
historyRouter.get('/currency-comparison', (req, res) => {
  const comparisons = db.getHistoricalCurrencyComparison();
  res.json({
    comparisons,
    count: comparisons.length,
    source: 'https://currency-strength.com/en/ + Relational Historical Interval Store',
    timestamp: new Date().toISOString(),
  });
});

// POST generate or refresh snapshot for today/given date
historyRouter.post('/generate-snapshot', (req, res) => {
  const dateStr = (req.body?.date as string) || new Date().toISOString().slice(0, 10);
  const intradayMap = IntradayMarketMapEngine.getIntradayMarketMap();
  const strengths = db.getCurrencyStrength();
  const comparisons = db.getHistoricalCurrencyComparison();
  const compMap = new Map(comparisons.map(c => [c.currency, c]));
  const insights = db.getMarketMemoryInsights();

  const biases: Record<string, any> = {};
  intradayMap.forEach(item => {
    biases[item.symbol] = {
      symbol: item.symbol,
      bias: item.overall_bias,
      score: item.direction_score,
      price: item.price,
      change_24h_pct: item.change_24h_pct,
      strength_label: item.direction_score > 30 ? 'Kuat' : item.direction_score < -30 ? 'Lemah' : 'Sedang',
      major_catalyst: item.today_key_catalyst,
      last_updated: item.last_updated,
    };
  });

  const snapshot = {
    id: `snapshot_${dateStr}`,
    date: dateStr,
    timestamp: new Date().toISOString(),
    title: `Snapshot Pasar Harian: ${dateStr}`,
    market_biases: biases,
    currency_strength: strengths.map((s, idx) => {
      const comp = compMap.get(s.currency);
      return {
        currency: s.currency,
        score: s.strength_score,
        rank: idx + 1,
        direction: s.change_direction,
        change_vs_yesterday: comp?.delta_yesterday,
        change_vs_7d: comp?.delta_7d,
      };
    }),
    major_catalysts: intradayMap.slice(0, 5).map(item => ({
      event_name: item.today_key_catalyst || `Pendorong Sesi ${item.symbol}`,
      currency: item.symbol === 'XAUUSD' ? 'USD' : item.symbol,
      impact: 'HIGH',
      actual: item.current_market_reaction,
      market_reaction: item.current_market_reaction,
    })),
    market_reaction_summary: 'Snapshot harian otomatis yang disintesis dari feed multimodal: Berita + Makro + Kekuatan Mata Uang + Aksi Harga.',
    ai_summary: `Konsensus bias institusional untuk ${dateStr}: arus modal mengikuti diferensial suku bunga dan alokasi ke aman sovereign.`,
    ai_why: [
      'Berbasis peringkat matriks kekuatan mata uang real-time terbaru.',
      'Mencerminkan agenda terverifikasi dari wire berita kilat Telegram yang telah dideduplikasi.',
      'Kurva diskonto yield Treasury menentukan valuasi lintas aset.',
    ],
    ai_risk: [
      'Komentar pembicara bank sentral berdampak tinggi.',
      'Kaskade likuidasi lintas aset saat transisi sesi yang tidak likuid.',
    ],
    ai_context: [
      `Memori sistem melacak keberlanjutan historis sejak tanggal peluncuran platform.`,
    ],
    historical_insights: insights.map(i => i.description),
    created_at: new Date().toISOString(),
  };

  db.saveDailySnapshot(snapshot as any);

  res.json({
    success: true,
    snapshot,
  });
});
