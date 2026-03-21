export interface Position {
  sym: string;
  entryPrice: number;
  pnlPct?: number;
  sizeUSD: number;
  trailStop: number;
  openedAt: string;
  entryTx?: string;
}

export interface Trade {
  sym: string;
  entryPrice: number;
  exitPrice?: number;
  pnlPct?: number;
  won?: boolean;
  entryTx?: string;
  exitTx?: string;
  openedAt: string;
  closedAt?: string;
  reason?: string;
  regime?: string;
}

export interface AgentStatus {
  regime: "BULL_HOT" | "BULL_COOL" | "RANGE_TIGHT" | "RANGE_WIDE" | "BEAR";
  btcPrice: number;
  pctFrom200: string;
  breadth: string;
  nextCycle: string;
  positions: Position[];
  lastCycle: {
    screened: number;
    flagged: string[];
    traded: string[];
    action: string;
    reason: string;
    ts: string;
  };
  autoresearch: {
    expCount: number;
    bestValSharpe: number;
    bestScore: number;
    spend: number;
  };
  recentTrades: Trade[];
}

export interface StreamStep {
  id: number;
  label: string;
  status: "pending" | "running" | "done" | "skip";
  detail?: string;
}
