'use client';
import { Profiler, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { benchmarkStore } from '@/utils/benchmarkStore';

const onRender = (id: string, phase: string, actualDuration: number) => {
  if (phase === 'mount' && id === 'AppRoot') {
    benchmarkStore.update({ dashboard_mount_ms: Math.round(actualDuration) });
  }
};

export function BenchmarkedApp({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    performance.mark('dashboard-mount-start');
    return () => {
      performance.mark('dashboard-mount-end');
      try {
        performance.measure('dashboard_mount', 'dashboard-mount-start', 'dashboard-mount-end');
      } catch(e) {}
    };
  }, []);

  return (
    <SWRConfig value={{}}>
      <Profiler id="AppRoot" onRender={onRender}>
        {children}
      </Profiler>
    </SWRConfig>
  );
}
