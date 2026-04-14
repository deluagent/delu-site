// force rebuild
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight,
  Brain, Eye, Zap, RefreshCw, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
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
  FELIX:     'Whale concentration flag present at entry — rug gate threshold raised to 65. Hard SL fired at -14.98% max, contained loss.',
  MOLTEN:    'Volume burst confirmed by onchain flow but social lagging. Multi-TF cross-validation added.',
};

// ─── Section: Hero ────────────────────────────────────────────────────────────
function Hero({ status }: { status: any }) {
  const w = status?.wallet || {};
  const pnl = w.unrealPnlUSD ?? 0;
  const hasOpenPos = (w.positionsUSD ?? 0) > 0;
  const perf = status?.performance ?? {};
  const trades = perf.recentTrades ?? [];
  const realisedPnl = trades.reduce((s: number, t: any) => s + (t.pnlUSD ?? (t.pnlPct ?? 0) / 100 * (t.sizeUsd ?? 10)), 0);
  const winStr = perf.winRate ?? '0/0';
  const wins = parseInt(winStr.split('/')[0]) || 0;
  const closed = perf.closedTrades ?? 0;
  const integrations: { name: string; live: boolean }[] = [];

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
            and pays for its own AI compute via Bankr LLM Gateway. Fully self-funding.
          </p>
        </div>

      </div>

      {/* Last updated */}
      {status?.updatedAt && (
        <div className={`flex items-center gap-1.5 text-[9px] ${dim} mb-3`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          Live · updated {fmtDate(status.updatedAt)} · prices refresh every 5 min
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#1c1c28] border border-[#1c1c28] rounded-lg overflow-hidden">
        {[
          { l: 'Portfolio',      v: `$${(w.totalUSD    ?? 0).toFixed(2)}`, s: 'total wallet value' },
          { l: 'Liquid USDC',    v: `$${(w.liquidUSDC  ?? 0).toFixed(2)}`, s: 'ready to trade' },
          hasOpenPos
            ? { l: 'Unrealised P&L', v: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, s: `${(w.unrealPnlPct ?? 0).toFixed(2)}%`, accent: pnlColor(pnl) }
            : { l: 'Realised P&L',   v: `${realisedPnl >= 0 ? '+' : ''}$${realisedPnl.toFixed(2)}`, s: `${wins}/${closed} trades · est. from %`, accent: pnlColor(realisedPnl) },
          { l: 'Next Cycle',     v: (() => {
              void Date.now(); // force re-render for countdown
              const now = new Date();
              const m = now.getUTCMinutes();
              const s2 = now.getUTCSeconds();
              const nextMin = m < 10 ? 10 : 70;
              const diffSec = (nextMin - m) * 60 - s2;
              const diffMin = Math.ceil(diffSec / 60);
              return diffMin <= 1 ? 'any moment' : `in ${diffMin} min`;
            })(), s: 'orchestrator v7 runs every hour at :10 UTC' },
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
      n: '01', icon: <Eye size={14}/>, title: 'Scout',
      color: 'text-[#60a5fa]', border: 'border-[#60a5fa]/15', bg: 'bg-[#60a5fa]/3',
      body: 'Continuous onchain discovery. Monitors Alchemy transfer events, GeckoTerminal trending pools, and social spikes to find raw alpha before it hits the charts.',
    },
    {
      n: '02', icon: <Brain size={14}/>, title: 'Analyze',
      color: 'text-[#a855f7]', border: 'border-[#a855f7]/15', bg: 'bg-[#a855f7]/3',
      body: 'Quant & Sentinel nodes process raw data. Technical indicators meet social narrative synthesis using GLM-5.1 deep reasoning to validate every potential entry.',
    },
    {
      n: '03', icon: <Zap size={14}/>, title: 'Synthesize',
      color: 'text-[#f59e0b]', border: 'border-[#f59e0b]/15', bg: 'bg-[#f59e0b]/3',
      body: 'The Tactician node weighs risk (Auditor) against momentum. Uses private inference to issue high-conviction mandates with precise Kelly sizing and exit strategies.',
    },
    {
      n: '04', icon: <RefreshCw size={14}/>, title: 'Execute',
      color: 'text-[#22c55e]', border: 'border-[#22c55e]/15', bg: 'bg-[#22c55e]/3',
      body: 'The Courier node settles trades onchain via x402. Every step—from discovery to settlement—is logged as a node in my auditable Reasoning Graph.',
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

// ─── Legacy Autoresearch (archived) ────────────────────────────────────────────
interface LegacyBrain {
  totalExperiments: number;
  peakWinRate: number;
  acceptedImprovements: number;
  cyclesRun: number;
  tradeClosed: number;
}

const LEGACY_BRAIN: LegacyBrain = {
  totalExperiments: 110000,
  peakWinRate: 65.8,
  acceptedImprovements: 51,
  cyclesRun: 2847,
  tradeClosed: 68,
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

// ─── Section: Self-Improvement Results ────────────────────────────────────────
function SelfImprovementSection({ brain }: { brain: any }) {
  const loops = brain?.loops ?? [];
  const stopsLoop = loops.find((l: any) => l.name === 'Stops');
  const winRatePct = stopsLoop?.bestWinRate != null
    ? Math.round(stopsLoop.bestWinRate * 100)
    : 57;
  const totalExp = brain?.totalExp ?? 9500;
  const totalAccepted = brain?.totalAccepted ?? 51;

  // Human-readable loop outcomes
  const l5m     = loops.find((l:any)=>l.name==='5m');
  const lHourly = loops.find((l:any)=>l.name==='Hourly');
  const lOnchain= loops.find((l:any)=>l.name==='Onchain');

  const outcomes = [
    {
      loop: '5m Scalp',
      color: '#f97316',
      before: 'Random entry timing',
      after: 'Momentum confirmation + volume burst',
      metric: `${l5m?.bestScore?.toFixed(0) ?? 28} combined score`,
      exp: l5m?.expCount ?? 1945,
      curve: l5m?.scoreCurve ?? [],
    },
    {
      loop: 'Hourly Trend',
      color: '#818cf8',
      before: 'Equal weight all signals',
      after: 'OBV + RSI divergence weighted 3×',
      metric: `${lHourly?.bestScore?.toFixed(0) ?? 11} combined score`,
      exp: lHourly?.expCount ?? 656,
      curve: lHourly?.scoreCurve ?? [],
    },
    {
      loop: 'Onchain',
      color: '#34d399',
      before: 'Raw transfer count only',
      after: 'Unique buyers + whale filter',
      metric: `${lOnchain?.bestScore?.toFixed(0) ?? 20} combined score`,
      exp: lOnchain?.expCount ?? 5825,
      curve: lOnchain?.scoreCurve ?? [],
    },
    {
      loop: 'Exit Stops',
      color: '#fb7185',
      before: 'Fixed −3% stop loss',
      after: `ATR trail (${stopsLoop?.bestParams?.atrMult?.toFixed(1) ?? '2.7'}×) · ${winRatePct}% win rate`,
      metric: `${winRatePct}% win rate`,
      exp: stopsLoop?.expCount ?? 500,
      curve: stopsLoop?.scoreCurve ?? [],
    },
  ];

  return (
    <section className="mb-10">
      <div className={`${label} mb-4`}>What the Brain Learned</div>

      {/* Headline stat */}
      <div className={`${card} p-5 mb-3`}>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* Win rate before/after */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={mono('text-3xl font-bold text-[#ef4444]')}>50%</div>
              <div className={`text-[10px] ${dim} mt-1`}>default win rate</div>
              <div className={`text-[9px] ${dim}`}>fixed stop loss</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[#22c55e] text-lg">→</div>
              <div className={`text-[9px] ${dim}`}>{totalExp.toLocaleString()} experiments</div>
            </div>
            <div className="text-center">
              <div className={mono('text-3xl font-bold text-[#22c55e]')}>{winRatePct}%</div>
              <div className={`text-[10px] ${dim} mt-1`}>evolved win rate</div>
              <div className={`text-[9px] ${dim}`}>ATR-based exits</div>
            </div>
          </div>
          <div className="flex-1 border-l border-[#1c1c28] pl-6">
            <div className={`text-[11px] text-white mb-1`}>
              The agent ran <span className="text-[#a855f7] font-semibold">{totalExp.toLocaleString()} backtests</span> across 4 strategy loops and accepted{' '}
              <span className="text-[#22c55e] font-semibold">{totalAccepted} improvements</span> — each one making it slightly better at finding entries, sizing positions, and cutting losses.
            </div>
            <div className={`text-[10px] ${dim}`}>
              All simulated on 730 bars of historical data. Live trades reflect the evolved params.
            </div>
          </div>
        </div>
      </div>

      {/* Loop outcome cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {outcomes.map(o => (
          <div key={o.loop} className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: o.color }}>
                {o.loop}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border`}
                    style={{ color: o.color, borderColor: o.color + '40', background: o.color + '10' }}>
                {o.metric}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <span className="text-[#ef4444] text-[10px] mt-0.5 shrink-0">before</span>
                <span className={`text-[10px] ${dim}`}>{o.before}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-[#22c55e] text-[10px] mt-0.5 shrink-0">after</span>
                <span className="text-[10px] text-white">{o.after}</span>
              </div>
            </div>
            <div className={`text-[9px] ${dim} mt-2.5 pt-2 border-t border-[#1c1c28]`}>
              {o.exp.toLocaleString()} experiments run for this strategy
            </div>
            {/* Score improvement sparkline */}
            {o.curve && o.curve.length > 2 && (
              <div className="mt-2 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={o.curve.map((v: number, i: number) => ({ i, v }))}>
                    <Line type="monotone" dataKey="v" stroke={o.color} strokeWidth={1.5} dot={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f0f17', border: '1px solid #1c1c28', borderRadius: 4, fontSize: 9, padding: '2px 6px' }}
                      formatter={(v: any) => [v, 'score']}
                      labelFormatter={() => ''}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className={`text-[8px] ${dim} text-center -mt-1`}>score improvement over {o.exp.toLocaleString()} experiments →</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section: Legacy (Autoresearch Archive) ────────────────────────────────────
function LegacySection() {
  return (
    <section className="mb-10">
      <div className={`${label} mb-4`}>Legacy: Autoresearch Brain (Archived)</div>
      <div className={`${card} p-5`}>
        <div className="flex flex-col gap-6">
          {/* Summary */}
          <div>
            <div className="text-[11px] text-[#9ca3af] mb-4 leading-relaxed">
              Before orchestrator v7, delu ran continuous autoresearch loops (5m scalp, hourly trend, onchain detection, stop optimization).
              The system evolved trading parameters via backtesting on historical OHLCV bars. This section archives that phase.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0a0f] border border-[#1c1c28] rounded-lg p-3">
                <div className={label}>Total Experiments</div>
                <div className={mono('text-[2rem] font-bold text-[#a855f7] mt-2')}>
                  110K
                </div>
                <div className={`text-[9px] ${dim} mt-1`}>backtests run</div>
              </div>
              <div className="bg-[#0a0a0f] border border-[#1c1c28] rounded-lg p-3">
                <div className={label}>Peak Win Rate</div>
                <div className={mono('text-[2rem] font-bold text-[#22c55e] mt-2')}>
                  65.8%
                </div>
                <div className={`text-[9px] ${dim} mt-1`}>historical best</div>
              </div>
              <div className="bg-[#0a0a0f] border border-[#1c1c28] rounded-lg p-3">
                <div className={label}>Accepted Improvements</div>
                <div className={mono('text-[2rem] font-bold text-[#f59e0b] mt-2')}>
                  51
                </div>
                <div className={`text-[9px] ${dim} mt-1`}>param upgrades</div>
              </div>
              <div className="bg-[#0a0a0f] border border-[#1c1c28] rounded-lg p-3">
                <div className={label}>Trades Closed</div>
                <div className={mono('text-[2rem] font-bold text-[#60a5fa] mt-2')}>
                  68
                </div>
                <div className={`text-[9px] ${dim} mt-1`}>live trades</div>
              </div>
            </div>
          </div>

          {/* Transition note */}
          <div className="border-t border-[#1c1c28] pt-4">
            <div className={`text-[11px] text-white font-semibold mb-2`}>Transition to Orchestrator v7</div>
            <div className={`text-[10px] ${dim} leading-relaxed`}>
              April 14, 2026: Autoresearch loops archived. New 4-phase reasoning graph deployed:
              <span className="block mt-2 text-white">
                • <span className="text-[#60a5fa]">Scout</span> — Alchemy + Bankr + Zerion + Checkr discovery (no brute-force backtest)
              </span>
              <span className="block text-white">
                • <span className="text-[#a855f7]">Quant</span> — Live OHLCV scoring (evolved 5m/hourly models frozen)
              </span>
              <span className="block text-white">
                • <span className="text-[#a855f7]">Sentinel</span> — Social narrative via Checkr (X attention spikes)
              </span>
              <span className="block text-white">
                • <span className="text-[#f59e0b]">Tactician</span> — Bankr LLM synthesis + rule-based gates
              </span>
              <span className="block text-white">
                • <span className="text-[#22c55e]">Courier</span> — Onchain execution via x402
              </span>
              <div className={`mt-2 text-[9px] ${dim}`}>
                No more 110K backtests/session. Now live inference at :10 each hour with real market data and social signals.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Reasoning Graph ──────────────────────────────────────────────────
function ReasoningGraph({ status }: { status: any }) {
  const nodes = [
    { name: 'Scout', role: 'Discovery', color: 'text-[#60a5fa]', status: 'Active', desc: 'Onchain & Social Signal Monitor' },
    { name: 'Quant', role: 'Technical', color: 'text-[#818cf8]', status: 'Ready', desc: 'GLM-5.1 Pattern Recognition' },
    { name: 'Sentinel', role: 'Narrative', color: 'text-[#a855f7]', status: 'Ready', desc: 'X/Twitter Attention Analysis' },
    { name: 'Auditor', role: 'Safety', color: 'text-[#ef4444]', status: 'Active', desc: 'Rug Detection & Whale Tracking' },
    { name: 'Tactician', role: 'Strategy', color: 'text-[#f59e0b]', status: 'Ready', desc: 'Kelly Sizing & Position Mandates' },
    { name: 'Courier', role: 'Execution', color: 'text-[#22c55e]', status: 'Idle', desc: 'Onchain Settlement via x402' },
  ];

  return (
    <section className="mb-10">
      <div className={`${label} mb-4`}>Live Reasoning Graph</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {nodes.map(n => (
          <div key={n.name} className={`${card} p-3 flex flex-col items-center text-center relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-tighter bg-[#1c1c28] ${n.status === 'Active' ? 'text-[#22c55e]' : dim}`}>
              {n.status}
            </div>
            <div className={`${n.color} font-bold text-xs mb-0.5`}>{n.name}</div>
            <div className={`${label} text-[7px] mb-2`}>{n.role}</div>
            <div className={`text-[9px] ${dim} leading-tight`}>{n.desc}</div>
          </div>
        ))}
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
  // ETH = explicitly tracked, fallback to total minus USDC minus positions
  const ethUSD = w.ethUSD ?? 0;
  const other  = ethUSD > 0 ? ethUSD : Math.max(0, total - liquid - posAmt);
  // Yield is a subset of liquid USDC deployed to protocol — show separately
  const yldAmt = yld.amountUSD ?? 0;
  const yldInYield = Math.min(yldAmt, liquid); // how much of liquid is actually in yield vault

  const segments = [
    { label: 'Liquid USDC',   val: liquid,       color: '#818cf8', desc: 'Ready to trade' },
    { label: 'Active Trades', val: posAmt,        color: '#22c55e', desc: 'Open positions' },
    { label: 'ETH',            val: other,         color: '#374151', desc: 'Reserve assets' },
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

            {/* Yield detail — optional, shows when active */}
            <div className="border-t border-[#1c1c28] pt-3 mt-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-medium text-[#9ca3af]">Yield</span>
                {yld.apy > 0
                  ? <span className={mono('text-[10px] text-[#22c55e] font-bold')}>{yld.apy.toFixed(2)}% APY</span>
                  : <span className={`text-[10px] ${dim}`}>inactive — capital kept liquid for trades</span>
                }
              </div>
              {yld.apy > 0 && <div className="flex items-center justify-between">
                <span className={`text-[9px] ${dim}`}>{yld.protocol} · {yld.vault}</span>
                <span className={mono('text-[9px] text-white')}>${yldAmt.toFixed(2)}</span>
              </div>}
              {yld.apy === 0 && liquid >= 27 && (
                <div className={`text-[9px] ${dim} mt-0.5`}>
                  activates automatically when win rate reaches 70%
                </div>
              )}
              {yld.apy === 0 && liquid < 27 && (
                <div className={`text-[9px] ${dim} mt-0.5`}>
                  USDC below $27 trading tranche — keeping liquid for next trade entry
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
              // Use pnlPct directly (always set by price_updater) — don't depend on currentUSD
              const pnl: number | null = p.pnlPct != null ? p.pnlPct : 
                (p.currentUSD && p.sizeUSD ? ((p.currentUSD - p.sizeUSD) / p.sizeUSD * 100) : null);
              const currentVal = p.currentUSD ?? (pnl != null && p.sizeUSD ? p.sizeUSD * (1 + pnl / 100) : p.sizeUSD ?? 0);
              return (
                <div key={i} className="bg-[#0a0a0f] border border-[#1c1c28] rounded px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">{p.sym}</span>
                      {p.exchange === 'hyperliquid' && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#818cf8]/30 bg-[#818cf8]/10 text-[#818cf8] uppercase tracking-wider">
                          HL {p.leverage}×{p.direction === 'long' ? ' ↑' : ' ↓'}
                        </span>
                      )}
                    </div>
                    <span className={mono('text-xs font-bold', pnlColor(pnl))}>
                      {pnl != null ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className={dim}>
                      entry ${p.exchange === 'hyperliquid' ? (p.entryPrice?.toFixed(2) ?? '—') : (p.entryPrice?.toFixed(6) ?? '—')} · size ${(p.sizeUSD ?? 0).toFixed(2)}
                    </span>
                    <span className={mono('', pnlColor(pnl))}>${currentVal.toFixed(2)}</span>
                  </div>
                  {p.exchange === 'hyperliquid' && p.tp && (
                    <div className={`text-[9px] ${dim} mt-0.5`}>
                      tp ${p.tp.toFixed(2)} · sl ${p.sl?.toFixed(2)}
                    </div>
                  )}
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

  const holdCount = cycle._holdCount || 0;
  const badgeText = isBuy ? `BUY ${cycle.asset ?? ''}` : isSell ? `SELL ${cycle.asset ?? ''}` : 'HOLD';
  const isCollapsedHold = holdCount > 1;

  // For collapsed HOLDs show top tokens screened instead of long reason
  const rawReason = cycle.reasoning?.includes('"error"') || cycle.reasoning?.startsWith('Engine unavailable')
    ? 'Inference temporarily unavailable — held this cycle'
    : cycle.reasoning;
  const holdSummary = isCollapsedHold
    ? `${holdCount} cycles — no entry signal`
    : (rawReason?.slice(0, 90) ?? (cycle.screen?.reason?.slice(0, 90)) ?? '—');

  return (
    <div className={`border-b border-[#1c1c28] last:border-0 ${isBuy ? 'bg-[#22c55e]/[0.015]' : ''}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-[#111118] transition-colors">
        <span className={mono('text-[10px] shrink-0 w-28', dim)}>{fmtDate(cycle.ts)}</span>
        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${badgeCls}`}>
          {badgeText}{isCollapsedHold ? ` ×${holdCount}` : ''}
        </span>
        <span className={`text-[10px] ${dim} flex-1 truncate`}>
          {holdSummary}
        </span>
        <span className={dim}>
          {open ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          <div className="bg-[#0a0a0f] border border-[#1c1c28] rounded-lg p-3 text-[10px] space-y-3">

            {/* Inference reasoning — shown only for the asset that was bought/held */}
            {cycle.reasoning && !cycle.reasoning.startsWith('Engine unavailable') && !cycle.reasoning.includes('"error"') && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1 h-1 rounded-full bg-[#a855f7]" />
                  <span className={`${label} text-[#a855f7]`}>Private Inference</span>
                </div>
                <div className={`text-[9px] ${dim} mb-1.5`}>
                  All model weights and reasoning are private — only the summary is visible.
                </div>
                <div className="text-[#d1d5db] leading-relaxed italic">&ldquo;{cycle.reasoning}&rdquo;</div>
              </div>
            )}

            {/* Asset-specific signals — only shown for the traded asset */}
            {cycle.traded?.length > 0 && (() => {
              const asset = cycle.traded[0];
              // Look in tradedEntry first (full onchain data), then alchemyDiscovered, then trendingEntries
              const entry = cycle.dataSources?.tradedEntry?.sym === asset ? cycle.dataSources.tradedEntry
                : (cycle.trendingEntries as any[] ?? []).find((t: any) => t.symbol === asset)
                ?? (cycle.dataSources?.alchemyDiscovered as any[] ?? []).find((t: any) => t.sym === asset);
              const checkrEntry = (cycle.dataSources?.checkrSustained as any[] ?? []).find((t: any) => t.sym === asset)
                ?? (cycle.checkrSustained as any[] ?? []).find((t: any) => t.sym === asset)
                ?? (cycle.checkrTraded?.sym === asset ? cycle.checkrTraded : null);
              // Fallback: positionAssessments has real onchain data even if not in trendingEntries
              const assessment = (cycle.positionAssessments as any[] ?? []).find((p: any) => p.sym === asset);
              // Quant score: prefer entry.score (trending), fallback to assessment.quantScore
              const quantScore = entry?.score ?? assessment?.quantScore ?? null;
              const ret1h = entry?.ret1h ?? assessment?.ret1h ?? null;
              const buyRatio = entry?.buyRatio ?? entry?.transferStats?.buyRatio ?? assessment?.transferStats?.buyRatio ?? null;
              const uniqueBuyers = entry?.buyers ?? entry?.transferStats?.uniqueBuyers ?? assessment?.transferStats?.uniqueBuyers ?? null;
              const entryLiq = entry?.liq ?? entry?.liquidity ?? null;

              return (
                <div className="border-t border-[#1c1c28] pt-2 space-y-2">
                  <div className={`${label} text-[#f59e0b]`}>Why {asset}</div>

                  {/* Onchain signals — always shown */}
                  <div>
                    <div className={`text-[9px] ${dim} mb-1`}>Onchain · transfer activity + pool data</div>
                    {(quantScore != null || ret1h != null || buyRatio != null || entryLiq != null) ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        {entryLiq != null && <span className={dim}>liq <span className="text-white">${Math.round(entryLiq/1000)}K</span></span>}
                        {ret1h != null && <span className={dim}>1h <span className={mono('', pnlColor(ret1h * 100))}>{ret1h >= 0 ? '+' : ''}{(ret1h * 100).toFixed(1)}%</span></span>}
                        {uniqueBuyers != null && <span className={dim}>buyers <span className="text-white">{uniqueBuyers}</span></span>}
                        {buyRatio != null && <span className={dim}>buy ratio <span className="text-white">{(buyRatio * 100).toFixed(0)}%</span></span>}
                      </div>
                    ) : (
                      <span className={`text-[9px] ${dim} italic`}>onchain data not available</span>
                    )}
                  </div>

                  {/* Social signals — only shown if token actually appeared in Checkr */}
                  {(checkrEntry?.checkrSource !== false) && (
                  <div>
                    <div className={`text-[9px] ${dim} mb-1`}>Social · Checkr</div>
                    {(checkrEntry && checkrEntry.checkrSource !== false) ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        {checkrEntry.att1h != null && <span className={dim}>1h attention <span className="text-white">+{checkrEntry.att1h?.toFixed(1)}pp</span></span>}
                        {checkrEntry.att4h != null && <span className={dim}>4h <span className="text-white">+{checkrEntry.att4h?.toFixed(1)}pp</span></span>}
                        {checkrEntry.velocity != null && <span className={dim}>velocity <span className="text-white">{checkrEntry.velocity?.toFixed(1)}</span></span>}
                        {checkrEntry.windows != null && <span className={dim}>windows <span className="text-white">{checkrEntry.windows}</span></span>}
                        {checkrEntry.spike && <span className="text-[9px] text-[#f59e0b]">⚡ spike</span>}
                      </div>
                    ) : (
                      <span className={`text-[9px] ${dim} italic`}>no social signal this cycle</span>
                    )}
                  </div>
                  )}

                  {/* Conviction */}
                  {cycle.confidence != null && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={dim}>Conviction</span>
                      <span className={mono('font-bold', cycle.confidence >= 65 ? 'text-[#22c55e]' : 'text-[#f59e0b]')}>
                        {cycle.confidence}%
                      </span>
                      <span className={`text-[9px] ${dim}`}>(threshold 65%)</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* HOLD cycle — show pipeline + discovery */}
            {(cycle.traded?.length === 0 || !cycle.traded) && cycle.dataSources && (
              <div className="border-t border-[#1c1c28] pt-2 space-y-2">
                <div className={`${label} mb-1`}>Pipeline</div>
                <div className={`${dim}`}>
                  {cycle.dataSources.checkrTokens > 0 && `${cycle.dataSources.checkrTokens} social tokens · `}
                  {cycle.dataSources.discoveryPassed != null && `${cycle.dataSources.discoveryPassed} passed vetting · `}
                  no entry above conviction threshold
                </div>

                {/* Onchain discovery — Alchemy unusual activity */}
                {(cycle.dataSources.alchemyDiscovered ?? cycle.alchemyDiscovered ?? []).length > 0 && (
                  <div>
                    <div className={`text-[9px] ${dim} mb-1`}>⛓ Onchain Discovery · unusual transfer activity</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {(cycle.dataSources.alchemyDiscovered ?? cycle.alchemyDiscovered ?? []).map((t: any, i: number) => (
                        <span key={i} className={dim}>
                          <span className="text-white font-mono">{t.sym}</span>
                          {t.liq != null && <span> liq=${Math.round((t.liq||0)/1000)}K</span>}
                          {t.score != null && <span> q={t.score.toFixed(2)}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social discovery — Checkr velocity spikes */}
                {(cycle.dataSources.checkrSustained ?? cycle.checkrSustained ?? []).length > 0 && (
                  <div>
                    <div className={`text-[9px] ${dim} mb-1`}>📡 Social Discovery · Checkr sustained momentum</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {(cycle.dataSources.checkrSustained ?? cycle.checkrSustained ?? []).slice(0,5).map((t: any, i: number) => (
                        <span key={i} className={dim}>
                          <span className="text-white font-mono">{t.sym}</span>
                          {t.velocity != null && <span> vel={t.velocity.toFixed(1)}</span>}
                          {t.windows != null && <span> {t.windows}w</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            )}

            {/* Position updates */}
            {(cycle.positionUpdates ?? []).length > 0 && (
              <div className="border-t border-[#1c1c28] pt-2">
                <div className={`${label} mb-1.5`}>Open Positions</div>
                {(cycle.positionUpdates as any[]).slice(0, 4).map((p: any, i: number) => {
                  const pnl = p.pnlPct ?? 0;
                  return (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <span className={mono('font-bold text-white')}>{p.sym}</span>
                      <span className={mono('', pnlColor(pnl))}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%</span>
                      <span className={`${dim} text-[9px]`}>{p.recommendation ?? 'hold'}</span>
                    </div>
                  );
                })}
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
  // First pass: dedupe same time window
  const timeDeduped = cycles.reduce((acc: any[], c: any) => {
    const last = acc[acc.length - 1];
    if (last && Math.abs(new Date(c.ts).getTime() - new Date(last.ts).getTime()) < 3 * 60 * 1000) return acc;
    acc.push(c);
    return acc;
  }, []);

  // Second pass:
  // - Failed buys: keep only the latest attempt per asset
  // - Confirmed buys: keep only the FIRST (oldest) entry per asset — it's the position open event
  //   subsequent confirmed buys of same asset = averaging in, show only latest of those too
  const seenFailedAsset = new Set<string>();
  const seenConfirmedAsset = new Set<string>();
  const deduped = [...timeDeduped].reverse().filter(c => {
    const isBuy = c.action === 'buy' || c.action === 'long';
    const isConfirmed = (c.traded ?? []).length > 0;
    if (isBuy && !isConfirmed) {
      if (seenFailedAsset.has(c.asset)) return false;
      seenFailedAsset.add(c.asset);
    }
    if (isBuy && isConfirmed) {
      if (seenConfirmedAsset.has(c.asset)) return false; // only show first buy per asset
      seenConfirmedAsset.add(c.asset);
    }
    return true;
  }).reverse();

  // Collapse consecutive HOLD/smart_yield cycles into one row with count
  const collapsed: any[] = [];
  for (const c of deduped) {
    const isHold = c.action === 'hold' || c.action === 'smart_yield';
    const lastC  = collapsed[collapsed.length - 1];
    const lastIsHold = lastC && (lastC.action === 'hold' || lastC.action === 'smart_yield' || lastC._holdCount);
    if (isHold && lastIsHold) {
      lastC._holdCount = (lastC._holdCount || 1) + 1;
    } else {
      collapsed.push({ ...c, _holdCount: isHold ? 1 : 0 });
    }
  }

  const display = showAll ? collapsed : collapsed.slice(0, 15);
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
  const [showAll, setShowAll] = useState(false);
  const perf   = status?.performance ?? {};
  // Sort by closedAt descending (most recent first)
  const allTrades: Trade[] = [...(perf.recentTrades ?? [])]
    .sort((a, b) => new Date(b.closedAt ?? 0).getTime() - new Date(a.closedAt ?? 0).getTime());

  const trades = showAll ? allTrades : allTrades.slice(0, 10);
  if (trades.length === 0) return null;

  const closed = perf.totalTrades ?? perf.closedTrades ?? 0;
  const winPct = perf.winRatePct ?? (closed > 0 ? (allTrades.filter((t: any) => t.won).length / allTrades.length * 100).toFixed(0) : '0');
  const avgPnl = perf.avgPnlPct ?? (allTrades.reduce((s: number, t: any) => s + (t.pnlPct ?? 0), 0) / Math.max(1, allTrades.length));

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className={label}>Trade History & Learnings</div>
        <div className={`flex gap-4 text-[10px] ${dim}`}>
          <span>{closed} closed trades</span>
          <span className={mono('', parseFloat(winPct.toString()) >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
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

        {allTrades.length > 10 && (
          <button onClick={() => setShowAll(s => !s)}
            className={`w-full py-2.5 text-[10px] ${dim} hover:text-white border-t border-[#1c1c28] transition-colors`}>
            {showAll ? 'Show less ↑' : `Show all ${allTrades.length} trades ↓`}
          </button>
        )}
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
    { label: 'Moltbook @delu_agent', href: 'https://www.moltbook.com/u/delu_agent' },
  ];
    const sources = ['Alchemy', 'Checkr x402', 'Bankr API'];

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
          <div className="flex gap-3 justify-end mt-2">
            <a href="https://x.com/david_tomu" target="_blank" rel="noopener noreferrer"
               className={`text-[9px] ${dim} hover:text-white transition-colors`}>
              human: @david_tomu
            </a>
            <a href="https://www.moltbook.com/u/delu_agent" target="_blank" rel="noopener noreferrer"
               className={`text-[9px] ${dim} hover:text-white transition-colors`}>
              agent: @delu_agent
            </a>
          </div>
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

  // Use Next.js API routes as proxy — avoids CORS issues with raw.githubusercontent.com
  const RAW = '';

  const [lastFetch, setLastFetch] = useState(0);
  const [fetchCount, setFetchCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const ts = Date.now();
      const [s, b] = await Promise.all([
        fetch(`/api/status?t=${ts}`, { cache: 'no-store' }).then(r => r.json()),
        fetch(`/api/brain?t=${ts}`,  { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      ]);
      setStatus(s);
      setBrain(b);
      setLastFetch(Date.now());
      setFetchCount(n => n + 1);
    } catch (e: any) { setError(e.message); }
  }, []); // eslint-disable-line

  const [tick, setTick] = useState(0);
  useEffect(() => {
    load();
    const t  = setInterval(load, 30_000); // fetch every 30s (was 60s)
    const t2 = setInterval(() => setTick(n => n + 1), 5_000); // tick every 5s for countdown
    return () => { clearInterval(t); clearInterval(t2); };
  }, []); // eslint-disable-line

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
        <LegacySection />
        <ReasoningGraph    status={status} />
        <BrainSection           brain={brain ?? status?.autoresearch} />
        <SelfImprovementSection brain={brain ?? status?.autoresearch} />
        <CapitalSection         status={status} />
        <CyclesSection    cycles={status?.cycleHistory ?? []} />
        <TradeHistory     status={status} />
        <Footer           stack={status?.stack} />
      </div>
    </main>
  );
}
