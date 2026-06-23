export type ServerStatus = 'ONLINE' | 'OVERLOAD' | 'IDLE';

export interface MetricPoint {
  time: string;
  cpu: number;
  ram: number;
}

export interface ServerData {
  id: string;
  name: string;
  pid: number;
  status: ServerStatus;
  cpu: number;
  ram: number;
  history: MetricPoint[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  server: string;
}
