"use client";

import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, Search, ExternalLink, Cpu, Zap, CheckCircle2, Circle, Loader2, ChevronDown } from 'lucide-react';
import { StreamStep } from '@/lib/types';

const pnlColor = (n?: number) => !n || n === 0 ? 'text-[#6b7280]' : n > 0 ? 'text-green-400' : 'text-red-400';

const shortTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

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
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${isBuy ? 'bg-green-500/10 text-green-400 border-green-500/20' : isYield ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-[#1e1e2e] text-[#6b7280] border-[#2e2e3e]'}`}>
      {isBuy ? 'BUY' : isYield ? 'YIELD' : 'HOLD'}
    </span>
  );
};

const StepRow = ({ step }: { step: StreamStep }) => (
  <div className={`mb-2 ${step.status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
    <div className="flex items-center gap-2">
      {step.status === 'pending' && <Circle size={12} className="text-[#6b7280]" />}
      {step.status === 'running' && <Loader2 size={12} className="text-indigo-500 animate-spin" />}
      {step.status === 'done' && <CheckCircle2 size={12} className="text-green-500" />}
      <span className={`text-xs ${step.status === 'running' ? 'text-indigo-400' : step.status === 'done' ? 'text-white' : 'text-[#6b7280]'}`}>{step.label}</span>
    </div>
    {step.status === 'done' && step.detail && (
      <div className="ml-5 mt-0.5 text-[10px] mono text-[#6b7280] leading-relaxed">{step.detail}</div>
    )}
  </div>
);

function CycleTimeline({ cycle, positions }: { cycle: any; positions: any[] }) {
  if (!cycle) return null;
  const openPos = positions.filter((p: any) => !p.closedAt);
  const steps = [
    {
      id: 'discovery', icon: '📡', label: 'Discovery',
      detail: (() => {
        const entries = cycle.trendingEntries || [];
        if (!entries.length) return 'No trending tokens this cycle';
        const bankr = entries.filter((t: any) => t.rank != null);
        const checkr = entries.filter((t: any) => t.velocity != null || t.attentionDelta != null);
        const lines: string[] = [];
        if (bankr.length) lines.push(`Bankr trending: ${bankr.slice(0, 5).map((t: any) => t.symbol).join(', ')}`);
        if (checkr.length) lines.push(`Checkr attention: ${checkr.slice(0, 4).map((t: any) => `${t.symbol}${t.sustainedMomentum ? ' 🔥' : ''}`).join(', ')}`);
        if (!lines.length) lines.push(`${entries.length} tokens discovered`);
        return lines.join('\n');
      })(),
    },
    {
      id: 'scoring', icon: '📐', label: 'Signal Scoring',
      detail: (() => {
        const entries = cycle.trendingEntries || [];
        const flagged = entries.filter((t: any) => (t.score || 0) >= 0.65);
        if (!entries.length) return 'No candidates';
        if (!flagged.length) return `${entries.length} scored — none cleared threshold`;
        return flagged.map((t: any) => `${t.symbol} score=${t.score?.toFixed(2)}${t.rugVerdict ? ` rug=${t.rugVerdict}` : ''}`).join('\n');
      })(),
    },
    {
      id: 'positions', icon: '📊', label: 'Portfolio Check',
      detail: (() => {
        const pa = cycle.positionUpdates || [];
        if (!pa.length && openPos.length === 0) return 'No open positions';
        if (!pa.length) return openPos.map((p: any) => `${p.sym} ${p.pnlPct != null ? (p.pnlPct >= 0 ? '+' : '') + p.pnlPct.toFixed(1) + '%' : '—'}`).join(' · ');
        return pa.map((p: any) => `${p.sym} ${p.pnlPct != null ? (p.pnlPct >= 0 ? '+' : '') + p.pnlPct.toFixed(1) + '%' : '—'} → ${p.recommendation}`).join('\n');
      })(),
    },
    {
      id: 'venice', icon: '🔒', label: 'Venice Private Reasoning', highlight: true,
      detail: cycle.reasoning || cycle.reason || 'No reasoning logged',
    },
    {
      id: 'action', icon: (cycle.action === 'buy' || cycle.action === 'long') ? '✅' : '⏸', label: 'Decision',
      trade: cycle.action === 'buy' || cycle.action === 'long',
      detail: (() => {
        const action = (cycle.action || 'hold').toUpperCase().replace('_', ' ');
        const asset = cycle.asset && cycle.asset !== 'USDC' ? ` ${cycle.asset}` : '';
        const conf = cycle.confidence > 0 ? ` · ${cycle.confidence}% conf` : '';
        return `${action}${asset}${conf}`;
      })(),
    },
  ];

  return (
    <div className="mt-3">
      {steps.map((step, i) => (
        <div key={step.id} className="relative flex gap-3">
          {i < steps.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#1e1e2e]" />}
          <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${(step as any).trade ? 'bg-green-500/20 border border-green-500/40' : (step as any).highlight ? 'bg-indigo-500/20 border border-indigo-500/40' : 'bg-[#1e1e2e] border border-[#2e2e3e]'}`}>{step.icon}</div>
          <div className="pb-4 min-w-0 flex-1">
            <div className={`text-[11px] font-bold mb-0.5 ${(step as any).trade ? 'text-green-400' : (step as any).highlight ? 'text-indigo-300' : 'text-[#e2e8f0]'}`}>{step.label}</div>
            <div className={`text-[10px] mono leading-relaxed whitespace-pre-line ${(step as any).highlight ? 'text-[#a5b4fc] italic' : 'text-[#6b7280]'}`}>{step.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CycleLog({ cycles, positions }: { cycles: any[]; positions: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  if (!cycles.length) return (
    <Card><Label>Cycle Log</Label><p className="text-xs text-[#6b7280] italic py-8 text-center">No cycles yet</p></Card>
  );
  return (
    <Card>
      <Label>Cycle Log — every 30 min</Label>
      <div className="space-y-0.5 overflow-y-auto max-h-[720px] scrollbar-hide">
        {cycles.map((c: any, i: number) => {
          const isOpen = expanded === i;
          const isTrade = c.action === 'buy' || c.action === 'long';
          return (
            <div key={i} className={`rounded-xl border transition-all ${isOpen ? 'border-indigo-500/20 bg-[#0d0d1a]' : isTrade ? 'border-green-500/10' : 'border-transparent hover:border-[#1e1e2e]'}`}>
              <button onClick={() => setExpanded(isOpen ? null : i)} className="w-full text-left flex items-center gap-2 px-3 py-2">
                <span className="mono text-[9px] text-[#6b7280] w-[82px] shrink-0">{c.ts ? shortTime(c.ts) : '—'}</span>
                <span className="shrink-0"><ActionBadge action={c.action || 'hold'} /></span>
                {c.asset && c.asset !== 'USDC' && <span className="mono text-xs font-bold text-indigo-300 shrink-0">{c.asset}</span>}
                <span className="text-[10px] text-[#6b7280] truncate flex-1 min-w-0">
                  {c.reasoning ? c.reasoning.slice(0, 80) : c.seenCount ? `${c.seenCount} tokens screened` : '—'}
                </span>
                {isTrade && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                <ChevronDown size={11} className={`text-[#6b7280] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-3 pb-4">
                  {c.reasoning && (
                    <div className="mb-2 p-3 bg-[#111118] rounded-lg border border-indigo-500/10">
                      <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">Venice Private Reasoning</div>
                      <p className="text-xs text-[#e2e8f0] leading-relaxed italic">{c.reasoning}</p>
                      {c.confidence > 0 && <span className="mono text-[10px] text-[#6b7280] mt-1 block">confidence: {c.confidence}%</span>}
                    </div>
                  )}
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

export default function Home() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [steps, setSteps] = useState<StreamStep[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verdictType, setVerdictType] = useState<"buy" | "pass" | "watch" | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setStatus(data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || asking) return;
    setAsking(true); setVerdict(null); setVerdictType(null);
    const init: StreamStep[] = [
      { id: 1, label: "Market Intelligence", status: "pending" },
      { id: 2, label: "Technical Analysis", status: "pending" },
      { id: 3, label: "Risk Calibration", status: "pending" },
      { id: 4, label: "Social Sentiment", status: "pending" },
      { id: 5, label: "Autonomous Reasoning", status: "pending" },
    ];
    setSteps(init);
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.step) setSteps(prev => prev.map(s => s.id === data.step ? { ...s, status: data.status, detail: data.detail || s.detail } : s));
            if (data.verdict) { setVerdict(data.verdict); setVerdictType(data.verdictType); }
          }
        }
      }
    } catch {}
    finally { setAsking(false); }
  };

  const wallet    = status?.wallet || {};
  const positions = status?.positions || [];
  const cycles    = status?.cycleHistory || [];
  const ar        = status?.autoresearch || {};
  const arOnchain = ar.onchain  || {};
  const arHourly  = ar.hourly   || {};
  const ar5m      = ar.fiveMin  || {};
  const yieldPos  = status?.yield;
  const openPos   = positions.filter((p: any) => !p.closedAt);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto relative z-10">

      {/* ── Compact Header ── */}
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
          <div className="text-[11px] mono">
            <span className="text-[#6b7280]">Portfolio </span>
            <span className="font-bold">${(wallet.totalUSD || 0).toFixed(2)}</span>
          </div>
          <div className="w-px h-4 bg-[#1e1e2e]" />
          <div className="text-[11px] mono">
            <span className="text-[#6b7280]">Liquid </span>
            <span className="font-bold text-emerald-400">${(wallet.liquidUSDC || 0).toFixed(2)}</span>
          </div>
          <div className="w-px h-4 bg-[#1e1e2e]" />
          <div className="text-[11px] mono">
            <span className="text-[#6b7280]">P&amp;L </span>
            <span className={`font-bold ${pnlColor(wallet.unrealPnlUSD)}`}>
              {(wallet.unrealPnlUSD || 0) >= 0 ? '+' : ''}${(wallet.unrealPnlUSD || 0).toFixed(2)}
              <span className="opacity-60 ml-1">({(wallet.unrealPnlPct || 0) >= 0 ? '+' : ''}{(wallet.unrealPnlPct || 0).toFixed(1)}%)</span>
            </span>
          </div>
          <div className="w-px h-4 bg-[#1e1e2e]" />
          <div className="text-[11px] mono">
            <span className="text-[#6b7280]">Next cycle </span>
            <span className="font-bold text-indigo-400">{status?.nextCycle || '—'}</span>
          </div>
        </div>
      </header>

      {/* ── Stack pills ── */}
      <div className="flex flex-wrap gap-2 mb-5">
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
        {/* Checkr x402 one-liner */}
        <div className="bg-[#0d0a00] border border-orange-500/20 px-3 py-1 rounded-full flex items-center gap-2">
          <span className="text-orange-400 text-xs">⚡</span>
          <span className="text-[10px] text-orange-300">Pays Checkr onchain via x402 every cycle — no API key, no human approval</span>
        </div>
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── LEFT: 2/5 width ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Positions */}
          <Card>
            <Label>Active Positions ({openPos.length})</Label>
            <div className="space-y-3">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-14 bg-[#1a1a24] rounded-xl animate-pulse" />)
              ) : openPos.length > 0 ? openPos.map((p: any, i: number) => {
                const pnlPct = p.pnlPct ?? 0;
                const pnlUSD = p.pnlUSD ?? 0;
                const curUSD = p.currentUSD ?? p.sizeUSD ?? 0;
                const trailActive = (p.peakPct ?? 0) >= 1 || p.trailActivated;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#1a1a24]/60 border border-[#1e1e2e] rounded-xl hover:border-indigo-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] flex items-center justify-center mono text-xs font-bold text-indigo-400">
                        {(p.sym || '?')[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{p.sym}</span>
                          <span className={`mono text-xs font-bold ${pnlColor(pnlPct)}`}>
                            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-[10px] text-[#6b7280] mono">
                          {p.entryPrice ? `$${Number(p.entryPrice).toPrecision(4)}` : '—'}
                          {p.currentPrice ? ` → $${Number(p.currentPrice).toPrecision(4)}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold mono">${curUSD.toFixed(2)}</div>
                      <div className={`text-[10px] mono font-semibold ${pnlColor(pnlUSD)}`}>
                        {pnlUSD >= 0 ? '+' : ''}${Math.abs(pnlUSD).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#6b7280] mono">
                        {trailActive ? `Trail: -${p.trailStop ?? 5}% ✓` : `HardSL -${p.hardSlPct ?? 3}%`}
                      </div>
                    </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-400">{yieldPos.protocol} Yield</span>
                    <span className="mono text-xs font-bold text-emerald-400">+{yieldPos.apy}% APY</span>
                  </div>
                  <div className="text-[10px] text-[#6b7280] mono">{yieldPos.vault}</div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[#6b7280]">Deployed</span>
                    <span className="mono text-sm font-bold">${yieldPos.amountUSD?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Autoresearch */}
          <Card>
            <Label>Self-Improving Brain</Label>
            <p className="text-[10px] text-[#6b7280] mb-4 leading-relaxed">
              3 parallel loops run 24/7 via Bankr LLM. Each loop proposes scoring changes, backtests on real Base token data, and auto-promotes improvements to the live agent — no human intervention.
            </p>
            <div className="space-y-3">
              {[
                { name: 'Onchain (Base)', data: arOnchain, color: 'text-indigo-400' },
                { name: 'Hourly (1h bars)', data: arHourly, color: 'text-emerald-400' },
                { name: '5-minute', data: ar5m, color: 'text-orange-400' },
              ].map(({ name, data, color }) => (
                <div key={name} className="p-3 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold ${color}`}>{name}</span>
                    <span className="mono text-[10px] text-[#6b7280]">{(data.expCount || 0).toLocaleString()} exp</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[9px] text-[#6b7280] mb-0.5">Best Sharpe</div>
                      <div className="mono text-sm font-bold text-white">{(data.bestValSharpe || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#6b7280] mb-0.5">Score</div>
                      <div className="mono text-sm font-bold text-white">{(data.bestScore || 0).toFixed(2)}</div>
                    </div>
                    {(data.expCount || 0) > 0 && (
                      <div className={`ml-auto text-[10px] font-bold ${color}`}>↑ improving</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Talk to delu */}
          <Card>
            <Label>Ask delu</Label>
            <form onSubmit={handleAsk} className="relative mb-3">
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Any token... e.g. VIRTUAL"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Search className="absolute left-3 top-3 text-[#6b7280]" size={14} />
              <button type="submit" disabled={asking || !query}
                className="absolute right-2 top-1.5 w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 transition-all">
                {asking ? <Loader2 size={12} className="text-white animate-spin" /> : <ArrowRight size={12} className="text-white" />}
              </button>
            </form>
            <div className="space-y-1 min-h-[60px]">
              {steps.length > 0 ? steps.map(s => <StepRow key={s.id} step={s} />) : (
                <div className="flex items-center justify-center py-4 opacity-30">
                  <Cpu size={24} className="text-indigo-500" />
                </div>
              )}
            </div>
            {verdict && (
              <div className={`mt-3 p-3 rounded-xl border ${verdictType === 'buy' ? 'bg-green-500/5 border-green-500/20' : verdictType === 'pass' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                <div className={`text-sm font-mono font-bold mb-1 ${verdictType === 'buy' ? 'text-green-500' : verdictType === 'pass' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {verdictType?.toUpperCase()}
                </div>
                <p className="text-xs text-[#e2e8f0] leading-relaxed">{verdict}</p>
              </div>
            )}
          </Card>
        </div>

        {/* ── RIGHT: 3/5 width — Merged Cycle Log ── */}
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
