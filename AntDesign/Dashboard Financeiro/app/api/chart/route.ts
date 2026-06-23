import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const period1 = searchParams.get('period1') || '2020-01-01'; // Default start date if not provided
  const interval = searchParams.get('interval') || '1d';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const queryOptions: any = { period1 };
    if (interval) queryOptions.interval = interval;
    const result = await yahooFinance.chart(symbol, queryOptions);
    return NextResponse.json(result.quotes || []);
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
}
