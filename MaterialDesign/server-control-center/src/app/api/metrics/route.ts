import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface ServerMetrics {
  id: string;
  name: string;
  pid: number;
  status: 'ONLINE' | 'OVERLOAD' | 'IDLE';
  cpu: number;
  ram: number;
  history: { time: string; cpu: number; ram: number }[];
}

const SERVER_NAMES = [
  'AWS-East',
  'Dublin-Core',
  'Cork-Edge',
  'Tokyo-Relay',
  'SP-Central',
  'Frankfurt-1',
  'Sydney-Node',
  'London-DB',
];

// In-memory state for simulation purposes
let serversState: ServerMetrics[] = [];

function initializeServers() {
  const now = new Date();
  serversState = SERVER_NAMES.map((name, index) => {
    const history = [];
    // Pre-fill last 24 points (for 24 hours in DetailsPanel, or 24 ticks for sparkline)
    for (let i = 24; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 3000);
      history.push({
        time: t.toISOString(),
        cpu: Math.floor(Math.random() * 40) + 10,
        ram: Math.floor(Math.random() * 50) + 20,
      });
    }

    return {
      id: `srv-${index}`,
      name,
      pid: 1024 + Math.floor(Math.random() * 8000),
      status: 'ONLINE',
      cpu: history[history.length - 1].cpu,
      ram: history[history.length - 1].ram,
      history,
    };
  });
}

function updateServers() {
  const now = new Date();
  serversState = serversState.map((server) => {
    // Random walk for CPU and RAM
    let nextCpu = server.cpu + (Math.random() * 20 - 10);
    let nextRam = server.ram + (Math.random() * 10 - 5);

    // Occasional spikes
    if (Math.random() > 0.9) nextCpu += 40;
    if (Math.random() > 0.95) nextRam += 30;

    nextCpu = Math.max(0, Math.min(100, nextCpu));
    nextRam = Math.max(0, Math.min(100, nextRam));

    let status: 'ONLINE' | 'OVERLOAD' | 'IDLE' = 'ONLINE';
    if (nextCpu > 85 || nextRam > 90) status = 'OVERLOAD';
    else if (nextCpu < 5 && nextRam < 20) status = 'IDLE';

    const newHistory = [...server.history.slice(1), {
      time: now.toISOString(),
      cpu: Math.floor(nextCpu),
      ram: Math.floor(nextRam),
    }];

    return {
      ...server,
      status,
      cpu: Math.floor(nextCpu),
      ram: Math.floor(nextRam),
      history: newHistory,
    };
  });
}

export async function GET() {
  if (serversState.length === 0) {
    initializeServers();
  } else {
    updateServers();
  }

  return NextResponse.json(serversState);
}
