import { NextResponse } from 'next/server';
import type { ServerData, ServerStatus } from '@/types';

const SERVERS = [
  'AWS-East', 'Dublin-Core', 'Cork-Edge', 'Tokyo-Main',
  'São-Paulo-1', 'Frankfurt-DB', 'Singapore-Cache', 'Sydney-Relay'
];

function generateRandomMetrics(name: string) {
  // Simulate some realistic variations. Some servers might be naturally hotter
  const baseCpu = name.includes('Core') || name.includes('Main') ? 60 : 30;
  const baseRam = name.includes('DB') || name.includes('Cache') ? 70 : 40;
  
  let cpu = Math.max(0, Math.min(100, baseCpu + (Math.random() * 40 - 20)));
  let ram = Math.max(0, Math.min(100, baseRam + (Math.random() * 30 - 15)));
  
  let status: ServerStatus = 'ONLINE';
  if (cpu > 85 || ram > 90) {
    status = 'OVERLOAD';
  } else if (cpu < 10 && ram < 20) {
    status = 'IDLE';
  }

  return {
    id: name.toLowerCase().replace('-', '_'),
    name,
    pid: Math.floor(Math.random() * 10000) + 1000,
    status,
    cpu: Number(cpu.toFixed(1)),
    ram: Number(ram.toFixed(1)),
  };
}

export async function GET() {
  const metrics = SERVERS.map(generateRandomMetrics);
  
  // Return the current snapshot. The client will accumulate this into history.
  return NextResponse.json(metrics);
}
