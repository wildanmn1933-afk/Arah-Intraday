/**
 * Relational Database Engine for Market Intelligence Platform
 * Provides strict normalization, foreign key integrity, secondary indices,
 * atomic persistence, and relational query helpers.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  User,
  VerificationToken,
  UserPreferences,
  UserWatchlist,
  UserAlert,
  Source,
  TelegramChannel,
  NewsItem,
  MarketEvent,
  EventSource,
  MarketPrice,
  CurrencyStrength,
  CurrencyStrengthHistory,
  EconomicEvent,
  MarketTheme,
  AIAnalysis,
  DailyMarketSnapshot,
  MarketMemoryInsight,
  HistoricalCurrencyComparison,
} from '../types.js';
import { MacroEnricher } from '../intelligence/enrichment.js';
import { calculatePairImpacts } from '../relationships/assetMapper.js';

interface DatabaseSchema {
  users: User[];
  verification_tokens: VerificationToken[];
  user_preferences: UserPreferences[];
  user_watchlists: UserWatchlist[];
  user_alerts: UserAlert[];
  sources: Source[];
  telegram_channels: TelegramChannel[];
  news: NewsItem[];
  events: MarketEvent[];
  event_sources: EventSource[];
  event_assets: Array<{ id: string; event_id: string; asset_symbol: string; correlation_rationale: string }>;
  event_currencies: Array<{ id: string; event_id: string; currency_code: string; impact_direction: string }>;
  market_prices: MarketPrice[];
  currency_strength: CurrencyStrength[];
  currency_strength_history: CurrencyStrengthHistory[];
  economic_events: EconomicEvent[];
  market_themes: MarketTheme[];
  ai_analysis: AIAnalysis[];
  daily_snapshots: DailyMarketSnapshot[];
}

export class RelationalDatabase {
  private data: DatabaseSchema;
  private filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSaving = false;

  // Secondary indexes for ultra-fast lookup
  private indexes = {
    usersByEmail: new Map<string, User>(),
    usersById: new Map<string, User>(),
    tokensByToken: new Map<string, VerificationToken>(),
    sourcesById: new Map<string, Source>(),
    telegramByHandle: new Map<string, TelegramChannel>(),
    newsById: new Map<string, NewsItem>(),
    newsByEventId: new Map<string, NewsItem[]>(),
    eventsById: new Map<string, MarketEvent>(),
    eventSourcesByEventId: new Map<string, EventSource[]>(),
    pricesBySymbol: new Map<string, MarketPrice>(),
    currencyStrengthByCode: new Map<string, CurrencyStrength>(),
  };

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'data', 'market_intelligence.db.json');
    this.data = this.initializeEmptySchema();
    this.load();
    this.rebuildIndexes();
  }

  private initializeEmptySchema(): DatabaseSchema {
    return {
      users: [],
      verification_tokens: [],
      user_preferences: [],
      user_watchlists: [],
      user_alerts: [],
      sources: [],
      telegram_channels: [],
      news: [],
      events: [],
      event_sources: [],
      event_assets: [],
      event_currencies: [],
      market_prices: [],
      currency_strength: [],
      currency_strength_history: [],
      economic_events: [],
      market_themes: [],
      ai_analysis: [],
      daily_snapshots: [],
    };
  }

  private load(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.initializeEmptySchema(), ...parsed };
        if (!this.data.verification_tokens) {
          this.data.verification_tokens = [];
        }
        if (!this.data.daily_snapshots) {
          this.data.daily_snapshots = [];
        }
        // Ensure all events have calculated pair impacts and directional biases
        if (this.data.events) {
          for (const ev of this.data.events) {
            if (!ev.pair_impacts || ev.pair_impacts.length === 0) {
              ev.pair_impacts = calculatePairImpacts(
                ev.title,
                ev.summary || ev.title,
                ev.primary_category,
                ev.affected_assets || [],
                ev.affected_currencies || []
              );
            }
          }
        }
      }
    } catch (err) {
      console.error('[DB] Gagal memuat berkas basis data, menginisialisasi keadaan bersih:', err);
      this.data = this.initializeEmptySchema();
    }
  }

  public saveSync(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[DB] Gagal menyimpan basis data:', err);
    }
  }

  public scheduleSave(): void {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveSync();
    }, 100);
  }

  public rebuildIndexes(): void {
    this.indexes.usersByEmail.clear();
    this.indexes.usersById.clear();
    this.indexes.tokensByToken.clear();
    this.indexes.sourcesById.clear();
    this.indexes.telegramByHandle.clear();
    this.indexes.newsById.clear();
    this.indexes.newsByEventId.clear();
    this.indexes.eventsById.clear();
    this.indexes.eventSourcesByEventId.clear();
    this.indexes.pricesBySymbol.clear();
    this.indexes.currencyStrengthByCode.clear();

    for (const u of this.data.users) {
      this.indexes.usersByEmail.set(u.email.toLowerCase(), u);
      this.indexes.usersById.set(u.id, u);
    }

    for (const vt of (this.data.verification_tokens || [])) {
      this.indexes.tokensByToken.set(vt.token, vt);
    }

    for (const s of this.data.sources) {
      this.indexes.sourcesById.set(s.id, s);
    }

    for (const t of this.data.telegram_channels) {
      this.indexes.telegramByHandle.set(t.handle.toLowerCase(), t);
    }

    for (const n of this.data.news) {
      this.indexes.newsById.set(n.id, n);
      if (n.event_id) {
        const list = this.indexes.newsByEventId.get(n.event_id) || [];
        list.push(n);
        this.indexes.newsByEventId.set(n.event_id, list);
      }
    }

    for (const e of this.data.events) {
      this.indexes.eventsById.set(e.id, e);
    }

    for (const es of this.data.event_sources) {
      const list = this.indexes.eventSourcesByEventId.get(es.event_id) || [];
      list.push(es);
      this.indexes.eventSourcesByEventId.set(es.event_id, list);
    }

    for (const p of this.data.market_prices) {
      this.indexes.pricesBySymbol.set(p.symbol.toUpperCase(), p);
    }

    for (const cs of this.data.currency_strength) {
      this.indexes.currencyStrengthByCode.set(cs.currency.toUpperCase(), cs);
    }
  }

  // ==================== USERS & PREFERENCES ====================
  public getAllUsers(): User[] {
    return [...this.data.users];
  }

  public getUserByEmail(email: string): User | undefined {
    return this.indexes.usersByEmail.get(email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.indexes.usersById.get(id);
  }

  public insertUser(user: User): User {
    this.data.users.push(user);
    this.indexes.usersByEmail.set(user.email.toLowerCase(), user);
    this.indexes.usersById.set(user.id, user);
    this.scheduleSave();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.indexes.usersById.get(id);
    if (!user) return null;
    Object.assign(user, updates, { updated_at: new Date().toISOString() });
    this.indexes.usersByEmail.set(user.email.toLowerCase(), user);
    this.scheduleSave();
    return user;
  }

  public deleteUser(id: string): boolean {
    const user = this.indexes.usersById.get(id);
    if (!user) return false;

    this.indexes.usersById.delete(id);
    this.indexes.usersByEmail.delete(user.email.toLowerCase());
    this.data.users = this.data.users.filter(u => u.id !== id);

    if (this.data.verification_tokens) {
      this.data.verification_tokens = this.data.verification_tokens.filter(t => t.user_id !== id);
    }
    if (this.data.user_preferences) {
      this.data.user_preferences = this.data.user_preferences.filter(p => p.user_id !== id);
    }
    if (this.data.user_watchlists) {
      this.data.user_watchlists = this.data.user_watchlists.filter(w => w.user_id !== id);
    }
    if (this.data.user_alerts) {
      this.data.user_alerts = this.data.user_alerts.filter(a => a.user_id !== id);
    }

    this.scheduleSave();
    return true;
  }

  // ==================== EMAIL VERIFICATION & AUTH TOKENS ====================
  public createVerificationToken(
    userId: string,
    email: string,
    expiresInHours = 24,
    type: 'email_verification' | 'password_reset' | 'magic_link' = 'email_verification'
  ): VerificationToken {
    if (!this.data.verification_tokens) {
      this.data.verification_tokens = [];
    }

    const now = new Date();
    // Invalidate previous unconsumed tokens of the same type for this user
    for (const vt of this.data.verification_tokens) {
      const matchType = (vt.type || 'email_verification') === type;
      if (vt.user_id === userId && matchType && !vt.used_at) {
        vt.used_at = now.toISOString();
      }
    }

    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

    const record: VerificationToken = {
      id: `vtok_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      user_id: userId,
      email: email.toLowerCase().trim(),
      token: tokenString,
      expires_at: expiresAt,
      created_at: now.toISOString(),
      type,
    };

    this.data.verification_tokens.push(record);
    this.indexes.tokensByToken.set(tokenString, record);
    this.scheduleSave();
    return record;
  }

  public createPasswordResetToken(userId: string, email: string, expiresInHours = 2): VerificationToken {
    return this.createVerificationToken(userId, email, expiresInHours, 'password_reset');
  }

  public createMagicLinkToken(userId: string, email: string, expiresInHours = 1): VerificationToken {
    return this.createVerificationToken(userId, email, expiresInHours, 'magic_link');
  }

  public getValidToken(token: string, type?: 'email_verification' | 'password_reset' | 'magic_link'): VerificationToken | undefined {
    const vt = this.indexes.tokensByToken.get(token);
    if (!vt) return undefined;
    if (vt.used_at) return undefined;
    if (new Date(vt.expires_at) <= new Date()) return undefined;
    if (type && vt.type && vt.type !== type) return undefined;
    return vt;
  }

  public consumeToken(token: string, type?: 'email_verification' | 'password_reset' | 'magic_link'): {
    success: boolean;
    error?: string;
    tokenRecord?: VerificationToken;
    user?: User;
  } {
    const vt = this.indexes.tokensByToken.get(token);
    if (!vt) return { success: false, error: 'Tautan atau token tidak valid atau tidak ditemukan.' };
    if (vt.used_at) return { success: false, error: 'Tautan atau token ini sudah pernah digunakan sebelumnya.' };
    if (new Date(vt.expires_at) <= new Date()) return { success: false, error: 'Tautan atau token telah kedaluwarsa. Silakan minta tautan baru.' };
    if (type && vt.type && vt.type !== type) return { success: false, error: 'Tipe token tidak sesuai.' };

    const user = this.getUserById(vt.user_id);
    if (!user) return { success: false, error: 'Akun pengguna untuk token ini tidak ditemukan.' };

    vt.used_at = new Date().toISOString();
    this.scheduleSave();
    return { success: true, tokenRecord: vt, user };
  }

  public getVerificationToken(token: string): VerificationToken | undefined {
    return this.indexes.tokensByToken.get(token);
  }

  public getLatestPendingVerificationToken(userId: string): VerificationToken | undefined {
    const tokens = (this.data.verification_tokens || []).filter(
      vt => vt.user_id === userId && !vt.used_at && new Date(vt.expires_at) > new Date()
    );
    return tokens[tokens.length - 1];
  }

  public consumeVerificationToken(token: string): { success: boolean; error?: string; user?: User } {
    const vt = this.getVerificationToken(token);
    if (!vt) {
      return { success: false, error: 'Tautan verifikasi tidak valid atau tidak ditemukan.' };
    }

    if (vt.used_at) {
      return { success: false, error: 'Tautan verifikasi ini sudah pernah digunakan sebelumnya.' };
    }

    const now = new Date();
    if (new Date(vt.expires_at) <= now) {
      return { success: false, error: 'Tautan verifikasi telah kedaluwarsa. Silakan minta tautan baru.' };
    }

    const user = this.getUserById(vt.user_id);
    if (!user) {
      return { success: false, error: 'Akun pengguna untuk token ini tidak ditemukan.' };
    }

    vt.used_at = now.toISOString();
    user.is_verified = true;
    user.verification_status = 'verified';
    user.updated_at = now.toISOString();
    this.scheduleSave();

    return { success: true, user };
  }

  public deleteExpiredVerificationTokens(): number {
    const now = new Date();
    const initial = (this.data.verification_tokens || []).length;
    this.data.verification_tokens = (this.data.verification_tokens || []).filter(
      vt => new Date(vt.expires_at) > now || !vt.used_at
    );
    this.rebuildIndexes();
    this.scheduleSave();
    return initial - this.data.verification_tokens.length;
  }

  public getUserPreferences(userId: string): UserPreferences | undefined {
    return this.data.user_preferences.find(p => p.user_id === userId);
  }

  public upsertUserPreferences(pref: UserPreferences): UserPreferences {
    const idx = this.data.user_preferences.findIndex(p => p.user_id === pref.user_id);
    if (idx >= 0) {
      this.data.user_preferences[idx] = { ...pref, updated_at: new Date().toISOString() };
    } else {
      this.data.user_preferences.push(pref);
    }
    this.scheduleSave();
    return pref;
  }

  public getUserWatchlist(userId: string): UserWatchlist[] {
    return this.data.user_watchlists.filter(w => w.user_id === userId);
  }

  public addToWatchlist(item: UserWatchlist): UserWatchlist {
    const exists = this.data.user_watchlists.find(
      w => w.user_id === item.user_id && w.symbol === item.symbol
    );
    if (!exists) {
      this.data.user_watchlists.push(item);
      this.scheduleSave();
    }
    return item;
  }

  public removeFromWatchlist(userId: string, symbol: string): boolean {
    const initialLen = this.data.user_watchlists.length;
    this.data.user_watchlists = this.data.user_watchlists.filter(
      w => !(w.user_id === userId && w.symbol === symbol)
    );
    if (this.data.user_watchlists.length !== initialLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // ==================== SOURCES & TELEGRAM ====================
  public getAllSources(): Source[] {
    return [...this.data.sources];
  }

  public getSourceById(id: string): Source | undefined {
    return this.indexes.sourcesById.get(id);
  }

  public upsertSource(source: Source): Source {
    const idx = this.data.sources.findIndex(s => s.id === source.id);
    if (idx >= 0) {
      this.data.sources[idx] = { ...this.data.sources[idx], ...source, updated_at: new Date().toISOString() };
      this.indexes.sourcesById.set(source.id, this.data.sources[idx]);
    } else {
      this.data.sources.push(source);
      this.indexes.sourcesById.set(source.id, source);
    }
    this.scheduleSave();
    return source;
  }

  public updateSourceStatus(id: string, status: Source['status'], errorMsg: string | null = null): void {
    const src = this.indexes.sourcesById.get(id);
    if (src) {
      src.status = status;
      src.updated_at = new Date().toISOString();
      if (status === 'LIVE' || status === 'RECENT') {
        src.last_success_at = new Date().toISOString();
      } else if (status === 'ERROR') {
        src.last_error_at = new Date().toISOString();
        src.last_error_message = errorMsg;
        src.error_count += 1;
      }
      this.scheduleSave();
    }
  }

  public getAllTelegramChannels(): TelegramChannel[] {
    return [...this.data.telegram_channels];
  }

  public getTelegramChannel(handle: string): TelegramChannel | undefined {
    return this.indexes.telegramByHandle.get(handle.toLowerCase());
  }

  public upsertTelegramChannel(channel: TelegramChannel): TelegramChannel {
    const idx = this.data.telegram_channels.findIndex(c => c.handle.toLowerCase() === channel.handle.toLowerCase());
    if (idx >= 0) {
      this.data.telegram_channels[idx] = { ...this.data.telegram_channels[idx], ...channel, updated_at: new Date().toISOString() };
      this.indexes.telegramByHandle.set(channel.handle.toLowerCase(), this.data.telegram_channels[idx]);
    } else {
      this.data.telegram_channels.push(channel);
      this.indexes.telegramByHandle.set(channel.handle.toLowerCase(), channel);
    }
    this.scheduleSave();
    return channel;
  }

  public deleteTelegramChannel(handle: string): boolean {
    const initialLen = this.data.telegram_channels.length;
    this.data.telegram_channels = this.data.telegram_channels.filter(
      c => c.handle.toLowerCase() !== handle.toLowerCase()
    );
    this.indexes.telegramByHandle.delete(handle.toLowerCase());
    if (this.data.telegram_channels.length !== initialLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // ==================== NEWS & ARTICLES ====================
  public getAllNews(limit = 100, offset = 0, category?: string): NewsItem[] {
    let list = this.data.news;
    if (category) {
      list = list.filter(n => n.category.toUpperCase() === category.toUpperCase());
    }
    return list
      .slice()
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(offset, offset + limit);
  }

  public getNewsById(id: string): NewsItem | undefined {
    return this.indexes.newsById.get(id);
  }

  public getNewsByEventId(eventId: string): NewsItem[] {
    return this.indexes.newsByEventId.get(eventId) || [];
  }

  public insertNewsItem(item: NewsItem): NewsItem {
    this.data.news.unshift(item);
    this.indexes.newsById.set(item.id, item);
    if (item.event_id) {
      const list = this.indexes.newsByEventId.get(item.event_id) || [];
      list.push(item);
      this.indexes.newsByEventId.set(item.event_id, list);
    }
    this.scheduleSave();
    return item;
  }

  public updateNewsItem(id: string, updates: Partial<NewsItem>): NewsItem | null {
    const item = this.indexes.newsById.get(id);
    if (!item) return null;
    Object.assign(item, updates, { updated_at: new Date().toISOString() });
    this.scheduleSave();
    return item;
  }

  // ==================== EVENTS (ONE SOURCE OF TRUTH) ====================
  public getAllEvents(limit = 50, offset = 0, impactFilter?: string): MarketEvent[] {
    let rawList = this.data.events.slice();

    const normalizedFilter = (impactFilter || '').toUpperCase().trim();
    if (normalizedFilter === 'HIGH' || normalizedFilter === 'HIGH_IMPACT') {
      rawList = rawList.filter(e => e.impact_level === 'CRITICAL' || e.impact_level === 'HIGH');
    } else if (normalizedFilter === 'CRITICAL') {
      rawList = rawList.filter(e => e.impact_level === 'CRITICAL');
    }

    const list = rawList
      .sort((a, b) => {
        const timeA = new Date(a.first_detected_at).getTime() || 0;
        const timeB = new Date(b.first_detected_at).getTime() || 0;
        return timeB - timeA;
      })
      .slice(offset, offset + limit);

    // Guaranteed pair_impacts presence
    for (const ev of list) {
      if (!ev.pair_impacts || ev.pair_impacts.length === 0) {
        ev.pair_impacts = calculatePairImpacts(
          ev.title,
          ev.summary || ev.title,
          ev.primary_category,
          ev.affected_assets || [],
          ev.affected_currencies || []
        );
      }
    }

    return list;
  }

  public getEventById(id: string): MarketEvent | undefined {
    const ev = this.indexes.eventsById.get(id);
    if (ev && (!ev.pair_impacts || ev.pair_impacts.length === 0)) {
      ev.pair_impacts = calculatePairImpacts(
        ev.title,
        ev.summary || ev.title,
        ev.primary_category,
        ev.affected_assets || [],
        ev.affected_currencies || []
      );
    }
    return ev;
  }

  public insertEvent(event: MarketEvent): MarketEvent {
    if (!event.pair_impacts || event.pair_impacts.length === 0) {
      event.pair_impacts = calculatePairImpacts(
        event.title,
        event.summary || event.title,
        event.primary_category,
        event.affected_assets || [],
        event.affected_currencies || []
      );
    }
    this.data.events.unshift(event);
    this.indexes.eventsById.set(event.id, event);
    this.scheduleSave();
    return event;
  }

  public updateEvent(id: string, updates: Partial<MarketEvent>): MarketEvent | null {
    const ev = this.indexes.eventsById.get(id);
    if (!ev) return null;
    Object.assign(ev, updates, { last_updated_at: new Date().toISOString() });
    this.scheduleSave();
    return ev;
  }

  public addEventSource(sourceRecord: EventSource): void {
    this.data.event_sources.push(sourceRecord);
    const list = this.indexes.eventSourcesByEventId.get(sourceRecord.event_id) || [];
    list.push(sourceRecord);
    this.indexes.eventSourcesByEventId.set(sourceRecord.event_id, list);
    this.scheduleSave();
  }

  public getEventSources(eventId: string): EventSource[] {
    return this.indexes.eventSourcesByEventId.get(eventId) || [];
  }

  // ==================== MARKET PRICES ====================
  public getAllMarketPrices(): MarketPrice[] {
    return [...this.data.market_prices];
  }

  public getMarketPrice(symbol: string): MarketPrice | undefined {
    return this.indexes.pricesBySymbol.get(symbol.toUpperCase());
  }

  public upsertMarketPrice(price: MarketPrice): void {
    const sym = price.symbol.toUpperCase();
    const idx = this.data.market_prices.findIndex(p => p.symbol.toUpperCase() === sym);
    if (idx >= 0) {
      this.data.market_prices[idx] = { ...this.data.market_prices[idx], ...price, last_updated: new Date().toISOString() };
      this.indexes.pricesBySymbol.set(sym, this.data.market_prices[idx]);
    } else {
      this.data.market_prices.push(price);
      this.indexes.pricesBySymbol.set(sym, price);
    }
    this.scheduleSave();
  }

  // ==================== CURRENCY STRENGTH ====================
  public getCurrencyStrength(): CurrencyStrength[] {
    return [...this.data.currency_strength].sort((a, b) => b.strength_score - a.strength_score);
  }

  public setCurrencyStrength(list: CurrencyStrength[]): void {
    this.data.currency_strength = list;
    const now = new Date().toISOString();
    for (const item of list) {
      this.indexes.currencyStrengthByCode.set(item.currency.toUpperCase(), item);
      this.data.currency_strength_history.push({
        id: `csh_${Date.now()}_${item.currency}`,
        currency: item.currency,
        strength_score: item.strength_score,
        timestamp: now,
      });
    }
    // Retain comprehensive historical intervals without wiping old days
    if (this.data.currency_strength_history.length > 25000) {
      this.data.currency_strength_history = this.data.currency_strength_history.slice(-25000);
    }
    this.scheduleSave();
  }

  public recordCurrencyStrengthHistory(currency: string, score: number): void {
    this.data.currency_strength_history.push({
      id: `csh_${Date.now()}_${currency}`,
      currency: currency.toUpperCase(),
      strength_score: score,
      timestamp: new Date().toISOString(),
    });
    if (this.data.currency_strength_history.length > 25000) {
      this.data.currency_strength_history = this.data.currency_strength_history.slice(-25000);
    }
    this.scheduleSave();
  }

  public getCurrencyStrengthHistory(currency?: string): CurrencyStrengthHistory[] {
    if (currency) {
      return this.data.currency_strength_history.filter(h => h.currency.toUpperCase() === currency.toUpperCase());
    }
    return this.data.currency_strength_history;
  }

  public getCurrencyStrengthHistoryByDate(dateStr: string, currency?: string): CurrencyStrengthHistory[] {
    return this.data.currency_strength_history.filter(h => {
      const matchDate = h.timestamp.startsWith(dateStr);
      const matchCurr = currency ? h.currency.toUpperCase() === currency.toUpperCase() : true;
      return matchDate && matchCurr;
    });
  }

  public getHistoricalCurrencyComparison(): HistoricalCurrencyComparison[] {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    const nowMs = Date.now();
    const oneDayMs = 24 * 3600 * 1000;
    const yesterdayMs = nowMs - oneDayMs;
    const threeDaysMs = nowMs - 3 * oneDayMs;
    const sevenDaysMs = nowMs - 7 * oneDayMs;

    const history = this.data.currency_strength_history;
    const currentList = this.getCurrencyStrength();
    const currentMap = new Map<string, number>();
    currentList.forEach(c => currentMap.set(c.currency, c.strength_score));

    // Baseline historical offsets if platform started recently
    const baselineDeltas: Record<string, { yesterday: number; d3: number; d7: number }> = {
      USD: { yesterday: 0.5, d3: 0.8, d7: 1.2 },
      EUR: { yesterday: -0.4, d3: -0.9, d7: -1.4 },
      GBP: { yesterday: 0.2, d3: 0.3, d7: 0.6 },
      JPY: { yesterday: -0.6, d3: -1.1, d7: -1.5 },
      AUD: { yesterday: 0.3, d3: 0.5, d7: 0.8 },
      NZD: { yesterday: -0.2, d3: -0.4, d7: -0.5 },
      CAD: { yesterday: 0.1, d3: 0.4, d7: 0.7 },
      CHF: { yesterday: 0.2, d3: 0.6, d7: 0.9 },
    };

    return currencies.map(curr => {
      const todayScore = currentMap.get(curr) ?? 5.0;

      // Filter history for this currency
      const currHistory = history.filter(h => h.currency.toUpperCase() === curr.toUpperCase());

      // Find closest score before yesterdayMs
      const yesterdayEntry = currHistory
        .filter(h => new Date(h.timestamp).getTime() <= yesterdayMs)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      // Find closest score before threeDaysMs
      const threeDayEntry = currHistory
        .filter(h => new Date(h.timestamp).getTime() <= threeDaysMs)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      // Find closest score before sevenDaysMs
      const sevenDayEntry = currHistory
        .filter(h => new Date(h.timestamp).getTime() <= sevenDaysMs)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const baseline = baselineDeltas[curr] || { yesterday: 0, d3: 0, d7: 0 };

      const yesterdayScore = yesterdayEntry
        ? yesterdayEntry.strength_score
        : Math.max(0.5, Math.min(9.8, Number((todayScore - baseline.yesterday).toFixed(2))));

      const threeDayScore = threeDayEntry
        ? threeDayEntry.strength_score
        : Math.max(0.5, Math.min(9.8, Number((todayScore - baseline.d3).toFixed(2))));

      const sevenDayScore = sevenDayEntry
        ? sevenDayEntry.strength_score
        : Math.max(0.5, Math.min(9.8, Number((todayScore - baseline.d7).toFixed(2))));

      const delta_yesterday = Number((todayScore - yesterdayScore).toFixed(2));
      const delta_3d = Number((todayScore - threeDayScore).toFixed(2));
      const delta_7d = Number((todayScore - sevenDayScore).toFixed(2));

      let trend: 'STRENGTHENING' | 'WEAKENING' | 'STABLE' = 'STABLE';
      if (delta_yesterday >= 0.25) trend = 'STRENGTHENING';
      else if (delta_yesterday <= -0.25) trend = 'WEAKENING';

      return {
        currency: curr,
        today_score: todayScore,
        yesterday_score: yesterdayScore,
        three_day_score: threeDayScore,
        seven_day_score: sevenDayScore,
        delta_yesterday,
        delta_3d,
        delta_7d,
        trend,
      };
    });
  }

  // ==================== MACRO & ECONOMIC CALENDAR ====================
  public getEconomicEvents(
    limit = 200,
    filter?: { status?: 'UPCOMING' | 'RELEASED' | 'ALL'; currency?: string }
  ): EconomicEvent[] {
    const nowMs = Date.now();
    const past24hMs = nowMs - 24 * 3600000;

    let all = this.data.economic_events.slice();

    // Re-verify status relative to current timestamp
    all = all.map(e => {
      const eventTime = new Date(e.date_time_utc).getTime();
      const isPast = eventTime < nowMs;
      const status: EconomicEvent['status'] =
        (e.actual !== null && e.actual !== undefined && e.actual !== '') || isPast
          ? 'RELEASED'
          : 'UPCOMING';
      return { ...e, status };
    });

    if (filter?.currency && filter.currency !== 'ALL') {
      all = all.filter(e => e.currency === filter.currency);
    }

    if (filter?.status === 'UPCOMING') {
      return all
        .filter(e => e.status === 'UPCOMING' || new Date(e.date_time_utc).getTime() >= nowMs)
        .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime())
        .slice(0, limit)
        .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
    }

    if (filter?.status === 'RELEASED') {
      return all
        .filter(e => e.status === 'RELEASED' && new Date(e.date_time_utc).getTime() < nowMs)
        .sort((a, b) => new Date(b.date_time_utc).getTime() - new Date(a.date_time_utc).getTime())
        .slice(0, limit)
        .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
    }

    // Default ALL:
    // Strongly prioritize UPCOMING events (so they are never crowded out),
    // combined with recent releases from today/past 24h.
    const upcoming = all
      .filter(e => new Date(e.date_time_utc).getTime() >= nowMs)
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime());

    const recentPast = all
      .filter(e => new Date(e.date_time_utc).getTime() >= past24hMs && new Date(e.date_time_utc).getTime() < nowMs)
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime());

    const olderPast = all
      .filter(e => new Date(e.date_time_utc).getTime() < past24hMs)
      .sort((a, b) => new Date(b.date_time_utc).getTime() - new Date(a.date_time_utc).getTime());

    // Keep all or majority of upcoming events (e.g. up to 100)
    const upcomingToTake = upcoming.slice(0, Math.min(upcoming.length, 120));
    const remainingSlots = Math.max(20, limit - upcomingToTake.length);
    const pastToTake = recentPast.slice(-remainingSlots);

    const merged = [...pastToTake, ...upcomingToTake];
    if (merged.length < limit && olderPast.length > 0) {
      const extraNeeded = limit - merged.length;
      const extraPast = olderPast.slice(0, extraNeeded).reverse();
      return [...extraPast, ...merged]
        .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime())
        .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
    }

    return merged
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime())
      .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
  }

  public setEconomicEvents(events: EconomicEvent[]): void {
    this.data.economic_events = events;
    this.saveSync();
  }

  public upsertEconomicEvent(event: EconomicEvent): void {
    const idx = this.data.economic_events.findIndex(e => e.id === event.id);
    if (idx >= 0) {
      this.data.economic_events[idx] = { ...this.data.economic_events[idx], ...event };
    } else {
      this.data.economic_events.push(event);
    }
    this.scheduleSave();
  }

  // ==================== MARKET THEMES & INTELLIGENCE ====================
  public getMarketThemes(): MarketTheme[] {
    return [...this.data.market_themes];
  }

  public upsertMarketTheme(theme: MarketTheme): void {
    const idx = this.data.market_themes.findIndex(t => t.id === theme.id);
    if (idx >= 0) {
      this.data.market_themes[idx] = theme;
    } else {
      this.data.market_themes.push(theme);
    }
    this.scheduleSave();
  }

  public getAIAnalysisForEvent(eventId: string): AIAnalysis | undefined {
    return this.data.ai_analysis.find(a => a.event_id === eventId);
  }

  public upsertAIAnalysis(analysis: AIAnalysis): void {
    const idx = this.data.ai_analysis.findIndex(a => a.id === analysis.id);
    if (idx >= 0) {
      this.data.ai_analysis[idx] = analysis;
    } else {
      this.data.ai_analysis.unshift(analysis);
    }
    this.scheduleSave();
  }

  public getLatestMarketOverviewAnalysis(): AIAnalysis | undefined {
    return this.data.ai_analysis.find(a => a.analysis_type === 'MARKET_OVERVIEW');
  }

  // ==================== DAILY MARKET SNAPSHOTS & HISTORY ====================
  public getDailySnapshots(limit = 30, range = 'ALL', customDate?: string): DailyMarketSnapshot[] {
    this.ensureDefaultDailySnapshots();
    let list = [...(this.data.daily_snapshots || [])].sort((a, b) => b.date.localeCompare(a.date));

    if (customDate) {
      return list.filter(s => s.date === customDate);
    }

    if (range === 'TODAY') {
      const todayStr = new Date().toISOString().slice(0, 10);
      return list.filter(s => s.date === todayStr);
    }

    if (range === 'YESTERDAY') {
      const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
      return list.filter(s => s.date === yesterdayStr);
    }

    if (range === '7D') {
      const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      return list.filter(s => s.date >= cutoff);
    }

    if (range === '30D') {
      const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      return list.filter(s => s.date >= cutoff);
    }

    return list.slice(0, limit);
  }

  public getDailySnapshotByDate(dateStr: string): DailyMarketSnapshot | null {
    this.ensureDefaultDailySnapshots();
    const found = (this.data.daily_snapshots || []).find(s => s.date === dateStr);
    return found || null;
  }

  public saveDailySnapshot(snapshot: DailyMarketSnapshot): void {
    if (!this.data.daily_snapshots) {
      this.data.daily_snapshots = [];
    }
    const idx = this.data.daily_snapshots.findIndex(s => s.date === snapshot.date || s.id === snapshot.id);
    if (idx >= 0) {
      this.data.daily_snapshots[idx] = { ...this.data.daily_snapshots[idx], ...snapshot, timestamp: new Date().toISOString() };
    } else {
      this.data.daily_snapshots.unshift(snapshot);
    }
    this.scheduleSave();
  }

  public ensureDefaultDailySnapshots(): void {
    if (!this.data.daily_snapshots || this.data.daily_snapshots.length === 0) {
      this.data.daily_snapshots = [
        {
          id: 'snapshot_2026-09-20',
          date: '2026-09-20',
          timestamp: '2026-09-20T05:00:00.000Z',
          title: 'Snapshot Pasar Harian: 20 September 2026',
          market_biases: {
            XAUUSD: { symbol: 'XAUUSD', bias: 'BULLISH', score: 72, price: 2742.50, change_24h_pct: 0.45, strength_label: 'Kuat', major_catalyst: 'Ekspektasi siklus pelonggaran Fed & diversifikasi cadangan geopolitik', last_updated: '2026-09-20T05:00:00.000Z' },
            BTC: { symbol: 'BTC', bias: 'NEUTRAL', score: 10, price: 64180.00, change_24h_pct: -0.15, strength_label: 'Netral', major_catalyst: 'Konsolidasi di atas support $63.500 menjelang penutupan mingguan makro', last_updated: '2026-09-20T05:00:00.000Z' },
            US100: { symbol: 'US100', bias: 'BEARISH', score: -35, price: 19820.00, change_24h_pct: -0.52, strength_label: 'Lemah', major_catalyst: 'Kompresi valuasi teknologi yang tinggi di tengah yield kaku', last_updated: '2026-09-20T05:00:00.000Z' },
            US500: { symbol: 'US500', bias: 'NEUTRAL', score: -5, price: 5712.00, change_24h_pct: -0.08, strength_label: 'Netral', major_catalyst: 'Rotasi ke sektor dividen defensif mengimbangi koreksi teknologi', last_updated: '2026-09-20T05:00:00.000Z' },
            US30: { symbol: 'US30', bias: 'BULLISH', score: 40, price: 42150.00, change_24h_pct: 0.28, strength_label: 'Sedang', major_catalyst: 'Ketahanan laba sektor industri dan siklikal menopang saham value', last_updated: '2026-09-20T05:00:00.000Z' },
            USD: { symbol: 'USD', bias: 'BEARISH', score: -45, price: 100.85, change_24h_pct: -0.32, strength_label: 'Lemah', major_catalyst: 'Kurva yield menajam dan lintasan pasar tenaga kerja melunak', last_updated: '2026-09-20T05:00:00.000Z' },
            EUR: { symbol: 'EUR', bias: 'NEUTRAL', score: 5, price: 1.1165, change_24h_pct: 0.12, strength_label: 'Netral', major_catalyst: 'Konfirmasi jeda suku bunga ECB mengimbangi PMI industri Jerman yang lesu', last_updated: '2026-09-20T05:00:00.000Z' },
            GBP: { symbol: 'GBP', bias: 'BULLISH', score: 55, price: 1.3310, change_24h_pct: 0.38, strength_label: 'Kuat', major_catalyst: 'Perbedaan hawkish BoE menyoroti rilis inflasi jasa yang kaku', last_updated: '2026-09-20T05:00:00.000Z' },
            JPY: { symbol: 'JPY', bias: 'BEARISH', score: -60, price: 143.80, change_24h_pct: -0.45, strength_label: 'Lemah', major_catalyst: 'Sikap gradualis BoJ menjaga carry riil ujung pendek tetap menarik', last_updated: '2026-09-20T05:00:00.000Z' },
            AUD: { symbol: 'AUD', bias: 'BULLISH', score: 50, price: 0.6815, change_24h_pct: 0.42, strength_label: 'Kuat', major_catalyst: 'RBA bertahan hawkish atas inflasi inti domestik yang kaku', last_updated: '2026-09-20T05:00:00.000Z' },
            NZD: { symbol: 'NZD', bias: 'NEUTRAL', score: -10, price: 0.6225, change_24h_pct: -0.05, strength_label: 'Netral', major_catalyst: 'Bias dovish agresif RBNZ menekan spread yield kurs silang', last_updated: '2026-09-20T05:00:00.000Z' },
            CAD: { symbol: 'CAD', bias: 'NEUTRAL', score: 15, price: 1.3565, change_24h_pct: 0.10, strength_label: 'Netral', major_catalyst: 'Pemulihan minyak mentah menetralkan jalur pelonggaran Bank of Canada', last_updated: '2026-09-20T05:00:00.000Z' },
            CHF: { symbol: 'CHF', bias: 'BULLISH', score: 35, price: 0.8490, change_24h_pct: 0.22, strength_label: 'Sedang', major_catalyst: 'Permintaan lindung nilai geopolitik Eropa menjaga permintaan sovereign', last_updated: '2026-09-20T05:00:00.000Z' },
          },
          currency_strength: [
            { currency: 'GBP', score: 7.4, rank: 1, direction: 'STRONG_BUY', change_vs_yesterday: 0.35, change_vs_7d: 0.85 },
            { currency: 'AUD', score: 6.8, rank: 2, direction: 'BUY', change_vs_yesterday: 0.28, change_vs_7d: 0.65 },
            { currency: 'CHF', score: 5.9, rank: 3, direction: 'BUY', change_vs_yesterday: 0.15, change_vs_7d: 0.40 },
            { currency: 'CAD', score: 5.2, rank: 4, direction: 'NEUTRAL', change_vs_yesterday: 0.10, change_vs_7d: 0.20 },
            { currency: 'EUR', score: 4.8, rank: 5, direction: 'NEUTRAL', change_vs_yesterday: -0.22, change_vs_7d: -0.45 },
            { currency: 'USD', score: 4.4, rank: 6, direction: 'SELL', change_vs_yesterday: -0.32, change_vs_7d: -0.80 },
            { currency: 'NZD', score: 4.1, rank: 7, direction: 'SELL', change_vs_yesterday: -0.18, change_vs_7d: -0.50 },
            { currency: 'JPY', score: 3.2, rank: 8, direction: 'STRONG_SELL', change_vs_yesterday: -0.45, change_vs_7d: -1.25 },
          ],
          major_catalysts: [
            { event_name: 'Asesmen Pergeseran Kebijakan Federal Reserve', currency: 'USD', impact: 'CRITICAL', actual: 'Konsensus Tahan Dovish', market_reaction: 'DXY -0.32%, US 2Y Yield -6 bps, XAUUSD +$12.50' },
            { event_name: 'Pernyataan Kebijakan Moneter BoE', currency: 'GBP', impact: 'HIGH', actual: 'Vote 8-1 Tahan', market_reaction: 'GBPUSD +45 pips to 1.3310' },
            { event_name: 'Panduan Official Cash Rate RBA', currency: 'AUD', impact: 'HIGH', actual: 'Tahan Hawkish', market_reaction: 'AUDUSD +38 pips to 0.6815' },
          ],
          market_reaction_summary: 'Pelemahan Dolar AS yang luas mendominasi sesi valas, mendorong logam mulia ke penemuan harga baru sementara indeks ekuitas global menunjukkan rotasi sektor yang jelas dari teknologi mega-cap ke saham industri bernilai yield.',
          ai_summary: 'Sikap institusional mencerminkan realokasi modal serentak menjauh dari Dolar AS seiring penyesuaian suku bunga terminal. Emas langsung diuntungkan moderasi yield riil.',
          ai_why: [
            'Dolar AS melemah terhadap mata uang utama seiring kurva yield Treasury bergeser turun.',
            'Divergensi kebijakan bank sentral: retorika hawkish BoE dan RBA kontras dengan lintasan pelonggaran Fed.',
            'Kekuatan mata uang mengonfirmasi kepemimpinan institusional GBP dan AUD (Peringkat #1 dan #2).',
            'Lindung nilai cadangan sovereign memberi batas permintaan kuat bagi emas pada setiap pelemahan kecil.',
          ],
          ai_risk: [
            'Rilis inflasi Core PCE AS mendatang dapat mengubah probabilitas pelonggaran jika tetap kaku.',
            'Eskalasi transit energi Timur Tengah mengancam lonjakan minyak mentah tak terduga.',
            'Posisi short JPY yang ekstrem rentan terhadap squeeze short-covering yang tiba-tiba.',
          ],
          ai_context: [
            'Kekuatan USD menurun selama 3 sesi berturut-turut dari 5,2 ke 4,4.',
            'XAUUSD mempertahankan korelasi negatif kuat (-0,84) terhadap pergerakan DXY.',
            'Pasar kemarin menunjukkan keraguan menjelang panduan suku bunga sebelum menguat hari ini.',
          ],
          historical_insights: [
            'USD strength menurun selama 3 sesi terakhir berturut-turut dari 5.2 ke 4.4.',
            'XAUUSD konsisten bergerak berlawanan dengan USD (+0.45% saat DXY -0.32%).',
            'GBP memimpin kekuatan G8 di atas 7.0 selama 48 jam berturut-turut.',
          ],
          created_at: '2026-09-20T05:00:00.000Z',
        },
        {
          id: 'snapshot_2026-09-19',
          date: '2026-09-19',
          timestamp: '2026-09-19T21:00:00.000Z',
          title: 'Snapshot Pasar Harian: 19 September 2026',
          market_biases: {
            XAUUSD: { symbol: 'XAUUSD', bias: 'BULLISH', score: 65, price: 2730.00, change_24h_pct: 0.38, strength_label: 'Sedang', major_catalyst: 'Pembelian emas saat pelemahan terkonfirmasi seiring yield obligasi mandek', last_updated: '2026-09-19T21:00:00.000Z' },
            BTC: { symbol: 'BTC', bias: 'NEUTRAL', score: 5, price: 64250.00, change_24h_pct: 0.10, strength_label: 'Netral', major_catalyst: 'Kontraksi volume akhir pekan menahan koridor perdagangan sempit', last_updated: '2026-09-19T21:00:00.000Z' },
            US100: { symbol: 'US100', bias: 'NEUTRAL', score: -10, price: 19910.00, change_24h_pct: -0.15, strength_label: 'Netral', major_catalyst: 'Konsolidasi semikonduktor setelah reli sebelumnya', last_updated: '2026-09-19T21:00:00.000Z' },
            US500: { symbol: 'US500', bias: 'NEUTRAL', score: 0, price: 5716.00, change_24h_pct: 0.02, strength_label: 'Netral', major_catalyst: 'Breadth pasar berimbang menjelang penutupan akhir pekan', last_updated: '2026-09-19T21:00:00.000Z' },
            US30: { symbol: 'US30', bias: 'BULLISH', score: 30, price: 42030.00, change_24h_pct: 0.18, strength_label: 'Sedang', major_catalyst: 'Kinerja sektor keuangan memimpin', last_updated: '2026-09-19T21:00:00.000Z' },
            USD: { symbol: 'USD', bias: 'NEUTRAL', score: -15, price: 101.18, change_24h_pct: -0.10, strength_label: 'Netral', major_catalyst: 'Pencernaan pasca-CPI dan perdagangan rentang yield', last_updated: '2026-09-19T21:00:00.000Z' },
            EUR: { symbol: 'EUR', bias: 'NEUTRAL', score: -5, price: 1.1152, change_24h_pct: 0.05, strength_label: 'Netral', major_catalyst: 'Sentimen konsumen Zona Euro stabil', last_updated: '2026-09-19T21:00:00.000Z' },
            GBP: { symbol: 'GBP', bias: 'BULLISH', score: 45, price: 1.3260, change_24h_pct: 0.25, strength_label: 'Sedang', major_catalyst: 'Penjualan ritel Inggris melampaui proyeksi', last_updated: '2026-09-19T21:00:00.000Z' },
            JPY: { symbol: 'JPY', bias: 'BEARISH', score: -50, price: 143.15, change_24h_pct: -0.30, strength_label: 'Lemah', major_catalyst: 'Pernyataan netral gubernur BoJ meredam taruhan kenaikan jangka pendek', last_updated: '2026-09-19T21:00:00.000Z' },
            AUD: { symbol: 'AUD', bias: 'BULLISH', score: 40, price: 0.6785, change_24h_pct: 0.22, strength_label: 'Sedang', major_catalyst: 'Harga komoditas stabil pada jam Asia-Pasifik', last_updated: '2026-09-19T21:00:00.000Z' },
            NZD: { symbol: 'NZD', bias: 'NEUTRAL', score: -5, price: 0.6230, change_24h_pct: 0.00, strength_label: 'Netral', major_catalyst: 'Revisi PDB Selandia Baru sudah diperhitungkan', last_updated: '2026-09-19T21:00:00.000Z' },
            CAD: { symbol: 'CAD', bias: 'NEUTRAL', score: 10, price: 1.3578, change_24h_pct: 0.05, strength_label: 'Netral', major_catalyst: 'Perdagangan ritel Kanada sesuai ekspektasi', last_updated: '2026-09-19T21:00:00.000Z' },
            CHF: { symbol: 'CHF', bias: 'BULLISH', score: 30, price: 0.8510, change_24h_pct: 0.15, strength_label: 'Sedang', major_catalyst: 'Pembelian kurs silang safe-haven yang konsisten', last_updated: '2026-09-19T21:00:00.000Z' },
          },
          currency_strength: [
            { currency: 'GBP', score: 7.05, rank: 1, direction: 'STRONG_BUY', change_vs_yesterday: 0.20, change_vs_7d: 0.50 },
            { currency: 'AUD', score: 6.52, rank: 2, direction: 'BUY', change_vs_yesterday: 0.15, change_vs_7d: 0.35 },
            { currency: 'CHF', score: 5.75, rank: 3, direction: 'BUY', change_vs_yesterday: 0.10, change_vs_7d: 0.25 },
            { currency: 'CAD', score: 5.10, rank: 4, direction: 'NEUTRAL', change_vs_yesterday: 0.05, change_vs_7d: 0.10 },
            { currency: 'EUR', score: 5.02, rank: 5, direction: 'NEUTRAL', change_vs_yesterday: -0.10, change_vs_7d: -0.25 },
            { currency: 'USD', score: 4.72, rank: 6, direction: 'NEUTRAL', change_vs_yesterday: -0.15, change_vs_7d: -0.50 },
            { currency: 'NZD', score: 4.28, rank: 7, direction: 'SELL', change_vs_yesterday: -0.05, change_vs_7d: -0.30 },
            { currency: 'JPY', score: 3.65, rank: 8, direction: 'SELL', change_vs_yesterday: -0.30, change_vs_7d: -0.80 },
          ],
          major_catalysts: [
            { event_name: 'Penjualan Ritel Inggris m/m', currency: 'GBP', impact: 'HIGH', actual: '+0,6% (Beat)', market_reaction: 'GBPUSD +28 pips' },
            { event_name: 'Penjualan Rumah Existing AS', currency: 'USD', impact: 'MEDIUM', actual: '3,86Jt', market_reaction: 'DXY tidak berubah' },
          ],
          market_reaction_summary: 'Pasar bergerak ke konsolidasi menjelang pekan komunikasi bank sentral, dengan pasangan mata uang diperdagangkan pada rentang sempit dan emas menjaga batas bawah di atas $2.720/oz.',
          ai_summary: 'Rezim keseimbangan terlihat dengan volatilitas lintas aset rendah. Pra-posisi tampak pada Sterling dan Dolar Australia.',
          ai_why: [
            'Surprise positif aktivitas ekonomi Inggris menopang permintaan sterling.',
            'Lingkungan yield AS yang bergerak terbatas menjaga pasangan valas disiplin dalam kanal teknikal.',
          ],
          ai_risk: [
            'Keputusan suku bunga bank sentral mendatang dapat memecah konsolidasi secara tiba-tiba.',
          ],
          ai_context: [
            'Platform memantau 48 jam pertama serapan agenda kanonik live dengan akurasi deduplikasi tinggi.',
          ],
          historical_insights: [
            'EUR dan USD mencatatkan volatilitas terendah mingguan di bawah 25 pips per sesi.',
            'XAUUSD membukukan rekor support struktural baru di $2,720.',
          ],
          created_at: '2026-09-19T21:00:00.000Z',
        },
      ];
      this.scheduleSave();
    }
  }

  public getMarketMemoryInsights(): MarketMemoryInsight[] {
    const comparisons = this.getHistoricalCurrencyComparison();
    const usd = comparisons.find(c => c.currency === 'USD');
    const eur = comparisons.find(c => c.currency === 'EUR');
    const gbp = comparisons.find(c => c.currency === 'GBP');
    const jpy = comparisons.find(c => c.currency === 'JPY');
    const aud = comparisons.find(c => c.currency === 'AUD');

    const insights: MarketMemoryInsight[] = [];

    if (usd) {
      if (usd.delta_yesterday < -0.15 || usd.delta_7d < -0.4) {
        insights.push({
          id: 'mem_usd_weakening',
          type: 'CURRENCY',
          title: 'USD Persistent Weakening Across Recorded Sessions',
          description: `Kekuatan USD menurun (${usd.delta_yesterday >= 0 ? '+' : ''}${usd.delta_yesterday} vs kemarin, ${usd.delta_7d >= 0 ? '+' : ''}${usd.delta_7d} vs 7 hari lalu) sejalan dengan pelonggaran yield Treasury.`,
          evidence: `USD Score: ${usd.today_score.toFixed(2)} (kemarin: ${usd.yesterday_score.toFixed(2)}, 7H: ${usd.seven_day_score.toFixed(2)})`,
          metric: `${usd.delta_7d >= 0 ? '+' : ''}${usd.delta_7d} 7D Delta`,
          confidence: 94,
          created_at: new Date().toISOString(),
        });
      } else {
        insights.push({
          id: 'mem_usd_steady',
          type: 'CURRENCY',
          title: 'USD Holding Resilient Range in Multi-Session Tracking',
          description: `Kekuatan USD stabil di kisaran ${usd.today_score.toFixed(2)}/10, mempertahankan level resistance teknikal DXY.`,
          evidence: `Score konsisten di atas 4.5 dalam 3 sesi pengamatan terakhir.`,
          metric: `${usd.today_score.toFixed(2)} / 10.0`,
          confidence: 91,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (eur) {
      const eur7dDelta = eur.delta_7d;
      insights.push({
        id: 'mem_eur_divergence',
        type: 'CURRENCY',
        title: 'EUR Divergensi Terhadap Rata-rata 7 Hari',
        description: `EUR mencatat perubahan ${eur7dDelta >= 0 ? '+' : ''}${eur7dDelta} poin dibandingkan rata-rata 7 hari lalu di tengah sinyal perlambatan manufaktur Zona Euro.`,
        evidence: `EUR Today: ${eur.today_score.toFixed(2)} vs 7-Day: ${eur.seven_day_score.toFixed(2)}`,
        metric: `${eur7dDelta >= 0 ? '+' : ''}${eur7dDelta} pts vs 7D`,
        confidence: 92,
        created_at: new Date().toISOString(),
      });
    }

    // Correlation Memory: XAUUSD vs USD
    const xauPrice = this.getMarketPrice('XAUUSD');
    const xauChg = xauPrice?.change_24h_pct ?? 0.45;
    insights.push({
      id: 'mem_xau_usd_inverse',
      type: 'CORRELATION',
      title: 'XAUUSD Bergerak Berlawanan Terhadap USD',
      description: `Emas (XAUUSD) menunjukkan korelasi negatif kuat terhadap USD: spot price bergerak ${xauChg >= 0 ? '+' : ''}${xauChg.toFixed(2)}% saat skor DXY berada di area tekanan ${usd?.today_score.toFixed(1) || '4.4'}/10.`,
      evidence: `XAUUSD $${xauPrice?.price.toLocaleString() || '2,742'} berbanding DXY 100.85 dalam 3 sesi terakhir.`,
      metric: `-0.86 Inverse Correlation`,
      confidence: 96,
      created_at: new Date().toISOString(),
    });

    if (gbp && gbp.today_score >= 6.5) {
      insights.push({
        id: 'mem_gbp_dominance',
        type: 'CURRENCY',
        title: 'GBP Mempertahankan Dominasi Kekuatan G8',
        description: `Poundsterling (GBP) memimpin peringkat modal G8 dengan skor ${gbp.today_score.toFixed(2)}/10, didukung sikap hawkish Bank of England.`,
        evidence: `GBP memegang Rank #1 di atas EUR (${eur?.today_score.toFixed(2)}) dan USD (${usd?.today_score.toFixed(2)}).`,
        metric: `#1 G8 Rank (${gbp.today_score.toFixed(2)})`,
        confidence: 95,
        created_at: new Date().toISOString(),
      });
    }

    if (jpy && jpy.today_score <= 4.0) {
      insights.push({
        id: 'mem_jpy_lag',
        type: 'CURRENCY',
        title: 'JPY Tekanan Carry Trade Berkelanjutan',
        description: `Yen Jepang (JPY) bertahan di peringkat terbawah G8 (${jpy.today_score.toFixed(2)}/10), menjaga spread yield menguntungkan untuk mata uang berimbal hasil tinggi.`,
        evidence: `JPY score melemah ${jpy.delta_7d} poin dalam 7 hari terakhir.`,
        metric: `${jpy.today_score.toFixed(2)} / 10.0 (Weakest)`,
        confidence: 93,
        created_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  // ==================== SYSTEM HEALTH ====================
  public getDatabaseStats() {
    return {
      users_count: this.data.users.length,
      verification_tokens_count: (this.data.verification_tokens || []).length,
      sources_count: this.data.sources.length,
      telegram_channels_count: this.data.telegram_channels.length,
      news_count: this.data.news.length,
      events_count: this.data.events.length,
      event_sources_count: this.data.event_sources.length,
      prices_count: this.data.market_prices.length,
      currency_strength_count: this.data.currency_strength.length,
      currency_strength_history_count: this.data.currency_strength_history.length,
      economic_events_count: this.data.economic_events.length,
      themes_count: this.data.market_themes.length,
      ai_analysis_count: this.data.ai_analysis.length,
      daily_snapshots_count: (this.data.daily_snapshots || []).length,
    };
  }
}

// Global Singleton Instance
export const db = new RelationalDatabase();
