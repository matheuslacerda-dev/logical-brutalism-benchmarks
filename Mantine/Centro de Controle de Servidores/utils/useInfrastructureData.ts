import { useState, useEffect, useCallback, useRef } from 'react';

export type ServerStatus = 'ONLINE' | 'OVERLOAD' | 'IDLE';

export interface ServerMetrics {
  id: string;
  name: string;
  pid: number;
  status: ServerStatus;
  cpu: number; // current CPU 0-100
  ram: number; // current RAM 0-100
  cpuHistory: number[]; // Last 20 values for sparkline
  ramHistory: number[]; // Last 20 values for sparkline
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

const SERVER_NAMES = [
  'AWS-East-1', 'Dublin-Core', 'Cork-Edge-1', 'Tokyo-Relay', 
  'SA-East-DB', 'London-Cache', 'Frankfurt-K8s', 'Singapore-CDN'
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInitialServers(): ServerMetrics[] {
  return SERVER_NAMES.map((name, index) => {
    const cpuHistory = Array.from({ length: 20 }, () => getRandomInt(10, 50));
    const ramHistory = Array.from({ length: 20 }, () => getRandomInt(20, 60));
    return {
      id: `srv-${index}`,
      name,
      pid: getRandomInt(1000, 9999),
      status: 'ONLINE',
      cpu: cpuHistory[cpuHistory.length - 1],
      ram: ramHistory[ramHistory.length - 1],
      cpuHistory,
      ramHistory
    };
  });
}

export function useInfrastructureData() {
  const [servers, setServers] = useState<ServerMetrics[]>(generateInitialServers());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  
  const logIdCounter = useRef(0);

  // Simulation: Server Metrics (every 3s)
  useEffect(() => {
    const interval = setInterval(() => {
      performance.mark('metrics-update-start');
      
      setServers(prev => prev.map(server => {
        const newCpu = Math.max(0, Math.min(100, server.cpu + getRandomInt(-15, 15)));
        const newRam = Math.max(0, Math.min(100, server.ram + getRandomInt(-10, 10)));
        let status: ServerStatus = 'ONLINE';
        if (newCpu > 85 || newRam > 85) status = 'OVERLOAD';
        else if (newCpu < 10 && newRam < 20) status = 'IDLE';

        return {
          ...server,
          cpu: newCpu,
          ram: newRam,
          status,
          cpuHistory: [...server.cpuHistory.slice(1), newCpu],
          ramHistory: [...server.ramHistory.slice(1), newRam]
        };
      }));
      setLastSync(new Date());

      performance.mark('metrics-update-end');
      performance.measure('Metrics Update', 'metrics-update-start', 'metrics-update-end');
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulation: Logs (every 2s)
  useEffect(() => {
    const interval = setInterval(() => {
      performance.mark('log-update-start');
      
      const server = SERVER_NAMES[getRandomInt(0, SERVER_NAMES.length - 1)];
      const events = [
        { level: 'INFO' as const, msg: `Connection pool reset success` },
        { level: 'WARN' as const, msg: `High memory allocation` },
        { level: 'ERROR' as const, msg: `Health check failed` },
        { level: 'SUCCESS' as const, msg: `Deployment rolling update complete` },
        { level: 'INFO' as const, msg: `Garbage collection executed` }
      ];
      
      const evt = events[getRandomInt(0, events.length - 1)];
      const newLog: LogEntry = {
        id: `log-${logIdCounter.current++}`,
        timestamp: new Date(),
        level: evt.level,
        message: `${evt.level}: ${evt.msg} on ${server}`
      };

      setLogs(prev => {
        const updated = [...prev, newLog];
        // Keep only last 20 logs
        return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
      });

      performance.mark('log-update-end');
      performance.measure('Log Update', 'log-update-start', 'log-update-end');
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate mock 24h detailed chart data for a given server
  const getDetailedDataForServer = useCallback((serverId: string) => {
    // Return 24 data points representing the last 24 hours
    const now = new Date();
    return Array.from({ length: 24 }).map((_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: `${time.getHours()}:00`,
        cpu: getRandomInt(10, 95),
        ram: getRandomInt(20, 90),
      };
    });
  }, []);

  return {
    servers,
    logs,
    lastSync,
    getDetailedDataForServer
  };
}
