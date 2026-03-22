"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Zap, Brain, BarChart2, Eye, RefreshCw, ArrowUpRight } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const pnlColor = (n?: number | null) =>
  !n || n === 0 ? 'text-[#6b7280]' : n > 0 ? 'text-emerald-400' : 'text-red-400';

const mono = (...cls: string[]) => ['font-mono tracking-tight', ...cls].join(' ');

const shortDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const walletShort = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '0xed2c…09da';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG   = 'bg-[#0a0a0f]';
const CARD = 'bg-[#0f0f17] border border-[#1e1e2e]';
const DIM  = 'text-[#6b7280]';
const LABEL = 'text-[9px] uppercase tracking-[0.2em] text-[#4b5563] font-bold';

// ── Sub-components ────────────────────────────────────────────────────────────
const Pill = ({ color, label }: { color: string; label: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${color}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
    {label}
  </span>
);

const StatBox = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) => (
  <div className="flex flex-col gap-0.5">
    <div className={LABEL}>{label}</div>
    <div className={mono('text-lg font-bold', accent || 'text-[#e2e8f0]')}>{value}</div>
    {sub && <div className={`text-[10px] ${DIM}`}>{sub}</div>}
  </div>
);

const LoopBadge = ({ name, color }: { name: string; color: string }) => {
  const colors: Record<string, string> = {
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${colors[color] || colors.blue}`}>
      {name}
    </span>
  );
};

// Action badge for cycle rows
const ActionBadge = ({ action, asset }: { action: string; asset?: string }) => {
  if (action === 'buy' || action === 'long') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
        <ArrowUpRight size={9} />
        BUY {asset || ''}
      </span>
    );
  }
  if (action === 'sell') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
        SELL {asset || ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#111118] text-[#6b7280] border border-[#1e1e2e] uppercase">
      HOLD
    </span>
  );
};

// ── Sections ──────────────────────────────────────────────────────────────────

function HeroSection({ status, brain }: { status: any; brain: any }) {
  const w = status?.wallet || {};
  const pnl = w.unrealPnlUSD || 0;
  const integrations = [
    { label: 'Bankr',        live: true  },
    { label: 'Venice AI',    live: true  },
    { label: 'Checkr x402',  live: true  },
    { label: 'Alchemy',      live: true  },
  ];

  return (
    <section className="border-b border-[#1e1e2e] pb-8 mb-8">
      {/* Name + wallet */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#e2e8f0]">delu</h1>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[#1e1e2e] text-[#6b7280] font-mono">Base mainnet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={mono('text-xs', DIM)}>
              {walletShort('0xed2ceca9de162c4f2337d7c1ab44ee9c427709da')}
            </span>
            <a href="https://basescan.org/address/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da"
               target="_blank" rel="noopener noreferrer"
               className={`${DIM} hover:text-[#e2e8f0] transition-colors`}>
              <ExternalLink size={11} />
            </a>
          </div>
          <p className="mt-2 text-sm text-[#9ca3af] max-w-md">
            Autonomous onchain trading agent. Learns from every trade. Earns yield when idle.
          </p>
        </div>

        {/* Integration pills */}
        <div className="flex flex-col gap-1.5 items-end">
          {integrations.map(i => (
            <Pill key={i.label}
              color={i.live
                ? 'border-emerald-500/20 text-emerald-400'
                : 'border-amber-500/20 text-amber-400'}
              label={i.label}
            />
          ))}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1e1e2e] rounded-xl overflow-hidden">
        {[
          { label: 'Portfolio',    value: `$${(w.totalUSD || 0).toFixed(2)}`,   sub: 'total wallet value' },
          { label: 'Liquid USDC',  value: `$${(w.liquidUSDC || 0).toFixed(2)}`, sub: 'ready to trade' },
          { label: 'Unrealised P&L', value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
            sub: `${(w.unrealPnlPct || 0).toFixed(2)}%`, accent: pnlColor(pnl) },
          { label: 'Next Cycle',   value: status?.nextCycle || '—', sub: 'every 30 min' },
        ].map(s => (
          <div key={s.label} className="bg-[#0a0a0f] px-4 py-3">
            <StatBox {...s} />
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: <Eye size={16} />,
      title: 'Observe',
      color: 'text-blue-400',
      bg: 'bg-blue-500/5 border-blue-500/15',
      body: 'Pulls onchain data via Alchemy — price bars, transfer stats, wallet accumulation, whale concentration. Social signals from Checkr (x402 micropayments) — attention scores, spikes, narrative rotation across 1h/4h/8h/12h windows.',
    },
    {
      icon: <Brain size={16} />,
      title: 'Think',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/5 border-indigo-500/15',
      body: 'Quant brain scores each token across four timeframe strategies (5m, hourly, onchain, daily). Each strategy has its own evolved parameters — RSI zones, volume burst thresholds, BTC correlation, smart wallet signals.',
    },
    {
      icon: <Zap size={16} />,
      title: 'Decide',
      color: 'text-amber-400',
      bg: 'bg-amber-500/5 border-amber-500/15',
      body: 'Produces a confidence score. Above threshold → buy with Kelly-sized position. Below threshold → hold and deploy surplus USDC to the best yield vault (Aave v3, Morpho, Moonwell). Capital is never idle by accident.',
    },
    {
      icon: <RefreshCw size={16} />,
      title: 'Learn',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5 border-emerald-500/15',
      body: 'After every trade, the brain runs experiments — mutating strategy parameters, evaluating against real outcomes. Bad trades lower scores, good trades reinforce them. 11,000+ experiments run so far.',
    },
  ];

  return (
    <section className="mb-8">
      <div className={`${LABEL} mb-4`}>How It Works</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <div key={s.title} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`${s.color}`}>{s.icon}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${DIM}`}>{i + 1}</span>
                <span className={`text-sm font-semibold ${s.color}`}>{s.title}</span>
              </div>
            </div>
            <p className="text-[11px] text-[#9ca3af] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BrainSection({ brain, ar }: { brain: any; ar: any }) {
  const totalExp    = brain?.totalExp || 0;
  const topScore    = brain?.topScore || 0;
  const TARGET      = 35;
  const progress    = Math.min(100, (topScore / TARGET) * 100);

  const loops = brain?.loops || [];

  const loopColorMap: Record<string, string> = {
    orange:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
    indigo:  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  const barColorMap: Record<string, string> = {
    orange:  'bg-orange-500',
    indigo:  'bg-indigo-500',
    emerald: 'bg-emerald-500',
    blue:    'bg-blue-500',
  };

  return (
    <section className={`${CARD} rounded-2xl p-5 mb-4`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className={`${LABEL} mb-1`}>Self-Improving Brain</div>
          <div className="flex items-end gap-3">
            <span className={mono('text-4xl font-bold text-[#e2e8f0]')}>{topScore.toFixed(1)}</span>
            <span className={`${DIM} text-sm mb-1`}>/ {TARGET} target</span>
          </div>
          <p className="text-[10px] text-[#6b7280] mt-1 max-w-xs">
            Brain score reflects cumulative learning. Higher = more refined signal extraction. Each experiment tweaks strategy parameters and is evaluated against real Base token outcomes.
          </p>
        </div>
        <div className="text-right">
          <div className={`${LABEL} mb-1`}>Total Experiments</div>
          <div className={mono('text-2xl font-bold text-[#e2e8f0]')}>{totalExp.toLocaleString()}</div>
          <div className={`text-[10px] ${DIM} mt-0.5`}>{brain?.totalAccepted || 0} improvements accepted</div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-5">
        <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-700"
               style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-[9px] ${DIM}`}>0</span>
          <span className={`text-[9px] ${DIM}`}>Target {TARGET}</span>
        </div>
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loops.map((loop: any) => {
          const maxScore = brain?.topScore || 1;
          const barPct = Math.min(100, (loop.bestScore / maxScore) * 100);
          const cmap = loopColorMap[loop.color] || loopColorMap.blue;
          const bmap = barColorMap[loop.color] || barColorMap.blue;

          return (
            <div key={loop.name} className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <LoopBadge name={loop.name} color={loop.color} />
                <span className={mono('text-xs font-bold', cmap.split(' ')[0])}>{loop.bestScore?.toFixed(1)}</span>
              </div>
              {/* Mini bar */}
              <div className="h-0.5 bg-[#1e1e2e] rounded-full mb-2.5">
                <div className={`h-full rounded-full ${bmap}`} style={{ width: `${barPct}%` }} />
              </div>
              <div className={`text-[10px] ${DIM} mb-2`}>
                {loop.expCount?.toLocaleString()} experiments · {loop.acceptedCount} accepted
              </div>
              {/* Signal tags */}
              <div className="flex flex-wrap gap-1">
                {(loop.signals || []).map((sig: string) => (
                  <span key={sig} className="text-[9px] px-1.5 py-0.5 rounded bg-[#111118] border border-[#1e1e2e] text-[#9ca3af]">
                    {sig}
                  </span>
                ))}
              </div>
              {loop.latestDescription && (
                <div className="mt-2 text-[9px] text-[#4b5563] italic leading-relaxed line-clamp-2">
                  Latest: {loop.latestDescription}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CapitalSection({ status }: { status: any }) {
  const w        = status?.wallet  || {};
  const yld      = status?.yield   || {};
  const total    = w.totalUSD    || 0;
  const liquid   = w.liquidUSDC  || 0;
  const yieldAmt = yld.amountUSD || 0;
  const posAmt   = w.positionsUSD || 0;
  const ethBtc   = Math.max(0, total - liquid - posAmt);

  // Compute proportions
  const safe     = total > 0 ? (liquid / total)  * 100 : 0;
  const yldPct   = total > 0 ? (yieldAmt / total) * 100 : 0;
  const posPct   = total > 0 ? (posAmt / total)   * 100 : 0;
  const otherPct = Math.max(0, 100 - safe - yldPct - posPct);

  const bars = [
    { label: 'Liquid USDC',    pct: safe,     color: 'bg-indigo-500',  val: liquid   },
    { label: 'Active Trades',  pct: posPct,   color: 'bg-emerald-500', val: posAmt   },
    { label: 'ETH / cbBTC',    pct: otherPct, color: 'bg-[#374151]',   val: ethBtc   },
  ].filter(b => b.val > 0 || b.label === 'Liquid USDC');

  const openPos = status?.positions || [];

  return (
    <section className={`${CARD} rounded-2xl p-5 mb-4`}>
      <div className={`${LABEL} mb-4`}>Capital Allocation</div>

      {/* Stacked bar */}
      <div className="h-2 flex rounded-full overflow-hidden gap-0.5 mb-3">
        {bars.map(b => (
          <div key={b.label} className={`${b.color} h-full transition-all`}
               style={{ width: `${Math.max(b.pct, 0.5)}%` }} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-sm ${b.color}`} />
            <span className="text-[10px] text-[#9ca3af]">{b.label}</span>
            <span className={mono('text-[10px] text-[#e2e8f0]')}>${b.val.toFixed(2)}</span>
            <span className={`text-[9px] ${DIM}`}>({b.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>

      {/* Yield detail */}
      <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Yield Position</span>
          {yld.apy > 0
            ? <span className="text-[10px] text-emerald-400 font-mono">{yld.apy?.toFixed(2)}% APY</span>
            : <span className={`text-[10px] ${DIM}`}>deploying next cycle</span>
          }
        </div>
        <div className={mono('text-sm font-bold text-[#e2e8f0]')}>${yieldAmt.toFixed(2)}</div>
        <div className={`text-[10px] ${DIM} mt-0.5`}>{yld.protocol || 'Bankr Wallet'} · {yld.vault || 'Liquid USDC'}</div>
      </div>

      {/* Open positions or empty state */}
      {openPos.length > 0 ? (
        <div className="space-y-2">
          {openPos.map((p: any, i: number) => {
            const pnl = p.currentUSD && p.sizeUSD ? ((p.currentUSD - p.sizeUSD) / p.sizeUSD * 100) : null;
            return (
              <div key={i} className="flex items-center justify-between bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-[#e2e8f0]">{p.sym}</span>
                <span className={mono('text-xs', pnlColor(pnl))}>
                  {pnl != null ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%` : '—'}
                </span>
                <span className={mono('text-xs text-[#9ca3af]')}>${(p.currentUSD || p.sizeUSD || 0).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={`text-[11px] ${DIM} italic`}>
          No active positions. Capital deployed when conviction ≥ 65%. Most cycles result in HOLD — this is by design.
        </p>
      )}
    </section>
  );
}

function CycleRow({ cycle, idx }: { cycle: any; idx: number }) {
  const [open, setOpen] = useState(false);
  const isTrade = cycle.action === 'buy' || cycle.action === 'long' || cycle.action === 'sell';

  return (
    <div className={`border-b border-[#1e1e2e] last:border-0 ${isTrade ? 'bg-emerald-500/2' : ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#111118] transition-colors"
      >
        {/* Timestamp */}
        <span className={mono('text-[10px] shrink-0 w-28', DIM)}>
          {shortDate(cycle.ts)}
        </span>

        {/* Badge */}
        <span className="shrink-0">
          <ActionBadge action={cycle.action} asset={cycle.asset} />
        </span>

        {/* Reasoning */}
        <span className={`text-[11px] ${DIM} flex-1 truncate`}>
          {cycle.reasoning?.slice(0, 100) || '—'}
        </span>

        {/* Expand */}
        <span className={`${DIM} shrink-0`}>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-0">
          <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3 text-[11px] text-[#9ca3af] leading-relaxed">
            <div className="mb-2 font-semibold text-[#e2e8f0]">Full Reasoning</div>
            <div className="mb-2">{cycle.reasoning || '—'}</div>

            {/* Trending entries */}
            {(cycle.trendingEntries || []).length > 0 && (
              <div className="mt-3 border-t border-[#1e1e2e] pt-2">
                <div className={`${LABEL} mb-1.5`}>Screened Tokens</div>
                <div className="space-y-1">
                  {cycle.trendingEntries.slice(0, 5).map((t: any) => (
                    <div key={t.symbol} className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#e2e8f0] w-20">{t.symbol}</span>
                      <span className={mono('text-[10px]', t.score >= 0.65 ? 'text-emerald-400' : DIM)}>
                        score {(t.score || 0).toFixed(2)}
                      </span>
                      {t.ret1h != null && (
                        <span className={mono('text-[10px]', pnlColor(t.ret1h))}>
                          1h {t.ret1h >= 0 ? '+' : ''}{(t.ret1h * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Position updates */}
            {(cycle.positionUpdates || []).length > 0 && (
              <div className="mt-3 border-t border-[#1e1e2e] pt-2">
                <div className={`${LABEL} mb-1.5`}>Position Updates</div>
                {cycle.positionUpdates.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="text-[10px] text-[#9ca3af]">
                    {p.sym}: {p.reasoning?.slice(0, 80) || '—'}
                  </div>
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
  const display = showAll ? cycles : cycles.slice(0, 15);

  return (
    <section className={`${CARD} rounded-2xl overflow-hidden mb-4`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
        <div className={LABEL}>Intelligence Cycles</div>
        <span className={`text-[10px] ${DIM}`}>{cycles.length} cycles · every 30 min</span>
      </div>

      <div>
        {display.map((c, i) => <CycleRow key={i} cycle={c} idx={i} />)}
      </div>

      {cycles.length > 15 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className={`w-full py-2.5 text-[10px] ${DIM} hover:text-[#e2e8f0] border-t border-[#1e1e2e] transition-colors`}
        >
          {showAll ? 'Show less' : `Show all ${cycles.length} cycles`}
        </button>
      )}
    </section>
  );
}

function PerformanceSection({ status }: { status: any }) {
  const perf = status?.performance || {};
  const trades = perf.recentTrades || [];
  if (trades.length === 0) return null;

  const closed = perf.closedTrades || 0;
  const winStr = perf.winRate || '0/0';
  const wins = parseInt(winStr.split('/')[0]) || 0;
  const winPct = closed > 0 ? ((wins / closed) * 100).toFixed(0) : '0';

  return (
    <section className={`${CARD} rounded-2xl p-5 mb-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className={LABEL}>Trade History</div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] ${DIM}`}>{closed} closed</span>
          <span className={mono('text-[10px]', parseInt(winPct) >= 50 ? 'text-emerald-400' : 'text-red-400')}>
            {winPct}% win rate
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        {trades.slice(0, 8).map((t: any, i: number) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#1e1e2e] last:border-0">
            <span className={mono('text-xs font-semibold text-[#e2e8f0] w-24 truncate')}>{t.sym}</span>
            <span className={mono('text-xs', t.won ? 'text-emerald-400' : 'text-red-400')}>
              {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct?.toFixed(2)}%
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              t.regime === 'BEAR' ? 'border-red-500/20 text-red-400 bg-red-500/5' :
              t.regime === 'BULL' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
              'border-[#1e1e2e] text-[#6b7280] bg-[#0a0a0f]'
            }`}>{t.regime || '—'}</span>
            {t.closedAt && (
              <span className={`text-[10px] ${DIM} ml-auto`}>
                {shortDate(t.closedAt)}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Stack footer ──────────────────────────────────────────────────────────────
function StackSection({ stack }: { stack: any }) {
  if (!stack) return null;
  const items = [
    { label: 'Execution',    val: stack.execution },
    { label: 'Reasoning',    val: stack.reasoning },
    { label: 'Social Data',  val: stack.socialData },
    { label: 'Onchain Data', val: stack.onchainData },
    { label: 'Research',     val: stack.research },
    { label: 'Stop Mgmt',    val: stack.stopMgmt },
  ];
  return (
    <section className="border-t border-[#1e1e2e] pt-6 pb-8">
      <div className={`${LABEL} mb-3`}>Tech Stack</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map(i => i.val ? (
          <div key={i.label} className="flex gap-2 text-[10px]">
            <span className={`${DIM} shrink-0 w-24`}>{i.label}</span>
            <span className="text-[#9ca3af]">{i.val}</span>
          </div>
        ) : null)}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <a href="https://github.com/deluagent/delu-agent" target="_blank" rel="noopener noreferrer"
           className={`flex items-center gap-1.5 text-[10px] ${DIM} hover:text-[#e2e8f0] transition-colors`}>
          <ExternalLink size={10} /> delu-agent on GitHub
        </a>
        <a href="https://synthesis.devfolio.co/projects/delu-autonomous-agent-with-skin-in-the-game-7115"
           target="_blank" rel="noopener noreferrer"
           className={`flex items-center gap-1.5 text-[10px] ${DIM} hover:text-[#e2e8f0] transition-colors`}>
          <ExternalLink size={10} /> Hackathon Submission
        </a>
      </div>
    </section>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [status, setStatus] = useState<any>(null);
  const [brain,  setBrain]  = useState<any>(null);
  const [error,  setError]  = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        fetch('/data/status.json', { cache: 'no-store' }).then(r => r.json()),
        fetch('/data/brain.json',  { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      ]);
      setStatus(s);
      setBrain(b);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  const cycles = status?.cycleHistory || [];
  const ar     = status?.autoresearch  || {};

  if (error) return (
    <div className={`min-h-screen ${BG} flex items-center justify-center`}>
      <p className="text-red-400 text-sm font-mono">{error}</p>
    </div>
  );

  if (!status) return (
    <div className={`min-h-screen ${BG} flex items-center justify-center`}>
      <div className="flex items-center gap-2 text-[#6b7280] text-sm">
        <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        Loading delu…
      </div>
    </div>
  );

  return (
    <main className={`min-h-screen ${BG} text-[#e2e8f0]`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <HeroSection   status={status} brain={brain} />
        <HowItWorksSection />
        <BrainSection  brain={brain}   ar={ar} />
        <CapitalSection status={status} />
        <CyclesSection  cycles={cycles} />
        <PerformanceSection status={status} />
        <StackSection  stack={status?.stack} />

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <span className={`text-[10px] ${DIM}`}>
            delu · updated {status?.updatedAt ? shortDate(status.updatedAt) : '—'} · Base mainnet
          </span>
        </div>
      </div>
    </main>
  );
}