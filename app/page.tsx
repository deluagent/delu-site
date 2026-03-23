"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight,
  Brain, Eye, Zap, RefreshCw, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';

// ─── types ────────────────────────────────────────────────────────────────────
interface Trade {
  sym: string; pnlPct: number; won: boolean; regime: string;
  openedAt?: string; closedAt?: string; entryTx?: string; exitTx?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const mono  = (...c: string[]) => ['font-mono', ...c].join(' ');
const dim   = 'text-[#6b7280]';
const label = 'text-[8px] uppercase tracking-[.18em] text-[#4b5563] font-semibold';
const card  = 'bg-[#0f0f17] border border-[#1c1c28] rounded-lg';

const pnlColor = (n?: number | null) =>
  !n || n === 0 ? 'text-[#6b7280]' : n > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]';

const fmtDate = (ts?: string) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const wallet = '0xed2ceca9de162c4f2337d7c1ab44ee9c427709da';
const walletShort = `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;

// ─── learnings map (real post-trade insights from our autoresearch) ────────────
// key = SYM or SYM_win / SYM_loss for trades that appear multiple times
const LEARNINGS: Record<string, string> = {
  'BLUEAGENT_win':  'Real winner: onchain trend + social spike both sustained. Bought ~$20, sold ~$44. +121% in 90 min. Strongest signal combination confirmed.',
  'BLUEAGENT_loss': 'Mass ATR stop at 14:37 UTC — price data delay caused -21% reading instead of catching at -3%. All positions stopped simultaneously.',
  KTA:       'RANGE_TIGHT regime + marginal signal = weak entry. ATR hard SL -3% fired at noise level. Regime filter now stricter.',
  BNKR:      'ATR hard SL -3% fired at noise level for micro-cap. Widened to 3×ATR (min -8%) after this trade.',
  MOLT:      'Stale OHLCV data caused ATR stop to fire too early. Price freshness check added to pipeline.',
  CLAWNCH:   'Social signal decayed mid-hold. Checkr multi-window (1h/4h/8h/12h) now required to sustain before entry.',
  MOLTEN:    'Volume burst confirmed by onchain flow but social lagging. Multi-TF cross-validation added.',
};

// ─── Section: Hero ────────────────────────────────────────────────────────────
function Hero({ status }: { status: any }) {
  const w = status?.wallet || {};
  const pnl = w.unrealPnlUSD ?? 0;
  const hasOpenPos = (w.positionsUSD ?? 0) > 0;
  const perf = status?.performance ?? {};
  const trades = perf.recentTrades ?? [];
  const realisedPnl = trades.reduce((s: number, t: any) => s + (t.pnlUSD ?? 0), 0);
  const winStr = perf.winRate ?? '0/0';
  const wins = parseInt(winStr.split('/')[0]) || 0;
  const closed = perf.closedTrades ?? 0;
  const integrations = [
    { name: 'Bankr',       live: true },
    { name: 'Venice AI',   live: true },
    { name: 'Checkr x402', live: true },
    { name: 'Alchemy',     live: true },
  ];

  return (
    <section className="mb-10">
      {/* Identity */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-[2rem] font-bold tracking-tight text-white">delu</h1>
            <span className={`${mono()} text-[10px] text-[#6b7280] border border-[#1c1c28] px-2 py-0.5 rounded`}>
              Base mainnet
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className={mono('text-[11px]', dim)}>{walletShort}</span>
            <a href={`https://basescan.org/address/${wallet}`} target="_blank" rel="noopener noreferrer"
               className="text-[#4b5563] hover:text-white transition-colors">
              <ExternalLink size={10} />
            </a>
          </div>
          <p className="text-[13px] text-[#9ca3af] leading-relaxed max-w-lg">
            Autonomous onchain trading agent — learns from every trade, earns yield when idle,
            pays for its own data with x402 micropayments.
          </p>
        </div>
        {/* Live integrations */}
        <div className="flex flex-wrap gap-1.5">
          {integrations.map(i => (
            <span key={i.name}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border font-medium
                ${i.live
                  ? 'border-[#22c55e]/20 text-[#22c55e] bg-[#22c55e]/5'
                  : 'border-[#f59e0b]/20 text-[#f59e0b] bg-[#f59e0b]/5'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${i.live ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`} />
              {i.name}
            </span>
          ))}
        </div>
      </div>

      {/* Last updated */}
      {status?.updatedAt && (
        <div className={`flex items-center gap-1.5 text-[9px] ${dim} mb-3`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          Live · updated {fmtDate(status.updatedAt)} · auto-refreshes every 60s
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#1c1c28] border border-[#1c1c28] rounded-lg overflow-hidden">
        {[
          { l: 'Portfolio',      v: `$${(w.totalUSD    ?? 0).toFixed(2)}`, s: 'total wallet value' },
          { l: 'Liquid USDC',    v: `$${(w.liquidUSDC  ?? 0).toFixed(2)}`, s: 'ready to trade' },
          hasOpenPos
            ? { l: 'Unrealised P&L', v: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, s: `${(w.unrealPnlPct ?? 0).toFixed(2)}%`, accent: pnlColor(pnl) }
            : { l: 'Realised P&L',   v: `${realisedPnl >= 0 ? '+' : ''}$${realisedPnl.toFixed(2)}`, s: `${wins}/${closed} trades won`, accent: pnlColor(realisedPnl) },
          { l: 'Next Cycle',     v: status?.nextCycle ?? '—', s: 'runs every 30 min' },
        ].map(s => (
          <div key={s.l} className="bg-[#0a0a0f] px-4 py-3">
            <div className={`${label} mb-1`}>{s.l}</div>
            <div className={mono('text-base font-bold', s.accent ?? 'text-white')}>{s.v}</div>
            <div className={`text-[10px] ${dim} mt-0.5`}>{s.s}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section: How It Works ────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01', icon: <Eye size={14}/>, title: 'Observe',
      color: 'text-[#60a5fa]', border: 'border-[#60a5fa]/15', bg: 'bg-[#60a5fa]/3',
      body: 'Pulls 30d price bars, transfer stats, whale concentration, and smart wallet accumulation via Alchemy. Buys social attention scores from Checkr using x402 micropayments — 1h, 4h, 8h, 12h windows.',
    },
    {
      n: '02', icon: <Brain size={14}/>, title: 'Think',
      color: 'text-[#a855f7]', border: 'border-[#a855f7]/15', bg: 'bg-[#a855f7]/3',
      body: 'Quant brain scores each token across four evolved strategies (5m, hourly, onchain, daily). Each uses its own learned parameters — RSI zones, volume burst thresholds, BTC correlation, momentum regime.',
    },
    {
      n: '03', icon: <Zap size={14}/>, title: 'Decide',
      color: 'text-[#f59e0b]', border: 'border-[#f59e0b]/15', bg: 'bg-[#f59e0b]/3',
      body: 'Venice AI (private inference) synthesises signals into a confidence score. ≥65% → Kelly-sized buy via Bankr. <65% → hold and route surplus USDC to best yield vault (Aave v3, Morpho, Moonwell).',
    },
    {
      n: '04', icon: <RefreshCw size={14}/>, title: 'Learn',
      color: 'text-[#22c55e]', border: 'border-[#22c55e]/15', bg: 'bg-[#22c55e]/3',
      body: 'After every trade, 4 parallel LLM loops run experiments — mutating strategy parameters, evaluating against real outcomes on 27 Base tokens. 11,000+ experiments completed. Parameters auto-promote when score improves.',
    },
  ];

  return (
    <section className="mb-10">
      <div className={`${label} mb-4`}>How It Works</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map(s => (
          <div key={s.n} className={`rounded-lg border p-4 ${s.border} ${s.bg}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={s.color}>{s.icon}</span>
              <span className={`text-xs font-semibold ${s.color}`}>{s.title}</span>
              <span className={`${mono()} text-[9px] ${dim} ml-auto`}>{s.n}</span>
            </div>
            <p className="text-[11px] text-[#9ca3af] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section: Brain ───────────────────────────────────────────────────────────
const LOOP_COLORS: Record<string, { text: string; bar: string; badge: string }> = {
  orange:  { text: 'text-[#f97316]', bar: '#f97316', badge: 'border-[#f97316]/20 bg-[#f97316]/5 text-[#f97316]' },
  indigo:  { text: 'text-[#818cf8]', bar: '#818cf8', badge: 'border-[#818cf8]/20 bg-[#818cf8]/5 text-[#818cf8]' },
  emerald: { text: 'text-[#34d399]', bar: '#34d399', badge: 'border-[#34d399]/20 bg-[#34d399]/5 text-[#34d399]' },
  blue:    { text: 'text-[#60a5fa]', bar: '#60a5fa', badge: 'border-[#60a5fa]/20 bg-[#60a5fa]/5 text-[#60a5fa]' },
  purple:  { text: 'text-[#a855f7]', bar: '#a855f7', badge: 'border-[#a855f7]/20 bg-[#a855f7]/5 text-[#a855f7]' },
  rose:    { text: 'text-[#fb7185]', bar: '#fb7185', badge: 'border-[#fb7185]/20 bg-[#fb7185]/5 text-[#fb7185]' },
};

function BrainSection({ brain }: { brain: any }) {
  const loops     = brain?.loops ?? [];
  const topScore  = brain?.topScore ?? 0;
  const totalExp  = brain?.totalExp ?? 0;
  const TARGET    = 35;
  const progress  = Math.min(100, (topScore / TARGET) * 100);

  // Recharts data for bar chart
  const barData = loops.map((l: any) => ({
    name: l.name,
    score: +(l.bestScore ?? 0).toFixed(1),
    color: LOOP_COLORS[l.color]?.bar ?? '#818cf8',
  }));

  return (
    <section className="mb-10">
      <div className={`${label} mb-4`}>Self-Improving Brain</div>

      {/* Top card — score + chart */}
      <div className={`${card} p-5 mb-3`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Score + progress */}
          <div className="flex-1">
            <div className="flex items-end gap-2 mb-1">
              <span className={mono('text-[2.5rem] font-bold text-[#a855f7] leading-none')}>
                {topScore.toFixed(1)}
              </span>
              <span className={`text-sm ${dim} mb-1`}>/ {TARGET}</span>
            </div>
            <div className="text-[11px] text-[#9ca3af] mb-3 max-w-xs">
              Brain score = combined Sharpe across all evolved strategies. Higher means more refined signal extraction.
            </div>
            {/* Progress bar */}
            <div className="mb-1">
              <div className="h-1 bg-[#1c1c28] rounded-full overflow-hidden">
                <div className="h-full bg-[#a855f7] rounded-full transition-all duration-700"
                     style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-[9px] ${dim}`}>0</span>
                <span className={`text-[9px] ${dim}`}>Target {TARGET}</span>
              </div>
            </div>
            <div className={`text-[10px] ${dim} mt-2`}>
              <span className="text-white font-semibold">{totalExp.toLocaleString()}</span> experiments run ·{' '}
              <span className="text-[#22c55e] font-semibold">{brain?.totalAccepted ?? 0}</span> improvements accepted
            </div>
            <div className={`text-[9px] ${dim} mt-1`}>
              ~2,600 tests/hour · running continuously until deadline
            </div>
          </div>

          {/* Bar chart */}
          <div className="w-full sm:w-56 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={18} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f0f17', border: '1px solid #1c1c28', borderRadius: 6, fontSize: 10 }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {barData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loops.map((loop: any) => {
          const c = LOOP_COLORS[loop.color] ?? LOOP_COLORS.blue;
          const barPct = topScore > 0 ? Math.min(100, (loop.bestScore / topScore) * 100) : 0;
          return (
            <div key={loop.name} className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${c.badge}`}>
                  {loop.name}
                </span>
                <span className={mono('text-sm font-bold', c.text)}>{loop.bestScore?.toFixed(1)}</span>
              </div>
              <div className="h-0.5 bg-[#1c1c28] rounded-full mb-2.5">
                <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: c.bar }} />
              </div>
              <div className={`text-[10px] ${dim} mb-1.5`}>
                {(loop.expCount ?? 0).toLocaleString()} experiments
              </div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`text-[9px] font-semibold ${loop.acceptedCount > 0 ? 'text-[#22c55e]' : dim}`}>
                  ↑ {loop.acceptedCount ?? 0} param improvements found
                </span>
                <span className={`text-[9px] ${dim}`}>
                  ({loop.acceptRate ?? 0}% acceptance rate)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(loop.signals ?? []).map((sig: string) => (
                  <span key={sig} className="text-[9px] px-1.5 py-0.5 rounded bg-[#0a0a0f] border border-[#1c1c28] text-[#9ca3af]">
                    {sig}
                  </span>
                ))}
              </div>
              {loop.latestDescription && (
                <div className={`mt-2.5 text-[9px] ${dim} italic leading-relaxed line-clamp-2 border-t border-[#1c1c28] pt-2`}>
                  Latest: {loop.latestDescription}
                </div>
              )}
              {/* Stops loop — show evolved ATR params */}
              {loop.name === 'Stops' && loop.bestParams && (
                <div className="mt-2.5 border-t border-[#1c1c28] pt-2 space-y-1">
                  <div className={`text-[9px] ${dim} mb-1`}>Evolved stop parameters:</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {[
                      ['ATR trail ×', loop.bestParams.atrMult?.toFixed(1)],
                      ['Hard SL ×', loop.bestParams.hardSlAtrMult?.toFixed(1)],
                      ['Min SL', `${loop.bestParams.hardSlMinPct?.toFixed(0)}%`],
                      ['Max SL', `${loop.bestParams.hardSlMaxPct?.toFixed(0)}%`],
                      ['Activate at', `+${loop.bestParams.activateAt?.toFixed(1)}%`],
                      ['Win rate', `${((loop.bestWinRate ?? 0) * 100).toFixed(0)}%`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className={`text-[9px] ${dim}`}>{k}</span>
                        <span className={mono('text-[9px] text-white')}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section: Capital Allocation ──────────────────────────────────────────────
function CapitalSection({ status }: { status: any }) {
  const w      = status?.wallet   ?? {};
  const yld    = status?.yield    ?? {};
  const total  = w.totalUSD       ?? 0;
  const liquid = w.liquidUSDC     ?? 0;
  const posAmt = w.positionsUSD   ?? 0;
  // ETH + cbBTC = total minus USDC minus open positions
  const other  = Math.max(0, total - liquid - posAmt);
  // Yield is a subset of liquid USDC deployed to protocol — show separately
  const yldAmt = yld.amountUSD ?? 0;
  const yldInYield = Math.min(yldAmt, liquid); // how much of liquid is actually in yield vault

  const segments = [
    { label: 'Liquid USDC',   val: liquid,       color: '#818cf8', desc: 'Ready to trade' },
    { label: 'Active Trades', val: posAmt,        color: '#22c55e', desc: 'Open positions' },
    { label: 'ETH / cbBTC',   val: other,         color: '#374151', desc: 'Reserve assets' },
  ].filter(s => s.val > 0);

  const openPos = status?.positions ?? [];

  // Recharts radial data
  const radialData = segments.map(s => ({
    name:  s.label,
    value: total > 0 ? parseFloat(((s.val / total) * 100).toFixed(1)) : 0,
    fill:  s.color,
  }));

  return (
    <section className="mb-10">
      <div className={`${label} mb-4`}>Capital Allocation</div>
      <div className={`${card} p-5`}>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Donut */}
          <div className="w-full sm:w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="90%"
                              data={radialData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={4} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                      fill="#e2e8f0" fontSize={14} fontWeight={700} fontFamily="monospace">
                  ${total.toFixed(0)}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend + detail */}
          <div className="flex-1 space-y-3">
            {segments.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-[#9ca3af]">{s.label}</span>
                    <span className={mono('text-[11px] font-semibold text-white')}>${s.val.toFixed(2)}</span>
                  </div>
                  <div className="h-0.5 bg-[#1c1c28] rounded-full mt-1">
                    <div className="h-full rounded-full" style={{
                      width: `${total > 0 ? Math.max(2, (s.val / total) * 100) : 2}%`,
                      background: s.color,
                    }} />
                  </div>
                </div>
                <span className={`${mono()} text-[9px] ${dim} w-8 text-right`}>
                  {total > 0 ? ((s.val / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}

            {/* Yield detail */}
            <div className="border-t border-[#1c1c28] pt-3 mt-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-medium text-[#9ca3af]">Yield Position</span>
                {yld.apy > 0
                  ? <span className={mono('text-[10px] text-[#22c55e] font-bold')}>{yld.apy.toFixed(2)}% APY</span>
                  : <span className={`text-[10px] ${dim}`}>deploying surplus next cycle</span>
                }
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] ${dim}`}>{yld.protocol ?? 'Bankr Wallet'} · {yld.vault ?? 'Liquid USDC'}</span>
                <span className={mono('text-[9px] text-white')}>${yldAmt.toFixed(2)}</span>
              </div>
              {yld.apy === 0 && (
                <div className={`text-[9px] ${dim} mt-0.5`}>
                  ${Math.max(0, liquid - 27).toFixed(2)} surplus above $27 tranche → will deploy to best APY vault
                </div>
              )}
            </div>

            {/* Philosophy */}
            <p className={`text-[10px] ${dim} italic border-t border-[#1c1c28] pt-2 mt-1`}>
              Capital is never idle by accident. Surplus above trading tranche earns yield.
              The agent only deploys when conviction ≥ 65% — most cycles are HOLD.
            </p>
          </div>
        </div>

        {/* Open positions */}
        {openPos.length > 0 ? (
          <div className="mt-4 border-t border-[#1c1c28] pt-4 space-y-2">
            <div className={`${label} mb-2`}>Open Positions</div>
            {openPos.map((p: any, i: number) => {
              const pnl = p.currentUSD && p.sizeUSD ? ((p.currentUSD - p.sizeUSD) / p.sizeUSD * 100) : null;
              return (
                <div key={i} className="bg-[#0a0a0f] border border-[#1c1c28] rounded px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{p.sym}</span>
                    <span className={mono('text-xs font-bold', pnlColor(pnl))}>
                      {pnl != null ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className={dim}>entry ${p.entryPrice?.toFixed(6) ?? '—'} · size ${(p.sizeUSD ?? 0).toFixed(2)}</span>
                    <span className={mono('', pnlColor(pnl))}>${(p.currentUSD ?? p.sizeUSD ?? 0).toFixed(2)}</span>
                  </div>
                  {p.openedAt && <div className={`text-[9px] ${dim} mt-0.5`}>opened {fmtDate(p.openedAt)}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 border-t border-[#1c1c28] pt-3">
            <span className={`text-[10px] ${dim} italic`}>No open positions — capital in yield + reserve</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Section: Intelligence Cycles ─────────────────────────────────────────────
function CycleRow({ cycle }: { cycle: any }) {
  const [open, setOpen] = useState(false);
  const isBuy  = cycle.action === 'buy' || cycle.action === 'long';
  const isSell = cycle.action === 'sell';

  const badgeCls = isBuy
    ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
    : isSell
    ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20'
    : 'bg-[#0a0a0f] text-[#6b7280] border-[#1c1c28]';

  const badgeText = isBuy ? `BUY ${cycle.asset ?? ''}` : isSell ? `SELL ${cycle.asset ?? ''}` : 'HOLD';

  return (
    <div className={`border-b border-[#1c1c28] last:border-0 ${isBuy ? 'bg-[#22c55e]/[0.015]' : ''}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-[#111118] transition-colors">
        <span className={mono('text-[10px] shrink-0 w-28', dim)}>{fmtDate(cycle.ts)}</span>
        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${badgeCls}`}>
          {badgeText}
        </span>
        <span className={`text-[10px] ${dim} flex-1 truncate`}>
          {cycle.reasoning?.slice(0, 90) ?? '—'}
        </span>
        <span className={dim}>
          {open ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          <div className="bg-[#0a0a0f] border border-[#1c1c28] rounded-lg p-3 text-[10px] space-y-3">

            {/* Venice AI reasoning — private inference output only */}
            {cycle.reasoning && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#a855f7]" />
                  <span className={`${label} text-[#a855f7]`}>Venice AI · Private Inference</span>
                </div>
                <div className="text-[#d1d5db] leading-relaxed italic">&ldquo;{cycle.reasoning}&rdquo;</div>
              </div>
            )}

            {/* Tokens screened */}
            {(cycle.trendingEntries ?? []).length > 0 && (
              <div className="border-t border-[#1c1c28] pt-2">
                <div className={`${label} mb-1.5`}>Tokens Screened This Cycle</div>
                <div className="space-y-0.5">
                  {(cycle.trendingEntries as any[]).slice(0, 6).map((t: any) => (
                    <div key={t.symbol} className="flex items-center gap-3 py-0.5">
                      <span className={mono('text-white w-20 font-semibold')}>{t.symbol}</span>
                      <span className={mono('', (t.score ?? 0) >= 0.65 ? 'text-[#22c55e]' : (t.score ?? 0) >= 0.40 ? 'text-[#f59e0b]' : dim)}>
                        score {(t.score ?? 0).toFixed(2)}
                      </span>
                      {t.ret1h != null && (
                        <span className={mono('', pnlColor(t.ret1h))}>
                          1h {t.ret1h >= 0 ? '+' : ''}{(t.ret1h * 100).toFixed(1)}%
                        </span>
                      )}
                      {(t.score ?? 0) >= 0.65 && <span className="text-[#22c55e] text-[9px]">↑ flagged</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence + action */}
            {cycle.confidence != null && (
              <div className="border-t border-[#1c1c28] pt-2 flex items-center gap-3">
                <span className={dim}>Conviction</span>
                <span className={mono('font-bold', cycle.confidence >= 65 ? 'text-[#22c55e]' : 'text-[#f59e0b]')}>
                  {cycle.confidence}%
                </span>
                <span className={dim}>threshold 65%</span>
              </div>
            )}

            {/* Position updates */}
            {(cycle.positionUpdates ?? []).length > 0 && (
              <div className="border-t border-[#1c1c28] pt-2">
                <div className={`${label} mb-1.5`}>Position Updates</div>
                {(cycle.positionUpdates as any[]).slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className={`${dim} py-0.5`}>{p.sym}: {p.reasoning?.slice(0, 120) ?? '—'}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CyclesSection({ cycles }: { cycles: any[] }) {
  const [showAll, setShowAll] = useState(false);

  // Dedupe cycles within 3 min of each other (keep newest) — avoids showing sub-30min duplicates
  const deduped = cycles.reduce((acc: any[], c: any) => {
    const last = acc[acc.length - 1];
    if (last && Math.abs(new Date(c.ts).getTime() - new Date(last.ts).getTime()) < 3 * 60 * 1000) return acc;
    acc.push(c);
    return acc;
  }, []);

  const display = showAll ? deduped : deduped.slice(0, 15);
  // Count only cycles with confirmed trade (traded array non-empty)
  const confirmed = deduped.filter(c => (c.traded ?? []).length > 0).length;
  const holds = deduped.filter(c => c.action === 'hold' || c.action === 'smart_yield').length;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className={label}>Intelligence Cycles</div>
        <div className={`text-[10px] ${dim} flex gap-3`}>
          <span><span className="text-[#22c55e]">{confirmed}</span> on-chain trades</span>
          <span><span className="text-[#6b7280]">{holds}</span> HOLD cycles</span>
        </div>
      </div>
      <div className={`${card} overflow-hidden`}>
        {display.map((c: any, i: number) => <CycleRow key={i} cycle={c} />)}
        {deduped.length > 15 && (
          <button onClick={() => setShowAll(s => !s)}
            className={`w-full py-2.5 text-[10px] ${dim} hover:text-white border-t border-[#1c1c28] transition-colors`}>
            {showAll ? 'Show less ↑' : `Show all ${deduped.length} cycles ↓`}
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Section: Trade History & Learnings ────────────────────────────────
function TradeHistory({ status }: { status: any }) {
  const perf   = status?.performance ?? {};
  // Sort by closedAt descending (most recent first)
  const trades: Trade[] = [...(perf.recentTrades ?? [])]
    .sort((a, b) => new Date(b.closedAt ?? 0).getTime() - new Date(a.closedAt ?? 0).getTime())
    .slice(0, 10);
  if (trades.length === 0) return null;

  const closed  = perf.closedTrades ?? 0;
  const winStr  = perf.winRate ?? '0/0';
  const wins    = parseInt(winStr.split('/')[0]) ?? 0;
  const winPct  = closed > 0 ? ((wins / closed) * 100).toFixed(0) : '0';
  const avgPnl  = trades.reduce((s, t) => s + (t.pnlPct ?? 0), 0) / Math.max(1, trades.length);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className={label}>Trade History & Learnings</div>
        <div className={`flex gap-4 text-[10px] ${dim}`}>
          <span>{closed} closed trades</span>
          <span className={mono('', parseInt(winPct) >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
            {winPct}% win rate
          </span>
          <span className={mono('', pnlColor(avgPnl))}>
            avg {avgPnl >= 0 ? '+' : ''}{avgPnl.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {/* Header row */}
        <div className={`grid grid-cols-[2fr_1fr_1fr_1fr_3fr] gap-3 px-4 py-2 border-b border-[#1c1c28] ${label}`}>
          <span>Token</span>
          <span>P&amp;L</span>
          <span>Regime</span>
          <span>Closed</span>
          <span>Brain Learning</span>
        </div>

        {trades.map((t, i) => {
          const learningKey = `${t.sym}_${t.won ? 'win' : 'loss'}`;
          const learning = LEARNINGS[learningKey] ?? LEARNINGS[t.sym] ?? 'Signal parameters updated based on this outcome.';
          const isWin = t.won;
          return (
            <div key={i}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr_3fr] gap-3 px-4 py-3 border-b border-[#1c1c28] last:border-0 items-start
                ${isWin ? 'bg-[#22c55e]/[0.02]' : ''}`}>
              {/* Token */}
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isWin ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
                <span className="text-xs font-semibold text-white">{t.sym}</span>
              </div>
              {/* P&L */}
              <div className={mono('text-xs font-semibold', isWin ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                {(t.pnlPct ?? 0) >= 0 ? '+' : ''}{(t.pnlPct ?? 0).toFixed(2)}%
              </div>
              {/* Regime */}
              <div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border
                  ${t.regime === 'BEAR' ? 'border-[#ef4444]/20 text-[#ef4444] bg-[#ef4444]/5' :
                    t.regime === 'BULL' ? 'border-[#22c55e]/20 text-[#22c55e] bg-[#22c55e]/5' :
                    'border-[#1c1c28] text-[#6b7280] bg-[#0a0a0f]'}`}>
                  {t.regime ?? '—'}
                </span>
              </div>
              {/* Date */}
              <div className={`text-[9px] ${dim}`}>{fmtDate(t.closedAt)}</div>
              {/* Learning */}
              <div className="text-[10px] text-[#9ca3af] leading-relaxed">{learning}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section: Footer ──────────────────────────────────────────────────────────
function Footer({ stack }: { stack: any }) {
  const links = [
    { label: 'Built on Base', href: 'https://base.org' },
    { label: 'delu-agent', href: 'https://github.com/deluagent/delu-agent' },
    { label: 'Hackathon submission', href: 'https://synthesis.devfolio.co/projects/delu-autonomous-agent-with-skin-in-the-game-7115' },
    { label: 'Basescan', href: `https://basescan.org/address/${wallet}` },
  ];
  const sources = ['Alchemy', 'Checkr x402', 'Bankr API', 'Venice AI'];

  return (
    <footer className="border-t border-[#1c1c28] pt-6 pb-10">
      <div className="flex flex-col sm:flex-row gap-6 justify-between">
        <div>
          <div className={`${label} mb-2`}>Links</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {links.map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                 className={`flex items-center gap-1 text-[11px] ${dim} hover:text-white transition-colors`}>
                <ExternalLink size={9} /> {l.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className={`${label} mb-2`}>Data Sources</div>
          <div className="flex flex-wrap gap-1.5">
            {sources.map(s => (
              <span key={s} className={`text-[9px] px-2 py-0.5 rounded border border-[#1c1c28] ${dim}`}>{s}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className={mono('text-[9px]', dim)}>{walletShort}</div>
          <div className={`text-[9px] ${dim} mt-0.5`}>Base mainnet · delu autonomous agent</div>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Page() {
  const [status, setStatus] = useState<any>(null);
  const [brain,  setBrain]  = useState<any>(null);
  const [error,  setError]  = useState<string | null>(null);

  const RAW = 'https://raw.githubusercontent.com/deluagent/delu-site/main/public/data';

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        fetch(`${RAW}/status.json?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()),
        fetch(`${RAW}/brain.json?t=${Date.now()}`,  { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      ]);
      setStatus(s);
      setBrain(b);
    } catch (e: any) { setError(e.message); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-[#ef4444] text-sm font-mono">{error}</p>
    </div>
  );

  if (!status) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex items-center gap-2 text-[#6b7280] text-sm">
        <div className="w-3 h-3 rounded-full border-2 border-[#a855f7] border-t-transparent animate-spin" />
        loading delu…
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Hero             status={status} />
        <HowItWorks />
        <BrainSection     brain={brain ?? status?.autoresearch} />
        <CapitalSection   status={status} />
        <CyclesSection    cycles={status?.cycleHistory ?? []} />
        <TradeHistory     status={status} />
        <Footer           stack={status?.stack} />
      </div>
    </main>
  );
}
