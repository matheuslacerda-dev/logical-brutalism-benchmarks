import InventoryBoard from '@/components/InventoryBoard';
import BenchmarkAnalyzer from '@/components/BenchmarkAnalyzer';

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <InventoryBoard />
      <BenchmarkAnalyzer />
    </main>
  );
}
