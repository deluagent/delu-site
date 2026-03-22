"use client";

import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, Zap, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const pnlColor = (n?: number | null) => !n || n === 0 ? 'text-[#6b7280]' : n > 0 ? 'text-green-400' : 'text-red-400';
const pnlSign  = (n: number) => n >= 0 ? '+' : '';

const shortTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtPrice = (p?: number | null) => {
  if (p == null) return '—';
  if (p < 0.0001) return `$${p.toExponential(2)}`;
  if (p < 0.01)   return `$${p.toFixed(6)}`;
  if (p < 1)      return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
};

// ── Base components ───────────────────────────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 card-glow relative overflow-hidden ${className}`}>{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280] font-bold mb-3">{children}</div>
);

const ActionBadge = ({ action }: { action: string }) => {
  const a = (action || 'hold').toLowerCase().replace('_', ' ');
  const isBuy = a === 'buy' || a === 'long';
  const isYield = a.includes('yield');
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
      isBuy   ? 'bg-green-500/10 text-green-400 border-green-500/20' :
      isYield ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                'bg-[#1e1e2e] text-[#6b7280] border-[#2e2e3e]'
    }`}>
      {isBuy ? 'BUY ✓' : isYield ? 'YIELD' : 'HOLD'}
    </span>
  );
};

const VolTag = ({ trend }: { trend?: string | null }) => {
  if (!trend || trend === 'unknown') return null;
  return (
    <span className={`flex items-center gap-0.5 text-[9px] font-bold ${
      trend === 'increasing' ? 'text-green-400' :
      trend === 'declining'  ? 'text-red-400' :
                               'text-[#6b7280]'
    }`}>
      {trend === 'increasing' ? <TrendingUp size={9}/> : trend === 'declining' ? <TrendingDown size={9}/> : <Minus size={9}/>}
      {trend}
    </span>
  );
};

const RecoBadge = ({ reco }: { reco?: string | null }) => {
  if (!reco || reco === 'hold') return null;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
      reco === 'exit'    ? 'bg-red-500/10 text-red-400 border-red-500/30' :
      reco === 'tighten' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                           'bg-green-500/10 text-green-400 border-green-500/30'
    }`}>{reco.toUpperCase()}</span>
  );
};

// ── Positions card ────────────────────────────────────────────────────────────
function PositionsCard({ positions, loading, yieldPos }: { positions: any[]; loading: boolean; yieldPos?: any }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const open = positions.filter((p: any) => !p.closedAt);

  return (
    <Card>
      <Label>Active Positions ({open.length})</Label>
      <div className="space-y-2">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-14 bg-[#1a1a24] rounded-xl animate-pulse" />)
        ) : open.length > 0 ? open.map((p: any) => {
          const hasPnl   = p.currentPrice != null;
          const pnlPct   = hasPnl ? (p.pnlPct ?? 0) : null;
          const pnlUSD   = hasPnl ? (p.pnlUSD ?? 0) : null;
          const curUSD   = p.currentUSD ?? p.sizeUSD ?? 0;
          const trailOn  = (p.peakPct ?? 0) >= 1 || p.trailActivated;
          const isExp    = expanded === p.sym;

          // Checkr signal strength
          const hasSocial = p.transferStats || p.volumeTrend || p.quantScore != null;

          return (
            <div key={p.sym} className={`rounded-xl border transition-all ${isExp ? 'border-indigo-500/20 bg-[#0d0d1a]' : 'border-[#1e1e2e] hover:border-indigo-500/20'}`}>
              {/* Row */}
              <button onClick={() => setExpanded(isExp ? null : p.sym)} className="w-full text-left flex items-center gap-3 p-3">
                <div className="w-7 h-7 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] flex items-center justify-center mono text-xs font-bold text-indigo-400 shrink-0">
                  {(p.sym || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{p.sym}</span>
                    {pnlPct != null ? (
                      <span className={`mono text-xs font-bold ${pnlColor(pnlPct)}`}>{pnlSign(pnlPct)}{pnlPct.toFixed(2)}%</span>
                    ) : (
                      <span className="mono text-xs text-[#6b7280]">—</span>
                    )}
                    {p.peakPct > 0 && <span className="mono text-[9px] text-[#6b7280]">peak +{p.peakPct.toFixed(1)}%</span>}
                    <RecoBadge reco={p.recommendation} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#6b7280] mono">{fmtPrice(p.entryPrice)}{p.currentPrice ? ` → ${fmtPrice(p.currentPrice)}` : ''}</span>
                    <VolTag trend={p.volumeTrend} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold mono">${curUSD.toFixed(2)}</div>
                  {pnlUSD != null ? (
                    <div className={`text-[10px] mono ${pnlColor(pnlUSD)}`}>{pnlSign(pnlUSD)}${Math.abs(pnlUSD).toFixed(2)}</div>
                  ) : <div className="text-[10px] text-[#6b7280] mono">—</div>}
                  <div className="text-[9px] text-[#6b7280] mono">{trailOn ? `Trail -${p.trailStop ?? 5}% ✓` : `SL -${p.hardSlPct ?? 3}%`}</div>
                </div>
                <ChevronDown size={11} className={`text-[#6b7280] shrink-0 transition-transform ${isExp ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded: position intelligence */}
              {isExp && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Signal grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {p.quantScore != null && (
                      <div className="p-2 bg-[#111118] border border-[#1e1e2e] rounded-lg">
                        <div className="text-[9px] text-[#6b7280] mb-0.5">Quant Score</div>
                        <div className={`mono text-sm font-bold ${p.quantScore > 0 ? 'text-green-400' : p.quantScore < 0 ? 'text-red-400' : 'text-[#6b7280]'}`}>
                          {p.quantScore > 0 ? '+' : ''}{p.quantScore.toFixed(3)}
                        </div>
                      </div>
                    )}
                    {p.ret1h != null && (
                      <div className="p-2 bg-[#111118] border border-[#1e1e2e] rounded-lg">
                        <div className="text-[9px] text-[#6b7280] mb-0.5">1h Return</div>
                        <div className={`mono text-sm font-bold ${pnlColor(p.ret1h)}`}>{pnlSign(p.ret1h)}{p.ret1h.toFixed(2)}%</div>
                      </div>
                    )}
                    {p.volumeTrend && p.volumeTrend !== 'unknown' && (
                      <div className="p-2 bg-[#111118] border border-[#1e1e2e] rounded-lg">
                        <div className="text-[9px] text-[#6b7280] mb-0.5">Volume Trend</div>
                        <div className="flex items-center gap-1"><VolTag trend={p.volumeTrend} /></div>
                      </div>
                    )}
                    {p.peakPct > 0 && (
                      <div className="p-2 bg-[#111118] border border-[#1e1e2e] rounded-lg">
                        <div className="text-[9px] text-[#6b7280] mb-0.5">Peak Gain</div>
                        <div className="mono text-sm font-bold text-emerald-400">+{p.peakPct.toFixed(2)}%</div>
                      </div>
                    )}
                  </div>

                  {/* Transfer stats */}
                  {p.transferStats && (
                    <div className="p-2 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg">
                      <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Alchemy Onchain</div>
                      <div className="grid grid-cols-3 gap-2">
                        {p.transferStats.uniqueBuyers != null && (
                          <div>
                            <div className="text-[8px] text-[#6b7280]">Unique buyers</div>
                            <div className="mono text-xs font-bold">{p.transferStats.uniqueBuyers}</div>
                          </div>
                        )}
                        {p.transferStats.repeatBuyers != null && (
                          <div>
                            <div className="text-[8px] text-[#6b7280]">Repeat buyers</div>
                            <div className={`mono text-xs font-bold ${p.transferStats.repeatBuyers > 3 ? 'text-green-400' : ''}`}>{p.transferStats.repeatBuyers}</div>
                          </div>
                        )}
                        {p.transferStats.topBuyerConcentration != null && (
                          <div>
                            <div className="text-[8px] text-[#6b7280]">Whale conc.</div>
                            <div className={`mono text-xs font-bold ${p.transferStats.topBuyerConcentration > 0.4 ? 'text-red-400' : 'text-green-400'}`}>{(p.transferStats.topBuyerConcentration * 100).toFixed(0)}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendation reasoning */}
                  <div className={`p-2 rounded-lg border text-[10px] ${
                    p.recommendation === 'exit'    ? 'bg-red-500/5 border-red-500/20 text-red-300' :
                    p.recommendation === 'tighten' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300' :
                    'bg-[#0d0d1a] border-[#1e1e2e] text-[#6b7280]'
                  }`}>
                    {p.recommendation === 'exit'
                      ? '⚠️ Strong reversal signal detected — momentum fading + volume declining. Stop may trigger.'
                      : p.recommendation === 'tighten'
                      ? '⚡ Momentum fading — consider tightening stop to protect gains.'
                      : p.quantScore != null && p.volumeTrend === 'increasing'
                      ? '✅ Thesis intact — volume expanding, positive quant signal. Let it run.'
                      : '📊 Position monitoring — holding per stop rules.'}
                  </div>

                  {/* Stop details */}
                  <div className="flex items-center justify-between text-[9px] text-[#4b5563] mono">
                    <span>Entry: {fmtPrice(p.entryPrice)}</span>
                    {p.currentPrice && <span>Now: {fmtPrice(p.currentPrice)}</span>}
                    <span>{trailOn ? `Trail stop: -${p.trailStop ?? 5}% from peak` : `Hard SL: -${p.hardSlPct ?? 3}%`}</span>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
              <Shield className="text-indigo-500" size={20} />
            </div>
            <h3 className="text-sm font-bold">Capital in Yield</h3>
            <p className="text-xs text-[#6b7280] mt-1">No signal justifies exposure right now.</p>
          </div>
        )}
        {yieldPos && (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-emerald-400">{yieldPos.protocol} Yield</span>
              <span className="mono text-xs text-emerald-400">+{yieldPos.apy}% APY</span>
            </div>
            <div className="text-[10px] text-[#6b7280] mono">{yieldPos.vault}</div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#6b7280]">Deployed</span>
              <span className="mono text-xs font-bold">${yieldPos.amountUSD?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Token signal row (inside cycle log) ──────────────────────────────────────
function TokenSignalRow({ t }: { t: any }) {
  const hasCheckr = t.attentionDelta > 0 || t.velocity > 0 || t.momentumWindows > 0;
  const hasRotation = t.rotatingFrom?.length > 0;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-[#1e1e2e] last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="mono text-xs font-bold text-[#e2e8f0]">{t.symbol}</span>
          {t.rank != null && <span className="text-[9px] text-[#6b7280]">#{t.rank}</span>}
          {t.source === 'checkr' && <span className="text-[9px] text-orange-400 border border-orange-500/20 px-1 rounded">checkr</span>}
          {t.source === 'bankr' && t.rank != null && <span className="text-[9px] text-indigo-400 border border-indigo-500/20 px-1 rounded">bankr</span>}
          {t.rugVerdict && t.rugVerdict !== 'SAFE' && <span className="text-[9px] text-red-400 border border-red-500/20 px-1 rounded">rug:{t.rugVerdict}</span>}
          {t.sustainedMomentum && <span className="text-[9px] text-orange-400">🔥{t.momentumWindows}w</span>}
          {hasRotation && <span className="text-[9px] text-purple-400">↩ from {t.rotatingFrom.slice(0,2).join(',')}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {t.ret1h != null && (
            <span className={`mono text-[9px] ${t.ret1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {t.ret1h >= 0 ? '+' : ''}{(t.ret1h * 100).toFixed(1)}% 1h
            </span>
          )}
          {hasCheckr && (
            <span className="text-[9px] text-orange-300">
              ⚡ att={t.attentionDelta?.toFixed(1)} vel={t.velocity?.toFixed(1)}
            </span>
          )}
          {t.att_1h > 0 && (
            <span className="mono text-[9px] text-[#6b7280]">
              1h={t.att_1h?.toFixed(1)} 4h={t.att_4h?.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`mono text-xs font-bold ${(t.score || 0) >= 0.8 ? 'text-green-400' : (t.score || 0) >= 0.5 ? 'text-indigo-400' : 'text-[#6b7280]'}`}>
          {(t.score || 0).toFixed(2)}
        </div>
        {t.quantScore != null && (
          <div className="mono text-[9px] text-[#6b7280]">q={t.quantScore.toFixed(2)}</div>
        )}
      </div>
    </div>
  );
}

// ── Cycle Timeline ────────────────────────────────────────────────────────────
function CycleTimeline({ cycle, positions }: { cycle: any; positions: any[] }) {
  if (!cycle) return null;
  const entries = cycle.trendingEntries || [];
  const flagged = entries.filter((t: any) => (t.score || 0) >= 0.65);
  const openPos = positions.filter((p: any) => !p.closedAt);

  const steps = [
    {
      id: 'discovery', icon: '📡', label: 'Discovery',
      content: (
        <div>
          {entries.length === 0 ? (
            <p className="text-[10px] text-[#6b7280] mono">No tokens discovered this cycle</p>
          ) : (
            <div className="space-y-0">
              {entries.slice(0, 8).map((t: any) => <TokenSignalRow key={t.symbol} t={t} />)}
              {entries.length > 8 && <p className="text-[9px] text-[#6b7280] mt-1">+{entries.length - 8} more</p>}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'scoring', icon: '📐', label: `Signal Scoring — ${flagged.length} cleared threshold`,
      content: (
        <div>
          {flagged.length === 0 ? (
            <p className="text-[10px] text-[#6b7280] mono">{entries.length} scored — none cleared 0.65 threshold</p>
          ) : (
            <div className="space-y-0">
              {flagged.map((t: any) => <TokenSignalRow key={t.symbol} t={t} />)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'positions', icon: '📊', label: 'Portfolio Check',
      content: (
        <div className="text-[10px] mono text-[#6b7280]">
          {cycle.positionUpdates?.length > 0 ? (() => {
            const updates = cycle.positionUpdates;
            const holding = updates.filter((p: any) => !p.recommendation || p.recommendation === 'hold');
            const tighten = updates.filter((p: any) => p.recommendation === 'tighten');
            const exit    = updates.filter((p: any) => p.recommendation === 'exit');
            const parts: string[] = [];
            if (holding.length) parts.push(`${holding.map((p: any) => `${p.sym}${p.pnlPct != null ? ` ${p.pnlPct >= 0 ? '+' : ''}${p.pnlPct.toFixed(1)}%` : ''}`).join(', ')} holding`);
            if (tighten.length) parts.push(`⚡ tighten: ${tighten.map((p: any) => p.sym).join(', ')}`);
            if (exit.length)    parts.push(`⚠️ exit signal: ${exit.map((p: any) => p.sym).join(', ')}`);
            return <span>{parts.join(' · ')}</span>;
          })() : openPos.length === 0 ? (
            <span>No open positions</span>
          ) : (
            <span>{openPos.length} positions holding</span>
          )}
        </div>
      ),
    },
    {
      id: 'venice', icon: '🔒', label: 'Venice Reasoning (at decision time)', highlight: true,
      content: (
        <div>
          <p className="text-[10px] text-[#a5b4fc] italic mono leading-relaxed">
            {cycle.reasoning || cycle.reason || 'No reasoning logged'}
          </p>
          {cycle.confidence > 0 && <span className="mono text-[9px] text-[#6b7280] mt-1 block">confidence: {cycle.confidence}%</span>}
        </div>
      ),
    },
    {
      id: 'action', label: 'Decision',
      icon: (cycle.action === 'buy' || cycle.action === 'long') ? '✅' : '⏸',
      trade: cycle.action === 'buy' || cycle.action === 'long',
      content: (
        <p className="text-[10px] mono text-[#e2e8f0]">
          {(cycle.action || 'HOLD').toUpperCase().replace('_', ' ')}
          {cycle.asset && cycle.asset !== 'USDC' ? ` ${cycle.asset}` : ''}
          {cycle.confidence > 0 ? ` · ${cycle.confidence}% conf` : ''}
          {cycle.regime ? ` · ${cycle.regime}` : ''}
        </p>
      ),
    },
  ];

  return (
    <div className="mt-3">
      {steps.map((step, i) => (
        <div key={step.id} className="relative flex gap-3">
          {i < steps.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#1e1e2e]" />}
          <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
            (step as any).trade     ? 'bg-green-500/20 border border-green-500/40' :
            (step as any).highlight ? 'bg-indigo-500/20 border border-indigo-500/40' :
                                      'bg-[#1e1e2e] border border-[#2e2e3e]'
          }`}>{step.icon}</div>
          <div className="pb-4 min-w-0 flex-1">
            <div className={`text-[11px] font-bold mb-1 ${
              (step as any).trade     ? 'text-green-400' :
              (step as any).highlight ? 'text-indigo-300' : 'text-[#e2e8f0]'
            }`}>{step.label}</div>
            {step.content}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Cycle Log ─────────────────────────────────────────────────────────────────
function CycleLog({ cycles, positions }: { cycles: any[]; positions: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  if (!cycles.length) return (
    <Card><Label>Cycle Log</Label><p className="text-xs text-[#6b7280] italic py-8 text-center">No cycles yet</p></Card>
  );
  return (
    <Card>
      <Label>Cycle Log — every 30 min</Label>
      <div className="space-y-0.5 overflow-y-auto max-h-[760px] scrollbar-hide">
        {cycles.map((c: any, i: number) => {
          const isOpen  = expanded === i;
          const isTrade = c.action === 'buy' || c.action === 'long';
          const entries = c.trendingEntries || [];
          const topScore = entries.length ? Math.max(...entries.map((t: any) => t.score || 0)) : 0;
          return (
            <div key={i} className={`rounded-xl border transition-all ${isOpen ? 'border-indigo-500/20 bg-[#0d0d1a]' : isTrade ? 'border-green-500/10 bg-green-500/3' : 'border-transparent hover:border-[#1e1e2e]'}`}>
              <button onClick={() => setExpanded(isOpen ? null : i)} className="w-full text-left flex items-center gap-2 px-3 py-2">
                <span className="mono text-[9px] text-[#6b7280] w-[82px] shrink-0">{c.ts ? shortTime(c.ts) : '—'}</span>
                <span className="shrink-0"><ActionBadge action={c.action || 'hold'} /></span>
                {isTrade && c.asset && c.asset !== 'USDC' && (
                  <span className="mono text-xs font-bold text-green-300 shrink-0">{c.asset}</span>
                )}
                {!isTrade && entries.length > 0 && (
                  <span className="mono text-[9px] text-[#6b7280] shrink-0">{entries.length} tokens</span>
                )}
                <span className="text-[10px] text-[#6b7280] truncate flex-1 min-w-0">
                  {c.reasoning ? c.reasoning.slice(0, 72) : '—'}
                </span>
                {c.screenLayer === 'anthropic-fallback' && (
                  <span className="text-[8px] text-yellow-500/70 shrink-0 border border-yellow-500/20 px-1 rounded">haiku</span>
                )}
                {c.screenLayer === 'bankr-llm' && (
                  <span className="text-[8px] text-indigo-400/60 shrink-0 border border-indigo-500/20 px-1 rounded">bankr</span>
                )}
                {topScore >= 0.8 && !isTrade && (
                  <span className="text-[9px] text-indigo-400 shrink-0">top {topScore.toFixed(2)}</span>
                )}
                {isTrade && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                <ChevronDown size={11} className={`text-[#6b7280] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-3 pb-4">
                  <CycleTimeline cycle={c} positions={positions} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Pipeline card ─────────────────────────────────────────────────────────────
function PipelineCard() {
  const rows = [
    { icon: '🏦', label: 'Bankr LLM', detail: 'Regime detection · trending token universe', color: 'border-indigo-500/20 bg-indigo-500/5' },
    { icon: '⚡', label: 'Checkr × x402', detail: '4-window attention (1h/4h/8h/12h) · spikes · rotation', color: 'border-orange-500/20 bg-orange-500/5', parallel: true },
    { icon: '🔗', label: 'Alchemy', detail: 'Hourly OHLCV · transfer stats · whale concentration', color: 'border-blue-500/20 bg-blue-500/5', parallel: true },
    { icon: '🧠', label: 'Quant Brain', detail: 'Self-evolved scoring — 3,500+ experiments by Bankr LLM', color: 'border-purple-500/20 bg-purple-500/5' },
    { icon: '🔒', label: 'Venice E2EE', detail: 'Private reasoning — no logs, no data retention', color: 'border-violet-500/20 bg-violet-500/5' },
    { icon: '✅', label: 'Bankr Execute', detail: 'Swap + ATR trailing stop — fully autonomous', color: 'border-green-500/20 bg-green-500/5' },
  ];
  return (
    <Card>
      <Label>How It Works — every 30 min</Label>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i}>
            {r.parallel && i > 0 && !rows[i-1].parallel && (
              <div className="flex items-center gap-2 my-1 ml-4">
                <div className="w-px h-2 bg-[#2e2e3e]" />
                <span className="text-[8px] text-[#4b5563] tracking-widest uppercase">parallel</span>
                <div className="flex-1 h-px bg-[#1e1e2e]" />
              </div>
            )}
            <div className={`flex items-center gap-3 p-2 rounded-lg border ${r.color}`}>
              <span className="text-base shrink-0">{r.icon}</span>
              <div>
                <div className="text-[11px] font-bold text-[#e2e8f0]">{r.label}</div>
                <div className="text-[9px] text-[#6b7280] mono">{r.detail}</div>
              </div>
            </div>
            {r.parallel && !rows[i+1]?.parallel && (
              <div className="ml-4 mt-1 mb-1"><div className="w-px h-2 bg-[#2e2e3e]" /></div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const r = await fetch('/api/status'); setStatus(await r.json()); }
      catch {}
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const wallet    = status?.wallet    || {};
  const positions = status?.positions || [];
  const cycles    = status?.cycleHistory || [];
  const ar        = status?.autoresearch || {};
  const yieldPos  = status?.yield;
  const openPos   = positions.filter((p: any) => !p.closedAt);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto relative z-10">

      {/* Header */}
      <header className="flex items-center justify-between gap-4 mb-5 bg-[#111118] border border-[#1e1e2e] rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="text-white fill-white" size={16} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">delu</span>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-live" />
            <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-widest hidden sm:block">live on Base</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-[11px] mono"><span className="text-[#6b7280]">Portfolio </span><span className="font-bold">${(wallet.totalUSD || 0).toFixed(2)}</span></div>
          <div className="w-px h-4 bg-[#1e1e2e]" />
          <div className="text-[11px] mono"><span className="text-[#6b7280]">Liquid </span><span className="font-bold text-emerald-400">${(wallet.liquidUSDC || 0).toFixed(2)}</span></div>
          <div className="w-px h-4 bg-[#1e1e2e]" />
          <div className="text-[11px] mono">
            <span className="text-[#6b7280]">P&amp;L </span>
            <span className={`font-bold ${pnlColor(wallet.unrealPnlUSD)}`}>
              {(wallet.unrealPnlUSD || 0) >= 0 ? '+' : ''}${(wallet.unrealPnlUSD || 0).toFixed(2)}
              <span className="opacity-60 ml-1">({(wallet.unrealPnlPct || 0) >= 0 ? '+' : ''}{(wallet.unrealPnlPct || 0).toFixed(1)}%)</span>
            </span>
          </div>
          <div className="w-px h-4 bg-[#1e1e2e]" />
          <div className="text-[11px] mono"><span className="text-[#6b7280]">Next </span><span className="font-bold text-indigo-400">{status?.nextCycle || '—'}</span></div>
        </div>
      </header>

      {/* Stack pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: 'Bankr LLM Gateway', color: 'bg-indigo-500' },
          { label: 'Venice E2EE',        color: 'bg-purple-500' },
          { label: 'Checkr × x402',      color: 'bg-orange-500' },
          { label: 'Alchemy Onchain',     color: 'bg-blue-500'   },
          { label: 'Base Mainnet',        color: 'bg-emerald-500' },
        ].map(({ label, color }) => (
          <div key={label} className="bg-[#111118] border border-[#1e1e2e] px-3 py-1 rounded-full flex items-center gap-2">
            <div className={`w-1.5 h-1.5 ${color} rounded-full`} />
            <span className="text-[10px] font-medium text-[#e2e8f0]">{label}</span>
          </div>
        ))}
        <div className="bg-[#0d0a00] border border-orange-500/20 px-3 py-1 rounded-full flex items-center gap-2">
          <span className="text-orange-400 text-xs">⚡</span>
          <span className="text-[10px] text-orange-300">Pays Checkr autonomously via x402 — no API key, no human approval</span>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <PositionsCard positions={positions} loading={loading} yieldPos={yieldPos} />

          {/* Autoresearch */}
          <Card>
            <Label>Self-Improving Brain</Label>
            <p className="text-[10px] text-[#6b7280] mb-1 leading-relaxed">
              Bankr LLM runs 4 parallel loops 24/7 — each proposes a code change to the quant scoring function, backtests it on real Base token data, and auto-promotes winners to the live agent. No human in the loop.
            </p>
            <div className="flex items-center gap-2 mb-3 p-2 bg-green-500/5 border border-green-500/15 rounded-lg">
              <span className="text-green-400 text-xs">→</span>
              <span className="text-[10px] text-green-300">Best onchain candidate promoted to live trading every cycle</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Onchain (Base)', data: ar.onchain  || {}, color: 'text-indigo-400',  dot: 'bg-indigo-500',  live: true },
                { name: 'Hourly (1h)',    data: ar.hourly   || {}, color: 'text-emerald-400', dot: 'bg-emerald-500', live: false },
                { name: '5-minute',       data: ar.fiveMin  || {}, color: 'text-orange-400',  dot: 'bg-orange-500',  live: false },
              ].map(({ name, data, color, dot, live }) => (
                <div key={name} className={`p-2.5 bg-[#0a0a0f] border rounded-xl ${live ? 'border-indigo-500/20' : 'border-[#1e1e2e]'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${dot} ${live ? 'pulse-live' : ''}`} />
                      <span className={`text-[11px] font-bold ${color}`}>{name}</span>
                      {live && <span className="text-[8px] text-green-400 border border-green-500/20 px-1 rounded">→ live</span>}
                    </div>
                    <span className="mono text-[10px] text-[#6b7280]">{((data as any).expCount || 0).toLocaleString()} exp</span>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div><div className="text-[8px] text-[#6b7280]">Val Sharpe</div><div className="mono text-sm font-bold">{((data as any).bestValSharpe || 0).toFixed(2)}</div></div>
                    <div><div className="text-[8px] text-[#6b7280]">Aud Sharpe</div><div className="mono text-sm font-bold">{((data as any).bestAudSharpe || 0).toFixed(2)}</div></div>
                    <div><div className="text-[8px] text-[#6b7280]">Score</div><div className={`mono text-sm font-bold ${color}`}>{((data as any).bestScore || 0).toFixed(2)}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <PipelineCard />
        </div>

        <div className="lg:col-span-3">
          <CycleLog cycles={cycles} positions={positions} />
        </div>
      </div>

      <footer className="mt-6 flex justify-center opacity-20 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-6 grayscale hover:grayscale-0 transition-all">
          <img src="https://img.venice.ai/logo-white.svg" alt="Venice" className="h-4" />
          <div className="text-[10px] font-bold tracking-widest uppercase text-white">Bankr</div>
          <a href="https://basescan.org/address/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-white">
            <ExternalLink size={10} />wallet
          </a>
        </div>
      </footer>
    </main>
  );
}
