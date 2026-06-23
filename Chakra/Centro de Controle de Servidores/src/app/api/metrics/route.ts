import { NextResponse } from 'next/server';

const SERVERS = [
  { id: 'aws-east', name: 'AWS-East', pid: 1024 },
  { id: 'dublin-core', name: 'Dublin-Core', pid: 2048 },
  { id: 'cork-edge', name: 'Cork-Edge', pid: 4096 },
  { id: 'tokyo-1', name: 'Tokyo-1', pid: 8192 },
  { id: 'sa-east', name: 'SA-East', pid: 16384 },
  { id: 'fra-core', name: 'Fra-Core', pid: 32768 },
  { id: 'syd-edge', name: 'Syd-Edge', pid: 65536 },
  { id: 'sg-core', name: 'SG-Core', pid: 131072 },
];

export async function GET() {
  const data = SERVERS.map(s => {
    const cpu = Math.floor(Math.random() * 100);
    const ram = Math.floor(Math.random() * 100);
    let status = 'ONLINE';
    if (cpu > 90 || ram > 90) status = 'OVERLOAD';
    else if (cpu < 10 && ram < 10) status = 'IDLE';

    return { ...s, cpu, ram, status };
  });

  return NextResponse.json(data);
}
