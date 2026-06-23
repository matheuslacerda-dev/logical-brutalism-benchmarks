export interface ServerMetric {
  id: string;
  name: string;
  pid: number;
  cpu: number;
  ram: number;
  status: 'ONLINE' | 'OVERLOAD' | 'IDLE';
}

export interface MetricHistory {
  time: string;
  cpu: number;
  ram: number;
}

export interface ServerState extends ServerMetric {
  history: MetricHistory[];
}
