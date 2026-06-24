import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '1mo';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Calculate period1 based on range
    const now = new Date();
    let period1 = new Date();
    let interval: '1m' | '5m' | '15m' | '1d' | '1wk' | '1mo' = '1d';

    switch (range) {
      case '1d':
        period1.setDate(now.getDate() - 1);
        interval = '5m';
        break;
      case '5d':
        period1.setDate(now.getDate() - 5);
        interval = '15m';
        break;
      case '1mo':
        period1.setMonth(now.getMonth() - 1);
        interval = '1d';
        break;
      case '6mo':
        period1.setMonth(now.getMonth() - 6);
        interval = '1d';
        break;
      case '1y':
        period1.setFullYear(now.getFullYear() - 1);
        interval = '1wk';
        break;
      case '5y':
        period1.setFullYear(now.getFullYear() - 5);
        interval = '1mo';
        break;
      default:
        period1.setMonth(now.getMonth() - 1);
        interval = '1d';
    }

    const result = await yahooFinance.chart(symbol, {
      period1,
      interval,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching history for', symbol, error);
    return NextResponse.json({ error: 'Failed to fetch history data' }, { status: 500 });
  }
}
