import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Permite buscar histórico sem cache de CDN para garantir dados atualizados do pregão
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '1mo'; 

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    const period1 = new Date();
    if (range === '1d') period1.setDate(period1.getDate() - 1);
    else if (range === '5d') period1.setDate(period1.getDate() - 5);
    else if (range === '1mo') period1.setMonth(period1.getMonth() - 1);
    else if (range === '3mo') period1.setMonth(period1.getMonth() - 3);
    else if (range === '1y') period1.setFullYear(period1.getFullYear() - 1);
    else period1.setMonth(period1.getMonth() - 1);

    const interval = range === '1d' ? '5m' : '1d';
    const chart = await yahooFinance.chart(symbol, { period1, interval: interval as any });
    
    return NextResponse.json(chart);
  } catch (error: any) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch historical data' }, { status: 500 });
  }
}
