"use client";

import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, Zap, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const pnlColor = (n?: number | null) => !n || n === 0 ? 'text-[#6b7280]' : n > 0 ? 'text-green-400' : 'text-red-400';
const pnlSign  = (n: number) => n >= 0 ? '+' : '';

const shortTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtPrice = (p?: number | null) => {
  if (p == null) return '—';
  if (p < 0.000001) return `$${p.toExponential(2)}`;
  if (p < 0.0001)   return `$${p.toFixed(7)}`;
  if (p < 0.01)     return `$${p.toFixed(5)}`;
  if (p < 1)        return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
};

// ── Base components ───────────────────────────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#111118] border border-[#1e1e2e] rounded-2xl relative overflow-hidden ${className}`}>{children}</div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[9px] uppercase tracking-[0.2em] text-[#4b5563] font-bold mb-2">{children}</div>
);

const VolTag = ({ trend }: { trend?: string | null }) => {
  if (!trend || trend === 'unknown') return null;
  return (
    <span className={`flex items-center gap-0.5 text-[9px] font-bold ${trend === 'increasing' ? 'text-green-400' : trend === 'declining' ? 'text-red-400' : 'text-[#6b7280]'}`}>
      {trend === 'increasing' ? <TrendingUp size={8}/> : trend === 'declining' ? <TrendingDown size={8}/> : <Minus size={8}/>}
      {trend}
    </span>
  );
};

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ cycles, arOnchain, brain }: { cycles: any[]; arOnchain: any; brain?: any }) {
  const trades     = cycles.filter(c => c.action === 'buy' || c.action === 'long').length;
  const allTokens  = cycles.flatMap(c => c.trendingEntries || []);
  const screened   = new Set(allTokens.map((t: any) => t.symbol)).size;
  const expCount   = brain?.totalExp || arOnchain.expCount || 0;
  const brainScore = brain?.topScore || arOnchain.bestScore || 0;

  const stats = [
    { label: 'Tokens discovered', value: screened.toString(), sub: 'last 50 cycles', color: 'text-blue-400' },
    { label: 'Trades fired',      value: trades.toString(),   sub: 'autonomous',     color: 'text-green-400' },
    { label: 'Brain experiments', value: expCount >= 1000 ? `${(expCount/1000).toFixed(1)}k` : expCount.toString(), sub: '4 parallel loops', color: 'text-indigo-400' },
    { label: 'Brain score',       value: brainScore.toFixed(1), sub: `vs 0.0 baseline`, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map(s => (
        <Card key={s.label} className="p-3 text-center">
          <div className={`mono text-xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-[9px] text-[#e2e8f0] font-medium mt-0.5">{s.label}</div>
          <div className="text-[8px] text-[#4b5563]">{s.sub}</div>
        </Card>
      ))}
    </div>
  );
}

// ── Positions ─────────────────────────────────────────────────────────────────
function PositionsCard({ positions, loading, yieldPos }: { positions: any[]; loading: boolean; yieldPos?: any }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const open = positions.filter((p: any) => !p.closedAt);

  return (
    <Card className="p-4">
      <SectionLabel>Active Positions ({open.length})</SectionLabel>
      <div className="space-y-1.5">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-10 bg-[#1a1a24] rounded-lg animate-pulse" />)
        ) : open.length === 0 ? (
          <div className="flex items-center justify-center py-4 gap-2">
            <Shield className="text-indigo-500" size={16} />
            <span className="text-xs text-[#6b7280]">No open positions — capital in yield</span>
          </div>
        ) : open.map((p: any) => {
          const hasPnl  = p.currentPrice != null;
          const pnlPct  = hasPnl ? (p.pnlPct ?? 0) : null;
          const pnlUSD  = hasPnl ? (p.pnlUSD ?? 0) : null;
          const curUSD  = p.currentUSD ?? p.sizeUSD ?? 0;
          const trailOn = (p.peakPct ?? 0) >= 1 || p.trailActivated;
          const isExp   = expanded === p.sym;

          return (
            <div key={p.sym} className={`rounded-xl border transition-all ${isExp ? 'border-indigo-500/20 bg-[#0d0d1a]' : 'border-[#1e1e2e] hover:border-[#2e2e3e]'}`}>
              <button onClick={() => setExpanded(isExp ? null : p.sym)} className="w-full text-left flex items-center gap-2.5 p-2.5">
                <div className="w-6 h-6 rounded bg-[#0a0a0f] border border-[#1e1e2e] flex items-center justify-center mono text-[10px] font-bold text-indigo-400 shrink-0">
                  {(p.sym || '?')[0]}
                </div>
                <span className="font-bold text-xs flex-shrink-0">{p.sym}</span>
                {pnlPct != null ? (
                  <span className={`mono text-[10px] font-bold ${pnlColor(pnlPct)}`}>{pnlSign(pnlPct)}{pnlPct.toFixed(1)}%</span>
                ) : <span className="mono text-[10px] text-[#6b7280]">—</span>}
                {p.peakPct > 2 && <span className="mono text-[9px] text-[#4b5563]">peak+{p.peakPct.toFixed(0)}%</span>}
                <div className="flex-1" />
                <span className="mono text-xs font-bold">${curUSD.toFixed(2)}</span>
                {pnlUSD != null && <span className={`mono text-[10px] ${pnlColor(pnlUSD)}`}>{pnlSign(pnlUSD)}${Math.abs(pnlUSD).toFixed(2)}</span>}
                <VolTag trend={p.volumeTrend} />
                {p.recommendation && p.recommendation !== 'hold' && (
                  <span className={`text-[8px] font-bold px-1 rounded border ${p.recommendation === 'exit' ? 'text-red-400 border-red-500/30' : 'text-yellow-400 border-yellow-500/30'}`}>
                    {p.recommendation.toUpperCase()}
                  </span>
                )}
                <ChevronDown size={10} className={`text-[#6b7280] transition-transform ${isExp ? 'rotate-180' : ''}`} />
              </button>

              {isExp && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {p.quantScore != null && p.quantScore !== 0 && (
                      <div className="p-2 bg-[#111118] border border-[#1e1e2e] rounded-lg text-center">
                        <div className="text-[8px] text-[#6b7280]">Quant</div>
                        <div className={`mono text-xs font-bold ${p.quantScore > 0 ? 'text-green-400' : 'text-red-400'}`}>{p.quantScore > 0 ? '+' : ''}{p.quantScore.toFixed(3)}</div>
                      </div>
                    )}
                    {p.ret1h != null && (
                      <div className="p-2 bg-[#111118] border border-[#1e1e2e] rounded-lg text-center">
                        <div className="text-[8px] text-[#6b7280]">1h ret</div>
                        <div className={`mono text-xs font-bold ${pnlColor(p.ret1h)}`}>{pnlSign(p.ret1h)}{p.ret1h.toFixed(2)}%</div>
                      </div>
                    )}
                    <div className="p-2 bg-[#111118] border border-[#1e1e2e] rounded-lg text-center">
                      <div className="text-[8px] text-[#6b7280]">Stop</div>
                      <div className="mono text-[10px] font-bold text-[#e2e8f0]">{trailOn ? `Trail✓` : `SL`}</div>
                    </div>
                  </div>
                  {p.transferStats && (
                    <div className="p-2 bg-[#0d0d1a] border border-blue-500/10 rounded-lg">
                      <div className="text-[8px] font-bold text-blue-400 mb-1">Alchemy Onchain</div>
                      <div className="flex gap-3 text-[9px] mono">
                        {p.transferStats.uniqueBuyers != null && <span className="text-[#6b7280]">buyers: <span className="text-white">{p.transferStats.uniqueBuyers}</span></span>}
                        {p.transferStats.repeatBuyers != null && <span className="text-[#6b7280]">repeat: <span className={p.transferStats.repeatBuyers > 3 ? 'text-green-400' : 'text-white'}>{p.transferStats.repeatBuyers}</span></span>}
                        {p.transferStats.topBuyerConcentration != null && <span className="text-[#6b7280]">whale: <span className={p.transferStats.topBuyerConcentration > 0.4 ? 'text-red-400' : 'text-green-400'}>{(p.transferStats.topBuyerConcentration*100).toFixed(0)}%</span></span>}
                      </div>
                    </div>
                  )}
                  <div className="text-[9px] text-[#6b7280] mono flex justify-between">
                    <span>entry {fmtPrice(p.entryPrice)}</span>
                    {p.currentPrice && <span>now {fmtPrice(p.currentPrice)}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {yieldPos && (
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400">{yieldPos.protocol} Yield +{yieldPos.apy}% APY</span>
              <span className="mono text-xs font-bold">${yieldPos.amountUSD?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Brain card ────────────────────────────────────────────────────────────────
const LOOP_COLORS: Record<string, string> = {
  '5m':      'text-orange-400',
  'Onchain': 'text-indigo-400',
  'Hourly':  'text-emerald-400',
  'Daily':   'text-blue-400',
};
const LOOP_BG: Record<string, string> = {
  '5m':      'bg-orange-500',
  'Onchain': 'bg-indigo-500',
  'Hourly':  'bg-emerald-500',
  'Daily':   'bg-blue-500',
};

function BrainCard({ ar, brain }: { ar: any; brain: any }) {
  const [showTimeline, setShowTimeline] = useState(false);

  const totalExp = brain?.totalExp || Object.values(ar).reduce((s: number, l: any) => s + (l?.expCount || 0), 0);
  const topScore = brain?.topScore || Math.max(...Object.values(ar).map((l: any) => l?.bestScore || 0));
  const topLoop  = brain?.topLoop || '5m';
  const pct      = Math.min(100, (topScore / 30) * 100);

  const loops = brain?.loops || [];
  const breakthroughs: any[] = brain?.breakthroughs || [];
  // Key milestones: first, big jumps, last 3
  const withDesc  = breakthroughs.filter((b: any) => b.description);
  const keySteps  = breakthroughs.filter((b: any, i: number) => {
    if (i === 0 || i === breakthroughs.length - 1) return true;
    const prev = breakthroughs[i-1];
    return (b.score - prev.score) > 1.5; // big jump
  }).slice(-6);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Self-Improving Brain</SectionLabel>
        {breakthroughs.length > 0 && (
          <button onClick={() => setShowTimeline(v => !v)} className="text-[8px] text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded hover:bg-indigo-500/10">
            {showTimeline ? 'hide' : 'evolution ↗'}
          </button>
        )}
      </div>

      {/* Score + progress */}
      <div className="mb-3">
        <div className="flex items-end gap-2 mb-1">
          <span className="mono text-2xl font-bold text-indigo-400">{topScore.toFixed(1)}</span>
          <span className={`text-[10px] font-bold mb-0.5 ${LOOP_COLORS[topLoop] || 'text-indigo-400'}`}>{topLoop} best</span>
          <span className="text-[10px] text-[#6b7280] mb-0.5">· started at 0</span>
        </div>
        <div className="w-full h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-[#4b5563]">0</span>
          <span className="text-[8px] text-[#4b5563]">{Number(totalExp).toLocaleString()} experiments total</span>
          <span className="text-[8px] text-[#4b5563]">30 target</span>
        </div>
      </div>

      {/* Evolution timeline */}
      {showTimeline && keySteps.length > 0 && (
        <div className="mb-3 space-y-0">
          {keySteps.map((bt: any, i: number) => (
            <div key={i} className="relative flex gap-2.5">
              {i < keySteps.length-1 && <div className="absolute left-[8px] top-5 bottom-0 w-px bg-[#1e1e2e]" />}
              <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${LOOP_BG[bt.loop] || 'bg-indigo-500'}`}>
                <span className="text-[7px] font-bold text-white">{i+1}</span>
              </div>
              <div className="pb-2.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`mono text-[10px] font-bold ${LOOP_COLORS[bt.loop] || 'text-indigo-400'}`}>{bt.score.toFixed(1)}</span>
                  <span className="text-[8px] text-[#4b5563]">{bt.loop} exp{bt.n}</span>
                </div>
                {bt.description && (
                  <p className="text-[9px] text-[#9ca3af] italic leading-snug mt-0.5">{bt.description.slice(0, 80)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loop rows */}
      <div className="space-y-1">
        {loops.length > 0 ? loops.map((l: any) => (
          <div key={l.name} className={`px-2.5 py-2 rounded-lg border ${l.name === 'Onchain' ? 'border-indigo-500/15 bg-indigo-500/3' : 'border-[#1e1e2e]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${LOOP_BG[l.name] || 'bg-indigo-500'} shrink-0`} />
              <span className={`text-[10px] font-bold ${LOOP_COLORS[l.name] || 'text-indigo-400'} flex-1`}>{l.name}</span>
              {l.name === 'Onchain' && <span className="text-[8px] text-green-400 border border-green-500/20 px-1 rounded">→ live</span>}
              <span className="mono text-[9px] text-[#6b7280]">{l.expCount.toLocaleString()} exp</span>
              <span className={`mono text-xs font-bold ${LOOP_COLORS[l.name] || 'text-indigo-400'}`}>{l.bestScore.toFixed(1)}</span>
            </div>
            {l.signals?.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-3.5">
                {l.signals.slice(0,4).map((s: string) => (
                  <span key={s} className="text-[7px] text-[#6b7280] bg-[#1e1e2e] px-1 py-0.5 rounded">{s}</span>
                ))}
              </div>
            )}
          </div>
        )) : (
          // Fallback to ar data
          [
            { name: 'Onchain', data: ar.onchain||{}, live: true },
            { name: 'Hourly',  data: ar.hourly||{},  live: false },
            { name: '5m',      data: ar.fiveMin||{}, live: false },
          ].map(({ name, data, live }) => (
            <div key={name} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${live ? 'border-indigo-500/15 bg-indigo-500/3' : 'border-[#1e1e2e]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${LOOP_BG[name]||'bg-indigo-500'} shrink-0`} />
              <span className={`text-[10px] font-bold ${LOOP_COLORS[name]||'text-indigo-400'} flex-1`}>{name}</span>
              {live && <span className="text-[8px] text-green-400 border border-green-500/20 px-1 rounded">→ live</span>}
              <span className="mono text-[9px] text-[#6b7280]">{((data as any).expCount||0).toLocaleString()} exp</span>
              <span className={`mono text-xs font-bold ${LOOP_COLORS[name]||'text-indigo-400'}`}>{((data as any).bestScore||0).toFixed(1)}</span>
            </div>
          ))
        )}
      </div>
      <p className="text-[9px] text-[#4b5563] mt-2 leading-relaxed">
        Best onchain scoring function auto-promoted to live agent every cycle. Brain rewrites itself. Humans not involved.
      </p>
    </Card>
  );
}

// ── Pipeline (collapsible) ────────────────────────────────────────────────────
function PipelineCard() {
  const [open, setOpen] = useState(false);
  const rows = [
    { icon: '🏦', label: 'Bankr LLM',        detail: 'Market regime · Base trending tokens (meme/micro-cap only)', color: 'text-indigo-400'  },
    { icon: '⚡', label: 'Checkr × x402',    detail: '4-window CT attention · spikes · rotation arrows',          color: 'text-orange-400', parallel: true },
    { icon: '🔗', label: 'Alchemy onchain',  detail: 'Scans 1000 raw Base ERC20 transfers · finds unusual buy pressure before CT notices', color: 'text-blue-400', parallel: true },
    { icon: '🧠', label: 'Quant Brain',      detail: `Self-evolved scoring — 10,000+ experiments, rewrites itself`, color: 'text-purple-400'  },
    { icon: '🛡️', label: 'Rug filter',       detail: 'Liquidity · FDV · age · buy ratio · whale concentration',   color: 'text-yellow-400'  },
    { icon: '🔒', label: 'Venice E2EE',      detail: 'Private reasoning — encrypted inference, no logs retained',  color: 'text-violet-400'  },
    { icon: '✅', label: 'Bankr Execute',    detail: 'Onchain swap + ATR trailing stop (auto-evolved, activates +0.5%)', color: 'text-green-400'   },
  ];
  return (
    <Card className="p-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between">
        <SectionLabel>How It Works</SectionLabel>
        <ChevronRight size={12} className={`text-[#6b7280] transition-transform mb-2 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="space-y-1 mt-1">
          {rows.map((r, i) => (
            <div key={i}>
              {r.parallel && i > 0 && !rows[i-1].parallel && (
                <div className="flex items-center gap-2 my-0.5 ml-3">
                  <div className="w-px h-2 bg-[#2e2e3e]" />
                  <span className="text-[7px] text-[#4b5563] tracking-widest uppercase">parallel</span>
                  <div className="flex-1 h-px bg-[#1e1e2e]" />
                </div>
              )}
              <div className={`flex items-center gap-2.5 p-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e]`}>
                <span className="text-sm shrink-0">{r.icon}</span>
                <div>
                  <span className={`text-[10px] font-bold ${r.color}`}>{r.label}</span>
                  <span className="text-[9px] text-[#6b7280] ml-2 mono">{r.detail}</span>
                </div>
              </div>
              {r.parallel && !rows[i+1]?.parallel && (
                <div className="ml-3 mt-0.5"><div className="w-px h-2 bg-[#2e2e3e]" /></div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Token signal row ──────────────────────────────────────────────────────────
function TokenSignalRow({ t }: { t: any }) {
  const hasCheckr  = (t.attentionDelta > 0 || t.velocity > 0) && t.velocity != null;
  const hasRotation = t.rotatingFrom?.length > 0;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-[#1e1e2e] last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="mono text-[11px] font-bold">{t.symbol}</span>
          {t.rank != null && <span className="text-[8px] text-[#6b7280]">#{t.rank}</span>}
          {t.source === 'checkr' && <span className="text-[8px] text-orange-400 border border-orange-500/20 px-1 rounded">checkr</span>}
          {t.source === 'alchemy_discover' && <span className="text-[8px] text-blue-400 border border-blue-500/20 px-1 rounded">alchemy</span>}
          {t.source !== 'checkr' && t.source !== 'alchemy_discover' && t.rank != null && <span className="text-[8px] text-indigo-400 border border-indigo-500/20 px-1 rounded">bankr</span>}
          {t.sustainedMomentum && <span className="text-[8px] text-orange-400">🔥{t.momentumWindows}w</span>}
          {hasRotation && <span className="text-[8px] text-purple-400">↩{t.rotatingFrom.slice(0,2).join(',')}</span>}
          {t.rugVerdict && t.rugVerdict !== 'SAFE' && <span className="text-[8px] text-red-400 border border-red-500/20 px-1 rounded">rug</span>}
        </div>
        <div className="flex gap-2 mt-0.5 flex-wrap">
          {t.ret1h != null && (
            <span className={`mono text-[8px] ${t.ret1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {t.ret1h >= 0 ? '+' : ''}{(t.ret1h*100).toFixed(1)}% 1h
            </span>
          )}
          {hasCheckr && (
            <span className="text-[8px] text-orange-300 mono">
              ⚡{t.velocity?.toFixed(1)} att{t.attentionDelta?.toFixed(1)}
            </span>
          )}
          {t.multiTFBreakdown && (
            <span className="text-[8px] text-blue-300 mono">MTF:{t.multiTFBreakdown.replace(/ \| /g,' ')}</span>
          )}
          {!t.multiTFBreakdown && t.att_1h != null && t.att_1h !== 0 && (
            <span className="mono text-[8px] text-[#4b5563]">
              {t.att_1h?.toFixed(1)}/{t.att_4h?.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`mono text-xs font-bold ${(t.score||0) >= 0.8 ? 'text-green-400' : (t.score||0) >= 0.5 ? 'text-indigo-400' : 'text-[#6b7280]'}`}>
          {(t.score||0).toFixed(2)}
        </div>
        {t.quantScore != null && (
          <div className="mono text-[8px] text-[#4b5563]">q={t.quantScore.toFixed(2)}</div>
        )}
      </div>
    </div>
  );
}

// ── Cycle Timeline ─────────────────────────────────────────────────────────────
function CycleTimeline({ cycle, positions }: { cycle: any; positions: any[] }) {
  const entries  = cycle.trendingEntries || [];
  const flagged  = entries.filter((t: any) => (t.score||0) >= 0.65);
  const openPos  = positions.filter((p: any) => !p.closedAt);
  const isTrade  = cycle.action === 'buy' || cycle.action === 'long';

  const steps = [
    // Venice FIRST — it's the hero
    {
      id: 'venice', icon: '🔒', label: 'Venice Private Reasoning', highlight: true,
      content: (
        <div className="p-3 bg-[#0a0a0f] border border-indigo-500/15 rounded-xl">
          <p className="text-[10px] text-[#c4b5fd] italic leading-relaxed">
            {cycle.reasoning || cycle.reason || 'No reasoning logged this cycle.'}
          </p>
          {cycle.confidence > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${cycle.confidence}%` }} />
              </div>
              <span className="mono text-[9px] text-indigo-400">{cycle.confidence}% confidence</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'decision', icon: isTrade ? '✅' : '⏸', label: 'Decision', trade: isTrade,
      content: (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isTrade ? 'bg-green-500/5 border-green-500/20' : 'bg-[#0a0a0f] border-[#1e1e2e]'}`}>
          <span className={`mono text-xs font-bold ${isTrade ? 'text-green-400' : 'text-[#6b7280]'}`}>
            {(cycle.action||'HOLD').toUpperCase().replace('_',' ')}
            {cycle.asset && cycle.asset !== 'USDC' ? ` ${cycle.asset}` : ''}
          </span>
          {cycle.screenLayer && (
            <span className={`text-[8px] px-1 rounded border ${cycle.screenLayer === 'anthropic-fallback' ? 'text-yellow-400 border-yellow-500/20' : 'text-indigo-400 border-indigo-500/20'}`}>
              {cycle.screenLayer === 'anthropic-fallback' ? 'haiku' : 'bankr'}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'scoring', icon: '📐', label: `Signal Scoring${flagged.length ? ` — ${flagged.length} cleared` : ''}`,
      content: (
        <div>
          {flagged.length === 0 ? (
            <p className="text-[9px] text-[#6b7280] mono">{entries.length} screened — none cleared 0.65 threshold</p>
          ) : (
            <div>{flagged.map((t: any) => <TokenSignalRow key={t.symbol} t={t} />)}</div>
          )}
        </div>
      ),
    },
    {
      id: 'discovery', icon: '📡', label: `All tokens screened this cycle (${entries.length})`,
      content: (
        <div>
          {entries.length === 0 ? (
            <p className="text-[9px] text-[#6b7280] mono">No tokens discovered this cycle</p>
          ) : (
            <div>
              <p className="text-[8px] text-[#4b5563] mb-1">3 parallel sources: <span className="text-orange-400">Checkr</span> CT attention · <span className="text-indigo-400">Bankr</span> Base DEX trending · <span className="text-blue-400">Alchemy</span> raw ERC20 transfer scan. Venice picks one.</p>
              {entries.slice(0, 6).map((t: any) => <TokenSignalRow key={t.symbol} t={t} />)}
              {entries.length > 6 && <p className="text-[8px] text-[#4b5563] mt-1">+{entries.length-6} more</p>}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'positions', icon: '📊', label: 'Portfolio',
      content: (
        <div className="text-[9px] mono text-[#6b7280]">
          {cycle.positionUpdates?.length > 0 ? (() => {
            const hold    = cycle.positionUpdates.filter((p:any) => !p.recommendation || p.recommendation==='hold');
            const tighten = cycle.positionUpdates.filter((p:any) => p.recommendation==='tighten');
            const exit    = cycle.positionUpdates.filter((p:any) => p.recommendation==='exit');
            const parts: string[] = [];
            if (hold.length)    parts.push(hold.map((p:any) => `${p.sym}${p.pnlPct!=null?` ${p.pnlPct>=0?'+':''}${p.pnlPct.toFixed(1)}%`:''}`).join(', '));
            if (tighten.length) parts.push(`⚡tighten: ${tighten.map((p:any)=>p.sym).join(', ')}`);
            if (exit.length)    parts.push(`⚠️exit: ${exit.map((p:any)=>p.sym).join(', ')}`);
            return <span>{parts.join(' · ')}</span>;
          })() : <span>{openPos.length > 0 ? `${openPos.length} positions holding` : 'No open positions'}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="mt-3 space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="relative flex gap-3">
          {i < steps.length-1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#1e1e2e]" />}
          <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 border ${(step as any).trade ? 'bg-green-500/20 border-green-500/40' : (step as any).highlight ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-[#1e1e2e] border-[#2e2e3e]'}`}>
            {step.icon}
          </div>
          <div className="pb-4 min-w-0 flex-1">
            <div className={`text-[10px] font-bold mb-1 ${(step as any).trade ? 'text-green-400' : (step as any).highlight ? 'text-indigo-300' : 'text-[#9ca3af]'}`}>
              {step.label}
            </div>
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
  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 pb-2 border-b border-[#1e1e2e] flex items-center justify-between">
        <SectionLabel>Intelligence Cycles</SectionLabel>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-live" />
          <span className="text-[9px] text-[#6b7280]">every 30 min</span>
        </div>
      </div>
      {!cycles.length ? (
        <div className="p-8 text-center text-xs text-[#6b7280] italic">Starting up...</div>
      ) : (
        <div className="overflow-y-auto scrollbar-hide flex-1 p-2">
          {cycles.map((c: any, i: number) => {
            const isOpen  = expanded === i;
            const isTrade = c.action === 'buy' || c.action === 'long';
            const entries = c.trendingEntries || [];

            return (
              <div key={i} className={`rounded-xl border mb-1 transition-all ${isOpen ? 'border-indigo-500/25 bg-[#0d0d1a]' : isTrade ? 'border-green-500/15' : 'border-transparent hover:border-[#1e1e2e]'}`}>
                <button onClick={() => setExpanded(isOpen ? null : i)} className="w-full text-left flex items-center gap-2 px-3 py-2.5">
                  {/* Time */}
                  <span className="mono text-[9px] text-[#4b5563] w-[80px] shrink-0 leading-tight">
                    {c.ts ? shortTime(c.ts) : '—'}
                  </span>

                  {/* Action */}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    isTrade ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    'bg-[#1e1e2e] text-[#6b7280] border-[#2e2e3e]'
                  }`}>
                    {isTrade ? `BUY ${c.asset || ''}` : 'HOLD'}
                  </span>

                  {/* Token count */}
                  {!isTrade && entries.length > 0 && (
                    <span className="text-[8px] text-[#4b5563] shrink-0">{entries.length}t</span>
                  )}

                  {/* Reasoning preview */}
                  <span className="text-[9px] text-[#6b7280] truncate flex-1 min-w-0 italic">
                    {c.reasoning ? `"${c.reasoning.slice(0, 65)}…"` : '—'}
                  </span>

                  {/* Screen layer */}
                  {c.screenLayer === 'anthropic-fallback' && (
                    <span className="text-[7px] text-yellow-500/60 shrink-0 border border-yellow-500/15 px-1 rounded">haiku</span>
                  )}

                  {/* Trade dot */}
                  {isTrade && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}

                  <ChevronDown size={10} className={`text-[#4b5563] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
      )}
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [status, setStatus] = useState<any>(null);
  const [brain,  setBrain]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const r = await fetch('/api/status'); setStatus(await r.json()); }
      catch {}
      finally { setLoading(false); }
    };
    const loadBrain = async () => {
      try { const r = await fetch('/api/brain'); setBrain(await r.json()); }
      catch {}
    };
    load(); loadBrain();
    const iv = setInterval(() => { load(); loadBrain(); }, 30000);
    return () => clearInterval(iv);
  }, []);

  const wallet    = status?.wallet    || {};
  const positions = status?.positions || [];
  const cycles    = status?.cycleHistory || [];
  const ar        = status?.autoresearch || {};
  const yieldPos  = status?.yield;

  return (
    <main className="min-h-screen p-3 md:p-5 max-w-[1400px] mx-auto relative z-10">

      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-4 mb-4 bg-[#111118] border border-[#1e1e2e] rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="text-white fill-white" size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">delu</span>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-live" />
              <span className="text-[10px] text-[#6b7280] uppercase tracking-widest hidden sm:block">autonomous trading agent</span>
            </div>
            <div className="text-[9px] text-[#4b5563] mono">Base mainnet · 0xed2ceca9…</div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-center">
            <div className="mono text-base font-bold">${(wallet.totalUSD || 0).toFixed(2)}</div>
            <div className="text-[8px] text-[#6b7280]">portfolio</div>
          </div>
          <div className="text-center">
            <div className="mono text-base font-bold text-emerald-400">${(wallet.liquidUSDC || 0).toFixed(2)}</div>
            <div className="text-[8px] text-[#6b7280]">liquid USDC</div>
          </div>
          <div className="text-center">
            <div className={`mono text-base font-bold ${pnlColor(wallet.unrealPnlUSD)}`}>
              {(wallet.unrealPnlUSD || 0) >= 0 ? '+' : ''}${(wallet.unrealPnlUSD || 0).toFixed(2)}
            </div>
            <div className="text-[8px] text-[#6b7280]">unrealised P&L</div>
          </div>
          <div className="text-center">
            <div className="mono text-sm font-bold text-indigo-400">{status?.nextCycle || '—'}</div>
            <div className="text-[8px] text-[#6b7280]">next cycle</div>
          </div>
        </div>

        {/* Stack pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          {[
            { label: 'Bankr', color: 'bg-indigo-500' },
            { label: 'Venice', color: 'bg-purple-500' },
            { label: 'Checkr x402', color: 'bg-orange-500' },
            { label: 'Alchemy', color: 'bg-blue-500' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1 bg-[#0a0a0f] border border-[#1e1e2e] px-2 py-1 rounded-full">
              <div className={`w-1.5 h-1.5 ${color} rounded-full`} />
              <span className="text-[9px] text-[#9ca3af]">{label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ── Stats bar ── */}
      <StatsBar cycles={cycles} arOnchain={ar.onchain || {}} brain={brain} />

      {/* ── System health bar ── */}
      <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
        <span className="text-[8px] text-[#4b5563] uppercase tracking-widest">Live systems</span>
        {[
          { label: 'Agent',          color: 'bg-green-500' },
          { label: 'Checkr x402',    color: 'bg-orange-500' },
          { label: 'Alchemy',        color: 'bg-blue-500' },
          { label: 'Venice E2EE',    color: 'bg-violet-500' },
          { label: 'Bankr Execute',  color: 'bg-indigo-500' },
          { label: 'Brain 5m',       color: 'bg-orange-400' },
          { label: 'Brain Onchain',  color: 'bg-indigo-400' },
          { label: 'Brain Hourly',   color: 'bg-emerald-400' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${s.color} pulse-live`} />
            <span className="text-[8px] text-[#6b7280]">{s.label}</span>
          </div>
        ))}
        {status?.generatedAt && (
          <span className="ml-auto text-[8px] text-[#4b5563] mono">
            updated {new Date(status.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* ── 2-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <PositionsCard positions={positions} loading={loading} yieldPos={yieldPos} />
          <BrainCard ar={ar} brain={brain} />
          <PipelineCard />
        </div>

        {/* RIGHT — Cycle Log */}
        <div className="lg:col-span-3 min-h-[600px]">
          <CycleLog cycles={cycles} positions={positions} />
        </div>
      </div>

      <footer className="mt-4 flex justify-center gap-6 opacity-20 hover:opacity-60 transition-opacity">
        <a href="https://basescan.org/address/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] text-[#6b7280]">
          <ExternalLink size={9} />Basescan
        </a>
        <a href="https://github.com/deluagent/delu-agent" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] text-[#6b7280]">
          <ExternalLink size={9} />GitHub
        </a>
        <span className="text-[9px] text-[#6b7280]">The Synthesis 2026</span>
      </footer>
    </main>
  );
}
