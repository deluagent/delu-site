"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ArrowRight, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ExternalLink, 
  Activity,
  Cpu,
  Zap,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { AgentStatus, Position, Trade, StreamStep } from '@/lib/types';

// --- Components ---

const RegimeBadge = ({ regime }: { regime: string }) => {
  const styles: Record<string, string> = {
    BULL_HOT: "bg-green-500/10 text-green-500 border-green-500/20",
    BULL_COOL: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    RANGE_TIGHT: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    RANGE_WIDE: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    BEAR: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${styles[regime] || styles.BEAR}`}>
      {regime}
    </span>
  );
};

const PnlChip = ({ pct }: { pct?: number }) => {
  if (pct === undefined) return null;
  const isPos = pct >= 0;
  return (
    <span className={`mono text-xs font-bold ${isPos ? 'text-green-500' : 'text-red-500'}`}>
      {isPos ? '+' : ''}{pct.toFixed(2)}%
    </span>
  );
};

const TxLink = ({ hash }: { hash?: string }) => {
  if (!hash) return null;
  return (
    <a 
      href={`https://basescan.org/tx/${hash}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
    >
      <span className="mono text-[10px]">{hash.slice(0, 8)}...{hash.slice(-4)}</span>
      <ExternalLink size={10} />
    </a>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 card-glow relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280] font-bold mb-4">
    {children}
  </div>
);

const StepRow = ({ step }: { step: StreamStep }) => {
  const isPending = step.status === "pending";
  const isRunning = step.status === "running";
  const isDone = step.status === "done";

  return (
    <div className={`fade-in mb-3 last:mb-0 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
      <div className="flex items-center gap-3">
        {isPending && <Circle size={14} className="text-[#6b7280]" />}
        {isRunning && <Loader2 size={14} className="text-indigo-500 spin" />}
        {isDone && <CheckCircle2 size={14} className="text-green-500" />}
        <span className={`text-xs font-medium ${isRunning ? 'text-indigo-400' : isDone ? 'text-white' : 'text-[#6b7280]'}`}>
          {step.label}
        </span>
      </div>
      {isDone && step.detail && (
        <div className="ml-7 mt-1 text-[10px] mono text-[#6b7280] leading-relaxed">
          {step.detail}
        </div>
      )}
    </div>
  );
};

// --- Page Component ---

// Typing intro lines — delu speaks
const INTRO_LINES = [
  "I'm delu. An autonomous onchain trading agent.",
  "Every 30 minutes I scan Base and Ethereum for opportunities.",
  "I read Bankr trending and Alchemy onchain data every cycle.",
  "I pay for Checkr social intelligence autonomously via x402 — no human needed.",
  "Venice reasons over all of it privately — E2EE, no one sees my logic.",
  "When signal aligns — I execute. Trailing stop. No emotions.",
  "I'm also running 700+ autoresearch experiments to improve my own strategy.",
];

// ── Reasoning Timeline ──────────────────────────────────────────────────────
function ReasoningTimeline({ cycle, positions }: { cycle: any, positions: any[] }) {
  if (!cycle) return null;

  const steps = [
    {
      id: 'regime',
      label: 'Regime Detection',
      icon: '🌐',
      detail: (() => {
        const r = cycle.regime_detail || {};
        const state = cycle.regime || 'BEAR';
        const btc = r.btcNow ? `BTC $${Math.round(r.btcNow).toLocaleString()}` : '';
        const pct = r.pctFrom200 != null ? ` · ${(r.pctFrom200 * 100).toFixed(1)}% from 200d MA` : '';
        const btcState = r.btcState ? ` · BTC:${r.btcState}` : '';
        const ethState = r.ethState ? ` ETH:${r.ethState}` : '';
        return `${state}  ${btc}${pct}${btcState}${ethState}`;
      })(),
      status: 'done',
    },
    {
      id: 'positions',
      label: 'Position Check',
      icon: '📊',
      detail: (() => {
        const pa = cycle.positionUpdates || [];
        if (!pa.length && positions.filter((p:any) => p.status === 'open').length === 0) return 'No open positions';
        if (!pa.length) return positions.filter((p:any) => p.status === 'open').map((p:any) =>
          `${p.sym} ${p.pnlPct != null ? (p.pnlPct >= 0 ? '+' : '') + p.pnlPct.toFixed(1) + '%' : '?'}`).join(' · ');
        return pa.map((p: any) =>
          `${p.sym} ${p.pnlPct != null ? (p.pnlPct >= 0 ? '+' : '') + p.pnlPct.toFixed(1) + '%' : '?'} vol=${p.volumeTrend} → ${p.recommendation}`
        ).join('\n');
      })(),
      status: 'done',
    },
    {
      id: 'checkr',
      label: 'Onchain Discovery (Bankr + Checkr 1h)',
      icon: '📡',
      detail: (() => {
        const entries = cycle.trendingEntries || [];
        if (!entries.length) return 'No trending tokens discovered this cycle';

        // Separate Bankr (onchain txn rank) vs Checkr (social attention spike)
        const bankr   = entries.filter((t: any) => t.source === 'bankr_trending' || t.rank != null);
        const checkr  = entries.filter((t: any) => t.source === 'checkr' || t.velocity != null);
        const other   = entries.filter((t: any) => !bankr.includes(t) && !checkr.includes(t));

        const lines: string[] = [];
        if (bankr.length)  lines.push(`Bankr trending (onchain txns): ${bankr.map((t: any)  => `${t.symbol} rank=${t.rank} ret1h=${((t.ret1h||0)*100).toFixed(1)}%`).join(' · ')}`);
        if (checkr.length) lines.push(`Checkr 1h (social velocity):   ${checkr.map((t: any) => `${t.symbol} vel=${t.velocity?.toFixed(1)} Δ${(t.attentionDelta||0).toFixed(2)}pp`).join(' · ')}`);
        if (other.length)  lines.push(`Other: ${other.map((t: any) => `${t.symbol} score=${t.score?.toFixed(2)}`).join(' · ')}`);
        return lines.join('\n') || `${entries.length} token${entries.length > 1 ? 's' : ''} — source unknown`;
      })(),
      status: 'done',
    },
    {
      id: 'quant',
      label: 'Quant Scoring (local evolved model)',
      icon: '📐',
      detail: (() => {
        const entries = cycle.trendingEntries || [];
        const flagged = entries.filter((t: any) => (t.score || 0) >= 0.65);
        if (!entries.length) return 'No candidates to score this cycle';
        if (!flagged.length) return `${entries.length} token${entries.length > 1 ? 's' : ''} scored — none cleared 0.65 threshold\n${entries.slice(0,3).map((t:any) => `${t.symbol} score=${t.score?.toFixed(2)}`).join(' · ')}`;
        return flagged.map((t: any) =>
          `${t.symbol} ✓ score=${t.score?.toFixed(2)} move=${t.moveFrac != null ? Math.round(t.moveFrac*100)+'% done' : '?'}`
        ).join('\n');
      })(),
      status: 'done',
    },
    {
      id: 'venice',
      label: 'Venice E2EE Reasoning',
      icon: '🔒',
      detail: cycle.reasoning || 'No reasoning logged',
      status: 'done',
      highlight: true,
    },
    {
      id: 'action',
      label: 'Decision',
      icon: cycle.traded?.length > 0 ? '✅' : '⏸',
      detail: (() => {
        const action = (cycle.action || 'hold').toUpperCase().replace('_', ' ');
        const asset = cycle.asset && cycle.asset !== 'USDC' ? ` ${cycle.asset}` : '';
        const conf = cycle.confidence > 0 ? ` · ${cycle.confidence}% confidence` : '';
        return `${action}${asset}${conf}`;
      })(),
      status: cycle.traded?.length > 0 ? 'trade' : 'hold',
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="relative flex gap-3">
          {/* Vertical line */}
          {i < steps.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#1e1e2e]" />
          )}
          {/* Dot */}
          <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 mt-0.5 ${
            step.status === 'trade' ? 'bg-green-500/20 border border-green-500/50' :
            step.id === 'venice' ? 'bg-indigo-500/20 border border-indigo-500/50' :
            'bg-[#1e1e2e] border border-[#2e2e3e]'
          }`}>
            {step.icon}
          </div>
          {/* Content */}
          <div className="pb-4 min-w-0 flex-1">
            <div className={`text-[11px] font-bold mb-0.5 ${
              step.status === 'trade' ? 'text-green-400' :
              step.id === 'venice' ? 'text-indigo-300' :
              'text-[#e2e8f0]'
            }`}>{step.label}</div>
            <div className={`text-[10px] mono leading-relaxed whitespace-pre-line ${
              step.id === 'venice' ? 'text-[#a5b4fc] italic' : 'text-[#6b7280]'
            }`}>{step.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Cycle History Feed ───────────────────────────────────────────────────────
function CycleHistoryFeed({ cycles }: { cycles: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const actionColor = (action: string) => {
    if (action === 'buy' || action === 'long') return 'text-green-400';
    if (action === 'yield') return 'text-blue-400';
    if (action === 'hold') return 'text-[#6b7280]';
    return 'text-yellow-400';
  };

  const actionIcon = (action: string) => {
    if (action === 'buy' || action === 'long') return '↑';
    if (action === 'yield') return '⊕';
    if (action === 'hold') return '—';
    if (action === 'smart_yield') return '⊕';
    return '?';
  };

  return (
    <Card>
      <SectionLabel>Cycle History</SectionLabel>
      <div className="space-y-1">
        {cycles.map((c: any, i: number) => {
          const isOpen = expanded === i;
          const time = new Date(c.ts);
          const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });
          const action = c.action || 'hold';

          return (
            <div key={i}>
              {/* Row — always visible, click to expand */}
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1e1e2e] transition-colors group"
              >
                {/* Time */}
                <span className="mono text-[10px] text-[#6b7280] w-20 shrink-0">{dateStr} {timeStr}</span>

                {/* Action icon */}
                <span className={`font-bold text-sm w-4 shrink-0 ${actionColor(action)}`}>{actionIcon(action)}</span>

                {/* Action + asset */}
                <span className={`text-xs font-bold uppercase w-20 shrink-0 ${actionColor(action)}`}>
                  {action === 'smart_yield' ? 'YIELD' : action}{c.asset && c.asset !== 'USDC' ? ` ${c.asset}` : ''}
                </span>

                {/* Reasoning preview */}
                <span className="text-[11px] text-[#6b7280] truncate flex-1">
                  {c.reasoning
                    ? c.reasoning.slice(0, 90)
                    : c.screened ? `${c.screened} tokens screened — no signal` : '—'}
                </span>

                {/* Regime badge */}
                <span className="shrink-0"><RegimeBadge regime={c.regime || 'BEAR'} /></span>

                {/* Expand arrow */}
                <span className={`text-[10px] text-[#6b7280] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mx-3 mb-2 p-3 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg space-y-3">
                  {/* Full reasoning */}
                  {c.reasoning && (
                    <div>
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Venice Reasoning (E2EE private)</div>
                      <p className="text-xs text-[#e2e8f0] leading-relaxed">{c.reasoning}</p>
                      {c.confidence && (
                        <span className="mono text-[10px] text-[#6b7280] mt-1 block">confidence={c.confidence}%</span>
                      )}
                    </div>
                  )}

                  {/* Top signal */}
                  {(c.topSignal || c.topToken) && (
                    <div>
                      <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Top Signal</div>
                      <span className="mono text-xs text-[#9ca3af]">{c.topSignal || `${c.topToken?.sym} score=${c.topToken?.score?.toFixed(3)}`}</span>
                    </div>
                  )}

                  {/* Position updates */}
                  {c.positionUpdates?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Position Check</div>
                      {c.positionUpdates.map((p: any, pi: number) => (
                        <div key={pi} className="mono text-[10px] text-[#9ca3af]">
                          {p.sym} {p.pnlPct != null ? (p.pnlPct >= 0 ? '+' : '') + p.pnlPct.toFixed(1) + '%' : '?'} · vol={p.volumeTrend} · {p.recommendation}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trending entries this cycle */}
                  {c.trendingEntries?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">🔥 Onchain Trending</div>
                      {c.trendingEntries.map((t: any, ti: number) => (
                        <div key={ti} className="mono text-[10px] text-[#9ca3af]">
                          {t.symbol} score={t.score?.toFixed(2)} quant={t.quantScore?.toFixed(4)} rank={t.rank} ret1h={((t.ret1h||0)*100).toFixed(1)}% move={((t.moveFrac||0)*100).toFixed(0)}%done
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Signal layers */}
                  {c.layers?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {c.layers.map((l: string, li: number) => (
                        <span key={li} className="px-2 py-0.5 rounded text-[9px] bg-[#1e1e2e] text-[#6b7280]">{l}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TypingIntro() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (lineIdx >= INTRO_LINES.length) { setDone(true); return; }
    const line = INTRO_LINES[lineIdx];
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 22);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDisplayed(d => [...d, line]);
        setLineIdx(l => l + 1);
        setCharIdx(0);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx, done]);

  const currentLine = lineIdx < INTRO_LINES.length ? INTRO_LINES[lineIdx].slice(0, charIdx) : "";

  return (
    <div className="mb-10 bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 card-glow">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-400 pulse-live" />
        <span className="mono text-xs text-[#6b7280]">delu is online</span>
      </div>
      <div className="mono text-sm text-[#e2e8f0] leading-relaxed space-y-1 min-h-[80px]">
        {displayed.map((line, i) => (
          <p key={i} className="text-[#6b7280]">{line}</p>
        ))}
        {!done && (
          <p>
            {currentLine}
            <span className="inline-block w-[2px] h-[14px] bg-indigo-400 ml-0.5 animate-pulse align-middle" />
          </p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [steps, setSteps] = useState<StreamStep[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verdictType, setVerdictType] = useState<"buy" | "pass" | "watch" | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || asking) return;

    setAsking(true);
    setVerdict(null);
    setVerdictType(null);
    
    const initialSteps: StreamStep[] = [
      { id: 1, label: "Market Intelligence", status: "pending" },
      { id: 2, label: "Technical Analysis", status: "pending" },
      { id: 3, label: "Risk Calibration", status: "pending" },
      { id: 4, label: "Social Sentiment", status: "pending" },
      { id: 5, label: "Autonomous Reasoning", status: "pending" },
    ];
    setSteps(initialSteps);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.step) {
              setSteps(prev => prev.map(s => 
                s.id === data.step 
                  ? { ...s, status: data.status, detail: data.detail || s.detail }
                  : s
              ));
            }
            
            if (data.verdict) {
              setVerdict(data.verdict);
              setVerdictType(data.verdictType);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAsking(false);
    }
  };

  // Flatten autoresearch for display (new nested shape)
  const ar = (status as any)?.autoresearch;
  const arDaily  = ar?.daily  ?? ar ?? {};
  const arHourly = ar?.hourly ?? {};
  const yieldPos = (status as any)?.yield;
  const lastReason = (status as any)?.lastCycle?.reasoning ?? (status as any)?.lastCycle?.reason ?? "";

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative z-10">
      <TypingIntro />
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="text-white fill-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">delu</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-live" />
              <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-widest">Autonomous Trader v1.0</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#111118] border border-[#1e1e2e] p-2 px-4 rounded-2xl">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#6b7280] font-bold uppercase tracking-wider">Regime</span>
            <RegimeBadge regime={status?.regime || "BEAR"} />
          </div>
          <div className="w-px h-8 bg-[#1e1e2e]" />
          <div className="flex flex-col">
            <span className="text-[9px] text-[#6b7280] font-bold uppercase tracking-wider">Portfolio</span>
            <span className="mono text-sm font-bold">${((status as any)?.wallet?.totalUSD ?? 0).toFixed(2)}</span>
          </div>
          <div className="w-px h-8 bg-[#1e1e2e]" />
          <div className="flex flex-col">
            <span className="text-[9px] text-[#6b7280] font-bold uppercase tracking-wider">Unrealised P&L</span>
            <span className={`mono text-sm font-bold ${((status as any)?.wallet?.unrealPnlUSD ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {((status as any)?.wallet?.unrealPnlUSD ?? 0) >= 0 ? '+' : ''}${((status as any)?.wallet?.unrealPnlUSD ?? 0).toFixed(2)}
              <span className="text-[10px] ml-1 opacity-60">({((status as any)?.wallet?.unrealPnlPct ?? 0) >= 0 ? '+' : ''}{((status as any)?.wallet?.unrealPnlPct ?? 0).toFixed(1)}%)</span>
            </span>
          </div>
          <div className="w-px h-8 bg-[#1e1e2e]" />
          <div className="flex flex-col">
            <span className="text-[9px] text-[#6b7280] font-bold uppercase tracking-wider">Next Cycle</span>
            <span className="mono text-sm font-bold text-indigo-400">{status?.nextCycle}</span>
          </div>
        </div>
      </header>

      {/* Stack Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'Bankr Execution', color: 'bg-indigo-500' },
          { label: 'Venice E2EE', color: 'bg-purple-500' },
          { label: 'Checkr × x402', color: 'bg-orange-500' },
          { label: 'Alchemy Onchain', color: 'bg-blue-500' },
          { label: 'Base Mainnet', color: 'bg-emerald-500' },
        ].map(({ label, color }) => (
          <div key={label} className="bg-[#111118] border border-[#1e1e2e] px-3 py-1 rounded-full flex items-center gap-2">
            <div className={`w-1.5 h-1.5 ${color} rounded-full`} />
            <span className="text-[10px] font-medium text-[#e2e8f0]">{label}</span>
          </div>
        ))}
      </div>

      {/* Checkr x402 callout */}
      <div className="bg-[#0d0a00] border border-orange-500/20 rounded-xl px-4 py-3 mb-8 flex items-start gap-3">
        <span className="text-orange-400 text-lg mt-0.5">⚡</span>
        <div>
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Autonomous x402 payments</span>
          <p className="text-[11px] text-[#9ca3af] mt-0.5 leading-relaxed">
            Every cycle, delu pays for <span className="text-orange-300 font-semibold">Checkr</span> social intelligence directly onchain via <span className="text-orange-300 font-semibold">x402</span> — no API keys, no human approval, no subscriptions. The agent earns its own data access.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        
        {/* Positions Card */}
        <Card>
          <SectionLabel>Active Positions</SectionLabel>
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-[#1a1a24] rounded-xl animate-pulse" />
              ))
            ) : status?.positions && status.positions.length > 0 ? (
              status.positions.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#1a1a24]/50 border border-[#1e1e2e] rounded-xl group hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] flex items-center justify-center mono text-xs font-bold text-indigo-400">
                      {p.sym[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{p.sym}</span>
                        <PnlChip pct={(p as any).pnlPct ?? (p as any).peakPct} />
                      </div>
                      <div className="text-[10px] text-[#6b7280] mono">
                        In: ${p.entryPrice?.toLocaleString() ?? '—'}{(p as any).currentPrice ? ` → $${(p as any).currentPrice?.toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold mono">${((p as any).currentUSD ?? p.sizeUSD ?? 0).toFixed(2)}</div>
                    <div className={`text-[10px] mono font-semibold ${((p as any).pnlUSD ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((p as any).pnlUSD ?? 0) >= 0 ? '+' : ''}${((p as any).pnlUSD ?? 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#6b7280] mono">SL: -{p.trailStop}%</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                  <Shield className="text-indigo-500" size={24} />
                </div>
                <h3 className="text-sm font-bold">Capital in Yield</h3>
                <p className="text-xs text-[#6b7280] mt-1">No risk signals currently justify exposure.</p>
              </div>
            )}
            {/* Yield position — always shown */}
            {yieldPos && (
              <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400">{yieldPos.protocol} Yield</span>
                  <span className="mono text-xs font-bold text-emerald-400">+{yieldPos.apy}% APY</span>
                </div>
                <div className="text-[10px] text-[#6b7280] mono">{yieldPos.vault} · {yieldPos.chain}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#6b7280]">Deployed</span>
                  <span className="mono text-sm font-bold text-[#e2e8f0]">${yieldPos.amountUSD?.toFixed(2)} USDC</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Last Cycle Card */}
        <Card>
          <SectionLabel>Intelligence Cycle</SectionLabel>
          {status && status.lastCycle && (
            <div className="flex flex-col h-full">
              {/* Header: ago + action badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                  ((status.lastCycle as any).traded?.length ?? 0) > 0
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : status.lastCycle.action === 'yield' || status.lastCycle.action === 'smart_yield'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-[#1e1e2e] text-[#6b7280] border border-[#2e2e3e]'
                }`}>
                  {status.lastCycle.action?.replace('_', ' ')?.toUpperCase() ?? 'HOLD'}
                </span>
                <span className="text-[10px] text-[#6b7280] mono flex items-center gap-1">
                  <Clock size={10} /> {(status.lastCycle as any).ago ?? '—'}
                </span>
                <span className="text-[10px] text-[#6b7280] mono ml-auto">
                  seen {(status.lastCycle as any).seenCount ?? 0} · flagged {(status.lastCycle as any).flagged?.length ?? 0}
                </span>
              </div>

              {/* Reasoning timeline */}
              <div className="flex-1 overflow-y-auto max-h-[420px] scrollbar-hide">
                <ReasoningTimeline
                  cycle={status.lastCycle as any}
                  positions={status.positions ?? []}
                />
              </div>

              {/* Autoresearch footer */}
              <div className="mt-4 pt-3 border-t border-[#1e1e2e] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] mono text-[#6b7280]">Daily · Exp {arDaily.expCount ?? 0} · Sharpe {(arDaily.bestValSharpe ?? 0).toFixed(2)}</span>
                  <span className="text-[10px] mono text-indigo-400">↑ improving</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] mono text-[#6b7280]">Hourly · Exp {arHourly.expCount ?? 0} · Sharpe {(arHourly.bestValSharpe ?? 0).toFixed(2)}</span>
                  <span className="text-[10px] mono text-emerald-400">↑ {(arHourly.bestScore ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Talk to delu Card */}
        <Card className="lg:border-indigo-500/20">
          <SectionLabel>Talk to delu</SectionLabel>
          <div className="flex flex-col h-full">
            <form onSubmit={handleAsk} className="relative mb-4">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about any token... e.g. VIRTUAL"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl py-3 pl-10 pr-12 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Search className="absolute left-3 top-3.5 text-[#6b7280]" size={16} />
              <button 
                type="submit"
                disabled={asking || !query}
                className="absolute right-2 top-2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
              >
                {asking ? <Loader2 size={14} className="text-white spin" /> : <ArrowRight size={14} className="text-white" />}
              </button>
            </form>

            <div className="flex-1 overflow-y-auto max-h-[220px] scrollbar-hide pr-1">
              {steps.length > 0 ? (
                <div className="space-y-1">
                  {steps.map(step => (
                    <StepRow key={step.id} step={step} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <Cpu size={32} className="text-indigo-500 mb-2" />
                  <p className="text-[10px] uppercase tracking-widest font-bold">Inquiry Engine Offline</p>
                </div>
              )}
            </div>

            {verdict && (
              <div className={`mt-4 p-4 rounded-xl border fade-in ${
                verdictType === 'buy' ? 'bg-green-500/5 border-green-500/20' :
                verdictType === 'pass' ? 'bg-red-500/5 border-red-500/20' :
                'bg-yellow-500/5 border-yellow-500/20'
              }`}>
                <div className={`text-lg font-mono font-bold mb-1 flex items-center gap-2 ${
                  verdictType === 'buy' ? 'text-green-500' :
                  verdictType === 'pass' ? 'text-red-500' :
                  'text-yellow-500'
                }`}>
                  <ChevronRight size={20} strokeWidth={3} />
                  {verdictType?.toUpperCase()}
                </div>
                <p className="text-xs text-[#e2e8f0] leading-relaxed">
                  {verdict}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Reasoning Traces */}
      {/* Cycle History Feed */}
      {((status as any)?.cycleHistory?.length ?? 0) > 0 && (
        <CycleHistoryFeed cycles={(status as any).cycleHistory} />
      )}

      {/* Trade History */}
      <Card>
        <SectionLabel>Trade History</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-[#1e1e2e]">
                <th className="pb-3 text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">Token</th>
                <th className="pb-3 text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">Entry</th>
                <th className="pb-3 text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">Exit</th>
                <th className="pb-3 text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">P&L</th>
                <th className="pb-3 text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">Regime</th>
                <th className="pb-3 text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">Tx</th>
                <th className="pb-3 text-[10px] text-[#6b7280] font-bold uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {((status as any)?.performance?.recentTrades?.length ?? 0) > 0 ? (
                ((status as any)?.performance?.recentTrades ?? []).map((t: any, i: number) => (
                  <tr key={i} className="border-b border-[#1e1e2e]/50 last:border-0">
                    <td className="py-4 font-bold text-sm">{t.sym ?? '—'}</td>
                    <td className="py-4 mono text-xs">{t.entryPrice != null ? `$${Number(t.entryPrice).toLocaleString()}` : '—'}</td>
                    <td className="py-4 mono text-xs">{t.exitPrice != null ? `$${Number(t.exitPrice).toLocaleString()}` : '—'}</td>
                    <td className="py-4"><PnlChip pct={t.pnlPct} /></td>
                    <td className="py-4"><RegimeBadge regime={t.regime || "BEAR"} /></td>
                    <td className="py-4"><TxLink hash={t.exitTx || t.entryTx} /></td>
                    <td className="py-4 text-right text-[10px] text-[#6b7280] mono">
                      {t.closedAt || t.openedAt ? new Date(t.closedAt || t.openedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#6b7280] italic">
                    No closed trades yet — agent is holding open positions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <footer className="mt-8 flex justify-center opacity-20 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-6 grayscale hover:grayscale-0 transition-all">
            <img src="https://img.venice.ai/logo-white.svg" alt="Venice" className="h-4" />
            <img src="https://www.geckoterminal.com/_next/static/media/gt-logo-white.c7d54972.svg" alt="GeckoTerminal" className="h-3" />
            <div className="text-[10px] font-bold tracking-widest uppercase">Bankr Execution</div>
        </div>
      </footer>
    </main>
  );
}
